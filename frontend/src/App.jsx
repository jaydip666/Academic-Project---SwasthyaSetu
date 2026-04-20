// ================= FRONTEND FILE =================
// File: App.jsx
// Purpose: Main entry point and routing configuration for the React application
// Handles: Protected routes, role-based navigation, and global layout component assembly

import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RoleSelection from './pages/auth/RoleSelection';
import ForgotPassword from './pages/auth/ForgotPassword';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';

// Public Pages
import Hospitals from './pages/Hospitals';
import HospitalDetails from './pages/HospitalDetails';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Contact from './pages/Contact';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import SearchDoctors from './pages/patient/SearchDoctors';
import SymptomChecker from './pages/patient/SymptomChecker';
import MedicalRecords from './pages/patient/MedicalRecords';
import EditProfile from './pages/patient/EditProfile';
import ArchiveAnalytics from './pages/patient/ArchiveAnalytics';
import FinancialLedger from './pages/patient/FinancialLedger';
import ClinicalReceipts from './pages/patient/ClinicalReceipts';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorEditProfile from './pages/doctor/DoctorEditProfile';
import MyPatients from './pages/doctor/MyPatients';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorRecords from './pages/doctor/DoctorRecords';
import DoctorEarnings from './pages/doctor/DoctorEarnings';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminPatients from './pages/admin/AdminPatients';
import AdminHospitals from './pages/admin/AdminHospitals';
import AdminInquiries from './pages/admin/AdminInquiries';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReports from './pages/admin/AdminReports';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute Check:', { role, userEmail: user?.email, userRole: user?.role, loading });

  if (loading) {
    console.log('ProtectedRoute: Still loading...');
    return <div style={{ padding: '2rem', textAlign: 'center' }}><span className="dr-loading-label">Checking Security...</span></div>;
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    console.log(`ProtectedRoute: Role mismatch. Expected ${role}, got ${user.role}. Redirecting to /${user.role}`);
    return <Navigate to={`/${user.role}`} />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <ErrorBoundary>
          <ScrollToTopOnNavigate />
          <ScrollToTop />
          <Navbar />
          <main>


          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/hospitals/:id" element={<HospitalDetails />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute role="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/patient/search" element={
              <ProtectedRoute role="patient">
                <SearchDoctors />
              </ProtectedRoute>
            } />
            <Route path="/patient/symptom-checker" element={
              <ProtectedRoute role="patient">
                <SymptomChecker />
              </ProtectedRoute>
            } />
            <Route path="/patient/records" element={
              <ProtectedRoute role="patient">
                <MedicalRecords />
              </ProtectedRoute>
            } />
            <Route path="/patient/profile" element={
              <ProtectedRoute role="patient">
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/patient/archive" element={
              <ProtectedRoute role="patient">
                <ArchiveAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/patient/ledger" element={
              <ProtectedRoute role="patient">
                <FinancialLedger />
              </ProtectedRoute>
            } />
            <Route path="/patient/receipts" element={
              <ProtectedRoute role="patient">
                <ClinicalReceipts />
              </ProtectedRoute>
            } />
            <Route path="/patient/services/:department" element={
              <ProtectedRoute role="patient">
                <ServiceDetail />
              </ProtectedRoute>
            } />
            <Route path="/services/:department" element={<ServiceDetail />} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/profile" element={
              <ProtectedRoute role="doctor">
                <DoctorEditProfile />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute role="doctor">
                <MyPatients />
              </ProtectedRoute>
            } />
            <Route path="/doctor/schedule" element={
              <ProtectedRoute role="doctor">
                <DoctorSchedule />
              </ProtectedRoute>
            } />
            <Route path="/doctor/records" element={
              <ProtectedRoute role="doctor">
                <DoctorRecords />
              </ProtectedRoute>
            } />
            <Route path="/doctor/earnings" element={
              <ProtectedRoute role="doctor">
                <DoctorEarnings />
              </ProtectedRoute>
            } />
            <Route path="/doctor/appointments" element={
              <ProtectedRoute role="doctor">
                <DoctorAppointments />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/doctors" element={
              <ProtectedRoute role="admin">
                <AdminDoctors />
              </ProtectedRoute>
            } />
            <Route path="/admin/patients" element={
              <ProtectedRoute role="admin">
                <AdminPatients />
              </ProtectedRoute>
            } />
            <Route path="/admin/hospitals" element={
              <ProtectedRoute role="admin">
                <AdminHospitals />
              </ProtectedRoute>
            } />
            <Route path="/admin/inquiries" element={
              <ProtectedRoute role="admin">
                <AdminInquiries />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute role="admin">
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute role="admin">
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute role="admin">
                <AdminReports />
              </ProtectedRoute>
            } />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </main>
          <Footer />
        </ErrorBoundary>
      </div>
    </AuthProvider>

  );
}

export default App;
