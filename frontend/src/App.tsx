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
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import authService from './services/authService'; // Import Auth Service

type PageType = 
  | 'landing' 
  | 'login'
  | 'signup'
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [isAdmin, setIsAdmin] = useState(false);
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // --- NEW: Check Login Status on App Load ---
  useEffect(() => {
    const checkLogin = () => {
      if (authService.isAuthenticated()) {
        const user = authService.getUser();
        
        // Determine role and set initial page
        if (user?.is_staff || user?.user_type === 'admin') {
          setIsAdmin(true);
          setCurrentPage('admin-dashboard');
        } else {
          setIsAdmin(false);
          setCurrentPage('student-dashboard');
        }
      }
      setIsLoading(false);
    };
    
    checkLogin();
  }, []);
  // -------------------------------------------

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page as PageType);
    setNavigationParams(params || {});
    
    // Set admin state based on page or user data
    // We can also double check user data here
    const user = authService.getUser();
    if (page.startsWith('admin-')) {
       setIsAdmin(true);
    } else if (page === 'student-dashboard') {
       setIsAdmin(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;
      
      case 'student-dashboard':
        return (
          <DashboardLayout activePage="student-dashboard" onNavigate={handleNavigate}>
            <StudentDashboard onNavigate={handleNavigate} />
          </DashboardLayout>
        );
      
      case 'admin-dashboard':
        return (
          <DashboardLayout activePage="admin-dashboard" onNavigate={handleNavigate} isAdmin>
            <AdminDashboard onNavigate={handleNavigate} />
          </DashboardLayout>
        );
      
      case 'tutorials':
        return (
          <DashboardLayout 
            activePage="tutorials" 
            onNavigate={handleNavigate}
            isAdmin={isAdmin}
          >
            <TutorialsPage />
          </DashboardLayout>
        );
      
      case 'lab-booking':
        return (
          <DashboardLayout 
            activePage="lab-booking" 
            onNavigate={handleNavigate}
            isAdmin={isAdmin}
          >
            <LabBookingPage onNavigate={handleNavigate} />
          </DashboardLayout>
        );
      
      case 'equipment-rental':
        return (
          <DashboardLayout 
            activePage="equipment-rental" 
            onNavigate={handleNavigate}
            isAdmin={isAdmin}
          >
            <EquipmentRentalPage onNavigate={handleNavigate} />
          </DashboardLayout>
        );
      
      case 'cv-generator':
        return (
          <DashboardLayout activePage="cv-generator" onNavigate={handleNavigate}>
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
          <DashboardLayout activePage="admin-tutorials" onNavigate={handleNavigate} isAdmin>
            <AdminTutorialManagement />
          </DashboardLayout>
        );
      
      case 'admin-labs':
        return (
          <DashboardLayout activePage="admin-labs" onNavigate={handleNavigate} isAdmin>
            <AdminLabManagement />
          </DashboardLayout>
        );
      
      case 'admin-equipment':
        return (
          <DashboardLayout activePage="admin-equipment" onNavigate={handleNavigate} isAdmin>
            <AdminEquipmentManagement />
          </DashboardLayout>
        );
      
      case 'admin-cv-review':
        return (
          <DashboardLayout activePage="admin-cv-review" onNavigate={handleNavigate} isAdmin>
            <AdminCVReview onNavigate={handleNavigate} initialStudentId={navigationParams?.studentId} />
          </DashboardLayout>
        );
      
      case 'admin-profiles':
        return (
          <DashboardLayout activePage="admin-profiles" onNavigate={handleNavigate} isAdmin>
            <AdminProfileManagement onNavigate={handleNavigate} initialStudentId={navigationParams?.studentId} />
          </DashboardLayout>
        );
      
      case 'student-cv-view':
        return (
          <DashboardLayout activePage="cv-generator" onNavigate={handleNavigate}>
            <StudentCVView onNavigate={handleNavigate} />
          </DashboardLayout>
        );
      
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Prevent flashing "Landing Page" while checking login
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