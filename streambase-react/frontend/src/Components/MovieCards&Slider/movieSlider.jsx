import React, { useState } from "react";
import {ImageListItem, ImageListItemBar, Skeleton, Typography} from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "../../Styles/movieSlider.css";
import "swiper/css";
import "swiper/css/navigation";
import movieThumbnail from "../../assets/movie-placeholder.jpg";
import Box from "@mui/material/Box";
import {Link, useNavigate} from "react-router-dom";
import CardIcons from "./cardIcons";
import {addToWatchedList} from "../../Redux/userDataReducer.js";
import {useDispatch} from "react-redux";
import SignInPromptDialog from "../../Pages/Guest/SignInPromptDialog.jsx";

const parseDate = (dateStr) => new Date(dateStr);

const MovieSlider = ({
                        rowName = "",
                        movies = [],
                        autoPlaytime = 2000,
                        isNavigation = false,
                        playSpeed = 5000,
                        loop = true,
                        sliderPaddingX = "40px",
                        isGuest = true,
                        isHomePage = true,
                        iconVisible = false,
                    }) => {
    const [hoveredMovie, setHoveredMovie] = useState(null);
    const [isIconVisible, setIsIconVisible] = useState(iconVisible);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const userString = localStorage.getItem("user");
    let userEmail = null;
    if (userString) {
        try {
            const userObject = JSON.parse(userString);
            userEmail = userObject.email
        } catch(error) {
            console.error("Error parsing user data from localStorage:", error);
        }
    }

    const isAdmin = localStorage.getItem("admin");

    const handleAddToWatchedList = (movie) => {
        localStorage.setItem("movieMediaType", movie.media_type || "movie");
        if (isAdmin) return;

        if (userEmail) {
            dispatch(addToWatchedList({ email: userEmail, movieId: movie.id, movieName: movie.title,
                media_type: movie.media_type || "movie"}));
        }
    };

    const [openDialog, setOpenDialog] = useState(false);

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSignIn = () => {
        navigate("/signin")
        setOpenDialog(false);
    };

    const handleCreateAccount = () => {
        navigate("/signup")
        setOpenDialog(false);
    };

    if (openDialog) {
        return (
            <SignInPromptDialog onSignIn={handleSignIn} handleClose={handleCloseDialog}
                                onCreateAccount={handleCreateAccount} open={openDialog} />
        )
    }

    return (
        <div style={{ marginBottom: "20px" }}>
            <Typography
                variant="h5"
                color="secondary.light"
                sx={{ paddingX: sliderPaddingX, fontWeight: "bold", '&:hover': { cursor: "pointer" } }}
            >
                {rowName}
            </Typography>

                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={5}
                    slidesPerView={1}
                    navigation={isNavigation}
                    speed={playSpeed}
                    loop={loop}
                    autoplay={{ delay: autoPlaytime }}
                    breakpoints={{
                        640: { slidesPerView: 3 },
                        768: { slidesPerView: 5 },
                        1024: { slidesPerView: 7 },
                        2048: { slidesPerView: 9 },
                    }}
                    style={{ padding: "20px", width: "98%" }}
                >
                    {movies && movies.length > 0 && movies.map((movie) => (
                        <SwiperSlide
                            key={movie.id}
                            style={{
                                minWidth: "200px", maxWidth: "400px", minHeight: "100px", cursor: "pointer",
                            }}
                            onMouseEnter={() => {
                                setHoveredMovie(movie.id);
                                !isGuest && setIsIconVisible(true);
                            }}
                            onMouseLeave={() => {
                                setHoveredMovie(null);
                                !isGuest && setIsIconVisible(false);
                            }}
                        >
                            <Link key={movie.id}
                                  to={isGuest ? null : `/watch/${movie.id}`}
                                  onClick={() => isGuest ? setOpenDialog(true) : handleAddToWatchedList(movie)}
                            >
                                <ImageListItem
                                    sx={{
                                        transition: "transform 0.3s ease-in-out",
                                        "&:hover": {
                                            transform: "scale(1.15)",
                                            zIndex: 2,
                                            position: "relative",
                                        }
                                    }}
                                >
                                    <img
                                        srcSet={movie.poster_path && movie.poster_path !== "N/A" ? `https://image.tmdb.org/t/p/original/${movie.poster_path}` : movieThumbnail}
                                        src={movie.poster_path && movie.poster_path !== "N/A" ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : movieThumbnail}
                                        onError={(e) => { e.currentTarget.src = movieThumbnail ; e.currentTarget.onerror = null; }}
                                        alt={movie.title || movie.name}
                                        loading="lazy"
                                    />

                                    <ImageListItemBar
                                        title={
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <Box sx={{
                                                    minWidth: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "1px 2px",
                                                    fontSize: "12px", border: "1px solid", borderColor: "primary", lineHeight: "1", marginBottom: "5px"
                                                }}>
                                                    {movie.id === hoveredMovie && movie.adult === true ? "PG-13" : "PG-18"}
                                                </Box>
                                                <Typography variant="caption" sx={{ fontSize: "12px", fontWeight: "900", display: "inline" }}>
                                                    {movie.id === hoveredMovie && movie.media_type === "tv" ?
                                                        (movie.first_air_date === "N/A" ? "" : parseDate(movie.first_air_date).toLocaleString('default', { year: 'numeric', month: 'long' }))
                                                        : (movie.release_date === "N/A" ? "" : parseDate(movie.release_date).toLocaleString('default', { year: 'numeric', month: 'long' }) === ""
                                                            ? "" : parseDate(movie.release_date).toLocaleString('default', { year: 'numeric', month: 'long' }))
                                                    }
                                                </Typography>
                                                <Box sx={{
                                                    display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0px 5px", fontSize: "11px", border: "1px solid",
                                                    borderColor: "#FEB508", lineHeight: "1", borderRadius: "2px", backgroundColor: "#FEB508", color: "rgba(0, 0, 0, 0.8)", marginBottom: "5px"
                                                }}>
                                                    HD
                                                </Box>
                                            </Box>
                                        }
                                        subtitle={
                                            <Typography width={"100%"} variant={"body2"} textAlign="center" fontWeight={"bold"}>
                                                {movie.title || movie.name}
                                            </Typography>
                                        }
                                        sx={{
                                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                                            visibility: hoveredMovie === movie.id ? "visible" : "hidden"
                                        }}
                                    />
                                    {hoveredMovie === movie.id && (
                                        isHomePage &&
                                        <CardIcons movie={movie} isVisible={isIconVisible}/>
                                    )}
                                </ImageListItem>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
        </div>
    );
};

export function MovieLoadingSkeleton() {
    return (
        <Skeleton
            variant="rectangular"
            width={230}
            height={300}
            sx={{
                backgroundColor: '#373636',
                '&::before': {
                    animation: 'mui-skeleton-loading 1.5s infinite linear',
                },
            }}
        />
    );
}

export function MovieSwiperSkeleton() {
    return (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
                {[...Array(7)].map((_, index) => (
                    <MovieLoadingSkeleton key={index} />
                ))}
            </Box>
        </div>
    );
}

export default MovieSlider;
