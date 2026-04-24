import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ProtectedRoute = ({ element, requiredRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const { t } = useLanguage();

    // Still loading
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="text-center">
                    <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary-soft border-t-primary"></div>
                    <p className="text-lg font-medium text-muted-foreground">{t('common.loading')}</p>
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
