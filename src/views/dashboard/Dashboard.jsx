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

const Dashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
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
        <div style={{ padding: '10px 20px' }}>
            <h1 style={{ marginBottom: '15px', paddingLeft: '5px' }}>Proxmox Performance Dashboard</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                maxWidth: '100%',
                '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr'
                }
            }}>
                {/* CPU Graph - Takes full width */}
                <div style={{
                    gridColumn: '1 / -1',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    minWidth: '0'
                }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                        CPU
                    </h2>
                    <div style={{ height: '350px', width: '100%' }}>
                        <Line
                            data={createChartData('cpu', 'CPU')}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false
                            }}
                        />
                    </div>
                </div>

                {/* Other metrics in 2-column layout */}
                {metrics.filter(metric => metric.key !== 'cpu').map((metric) => (
                    <div key={metric.key} style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        minWidth: '0'
                    }}>
                        <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                            {metric.label}
                        </h2>
                        <div style={{ height: '350px', width: '100%' }}>
                            <Line
                                data={createChartData(metric.key, metric.label)}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
