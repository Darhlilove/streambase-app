import React, { useState, useEffect } from 'react';
import {IconButton, Menu, MenuItem, Badge, ListItemText, ListItemIcon, Divider, Tooltip} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {selectNotifications, fetchNotifications, markAsRead} from "../../Redux/notificationsReducer.js";
import {useDispatch, useSelector} from "react-redux";

export default function NotificationMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const dispatch = useDispatch();
    const notifications = useSelector(selectNotifications);
    const open = Boolean(anchorEl);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Handle notifications fetch
    useEffect(() => {
        if (currentUser?.id) {
            dispatch(fetchNotifications(currentUser.id));
        }
    }, [currentUser?.id, dispatch]);

    // Sorting: Unread first, then by most recent date
    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.read === b.read) {
            return new Date(b.date) - new Date(a.date); // Newest first
        }
        return a.read ? 1 : -1; // Unread first
    });

    // Handle the opening and closing of the notification menu
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Mark notification as read
    const handleMarkAsRead = (id) => {
        dispatch(markAsRead(id));
    };

    // Get unread notifications
    const unreadCount = notifications?.filter((notification) => notification.to === currentUser.id && !notification.read).length;

    return (
        <div>
            <Tooltip title="Notifications">
            <IconButton
                aria-controls={open ? 'notification-menu' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
                color="inherit"
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon size="medium" />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiInputBase-root': {
                        borderRadius: 4,
                        backgroundColor: "background",
                        border: '1 solid',
                        borderColor: '#E0E3E7',
                        '&:hover': {
                            backgroundColor: 'transparent',
                        },
                    },
                }}
            >
                {notifications.length === 0 ? (
                    <MenuItem disabled>No notifications</MenuItem>
                ) : (
                    sortedNotifications.map((notification, index) => (
                        <MenuItem
                            key={notification.id}
                            onClick={() => handleMarkAsRead(notification.id)}
                            sx={{
                                backgroundColor: notification.read ? 'transparent' : 'rgba(250, 202, 16, 0.3)',
                                cursor: 'pointer',
                            }}
                        >
                            <ListItemIcon>
                                <NotificationsIcon fontSize="large" />
                            </ListItemIcon>
                            <ListItemText
                                primary={notification.message}
                                secondary={notification.read ? 'Read' : 'Unread'}
                            />
                            {
                                index < sortedNotifications.length - 1 && (
                                    <Divider />
                                )
                            }
                        </MenuItem>
                    ))
                )}
            </Menu>
            </Tooltip>
        </div>
    );
}
