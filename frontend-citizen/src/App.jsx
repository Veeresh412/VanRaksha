import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import LanguageProvider from './context/LanguageProvider';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login/Login';
import RegistrationSelection from './pages/RegistrationSelection/RegistrationSelection';
import IndividualRegistration from './pages/IndividualRegistration/IndividualRegistration';
import OrganizationRegistration from './pages/OrganizationRegistration/OrganizationRegistration';
import Home from './pages/Home/Home';
import ReportIncident from './pages/ReportIncident/ReportIncident';
import Reports from './pages/Reports/Reports';
import ReportDetails from './pages/ReportDetails/ReportDetails';
import Profile from './pages/Profile/Profile';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegistrationSelection />} />
            <Route path="/register/individual" element={<IndividualRegistration />} />
            <Route path="/register/organization" element={<OrganizationRegistration />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportIncident />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
