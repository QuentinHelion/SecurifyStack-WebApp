// TaskList.tsx

import React, { useState, useEffect } from 'react';

type Task = {
    title: string;
    description: string;
    state: boolean;
};

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        // Fetch the JSON data
        fetch('http://localhost:5000/checklist/get') // Assuming checklist.json is in the public directory
            .then(response => response.json())
            .then(data => setTasks(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const handleToggleState = (index: number) => {
        const updatedTasks = [...tasks];
        updatedTasks[index].state = !updatedTasks[index].state;
        setTasks(updatedTasks);
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
        <div>
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
        </div>
    );
};

export default TaskList;
