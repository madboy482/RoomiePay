import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        Name: '',
        Email: '',
        Password: '',
        Phone: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');
            alert('Registration successful! Please login.');
        } catch (error) {
            alert('Registration failed. Please try again.');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Paper elevation={3} sx={{ padding: 4, width: '300px' }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Register for RoomiePay
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Name"
                        name="Name"
                        value={formData.Name}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        name="Email"
                        type="email"
                        value={formData.Email}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Password"
                        name="Password"
                        type="password"
                        value={formData.Password}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Phone"
                        name="Phone"
                        value={formData.Phone}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3 }}
                    >
                        Register
                    </Button>
                    <Button
                        fullWidth
                        variant="text"
                        sx={{ mt: 1 }}
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default Register;