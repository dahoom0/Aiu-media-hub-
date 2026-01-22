import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { DashboardLayout } from './components/DashboardLayout';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TutorialsPage } from './components/TutorialsPage';
import { LabBookingPage } from './components/LabBookingPage';
import { EquipmentRentalPage } from './components/EquipmentRentalPage';
import { CVGeneratorPage } from './components/CVGeneratorPage';
import { ProfilePage } from './components/ProfilePage';
import { ChangePasswordPage } from './components/ChangePasswordPage';
import { AdminTutorialManagement } from './components/AdminTutorialManagement';
import { AdminLabManagement } from './components/AdminLabManagement';
import { AdminEquipmentManagement } from './components/AdminEquipmentManagement';
import { AdminCVReview } from './components/AdminCVReview';
import { AdminProfileManagement } from './components/AdminProfileManagement';
import { StudentCVView } from './components/StudentCVView';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import authService from './services/authService';

type PageType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'student-dashboard'
  | 'admin-dashboard'
  | 'tutorials'
  | 'lab-booking'
  | 'equipment-rental'
  | 'cv-generator'
  | 'profile'
  | 'change-password'
  | 'settings'
  | 'admin-tutorials'
  | 'admin-labs'
  | 'admin-equipment'
  | 'admin-cv-review'
  | 'admin-profiles'
  | 'student-cv-view';

function isAdminUser(user: any): boolean {
  if (!user) return false;
  if (user.user_type && String(user.user_type).toLowerCase() === 'admin') return true;
  if (user.is_staff === true) return true;
  const role = String(user.role || '').toLowerCase();
  if (role.includes('admin')) return true;
  return false;
}

function isValidPageType(p: string): p is PageType {
  const allowed: PageType[] = [
    'landing',
    'login',
    'signup',
    'forgot-password',
    'reset-password',
    'student-dashboard',
    'admin-dashboard',
    'tutorials',
    'lab-booking',
    'equipment-rental',
    'cv-generator',
    'profile',
    'change-password',
    'settings',
    'admin-tutorials',
    'admin-labs',
    'admin-equipment',
    'admin-cv-review',
    'admin-profiles',
    'student-cv-view',
  ];
  return allowed.includes(p as PageType);
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [isAdmin, setIsAdmin] = useState(false);
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const applyDeepLink = () => {
      const qs = new URLSearchParams(window.location.search);

      const page = (qs.get('page') || '').trim();
      const uid = (qs.get('uid') || '').trim();
      const token = (qs.get('token') || '').trim();

      // Only allow deep-linking to reset-password (safe)
      if (page === 'reset-password' && uid && token) {
        setCurrentPage('reset-password');
        setNavigationParams({ uid, token });

        // ✅ Strip query string immediately (your architecture rule)
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }

      // Strip unknown junk query strings to keep app clean
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      return false;
    };

    const checkLogin = () => {
      // Deep link has priority (user might not be logged in)
      const deepLinked = applyDeepLink();
      if (deepLinked) {
        setIsLoading(false);
        return;
      }

      if (authService.isAuthenticated()) {
        const user = authService.getUser();
        const admin = isAdminUser(user);

        setIsAdmin(admin);
        setCurrentPage(admin ? 'admin-dashboard' : 'student-dashboard');
      }

      setIsLoading(false);
    };

    checkLogin();
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    const clean = String(page || '').split('?')[0]; // ✅ strip accidental query strings
    if (!isValidPageType(clean)) {
      setCurrentPage('landing');
      setNavigationParams({});
      return;
    }

    const user = authService.getUser();
    const admin = isAdminUser(user);

    // Allow auth pages regardless of role
    if (clean === 'landing' || clean === 'login' || clean === 'signup' || clean === 'forgot-password' || clean === 'reset-password') {
      setIsAdmin(admin);
      setCurrentPage(clean);
      setNavigationParams(params || {});
      return;
    }

    if (admin && clean === 'student-dashboard') {
      setIsAdmin(true);
      setCurrentPage('admin-dashboard');
      setNavigationParams(params || {});
      return;
    }

    if (!admin && clean.startsWith('admin-')) {
      setIsAdmin(false);
      setCurrentPage('student-dashboard');
      setNavigationParams(params || {});
      return;
    }

    setIsAdmin(admin);
    setCurrentPage(clean);
    setNavigationParams(params || {});
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;

      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;

      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;

      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;

      case 'reset-password':
        return (
          <ResetPasswordPage
            onNavigate={handleNavigate}
            uid={navigationParams?.uid}
            token={navigationParams?.token}
          />
        );

      case 'student-dashboard':
        return (
          <DashboardLayout activePage="student-dashboard" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <StudentDashboard onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'admin-dashboard':
        return (
          <DashboardLayout activePage="admin-dashboard" onNavigate={handleNavigate} isAdmin={true}>
            <AdminDashboard onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'tutorials':
        return (
          <DashboardLayout activePage="tutorials" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <TutorialsPage />
          </DashboardLayout>
        );

      case 'lab-booking':
        return (
          <DashboardLayout activePage="lab-booking" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <LabBookingPage onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'equipment-rental':
        return (
          <DashboardLayout activePage="equipment-rental" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <EquipmentRentalPage onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'cv-generator':
        return (
          <DashboardLayout activePage="cv-generator" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <CVGeneratorPage />
          </DashboardLayout>
        );

      case 'profile':
        return (
          <DashboardLayout activePage="profile" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <ProfilePage isAdmin={isAdmin} onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'change-password':
        return (
          <DashboardLayout activePage="change-password" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <ChangePasswordPage onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'admin-tutorials':
        return (
          <DashboardLayout activePage="admin-tutorials" onNavigate={handleNavigate} isAdmin={true}>
            <AdminTutorialManagement />
          </DashboardLayout>
        );

      case 'admin-labs':
        return (
          <DashboardLayout activePage="admin-labs" onNavigate={handleNavigate} isAdmin={true}>
            <AdminLabManagement />
          </DashboardLayout>
        );

      case 'admin-equipment':
        return (
          <DashboardLayout activePage="admin-equipment" onNavigate={handleNavigate} isAdmin={true}>
            <AdminEquipmentManagement onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      case 'admin-cv-review':
        return (
          <DashboardLayout activePage="admin-cv-review" onNavigate={handleNavigate} isAdmin={true}>
            <AdminCVReview onNavigate={handleNavigate} initialStudentId={navigationParams?.studentId} />
          </DashboardLayout>
        );

      case 'admin-profiles':
        return (
          <DashboardLayout activePage="admin-profiles" onNavigate={handleNavigate} isAdmin={true}>
            <AdminProfileManagement onNavigate={handleNavigate} initialStudentId={navigationParams?.studentId} />
          </DashboardLayout>
        );

      case 'student-cv-view':
        return (
          <DashboardLayout activePage="cv-generator" onNavigate={handleNavigate} isAdmin={isAdmin}>
            <StudentCVView onNavigate={handleNavigate} />
          </DashboardLayout>
        );

      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  return (
    <ThemeProvider>
      {renderPage()}
      <Toaster />
    </ThemeProvider>
  );
}
