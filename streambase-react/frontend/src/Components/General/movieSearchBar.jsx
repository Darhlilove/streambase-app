import React, {useEffect, useState} from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { options } from '../../tmdbKey.jsx';
import {Avatar, Box, InputAdornment, Menu, MenuItem, Typography} from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import {loadGenres, MOVIE_GENRES} from "./genres.jsx"
import {useNavigate} from "react-router-dom";

function isNumber(value) {
    return !isNaN(Number(value));
}

const performSearch = async (searchType, query) => {
    const TMDB_URL = "https://api.themoviedb.org/3/";

    let url = "";

    switch (searchType) {
        case "Title":
            url = `${TMDB_URL}search/multi?query=${encodeURIComponent(query)}`;
            break;
        case "Genre":
            url = `${TMDB_URL}discover/movie?with_genres=${encodeURIComponent(query)}`;
            break;
        case "Director":
        case "Actor":
            url = `${TMDB_URL}search/person?query=${encodeURIComponent(query)}`;
            break;
        case "Year":
            url = `${TMDB_URL}discover/movie?primary_release_year=${encodeURIComponent(query)}`;
            break;
        default:
            throw new Error("Invalid search type");
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.results) {
            if (searchType === "Title" || searchType === "Genre" || searchType === "Year") {
                const sortedMovies = data.results
                    .filter(result => result.media_type !== 'person')
                    .sort((a, b) => {
                        if (b.release_date !== a.release_date) {
                            return b.release_date - a.release_date;
                        }
                        return b.popularity - a.popularity;
                    });

                return sortedMovies.map(item => ({ label: item.title, ...item }));
            }

            if (searchType === "Director" || searchType === "Actor") {
                const movies = [];

                // Iterate over the results and filter movies based on known_for_department
                data.results.forEach(result => {
                    if (searchType === "Actor" && result.known_for_department === "Acting" && Array.isArray(result.known_for)) {
                        result.known_for.forEach(movie => {
                            movies.push(movie);
                        });
                    }

                    if (searchType === "Director" && result.known_for_department === "Directing" && Array.isArray(result.known_for)) {
                        result.known_for.forEach(movie => {
                            movies.push(movie);
                        });
                    }
                });

                if (movies.length === 0) {
                    return []; // Return empty array if no movies found
                }

                const sortedMovies = movies
                    .sort((a, b) => {
                        if (b.release_date !== a.release_date) {
                            return b.release_date - a.release_date;
                        }
                        return b.popularity - a.popularity;
                    });

                return sortedMovies.map(item => ({ label: item.title, ...item }));
            }
        } else {
            return [];
        }
    } catch (error) {
        return error.message;
    }
};


