import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';

const Form = ({ fields = [], formData, handleChange, handleSubmit }) => {
    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
                {fields.map((field) => (
                    <Box key={field.name}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            component="label"
                            htmlFor={field.name}
                            mb="5px"
                        >
                            {field.label}
                        </Typography>
                        <CustomTextField
                            id={field.name}
                            name={field.name}
                            type={field.type || 'text'}
                            variant="outlined"
                            fullWidth
                            value={formData[field.name]}
                            onChange={handleChange}
                            required={field.required}
                        />
                    </Box>
                ))}
                <Button type="submit" variant="contained">Submit</Button>
            </Stack>
        </form>
    );
};

export default Form;
