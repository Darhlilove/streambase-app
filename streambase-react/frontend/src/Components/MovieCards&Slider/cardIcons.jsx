import React, {useEffect, useState} from 'react';
import {Box, IconButton, Tooltip} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlaylistAddCheckCircleIcon from "@mui/icons-material/PlaylistAddCheckCircle";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import {useDispatch, useSelector} from "react-redux";
import {
    addToFavorites, addToWatchlist, addToWatchedList,
    removeFromFavorites, removeFromWatchlist, removeFromWatchedList, fetchUserData
} from "../../Redux/userDataReducer.js";

const CardIcons = ({movie, isVisible, isColumn = true, iconSize="25px", placement="right"}) => {
    const dispatch = useDispatch();
    const status = useSelector(state => state.usersData.status);
    const userMoviesData = useSelector((state) => state.usersData.currentUserData)
    const [isFavorite, setIsFavorite] = useState(Boolean(userMoviesData?.favorites?.find(record => record.id === movie.id)));
    const [isWatchlist, setIsWatchlist] = useState(Boolean(userMoviesData?.watchlist?.find(record => record.id === movie.id)));
    const [isWatchedList, setIsWatchedList] = useState(Boolean(userMoviesData?.watchedList?.find(record => record.id === movie.id)));
    const favoriteIconColor = isFavorite ? "#FEB508" : "#ffffff";

    // Fetch user movies if not fetched already
    useEffect(() => {
        const fetchUserDetails = async () => {
            const currentUser = JSON.parse(localStorage.getItem('user'));

            if (!currentUser?.email) return; // Handle case where user is not logged in or email is missing

            if (status === 'idle' && !userMoviesData) {
                dispatch(fetchUserData(currentUser.email));
            }
        };

        fetchUserDetails();
    }, [dispatch, status, userMoviesData]);

    // Set icon states
    useEffect(() => {
        setIsFavorite(Boolean(userMoviesData?.favorites?.find(record => record.id === movie.id)));
        setIsWatchlist(Boolean(userMoviesData?.watchlist?.find(record => record.id === movie.id)));
        setIsWatchedList(Boolean(userMoviesData?.watchedList?.find(record => record.id === movie.id)));
    }, [userMoviesData])

    if (!isVisible) return null;

    const userString = localStorage.getItem("user");
    let userEmail = null;
    if (userString) {
        try {
            const userObject = JSON.parse(userString);
            userEmail = userObject.email
        } catch(error) {
            console.error("Error parsing user data from localStorage:", error);
        }
    } else {
        console.warn("No user found in localStorage.");
    }

    const handleAddToFavorites = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(addToFavorites({ email: userEmail, movieId: movie.id, movieName: movie.title || movie.name, media_type: movie.media_type || "movie" }));
        } else {
            console.warn("User email is not available. Cannot add to favorites.");
        }
    };

    const handleAddToWatchList = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(addToWatchlist({ email: userEmail, movieId: movie.id, movieName: movie.title || movie.name, media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot add to watchlist.");
        }
    };

    const handleAddToWatchedList = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(addToWatchedList({ email: userEmail, movieId: movie.id, movieName: movie.title || movie.name, media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot add to watched list.");
        }
    };

    const handleRemoveFromFavorites = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(removeFromFavorites({ email: userEmail, movieId: movie.id, media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot remove from favorites.");
        }
    };

    const handleRemoveFromWatchlist = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(removeFromWatchlist({ email: userEmail, movieId: movie.id, media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot remove from watchlist.");
        }
    };

    const handleRemoveFromWatchedList = (event) => {
        if (userEmail) {
            event.stopPropagation();
            event.preventDefault();
            dispatch(removeFromWatchedList({ email: userEmail, movieId: movie.id, media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot remove from watched list.");
        }
    };


    return (
        <Box sx={{ position: "absolute", top: 5, right: 5, transition: "transform 0.3s ease-in-out", display: "flex",
            flexDirection: isColumn ? "column" : "row", zIndex: 2 }}>
            <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"} placement={placement}>
                <IconButton
                    onClick={isFavorite ? handleRemoveFromFavorites : handleAddToFavorites}
                >
                    <FavoriteIcon
                        sx={{
                            color: favoriteIconColor,
                            fontSize: iconSize,
                            transition: 'transform 0.1s ease',
                            "&:hover": {
                                color: "#FEB508",
                            },
                            ":active": {
                                transform: "scale(0.9)",
                            }
                        }}
                    />
                </IconButton>
            </Tooltip>

            <Tooltip title={isWatchlist ? "Remove from Watchlist" : "Add to WatchList"} placement={placement}>
                <IconButton
                    onClick={isWatchlist ? handleRemoveFromWatchlist : handleAddToWatchList}
                >
                    {
                        isWatchlist
                            ?
                            <CheckCircleIcon
                                sx={{
                                    color: "#FEB508",
                                    fontSize: iconSize,
                                    transition: 'transform 0.1s ease',
                                    "&:hover": {
                                        color: "#FEB508",
                                    },
                                    ":active": {
                                        transform: "scale(0.9)",
                                    }
                                }}
                            />
                            :
                            <AddCircleIcon
                                sx={{
                                    color: "#ffffff",
                                    fontSize: iconSize,
                                    transition: 'transform 0.1s ease',
                                    "&:hover": {
                                        color: "#FEB508",
                                    },
                                    ":active": {
                                        transform: "scale(0.8)",
                                    }
                                }}
                            />
                    }
                </IconButton>
            </Tooltip>

            <Tooltip title={isWatchedList ? "Remove from Watched List" : "Add to Watched List"} placement={placement}>
                <IconButton
                    onClick={isWatchedList ? handleRemoveFromWatchedList : handleAddToWatchedList}
                >
                    {
                        isWatchedList
                            ?
                            <PlaylistAddCheckCircleIcon
                                sx={{
                                    color: "#FEB508",
                                    fontSize: iconSize,
                                    transition: 'transform 0.1s ease',
                                }}
                            />
                            :
                            <PlaylistAddIcon
                                sx={{
                                    color: "#ffffff",
                                    fontSize: iconSize,
                                    transition: 'transform 0.1s ease',
                                    "&:hover": {
                                        color: "#FEB508",
                                    },
                                    ":active": {
                                        transform: "scale(0.8)",
                                    }
                                }}
                            />
                    }
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default CardIcons;