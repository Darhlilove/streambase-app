import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import {AppProvider} from '@toolpad/core/AppProvider';
import {DashboardLayout} from '@toolpad/core/DashboardLayout';
import dashboardTheme from '../../Styles/Theme';
import logo from '../../assets/logos/fulllogo.svg'
import {useNavigate} from 'react-router-dom';

import UserWatchedList from "../User/watchedList";
import UserWatchList from "../User/watchList";
import GlobalCommunityPage from "../User/community";
import MovieRequestPage from "../User/requestMovieAddition";
import ManageProfile from "../User/manageProfile";
import MoviePage from "../User/individualMoviePage";
import UserFavorites from "../User/favorites.jsx";
import AdminDashboardPageContent from "../Admin/AdminDashboardPageContent.jsx";
import AdminSignInPage from "../Admin/AdminSignInPage.jsx";
import AdminMovieRequestsContent from "../Admin/AdminMovieRequestsContents.jsx";
import AdminManageProfile from "../Admin/adminManageProfile.jsx";
import AdminUserManagement from "../Admin/AdminUserManagement.jsx";

const UserPageContent = React.lazy(() => import("../User/userPageContent"));
const HomePageContent = React.lazy(() => import("../Guest/homePageContent"));

const Logo = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const userLoggedIn = localStorage.getItem('user');
        setIsLoggedIn(!!userLoggedIn);
    }, [localStorage.getItem('user')]);

    // Function to handle logo click based on login status
    const handleLogoClick = () => {
        if (isLoggedIn) {
            navigate('/home');
        } else {
            navigate('/');
        }
    };

    return (
        <img
            alt="Streambase"
            src={logo}
            style={{width: '170px', height: 'auto', cursor: 'pointer'}}
            onClick={handleLogoClick}
        />
    );
};

function PageContent({pathname}) {
    const navigate = useNavigate();

    useEffect(() => {
        if (pathname) {
            navigate(pathname);
        }
    }, [pathname]);

    return (
        <>
            {
                pathname === "/home" ? <UserPageContent />
                    : pathname.includes('/watch/') ? <MoviePage/>
                        : pathname === "/favorites" ? <UserFavorites/>
                            : pathname === "/watchlist" ? <UserWatchList/>
                                : pathname === "/watch-history" ? <UserWatchedList/>
                                    : pathname === "/request-movie-addition" ? <MovieRequestPage/>
                                        : pathname === "/community" ? <GlobalCommunityPage/>
                                            : pathname === "/profile" ? <ManageProfile/>
                                                : pathname === "/admin-dashboard" ? <AdminDashboardPageContent/>
                                                    : pathname === "/admin-login" ? <AdminSignInPage/>
                                                        : pathname === "/admin-movie-requests" ?
                                                            <AdminMovieRequestsContent/>
                                                            : pathname === "/admin-user-management" ? <AdminUserManagement/>
                                                                : pathname === "/admin-profile" ? <AdminManageProfile/>
                                                                    : pathname === "/" && <HomePageContent/>
            }
        </>
    );
}

PageContent.propTypes = {
    pathname: PropTypes.string.isRequired,
};

function AppTitle() {
    return (
        <Box sx={{marginLeft: "20px", display: "flex", justifyContent: "left"}}>
            <Logo/>
        </Box>
    );
}

function Dashboard({navigation, hideNavigation = true, toolbarActions}) {
    const pathname = window.location.pathname;

    return (
        <AppProvider
            navigation={navigation}
            theme={dashboardTheme}
            window={window}
        >
            <DashboardLayout
                slots={{
                    appTitle: AppTitle,
                    toolbarActions: toolbarActions,
                }}
                hideNavigation={hideNavigation}
                defaultSidebarCollapsed
                sx={{
                    '& .MuiAppBar-root': {
                        borderBottom: '2px solid #070501',
                    },
                }}
            >
                <PageContent pathname={pathname}/>
            </DashboardLayout>
        </AppProvider>
    );
}

Dashboard.propTypes = {
    window: PropTypes.func,
};

export default Dashboard;
