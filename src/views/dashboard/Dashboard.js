import React, { useState, useEffect } from 'react';
import { useNavigate  } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
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
    TimeScale,
    Title,
    Tooltip,
    Legend
);
const Dashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [selectedResource, setSelectedResource] = useState('cpu');
    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = {
                    token: Cookies.get('token')
                }
                const response = await axios.get('http://10.0.10.3:5000/stats/proxmox', {params});
                setPerformanceData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                if(error.response.status === 401) {
                    Cookies.remove('token');
                    navigate('/auth/login')
                }
            }
        };

        fetchData();
    }, []);

    const handleResourceChange = (event) => {
        setSelectedResource(event.target.value);
    };

    const chartData = {
        labels: performanceData.map(data => new Date(data.time * 1000).toLocaleString()),
        datasets: [
            {
                label: selectedResource.toUpperCase(),
                data: performanceData.map(data => data[selectedResource]),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
        ],
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day' // You can adjust the time unit as needed
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    return (
        <div>
            <h1>Proxmox Performance Dashboard</h1>
            <div className="resource-select">
                <label htmlFor="resource">Select Resource:</label>
                <select id="resource" value={selectedResource} onChange={handleResourceChange}>
                    <option value="cpu">CPU</option>
                    <option value="iowait">I/O Wait</option>
                    <option value="loadavg">Load Average</option>
                    <option value="memused">Memory Used</option>
                    <option value="swapused">Swap Used</option>
                </select>
            </div>
            <div className="performance-chart">
                <Line data={chartData}/>
            </div>
        </div>
);
};

export default Dashboard;
