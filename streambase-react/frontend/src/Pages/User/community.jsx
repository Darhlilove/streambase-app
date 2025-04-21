import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Tooltip,
    CircularProgress,
    ToggleButtonGroup, ToggleButton, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';  // Plus icon for friend request
import { fetchUsersData, fetchUserData, followUser, unfollowUser, fetchMoviesList } from "../../Redux/userDataReducer.js";
import { sendNotification } from "../../Redux/notificationsReducer.js";
import { useDispatch, useSelector } from "react-redux";
import ImageCardList from "../../Components/MovieCards&Slider/imageCardList.jsx";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const CommunityPage = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [view, setView] = useState('following'); // Toggle between 'global' and 'following' view
    const [selectedUser, setSelectedUser] = useState(null); // The user that is selected for movie viewing
    const { currentUserData, allUsersData, loading, error } = useSelector((state) => state.usersData);
    const [selectedUserFavoriteMovies, setSelectedUserFavoriteMovies] = useState(null);
    const [selectedUserWatchlistMovies, setSelectedUserWatchlistMovies] = useState(null);
    const [selectedUserWatchedListMovies, setSelectedUserWatchedListMovies] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const [selected, setSelected] = useState(false);

    // Fetch users data when the component mounts
    useEffect(() => {
        if (!allUsersData || allUsersData.length === 0) {
            if (!currentUser || !currentUser.email) return;

            const fetchUsersMovies = async () => {
                try {
                    await dispatch(fetchUsersData());
                    await dispatch(fetchUserData(currentUser.email));
                } catch (err) {
                    return err;
                }
            };

            fetchUsersMovies();
        }
    }, [dispatch, currentUser, allUsersData]);

    /**
     * Filters users based on the provided view, search term, and current user data.
     *
     * @param {Array} users - The list of users to filter.
     * @param {String} view - The view type ('following', 'followers', 'global').
     * @param {String} searchTerm - The term to search for in usernames.
     * @param {Object} currentUserData - The data of the current user.
     * @returns {Array|null} The filtered list of users or null if users are invalid.
     */
    const filterUsers = (users, view, searchTerm, currentUserData) => {
        // Check if users is valid
        if (!Array.isArray(users) || users.length === 0) return null;

        // If currentUserData is not provided, return all users
        if (!currentUserData) return users;

        // Ensure view is valid
        const validViews = ['following', 'followers', 'global'];
        if (!validViews.includes(view)) {
            return null;
        }

        // Ensure searchTerm is a string
        if (typeof searchTerm !== 'string') {
            return null;
        }

        return users.filter(user => {
            // Check if user object is valid
            if (typeof user !== 'object' || !user.id || !user.name) return false;

            if (view === 'following') {
                // Check if following list exists in currentUserData
                if (!currentUserData.following) {
                    return false;
                }
                return currentUserData.following.includes(user.id) &&
                    user.name.toLowerCase().includes(searchTerm.toLowerCase());
            }

            if (view === 'followers') {
                // Check if followers list exists in currentUserData
                if (!currentUserData.followers) {
                    return false;
                }
                return currentUserData.followers.includes(user.id) && user.name.toLowerCase().includes(searchTerm.toLowerCase());
            }

            if (view === 'global') {
                // Check if following list exists in currentUserData
                if (!currentUserData.following) {
                    return false;
                }
                return !currentUserData.following.includes(user.id) && currentUserData.id !== user.id
                    && user.name.toLowerCase().includes(searchTerm.toLowerCase());
            }

            // Should not reach here due to view validation
            return true;
        })
            .filter(user => {
                // Check if user has either watchlist or watchedList
                return (user.favorites && user.favorites.length > 0) || (user.watchlist && user.watchlist.length > 0)
                    || (user.watchedList && user.watchedList.length > 0);
            });
    };

    // Effect to auto-check the first user and show the notification if they have no following
    useEffect(() => {
        const filteredUsers = allUsersData && currentUserData && filterUsers(allUsersData, view, '', currentUserData);

        if (filteredUsers && filteredUsers.length > 0) {
            if (view === 'following') {
                setSelectedUser(
                    filteredUsers.find(user => currentUserData.following.includes(user.id)) || null
                );
            }
            if (view === 'followers') {
                setSelectedUser(
                    filteredUsers.find(user => currentUserData.followers.includes(user.id)) || null
                );
            }
            if (view === 'global') {
                setSelectedUser(
                    filteredUsers
                        // Filter out non-following
                        .filter(user => !currentUserData.following.includes(user.id))
                        // Filter users with least 1 movie in either watchlist or watch history
                        .filter(user => user.favorites?.length > 0 || user.watchList?.length > 0 || user.watchedList?.length > 0)[0]
                )
            }
        } else {
            setSelectedUser(null); // Reset selected user if no users match the filter
        }
    }, [allUsersData, currentUserData, view]);

    // Highlight selected user
    useEffect(() => {
        if (selectedUser) {
            setSelected(true)
        }
    }, [selectedUser]);


    // Fetch selected user movies from TMDB
    useEffect(() => {
        const fetchMoviesListForType = async (list, setState) => {
            try {
                if ((list?.length || 0) > 0) {
                    const moviesList = await fetchMoviesList(list);
                    setState(moviesList);
                } else {
                    setState([]);
                }
            } catch (error) {
                setState([]);
            }
        };

        const fetchSelectedUserMovies = async () => {
            if (!selectedUser) return; // Exit if selectedUser is null or undefined

            const favoriteDetails = selectedUser.favorites?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            const watchlistDetails = selectedUser.watchlist?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            const watchedListDetails = selectedUser.watchedList?.map(item => ({
                id: item.id,
                media_type: item.media_type
            })) || [];

            // Fetch both lists in parallel and update states accordingly
            await Promise.all([
                fetchMoviesListForType(favoriteDetails, (movies) => setSelectedUserFavoriteMovies(movies)),
                fetchMoviesListForType(watchlistDetails, (movies) => setSelectedUserWatchlistMovies(movies)),
                fetchMoviesListForType(watchedListDetails, (movies) => setSelectedUserWatchedListMovies(movies)),
            ]);
        };

        fetchSelectedUserMovies();
    }, [selectedUser]); // Ensure effect runs whenever selectedUser changes

    // Handling the view switch between following and global community
    const handleViewChange = (event, newView) => {
        setView(newView);
    };

    // Handle user search
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Follow a user
    const handleFollow = async (userId, name) => {
        if (!currentUserData) return;

        const notificationData = {
            date: new Date().toISOString(),
            from: currentUser.id, // User ID of the sender
            to: userId, // User ID of the recipient
            message: `${currentUser?.name} followed you!`,
            read: false, // Whether the notification has been read
        };


        // Dispatch the follow action
        await dispatch(followUser({ currentUserId: currentUser.id, targetUserId: userId }));

        // Dispatch the notification action
        await dispatch(sendNotification(notificationData));

        toast(`You followed ${name}!`)

        // Update the selected user if necessary
        if (view === 'following') {
            setSelectedUser(
                allUsersData.find(user => user.id === userId) || null
            );
        }
    };

    // Unfollow a user
    const handleUnfollow = async (userId, name) => {
        if (!currentUserData) return;

        const notificationData = {
            date: new Date().toISOString(),
            from: currentUser?.id, // User ID of the sender
            to: userId, // User ID of the recipient
            message: `${currentUser?.name} unfollowed you!`, // Optional, but useful
            read: false, // Whether the notification has been read
        };

        // Dispatch the unfollow action
        await dispatch(unfollowUser({ currentUserId: currentUser.id, targetUserId: userId }));

        // Dispatch the notification action
        await dispatch(sendNotification(notificationData));

        toast(`You unfollowed ${name}!`)
    }

    // Handling the user click event
    const handleUserClick = (user) => {
        setSelectedUser(user);
    };

    const filteredUsers = allUsersData && currentUserData && filterUsers(allUsersData, view, searchTerm, currentUserData);

    // Rendering the list of users
    const renderUserList = () => {
        return filteredUsers && filteredUsers.length > 0 && filteredUsers.map((user) => (
            <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: "5px", padding: "10px",
                backgroundColor: selected && user.id === selectedUser?.id ? "rgba(254,181,8,0.1)" : "transparent",
                borderRadius: "36px", "&:hover": { backgroundColor: "rgba(254,181,8,0.05)" }
            }}
                 onClick={() => {
                     handleUserClick(user)
                     setSelected(true)
                 }}>
                <Avatar src={user.image || 'https://via.placeholder.com/40'} sx={{ marginRight: 2 }} />
                <Typography variant="body1" sx={{ flexGrow: 1 }}>{user.name}</Typography>

                {view === 'following' && (
                    <Tooltip title={"Unfollow"}>
                        <IconButton
                            onClick={() => handleUnfollow(user.id, user.name)}
                            sx={{ marginLeft: 1, color:'rgba(80, 80, 80, 0.8)' }}
                        >
                            <CheckCircleIcon />
                        </IconButton>
                    </Tooltip>
                )}

                {view === 'followers' && (
                    currentUserData.followers.includes(user.id) ?
                    <Tooltip title={"Unfollow"}>
                        <IconButton
                            onClick={() => handleUnfollow(user.id, user.name)}
                            sx={{ marginLeft: 1, color:'rgba(80, 80, 80, 0.8)' }}
                        >
                            <CheckCircleIcon />
                        </IconButton>
                    </Tooltip>
                        :
                        <Tooltip title={"Follow"}>
                            <IconButton
                                color="primary"
                                onClick={() => handleFollow(user.id, user.name)}
                                sx={{ marginLeft: 1 }}
                            >
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                )}

                {/* Plus Button to Request Friendship */}
                {view === 'global' && (
                    <Tooltip title={"Follow"}>
                        <IconButton
                            color="primary"
                            onClick={() => handleFollow(user.id, user.name)}
                            sx={{ marginLeft: 1 }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ));
    };

    return (
        <Box sx={{ display: 'flex', paddingY: "25px", paddingX: "40px" }}>
            {/* Left Pane: Movie Sliders */}
            {
                loading ?
                    <Box sx={{ flex: 1, minWidth: "900px", display: "flex", alignItems: "center",
                        justifyContent: "center", height: "100vh"}}
                    >
                         <CircularProgress size={150} />
                    </Box>
                    :
                    <Box sx={{ flex: 1, minWidth: "900px"}}>
                        { selectedUser ? (
                            <>
                                <Typography variant="h4" color={"primary"} sx={{ fontWeight: "bold" }}>
                                    {selectedUser?.name.endsWith('s') ? `${selectedUser?.name}'` : `${selectedUser?.name}'s`} Movies
                                </Typography>

                                {selectedUserFavoriteMovies &&
                                    <Box sx={{display: !selectedUserFavoriteMovies?.length > 0 ? "none" : "block"}}>
                                    <Typography variant="h5"
                                                sx={{fontWeight: "bold", mt: "40px", ml: "40px", mb: "-20px"}}>
                                        Favorites
                                    </Typography>
                                    <ImageCardList
                                        movies={selectedUserFavoriteMovies}
                                        favorites={selectedUser?.favorites}
                                        watchList={selectedUser?.watchlist}
                                        watchedList={selectedUser?.watchedList}
                                    />
                                    </Box>
                                }

                                <Box sx={{ display: !selectedUserWatchlistMovies?.length > 0 ? "none" : "block"}}>
                                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: "40px", ml: "40px", mb: "-20px"  }}>
                                        Watchlist
                                    </Typography>
                                    <ImageCardList
                                        movies={selectedUserWatchlistMovies}
                                        favorites={selectedUser?.favorites}
                                        watchList={selectedUser?.watchlist}
                                        watchedList={selectedUser?.watchedList}
                                    />
                                </Box>

                                <Box sx={{ display: !selectedUserWatchedListMovies?.length > 0 ? "none" : "block"}}>
                                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: "40px", ml: "40px", mb: "-20px" }}>
                                        Watched History
                                    </Typography>
                                    <ImageCardList
                                    movies={selectedUserWatchedListMovies}
                                    favorites={selectedUser?.favorites}
                                    watchList={selectedUser?.watchlist}
                                    watchedList={selectedUser?.watchedList}
                                    />
                                </Box>
                            </>
                        ) : (
                            <Typography variant="body1" color="textSecondary">
                                { error ? "Something went wrong"
                                    : view === "following" && !selectedUser ? "You are following no one yet"
                                        : view === "followers" && !selectedUser ? "You have no followers yet" : "No community lists available yet"}
                            </Typography>
                        )}
                    </Box>
            }

            {/* Right Pane: User images */}
            <Box sx={{ width: 300, height: '100%', overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: "column", alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: "20px", width: '100%' }}>
                    <ToggleButtonGroup
                        color="primary"
                        size="small"
                        value={view}
                        exclusive
                        onChange={handleViewChange}
                        aria-label="Community"
                    >
                        <ToggleButton value="following">Following</ToggleButton>
                        <ToggleButton value="followers">Followers</ToggleButton>
                        <ToggleButton value="global">Global</ToggleButton>
                    </ToggleButtonGroup>
                    <TextField
                        label="Search Users"
                        size="small"
                        variant="outlined"
                        value={searchTerm}
                        fullWidth
                        onChange={handleSearchChange}
                        sx={{
                            width: '100%',
                            marginTop: 2,
                            borderRadius: '50px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '50px',
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: 14, // Adjust label font size
                            },
                            '& .MuiInputBase-input': {
                                fontSize: 14, // Adjust input font size
                            },
                        }}
                    />
                </Box>

                {allUsersData && allUsersData.length > 0 && renderUserList()}
            </Box>
        </Box>
    );
};

export default CommunityPage;