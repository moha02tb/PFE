/* eslint-disable react/prop-types */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { hasAllowedRole } from '../lib/permissions';

const ProtectedRoute = ({ element, requiredRoles = [], fallbackPath = '/forbidden' }) => {
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

    if (!hasAllowedRole(user?.role, requiredRoles)) {
        return <Navigate to={fallbackPath} replace />;
    }

    // Render the protected element
    return element;
};

export default ProtectedRoute;
