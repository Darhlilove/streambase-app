import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import {PeopleAlt} from "@mui/icons-material";
import HomeIcon from '@mui/icons-material/Home';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';

export const USER_NAVIGATION = [
    {
        segment: 'home',
        title: 'Home',
        icon: <HomeIcon />,
    },
    {
        segment: 'favorites',
        title: 'Favorites',
        icon: <FavoriteBorderIcon />,
    },
    {
        segment: 'watchlist',
        title: 'Watchlist',
        icon: <CollectionsBookmarkIcon />,
    },
    {
        segment: 'watch-history',
        title: 'Watch History',
        icon: <HistoryToggleOffIcon />,
    },
    {
        segment: 'request-movie-addition',
        title: 'Request Movie',
        icon: <AddToPhotosIcon />,
    },
    {
        segment: 'community',
        title: 'Global Community',
        icon: <PeopleAlt />,
    },
];

