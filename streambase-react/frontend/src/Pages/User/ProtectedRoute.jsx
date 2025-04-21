import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ component }) => {
    const location = useLocation();
    const logIn = !!localStorage.getItem('user');

    if (!logIn) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return component;
};

export default ProtectedRoute;