import { ReactNode, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  BookOpen,
  LayoutDashboard,
  Video,
  Calendar,
  Package,
  FolderOpen,
  FileCheck,
  Monitor,
  Users,
  LogOut,
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';
import authService from '../services/authService';
import { Dialog, DialogContent } from './ui/dialog';

interface DashboardLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

interface SidebarUser {
  name: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
}

export function DashboardLayout({
  children,
  activePage,
  onNavigate,
  isAdmin = false,
}: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<SidebarUser>({
    name: isAdmin ? 'Admin User' : 'Student',
    email: isAdmin ? 'admin@aiu.edu.my' : 'student@aiu.edu.my',
    initials: isAdmin ? 'AD' : 'ST',
    avatarUrl: null,
  });

  // ✅ mobile detection (does NOT rely on Tailwind breakpoints)
  const [isMobile, setIsMobile] = useState(false);

  // ✅ mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 767px matches Tailwind "md" boundary (md starts at 768px)
    const mq = window.matchMedia('(max-width: 767px)');

    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      // if switching to desktop, ensure drawer is closed
      if (!mobile) setSidebarOpen(false);
    };

    apply();

    // Safari/older browsers compatibility
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } else {
      // @ts-ignore
      mq.addListener(apply);
      return () => {
        // @ts-ignore
        mq.removeListener(apply);
      };
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const merged = await authService.getProfile(); // GET /auth/profile/

        const firstName = merged.first_name || '';
        const lastName = merged.last_name || '';
        const fullName =
          firstName || lastName ? `${firstName} ${lastName}`.trim() : merged.username || 'User';

        const initials =
          (firstName[0] || fullName[0] || 'U').toUpperCase() + (lastName[0] || '').toUpperCase();

        setUser({
          name: fullName,
          email: merged.email || '',
          initials,
          avatarUrl: merged.profile_picture || null,
        });
      } catch (err) {
        console.error('Failed to load sidebar user', err);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    authService.logout();
    onNavigate('landing');
    setSidebarOpen(false);
  };

  const studentNavItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutorials', label: 'Tutorials', icon: Video },
    { id: 'lab-booking', label: 'Lab Booking', icon: Calendar },
    { id: 'equipment-rental', label: 'Equipment Bookings', icon: Package },
    { id: 'cv-generator', label: 'CV Generator', icon: FolderOpen },
  ];

  // ✅ IMPORTANT: admin should go to ADMIN pages (not student pages)
  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-tutorials', label: 'Tutorials', icon: Video },
    { id: 'admin-labs', label: 'Lab Booking', icon: Monitor },
    { id: 'admin-equipment', label: 'Equipment Bookings', icon: Package },
    { id: 'admin-cv-review', label: 'CV Review', icon: FileCheck },
    { id: 'admin-profiles', label: 'Profiles', icon: Users },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  // ✅ same sidebar UI (unchanged), reused for desktop + drawer
  const Sidebar = ({ inDrawer }: { inDrawer: boolean }) => (
    <aside
      className={`w-72 border-r flex flex-col h-full ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
      }`}
    >
      {/* Logo */}
      <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-[16px] ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Media Hub</h3>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {isAdmin ? 'Admin Panel' : 'Student Portal'}
            </p>
          </div>

          {inDrawer && (
            <Button
              variant="ghost"
              size="icon"
              className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (inDrawer) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[16px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
        <button
          onClick={() => {
            onNavigate('profile');
            if (inDrawer) setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
            theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-800/50 hover:bg-gray-800'
          }`}
        >
          <Avatar>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                {user.initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
            <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{user.email}</p>
          </div>
        </button>

        <Button
          variant="ghost"
          className={`w-full mt-2 justify-start ${
            theme === 'light'
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className={`flex h-screen ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
      {/* ✅ Desktop/tablet: sidebar inline ALWAYS */}
      {!isMobile && <Sidebar inDrawer={false} />}

      {/* ✅ Mobile: sidebar in drawer */}
      {isMobile && (
        <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DialogContent
            className={`p-0 gap-0 border-0 max-w-[18rem] w-[18rem] h-[100vh] left-0 top-0 translate-x-0 translate-y-0 rounded-none ${
              theme === 'light' ? 'bg-white' : 'bg-gray-900'
            }`}
          >
            <Sidebar inDrawer={true} />
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header
          className={`h-16 border-b backdrop-blur-sm flex items-center justify-between px-6 ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
          }`}
        >
          <div className="flex items-center gap-4 flex-1 max-w-2xl min-w-0">
            {/* ✅ Only show menu on mobile */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <div className="relative flex-1 min-w-0">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                }`}
              />
              <Input
                placeholder="Search tutorials, equipment, labs..."
                className={`pl-10 w-full ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500'
                    : 'bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`relative ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-teal-500 text-white text-xs">
                3
              </Badge>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-auto ${
            theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
