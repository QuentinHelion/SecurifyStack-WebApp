import Chart from 'chart.js/auto';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';

const Dashboard = () => {
    // Simulated performance data for testing
    const performanceData = [
        {
            "cpu": 0.0231049143211886,
            "iowait": 0.000553445899708048,
            "loadavg": 0.34767240410053,
            "maxcpu": 12,
            "memtotal": 67177291776,
            "memused": 18985763258.1554,
            "netin": 8897.49999851192,
            "netout": 32827.8025309184,
            "roottotal": 100861726720,
            "rootused": 35539958803.2489,
            "swaptotal": 8589930496,
            "swapused": 2883584,
            "time": 1704931200
        },
        {
            "cpu": 0.0164265326178475,
            "iowait": 0.000540410466280299,
            "loadavg": 0.26977900132275,
            "maxcpu": 12,
            "memtotal": 67177291776,
            "memused": 19078659889.5746,
            "netin": 17497.0959718915,
            "netout": 537.475782407408,
            "roottotal": 100861726720,
            "rootused": 35545227245.1235,
            "swaptotal": 8589930496,
            "swapused": 2883584,
            "time": 1705536000
        },
        {
            "cpu": 0.0129761509396944,
            "iowait": 0.000533519834658491,
            "loadavg": 0.231503918650794,
            "maxcpu": 12,
            "memtotal": 67177291776,
            "memused": 15295937880.0897,
            "netin": 10322.25453125,
            "netout": 659.815556878313,
            "roottotal": 100861726720,
            "rootused": 35547110525.1622,
            "swaptotal": 8589930496,
            "swapused": 2883584,
            "time": 1706140800
        }
    ];

    const [selectedResource, setSelectedResource] = useState('cpu');

    const handleResourceChange = (event) => {
        setSelectedResource(event.target.value);
    };

    // Prepare data for the chart based on selected resource
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
