import React, {useEffect, useMemo, useState, useRef, useCallback} from 'react';
import MovieSlider, {MovieSwiperSkeleton} from "../../Components/MovieCards&Slider/movieSlider.jsx";
import Footer from "../../Components/footer/footer.jsx";
import {Box, CircularProgress} from "@mui/material";
import {useSelector, useDispatch} from 'react-redux';
import {
    fetchMoviesByGenre,
    fetchSimilarMovies,
    fetchTrendingMovies,
    fetchTrendingTV,
    fetchUpcoming
} from '../../Redux/moviesReducer.js';
import {fetchUserData} from "../../Redux/userDataReducer.js";

const genres = [
    {id: 28, name: "Action Packed"},
    {id: 12, name: "Ready for Adventure?"},
    {id: 53, name: "Spine Thrillers"},
    {id: 35, name: "Comedy - Laugh Out Loud"},
    {id: 16, name: "Kids corner"},
    {id: 9648, name: "Unravelling Mystery"},
    {id: 18, name: "Drama Hits"},
    {id: 10751, name: "Family Favourites"},
    {id: 10752, name: "At War"},
    {id: 80, name: "Crime Busters"},
    {id: 14, name: "Fantasy Adventures"},
    {id: 27, name: "Horror Films"},
    {id: 878, name: "Science Fiction"},
    {id: 10749, name: "Romantic Movies"},
    {id: 99, name: "Documentaries"},
];

