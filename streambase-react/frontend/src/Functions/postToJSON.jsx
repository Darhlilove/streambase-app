const API_URL = `${import.meta.env.MOVIES_DB_URL}/movies`

const postMovieToJson = async (movie) => {
    try {
        const timestamp = new Date().toISOString();
        const movieWithTimestamp = {
            id: String(movie.id),
            title: movie.title,
            media_type: movie.media_type || "movie",
            poster: movie.poster_path,
            backdrop: movie.backdrop_path,
            released: movie.release_date || movie.first_air_date,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch movies');
        }
        const movies = await response.json();

        const existingMovie = movies.find(existingMovie => existingMovie.id === movie.id);

        if (existingMovie) {
            const updateResponse = await fetch(`${API_URL}/${existingMovie.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...movieWithTimestamp, createdAt: existingMovie.createdAt }),
            });

            if (!updateResponse.ok) {
                const errorMessage = await updateResponse.text();
                throw new Error(`Failed to update the movie: ${errorMessage}`);
            }

            return await updateResponse.json();
        } else {
            const addResponse = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movieWithTimestamp),
            });

            if (!addResponse.ok) {
                const errorMessage = await addResponse.text();
                throw new Error(`Failed to add the movie: ${errorMessage}`);
            }

            return await addResponse.json();
        }
    } catch (error) {
        console.error('Error posting movie to JSON:', error);
        throw error; // Optionally rethrow the error
    }
};

export default postMovieToJson;