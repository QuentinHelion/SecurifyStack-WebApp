import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Button,
    Stack,
    Checkbox
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import axios from "axios";



const AuthLogin = ({ title }) => {
    const navigate = useNavigate();
    const handleToggleState = async () => {
        try {
            const params = {
                cn: document.getElementById("username").value,
                dc: 'securify-stack',
                password: document.getElementById("password").value,
            }
            const response = await axios.get('http://localhost:5000/login', { params });
            Cookies.set('token', response.data.message, { expires: 7 }); // Expires in 7 days

            navigate('/');
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <>
            <Typography fontWeight="700" variant="h2" mb={1}>
                {title}
            </Typography>
            <Stack>
                <Box>
                    <Typography variant="subtitle1"
                        fontWeight={600} component="label" htmlFor='username' mb="5px">Username</Typography>
                    <CustomTextField id="username" variant="outlined" fullWidth />
                </Box>
                <Box mt="25px">
                    <Typography variant="subtitle1"
                        fontWeight={600} component="label" htmlFor='password' mb="5px">Password</Typography>
                    <CustomTextField id="password" type="password" variant="outlined" fullWidth />
                </Box>
                <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
                    <FormGroup>
                        <FormControlLabel
                            control={<Checkbox defaultChecked />}
                            label="Remeber this Device"
                        />
                    </FormGroup>

                </Stack>
            </Stack>
            <Box>
                <Button
                    color="primary"
                    variant="contained"
                    size="large"
                    fullWidth
                    component={Link}
                    onClick={() => handleToggleState()}
                    type="submit"
                >
                    Sign In
                </Button>
            </Box>
        </>
    );
};

export default AuthLogin;
