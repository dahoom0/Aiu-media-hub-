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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import tutorialService from '../services/tutorialService';
import equipmentService from '../services/equipmentService';

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    const normalizeImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      
      const isDev = import.meta.env.DEV;
      const HOST = window.location.hostname;
      const BACKEND = isDev ? `http://${HOST}:8000` : '';
      
      if (url.startsWith('/media/')) return `${BACKEND}${url}`;
      if (url.startsWith('media/')) return `${BACKEND}/${url}`;
      return `${BACKEND}/media/${url.replace(/^\/+/, '')}`;
    };

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
          avatarUrl: normalizeImageUrl(merged.profile_picture),
        });
      } catch (err) {
        console.error('Failed to load sidebar user', err);
      }
    };

    loadUser();

    // ✅ Listen for profile updates
    const handleProfileUpdate = () => {
      loadUser();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const notificationsList: any[] = [];
      
      // Check for CV feedback if user is a student
      if (!isAdmin) {
        try {
          const cvService = await import('../services/cvService');
          const cvData = await cvService.default.getMyCV();
          
          if (cvData && cvData.reviewed_at) {
            const reviewedDate = new Date(cvData.reviewed_at);
            const timeAgo = getTimeAgo(reviewedDate);
            
            // Only show notification if reviewed recently (within last 7 days)
            const daysSinceReview = Math.floor((new Date().getTime() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceReview <= 7) {
              // Add notification based on CV status
              if (cvData.status === 'approved') {
                notificationsList.push({
                  id: `cv-approved-${cvData.id}`,
                  title: 'CV Approved!',
                  message: cvData.admin_comment || 'Congratulations! Your CV has been approved by the admin.',
                  time: timeAgo,
                  read: false,
                  type: 'success',
                  action: () => onNavigate('student-cv-view')
                });
              } else if (cvData.status === 'flagged' && cvData.admin_comment) {
                notificationsList.push({
                  id: `cv-flagged-${cvData.id}`,
                  title: 'CV Flagged',
                  message: cvData.admin_comment.substring(0, 100) + (cvData.admin_comment.length > 100 ? '...' : ''),
                  time: timeAgo,
                  read: false,
                  type: 'error',
                  action: () => onNavigate('student-cv-view')
                });
              } else if (cvData.status === 'needs-changes' && cvData.admin_comment) {
                notificationsList.push({
                  id: `cv-feedback-${cvData.id}`,
                  title: 'CV Feedback Received',
                  message: cvData.admin_comment.substring(0, 100) + (cvData.admin_comment.length > 100 ? '...' : ''),
                  time: timeAgo,
                  read: false,
                  type: 'warning',
                  action: () => onNavigate('student-cv-view')
                });
              }
            }
          }
        } catch (err) {
          console.log('No CV data available');
        }
      }
      
      // Load lab booking notifications
      if (!isAdmin) {
        try {
          const labBookingService = await import('../services/labBookingService');
          const bookings = await labBookingService.default.getMyBookings();
          const bookingsList = Array.isArray(bookings) ? bookings : bookings?.results || [];
          
          // Show approved bookings from last 3 days
          const recentApproved = bookingsList.filter((b: any) => {
            if (b.status !== 'approved') return false;
            if (!b.updated_at && !b.created_at) return false;
            
            const bookingDate = new Date(b.updated_at || b.created_at);
            const daysSince = Math.floor((new Date().getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysSince <= 3;
          });
          
          recentApproved.forEach((booking: any) => {
            const labName = booking.lab_name || booking.lab_room || `Lab #${booking.lab}`;
            const bookingDate = new Date(booking.updated_at || booking.created_at);
            
            notificationsList.push({
              id: `booking-approved-${booking.id}`,
              title: 'Lab Booking Approved',
              message: `Your booking for ${labName} on ${booking.booking_date || booking.date} has been approved`,
              time: getTimeAgo(bookingDate),
              read: false,
              type: 'success',
              action: () => onNavigate('lab-booking')
            });
          });
        } catch (err) {
          console.log('No booking data available');
        }
      }
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    };

    loadNotifications();
  }, [isAdmin, onNavigate]);

  // Helper function to get relative time
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container') && !target.closest('.search-results')) {
        setShowSearchResults(false);
      }
      if (!target.closest('.notification-button') && !target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      try {
        const [tutorialsRes, equipmentRes] = await Promise.all([
          tutorialService.getAll(),
          equipmentService.getAll()
        ]);

        const tutorials = Array.isArray(tutorialsRes) ? tutorialsRes : tutorialsRes?.results || [];
        const equipment = Array.isArray(equipmentRes) ? equipmentRes : equipmentRes?.results || [];

        const query = searchQuery.toLowerCase();

        const tutorialResults = tutorials
          .filter((t: any) => 
            t.title?.toLowerCase().includes(query) || 
            t.description?.toLowerCase().includes(query) ||
            t.category_name?.toLowerCase().includes(query)
          )
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            type: 'tutorial',
            subtitle: t.category_name || 'Tutorial',
            icon: Video
          }));

        const equipmentResults = equipment
          .filter((e: any) => 
            e.name?.toLowerCase().includes(query) || 
            e.description?.toLowerCase().includes(query) ||
            e.equipment_id?.toLowerCase().includes(query)
          )
          .slice(0, 5)
          .map((e: any) => ({
            id: e.id,
            title: e.name,
            type: 'equipment',
            subtitle: e.equipment_id || 'Equipment',
            icon: Package
          }));

        setSearchResults([...tutorialResults, ...equipmentResults]);
      } catch (err) {
        console.error('Search failed', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'tutorial') {
      onNavigate(`video-player?id=${result.id}`);
    } else if (result.type === 'equipment') {
      onNavigate('equipment-rental');
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const markNotificationAsRead = (notification: any) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Execute action if available
    if (notification.action && typeof notification.action === 'function') {
      notification.action();
      setShowNotifications(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

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

            <div className="relative flex-1 min-w-0 search-container">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                }`}
              />
              <Input
                placeholder="Search tutorials, equipment, labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className={`pl-10 w-full ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500'
                    : 'bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500'
                }`}
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <Card className={`search-results absolute top-full mt-2 w-full z-50 max-h-96 overflow-auto ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
                }`}>
                  <CardContent className="p-2">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-400">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No results found</div>
                    ) : (
                      <div className="space-y-1">
                        {searchResults.map((result) => {
                          const Icon = result.icon;
                          return (
                            <button
                              key={`${result.type}-${result.id}`}
                              onClick={() => handleSearchResultClick(result)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                                theme === 'light'
                                  ? 'hover:bg-gray-100'
                                  : 'hover:bg-gray-800'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                result.type === 'tutorial' 
                                  ? 'bg-purple-500/20' 
                                  : 'bg-cyan-500/20'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  result.type === 'tutorial'
                                    ? 'text-purple-400'
                                    : 'text-cyan-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  theme === 'light' ? 'text-gray-900' : 'text-white'
                                }`}>
                                  {result.title}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
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
              className={`notification-button relative ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-teal-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <Card className={`notification-dropdown absolute top-16 right-6 w-96 z-50 max-h-[500px] overflow-auto ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'
              }`}>
                <div className={`p-4 border-b flex items-center justify-between ${
                  theme === 'light' ? 'border-gray-200' : 'border-gray-800'
                }`}>
                  <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-teal-400 hover:text-teal-300 h-auto p-0"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <CardContent className="p-0">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification)}
                          className={`w-full p-4 border-b text-left transition-colors ${
                            theme === 'light'
                              ? 'border-gray-200 hover:bg-gray-50'
                              : 'border-gray-800 hover:bg-gray-800/50'
                          } ${!notification.read ? (theme === 'light' ? 'bg-teal-50' : 'bg-teal-500/5') : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${
                              notification.type === 'success' ? 'bg-teal-500/20' :
                              notification.type === 'warning' ? 'bg-yellow-500/20' :
                              notification.type === 'error' ? 'bg-red-500/20' :
                              'bg-blue-500/20'
                            }`}>
                              <Bell className={`h-4 w-4 ${
                                notification.type === 'success' ? 'text-teal-400' :
                                notification.type === 'warning' ? 'text-yellow-400' :
                                notification.type === 'error' ? 'text-red-400' :
                                'text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                theme === 'light' ? 'text-gray-900' : 'text-white'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-teal-500 mt-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
