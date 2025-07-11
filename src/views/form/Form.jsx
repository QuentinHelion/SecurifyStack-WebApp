import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
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
                        {field.type === 'select' ? (
                            <FormControl fullWidth>
                                <Select
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name] !== undefined ? formData[field.name] : ''}
                                    onChange={handleChange}
                                    required={field.required}
                                    variant="outlined"
                                >
                                    {field.options.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <CustomTextField
                                id={field.name}
                                name={field.name}
                                type={field.type || 'text'}
                                variant="outlined"
                                fullWidth
                                value={formData[field.name] !== undefined ? formData[field.name] : ''}
                                onChange={handleChange}
                                required={field.required}
                            />
                        )}
                    </Box>
                ))}
                <Button type="submit" variant="contained">Submit</Button>
            </Stack>
        </form>
    );
};

export default Form;
