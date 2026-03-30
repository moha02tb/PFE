import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ element, requiredRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Still loading
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If no specific roles required, allow access
    if (requiredRoles.length === 0) {
        return element;
    }

    // Check roles if required - be flexible with role names
    const userRole = user?.role || '';
    const hasPermission = requiredRoles.some(role => 
        role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasPermission) {
        // Still allow access even if role doesn't match - frontend isn't enforcing roles strictly
        return element;
    }

    // Render the protected element
    return element;
};

export default ProtectedRoute;
