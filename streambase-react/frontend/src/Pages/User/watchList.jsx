import React, { useState, useEffect } from 'react';
import {Box, CircularProgress, Typography} from '@mui/material';
import { useDispatch, useSelector } from "react-redux";
import ImageCardList from "../../Components/MovieCards&Slider/imageCardList.jsx";
import { fetchMoviesList, fetchUserData } from "../../Redux/userDataReducer.js";

const UserWatchlist = () => {
    const dispatch = useDispatch();
    const { currentUserData, status } = useSelector((state) => state.usersData);
    const [watchlistMovies, setWatchlistMovies] = useState(null);
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
        const fetchWatchlist = async () => {
            if (!currentUserData?.watchlist) {
                setLoading(false)
                return;
            }

            const watchlistDetails = currentUserData?.watchlist?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            if (watchlistDetails.length > 0) {
                const moviesList = await fetchMoviesList(watchlistDetails);
                const updatedMoviesList = moviesList.map(movie => {
                    const watchlist = currentUserData?.watchlist.find(fav => fav.id === movie.id);
                    return {
                        ...movie,
                        media_type: watchlist ? watchlist.media_type : "movie"
                    };
                });
                setWatchlistMovies(updatedMoviesList);
            } else {
                setLoading(false)
                setWatchlistMovies([]);
            }
            setLoading(false)
        };

        fetchWatchlist();
    }, [currentUserData?.watchlist]);

    return (
        <Box sx={{ paddingY: "25px", paddingX: "40px" }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "secondary.light" }}>
                Your Watchlist
            </Typography>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <CircularProgress />
                </Box>
            ) : watchlistMovies && watchlistMovies.length === 0 ? (
                <Typography variant="h6" color="textSecondary">
                    You haven't added any movies to your watchlist yet.
                </Typography>
            ) : (
                <ImageCardList
                    movies={watchlistMovies}
                    cols={7}
                />
            )}
        </Box>
    );
};

export default UserWatchlist;