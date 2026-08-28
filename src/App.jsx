import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Agents from '@/pages/Agents';
import Autopilot from '@/pages/Autopilot';
import Services from '@/pages/Services';
import Creatives from '@/pages/Creatives';
import Orders from '@/pages/Orders';
import Studio from '@/pages/Studio';
import SettingsPage from '@/pages/Settings';
import Store from '@/pages/Store';
import ThankYou from '@/pages/ThankYou';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/ThankYou" element={<ThankYou />} />
            <Route path="/store" element={<Store />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/autopilot" element={<Autopilot />} />
                <Route path="/services" element={<Services />} />
                <Route path="/creatives" element={<Creatives />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App