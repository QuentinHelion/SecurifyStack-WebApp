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
import Cookies from 'js-cookie';

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

// Utility to strip camelCase keys from advanced before updating
function toSnakeCaseAdvanced(adv) {
    // Only remove camelCase keys, preserve all snake_case keys
    const {
        ipAddress, ipMode, osVersion, subnetMask, // camelCase only
        ...rest
    } = adv;
    // Explicitly preserve os_version and all snake_case fields
    return rest;
}

const VM_OS_OPTIONS = [
    { value: 'debian-12.4.0-amd64-netinst.iso', label: 'Debian 12.4 (VM ISO)' },
    { value: 'debian-12.5.0-amd64-netinst.iso', label: 'Debian 12.5 (VM ISO)' },
    { value: 'noble-server-cloudimg-amd64.img', label: 'Ubuntu 24.04 Cloud (VM Cloud-Init)' },
    { value: 'ubuntu-24.04-desktop-amd64.iso', label: 'Ubuntu 24.04 Desktop (VM ISO)' },
];
const CT_OS_OPTIONS = [
    { value: 'debian-12-standard_12.2-1_amd64.tar.zst', label: 'Debian 12.2 (CT Template)' },
    { value: 'ubuntu-20.04-standard_20.04-1_amd64.tar.gz', label: 'Ubuntu 20.04 (CT Template)' },
    { value: 'ubuntu-24.04-standard_24.04-2_amd64.tar.zst', label: 'Ubuntu 24.04 (CT Template)' },
];

