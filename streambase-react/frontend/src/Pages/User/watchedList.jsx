import React, { useState, useEffect } from 'react';
import {Box, CircularProgress, Typography} from '@mui/material';
import { useDispatch, useSelector } from "react-redux";
import ImageCardList from "../../Components/MovieCards&Slider/imageCardList.jsx";
import { fetchMoviesList, fetchUserData } from "../../Redux/userDataReducer.js";

const UserWatchedList = () => {
    const dispatch = useDispatch();
    const { currentUserData, status } = useSelector((state) => state.usersData);
    const [watchedListMovies, setWatchedListMovies] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (!storedUser) return; // Handle case where user data is missing

                const currentUser = JSON.parse(storedUser);
                if (!currentUser?.email) return; // Ensure email exists

                if (status === 'idle') {
                    await dispatch(fetchUserData(currentUser.email)).unwrap(); // Ensure promise errors are caught
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };

        fetchUserDetails();
    }, [dispatch, status]);

    useEffect(() => {
        const fetchWatchedList = async () => {
            if (!currentUserData?.watchedList) {
                setLoading(false)
                return
            }

            const watchedListDetails = currentUserData?.watchedList?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            if (watchedListDetails.length > 0) {
                const moviesList = await fetchMoviesList(watchedListDetails);
                const updatedMoviesList = moviesList.map(movie => {
                    const watchedList = currentUserData?.watchedList.find(fav => fav.id === movie.id);
                    return {
                        ...movie,
                        media_type: watchedList ? watchedList.media_type : "movie"
                    };
                });

                setWatchedListMovies(updatedMoviesList);
            } else {
                setLoading(false)
                setWatchedListMovies([]);
            }
            setLoading(false)
        };

        fetchWatchedList();
    }, [currentUserData?.watchedList]);

    return (
        <Box sx={{ paddingY: "25px", paddingX: "40px" }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "secondary.light" }}>
                Your Watch History
            </Typography>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <CircularProgress />
                </Box>
            ) : watchedListMovies && watchedListMovies.length === 0 ? (
                <Typography variant="h6" color="textSecondary">
                    You haven't added any movies to your watch history yet.
                </Typography>
            ) : (
                <ImageCardList
                    movies={watchedListMovies}
                    cols={7}
                />
            )}
        </Box>
    );
};

export default UserWatchedList;