import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {fetchTMDBMovieData} from "./moviesReducer.js";

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const fetchMoviesList = async (moviesData) => {
    if (!moviesData || moviesData.length === 0) {
        return [];
    }

    const movieList = [];

    for (let movie of moviesData) {
        const { id, media_type } = movie;

        if (media_type === "movie") {
            const movieData = await fetchTMDBMovieData(`https://api.themoviedb.org/3/movie/${id}?language=en-US`);
            if (movieData) {
                movieList.push(movieData);
            }
        }

        if (media_type === "tv") {
            const movieData = await fetchTMDBMovieData(`https://api.themoviedb.org/3/tv/${id}?language=en-US`);
            if (movieData) {
                movieList.push(movieData);
            }
        }
    }

    return movieList;
};


// Define async thunks for fetching and updating data
export const fetchUserData = createAsyncThunk(
    'user/fetchUserData',
    async (email) => {
        try {
            const response = await fetch(`${API_URL}?email=${email}`);

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();

            if (!userData.length) return;

            return {
                id: userData[0].id,
                image: userData[0].image || '',
                moviePreferences: userData[0].moviePreferences || [],
                favorites: userData[0].favorites || [],
                watchlist: userData[0].watchlist || [],
                watchedList: userData[0].watchedList || [],
                following: userData[0].following || [],
            };
        } catch (error) {
            // Catch network errors or other errors
            console.error('Error fetching user data:', error);
            throw new Error(error.message || "Failed to fetch user data");
        }
    }
);

export const fetchUsersData = createAsyncThunk(
    'user/fetchUsersData',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch users data: ${response.status} ${response.statusText}`);
            }

            const usersData = await response.json();

            return usersData.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image || '',
                moviePreferences: user.moviePreferences || [],
                favorites: user.favorites || [],
                watchlist: user.watchlist || [],
                watchedList: user.watchedList || [],
                following: user.following || [],
            }));
        } catch (error) {
            console.error('Error fetching users data:', error);
            return rejectWithValue(error.message || 'Failed to fetch users data');
        }
    }
);

export const addToFavorites = createAsyncThunk(
    'user/addToFavorites',
    async ({ email, movieId, movieName, media_type }) => {
        try{
        const response = await fetch(`${API_URL}?email=${email}`);

        if (!response.ok) {
            throw new Error('Failed to add movie to favorites');
        }

        const responseData = await response.json();
        const user = responseData[0];

        // Ensure favorites list exists
        const existingFavorites = user.favorites || [];

        // Check if the movie already exists in the favorites list
        const movieExists = existingFavorites.some(movie =>
            movie.id === movieId && movie.media_type === media_type && movie.title === movieName
        );

        // If the movie already exists, return early without making a PATCH request
        if (movieExists) {
            return {
                email: user.email,
                favorites: existingFavorites,
            };
        }

        // Create the movie object
        const movieData = { id: movieId, title: movieName, media_type: media_type };

        // Add the movie to the favorites list
        const updatedFavorites = [...existingFavorites, movieData];

        // Send updated favorites list to API
        const updateResponse = await fetch(`${API_URL}/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ favorites: updatedFavorites }),
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update favorites');
        }

        const updatedUser = await updateResponse.json();
        return {
            email: updatedUser.email,
            favorites: updatedUser.favorites,
        };
        } catch (error) {
            console.error('Error adding movie to favorites:', error);
            throw new Error(error.message || "Failed to add movie to favorites");
        }
    }
);

