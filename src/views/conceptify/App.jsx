// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, List, ListItem, ListItemIcon, ListItemText, IconButton, Alert } from '@mui/material';
import LegendItem from './components/LegendItem';
import VlanPanel from './components/VlanPanel';
import BoardView from './components/BoardView';
import FooterActions from './components/FooterActions';
import { useSnackbar } from 'notistack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Legend definitions
const legendItems = [
    { id: 'windowsServer', name: 'Windows Server', icon: '🪟' },
    { id: 'windows10', name: 'Windows 10', icon: '💻' },
    { id: 'linuxServer', name: 'Linux Server', icon: '🐧' },
    { id: 'vmPack', name: 'VM Pack', icon: '📁' },
];

// Roles per device type
const roles = {
    windowsServer: ['ADDS', 'DNS', 'DHCP', 'IIS'],
    linuxServer: ['Web Server', 'Database', 'File Server']
};

const GRID_SIZE = 50;

// initial VLAN list
const initialVlans = [
    { id: 10, name: 'VLAN 10', color: '#3B82F6' },
    { id: 20, name: 'VLAN 20', color: '#F59E0B' },
    { id: 30, name: 'VLAN 30', color: '#EF4444' },
    { id: 40, name: 'VLAN 40', color: '#10B981' },
];

