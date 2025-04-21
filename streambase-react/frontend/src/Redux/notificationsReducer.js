import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
    notifications: [],
    status: 'idle',
    error: null,
};

const API_URL = `${import.meta.env.VITE_API_URL}/notifications`

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (userId) => {

            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch notifications');

            const notifications = await response.json();

            // 🔹 Filter only notifications meant for the current user
            return notifications.filter(notification => notification.to === userId);
    }
);

export const sendNotification = createAsyncThunk(
    'notifications/sendNotification',
    async (notificationData) => {
        return await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationData),
            });
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId) => {
            const response = await fetch(`${API_URL}/${notificationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true }),
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');
            return { notificationId };
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.notifications = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(sendNotification.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(sendNotification.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.notifications.push(action.payload);
            })
            .addCase(sendNotification.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload.notificationId);
                if (notification) {
                    notification.read = true;
                }
            });
    },
});

export default notificationSlice.reducer;

export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationStatus = (state) => state.notifications.status;
export const selectNotificationError = (state) => state.notifications.error;
