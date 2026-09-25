
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { InviteRedemptionPage } from './pages/InviteRedemptionPage';
import { TemplateSelectionPage } from './pages/TemplateSelectionPage';
import { PrincipleSummaryPage } from './pages/PrincipleSummaryPage';
import { InviteUsersPage } from './pages/InviteUsersPage';
import { PrincipleCustomizationPage } from './pages/PrincipleCustomizationPage';
import { ReviewDashboardPage } from './pages/ReviewDashboardPage';
import { ReviewerLoginPage } from './pages/ReviewerLoginPage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { ManagerCockpitPage } from './pages/ManagerCockpitPage';
import { ManagerAssessmentPage } from './pages/ManagerAssessmentPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminCycleDetailsPage } from './pages/AdminCycleDetailsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/invite" element={<InviteRedemptionPage />} />
            <Route path="/setup/template" element={<TemplateSelectionPage />} />
            <Route path="/setup/summary" element={<PrincipleSummaryPage />} />
            <Route path="/setup/invite" element={<InviteUsersPage />} />
            <Route path="/setup/customize" element={<PrincipleCustomizationPage />} />
            {/* Reviewer Login is likely redundant with general Login, but keeping for now as it had specific logic */}
            <Route path="/review/login" element={<ReviewerLoginPage />} />
            <Route path="/review/dashboard" element={<ReviewDashboardPage />} />
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/cockpit" element={<ManagerCockpitPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/cycle/:cycleId" element={<AdminCycleDetailsPage />} />
            <Route path="/manager/assessment/:requestId" element={<ManagerAssessmentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
