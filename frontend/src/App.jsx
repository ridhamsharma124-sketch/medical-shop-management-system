import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './pages/landing-page/Navbar';
import Hero from './pages/landing-page/Hero';
import StatsBar from './pages/landing-page/StatsBar';
import Features from './pages/landing-page/Features';
import About from './pages/landing-page/About';
import Contact from './pages/landing-page/Contact';
import Footer from './pages/landing-page/Footer';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MedicinesPage from './pages/admin/MedicinesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import InventoryPage from './pages/admin/InventoryPage';
import PharmacistsPage from './pages/admin/PharmacistsPage';
import ProfilePage from './pages/admin/ProfilePage';
import CustomersPage from './pages/admin/CustomersPage';
import PurchasesPage from './pages/admin/PurchasesPage';
import PharmacistDashboard from './pages/pharmacists/PharmacistDashboard';
import PharmacistMedicinesPage from './pages/pharmacists/MedicinesPage';
import PharmacistInventoryPage from './pages/pharmacists/InventoryPage';
import PharmacistSuppliersPage from './pages/pharmacists/SuppliersPage';
import PharmacistCustomersPage from './pages/pharmacists/CustomersPage';
import PharmacistPurchasesPage from './pages/pharmacists/PurchasesPage';
import PharmacistProfilePage from './pages/pharmacists/ProfilePage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import PrivacyPolicyPage from './pages/landing-page/PrivacyPolicyPage';
import './App.css';

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Features />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#FFFFFF',
            color: '#1f2937',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13.5px',
            fontWeight: 500,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
            style: {
              borderBottom: '4px solid #16a34a',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
            },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
            style: {
              borderBottom: '4px solid #dc2626',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
            },
          },
          loading: {
            iconTheme: { primary: '#6b7280', secondary: '#ffffff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="pharmacists" element={<PharmacistsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="/pharmacist" element={<DashboardLayout />}>
          <Route index element={<PharmacistDashboard />} />
          <Route path="inventory" element={<PharmacistInventoryPage />} />
          <Route path="medicines" element={<PharmacistMedicinesPage />} />
          <Route path="suppliers" element={<PharmacistSuppliersPage />} />
          <Route path="customers" element={<PharmacistCustomersPage />} />
          <Route path="purchases" element={<PharmacistPurchasesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<PharmacistProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}