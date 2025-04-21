import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import ProtectedRoute from "./Pages/User/ProtectedRoute.jsx";
import AdminProtectedRoute from "./Pages/Admin/AdminProtectedRoute.jsx";
import Homepage from "./Pages/Guest/Homepage.jsx";
import UserPages from "./Pages/User/UserPages.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignInUpPage from "./Pages/Guest/SignIn&UpPage.jsx";
import NotFoundPage from "./Pages/NotFoundPage.jsx";
import {AppProvider} from "@toolpad/core/AppProvider";
import Theme from "./Styles/Theme.jsx";
import {ReactRouterAppProvider} from "@toolpad/core/react-router";
import AdminPages from "./Pages/Admin/AdminPages.jsx";
import AdminSignInPage from "./Pages/Admin/AdminSignInPage.jsx";
import {useEffect} from "react";
import {loadGenres} from "./Components/General/genres.jsx";


function App() {

    return (
        <>
        <AppProvider theme={Theme}>
            <Router>

                <ToastContainer
                    theme="dark"
                    position="top-right"
                    pauseOnHover={false}
                    autoClose={3000}
                    newestOnTop
                    hideProgressBar
                />

                <ReactRouterAppProvider>
                    <Routes>
                        <Route exact path="/" element={ <Homepage /> } /> // Guest home page
                        <Route path="/signin" element={ <SignInUpPage isCreateAccount={false} /> } /> // Sign in page
                        <Route path="/signup" element={ <SignInUpPage isCreateAccount={true} /> } /> // Sign up page
                        <Route path ="/home"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // User welcome page
                        />
                        <Route path ="/watch/:movieId"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Individual movie page
                        />
                        <Route path ="/favorites"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Watchlist/Favourites page
                        />
                        <Route path ="/watchlist"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Watchlist/Favourites page
                        />
                        <Route path ="/watch-history"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Watch history page
                        />
                        <Route path ="/request-movie-addition"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Movie request page
                        />
                        <Route path ="/community"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Social interactions page
                        />
                        <Route path ="/profile"
                            element={ <ProtectedRoute component={ <UserPages window={window} /> } />} // Manage profile page
                        />
                        <Route path ="/admin-login"
                            element={ <AdminSignInPage /> } // Admin login page
                        />
                        <Route path ="/admin-dashboard"
                               element={ <AdminProtectedRoute component={ <AdminPages window={window} /> } />} // Admin dashboard page
                        />
                        <Route path ="/admin-profile"
                            element={ <AdminProtectedRoute component={ <AdminPages window={window} /> } />} // Admin profile page
                        />
                        <Route path ="/admin-movie-requests"
                            element={ <AdminProtectedRoute component={ <AdminPages window={window} /> } />} // Admin movie requests page
                        />
                        <Route path ="/admin-user-management"
                            element={ <AdminProtectedRoute component={ <AdminPages window={window} /> } />} // Admin movie requests page
                        />
                        <Route path ="*"
                               element={<NotFoundPage />}
                        />
                    </Routes>
                </ReactRouterAppProvider>
            </Router>
        </AppProvider>
    </>
    )
}

export default App