export const addToWatchlist = createAsyncThunk(
    'user/addToWatchlist',
    async ({ email, movieId, movieName, media_type }) => {
        try{
            const response = await fetch(`${API_URL}?email=${email}`);

            if (!response.ok) {
                throw new Error('Failed to add movie to watchlist');
            }

            const responseData = await response.json();
            const user = responseData[0];

            // Ensure watchlist exists
            const existingWatchlist = user.watchlist || [];

            // Check if movie already exists in watchlist
            const movieExists = existingWatchlist.some(movie =>
                movie.id === movieId && movie.media_type === media_type && movie.title === movieName
            );

            // If the movie already exists, return early without making a PATCH request
            if (movieExists) {
                return {
                    email: user.email,
                    watchlist: existingWatchlist,
                };
            }

            // Create the movie object
            const movieData = { id: movieId, title: movieName, media_type: media_type };

            // Add the movie to the watchlist
            const updatedWatchlist = [...existingWatchlist, movieData];

            // Send updated watchlist to API
            const updateResponse = await fetch(`${API_URL}/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ watchlist: updatedWatchlist }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update watchlist');
            }

            const updatedUser = await updateResponse.json();
            return {
                email: updatedUser.email,
                watchlist: updatedUser.watchlist,
            };
        } catch(error) {
            console.error('Error adding movie to watchlist:', error);
            throw new Error(error.message || "Failed to add movie to watchlist");
        }
    }
);

export const addToWatchedList = createAsyncThunk(
    'user/addToWatchedList',
    async ({ email, movieId, movieName, media_type }) => {
        try{

        } catch (error){
            console.error('Error adding movie to watchedlist:', error);
            throw new Error(error.message || "Failed to add movie to watchedlist");
        }
        const response = await fetch(`${API_URL}?email=${email}`);

        if (!response.ok) {
            throw new Error('Failed to add movie to watch history');
        }

        const responseData = await response.json();
        const user = responseData[0];

        // Create the movie object
        const movieData = { id: movieId, title: movieName, media_type: media_type };

        // Check if the movie already exists in the watched list
        const existingWatchedList = user.watchedList || [];
        const movieExists = existingWatchedList.some(movie =>
            movie.id === movieId && movie.media_type === media_type && movie.title === movieName
        );

        // If the movie already exists, return the existing user data without making a PATCH request
        if (movieExists) {
            return {
                email: user.email,
                watchedList: existingWatchedList,
            };
        }

        // Otherwise, add the movie and make the PATCH request
        const updatedWatchedList = [...existingWatchedList, movieData];

        const updateResponse = await fetch(`${API_URL}/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ watchedList: updatedWatchedList }),
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update watched list');
        }

        const updatedUser = await updateResponse.json();
        return {
            email: updatedUser.email,
            watchedList: updatedUser.watchedList,
        };
    }
);

export const removeFromFavorites = createAsyncThunk(
    'user/removeFromFavorites',
    async ({ email, movieId }) => {
        try{
            const response = await fetch(`${API_URL}?email=${email}`);

            if (!response.ok) {
                throw new Error('Failed to remove movie from favorites');
            }

            const responseData = await response.json();
            const user = responseData[0];

            // Remove the movie from the favorites array
            const updatedFavorites = user.favorites.filter(movie => movie.id !== movieId);

            // Update the user's favorites in the database
            const updateResponse = await fetch(`${API_URL}/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ favorites: updatedFavorites }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update favorites');
            }

            const updatedUser = await updateResponse.json();
            return {
                email: updatedUser.email,
                favorites: updatedUser.favorites,
            };
        } catch (error) {
            console.error('Error removing movie from favorites:', error);
            throw new Error(error.message || "Failed to remove movie from favorites");
        }
    }
);

export const removeFromWatchlist = createAsyncThunk(
    'user/removeFromWatchlist',
    async ({ email, movieId }) => {
        try{
            const response = await fetch(`${API_URL}?email=${email}`);

            if (!response.ok) {
                throw new Error('Failed to remove movie from watchlist');
            }

            const responseData = await response.json();
            const user = responseData[0];

            // Remove the movie from the watchlist array
            const updatedWatchlist = user.watchlist.filter(movie => movie.id !== movieId);

            // Update the user's watchlist in the database
            const updateResponse = await fetch(`${API_URL}/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ watchlist: updatedWatchlist }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update watchlist');
            }

            const updatedUser = await updateResponse.json();
            return {
                email: updatedUser.email,
                watchlist: updatedUser.watchlist,
            };
        } catch (error){
            console.error('Error removing movie from watchlist:', error);
            throw new Error(error.message || "Failed to remove movie from watchlist");
        }
    }
);

