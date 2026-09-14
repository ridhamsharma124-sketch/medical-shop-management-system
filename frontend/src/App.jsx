import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './pages/landing-page/Navbar';
import Hero from './pages/landing-page/Hero';
import StatsBar from './pages/landing-page/StatsBar';
import Features from './pages/landing-page/Features';
import About from './pages/landing-page/About';
import Contact from './pages/landing-page/Contact';
import Footer from './pages/landing-page/Footer';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MedicinesPage from './pages/admin/MedicinesPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import InventoryPage from './pages/admin/InventoryPage';
import PharmacistDashboard from './pages/pharmacists/PharmacistDashboard';
import PlaceholderPage from './pages/PlaceholderPage';
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
  const placeholderPages = [
    { path: 'pharmacists', title: 'Pharmacist Management' },
    { path: 'purchases', title: 'Purchase Orders' },
    { path: 'customers', title: 'Customer Management' },
    { path: 'billing', title: 'Billing' },
    { path: 'reports', title: 'Reports' },
    { path: 'notifications', title: 'Notifications' },
    { path: 'profile', title: 'My Profile' },
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          {placeholderPages.map((p) => (
            <Route key={p.path} path={p.path} element={<PlaceholderPage title={p.title} />} />
          ))}
        </Route>
        <Route path="/pharmacist" element={<DashboardLayout />}>
          <Route index element={<PharmacistDashboard />} />
          <Route path="inventory" element={<InventoryPage />} />
          {placeholderPages
            .filter((p) => !['pharmacists', 'suppliers', 'purchases', 'reports'].includes(p.path))
            .map((p) => (
              <Route key={p.path} path={p.path} element={<PlaceholderPage title={p.title} />} />
            ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}