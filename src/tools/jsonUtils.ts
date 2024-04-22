// jsonUtils.ts
import axios from 'axios';

// Function to read JSON data from a file
export const readJson = async (filePath: string): Promise<never | null> => {
    try {
        const response = await axios.get(filePath);
        return response.data;
    } catch (error) {
        console.error('Error reading JSON:', error);
        return null;
    }
};

// Function to write JSON data to a file
export const writeJson = async (filePath: string, jsonData: unknown): Promise<void> => {
    try {
        await axios.post(filePath, jsonData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('JSON data written successfully!');
    } catch (error) {
        console.error('Error writing JSON:', error);
    }
};
