import React, { useState } from 'react';
import {
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Box,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';

const ControlPanel = () => {
    const [proxmoxServer, setProxmoxServer] = useState('');
    const [proxmoxNode, setProxmoxNode] = useState('');
    const [proxmoxToken, setProxmoxToken] = useState('');
    const [ldapsServer, setLdapsServer] = useState('');
    const [ldapsPort, setLdapsPort] = useState('636');
    const [ldapsCert, setLdapsCert] = useState('');
    const [ldapsBaseDN, setLdapsBaseDN] = useState('');
    const [ldapsUserOU, setLdapsUserOU] = useState('');
    const [proxmoxTestResult, setProxmoxTestResult] = useState(null);
    const [ldapsTestResult, setLdapsTestResult] = useState(null);
    const [saveResult, setSaveResult] = useState(null);

    const handleProxmoxTest = async () => {
        setProxmoxTestResult(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/test-proxmox`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxmoxServer, proxmoxNode, proxmoxToken }),
            });
            const result = await response.json();
            setProxmoxTestResult(result);
        } catch (error) {
            setProxmoxTestResult({ status: 'error', message: `An error occurred: ${error.message}` });
        }
    };

    const handleLdapsTest = async () => {
        setLdapsTestResult(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/test-ldaps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ldapsServer, ldapsPort, ldapsBaseDN, ldapsCert }),
            });
            const result = await response.json();
            setLdapsTestResult(result);
        } catch (error) {
            setLdapsTestResult({ status: 'error', message: `An error occurred: ${error.message}` });
        }
    };

    const handleSaveConfig = async () => {
        setSaveResult(null);
        const configData = {
            proxmoxServer,
            proxmoxNode,
            proxmoxToken,
            ldapsServer,
            ldapsPort,
            ldapsCert,
            ldapsBaseDN,
            ldapsUserOU,
        };
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/save-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData),
            });
            const result = await response.json();
            setSaveResult(result);
        } catch (error) {
            setSaveResult({ status: 'error', message: `An error occurred: ${error.message}` });
        }
    };

    const canSave = proxmoxTestResult?.status === 'success' && ldapsTestResult?.status === 'success';

    return (
        <PageContainer title="Control Panel" description="Control Panel for backend settings">
            <DashboardCard title="Control Panel">
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 2 }}>Proxmox Configuration</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Proxmox Server IP"
                                value={proxmoxServer}
                                onChange={(e) => setProxmoxServer(e.target.value)}
                                placeholder="X.X.X.X"
                                required
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Proxmox Node"
                                value={proxmoxNode}
                                onChange={(e) => setProxmoxNode(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="PVEAPIToken"
                                value={proxmoxToken}
                                onChange={(e) => setProxmoxToken(e.target.value)}
                                placeholder="<user>@<pam>!<mytokenid>=<myapitoken>"
                                type="password"
                                required
                                autoComplete="new-password"
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={handleProxmoxTest} variant="contained" disabled={!proxmoxServer || !proxmoxToken || !proxmoxNode}>
                                Test Proxmox
                            </Button>
                        </Grid>
                    </Grid>

                    {proxmoxTestResult && (
                        <Box sx={{ mt: 2 }}>
                            <Typography color={proxmoxTestResult.status === 'success' ? 'green' : 'red'}>
                                {proxmoxTestResult.message}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>LDAPS Configuration</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="LDAPS Server"
                                value={ldapsServer}
                                onChange={(e) => setLdapsServer(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="LDAPS Port"
                                value={ldapsPort}
                                onChange={(e) => setLdapsPort(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="LDAPS Certificate"
                                value={ldapsCert}
                                onChange={(e) => setLdapsCert(e.target.value)}
                                placeholder="Paste your certificate here or provide a path"
                                autoComplete="off"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="LDAPS Base DN"
                                value={ldapsBaseDN}
                                onChange={(e) => setLdapsBaseDN(e.target.value)}
                                placeholder="e.g., dc=example,dc=com"
                                required
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="LDAPS User OU"
                                value={ldapsUserOU}
                                onChange={(e) => setLdapsUserOU(e.target.value)}
                                placeholder="e.g., ou=users"
                                autoComplete="off"
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button onClick={handleLdapsTest} variant="contained" disabled={!ldapsServer || !ldapsPort || !ldapsBaseDN || !ldapsCert}>
                                Test LDAPS
                            </Button>
                        </Grid>
                    </Grid>

                    {ldapsTestResult && (
                        <Box sx={{ mt: 2 }}>
                            <Typography color={ldapsTestResult.status === 'success' ? 'green' : 'red'}>
                                {ldapsTestResult.message}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" color="primary" onClick={handleSaveConfig} disabled={!canSave}>
                            Save Configuration
                        </Button>
                    </Box>

                    {saveResult && (
                        <Box sx={{ mt: 2 }}>
                            <Typography color={saveResult.status === 'success' ? 'green' : 'red'}>
                                {saveResult.message}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </DashboardCard>
        </PageContainer>
    );
};

export default ControlPanel; 