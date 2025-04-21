import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import {options} from '../tmdbKey.jsx'

const TMDB_URL = "https://api.themoviedb.org/3/";

export const fetchTMDBMovieData = async (url) => {
    try {
        const res = await fetch(url, options);

        if (!res.ok) {
            throw new Error('Failed to fetch movie data');
        }

        const data = await res.json();
        return data?.results || data || [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const fetchVideo = async ({movieId, mediaType}) => {
    try {
        if (!movieId) {
            console.error("movie id is undefined");
            return [];
        }

        // Fetch the video data from the TMDB API for the specified movie
        const videoData = mediaType === "tv"
            ? await fetchTMDBMovieData(`https://api.themoviedb.org/3/tv/${movieId}/videos?language=en-US`)
            : await fetchTMDBMovieData(`https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`);


        // Return the video data (for example, the first video)
        return videoData.length > 0 ? videoData : []; // Check if there are videos available
    } catch (error) {
        console.error('Error fetching video data:', error);
        return [];
    }
};

// JSON movies fetch function
const fetchJSONMovieData = async () => {
    const movieResponse = await fetch(`${import.meta.env.VITE_API_URL}/movies`);

    if (!movieResponse.ok) {
        throw new Error('Failed to update the review');
    }

    return await movieResponse.json();
}

// Centralized genre fetch function
const fetchGenreMovies = (genreId) => {
    return fetchTMDBMovieData(`${TMDB_URL}discover/movie?with_genres=${genreId}&include_adult=false&include_video=true&language=en-US`);
};

// Centralized upcoming movies fetch function
const fetchUpcomingMovies = async () => {
    const today = new Date();

    const nextThreeMonths = () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setMonth(today.getMonth() + 3);

        return futureDate;
    };

    return fetchTMDBMovieData(`${TMDB_URL}discover/movie?include_adult=false&include_video=true&language=en-US&page=1&primary_release_date.gte=${today}&primary_release_date.lte=${nextThreeMonths()}&release_date.gte=${today}&release_date.lte=${nextThreeMonths()}&sort_by=popularity.desc`);
};

// Thunks for fetching data
export const fetchJSONMovies = createAsyncThunk("movies/fetchJSONMovies", async () => {
    return await fetchJSONMovieData()
})

export const fetchMoviesByGenre = createAsyncThunk("movies/fetchMoviesByGenre", async (genreId) => {
    const movies = await fetchGenreMovies(genreId);
    return {genreId: genreId, movies: movies}
});


export const fetchTrendingMovies = createAsyncThunk("movies/fetchTrendingMovies", async () => {
    return await fetchTMDBMovieData(`${TMDB_URL}trending/movie/week?include_adult=false&include_video=true&language=en-US`)
});

export const fetchTrendingTV = createAsyncThunk("movies/fetchTrendingTV", async () => {
    return await fetchTMDBMovieData(`${TMDB_URL}trending/tv/day?language=en-US`)
});

export const fetchUpcoming = createAsyncThunk("movies/fetchUpcoming", async () => {
    return await fetchUpcomingMovies()
});

export const fetchSimilarMovies = createAsyncThunk(
    "movies/fetchSimilarMovies",
    async ({movieId, mediaType = "movie"}) => {
        return await fetchTMDBMovieData(
            `${TMDB_URL}${mediaType}/${movieId}/similar?language=en-US&page=1`
        );
    }
);

export const fetchVideos = createAsyncThunk("movies/fetchVideos", async (movieId) => {
    return await fetchVideo({movieId})
});


// Movie slice
const moviesReducer = createSlice({
    name: "movies",
    initialState: {
        jsonMovies: [],
        genreMovies: {},
        trendingMovies: [],
        trendingTV: [],
        upcoming: [],
        similarMovies: [],
        videos: [],
        status: "idle",
        error: null,
        loading: {
            jsonMovies: false,
            genreMovies: {},
            trendingMovies: false,
            trendingTV: false,
            upcoming: false,
            similarMovies: false,
            videos: false,
        },
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchJSONMovies.pending, (state) => {
                state.loading.jsonMovies = true;
            })
            .addCase(fetchJSONMovies.fulfilled, (state, action) => {
                state.loading.jsonMovies = false;
                state.jsonMovies = action.payload;
            })
            .addCase(fetchJSONMovies.rejected, (state, action) => {
                state.loading.jsonMovies = false;
                state.error = action.error.message;
            })
            .addCase(fetchMoviesByGenre.pending, (state, action) => {
                const genreId = action.meta.arg;
                if (genreId) {
                    state.loading.genreMovies[genreId] = true;
                }
            })
            .addCase(fetchMoviesByGenre.fulfilled, (state, action) => {
                const {genreId, movies} = action.payload;
                state.loading.genreMovies[genreId] = false;
                state.genreMovies[genreId] = movies;
            })
            .addCase(fetchMoviesByGenre.rejected, (state, action) => {
                const genreId = action.meta.arg;
                if (genreId) {
                    state.loading.genreMovies[genreId] = false;
                }
                state.error = action.error.message;
            })
            .addCase(fetchTrendingMovies.pending, (state) => {
                state.loading.trendingMovies = true;
            })
            .addCase(fetchTrendingMovies.fulfilled, (state, action) => {
                state.loading.trendingMovies = false;
                state.trendingMovies = action.payload;
            })
            .addCase(fetchTrendingMovies.rejected, (state, action) => {
                state.loading.trendingMovies = false;
                state.error = action.error.message;
            })
            .addCase(fetchTrendingTV.pending, (state) => {
                state.loading.trendingTV = true;
            })
            .addCase(fetchTrendingTV.fulfilled, (state, action) => {
                state.loading.trendingTV = false;
                state.trendingTV = action.payload;
            })
            .addCase(fetchTrendingTV.rejected, (state, action) => {
                state.loading.trendingTV = false;
                state.error = action.error.message;
            })
            .addCase(fetchUpcoming.pending, (state) => {
                state.loading.upcoming = true;
            })
            .addCase(fetchUpcoming.fulfilled, (state, action) => {
                state.loading.upcoming = false;
                state.upcoming = action.payload;
            })
            .addCase(fetchUpcoming.rejected, (state, action) => {
                state.loading.upcoming = false;
                state.error = action.error.message;
            })
            .addCase(fetchSimilarMovies.pending, (state) => {
                state.loading.similarMovies = true;
            })
            .addCase(fetchSimilarMovies.fulfilled, (state, action) => {
                state.loading.similarMovies = false;
                state.similarMovies = action.payload;
            })
            .addCase(fetchSimilarMovies.rejected, (state, action) => {
                state.loading.similarMovies = false;
                state.error = action.error.message;
            })
            .addCase(fetchVideos.pending, (state) => {
                state.loading.videos = true;
            })
            .addCase(fetchVideos.fulfilled, (state, action) => {
                state.loading.videos = false;
                state.videos = action.payload;
            })
            .addCase(fetchVideos.rejected, (state, action) => {
                state.loading.videos = false;
                state.error = action.error.message;
            });
    },
});

export default moviesReducer.reducer;
