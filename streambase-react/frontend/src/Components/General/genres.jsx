import { options } from "../../tmdbKey.jsx";

export const MOVIE_GENRES = [];
export const TV_GENRES = [];

export async function loadGenres() {
    try {
        const movieResponse = await fetch(
            "https://api.themoviedb.org/3/genre/movie/list?language=en",
            options
        );
        const movieGenres = await movieResponse.json();
        movieGenres.genres.forEach((genre) => {
            const exists = MOVIE_GENRES.some((g) => g.id === genre.id);
            if (!exists) {
                MOVIE_GENRES.push(genre);
            }
        });
    } catch (error) {
        console.log("Error loading movie genres:", error);
    }

    try {
        const tvResponse = await fetch(
            "https://api.themoviedb.org/3/genre/tv/list?language=en",
            options
        );
        const tvGenres = await tvResponse.json();
        tvGenres.genres.forEach((genre) => {
            const exists = TV_GENRES.some((g) => g.id === genre.id);
            if (!exists) {
                TV_GENRES.push(genre);
            }
        });
    } catch (error) {
        console.log("Error loading TV genres:", error);
    }
}

export const getUniqueGenres = async () => {
    if (MOVIE_GENRES.length === 0 || TV_GENRES.length === 0) {
        await loadGenres();
    }

    return [...new Set([...MOVIE_GENRES.map(g => g.name), ...TV_GENRES.map(g => g.name)])];
};

