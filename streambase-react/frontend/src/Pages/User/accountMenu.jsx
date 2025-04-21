import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import {useNavigate} from "react-router-dom";
import {useLocalStorage} from "../../Functions/useLocalStorage.jsx";

function AccountMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [user, setUser] = useLocalStorage('user');
    const navigate = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Handle sign out (clear session or token)
    const handleSignOut = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    // Handle manage profile (example redirection or profile page)
    const handleManageProfile = () => {
        navigate('/profile'); // Redirect to profile page
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <Tooltip title="Account settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <Avatar src={user?.image} alt={user?.name} sx={{ width: 32, height: 32 }} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                backgroundColor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Display user info */}
                <MenuItem onClick={handleClose}>
                    <Avatar src={user?.image} alt={user?.name} sx={{ width: 32, height: 32 }} />
                    <Box sx={{ ml: 2 }}>
                        <Typography>{user?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.email}
                        </Typography>
                    </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleManageProfile}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Manage Profile
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Sign Out
                </MenuItem>
            </Menu>
        </>
    );
}

export default AccountMenu;