const LoadingSkeleton = () => (
    <Box sx={{display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", width: "98%"}}>
        <MovieSwiperSkeleton/>
    </Box>
);

const SECTIONS_PER_BATCH = 3;

const UserWelcomePageContent = () => {
    const dispatch = useDispatch();
    const {trendingMovies, trendingTV, upcoming, similarMovies, genreMovies} = useSelector((state) => state.movies);
    const currentUserData = useSelector((state) => state.usersData.currentUserData);
    const loading = useSelector((state) => state.movies.loading);

    const validWatched = currentUserData.watchedList?.filter(
        (movie) => movie?.id && movie?.title && movie?.media_type
    ) || [];

    const userWatched = useMemo(() => {
        if (validWatched.length === 0) return null;
        return validWatched[Math.floor(Math.random() * validWatched.length)];
    }, [validWatched]);

    const userData = JSON.parse(localStorage.getItem("user"));

    const [count, setCount] = useState(0);
    const [loadedBatches, setLoadedBatches] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Track which sections have been fetched to avoid re-fetching
    const fetchedSections = useRef(new Set());

    // A single ref for the sentinel element
    const loadMoreSentinelRef = useRef(null);

    // Define sections once without unnecessary dependencies
    const sections = useMemo(() => [
        {
            id: 'trendingMovies',
            name: 'Trending Movies',
            fetchAction: fetchTrendingMovies,
            isLoading: loading.trendingMovies,
            movies: trendingMovies,
        },
        {
            id: 'trendingTV',
            name: 'Trending TV',
            fetchAction: fetchTrendingTV,
            isLoading: loading.trendingTV,
            movies: trendingTV,
        },
        {
            id: 'upcoming',
            name: 'Upcoming Movies',
            fetchAction: fetchUpcoming,
            isLoading: loading.upcoming,
            movies: upcoming,
        },
        {
            id: 'similarMovies',
            name: `Because you watched ${userWatched?.title || ''}`,
            fetchAction: () => fetchSimilarMovies({movieId: userWatched?.id, mediaType: userWatched?.media_type}),
            isLoading: loading.similarMovies,
            movies: similarMovies,
            condition: () => !!userWatched
        },
        ...genres.map((genre) => ({
            id: `genre${genre.id}`,
            name: genre.name,
            fetchAction: () => fetchMoviesByGenre(genre.id),
            isLoading: loading.genreMovies[genre.id],
            movies: genreMovies[genre.id],
        }))
    ], [trendingMovies, trendingTV, upcoming, similarMovies, genreMovies, loading, userWatched]);

    // Filter sections based on conditions
    const filteredSections = useMemo(() =>
            sections.filter(section => !section.condition || section.condition()),
        [sections]);

    // Calculate how many sections should be visible based on loaded batches
    const visibleSectionCount = Math.min(
        loadedBatches * SECTIONS_PER_BATCH,
        filteredSections.length
    );

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch user data first
                await dispatch(fetchUserData(userData.email));

                // Load first batch of sections
                await loadNextBatch(0);
                setInitialLoading(false);
            } catch (error) {
                console.error("Error loading initial data:", error);
                setInitialLoading(false);
            }
        };

        loadInitialData();
    }, [dispatch, userData.email]); // eslint-disable-line react-hooks/exhaustive-deps

    // Function to load the next batch of sections
    const loadNextBatch = useCallback(async (batchIndex) => {
        if (loadingMore) return;

        const startIndex = batchIndex * SECTIONS_PER_BATCH;
        const endIndex = Math.min(startIndex + SECTIONS_PER_BATCH, filteredSections.length);

        // If we've loaded all sections, do nothing
        if (startIndex >= filteredSections.length) return;

        setLoadingMore(true);

        try {
            const batchToLoad = filteredSections.slice(startIndex, endIndex);

            // Load each section that hasn't been fetched yet
            const loadPromises = batchToLoad.map(section => {
                if (!fetchedSections.current.has(section.id)) {
                    fetchedSections.current.add(section.id);
                    return dispatch(section.fetchAction());
                }
                return Promise.resolve();
            });

            await Promise.all(loadPromises);

            // Update the number of loaded batches
            setLoadedBatches(prevBatches => Math.max(prevBatches, batchIndex + 1));
        } catch (error) {
            console.error("Error loading batch:", error);
            // Remove failed sections from fetchedSections to allow retrying
            const batchToLoad = filteredSections.slice(startIndex, endIndex);
            batchToLoad.forEach(section => {
                fetchedSections.current.delete(section.id);
            });
        } finally {
            setLoadingMore(false);
        }
    }, [dispatch, filteredSections, loadingMore]);

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        if (!loadMoreSentinelRef.current || initialLoading) return;

        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.02
        };

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting && !loadingMore) {
                loadNextBatch(loadedBatches).then(() => {
                });
            }
        }, options);

        observer.observe(loadMoreSentinelRef.current);

        return () => {
            if (loadMoreSentinelRef.current) {
                observer.unobserve(loadMoreSentinelRef.current);
            }
        };
    }, [loadedBatches, loadNextBatch, initialLoading, loadingMore]);

    // Background image rotation
    useEffect(() => {
        if (!trendingMovies?.length) return;

        const intervalId = setInterval(() => {
            setCount((prevCount) => (
                prevCount === trendingMovies.length - 1 ? 0 : prevCount + 1
            ));
        }, 10000);

        return () => clearInterval(intervalId);
    }, [trendingMovies]);

    // Render the background and content
    const renderContent = () => {
        if (initialLoading) {
            return (
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "90vh",
                    minWidth: "900px"
                }}>
                    <CircularProgress size={100}/>
                </Box>
            );
        }

        const safeBackdropPath = trendingMovies[count]?.backdrop_path ||
            (trendingMovies[(count + 1) % trendingMovies.length]?.backdrop_path || '');

        // Get the currently visible sections
        const visibleSections = filteredSections.slice(0, visibleSectionCount);

        return (
            <Box sx={{
                position: 'relative',
                width: '100%',
                height: '80%',
                backgroundImage: `url(https://image.tmdb.org/t/p/original/${safeBackdropPath})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 3s ease-in-out',
            }}>
                <Box sx={styles.overlayBox}/>
                <Box sx={styles.contentBox}>
                    {/* Only render sections that should be visible */}
                    {visibleSections.map((section) => {
                        const hasMovies = section.movies && section.movies.length > 0;

                        return (
                            <div key={section.id} style={{marginBottom: '30px'}}>
                                {section.isLoading ? (
                                    <LoadingSkeleton/>
                                ) : hasMovies ? (
                                    <MovieSlider
                                        movies={section.movies}
                                        rowName={section.name}
                                        autoPlaytime={0}
                                        isNavigation={true}
                                        playSpeed={0}
                                        loop={false}
                                        isGuest={false}
                                        iconVisible={true}
                                        favorites={currentUserData.favorites}
                                        watchList={currentUserData.watchList}
                                        watchedList={currentUserData.watchedList}
                                    />
                                ) : null}
                            </div>
                        );
                    })}

                    {/* Sentinel element for intersection observer */}
                    <div
                        ref={loadMoreSentinelRef}
                        style={{height: '10px', margin: '20px 0'}}
                    />

                    {/* Loading indicator */}
                    {loadingMore && (
                        <LoadingSkeleton/>
                    )}


                    <Footer/>

                </Box>
            </Box>
        );
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
            <div style={{flex: 1}}>
                {renderContent()}
            </div>
        </div>
    );
};

const styles = {
    overlayBox: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '20%',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 60%, rgba(0, 0, 0, 0))',
    },
    contentBox: {
        position: 'absolute',
        top: '80%',
        width: '100%',
        padding: '20px',
        zIndex: 1,
    },
    circularProgressContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
    }
};

export default UserWelcomePageContent;