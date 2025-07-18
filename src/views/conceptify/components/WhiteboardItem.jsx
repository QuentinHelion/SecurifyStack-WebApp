// src/components/WhiteboardItem.jsx
import React, { useState, useEffect, forwardRef } from 'react';
import { useDrag } from 'react-dnd';
import {
  Paper,
  Popover,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  TextField,
  Box,
  Radio,
  RadioGroup,
} from '@mui/material';
import { VM_OS_OPTIONS, CT_OS_OPTIONS } from '../App';

const Transition = forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const perfOptions = [
  { value: 'low', label: 'Low (1GB RAM, 1 CPU, 20GB Disk)' },
  { value: 'medium', label: 'Medium (2GB RAM, 2 CPU, 40GB Disk)' },
  { value: 'high', label: 'High (4GB RAM, 4 CPU, 80GB Disk)' },
];

export default function WhiteboardItem({
  item,
  roles,
  availableVlans,
  onRoleToggle,
  onVlanChange,
  onGroupChange,
  onAdvancedChange,
  onContextMenu,
  gridSize = 50,
  isEditable = true,
}) {
  // All hooks must be declared before any return!
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'whiteboardItem',
    item: { ...item },
    collect: m => ({ isDragging: !!m.isDragging() }),
    canDrag: isEditable,
  }), [isEditable, item]);

  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);
  const [advOpen, setAdvOpen] = useState(false);

  // Pull advanced settings or defaults
  const adv = item.advanced || {};
  const perf = adv.perf || 'medium';
  const monitoring = adv.monitoring ?? true;
  const username = adv.username || '';
  const sshKey = adv.sshKey || '';
  const ip_mode = adv.ip_mode || 'dhcp';
  const ip_address = adv.ip_address || '';
  const subnet_mask = adv.subnet_mask || '24';

  const [localIp, setLocalIp] = useState(ip_address);
  const [ipError, setIpError] = useState('');

  const linuxOsOptions = adv.type === 'vm' ? VM_OS_OPTIONS : adv.type === 'ct' ? CT_OS_OPTIONS : [];
  const vmPackOsOptions = item.group?.type === 'vm' ? VM_OS_OPTIONS : item.group?.type === 'ct' ? CT_OS_OPTIONS : [];

  useEffect(() => {
    setLocalIp(ip_address);
    setIpError('');
  }, [ip_address, ip_mode]);

  // Handlers (unchanged)
  const handleClick = e => setAnchorEl(e.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const handleAdvOpen = () => { setAnchorEl(null); setAdvOpen(true); };
  const handleAdvClose = () => setAdvOpen(false);
  const handlePerfSelect = value => onAdvancedChange(item.id, { ...adv, perf: value });
  const handleMonitorToggle = e => onAdvancedChange(item.id, { ...adv, monitoring: e.target.checked });
  const handleUsernameChange = e => onAdvancedChange(item.id, { ...adv, username: e.target.value });
  const handleSshKeyChange = e => onAdvancedChange(item.id, { ...adv, sshKey: e.target.value });
  const handleIpModeChange = e => onAdvancedChange(item.id, { ...adv, ip_mode: e.target.value, ip_address: '', subnet_mask: adv.subnet_mask || '24' });
  const handleIpAddressChange = e => {
    const val = e.target.value;
    setLocalIp(val);
    const ipv4 = /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/;
    if (!val) {
      setIpError('IP address is required');
    } else if (!ipv4.test(val)) {
      setIpError('Invalid IPv4 address');
    } else {
      setIpError('');
      onAdvancedChange(item.id, { ...adv, ip_mode: 'static', ip_address: val });
    }
  };
  const handleMaskChange = e => onAdvancedChange(item.id, { ...adv, subnet_mask: e.target.value });

  // View-only: just show the icon and status
  if (!isEditable) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          left: item.left,
          top: item.top,
          width: gridSize,
          height: gridSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 2,
          borderColor: 'primary.main',
          zIndex: 10,
        }}
      >
        <Typography variant="h4" sx={{ position: 'relative', display: 'inline-block' }}>
          {item.icon}
          <span
            title={item.isDeployed ? `Status: ${item.deploymentInfo?.status || 'deployed'} - IP: ${item.deploymentInfo?.ip_address || 'unknown'}` : "Status: Unknown"}
            style={{
              position: 'absolute',
              top: 2,
              right: -2,
              width: 14,
              height: 14,
              background: item.isDeployed ? '#4caf50' : '#bdbdbd', // green for deployed, gray for others
              borderRadius: '50%',
              border: '2px solid white',
              display: 'inline-block',
              zIndex: 1,
            }}
          />
        </Typography>
      </Paper>
    );
  }

  const size = gridSize;
  const baseType = item.id.split('-')[0];
  return (
    <>
      {/* Draggable Icon */}
      <Paper
        ref={drag}
        elevation={3}
        onClick={handleClick}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e); }}
        sx={{
          position: 'absolute',
          left: item.left,
          top: item.top,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 2,
          borderColor: isDragging ? 'transparent' : 'primary.main',
          cursor: 'move',
          opacity: isDragging ? 0.5 : 1,
          zIndex: 10,
        }}
      >
        <Typography variant="h4" sx={{ position: 'relative', display: 'inline-block' }}>
          {item.icon}
          <span
            title={item.isDeployed ? `Status: ${item.deploymentInfo?.status || 'deployed'} - IP: ${item.deploymentInfo?.ip_address || 'unknown'}` : "Status: Unknown"}
            style={{
              position: 'absolute',
              top: 2,
              right: -2,
              width: 14,
              height: 14,
              background: item.isDeployed ? '#4caf50' : '#bdbdbd', // green for deployed, gray for others
              borderRadius: '50%',
              border: '2px solid white',
              display: 'inline-block',
              zIndex: 1,
            }}
          />
        </Typography>
      </Paper>

      {/* Roles & VLAN Popover */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
      >
        <Box sx={{ p: 2, minWidth: 240 }}>
          <Typography variant="h6" gutterBottom>
            {item.name}
          </Typography>

          {baseType === 'vmPack' ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Pack de VMs
              </Typography>
              {/* Nombre de VMs */}
              <TextField
                label="Nombre"
                type="number"
                fullWidth
                size="small"
                margin="dense"
                inputProps={{ min: 1, max: 10 }}
                value={item.group?.count || ''}
                onChange={e => {
                  const count = parseInt(e.target.value, 10) || 1;
                  onGroupChange(item.id, {
                    ...item.group,
                    count: Math.min(Math.max(count, 1), 10)
                  });
                }}
              />
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Type</Typography>
              <RadioGroup row value={item.group?.type || 'vm'} onChange={e => onGroupChange(item.id, { ...item.group, type: e.target.value })}>
                <FormControlLabel value="vm" control={<Radio />} label="VM" />
                <FormControlLabel value="ct" control={<Radio />} label="CT" />
              </RadioGroup>
              {item.group?.type && (
                <FormControl fullWidth size="small" margin="dense">
                  <InputLabel>OS</InputLabel>
                  <Select
                    value={item.group?.os_version || ''}
                    label="OS"
                    onChange={e =>
                      onGroupChange(item.id, {
                        ...item.group,
                        os_version: e.target.value
                      })
                    }
                  >
                    {vmPackOsOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* VLANs partagés */}
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.vlans || []}
                  renderValue={vals => vals.join(', ')}
                  onChange={e => onVlanChange(item.id, e.target.value)}
                >
                  {availableVlans.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={(item.vlans || []).includes(v.id)} />
                      <ListItemText primary={`${v.name} (${v.id})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              {/* OS Version for Windows Server & Linux Server */}
              {/* ─── Windows Server OS Version ──────────────────────────────── */}
              {baseType === 'windowsServer' && (
                <FormControl fullWidth size="small" margin="dense">
                  <InputLabel>OS Version</InputLabel>
                  <Select
                    value={item.advanced?.os_version || ''}
                    label="OS Version"
                    onChange={e =>
                      onAdvancedChange(item.id, {
                        ...item.advanced,
                        os_version: e.target.value
                      })
                    }
                  >
                    <MenuItem value="2019">Windows Server 2019</MenuItem>
                    <MenuItem value="2022">Windows Server 2022</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* ─── Linux Server OS Version ──────────────────────────────── */}
              {baseType === 'linuxServer' && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>Type</Typography>
                  <RadioGroup row value={adv.type || ''} onChange={e => onAdvancedChange(item.id, { ...adv, type: e.target.value })}>
                    <FormControlLabel value="vm" control={<Radio />} label="VM" />
                    <FormControlLabel value="ct" control={<Radio />} label="CT" />
                  </RadioGroup>
                  {adv.type && (
                    <FormControl fullWidth size="small" margin="dense">
                      <InputLabel>OS Version</InputLabel>
                      <Select
                        value={adv.os_version || ''}
                        label="OS Version"
                        onChange={e => onAdvancedChange(item.id, { ...adv, os_version: e.target.value })}
                      >
                        {linuxOsOptions.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </>
              )}

              {/* 2) Roles (ne pas afficher "Roles" pour Win 10/11) */}
              {roles && roles.length > 0 && (
                <>
                  {!(baseType === 'windows10' || baseType === 'windows11') && (
                    <Typography variant="subtitle1">Roles</Typography>
                  )}
                  {roles.map(r => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Checkbox
                          checked={(item.roles || []).includes(r)}
                          onChange={() => onRoleToggle(item.id, r)}
                        />
                      }
                      label={r}
                    />
                  ))}
                </>
              )}

              {/* 3) VLANs */}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                VLANs
              </Typography>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>VLANs</InputLabel>
                <Select
                  multiple
                  value={item.vlans || []}
                  onChange={e => onVlanChange(item.id, e.target.value)}
                  renderValue={vals => vals.join(', ')}
                >
                  {availableVlans.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      <Checkbox checked={item.vlans?.includes(v.id) || false} />
                      <ListItemText primary={`${v.name} (${v.id})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 4) Bouton Advanced… pour Win & Linux */}
              {['windowsServer', 'linuxServer', 'windows10', 'windows11'].includes(baseType) && (
                <Box textAlign="right" sx={{ mt: 2 }}>
                  <Button variant="outlined" size="small" onClick={handleAdvOpen}>
                    Advanced…
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      {/* Advanced Settings Dialog */}
      <Dialog
        open={advOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleAdvClose}
        PaperProps={{ sx: { borderRadius: 2, p: 2 } }}
      >
        <DialogTitle>Advanced Settings</DialogTitle>

        <DialogContent dividers>


          {/* Performance Tier Cards */}
          <Typography gutterBottom sx={{ mt: 2 }}>
            Performance Tier
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {perfOptions.map(opt => (
              <Paper
                key={opt.value}
                elevation={perf === opt.value ? 8 : 2}
                onClick={() => handlePerfSelect(opt.value)}
                sx={{
                  flex: 1,
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: perf === opt.value ? 'primary.main' : 'background.paper',
                  border: perf === opt.value ? '2px solid' : '1px solid grey',
                  borderColor: perf === opt.value ? 'primary.main' : 'grey.300',
                  color: perf === opt.value ? 'common.white' : 'text.primary',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': { transform: 'scale(1.15)', boxShadow: 6 },
                }}
              >
                <Typography variant="subtitle2">{opt.label}</Typography>
              </Paper>
            ))}
          </Box>

          {/* Monitoring Agent */}
          <FormControlLabel
            control={<Switch checked={monitoring} onChange={handleMonitorToggle} />}
            label="Monitoring Agent"
            sx={{ mb: 2 }}
          />

          {/* SSH Username */}
          <TextField
            label="Username"
            fullWidth
            size="small"
            margin="dense"
            value={username}
            onChange={handleUsernameChange}
          />

          {/* SSH Public Key */}
          <TextField
            label="SSH Public Key"
            placeholder="ssh-rsa AAAA…"
            variant="standard"
            fullWidth
            size="small"
            margin="dense"
            multiline
            rows={3}
            value={sshKey}
            onChange={handleSshKeyChange}
            InputProps={{ disableUnderline: true }}
            inputProps={{ style: { padding: '8px' } }}
          />

          {/* IP Configuration */}
          <Typography variant="subtitle1" sx={{ mt: 2 }}>IP Configuration</Typography>
          <RadioGroup row value={ip_mode} onChange={handleIpModeChange} sx={{ mb: 1 }}>
            <FormControlLabel value="dhcp" control={<Radio />} label="DHCP" />
            <FormControlLabel value="static" control={<Radio />} label="Static" />
          </RadioGroup>

          {ip_mode === 'static' && (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={ipError ? 0 : 2}>
                <TextField
                  label="IP Address"
                  placeholder="192.168.1.10"
                  size="small"
                  margin="dense"
                  value={localIp}
                  onChange={handleIpAddressChange}
                  error={!!ipError}
                  helperText={ipError}
                  fullWidth
                />
                <Typography>/</Typography>
                <FormControl size="small" margin="dense" sx={{ flex: 1 }}>
                  <InputLabel>Mask</InputLabel>
                  <Select value={subnet_mask} label="Mask" onChange={handleMaskChange}>
                    {Array.from({ length: 33 }, (_, i) => String(i)).map(m => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {ipError && <Typography color="error" variant="caption">{ipError}</Typography>}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleAdvClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}