export default function App() {
    // board state
    const [whiteboardItems, setWhiteboardItems] = useState([]);
    const [occupiedCells, setOccupiedCells] = useState({});

    // VLAN state
    const [vlans, setVlans] = useState(initialVlans);
    const [newVlanId, setNewVlanId] = useState('');
    const [newVlanName, setNewVlanName] = useState('');
    const [newVlanColor, setNewVlanColor] = useState('#ffffff');

    // save/snackbar
    const { enqueueSnackbar } = useSnackbar();
    const expirationTimeout = useRef(null);

    // ID counters for legend items
    const itemCounters = useRef({});

    // edit mode
    const [isEditable, setIsEditable] = useState(true);

    // --- Validation & Deploy Modal State ---
    const [deployModalOpen, setDeployModalOpen] = useState(false);
    const [validationLoading, setValidationLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [validationPassed, setValidationPassed] = useState(false);
    const [machineList, setMachineList] = useState([]);
    const [deploying, setDeploying] = useState(false);
    const [expandedInfoIdx, setExpandedInfoIdx] = useState(null);
    // ---

    // load saved state (10-min TTL)
    useEffect(() => {
        const raw = localStorage.getItem('conceptify-state');
        if (!raw) return;
        const { timestamp, whiteboardItems: savedItems, vlans: savedVlans } = JSON.parse(raw);
        if (Date.now() - timestamp > 10 * 60 * 1000) {
            localStorage.removeItem('conceptify-state');
            return;
        }
        setWhiteboardItems(savedItems);
        setVlans(savedVlans);

        // rebuild occupiedCells
        const occ = {};
        savedItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
        setOccupiedCells(occ);

        // rebuild itemCounters
        const cnts = {};
        savedItems.forEach(({ id }) => {
            const [base, num] = id.split('-');
            const n = parseInt(num, 10);
            if (!isNaN(n)) cnts[base] = Math.max(cnts[base] || 0, n);
        });
        itemCounters.current = cnts;
    }, []);

    // helpers
    const snapToGrid = (x, y) => [
        Math.round(x / GRID_SIZE) * GRID_SIZE,
        Math.round(y / GRID_SIZE) * GRID_SIZE
    ];
    const getCellKey = (x, y) => `${x},${y}`;
    const isOccupied = (x, y, id) => {
        const occ = occupiedCells[getCellKey(x, y)];
        return occ && occ !== id;
    };

    // drop handler
    const handleDrop = (item, left, top, inBounds) => {
        if (!inBounds) return;
        const [lx, ty] = snapToGrid(left, top);
        const key = getCellKey(lx, ty);
        if (isOccupied(lx, ty, item.id)) return;

        if (item.id.includes('-')) {
            // move existing
            setWhiteboardItems(ws =>
                ws.map(i => i.id === item.id ? { ...i, left: lx, top: ty } : i)
            );
            setOccupiedCells(o => {
                const nxt = { ...o };
                delete nxt[getCellKey(item.left, item.top)];
                nxt[key] = item.id;
                return nxt;
            });
        } else {
            // new from legend
            const base = item.id;
            const cnt = (itemCounters.current[base] || 0) + 1;
            itemCounters.current[base] = cnt;
            const newId = `${base}-${cnt}`;
            const newItem = {
                ...item,
                id: newId,
                left: lx,
                top: ty,
                roles: [],
                vlans: [],
                ...(base === 'vmPack'
                    ? { group: { count: '', os: 'Debian', vlans: [] } }
                    : {}
                )
            };
            setWhiteboardItems(ws => [...ws, newItem]);
            setOccupiedCells(o => ({ ...o, [key]: newId }));
        }
    };

    // delete handler
    const handleDeleteItem = id => {
        const it = whiteboardItems.find(i => i.id === id);
        if (it) {
            setOccupiedCells(o => {
                const nxt = { ...o };
                delete nxt[getCellKey(it.left, it.top)];
                return nxt;
            });
        }
        setWhiteboardItems(ws => ws.filter(i => i.id !== id));
    };

    // VLAN handlers
    const handleAddVlan = () => {
        const idNum = parseInt(newVlanId, 10);
        if (!isNaN(idNum)) {
            setVlans(v => [...v, { id: idNum, name: newVlanName.trim(), color: newVlanColor }]);
            setNewVlanId(''); setNewVlanName(''); setNewVlanColor('#ffffff');
        }
    };
    const handleVlanColorChange = (id, color) => {
        setVlans(v => v.map(x => x.id === id ? { ...x, color } : x));
    };

    // save work
    const saveWork = () => {
        const payload = { timestamp: Date.now(), whiteboardItems, vlans };
        localStorage.setItem('conceptify-state', JSON.stringify(payload));
        enqueueSnackbar('Work saved!', {
            variant: 'success',
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
            autoHideDuration: 2000,
        });
        clearTimeout(expirationTimeout.current);
        expirationTimeout.current = setTimeout(() => {
            localStorage.removeItem('conceptify-state');
        }, 10 * 60 * 1000);
    };

    // clear cache
    const handleClearCache = () => {
        localStorage.removeItem('conceptify-state');
        setWhiteboardItems([]);
        setOccupiedCells({});
        setVlans(initialVlans);
    };

    // generate JSON
    const generateConfigFiles = () => {
        const configs = whiteboardItems.reduce((acc, item) => {
            const type = item.id.split('-')[0];
            if (!acc[type]) acc[type] = [];

            const adv = item.advanced || {};
            const advancedData = {
                perf: adv.perf ?? 'medium',
                mon_agent: adv.monitoring ?? true,
                username: adv.username?.trim() || 'user',
                sshKey: adv.sshKey?.trim() || '',
                ip_mode: adv.ipMode ?? 'dhcp',
                ip_address: adv.ipAddress?.trim() || '',
                subnet_mask: adv.subnetMask || '',
                os_version:
                    adv.osVersion
                    ?? (type === 'windows10' ? 'Windows 10'
                        : type === 'windows11' ? 'Windows 11'
                            : ''),
            };

            const baseEntry = {
                id: item.id,
                roles: item.roles,
                vlans: item.vlans,
                advanced: advancedData,
            };

            if (item.group && type === 'vmPack') {
                const { count, templateType } = item.group;

                if (!acc[templateType]) {

                    acc[templateType] = [];
                }
                for (let i = 1; i <= count; i++) {
                    acc[templateType].push({
                        ...baseEntry,
                        id: `${templateType}-${item.id}-vm${i}`,
                    });
                }
            } else {
                acc[type].push(baseEntry);
            }

            return acc;
        }, {});

        console.log('Generated Config:', JSON.stringify(configs, null, 2));
    };

    const handleAdvancedChange = (itemId, advanced) => {
        setWhiteboardItems(ws =>
            ws.map(i =>
                i.id === itemId
                    ? { ...i, advanced }
                    : i
            )
        );
    };

    // --- Validation Logic (placeholder) ---
    const validateConfig = () => {
        setValidationLoading(true);
        setValidationErrors([]);
        setValidationPassed(false);
        // Simulate async validation
        setTimeout(() => {
            // TODO: Replace with real validation logic
            const errors = [];
            // Count machines by type for incremented names
            const typeCounts = {};
            const machines = whiteboardItems.map(item => {
                const baseType = item.id.split('-')[0];
                typeCounts[baseType] = (typeCounts[baseType] || 0) + 1;
                let displayName = item.name || item.id;
                if (baseType === 'linuxServer') displayName = `Linux Server ${typeCounts[baseType]}`;
                if (baseType === 'windowsServer') displayName = `Windows Server ${typeCounts[baseType]}`;
                if (baseType === 'windows10') displayName = `Windows 10 ${typeCounts[baseType]}`;
                if (baseType === 'vmPack') displayName = `VM Pack ${typeCounts[baseType]}`;
                return {
                    id: item.id,
                    name: displayName,
                    roles: item.roles || [],
                    status: 'pending', // 'pending', 'success', 'error', 'loading'
                    info: '',
                };
            });
            setMachineList(machines);
            if (whiteboardItems.length === 0) {
                errors.push('No machines defined.');
            }
            // Add more validation rules here
            setValidationErrors(errors);
            setValidationPassed(errors.length === 0);
            setValidationLoading(false);
        }, 1000);
    };

    const handleOpenDeployModal = () => {
        setDeployModalOpen(true);
        validateConfig();
    };
    const handleCloseDeployModal = () => {
        setDeployModalOpen(false);
        setValidationErrors([]);
        setValidationPassed(false);
        setMachineList([]);
    };

    // Simulate async deploy for each machine
    const deployMachine = (machine, idx) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate random success/failure
                const isSuccess = Math.random() > 0.2;
                resolve({
                    ...machine,
                    status: isSuccess ? 'success' : 'error',
                    info: isSuccess ? 'Machine created successfully.' : 'Error: Terraform failed.'
                });
            }, 1500 + Math.random() * 1000);
        });
    };

    const handleDeploy = async () => {
        setDeploying(true);
        let newList = [...machineList];
        for (let i = 0; i < newList.length; i++) {
            newList[i].status = 'loading';
            setMachineList([...newList]);
            // TODO: Replace with real API call
            const result = await deployMachine(newList[i], i);
            newList[i] = result;
            setMachineList([...newList]);
        }
        setDeploying(false);
    };

    return (
        <Box className="conceptify-root" sx={{ height: '100vh', overflow: 'hidden', pb: 2 }}>
            {/* Header Bar */}
            <Box display="flex" alignItems="center" sx={{ mb: 1, mt: 1, px: 3, height: 44, background: '#f7fafd', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.close()}
                    sx={{
                        fontWeight: 600,
                        letterSpacing: 1,
                        fontSize: 16,
                        textTransform: 'none',
                        minWidth: 0,
                        padding: '4px 20px',
                        marginBottom: '10px',
                        boxShadow: 'none',
                    }}
                >
                    Return to Dashboard
                </Button>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'absolute', left: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
                    <Box
                        sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            background: 'linear-gradient(90deg, #3B82F6 0%, #9333EA 100%)',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: 24,
                            letterSpacing: 2,
                            boxShadow: '0 2px 8px 0 rgba(59,130,246,0.15)',
                            textShadow: '0 2px 8px rgba(59,130,246,0.25)',
                            fontFamily: 'Montserrat, sans-serif',
                            textAlign: 'center',
                            minWidth: '60%',
                            userSelect: 'none',
                            pointerEvents: 'auto',
                            marginBottom: '10px',
                        }}
                    >
                        Conceptify
                    </Box>
                </Box>
                <Box flexGrow={1} />
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setIsEditable(e => !e)}
                    sx={{
                        minWidth: 120,
                        marginBottom: '10px',
                    }}
                >
                    {isEditable ? 'View Only' : 'Edit Mode'}
                </Button>
            </Box>
            <DndProvider backend={HTML5Backend}>
                <Box className="flex flex-col" sx={{ height: 'calc(100vh - 44px)', overflow: 'hidden', pb: 2 }}>
                    <Box className="flex flex-grow" sx={{ minHeight: 0, height: '100%' }}>
                        {isEditable && (
                            <Paper elevation={3} className="w-64 p-2 overflow-y-auto" sx={{ maxHeight: '100%' }}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                                    Legend
                                </Typography>
                                {legendItems.map(li => (
                                    <LegendItem key={li.id} {...li} />
                                ))}
                                <VlanPanel
                                    vlans={vlans}
                                    newVlanId={newVlanId}
                                    setNewVlanId={setNewVlanId}
                                    newVlanName={newVlanName}
                                    setNewVlanName={setNewVlanName}
                                    newVlanColor={newVlanColor}
                                    setNewVlanColor={setNewVlanColor}
                                    onAddVlan={handleAddVlan}
                                    onColorChange={handleVlanColorChange}
                                />
                            </Paper>
                        )}
                        <Box className="flex flex-col flex-grow" sx={{ minHeight: 0, height: '100%', width: '100%' }}>
                            <BoardView
                                whiteboardItems={whiteboardItems}
                                vlans={vlans}
                                rolesMap={roles}
                                legendItems={legendItems}
                                gridSize={GRID_SIZE}
                                occupiedCells={occupiedCells}
                                onDrop={isEditable ? handleDrop : undefined}
                                onDeleteItem={isEditable ? handleDeleteItem : undefined}
                                onRoleToggle={isEditable ? (id, r) =>
                                    setWhiteboardItems(ws =>
                                        ws.map(i =>
                                            i.id === id
                                                ? {
                                                    ...i, roles: i.roles.includes(r)
                                                        ? i.roles.filter(x => x !== r)
                                                        : [...i.roles, r]
                                                }
                                                : i
                                        )
                                    )
                                    : undefined}
                                onVlanChange={isEditable ? (id, vs) =>
                                    setWhiteboardItems(ws =>
                                        ws.map(i => i.id === id ? { ...i, vlans: vs } : i)
                                    )
                                    : undefined}
                                onGroupChange={isEditable ? (id, grp) =>
                                    setWhiteboardItems(ws =>
                                        ws.map(i => i.id === id ? { ...i, group: grp } : i)
                                    )
                                    : undefined}
                                onAdvancedChange={isEditable ? handleAdvancedChange : undefined}
                                isEditable={isEditable}
                            />
                        </Box>
                    </Box>
                    {isEditable && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ minHeight: 'auto', height: 'auto', py: 1, px: 3 }}>
                            <Button variant="contained" color="primary" onClick={saveWork} sx={{ minWidth: 120, fontSize: 14, py: 1 }}>Save Work</Button>
                            <Button variant="contained" color="secondary" onClick={generateConfigFiles} sx={{ minWidth: 180, fontSize: 14, py: 1 }}>Generate Config Files</Button>
                            <Button variant="contained" color="info" onClick={handleOpenDeployModal} sx={{ minWidth: 180, fontSize: 14, py: 1 }}>Validate & Deploy</Button>
                            <Button variant="outlined" color="error" onClick={handleClearCache} sx={{ minWidth: 120, fontSize: 14, py: 1 }}>Clear Cache</Button>
                        </Box>
                    )}
                </Box>
            </DndProvider>
            {/* Validation & Deploy Modal */}
            <Dialog open={deployModalOpen} onClose={handleCloseDeployModal} maxWidth="sm" fullWidth>
                <DialogTitle>Validate & Deploy</DialogTitle>
                <DialogContent>
                    {validationLoading ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4}>
                            <CircularProgress />
                            <Typography variant="body1" sx={{ mt: 2 }}>Validating configuration...</Typography>
                        </Box>
                    ) : validationErrors.length > 0 ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {validationErrors.map((err, idx) => <div key={idx}>{err}</div>)}
                        </Alert>
                    ) : validationPassed ? (
                        <Alert severity="success" sx={{ mb: 2 }}>Configuration is valid!</Alert>
                    ) : null}
                    <List>
                        {machineList.map((machine, idx) => (
                            <React.Fragment key={machine.id}>
                                <ListItem secondaryAction={
                                    <IconButton edge="end" aria-label="info" onClick={() => setExpandedInfoIdx(expandedInfoIdx === idx ? null : idx)}>
                                        <InfoOutlinedIcon />
                                    </IconButton>
                                }>
                                    <ListItemIcon>
                                        {machine.status === 'loading' ? (
                                            <CircularProgress size={24} />
                                        ) : machine.status === 'success' ? (
                                            <CheckCircleIcon color="success" />
                                        ) : machine.status === 'error' ? (
                                            <CancelIcon color="error" />
                                        ) : (
                                            <RadioButtonUncheckedIcon color="disabled" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={machine.name}
                                        secondary={machine.roles.length > 0 ? (
                                            <span style={{ fontSize: 13, color: '#666' }}>
                                                Roles: {machine.roles.join(', ')}
                                            </span>
                                        ) : null}
                                    />
                                </ListItem>
                                {expandedInfoIdx === idx && (
                                    <Box sx={{ ml: 7, mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2, fontSize: 14 }}>
                                        {machine.status === 'loading' && 'Creating machine...'}
                                        {machine.status === 'success' && machine.info}
                                        {machine.status === 'error' && machine.info}
                                    </Box>
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeployModal} disabled={deploying}>Close</Button>
                    <Button variant="contained" color="success" disabled={!validationPassed || deploying} onClick={handleDeploy}>
                        {deploying ? 'Deploying...' : 'Deploy'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
