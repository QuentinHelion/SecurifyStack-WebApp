import React, { useState, useEffect } from 'react';
import { Grid, CardContent } from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        // Fetch the JSON data
        fetch('http://localhost:5000/checklist/get') // Assuming checklist.json is in the public directory
            .then(response => response.json())
            .then(data => setTasks(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const handleToggleState = (index) => {
        const updatedTasks = [...tasks];
        updatedTasks[index].state = !updatedTasks[index].state;
        setTasks(updatedTasks);
        saveTasksToJson();
    };

    const saveTasksToJson = async () => {
        try {
            const formData = new FormData();
            const blob = new Blob([JSON.stringify(tasks)], { type: 'application/json' });
            formData.append('checklist', blob, 'checklist.json');

            const response = await fetch('http://localhost:5000/checklist/update', {
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
        <>
        {/* <div>
            <h1>Task List</h1>
            <ul>
                {tasks.map((task, index) => (
                    <li key={index}>
                        <input
                            type="checkbox"
                            checked={task.state}
                            onChange={() => handleToggleState(index)}
                        />
                        <span>{task.title}</span>
                        <p>{task.description}</p>
                    </li>
                ))}
            </ul>
            <button onClick={saveTasksToJson}>Save</button>
        </div> */}
        <Grid container spacing={3}>
            <Grid item sm={12}>
                <Grid container spacing={3}>
                    {tasks.map((task, index) => (
                        <Grid item sm={12}>
                            <BlankCard>
                                <CardContent>
                                    <input
                                        type="checkbox"
                                        checked={task.state}
                                        onChange={() => handleToggleState(index)}
                                    />
                                    <span>{task.title}</span>
                                    <p>{task.description}</p>
                                </CardContent>
                            </BlankCard>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
        </>
    );
};

export default TaskList;
