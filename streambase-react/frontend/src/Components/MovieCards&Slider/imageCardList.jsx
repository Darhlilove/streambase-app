import React, {useState} from "react";
import { ImageList, ImageListItem, ImageListItemBar, Typography } from "@mui/material";
import movieThumbnail from "../../assets/movie-placeholder.jpg";
import Box from "@mui/material/Box";
import {Link} from "react-router-dom";
import CardIcons from "./cardIcons";
import {addToWatchedList} from "../../Redux/userDataReducer.js";
import {useDispatch} from "react-redux";

const parseDate = (dateStr) => new Date(dateStr);

const ImageCardList = ({ movies, cols = 6, gap = 5 }) => {
    const dispatch = useDispatch();
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
    const isAdmin = localStorage.getItem("admin");

    const [hoveredMovie, setHoveredMovie] = useState(null);

    const handleAddToWatchedList = (movie) => {
        localStorage.setItem("movieMediaType", movie.media_type || "movie");
        if (isAdmin) return;
        if (userEmail) {
            dispatch(addToWatchedList({ email: userEmail, movieId: movie.id, movieName: movie.title,
                media_type: movie.media_type || "movie"}));
        } else {
            console.warn("User email is not available. Cannot add to watched list.");
        }
    };

    return (
        <ImageList
            cols={cols}
            gap={gap}
            style={{
                padding: "30px", width: "100%"
            }}
        >
            {
                movies && movies.length > 0 && movies.map((movie, index) => (
                    <Link key={movie.id} to={`/watch/${movie.id}`} state={{ media_type: movie.media_type }}
                          onClick={() => handleAddToWatchedList(movie)}
                    >
                        <ImageListItem
                            key={`${movie.id} - ${index}` || index}
                            onMouseEnter={() => {
                                setHoveredMovie(movie.id);
                            }}
                            onMouseLeave={() => {
                                setHoveredMovie(null);
                            }}
                            sx={{
                                minWidth: "200px",
                                transition: "transform 0.3s ease-in-out",
                                "&:hover": {
                                    transform: "scale(1.2)",
                                    zIndex: 2,
                                    position: "relative",
                                }
                            }}
                        >
                            <img
                                srcSet={movie.poster_path && movie.poster_path !== "N/A" ? `https://image.tmdb.org/t/p/original/${movie.poster_path}` : movieThumbnail}
                                src={movie.poster_path && movie.poster_path !== "N/A" ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : movieThumbnail}
                                onError={(e) => { e.target.onerror = null; e.target.src = movieThumbnail; }}
                                alt={movie.title || movie.original_name}
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
                                                : (movie.release_date === "N/A" ? "" : parseDate(movie.release_date).toLocaleString('default', { year: 'numeric', month: 'long' }) === "" ? "" : parseDate(movie.release_date).toLocaleString('default', { year: 'numeric', month: 'long' }))
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
                                    visibility: hoveredMovie === movie.id ? "visible" : "hidden",
                                }}
                            />
                            {
                                <CardIcons
                                    movie={movie}
                                    isVisible={hoveredMovie === movie.id}
                                />
                            }
                        </ImageListItem>
                    </Link>
                    )
                )
            }
        </ImageList>
    );
};

export default ImageCardList