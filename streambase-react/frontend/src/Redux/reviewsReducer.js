import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = `${import.meta.env.VITE_API_URL}/reviews/`;

// Fetch reviews for a specific movie
export const fetchReviews = createAsyncThunk(
    'reviews/fetchReviews',
    async () => {
        try{
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch reviews");
            }

            return response.json();
        }
        catch(err){
            console.log("Network error: ", err);
            return []
        }
    }
);

// Add or update review
export const postOrUpdateReview = createAsyncThunk(
    'reviews/postOrUpdateReview',
    async ({ reviewData, reviewId }) => {
        const timestamp = new Date().toISOString();
        const reviewWithTimestamp = { ...reviewData, createdAt: timestamp, updatedAt: timestamp };

        if (reviewId) {
            // Update existing review
            const response = await fetch(API_URL + reviewId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewWithTimestamp),
            });

            if (!response.ok) {
                throw new Error('Failed to update the review');
            }

            return response.json();
        } else {
            // Add new review
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewWithTimestamp),
            });

            if (!response.ok) {
                throw new Error('Failed to add the review');
            }

            return response.json();
        }
    }
);

// Add or update reply to an existing review
export const postOrUpdateReply = createAsyncThunk(
    'reviews/postOrUpdateReply',
    async ({ reviewId, replyData }) => {
        const timestamp = new Date().toISOString();
        const replyWithTimestamp = { ...replyData, createdAt: timestamp, updatedAt: timestamp };

        // First, fetch the review we want to reply to
        const reviewResponse = await fetch(API_URL + reviewId);
        if (!reviewResponse.ok) {
            throw new Error('Failed to fetch the review');
        }

        const review = await reviewResponse.json();

        // Add the reply to the review's replies array
        review.replies.push(replyWithTimestamp);

        // Now, update the review with the new replies array
        const updateResponse = await fetch(API_URL + reviewId, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(review),
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update the review with the reply');
        }

        return updateResponse.json(); // Return the updated review with the new reply
    }
);

// Slice definition
const reviewsReducer = createSlice({
    name: 'reviews',
    initialState: {
        reviews: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchReviews.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchReviews.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.reviews = action.payload;
            })
            .addCase(fetchReviews.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(postOrUpdateReview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(postOrUpdateReview.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // If we are adding a new review, push it to the reviews array
                if (!action.payload.id) {
                    state.reviews.push(action.payload);
                } else {
                    // If it's an update, replace the old review
                    const index = state.reviews.findIndex(review => review.id === action.payload.id);
                    if (index !== -1) {
                        state.reviews[index] = action.payload;
                    }
                }
            })
            .addCase(postOrUpdateReview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(postOrUpdateReply.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(postOrUpdateReply.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.reviews.findIndex(review => review.id === action.payload.id);
                if (index !== -1) {
                    state.reviews[index] = action.payload; // Replace with the updated review
                }
            })
            .addCase(postOrUpdateReply.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default reviewsReducer.reducer;