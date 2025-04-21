import AddTaskIcon from '@mui/icons-material/AddTask';
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

export const ADMIN_NAVIGATION = [
    {
        segment: 'admin-dashboard',
        title: 'Dashboard',
        icon: <DashboardIcon />,
    },
    {
        segment: 'admin-movie-requests',
        title: 'Movie Approval Requests',
        icon: <AddTaskIcon />,
    },
    {
        segment: 'admin-user-management',
        title: 'User Management',
        icon: <GroupAddIcon />,
    }
];

