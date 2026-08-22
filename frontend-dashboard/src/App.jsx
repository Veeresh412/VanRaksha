import { BrowserRouter, Navigate, Outlet, Route, Routes, useOutletContext } from 'react-router-dom'
import { AppDataProvider } from './contexts/AppDataContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import JurisdictionsPage from './pages/JurisdictionsPage'
import AlertFlagsPage from './pages/AlertFlagsPage'
import CitizenReportsPage from './pages/CitizenReportsPage'
import ModelBacktestingPage from './pages/ModelBacktestingPage'
import UsersRolesPage from './pages/UsersRolesPage'
import AdminSettingsPage from './pages/AdminSettingsPage'

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function AdminOnlyRoute() {
  const { session } = useAuth()
  const dashboardContext = useOutletContext()

  if (!session || session.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet context={dashboardContext} />
}

function RootRedirect() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jurisdictions" element={<JurisdictionsPage />} />
          <Route path="/alerts" element={<AlertFlagsPage />} />
          <Route path="/reports" element={<CitizenReportsPage />} />
          <Route path="/backtesting" element={<ModelBacktestingPage />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="/users" element={<UsersRolesPage />} />
            <Route path="/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
