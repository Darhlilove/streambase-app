import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    FormHelperText
} from '@mui/material';
import { toast } from 'react-toastify';
import { useLocalStorage } from "../../Functions/useLocalStorage.jsx";
import { sendNotification } from "../../Redux/notificationsReducer.js";
import {useDispatch} from "react-redux";

const MovieRequestPage = () => {
    const [formData, setFormData] = useState({movieTitle: '', mediaType: '', year: ''});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const user = useLocalStorage('user')
    const dispatch = useDispatch();


    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });

        if (value && errors[name]) {
            setErrors((prevErrors) => {
                const { [name]: removedError, ...rest } = prevErrors;
                return rest;
            });
        }
    };

    const handleSubmitRequest = async () => {
        const newErrors = {};
        if (!formData.movieTitle || formData.movieTitle.length < 3) newErrors.movieTitle = 'Please enter a valid movie title';
        if (!formData.mediaType || formData.mediaType === '') newErrors.mediaType = 'Please select media type';
        if (!formData.year || !Number.isInteger(parseInt(formData.year)) || formData.year.length  !== 4) newErrors.year = 'Please enter a valid year';

        setIsSubmitting(true);

        if (Object.keys(newErrors).length === 0) {
            try {
                const timestamp = new Date().toISOString();
                const formWithTimestamp = { ...formData, senderId: user?.id, status: 'pending', createdAt: timestamp, updatedAt: timestamp };

                const response = await fetch(`${import.meta.env.VITE_API_URL}/movie-requests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formWithTimestamp),
                });

                const data = await response.json();

                if (data) {
                    const notificationData = {
                        date: new Date().toISOString(),
                        from: user?.id, // User ID of the sender
                        to: "Admin1",
                        message: `${user?.name} requested for a movie!`,
                        read: false
                    };

                    toast('Your movie request has been submitted!');
                    dispatch(sendNotification(notificationData))
                } else {
                    toast('Something went wrong. Please try again.');
                }

                setIsSubmitting(false);
                setFormData({movieTitle: '', mediaType: '', year: ''});
            } catch (error) {
                setIsSubmitting(false);
                toast('Network error. Please try again later.', { variant: 'error' });
                console.log(error);
            }
        } else {
            setIsSubmitting(false);
            setErrors(newErrors);
        }
    };

    return (
        <Box sx={{ paddingY: "25px", paddingX: "40px", display: "flex", flexDirection: "column",
            alignItems: 'center', height: "100%" }}
        >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "secondary.light", marginBottom: "40px" }}>
                Request a Movie or TV Show to Be Added
            </Typography>

            <TextField
                label="Movie/TV Show Title"
                required
                variant="outlined"
                name="movieTitle"
                value={formData.movieTitle}
                onChange={handleChange}
                sx={{ marginBottom: "25px", width: "50%", minWidth: "200px" }}
                margin="normal"
                error={errors.movieTitle}
                helperText={errors.movieTitle}
            />

            <FormControl required sx={{ marginBottom: "40px", width: "50%" }} fullWidth margin="normal" error={!!errors.mediaType}>
                <InputLabel>Media Type</InputLabel>
                <Select
                    variant="outlined"
                    name="mediaType"
                    value={formData.mediaType}
                    onChange={handleChange}
                    label="Media Type"
                >
                    <MenuItem value=""></MenuItem>
                    <MenuItem value="movie">Movie</MenuItem>
                    <MenuItem value="tv">TV Show</MenuItem>
                </Select>
                {errors.mediaType && <FormHelperText>{errors.mediaType}</FormHelperText>}
            </FormControl>

            <TextField
                label="Year of release"
                required
                name="year"
                variant="outlined"
                value={formData.year}
                onChange={handleChange}
                sx={{ marginBottom: "40px", width: "50%", minWidth: "200px" }}
                error={errors.year}
                helperText={errors.year}
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                sx={{ width: "10%", minWidth: "160px" }}
            >
                {isSubmitting ? 'Submitting...' : 'Send Request'}
            </Button>

        </Box>
    );
};

export default MovieRequestPage;
