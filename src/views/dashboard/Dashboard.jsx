import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';

// Register the required components
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.2; }
  100% { opacity: 1; }
`;

const BlinkingDot = () => (
    <Box
        component="span"
        sx={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#4caf50',
            marginRight: 1,
            animation: `${blink} 1s linear infinite`,
            verticalAlign: 'middle',
        }}
    />
);

const Dashboard = () => {
    const theme = useTheme();
    const [performanceData, setPerformanceData] = useState([]);
    const [deployedMachines, setDeployedMachines] = useState([]);
    const [loadingDeployed, setLoadingDeployed] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = {
                    token: Cookies.get('token')
                }
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_ADDR}/stats/proxmox`, { params });
                setPerformanceData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                if (error.response && error.response.status === 401) {
                    Cookies.remove('token');
                    navigate('/auth/login')
                }
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchDeployed = async () => {
            setLoadingDeployed(true);
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_ADDR}/deployed-machines`, {
                    headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
                });
                setDeployedMachines(response.data.machines || []);
            } catch (error) {
                setDeployedMachines([]);
            } finally {
                setLoadingDeployed(false);
            }
        };
        fetchDeployed();
    }, []);

    const metrics = [
        { key: 'cpu', label: 'CPU' },
        { key: 'iowait', label: 'I/O Wait' },
        { key: 'loadavg', label: 'Load Average' },
        { key: 'memused', label: 'Memory Used' },
        { key: 'swapused', label: 'Swap Used' }
    ];

    const createChartData = (metricKey, label) => ({
        labels: performanceData.map(data => new Date(data.time * 1000).toLocaleString()),
        datasets: [
            {
                label: label,
                data: performanceData.map(data => data[metricKey]),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ]
    });

    return (
        <Box sx={{ padding: '10px 20px' }}>
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Box component="h1" sx={{ fontSize: '2.4rem', fontWeight: 900, mb: 2, color: theme.palette.primary.main, letterSpacing: 1 }}>
                        Current Deployment
                    </Box>
                    {loadingDeployed ? (
                        <Box>Loading current deployment...</Box>
                    ) : deployedMachines.length === 0 ? (
                        <Box>No machines currently <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 700, display: 'inline' }}>deployed</Box></Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await axios.post(`${import.meta.env.VITE_BACKEND_ADDR}/refresh-ips`, {}, {
                                                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
                                            });
                                            console.log('IPs refreshed:', response.data);
                                            // Refresh the table data
                                            const deployedResponse = await axios.get(`${import.meta.env.VITE_BACKEND_ADDR}/deployed-machines`, {
                                                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
                                            });
                                            setDeployedMachines(deployedResponse.data.machines || []);
                                        } catch (error) {
                                            console.error('Error refreshing IPs:', error);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: theme.palette.primary.main,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Refresh IPs
                                </button>
                            </Box>
                            <TableContainer component={Paper} sx={{ mb: 5, borderRadius: 2, boxShadow: 2, background: theme.palette.grey[100], border: `1px solid ${theme.palette.divider}` }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: theme.palette.grey[300] }}>
                                            <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.grey[300] }}>VMID</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.grey[300] }}>Machine Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.grey[300] }}>IP Address</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary, backgroundColor: theme.palette.grey[300] }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {deployedMachines.map((m) => (
                                            <TableRow key={m.id} sx={{ '&:hover': { background: theme.palette.action.hover } }}>
                                                <TableCell>{m.id}</TableCell>
                                                <TableCell>{m.name}</TableCell>
                                                <TableCell>{m.ip_address || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {m.status === 'running' && (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: 'inline-block',
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                backgroundColor: theme.palette.success.main,
                                                                marginRight: 1,
                                                                animation: `${blink} 1s linear infinite`,
                                                                verticalAlign: 'middle',
                                                            }}
                                                        />
                                                    )}
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color:
                                                                m.status === 'running' || m.status === 'deployed'
                                                                    ? theme.palette.success.dark
                                                                    : theme.palette.text.primary,
                                                            fontWeight: m.status === 'deployed' ? 700 : 600,
                                                        }}
                                                    >
                                                        {m.status}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>
            </Box>
            <Box component="h1" sx={{ marginBottom: '15px', paddingLeft: '5px', fontSize: '1.7rem', fontWeight: 700, color: theme.palette.primary.dark }}>Proxmox Performance Dashboard</Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: '20px',
                    maxWidth: '100%'
                }}
            >
                {/* CPU Graph - Takes full width */}
                <Box
                    sx={{
                        gridColumn: { xs: '1', md: '1 / -1' },
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: '0'
                    }}
                >
                    <Box component="h2" sx={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                        CPU
                    </Box>
                    <Box sx={{ height: '350px', width: '100%' }}>
                        <Line
                            data={createChartData('cpu', 'CPU')}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false
                            }}
                        />
                    </Box>
                </Box>
                {/* Other metrics in 2-column layout */}
                {metrics.filter(metric => metric.key !== 'cpu').map((metric) => (
                    <Box key={metric.key} sx={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: '0'
                    }}>
                        <Box component="h2" sx={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                            {metric.label}
                        </Box>
                        <Box sx={{ height: '350px', width: '100%' }}>
                            <Line
                                data={createChartData(metric.key, metric.label)}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                            />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default Dashboard;
