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
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Users,
  FileCheck,
  Monitor
} from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';
import authService from '../services/authService';

interface DashboardLayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

export function DashboardLayout({ children, activePage, onNavigate, isAdmin = false }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  
  // --- NEW: User State Logic ---
  const [user, setUser] = useState({
    name: isAdmin ? 'Admin User' : 'Student',
    email: isAdmin ? 'admin@aiu.edu.my' : 'student@aiu.edu.my',
    initials: isAdmin ? 'AD' : 'ST'
  });

  useEffect(() => {
    const userData = authService.getUser();
    if (userData) {
      const firstName = userData.first_name || '';
      const lastName = userData.last_name || '';
      const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : (userData.username || 'User');
      
      setUser({
        name: fullName,
        email: userData.email || '',
        initials: (firstName[0] || fullName[0] || 'U').toUpperCase() + (lastName[0] || '').toUpperCase()
      });
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    onNavigate('landing');
  };
  // -----------------------------
  
  const studentNavItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutorials', label: 'Tutorials', icon: Video },
    { id: 'lab-booking', label: 'Lab Booking', icon: Calendar },
    { id: 'equipment-rental', label: 'Equipment Bookings', icon: Package },
    { id: 'cv-generator', label: 'CV Generator', icon: FolderOpen },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-tutorials', label: 'Tutorial Management', icon: Video },
    { id: 'admin-labs', label: 'Lab Management', icon: Monitor },
    { id: 'admin-equipment', label: 'Equipment Management', icon: Package },
    { id: 'admin-cv-review', label: 'CV Review', icon: FileCheck },
    { id: 'admin-profiles', label: 'Profile Management', icon: Users },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <div className={`flex h-screen ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
      {/* Sidebar */}
      <aside className={`w-72 border-r flex flex-col ${
        theme === 'light' 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-900/50 border-gray-800'
      }`}>
        {/* Logo */}
        <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className={`text-[16px] ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Media Hub</h3>
              <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {isAdmin ? 'Admin Panel' : 'Student Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
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

        {/* User Profile - UPDATED WITH DYNAMIC DATA */}
        <div className={`p-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
          <button 
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-gray-50 hover:bg-gray-100'
                : 'bg-gray-800/50 hover:bg-gray-800'
            }`}
          >
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {user.name}
              </p>
              <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {user.email}
              </p>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className={`h-16 border-b backdrop-blur-sm flex items-center justify-between px-6 ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-900/50 border-gray-800'
        }`}>
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`lg:hidden ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
              <Input
                placeholder="Search tutorials, equipment, labs..."
                className={`pl-10 ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500'
                    : 'bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500'
                }`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${
          theme === 'light' 
            ? 'bg-[#EBF2FA]' 
            : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}