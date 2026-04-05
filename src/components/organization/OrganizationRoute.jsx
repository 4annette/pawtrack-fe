import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const OrganizationRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    const isAuthenticated = token && token !== 'null' && token !== 'undefined';

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    try {
        const user = JSON.parse(userString || "{}");

        if (user.role === 'ORGANIZATIONS') {
            return children;
        } else {
            console.warn("Access denied: User is not an organization", user);
            return <Navigate to="/dashboard" replace />;
        }
    } catch (error) {
        console.error("OrganizationRoute Error:", error);
        return <Navigate to="/dashboard" replace />;
    }
};

export default OrganizationRoute;