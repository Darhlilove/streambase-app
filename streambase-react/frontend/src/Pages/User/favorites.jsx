import React, { useState, useEffect } from 'react';
import {Box, CircularProgress, Typography} from '@mui/material';
import { useDispatch, useSelector } from "react-redux";
import ImageCardList from "../../Components/MovieCards&Slider/imageCardList.jsx";
import { fetchMoviesList, fetchUserData } from "../../Redux/userDataReducer.js";

const UserFavorites = () => {
    const dispatch = useDispatch();
    const { currentUserData, status } = useSelector((state) => state.usersData);
    const [favoriteMovies, setFavoriteMovies] = useState(null);
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

    // Fetch favorite movies data from TMDB
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!currentUserData?.favorites) {
                setLoading(false);
                return;
            }

            const favoriteDetails = currentUserData?.favorites?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            if (favoriteDetails.length > 0) {
                const moviesList = await fetchMoviesList(favoriteDetails);
                const updatedMoviesList = moviesList.map(movie => {
                    const favorite = currentUserData?.favorites.find(fav => fav.id === movie.id);
                    return {
                        ...movie,
                        media_type: favorite ? favorite.media_type : "movie"
                    };
                });
                setFavoriteMovies(updatedMoviesList);
            } else {
                setLoading(false);
                setFavoriteMovies([]);
            }
            setLoading(false);
        };

        fetchFavorites();
    }, [currentUserData?.favorites]);

    return (
                <Box sx={{ paddingY: "25px", paddingX: "40px" }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "secondary.light" }}>
                        Your Favorites
                    </Typography>
                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                            <CircularProgress />
                        </Box>
                    ) : favoriteMovies && favoriteMovies.length === 0 ? (
                        <Typography variant="h6" color="textSecondary">
                            You haven't added any movies to your favorites yet.
                        </Typography>
                    ) : (
                        <ImageCardList
                            movies={favoriteMovies}
                            cols={7}
                        />
                        )
                    }
                </Box>
    );
};

export default UserFavorites;