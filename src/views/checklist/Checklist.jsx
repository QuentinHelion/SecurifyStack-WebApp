import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Checkbox, Typography, Box } from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import Cookies from 'js-cookie';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get('token');
                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/checklist/get?token=${token}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setTasks(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleToggleState = (index) => {
        const updatedTasks = [...tasks];
        updatedTasks[index].state = !updatedTasks[index].state;
        setTasks(updatedTasks);
        saveTasksToJson(updatedTasks);
    };

    const saveTasksToJson = async (updatedTasks) => {
        try {
            const token = Cookies.get('token');
            const formData = new FormData();
            const blob = new Blob([JSON.stringify(updatedTasks)], { type: 'application/json' });
            formData.append('checklist', blob, 'checklist.json');

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDR}/checklist/update?token=${token}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                console.log('Tasks updated successfully');
            } else {
                console.error('Failed to update tasks:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating tasks:', error);
        }
    };

    return (
        <Grid container spacing={3}>
            {tasks.map((task, index) => (
                <Grid item sm={12} key={index}>
                    <BlankCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Checkbox
                                    checked={task.state}
                                    onChange={() => handleToggleState(index)}
                                    inputProps={{ 'aria-label': task.name }}
                                />
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="h5" component="div">
                                        {task.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {task.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </BlankCard>
                </Grid>
            ))}
        </Grid>
    );
};

export default TaskList;