export const removeFromWatchedList = createAsyncThunk(
    'user/removeFromWatchedList',
    async ({ email, movieId }) => {
        try{
            const response = await fetch(`${API_URL}?email=${email}`);

            if (!response.ok) {
                throw new Error('Failed to remove movie from watched list');
            }

            const responseData = await response.json();
            const user = responseData[0];

            // Remove the movie from the watched list array
            const updatedWatchedList = user.watchedList.filter(movie => movie.id !== movieId);

            // Update the user's watched list in the database
            const updateResponse = await fetch(`${API_URL}/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ watchedList: updatedWatchedList }),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update watched list');
            }

            const updatedUser = await updateResponse.json();
            return {
                email: updatedUser.email,
                watchedList: updatedUser.watchedList,
            };
        } catch (error){
            console.error('Error removing movie from watchedlist:', error);
            throw new Error(error.message || "Failed to remove movie from watchedlist");
        }
    }
);

// Follow a user (add userId to following array)
export const followUser = createAsyncThunk(
    'user/followUser',
    async ({ currentUserId, targetUserId }) => {
        try{
            // Fetch current user's data
            const userResponse = await fetch(`${API_URL}/${currentUserId}`);
            if (!userResponse.ok) throw new Error('Failed to fetch user data');
            const userData = await userResponse.json();

            // Fetch target user's data
            const targetUserResponse = await fetch(`${API_URL}/${targetUserId}`);
            if (!targetUserResponse.ok) throw new Error('Failed to fetch target user data');
            const targetUserData = await targetUserResponse.json();

            // Update following list for the current user
            const updatedFollowing = [...(userData.following || []), targetUserId];

            // Update followers list for the target user
            const updatedFollowers = [...(targetUserData.followers || []), currentUserId];

            // Update both users in parallel
            await Promise.all([
                fetch(`${API_URL}/${currentUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ following: updatedFollowing }),
                }),
                fetch(`${API_URL}/${targetUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ followers: updatedFollowers }),
                })
            ]);

            return { following: updatedFollowing, followers: updatedFollowers };
        } catch (error){
            console.error('Error following user:', error);
            throw new Error(error.message || "Failed to follow user");
        }
    }
);


// Unfollow a user (remove userId from following array)
export const unfollowUser = createAsyncThunk(
    'user/unfollowUser',
    async ({ currentUserId, targetUserId }) => {
        try{
            // Fetch current user's data
            const userResponse = await fetch(`${API_URL}/${currentUserId}`);
            if (!userResponse.ok) throw new Error('Failed to fetch user data');
            const userData = await userResponse.json();

            // Fetch target user's data
            const targetUserResponse = await fetch(`${API_URL}/${targetUserId}`);
            if (!targetUserResponse.ok) throw new Error('Failed to fetch target user data');
            const targetUserData = await targetUserResponse.json();

            // Remove target user from current user's following list
            const updatedFollowing = (userData.following || []).filter(id => id !== targetUserId);

            // Remove current user from target user's followers list
            const updatedFollowers = (targetUserData.followers || []).filter(id => id !== currentUserId);

            // Update both users in parallel
            await Promise.all([
                fetch(`${API_URL}/${currentUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ following: updatedFollowing }),
                }),
                fetch(`${API_URL}/${targetUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ followers: updatedFollowers }),
                })
            ]);

            return { following: updatedFollowing, followers: updatedFollowers };
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw new Error(error.message || "Failed to unfollow user");
        }
    }
);


const usersSlice = createSlice({
    name: 'usersMovies',
    initialState: {
        currentUserData: {},
        allUsersData: [],
        status: 'idle',
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch user data
            .addCase(fetchUserData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData = action.payload;  // Set the fetched user data (without sensitive data)
            })
            .addCase(fetchUserData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch user data
            .addCase(fetchUsersData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsersData.fulfilled, (state, action) => {
                state.loading = false;
                state.allUsersData = action.payload;  // Set the fetched users data (without sensitive data)
            })
            .addCase(fetchUsersData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Add movie to favorites
            .addCase(addToFavorites.pending, (state) => {
                state.loading = true;
            })
            .addCase(addToFavorites.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.favorites = action.payload.favorites;  // Update favorites list
            })
            .addCase(addToFavorites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Add movie to watchlist
            .addCase(addToWatchlist.pending, (state) => {
                state.loading = true;
            })
            .addCase(addToWatchlist.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.watchlist = action.payload.watchlist;  // Update watchlist
            })
            .addCase(addToWatchlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Add movie to watchedList
            .addCase(addToWatchedList.pending, (state) => {
                state.loading = true;
            })
            .addCase(addToWatchedList.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.watchedList = action.payload.watchedList;  // Update watchedList
            })
            .addCase(addToWatchedList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(removeFromFavorites.pending, (state) => {
                state.loading = true;
            })
            .addCase(removeFromFavorites.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.favorites = action.payload.favorites;  // Update favorites list
            })
            .addCase(removeFromFavorites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(removeFromWatchlist.pending, (state) => {
                state.loading = true;
            })
            .addCase(removeFromWatchlist.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.watchlist = action.payload.watchlist;  // Update watchlist
            })
            .addCase(removeFromWatchlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(removeFromWatchedList.pending, (state) => {
                state.loading = true;
            })
            .addCase(removeFromWatchedList.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUserData.watchedList = action.payload.watchedList;  // Update watchedList
            })
            .addCase(removeFromWatchedList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(followUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(followUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentUserData) {
                    state.currentUserData.following = action.payload.following;
                    state.currentUserData.followers = action.payload.followers;
                }
            })
            .addCase(followUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(unfollowUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(unfollowUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                if (state.currentUserData) {
                    state.currentUserData.following = action.payload.following;
                    state.currentUserData.followers = action.payload.followers;
                }
            })
            .addCase(unfollowUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default usersSlice.reducer;