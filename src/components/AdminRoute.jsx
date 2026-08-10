import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * AdminRoute component that restricts access to admin-only pages
 * 
 * This component performs validation:
 * 1. Checks if user is authenticated
 * 2. Verifies user has admin role
 * 
 * If user is not authenticated, redirects to login
 * If user is authenticated but not admin, shows unauthorized message and redirects to home
 */
const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const token = localStorage.getItem('authToken');

    // Check authentication
    const hasValidToken = token && token.length > 0;
    const hasValidUser = user && typeof user === 'object';
    const isAuthenticatedInRedux = isAuthenticated === true;

    const normalizedRole = user?.role?.toLowerCase().replace(/[_\s-]/g, '');
    const isAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin' || user?.isAdmin === true;

    console.log('🔐 AdminRoute Check:', {
        isAuthenticatedInRedux,
        hasValidToken,
        hasValidUser,
        userRole: user?.role,
        isAdmin,
    });

    // If not authenticated, redirect to ADMIN login
    if (!isAuthenticatedInRedux || !hasValidToken || !hasValidUser) {
        console.warn('⚠️ Admin access denied - Not authenticated, redirecting to admin login');

        if (!hasValidToken) {
            localStorage.removeItem('authToken');
        }

        return <Navigate to="/admin/login" replace />;
    }

    // If authenticated but not an admin, deny access
    if (!isAdmin) {
        console.warn('⚠️ Admin access denied - User does not have admin role');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('✅ Admin access granted');
    return children;
};

AdminRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AdminRoute;