const MovieSearchBar = ({ width = "100%"}) => {
    const user = localStorage.getItem("user")

    const [filter, setFilter] = useState('Title');
    const [searchTerm, setSearchTerm] = useState("");
    const [searchValue, setSearchValue] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchError, setIsSearchError] = useState(false);

    const [open, setOpen] = React.useState(false);
    const [genreAnchorEl, setGenreAnchorEl] = useState(null);
    const [showFilter, setShowFilter] = useState(false);

    const [subGenreAnchorEl, setSubGenreAnchorEl] = useState(null);
    const [showSubGenre, setShowSubGenre] = useState(false);

    const filters = ["Title", "Genre", "Director", "Actor", "Year"];

    const navigate = useNavigate();

    // Fetch genres
    useEffect(() => {
        loadGenres().then(() => {});
    })

    const handleSearchChange = async (event, newSearchValue) => {
        setSearchTerm(newSearchValue);

        if (newSearchValue.length > 1) {
            setIsSearching(true);
            setIsSearchError(false);

            const result = await performSearch(filter, newSearchValue);

            if (result === "Error") {
                setIsSearchError(true);
            } else {
                setSearchResults(result);
            }

            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleFilterClick = (event) => {
        setGenreAnchorEl(event.currentTarget);
        setShowFilter(true);
    };


    const handleSubGenreClick = (event) => {
        setSubGenreAnchorEl(event.currentTarget);
        setShowSubGenre(true);
    };

    const handleCloseFilter = () => {
        setGenreAnchorEl(null);
        setShowFilter(false);
    };

    const handleCloseSubGenre = () => {
        setSubGenreAnchorEl(null);
        setShowSubGenre(false);
    };

    const handleFilterSelection = (filter) => {
        if (filter === "Genre") {
            setFilter(filter);
            handleSubGenreClick({ currentTarget: genreAnchorEl });
        } else {
            setFilter(filter);
        }
        handleCloseFilter();
    };

    const handleSubGenreSelection = async (subGenre) => {
        setSearchTerm(subGenre.name);
        handleCloseSubGenre();

        const result = await performSearch("Genre", subGenre.id);

        if (result === "Error") {
            setIsSearchError(true);
        } else {
            console.log("search results set genre");
            setSearchResults(result);
            setOpen(true)
        }
        setIsSearching(false);
    };

    const handleMovieSearchResultClick = (id) => {
        if (user) {
            navigate(`/watch/${id}`);
            setOpen(false);
        } else {
            setOpen(false);
            toast("Please sign in to view movie")
        }
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Autocomplete
                noOptionsText={isSearchError && searchTerm >= 1 ? "Something went wrong" : "No results found"}
                loading={isSearching}
                loadingText="Searching..."
                value={searchValue}
                onChange={(event, newValue) => {
                    setSearchValue(newValue);
                }}
                inputValue={searchTerm}
                onInputChange={handleSearchChange}
                id="search-input"
                options={searchResults}
                filterOptions={(x) => x}
                getOptionLabel={(option) => option.title || option.original_title || "No Title" }
                open={open}
                onOpen={() => {
                    if (searchResults.length > 0 && (searchTerm.length >= 2 || filter === "Genre")) {
                        setOpen(true);
                    } else {
                        setOpen(false);
                    }
                }}
                onClose={() => setOpen(false)}
                clearOnBlur={false}
                popupIcon={
                    <InputAdornment position="end" sx={{ gap: "3px", "&:active": { backgroundColor: "transparent" } }}>
                        <ArrowLeftIcon color={"primary"} sx={{ cursor: "pointer" }} />
                        <Typography fontSize={"small"} color={"primary"} sx={{ cursor: "pointer" }}>
                            {isNumber(filter) ? setSearchTerm : filter}
                        </Typography>
                            <ManageSearchIcon color={"primary"}  onClick={handleFilterClick} />
                    </InputAdornment>
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search"
                        size="small"
                        autoComplete={"off"}
                        fullWidth
                    />
                )}
                renderOption={(props, option) => {
                    const { key, ...restProps } = props;

                    return (
                        <Box key={option.id} {...restProps} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }} onClick={() => handleMovieSearchResultClick(option.id)}>
                            <Avatar src={`https://image.tmdb.org/t/p/original/${option.poster_path}`} />
                            <Typography>
                                {`${option.title || option.name} - ${option.release_date?.slice(0, 4) || option.first_air_date?.slice(0, 4) || "..."}`}
                            </Typography>
                        </Box>
                    );
                }}
                sx={{
                    display: { xs: 'none', md: 'inline-block' },
                    justifyContent: 'space-between',
                    mr: 1,
                    width: {width},
                    '& .MuiInputBase-root': {
                        borderRadius: 6,
                        backgroundColor: "background.light",
                        border: '1 solid',
                        borderColor: '#E0E3E7',
                        '&:hover': {
                            backgroundColor: 'transparent',
                        },
                    },
                    "& .MuiAutocomplete-popupIndicator": {
                        transform: 'none',
                        "&:hover": { backgroundColor: "transparent" },
                        '&:active': {
                            backgroundColor: 'transparent', // Remove active effect
                        },
                    },

                }}
            />

            <Menu
                anchorEl={genreAnchorEl}
                open={showFilter}
                value={filter}
                onClose={handleCloseFilter}
                autoFocus={false}
            >
                {
                    filters.map((filter, id) => {
                        return (
                            <MenuItem
                                key={id}
                                onClick={() => handleFilterSelection(filter)}
                                value={filter}
                                sx={{
                                    fontSize: "small",
                                }}
                            >
                                {filter}
                            </MenuItem>
                        )
                    })
                }
            </Menu>

            <Menu
                anchorEl={subGenreAnchorEl}
                open={showSubGenre}
                onClose={handleCloseSubGenre}
                autoFocus={false}
            >
                {
                    MOVIE_GENRES.length > 0 ?
                        MOVIE_GENRES.map((genre, id) => (
                            <MenuItem
                                key={id}
                                onClick={() => handleSubGenreSelection({id: genre.id, name: genre.name})}
                                sx={{
                                    fontSize: "small",
                                }}
                            >
                                {genre.name}
                            </MenuItem>
                        )) :
                        <MenuItem>
                            Something went wrong
                        </MenuItem>
                }
            </Menu>
        </Box>
    );
};

export default MovieSearchBar;