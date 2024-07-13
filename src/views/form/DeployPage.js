import React, { useState } from 'react';
import { Box, ButtonGroup, Button } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';
import Form from './Form';

const initialFormState = {
    target_node: '',
    clone: '',
    ssh_key: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAU4VyebtThalH2xj6zYGlm+TzfK2ImeYGieyRJ+XtD2 manager@management',
    vm_name: '',
    vm_id: '',
    cores: 2,
    sockets: 1,
    memory: 2048,
    ip: '',
    gw: '',
    disk_size: '8G',
    network_model: 'virtio',
    network_bridge: '',
    network_tag: '',
    nameserver: '8.8.8.8',
    base_name: '',
    count: '',
    start_vmid: '',
    start_ip: '',
    hostnames: '',
    network_config_type: 'dhcp'  // Added network_config_type with default value 'dhcp'
};

const DeployPage = () => {
    const [formData, setFormData] = useState(initialFormState);
    const [currentForm, setCurrentForm] = useState('Deploy-1');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'vm_id' || name === 'cores' || name === 'sockets' || name === 'memory' || name === 'network_tag'
                ? Number(value) : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSend = { ...formData, case: currentForm };

        console.log('Form Data as JSON:', dataToSend);

        try {
            const response = await axios.post('http://10.0.10.3:5000/run-terraform?token=SUMvglG4dv1J2s1m', dataToSend);
            console.log('Server response:', response.data);
        } catch (error) {
            console.error('Error sending data to the server:', error);
        }
    };

    const renderFormFields = () => {
        let fields = [];

        switch (currentForm) {
            case 'Deploy-1':
                fields = [
                    { label: 'Template', name: 'clone', type: 'text', required: true },
                    { label: 'VM Name', name: 'vm_name', type: 'text', required: true },
                    { label: 'VM ID', name: 'vm_id', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (formData.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'IP Address', name: 'ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'text', required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'number', required: true }
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
                    { label: 'Base Name', name: 'base_name', type: 'text', required: true },
                    { label: 'Count', name: 'count', type: 'number', required: true },
                    { label: 'Start VMID', name: 'start_vmid', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (formData.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'Start IP', name: 'start_ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'text', required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'number', required: true }
                ]);
                break;
            case 'Deploy-any-names':
                fields = [
                    { label: 'Hostnames (comma-separated)', name: 'hostnames', type: 'text', required: true },
                    { label: 'Count', name: 'count', type: 'number', required: true },
                    { label: 'Start VMID', name: 'start_vmid', type: 'number', required: true },
                    { label: 'Network Configuration Type', name: 'network_config_type', type: 'select', required: true, options: ['dhcp', 'static'] }
                ];

                if (formData.network_config_type === 'static') {
                    fields = fields.concat([
                        { label: 'Start IP', name: 'start_ip', type: 'text', required: true },
                        { label: 'Gateway', name: 'gw', type: 'text', required: true }
                    ]);
                }

                fields = fields.concat([
                    { label: 'Network Bridge', name: 'network_bridge', type: 'text', required: true },
                    { label: 'Network Tag', name: 'network_tag', type: 'number', required: true }
                ]);
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
                <Form
                    fields={renderFormFields()}
                    formData={formData}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                />
                {currentForm === 'Deploy-1' && (
                    <Box mt={2}>
                        <Button
                            variant="outlined"
                            startIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            Advanced Settings
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default DeployPage;
