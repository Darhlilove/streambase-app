import React, { useState, useEffect, useRef } from 'react';
import MovieSlider, { MovieSwiperSkeleton } from "../../Components/MovieCards&Slider/movieSlider.jsx";
import Footer from "../../Components/footer/footer.jsx";
import { Box, Grid2, Typography, Stack } from "@mui/material";
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrendingMovies, fetchTrendingTV, fetchUpcoming } from '../../Redux/moviesReducer';
import { useNavigate } from "react-router-dom";
import CustomButton from "../../Components/General/customButton.jsx";
import demoBackground from '../../assets/backgrounds/the_netflix_login_background__canada__2024___by_logofeveryt_dh0w8qv.jpg';
import { makeStyles } from '@mui/styles';

// Define styles using makeStyles
const useStyles = makeStyles(() => ({
    root: {
        height: "100%",
    },
    gridContainer: {
        width: "100%",
        height: "100%",
        backgroundImage: `url(${demoBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom left, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.9) 75%)",
            zIndex: 1,
        },
    },
    stackContainer: {
        paddingLeft: "60px",
        paddingBottom: "250px",
        width: "70%",
        display: "flex",
        alignItems: "flex-start",
        color: "#fff",
        position: "relative",
        zIndex: 2,
    },
    headerTitle: {
        fontWeight: "bold",
        fontSize: "48px",
        textAlign: "left",
    },
    headerSubtitle: {
        textAlign: "left",
    },
    headerDescription: {
        textAlign: "left",
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "flex-start",
    },
    loadingSkeleton: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    movieSection: {
        padding: "20px",
        width: "98%",
    },
    movieSliderContainer: {
        marginTop: "20px",
    },
}));

const HomePageContent = () => {
    const classes = useStyles();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { trendingMovies, trendingTV, upcoming, status } = useSelector((state) => state.movies);
    const loading = useSelector((state) => state.movies.loading);

    const trendingMoviesRef = useRef(null);
    const trendingTVRef = useRef(null);
    const upcomingRef = useRef(null);

    const [scrollDirection, setScrollDirection] = useState("down");
    const observer = useRef(null);

    // Track the scroll direction
    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY) {
                setScrollDirection("down"); // Scrolling down
            } else if (currentScrollY < lastScrollY) {
                setScrollDirection("up"); // Scrolling up
            }

            lastScrollY = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleIntersection = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && scrollDirection === "down") {
                if (entry.target.id === "trendingMovies" && !loading.trendingMovies && trendingMovies.length===0) {
                    dispatch(fetchTrendingMovies());
                }
                if (entry.target.id === "trendingTV" && !loading.trendingTV && trendingTV.length===0) {
                    dispatch(fetchTrendingTV());
                }
                if (entry.target.id === "upcoming" && !loading.upcoming && upcoming.length===0) {
                    dispatch(fetchUpcoming());
                }
            }
        });
    };

    useEffect(() => {
        observer.current = new IntersectionObserver(handleIntersection, {
            rootMargin: '100px',
            threshold: 0.5,
        });

        if (trendingMoviesRef.current) {
            observer.current.observe(trendingMoviesRef.current);
        }
        if (trendingTVRef.current) {
            observer.current.observe(trendingTVRef.current);
        }
        if (upcomingRef.current) {
            observer.current.observe(upcomingRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [scrollDirection]);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTrendingMovies());
            dispatch(fetchTrendingTV());
            dispatch(fetchUpcoming());
        }
    }, [dispatch, status]);

    const isLoading = loading.trendingMovies || loading.trendingTV || loading.upcoming;

    return (
        <div className={classes.root}>
            <Grid2 className={classes.gridContainer}>
                <Stack spacing={3} className={classes.stackContainer}>
                    <Typography variant="h4" className={classes.headerTitle}>
                        World of Endless Entertainment
                    </Typography>
                    <Typography variant="h5" className={classes.headerSubtitle}>
                        Binge-worthy movies, electrifying TV shows, and so much more
                    </Typography>
                    <Typography variant="h6" className={classes.headerDescription}>
                        No limits. No subscriptions. Just pure cinematic bliss!
                    </Typography>
                    <Box className={classes.buttonContainer}>
                        <CustomButton
                            buttonLabel={"Get Started"}
                            fontSize={"14px"}
                            padding={"10px 24px"}
                            fontWeight={"1000"}
                            borderRadius={"24px"}
                            onClick={() => navigate("/signup")}
                        />
                    </Box>
                </Stack>
            </Grid2>
            <Box sx={{ alignItems: "center", pt: "20px" }}>
                {isLoading || status === "rejected" ? (
                    <Box className={classes.loadingSkeleton}>
                        {['Trending Movies', 'Top TV Shows', 'Upcoming'].map((category, index) => (
                            <Box
                                key={index}
                                className={classes.movieSection}
                                id={category.replace(/\s+/g, '').toLowerCase()}
                                ref={
                                    category === 'Trending Movies'
                                        ? trendingMoviesRef
                                        : category === 'Top TV Shows'
                                            ? trendingTVRef
                                            : upcomingRef
                                }
                            >
                                <MovieSwiperSkeleton />
                            </Box>
                        ))}
                    </Box>
                ) : (
                    trendingMovies.length > 0 && trendingTV.length > 0 && upcoming.length > 0 && (
                        <>
                            <div ref={trendingMoviesRef} id="trendingMovies" className={classes.movieSliderContainer}>
                                <MovieSlider
                                    movies={trendingMovies}
                                    rowName={"Trending Movies"}
                                    autoPlaytime={2000}
                                    isNavigation={false}
                                    playSpeed={5000}
                                />
                            </div>
                            <div ref={trendingTVRef} id="trendingTV" className={classes.movieSliderContainer}>
                                <MovieSlider
                                    movies={trendingTV}
                                    rowName={"Trending TV"}
                                    autoPlaytime={2000}
                                    isNavigation={false}
                                    playSpeed={6000}
                                />
                            </div>
                            <div ref={upcomingRef} id="upcomingMovies" className={classes.movieSliderContainer}>
                                <MovieSlider
                                    movies={upcoming}
                                    rowName={"Coming Up"}
                                    autoPlaytime={2000}
                                    isNavigation={false}
                                    playSpeed={7000}
                                />
                            </div>
                        </>
                    )
                )}
            </Box>
            <Footer />
        </div>
    );
};

export default HomePageContent;
