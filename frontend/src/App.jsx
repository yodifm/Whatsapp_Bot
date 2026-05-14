import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import PrivateRoute from '@/components/PrivateRoute';
import Login from '@/Pages/Login';
import BookingForm from '@/Pages/BookingForm';
import FormBookings from '@/Pages/backend/FormBookings';
import UploadFrame from '@/Pages/backend/UploadFrame';
import Kiosks from '@/Pages/backend/Kiosks';
import Logistics from '@/Pages/backend/Logistics';
import LogisticStaff from '@/Pages/backend/LogisticStaff';
import StaffCheckin from '@/Pages/StaffCheckin';
import Sales from '@/Pages/backend/Sales';
import Analytics from '@/Pages/backend/Analytics';
import Bookings from '@/Pages/backend/Bookings';
import Discounts from '@/Pages/backend/Discounts';
import Broadcast from '@/Pages/backend/Broadcast';
import Dashboard from '@/Pages/backend/Dashboard';
import Users from '@/Pages/backend/Users';
import Faqs from '@/Pages/backend/Faqs';
import Gallery from '@/Pages/backend/Gallery';
import Packages from '@/Pages/backend/Packages';
import Settings from '@/Pages/backend/Settings';
import TestAI from '@/Pages/backend/TestAI';
import FeedbackForm from '@/Pages/FeedbackForm';
import Feedbacks from '@/Pages/backend/Feedbacks';
import ReimbursementForm from '@/Pages/ReimbursementForm';
import Reimbursements from '@/Pages/backend/Reimbursements';
import OperasionalSettings from '@/Pages/backend/OperasionalSettings';
import CustomerDetail from '@/Pages/backend/CustomerDetail';

export default function App() {
    return (
        <ToastProvider>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login"    element={<Login />} />
                    <Route path="/booking" element={<BookingForm />} />
                    <Route path="/staff"   element={<StaffCheckin />} />
                    <Route path="/feedback" element={<FeedbackForm />} />
                    <Route path="/"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
                    <Route path="/packages"  element={<PrivateRoute><Packages /></PrivateRoute>} />
                    <Route path="/broadcast" element={<PrivateRoute><Broadcast /></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                    <Route path="/test-ai"   element={<PrivateRoute><TestAI /></PrivateRoute>} />
                    <Route path="/bookings"  element={<PrivateRoute><Bookings /></PrivateRoute>} />
                    <Route path="/faqs"      element={<PrivateRoute><Faqs /></PrivateRoute>} />
                    <Route path="/discounts" element={<PrivateRoute><Discounts /></PrivateRoute>} />
                    <Route path="/gallery"        element={<PrivateRoute><Gallery /></PrivateRoute>} />
                    <Route path="/form-bookings"  element={<PrivateRoute><FormBookings /></PrivateRoute>} />
                    <Route path="/upload-frame"  element={<PrivateRoute><UploadFrame /></PrivateRoute>} />
                    <Route path="/kiosks"          element={<PrivateRoute><Kiosks /></PrivateRoute>} />
                    <Route path="/logistics"       element={<PrivateRoute><Logistics /></PrivateRoute>} />
                    <Route path="/logistic-staff"  element={<PrivateRoute><LogisticStaff /></PrivateRoute>} />
                    <Route path="/sales"           element={<PrivateRoute><Sales /></PrivateRoute>} />
                    <Route path="/users"     element={<PrivateRoute><Users /></PrivateRoute>} />
                    <Route path="/feedbacks" element={<PrivateRoute><Feedbacks /></PrivateRoute>} />
                    <Route path="/reimbursement"  element={<ReimbursementForm />} />
                    <Route path="/reimbursements" element={<PrivateRoute><Reimbursements /></PrivateRoute>} />
                    <Route path="/op-settings"   element={<PrivateRoute><OperasionalSettings /></PrivateRoute>} />
                    <Route path="/customers/:id" element={<PrivateRoute><CustomerDetail /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
    );
}
