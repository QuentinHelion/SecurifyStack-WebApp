import React, { useState, useEffect } from 'react';
import { Grid, CardContent } from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
// import { Container, Row, Col } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        // Fetch the JSON data
        fetch('http://10.0.10.3:5000/checklist/get') // Assuming checklist.json is in the public directory
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

            const response = await fetch(`http://10.0.10.3:5000/checklist/update?token=${token}`, {
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
            <Grid item sm={12}>
                <Grid container spacing={3}>
                    {tasks.map((task, index) => (
                        <Grid item sm={12}>
                            <BlankCard>
                                <CardContent>
                                    <Container>
                                        <Row className='p-2'>
                                            <Col xs={1} md={1} lg={1} className='d-flex justify-content-center align-items-center w-25'>
                                                <input
                                                    type="checkbox"
                                                    checked={task.state}
                                                    className="big-checkbox"
                                                    onChange={() => handleToggleState(index)}
                                                />
                                            </Col>
                                            <Col xs={11} md={11} lg={11} className='w-75 d-flex flex-wrap align-items-center'>
                                                <h3 className='w-100 mb-2'>{task.name}</h3>
                                                <p>{task.description}</p>
                                            </Col>
                                        </Row>
                                    </Container>
                                </CardContent>
                            </BlankCard>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default TaskList;
