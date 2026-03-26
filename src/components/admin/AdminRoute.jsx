import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    const isAuthenticated = token && token !== 'null' && token !== 'undefined';

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    try {
        const user = JSON.parse(userString || "{}");

        if (user.role === 'ADMIN') {
            return children;
        } else {
            console.warn("Access denied: User is not an admin", user);
            return <Navigate to="/dashboard" replace />;
        }
    } catch (error) {
        console.error("AdminRoute Error:", error);
        return <Navigate to="/dashboard" replace />;
    }
};

export default AdminRoute;