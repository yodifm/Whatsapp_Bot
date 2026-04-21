import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
}
