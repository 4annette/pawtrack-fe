import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    const isAuthenticated = token && token !== 'null' && token !== 'undefined' && token.trim() !== "";

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return children;
};

export default ProtectedRoute;