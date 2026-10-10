import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // check if user's role is allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // redirect to correct onboarding based on role
        if (user.role === 'TENANT') {
            return <Navigate to="/onboarding/tenant" replace />;
        } else if (user.role === 'ADMIN') {
            return <Navigate to="/onboarding/landlord" replace />;
        }
    }

    return children;
}