export { VM_OS_OPTIONS, CT_OS_OPTIONS };

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
    const [deploymentMachines, setDeploymentMachines] = useState([]);
    const [hasDeployedMachines, setHasDeployedMachines] = useState(false);
    const [bootButtonLoading, setBootButtonLoading] = useState(false);
    // ---

    // load saved state (10-min TTL) and deployed machines
    useEffect(() => {
        const loadInitialData = async () => {
            // Load saved state from localStorage
            const raw = localStorage.getItem('conceptify-state');
            let savedItems = [];
            let savedVlans = initialVlans;

            if (raw) {
                const { timestamp, whiteboardItems: localItems, vlans: localVlans } = JSON.parse(raw);
                if (Date.now() - timestamp <= 10 * 60 * 1000) {
                    savedItems = localItems;
                    savedVlans = localVlans;
                }
            }

            // Load deployed machines from backend
            try {
                const token = Cookies.get('token');
                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/deployed-machines`, {
                    method: 'GET',
                    headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    const deployedMachines = data.machines || [];

                    // Convert deployed machines to whiteboard items
                    const deployedItems = deployedMachines.map((machine, index) => {
                        // Get icon from legend items
                        const legendItem = legendItems.find(item => item.id === machine.base_type);
                        const icon = legendItem ? legendItem.icon : '❓';

                        return {
                            id: machine.id,
                            name: machine.name,
                            baseType: machine.base_type,
                            icon: icon,
                            left: 100 + (index % 5) * 150, // Arrange deployed machines in a grid
                            top: 100 + Math.floor(index / 5) * 150,
                            roles: [], // Initialize roles as empty array
                            vlans: [], // Initialize vlans as empty array
                            advanced: machine.config?.advanced || {},
                            isDeployed: true,
                            deploymentInfo: {
                                ip_address: machine.ip_address,
                                status: machine.status,
                                deployment_time: machine.deployment_time
                            }
                        };
                    });

                    // Merge saved items with deployed items, giving priority to saved items
                    const allItems = [...savedItems];
                    deployedItems.forEach(deployedItem => {
                        // Only add if not already in saved items
                        if (!allItems.find(item => item.id === deployedItem.id)) {
                            allItems.push(deployedItem);
                        }
                    });

                    setWhiteboardItems(allItems);
                    setVlans(savedVlans);

                    // rebuild occupiedCells
                    const occ = {};
                    allItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
                    setOccupiedCells(occ);

                    // rebuild itemCounters
                    const cnts = {};
                    allItems.forEach(({ id }) => {
                        const [base, num] = id.split('-');
                        const n = parseInt(num, 10);
                        if (!isNaN(n)) cnts[base] = Math.max(cnts[base] || 0, n);
                    });
                    itemCounters.current = cnts;
                } else {
                    // If deployed machines fetch fails, just use saved state
                    setWhiteboardItems(savedItems);
                    setVlans(savedVlans);

                    const occ = {};
                    savedItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
                    setOccupiedCells(occ);

                    const cnts = {};
                    savedItems.forEach(({ id }) => {
                        const [base, num] = id.split('-');
                        const n = parseInt(num, 10);
                        if (!isNaN(n)) cnts[base] = Math.max(cnts[base] || 0, n);
                    });
                    itemCounters.current = cnts;
                }
            } catch (error) {
                console.error('Error loading deployed machines:', error);
                // Fallback to saved state only
                setWhiteboardItems(savedItems);
                setVlans(savedVlans);

                const occ = {};
                savedItems.forEach(i => { occ[`${i.left},${i.top}`] = i.id });
                setOccupiedCells(occ);

                const cnts = {};
                savedItems.forEach(({ id }) => {
                    const [base, num] = id.split('-');
                    const n = parseInt(num, 10);
                    if (!isNaN(n)) cnts[base] = Math.max(cnts[base] || 0, n);
                });
                itemCounters.current = cnts;
            }

            // Check for deployed machines to enable/disable boot button
            await checkDeployedMachines();
        };

        loadInitialData();
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
                advanced: { ip_mode: 'dhcp' },
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
                ip_mode: adv.ip_mode ?? 'dhcp',
                os_version: adv.os_version,
                type: adv.type,
                ...(adv.ip_mode !== 'dhcp' && adv.ip_address ? { ip_address: adv.ip_address } : {}),
                ...(adv.ip_mode !== 'dhcp' && adv.subnet_mask ? { subnet_mask: adv.subnet_mask } : {})
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


    };

    const handleAdvancedChange = (itemId, advanced) => {
        setWhiteboardItems(ws =>
            ws.map(i =>
                i.id === itemId
                    ? { ...i, advanced: { ...i.advanced, ...toSnakeCaseAdvanced(advanced) } }
                    : i
            )
        );
    };

    // --- Real Validation Logic ---
    function isValidIP(ip) {
        // Simple IPv4 validation
        return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    }
    function isValidVMID(vmid) {
        return Number.isInteger(vmid) && vmid > 0 && vmid < 10000;
    }
    function isNonEmptyString(str) {
        return typeof str === 'string' && str.trim().length > 0;
    }
    function isValidRoles(roles, baseType) {
        if (!Array.isArray(roles)) return false;
        if (baseType === 'windowsServer') return roles.every(r => rolesWindowsServer.includes(r));
        if (baseType === 'linuxServer') return roles.every(r => rolesLinuxServer.includes(r));
        return true;
    }
    const rolesWindowsServer = ['ADDS', 'DNS', 'DHCP', 'IIS'];
    const rolesLinuxServer = ['Web Server', 'Database', 'File Server'];
    const osVersionsWindowsServer = ['2016', '2019', '2022'];

    const validateConfig = async () => {
        setValidationLoading(true);
        setValidationErrors([]);
        setValidationPassed(false);
        // --- Real validation ---
        const errors = [];
        const vmidSet = new Set();
        const ipSet = new Set();
        const typeCounts = {};
        const machines = whiteboardItems.map((item, idx) => {
            const baseType = item.id.split('-')[0];
            typeCounts[baseType] = (typeCounts[baseType] || 0) + 1;
            let displayName = item.name || item.id;
            if (baseType === 'linuxServer') displayName = `Linux Server ${typeCounts[baseType]}`;
            if (baseType === 'windowsServer') displayName = `Windows Server ${typeCounts[baseType]}`;
            if (baseType === 'windows10') displayName = `Windows 10 ${typeCounts[baseType]}`;
            if (baseType === 'vmPack') displayName = `VM Pack ${typeCounts[baseType]}`;
            // --- Validation ---
            const adv = item.advanced || {};
            const ipMode = adv.ip_mode || 'dhcp';
            // VMID
            let vmid = adv.vmid || (100 + idx);
            if (!isValidVMID(vmid)) errors.push(`${displayName}: Invalid or missing VMID.`);
            if (vmidSet.has(vmid)) errors.push(`${displayName}: Duplicate VMID (${vmid}).`);
            vmidSet.add(vmid);
            // Name
            if (!isNonEmptyString(displayName)) errors.push(`${displayName}: Name is required.`);
            // IP and Subnet Mask
            if (baseType !== 'vmPack' && ipMode !== 'dhcp') {
                const ip = adv.ip_address || '';
                if (!isValidIP(ip)) errors.push(`${displayName}: Invalid or missing IP address.`);
                if (ipSet.has(ip)) errors.push(`${displayName}: Duplicate IP (${ip}).`);
                ipSet.add(ip);
                // Subnet mask (optional, but if present, could validate format here)
            }
            // OS Version
            if (baseType === 'windowsServer' && !osVersionsWindowsServer.includes(adv.os_version)) {
                errors.push(`${displayName}: Invalid or missing Windows Server OS version.`);
            }
            if (baseType === 'linuxServer') {
                const osLinux = adv.os_version;
                const typeLinux = adv.type;

                if (!typeLinux) {
                    errors.push(`${displayName}: Please select a type (VM or CT).`);
                } else if (typeLinux !== 'vm' && typeLinux !== 'ct') {
                    errors.push(`${displayName}: Type must be either VM or CT.`);
                }

                if (!osLinux) {
                    errors.push(`${displayName}: Please select an OS version.`);
                } else {
                    const validList = typeLinux === 'vm' ? VM_OS_OPTIONS.map(opt => opt.value) : typeLinux === 'ct' ? CT_OS_OPTIONS.map(opt => opt.value) : [];

                    if (!validList.includes(osLinux)) {
                        errors.push(`${displayName}: Invalid OS version selected.`);
                    }
                }
            }
            // Roles
            if (!isValidRoles(item.roles, baseType)) {
                errors.push(`${displayName}: Invalid roles selected.`);
            }
            // VM Pack count
            if (baseType === 'vmPack') {
                const count = item.group?.count;
                if (!Number.isInteger(count) || count < 1 || count > 10) {
                    errors.push(`${displayName}: VM Pack count must be 1-10.`);
                }
                const osPack = item.group?.os_version;
                const typePack = item.group?.type;
                if (!typePack || (typePack !== 'vm' && typePack !== 'ct')) {
                    errors.push(`${displayName}: VM Pack must have a valid type (VM or CT).`);
                }
                if (!osPack) {
                    errors.push(`${displayName}: VM Pack must have a valid OS version.`);
                } else {
                    const validList = typePack === 'vm' ? VM_OS_OPTIONS.map(opt => opt.value) : typePack === 'ct' ? CT_OS_OPTIONS.map(opt => opt.value) : [];
                    if (!validList.includes(osPack)) {
                        errors.push(`${displayName}: VM Pack must have a valid OS version.`);
                    }
                }
            }
            return {
                id: item.id,
                name: displayName,
                roles: item.roles || [],
                status: 'pending',
                info: '',
                advanced: adv,
                group: item.group,
                baseType,
                vlans: item.vlans || [],
            };
        });
        setMachineList(machines);
        if (whiteboardItems.length === 0) {
            errors.push('No machines defined.');
        }
        if (errors.length > 0) {
            setValidationErrors(errors);
            setValidationPassed(false);
            setValidationLoading(false);
            return;
        }
        // --- Backend validation ---
        try {
            const token = Cookies.get('token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/validate-config`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ machines }),
            });
            const data = await res.json();

            if (!data.valid) {
                setValidationErrors(data.errors || ['Backend validation failed.']);
                setValidationPassed(false);
            } else {
                setValidationErrors([]);
                setValidationPassed(true);
            }
        } catch (err) {
            setValidationErrors(['Could not reach backend for validation.']);
            setValidationPassed(false);
        }
        setValidationLoading(false);
    };

    const handleOpenDeployModal = () => {
        setValidationErrors([]);
        setDeployModalOpen(true);
    };
    const handleCloseDeployModal = () => {
        setDeployModalOpen(false);
        setValidationErrors([]);
        setValidationPassed(false);
        setMachineList([]);
    };

    // Real deploy for each machine
    const handleDeploy = async () => {
        setDeploying(true);

        try {
            const token = Cookies.get('token');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Send all machines to the new deployment endpoint
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/deploy-machines`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ machines: machineList }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update machine list with deployment results
                const updatedMachines = machineList.map(machine => {
                    const result = data.results.find(r => r.machine_id === machine.id);
                    if (result) {
                        // Show clean message with IP address if available
                        let cleanMessage = result.message;
                        if (result.ip_address) {
                            cleanMessage = `✅ ${machine.name} deployed successfully!\n🌐 IP Address: ${result.ip_address}\n🔗 SSH: ssh debian@${result.ip_address}`;
                        }

                        return {
                            ...machine,
                            status: result.status,
                            info: cleanMessage,
                            ip_address: result.ip_address
                        };
                    }
                    return {
                        ...machine,
                        status: 'error',
                        info: 'No deployment result received'
                    };
                });

                setMachineList(updatedMachines);

                // Show summary message
                if (data.failed > 0) {
                    enqueueSnackbar(`Deployment completed: ${data.successful} successful, ${data.failed} failed`, {
                        variant: 'warning',
                        anchorOrigin: { vertical: 'top', horizontal: 'right' },
                        autoHideDuration: 5000,
                    });
                } else {
                    enqueueSnackbar(`All ${data.successful} machines deployed successfully!`, {
                        variant: 'success',
                        anchorOrigin: { vertical: 'top', horizontal: 'right' },
                        autoHideDuration: 5000,
                    });
                }
            } else {
                // Handle error response
                enqueueSnackbar(`Deployment failed: ${data.error || 'Unknown error'}`, {
                    variant: 'error',
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                    autoHideDuration: 5000,
                });

                // Mark all machines as error
                const errorMachines = machineList.map(machine => ({
                    ...machine,
                    status: 'error',
                    info: data.error || 'Deployment failed'
                }));
                setMachineList(errorMachines);
            }
        } catch (err) {
            enqueueSnackbar(`Network error during deployment: ${err.message}`, {
                variant: 'error',
                anchorOrigin: { vertical: 'top', horizontal: 'right' },
                autoHideDuration: 5000,
            });

            // Mark all machines as error
            const errorMachines = machineList.map(machine => ({
                ...machine,
                status: 'error',
                info: `Network error: ${err.message}`
            }));
            setMachineList(errorMachines);
        }

        setDeploying(false);
    };

    const handleBootAllMachines = async () => {
        if (!hasDeployedMachines) {
            console.log('Boot button clicked but no deployed machines found');
            enqueueSnackbar('No deployed machines found to boot', { variant: 'warning' });
            return;
        }

        setBootButtonLoading(true);
        console.log('Starting boot all machines operation...');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/boot-all-machines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Boot operation completed:', data);

            // Show success message
            enqueueSnackbar(data.message, {
                variant: data.success_count > 0 ? 'success' : 'warning',
                autoHideDuration: 6000
            });

            // Refresh deployed machines status after boot
            await checkDeployedMachines();

            return data;
        } catch (error) {
            console.error('Error booting machines:', error);
            enqueueSnackbar(`Error booting machines: ${error.message}`, { variant: 'error' });
            throw error;
        } finally {
            setBootButtonLoading(false);
        }
    };

    const checkDeployedMachines = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/check-deployed-machines`, {
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHasDeployedMachines(data.has_machines);
                console.log(`Deployed machines check: ${data.has_machines ? 'Found' : 'No'} machines (${data.machine_count} total)`);
            } else {
                console.error('Failed to check deployed machines');
                setHasDeployedMachines(false);
            }
        } catch (error) {
            console.error('Error checking deployed machines:', error);
            setHasDeployedMachines(false);
        }
    };

    // Add useEffect to trigger validation when modal opens
    useEffect(() => {
        if (deployModalOpen) {
            validateConfig();
        }
    }, [deployModalOpen, whiteboardItems]);

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
                                                    ...i, roles: (i.roles || []).includes(r)
                                                        ? (i.roles || []).filter(x => x !== r)
                                                        : [...(i.roles || []), r]
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
                    {isEditable ? (
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ minHeight: 'auto', height: 'auto', py: 1, px: 3 }}>
                            <Button variant="contained" color="primary" onClick={saveWork} sx={{ minWidth: 120, fontSize: 14, py: 1 }}>Save Work</Button>
                            <Button variant="contained" color="info" onClick={handleOpenDeployModal} sx={{ minWidth: 180, fontSize: 14, py: 1 }}>Validate & Deploy</Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleBootAllMachines}
                                disabled={!hasDeployedMachines || bootButtonLoading}
                                sx={{
                                    minWidth: 160,
                                    fontSize: 14,
                                    py: 1,
                                    opacity: !hasDeployedMachines ? 0.5 : 1
                                }}
                            >
                                {bootButtonLoading ? 'Booting...' : 'Boot All Machines'}
                            </Button>
                            <Button variant="outlined" color="error" onClick={handleClearCache} sx={{ minWidth: 120, fontSize: 14, py: 1 }}>Clear Cache</Button>
                        </Box>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 'auto', height: 'auto', py: 1, px: 3 }}>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleBootAllMachines}
                                disabled={!hasDeployedMachines || bootButtonLoading}
                                sx={{
                                    minWidth: 160,
                                    fontSize: 14,
                                    py: 1,
                                    opacity: !hasDeployedMachines ? 0.5 : 1
                                }}
                            >
                                {bootButtonLoading ? 'Booting...' : 'Boot All Machines'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </DndProvider>
            {/* Validation & Deploy Modal */}
            <Dialog
                key={deployModalOpen ? 'open' : 'closed'}
                open={deployModalOpen}
                maxWidth="sm"
                fullWidth
                aria-labelledby="validate-deploy-title"
            >
                <DialogTitle
                    id="validate-deploy-title"
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 22, pb: 1 }}
                >
                    Validate & Deploy
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {/* Validation Status Banner */}
                    <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                        {validationLoading ? (
                            <Alert severity="info" icon={<CircularProgress size={20} sx={{ mr: 1 }} />} sx={{ mb: 2, fontSize: 16 }}>
                                Validating configuration...
                            </Alert>
                        ) : validationErrors.length > 0 ? (
                            <Alert severity="error" icon={<CancelIcon />} sx={{ mb: 2, fontSize: 16 }}>
                                Validation failed. Please fix the errors below.
                            </Alert>
                        ) : validationPassed ? (
                            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, fontSize: 16 }}>
                                Configuration is valid! Ready to deploy.
                            </Alert>
                        ) : null}
                    </Box>

                    {/* Error List Section */}
                    {validationErrors.length > 0 && (
                        <Box sx={{ px: 3, pb: 2 }}>
                            <Typography variant="subtitle1" color="error" sx={{ mb: 1 }}>
                                {validationErrors.length === 1 ? '1 Error:' : `${validationErrors.length} Errors:`}
                            </Typography>
                            <Paper variant="outlined" sx={{ bgcolor: '#fff8f8', borderColor: '#ffcdd2', p: 2, maxHeight: 180, overflowY: 'auto' }}>
                                <List dense>
                                    {validationErrors.map((err, idx) => (
                                        <ListItem key={idx} disablePadding>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <CancelIcon color="error" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" color="error">{err}</Typography>}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </Box>
                    )}

                    {/* Machines List Section */}
                    <Box sx={{ px: 3, pt: 1, pb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Machines to Deploy ({machineList.length})
                        </Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 220, overflowY: 'auto', borderColor: '#e0e0e0', p: 0 }}>
                            <List dense>
                                {machineList.map((machine, idx) => (
                                    <React.Fragment key={machine.id}>
                                        <ListItem
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    aria-label={`Show info for ${machine.name}`}
                                                    onClick={() => setExpandedInfoIdx(expandedInfoIdx === idx ? null : idx)}
                                                    size="large"
                                                >
                                                    <InfoOutlinedIcon />
                                                </IconButton>
                                            }
                                            sx={{ borderBottom: idx < machineList.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'flex-start' }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                                                {machine.status === 'loading' ? (
                                                    <CircularProgress size={20} thickness={4} />
                                                ) : machine.status === 'success' ? (
                                                    <CheckCircleIcon color="success" />
                                                ) : machine.status === 'error' ? (
                                                    <CancelIcon color="error" />
                                                ) : (
                                                    <RadioButtonUncheckedIcon color="disabled" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="subtitle2">{machine.name}</Typography>}
                                                secondary={
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {(() => {
                                                            const roles = machine.roles && machine.roles.length > 0 ? `Roles: ${machine.roles.join(', ')}` : '';
                                                            const vlanStrs = (machine.vlans && machine.vlans.length > 0)
                                                                ? machine.vlans.map(vlanId => {
                                                                    const vlanObj = vlans.find(v => v.id === vlanId);
                                                                    return vlanObj ? `${vlanObj.name} (${vlanObj.id})` : vlanId;
                                                                })
                                                                : [];
                                                            const vlansText = vlanStrs.length > 0 ? `VLAN${vlanStrs.length > 1 ? 's' : ''}: ${vlanStrs.join(', ')}` : '';
                                                            let os = '';
                                                            if (machine.baseType === 'vmPack') {
                                                                os = machine.group?.os_version ? `OS: ${machine.group.os_version}` : '';
                                                            } else {
                                                                os = machine.advanced?.os_version ? `OS: ${machine.advanced.os_version}` : '';
                                                            }
                                                            return [roles, vlansText, os].filter(Boolean).join(' | ');
                                                        })()}
                                                    </Typography>
                                                }
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
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', gap: 1 }}>
                    <Button onClick={handleCloseDeployModal} disabled={deploying} aria-label="Close validation and deploy modal">Close</Button>
                    <Button
                        variant="contained"
                        color="success"
                        disabled={!validationPassed || deploying}
                        onClick={handleDeploy}
                        aria-label="Deploy machines"
                        sx={{ minWidth: 120 }}
                    >
                        {deploying ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={16} color="inherit" />
                                Deploying...
                            </Box>
                        ) : 'Deploy'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
