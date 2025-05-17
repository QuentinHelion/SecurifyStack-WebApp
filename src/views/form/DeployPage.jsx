import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { Box, ButtonGroup, Button, CircularProgress, LinearProgress } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';
import Form from './Form';
import Cookies from 'js-cookie';

const initialDeploy1State = {
    target_node: '',
    clone: '',
    vm_name: '',
    vm_id: '',
    cores: 2,
    sockets: 1,
    memory: 2048,
    ip: '',
    gw: '',
    disk_size: '8G',
    network_model: 'virtio',
    network_bridge: 'vmbr1',
    network_tag: '',
    nameserver: '8.8.8.8',
    network_config_type: 'dhcp'
};

const initialDeployAnyCountState = {
    base_name: '',
    vm_count: '',
    start_vmid: '',
    start_ip: '',
    gw: '',
    network_bridge: 'vmbr1',
    network_tag: '',
    network_config_type: 'dhcp'
};

const initialDeployAnyNamesState = {
    hostnames: '',
    start_vmid: '',
    start_ip: '',
    gw: '',
    network_bridge: 'vmbr1',
    network_tag: '',
    network_config_type: 'dhcp'
};
const token = Cookies.get('token');

const networkTagMapping = {
    'CORE': 10,
    'MONITORING': 20,
    'USERS': 40,
    'EXTERNAL': 80
};

