import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/movie-requests`;
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";


// Helper function to generate the current timestamp
const getCurrentTimestamp = () => new Date().toISOString();

// Fetch all movie requests
export const fetchMovieRequests = createAsyncThunk(
    'movieRequests/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error("Failed to fetch movie requests");
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Approve a movie request
export const approveMovieRequest = createAsyncThunk(
    'movieRequests/approve',
    async ({ requestId, title, mediaType }, { rejectWithValue }) => {
        try {
            // 🔎 Fetch the movie from TMDB
            const response = await fetch(
                `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
            );

            if (!response.ok) throw new Error("TMDB request failed");

            const data = await response.json();

            // If the movie does not exist in TMDB, reject the request
            if (!data.results || data.results.length === 0) {
                return rejectWithValue(`Movie "${title}" not found on TMDB`);
            }

            // If the movie exists, update the request status
            const updateResponse = await fetch(`${API_BASE_URL}/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "approved",
                    updatedAt: getCurrentTimestamp(),
                    tmdb_id: data.results[0].id, // Store TMDB ID for reference
                })
            });

            if (!updateResponse.ok) throw new Error("Failed to approve request");

            return await updateResponse.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Decline a movie request
export const declineMovieRequest = createAsyncThunk(
    'movieRequests/decline',
    async (requestId, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "declined",  updatedAt: getCurrentTimestamp() })
            });

            if (!response.ok) throw new Error("Failed to decline request");
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const movieRequestsSlice = createSlice({
    name: "movieRequests",
    initialState: {
        requests: [],
        status: "idle",
        loading: false,
        error: null,
    },
    reducers: {}, // No normal reducers needed since we use async thunks
    extraReducers: (builder) => {
        builder
            // Fetch all movie requests
            .addCase(fetchMovieRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMovieRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = action.payload;
            })
            .addCase(fetchMovieRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Approve Request
            .addCase(approveMovieRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveMovieRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = state.requests.map(request =>
                    request.id === action.payload.id ? action.payload : request
                );
            })
            .addCase(approveMovieRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Decline Request
            .addCase(declineMovieRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(declineMovieRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.requests = state.requests.map(request =>
                    request.id === action.payload.id ? action.payload : request
                );
            })
            .addCase(declineMovieRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default movieRequestsSlice.reducer;
