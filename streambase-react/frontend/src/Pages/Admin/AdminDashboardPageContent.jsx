import React, {useState, useEffect} from 'react';
import { Card, CardContent, Typography, Box, Grid, Avatar } from '@mui/material';
import {BarChart} from '@mui/x-charts/BarChart';
import {useDispatch, useSelector} from "react-redux";
import {fetchMoviesList, fetchUsersData} from "../../Redux/userDataReducer.js";
import {fetchJSONMovies} from "../../Redux/moviesReducer.js";
import {useNavigate} from "react-router-dom";

// Function to calculate total movies
const getTotalMovies = (movies) => {
    console.log(movies.length);
    // Use a Set to store unique movie IDs
    const uniqueMovies = new Set();

    movies.forEach(movie => {
        if (movie.id) {
            uniqueMovies.add(movie.id); // Only add unique movie IDs
        }
    });

    return uniqueMovies.size; // Return the total count of unique movies
};


// Function to calculate total users
const getTotalUsers = (users) => users.length;

// Function to get top 10 favorites with media type
const getTopFavorites = (users) => {
    const favoritesCount = {};

    users.forEach(user => {
        if (!user.favorites) return;

        user.favorites.forEach(movie => {
            const key = `${movie.id}-${movie.media_type}`;
            if (!favoritesCount[key]) {
                favoritesCount[key] = { id: movie.id, media_type: movie.media_type, count: 0 };
            }
            favoritesCount[key].count += 1;
        });
    });

    return Object.values(favoritesCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
};

// Function to get top 10 watchlist items with media type
const getTopWatchlist = (users) => {
    const watchlistCount = {};

    users.forEach(user => {
        if (!user.watchlist) return;

        user.watchlist.forEach(movie => {
            const key = `${movie.id}-${movie.media_type}`;
            if (!watchlistCount[key]) {
                watchlistCount[key] = { id: movie.id, media_type: movie.media_type, count: 0 };
            }
            watchlistCount[key].count += 1;
        });
    });

    return Object.values(watchlistCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
};

// Function to get top 10 watched items with media type
const getTopWatched = (users) => {
    const watchedCount = {};

    users.forEach(user => {
        if (!user.watchedList) return;

        user.watchedList.forEach(movie => {
            const key = `${movie.id}-${movie.media_type}`;
            if (!watchedCount[key]) {
                watchedCount[key] = { id: movie.id, media_type: movie.media_type, count: 0 };
            }
            watchedCount[key].count += 1;
        });
    });

    return Object.values(watchedCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
};

// Function to get movies by year and media type
const getMoviesByYearAndMediaType = (movies) => {
    const uniqueMovies = new Map(); // Use Map to store unique objects by ID
    movies.forEach(movie => {
        if (movie && !uniqueMovies.has(movie.id)) {
            uniqueMovies.set(movie.id, movie); // Store movie using its ID as the key
        }
    });

    const uniqueMoviesArray = Array.from(uniqueMovies.values()); // Convert Map back to an array
    const moviesByYear = {};

    uniqueMoviesArray.forEach(movie => {
        // Ensure `released` exists and extract the year
        let year = movie.released ? new Date(movie.released).getFullYear() : NaN;

        // If year is NaN, default to 1800
        if (isNaN(year)) {
            year = "Unknown";
        }

        // Initialize the year entry if it doesn't exist
        if (!moviesByYear[year]) {
            moviesByYear[year] = { movie: 0, tv: 0 };
        }

        // Increment count based on media type
        if (movie.media_type === "movie") {
            moviesByYear[year].movie += 1;
        } else if (movie.media_type === "tv") {
            moviesByYear[year].tv += 1;
        }
    });

    // Sort years and prepare x-axis labels
    const years = Object.keys(moviesByYear).map(year => String(year)).sort();

    // Prepare series data for BarChart
    const movieData = years.map(year => moviesByYear[year].movie);
    const tvData = years.map(year => moviesByYear[year].tv);

    return {
        xLabels: years, // Labels for x-axis
        movieData,
        tvData
    };
};

const TotalsInsightsCard = ({title, total}) => {

    return (
        <Card sx={{ height: '48%', borderRadius: '20px'}}>
        <CardContent>
            <Typography variant="h5" textAlign="center" component="div" marginBottom={"20px"} fontWeight={"bold"}>
                {title}
            </Typography>
            <Typography variant="h2" textAlign="center" fontWeight={"bold"} sx={{ alignItems: "center" }}>
                {total}
            </Typography>
        </CardContent>
        </Card>
    )
}

const TopMoviesInsightCard = ({title, movies}) => {
    const navigate = useNavigate();

    return (
        <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '400px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Typography variant="h5" textAlign="center" component="div" fontWeight={"bold"}>
                        {title}
                    </Typography>
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: "column",
                            mt: "10px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            maxHeight: "calc(100% - 40px)" // Adjust based on content
                        }}
                    >
                        {movies.map((movie, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: '10px',
                                    cursor: "pointer",
                                    padding: "10px",
                                    "&:hover": {
                                        backgroundColor: "rgba(67,67,67,0.1)",
                                        borderRadius: "25px",
                                    }
                                }}
                                onClick={() => navigate(`/watch/${movie.id}`)}
                            >
                                <Avatar
                                    src={`https://image.tmdb.org/t/p/original/${movie.poster_path}`}
                                    sx={{ width: 30, height: 30 }}
                                />
                                <Typography>
                                    {`${movie.title || movie.name} - ${movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4)}`}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    )
}

const Dashboard = () => {
    const [totalMovies, setTotalMovies] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [topFavorites, setTopFavorites] = useState([]);
    const [topWatchlist, setTopWatchlist] = useState([]);
    const [topWatched, setTopWatched] = useState([]);
    const [moviesByYearAndMediaType, setMoviesByYearAndMediaType] = useState(null);
    const {allUsersData}= useSelector((state) => state.usersData);
    const movies = useSelector((state) => state.movies.jsonMovies);
    const dispatch = useDispatch();

    // Fetch users data when the component mounts
    useEffect(() => {
        if (!allUsersData || allUsersData.length === 0 || !movies) {
            const fetchUsersMovies = async () => {
                try {
                    await dispatch(fetchUsersData());
                    await dispatch(fetchJSONMovies());
                } catch (err) {
                    console.error("Error fetching users' movies: ", err);
                }
            };

            fetchUsersMovies();
        }
    }, [dispatch, allUsersData, movies]);

    // Find insights
    useEffect(() => {
        const fetchAllData = () => {
            if (!allUsersData || allUsersData.length === 0) return;
            const users = getTotalUsers(allUsersData);
            const favourites = getTopFavorites(allUsersData);
            const watchlist = getTopWatchlist(allUsersData);
            const watched = getTopWatched(allUsersData);

            setTotalUsers(users);
            const fetchUserMovieLists = async () => {
                try {
                    if (!favourites && !watchlist && !watched) return;

                    // Extract movie details for each category
                    const favoriteDetails = favourites?.map(item => ({
                        id: item.id,
                        media_type: item.media_type
                    })) || [];

                    const watchlistDetails = watchlist?.map(item => ({
                        id: item.id,
                        media_type: item.media_type
                    })) || [];

                    const watchedDetails = watched?.map(item => ({
                        id: item.id,
                        media_type: item.media_type
                    })) || [];

                    // Fetch all lists concurrently
                    const [favoriteMovies, watchlistMovies, watchedMovies] = await Promise.all([
                        favoriteDetails.length > 0 ? fetchMoviesList(favoriteDetails) : Promise.resolve([]),
                        watchlistDetails.length > 0 ? fetchMoviesList(watchlistDetails) : Promise.resolve([]),
                        watchedDetails.length > 0 ? fetchMoviesList(watchedDetails) : Promise.resolve([])
                    ]);

                    // Update state or return the fetched lists
                    setTopFavorites(favoriteMovies);
                    setTopWatchlist(watchlistMovies);
                    setTopWatched(watchedMovies);

                } catch (error) {
                    console.error("Error fetching user movie lists:", error);
                }
            };
            fetchUserMovieLists()
        };

        fetchAllData();
    }, [allUsersData, dispatch]);

    useEffect(() => {
        const total = getTotalMovies(movies);
        const moviesByYearAndMediaType = getMoviesByYearAndMediaType(movies);

        setTotalMovies(total);
        setMoviesByYearAndMediaType(moviesByYearAndMediaType);
    }, [dispatch, movies])

    return (
        <Box sx={{ width: '100%', height: "100%", display: 'flex', flexDirection: "column", justifyContent: 'space-between', alignItems: 'flex-start', padding: "20px" }}>
            <Grid container spacing={2} sx={{ width: "100%", height: "50%", display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                <Grid item xs={0} sm={0} md={3} spacing={2} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <TotalsInsightsCard title={"Total Movies"} total={totalMovies} />
                    <TotalsInsightsCard title={"Total Users"} total={totalUsers} />
                </Grid>
                <TopMoviesInsightCard title={"Top 10 Favorites"} movies={topFavorites}/>
                <TopMoviesInsightCard title={"Top 10 Watchlist"} movies={topWatchlist}/>
                <TopMoviesInsightCard title={"Top 10 Watched"} movies={topWatched}/>
            </Grid>

            {
                moviesByYearAndMediaType && (
                    <Grid item xs={12} sm={12} md={6} sx={{ marginTop: "20px", marginBottom: "20px", height: "100%", width: "99%" }}>
                        <Card sx={{ height: '100%', borderRadius: '20px', padding: "20px" }}>
                            <Typography variant="h5" textAlign="center" component="div" fontWeight={"bold"}>
                                Movies by year of release and media type
                            </Typography>
                            <Box sx={{ height: "92%", width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                                <BarChart
                                    sx={{ width: "100%", height: "100%" }}
                                    series={[
                                        { data: moviesByYearAndMediaType.movieData, label: 'Movies', id: 'moviesId' },
                                        { data: moviesByYearAndMediaType.tvData, label: 'TV Shows', id: 'tvId' },
                                    ]}
                                    xAxis={[{ data: moviesByYearAndMediaType.xLabels, scaleType: 'band' }]}
                                />
                            </Box>
                        </Card>
                    </Grid>
                )
            }
        </Box>
    );
};

export default Dashboard;