const DeployPage = () => {
    const [deploy1Data, setDeploy1Data] = useState(initialDeploy1State);
    const [deployAnyCountData, setDeployAnyCountData] = useState(initialDeployAnyCountState);
    const [deployAnyNamesData, setDeployAnyNamesData] = useState(initialDeployAnyNamesState);
    const [currentForm, setCurrentForm] = useState('Deploy-1');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bridges, setBridges] = useState([]);
    const [templates, setTemplates] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_ADDR}/fetch-proxmox-data?token=${token}`);
                setBridges(response.data.bridges);
                setTemplates(response.data.templates);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching Proxmox data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        switch (currentForm) {
            case 'Deploy-1':
                setDeploy1Data({
                    ...deploy1Data,
                    [name]: name === 'vm_id' || name === 'cores' || name === 'sockets' || name === 'memory'
                        ? Number(value) : value
                });
                break;
            case 'Deploy-any-count':
                setDeployAnyCountData({
                    ...deployAnyCountData,
                    [name]: name === 'vm_count' || name === 'start_vmid'
                        ? Number(value) : value
                });
                break;
            case 'Deploy-any-names':
                setDeployAnyNamesData({
                    ...deployAnyNamesData,
                    [name]: name === 'start_vmid'
                        ? Number(value) : name === 'hostnames'
                            ? value.split(',').map(h => h.trim()) : value
                });
                break;
            default:
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        let dataToSend;
        switch (currentForm) {
            case 'Deploy-1':
                dataToSend = {
                    ...deploy1Data,
                    network_tag: networkTagMapping[deploy1Data.network_tag], // Convert label to VLAN ID
                    case: currentForm
                };
                break;
            case 'Deploy-any-count':
                dataToSend = {
                    ...deployAnyCountData,
                    network_tag: networkTagMapping[deployAnyCountData.network_tag], // Convert label to VLAN ID
                    case: currentForm
                };
                break;
            case 'Deploy-any-names':
                dataToSend = {
                    ...deployAnyNamesData,
                    network_tag: networkTagMapping[deployAnyNamesData.network_tag], // Convert label to VLAN ID
                    case: currentForm
                };
                break;
            default:
                break;
        }

        console.log('Form Data as JSON:', dataToSend);

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_ADDR}/run-terraform?token=${token}`, dataToSend);
            console.log('Server response:', response.data);
            enqueueSnackbar('VM creation successful!', { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        } catch (error) {
            console.error('Error sending data to the server:', error);
            enqueueSnackbar('Operation failed. Please try again.', { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'right' } });
        } finally {
            setSubmitting(false);
        }
    };

    const renderFormFields = () => {
        let fields = [];

        switch (currentForm) {
            case 'Deploy-1':
                fields = [
                    { label: 'Template', name: 'clone', type: 'select', options: templates, required: true },
                    { label: 'VM Name', name: 'vm_name', type: 'text', required: true },
                    { label: 'VM ID', name: 'vm_id', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (deploy1Data.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'IP Address', name: 'ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'select', options: bridges, required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'select', options: Object.keys(networkTagMapping), required: true }
                ]);

                if (showAdvanced) {
                    fields = fields.concat([
                        { label: 'Cores', name: 'cores', type: 'number' },
                        { label: 'Sockets', name: 'sockets', type: 'number' },
                        { label: 'Memory', name: 'memory', type: 'number' },
                        { label: 'Disk Size', name: 'disk_size', type: 'text' },
                        { label: 'Network Model', name: 'network_model', type: 'text' },
                        { label: 'DNS', name: 'nameserver', type: 'text' }
                    ]);
                }
                break;

            case 'Deploy-any-count':
                fields = [
                    { label: 'Template', name: 'clone', type: 'select', options: templates, required: true },
                    { label: 'Base Name', name: 'base_name', type: 'text', required: true },
                    { label: 'Count', name: 'vm_count', type: 'number', required: true },
                    { label: 'Start VMID', name: 'start_vmid', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (deployAnyCountData.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'Start IP', name: 'start_ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'select', options: bridges, required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'select', options: Object.keys(networkTagMapping), required: true }
                ]);

                if (showAdvanced) {
                    fields = fields.concat([
                        { label: 'Cores', name: 'cores', type: 'number' },
                        { label: 'Sockets', name: 'sockets', type: 'number' },
                        { label: 'Memory', name: 'memory', type: 'number' },
                        { label: 'Disk Size', name: 'disk_size', type: 'text' },
                        { label: 'Network Model', name: 'network_model', type: 'text' },
                        { label: 'DNS', name: 'nameserver', type: 'text' }
                    ]);
                }
                break;

            case 'Deploy-any-names':
                fields = [
                    { label: 'Template', name: 'clone', type: 'select', options: templates, required: true },
                    { label: 'Hostnames (comma-separated)', name: 'hostnames', type: 'text', required: true },
                    { label: 'Start VMID', name: 'start_vmid', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (deployAnyNamesData.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'Start IP', name: 'start_ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'select', options: bridges, required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'select', options: Object.keys(networkTagMapping), required: true }
                ]);

                if (showAdvanced) {
                    fields = fields.concat([
                        { label: 'Cores', name: 'cores', type: 'number' },
                        { label: 'Sockets', name: 'sockets', type: 'number' },
                        { label: 'Memory', name: 'memory', type: 'number' },
                        { label: 'Disk Size', name: 'disk_size', type: 'text' },
                        { label: 'Network Model', name: 'network_model', type: 'text' },
                        { label: 'DNS', name: 'nameserver', type: 'text' }
                    ]);
                }
                break;

            default:
                break;
        }

        return fields;
    };


    return (
        <Box>
            <ButtonGroup variant="contained" aria-label="outlined primary button group">
                <Button onClick={() => setCurrentForm('Deploy-1')} variant={currentForm === 'Deploy-1' ? 'contained' : 'outlined'}>
                    Deploy-1
                </Button>
                <Button onClick={() => setCurrentForm('Deploy-any-count')} variant={currentForm === 'Deploy-any-count' ? 'contained' : 'outlined'}>
                    Deploy Any Count
                </Button>
                <Button onClick={() => setCurrentForm('Deploy-any-names')} variant={currentForm === 'Deploy-any-names' ? 'contained' : 'outlined'}>
                    Deploy Any Names
                </Button>
            </ButtonGroup>
            <Box mt={2}>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <>
                        {submitting && <LinearProgress />}
                        <Form
                            fields={renderFormFields()}
                            formData={currentForm === 'Deploy-1' ? deploy1Data : currentForm === 'Deploy-any-count' ? deployAnyCountData : deployAnyNamesData}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                        />
                    </>
                )}
                <Box mt={2}>
                    <Button
                        variant="outlined"
                        startIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        Advanced Settings
                    </Button>
                </Box>
            </Box>

        </Box>
    );
};

export default DeployPage;
