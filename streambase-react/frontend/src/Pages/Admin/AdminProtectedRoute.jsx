import { Navigate, useLocation } from 'react-router-dom';

const AdminProtectedRoute = ({ component }) => {
    const location = useLocation();
    const logIn = !!localStorage.getItem('admin');

    if (!logIn) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return component;
};

export default AdminProtectedRoute;