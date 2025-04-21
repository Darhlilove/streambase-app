import { configureStore } from "@reduxjs/toolkit";
import moviesReducer from "./moviesReducer.js";
import usersDataReducer from "./userDataReducer.js";
import reviewsReducer from "./reviewsReducer.js";
import notificationsReducer from "./notificationsReducer.js";
import movieRequestsReducer from "./movieRequestsReducer.js";

const store = configureStore({
    reducer: {
        movies: moviesReducer, // maintain app's movies
        usersData: usersDataReducer, // maintain users' movies interests - favourites, watchlist and watch history and friends
        reviews: reviewsReducer, // maintain reviews on movies
        notifications: notificationsReducer, // manage sending and receiving notifications
        movieRequests: movieRequestsReducer // manage movie requests
    },
});

export default store;
