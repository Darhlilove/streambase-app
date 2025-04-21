import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion'; // For animations
import { useTheme } from '@mui/material/styles';
import ErrorIcon from '@mui/icons-material/Error'; // Optional icon

const NotFoundPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true); // Show the button after a delay for better UX
        }, 2000);

        return () => clearTimeout(timer); // Clean up the timer
    }, []);

    const handleRedirect = () => {
        navigate('/'); // Navigate back to the homepage
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: "theme.palette.background.paper",
                padding: 2,
            }}
        >
            <Container maxWidth="sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <ErrorIcon sx={{ fontSize: '6rem', color: theme.palette.error.main }} />
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                marginTop: 2,
                                letterSpacing: '2px',
                            }}
                        >
                            Oops! Page Not Found.
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                marginTop: 5,
                                fontSize: '1.2rem',
                                color: theme.palette.text.secondary,
                            }}
                        >
                            We couldn't find the page you're looking for. But don't worry, we can help you find your way back.
                        </Typography>

                        {/* Show the button after a slight delay */}
                        {showButton && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    sx={{ marginTop: 5, fontWeight: 'bold', borderRadius: '60px', padding: '20px' }}
                                    onClick={handleRedirect}
                                >
                                    Go Back to Home
                                </Button>
                            </motion.div>
                        )}
                    </Box>
                </motion.div>
            </Container>
        </Box>
    );
};

export default NotFoundPage;
