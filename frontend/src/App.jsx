import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import Login from '@/Pages/Login';
import Analytics from '@/Pages/backend/Analytics';
import Bookings from '@/Pages/backend/Bookings';
import Broadcast from '@/Pages/backend/Broadcast';
import Dashboard from '@/Pages/backend/Dashboard';
import Faqs from '@/Pages/backend/Faqs';
import Gallery from '@/Pages/backend/Gallery';
import Packages from '@/Pages/backend/Packages';
import Settings from '@/Pages/backend/Settings';
import TestAI from '@/Pages/backend/TestAI';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
                    <Route path="/packages"  element={<PrivateRoute><Packages /></PrivateRoute>} />
                    <Route path="/broadcast" element={<PrivateRoute><Broadcast /></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                    <Route path="/test-ai"   element={<PrivateRoute><TestAI /></PrivateRoute>} />
                    <Route path="/bookings"  element={<PrivateRoute><Bookings /></PrivateRoute>} />
                    <Route path="/faqs"      element={<PrivateRoute><Faqs /></PrivateRoute>} />
                    <Route path="/gallery"   element={<PrivateRoute><Gallery /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
