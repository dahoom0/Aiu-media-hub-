import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Calendar,
  Package,
  Video,
  FolderOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertCircle,
  Play,
  MessageSquare,
  Flag,
  AlertTriangle,
  CheckCircle,
  Bell,
  X
} from 'lucide-react';
import authService from '../services/authService';
import labBookingService from '../services/labBookingService';
import equipmentService from '../services/equipmentService';
import cvService from '../services/cvService';
import tutorialService from '../services/tutorialService';
import notificationService from '../services/notificationService';
import { useTheme } from './ThemeProvider';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

const normalizeList = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const norm = (v: any) => String(v ?? '').trim().toLowerCase();

/**
 * ✅ What "Active Bookings" should mean (your request):
 * - ONLY "approved" bookings (accepted by admin)
 * - (NOT pending / rejected / completed / cancelled)
 *
 * UI still shows "pending approval" count separately.
 */
export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { theme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- REAL DATA STATE ---
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [activeRentals, setActiveRentals] = useState<any[]>([]);
  const [recentTutorials, setRecentTutorials] = useState<any[]>([]);
  const [cvFeedback, setCvFeedback] = useState<any>(null);

  const [stats, setStats] = useState({
    bookingsCount: 0, // ✅ accepted/approved only
    rentalsCount: 0,
    tutorialsWatched: 0,
    projectsCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // ✅ Always try profile because it contains merged student_profile stats
        let currentUser: any = authService.getUser();
        try {
          if (!currentUser) currentUser = await authService.getProfile();
        } catch (e) {
          // keep going with local user if profile fails
        }
        setUser(currentUser);

        // Initialize variables
        let bookingsData: any = [];
        let rentalsData: any = [];
        let cvData: any = {};
        let tutorialsData: any = [];
        let progressData: any = [];
        let notificationsData: any = [];
        let unreadCountData: any = 0;

        // 1) Fetch bookings
        try {
          const res = await labBookingService.getMyBookings();
          bookingsData = normalizeList(res);
        } catch (e) {
          console.warn('Bookings fetch failed', e);
          bookingsData = [];
        }

        // 2) Fetch rentals (student scope) - only active rentals that need to be returned
        try {
          const res = await equipmentService.getMyActiveRentals();
          rentalsData = Array.isArray(res) ? res : normalizeList(res);
          console.log('Fetched active rentals:', rentalsData);
        } catch (e) {
          console.warn('Rentals fetch failed', e);
          rentalsData = [];
        }

        // 3) Fetch CV (for projects count AND feedback)
        try {
          cvData = await cvService.getMyCV();
          
          // Check if there's admin feedback
          if (cvData && (cvData.status === 'approved' || cvData.status === 'flagged' || cvData.status === 'needs-changes')) {
            if (cvData.admin_comment || cvData.status === 'approved') {
              setCvFeedback({
                status: cvData.status,
                comment: cvData.admin_comment || 'Your CV has been approved!',
                reviewedBy: cvData.reviewed_by_name || 'Admin',
                reviewedAt: cvData.reviewed_at ? new Date(cvData.reviewed_at).toLocaleDateString() : 'Recently'
              });
            }
          }
        } catch (e) {
          console.warn('CV fetch failed', e);
          cvData = {};
        }

        // 4) Tutorials + progress
        try {
          const [tData, pData] = await Promise.all([
            tutorialService.getAll(),
            tutorialService.getProgress()
          ]);

          tutorialsData = normalizeList(tData);
          progressData = normalizeList(pData);
        } catch (e) {
          console.warn('Tutorials fetch failed', e);
          tutorialsData = [];
          progressData = [];
        }

        // 5) Fetch notifications
        try {
          const [nData, countData] = await Promise.all([
            notificationService.getNotifications(),
            notificationService.getUnreadCount()
          ]);
          notificationsData = normalizeList(nData);
          unreadCountData = countData?.count || 0;
          setNotifications(notificationsData);
          setUnreadCount(unreadCountData);
        } catch (e) {
          console.warn('Notifications fetch failed', e);
          setNotifications([]);
          setUnreadCount(0);
        }

        // --- PROCESS DATA ---

        // A) Bookings list for "Upcoming Bookings" card
        // ✅ Keep pending + approved in the list (your UI needs it)
        const bList = Array.isArray(bookingsData) ? bookingsData : [];

        const myBookings = bList
          .filter((b: any) => {
            const s = norm(b?.status);
            return s === 'pending' || s === 'approved';
          })
          .map((b: any) => {
            const labName =
              b.lab_name || b.lab_room || (b.lab ? `Lab #${b.lab}` : 'Lab');

            const date = b.booking_date || b.date || '';

            const time =
              b.start_time
                ? `${String(b.start_time).slice(0, 5)}`
                : (b.time_slot ? String(b.time_slot) : '');

            const statusLower = norm(b?.status);

            return {
              id: b.id,
              lab: labName,
              date,
              time,
              status: statusLower === 'approved' ? 'confirmed' : 'pending'
            };
          });

        setUpcomingBookings(myBookings);

        // ✅ Active Bookings COUNT (your request):
        // ONLY accepted/approved bookings
        const approvedBookingsCount = bList.filter((b: any) => norm(b?.status) === 'approved').length;

        // B) Rentals (active-like)
        const rList = Array.isArray(rentalsData) ? rentalsData : [];
        console.log('All rentals data:', rList);
        const activeLikeStatuses = new Set(['approved', 'active', 'overdue', 'damaged']);

        const myRentals = rList
          .filter((r: any) => {
            const status = norm(r?.status);
            const isActive = activeLikeStatuses.has(status);
            console.log('Rental:', r.id, 'Status:', status, 'IsActive:', isActive);
            return isActive;
          })
          .map((r: any) => {
            const eq =
              r.equipment_name ||
              r.equipment_details?.name ||
              r.equipment?.name ||
              (r.equipment ? `Equipment #${r.equipment}` : 'Equipment');

            const rental = {
              id: r.id,
              equipment: eq,
              dueDate: r.expected_return_date
                ? new Date(r.expected_return_date).toLocaleDateString()
                : 'N/A',
              status: norm(r?.status) || 'active'
            };
            console.log('Mapped rental:', rental);
            return rental;
          });

        console.log('Active rentals to display:', myRentals);
        setActiveRentals(myRentals);

        // C) Tutorials
        const toNumberPercent = (val: any) => {
          const n = Number(val);
          if (Number.isNaN(n)) return 0;
          return Math.max(0, Math.min(100, Math.round(n)));
        };

        const getTutorialId = (t: any) => {
          if (typeof t === 'object' && t !== null) return t.id;
          return t;
        };

        const completedCount = Array.isArray(progressData)
          ? progressData.filter((p: any) => {
              const percent = toNumberPercent(p.progress_percentage);
              return p.completed === true || percent === 100;
            }).length
          : 0;

        const progressBasedList = Array.isArray(progressData)
          ? progressData
              .map((p: any) => {
                const percent = toNumberPercent(p.progress_percentage);
                if (percent <= 0) return null;

                const tutorialId = getTutorialId(p.tutorial);
                const videoInfo = Array.isArray(tutorialsData)
                  ? tutorialsData.find((t: any) => t.id === tutorialId)
                  : null;

                if (!videoInfo) return null;

                return {
                  id: tutorialId,
                  title: videoInfo.title || 'Untitled Tutorial',
                  category: videoInfo.category_name || 'General',
                  duration: videoInfo.duration ? `${videoInfo.duration} min` : '10 min',
                  progress: percent,
                  videoUrl: videoInfo.video_url,
                  lastWatched: p.last_watched_at ? new Date(p.last_watched_at).getTime() : 0
                };
              })
              .filter(Boolean)
              .sort((a: any, b: any) => b.lastWatched - a.lastWatched)
              .slice(0, 2)
          : [];

        if (progressBasedList.length === 0 && Array.isArray(tutorialsData) && tutorialsData.length > 0) {
          const newTuts = tutorialsData.slice(0, 2).map((t: any) => ({
            id: t.id,
            title: t.title,
            category: t.category_name || 'General',
            duration: t.duration ? `${t.duration} min` : '10 min',
            progress: 0,
            videoUrl: t.video_url
          }));
          setRecentTutorials(newTuts);
        } else {
          setRecentTutorials(progressBasedList);
        }

        // D) Stats
        const projectsCount = Array.isArray(cvData?.projects) ? cvData.projects.length : 0;

        // Prefer merged backend stats if available (but bookings must be approved-only)
        const profileRentals = Number(currentUser?.active_rentals ?? NaN);
        const profileTutorials = Number(currentUser?.tutorials_watched ?? NaN);

        setStats({
          // ✅ HERE is the fix you asked for:
          bookingsCount: approvedBookingsCount,
          rentalsCount: Number.isFinite(profileRentals) ? profileRentals : myRentals.length,
          tutorialsWatched: Number.isFinite(profileTutorials) ? profileTutorials : completedCount,
          projectsCount
        });
      } catch (error) {
        console.error('Dashboard load error', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome with Notification Bell */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-2 text-2xl font-bold">
            Welcome back, {user?.first_name || 'Student'}!
          </h1>
          <p className="text-gray-400">Here's what's happening with your media projects today.</p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-white"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white font-medium">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="divide-y divide-gray-800">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-800/50 cursor-pointer ${!notif.is_read ? 'bg-teal-500/5' : ''}`}
                      onClick={async () => {
                        if (!notif.is_read) {
                          try {
                            await notificationService.markAsRead(notif.id);
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                          } catch (e) {
                            console.error('Failed to mark as read', e);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${
                          notif.notification_type === 'return_approved' ? 'text-teal-400' :
                          notif.notification_type === 'return_rejected' ? 'text-red-400' :
                          notif.notification_type === 'rental_approved' ? 'text-teal-400' :
                          notif.notification_type === 'rental_rejected' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {notif.notification_type === 'return_approved' || notif.notification_type === 'rental_approved' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : notif.notification_type === 'return_rejected' || notif.notification_type === 'rental_rejected' ? (
                            <AlertCircle className="h-5 w-5" />
                          ) : (
                            <Bell className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-white text-sm font-medium">{notif.title}</p>
                            {!notif.is_read && (
                              <div className="h-2 w-2 bg-teal-500 rounded-full mt-1"></div>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-1">{notif.message}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && unreadCount > 0 && (
                <div className="p-3 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-teal-400 hover:text-teal-300"
                    onClick={async () => {
                      try {
                        await notificationService.markAllAsRead();
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        setUnreadCount(0);
                      } catch (e) {
                        console.error('Failed to mark all as read', e);
                      }
                    }}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Bookings */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Bookings</p>
                <p className="text-2xl text-white mt-1">{stats.bookingsCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/20">
                <Calendar className="h-6 w-6 text-teal-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-400" />
              <span className="text-xs text-gray-400">
                {upcomingBookings.filter((b) => b.status === 'pending').length} pending approval
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rentals */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Equipment Rented</p>
                <p className="text-2xl text-white mt-1">{stats.rentalsCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                <Package className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Check due dates</span>
            </div>
          </CardContent>
        </Card>

        {/* Tutorials */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tutorials Watched</p>
                <p className="text-2xl text-white mt-1">{stats.tutorialsWatched}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                <Video className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-gray-400">Total completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Portfolio Projects</p>
                <p className="text-2xl text-white mt-1">{stats.projectsCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
                <FolderOpen className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-gray-400">On your CV</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CV Feedback Card - Show if there's feedback */}
        {cvFeedback && (
          <Card className={`border-2 ${
            cvFeedback.status === 'approved' 
              ? 'bg-teal-500/10 border-teal-500/50' 
              : cvFeedback.status === 'flagged'
              ? 'bg-red-500/10 border-red-500/50'
              : 'bg-yellow-500/10 border-yellow-500/50'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  {cvFeedback.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-teal-400" />
                  ) : cvFeedback.status === 'flagged' ? (
                    <Flag className="h-5 w-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  )}
                  CV {cvFeedback.status === 'approved' ? 'Approved' : cvFeedback.status === 'flagged' ? 'Flagged' : 'Feedback'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-teal-400 hover:text-teal-300"
                  onClick={() => onNavigate('student-cv-view')}
                >
                  View Details
                </Button>
              </div>
              <CardDescription className="text-gray-400">
                Reviewed by {cvFeedback.reviewedBy} • {cvFeedback.reviewedAt}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border-l-4 ${
                cvFeedback.status === 'approved'
                  ? 'bg-teal-500/20 border-teal-500'
                  : cvFeedback.status === 'flagged'
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-yellow-500/20 border-yellow-500'
              }`}>
                <div className="flex items-start gap-3">
                  <MessageSquare className={`h-5 w-5 mt-0.5 ${
                    cvFeedback.status === 'approved' ? 'text-teal-400' :
                    cvFeedback.status === 'flagged' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium mb-1">Admin Comment:</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {cvFeedback.comment}
                    </p>
                  </div>
                </div>
              </div>
              {cvFeedback.status !== 'approved' && (
                <Button
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  onClick={() => onNavigate('cv-generator')}
                >
                  Update Your CV
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bookings */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Upcoming Bookings</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-400 hover:text-teal-300"
                onClick={() => onNavigate('lab-booking')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No upcoming bookings.</p>
            ) : (
              upcomingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="space-y-1">
                    <p className="text-white">{booking.lab}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{booking.date}</span>
                      <span>•</span>
                      <span>{booking.time}</span>
                    </div>
                  </div>
                  <Badge
                    className={
                      booking.status === 'confirmed'
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))
            )}
            <Button
              className="w-full bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
              onClick={() => onNavigate('lab-booking')}
            >
              <Calendar className="h-4 w-4 mr-2" /> Book New Session
            </Button>
          </CardContent>
        </Card>

        {/* Active Rentals */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Equipment to Return</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-400"
                onClick={() => onNavigate('equipment-rental')}
              >
                View All
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              Return your rented equipment before the due date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRentals.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No equipment to return.</p>
            ) : (
              activeRentals.map((rental) => {
                const isOverdue = rental.status === 'overdue';
                const dueDate = rental.dueDate !== 'N/A' ? new Date(rental.dueDate) : null;
                const today = new Date();
                const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 2;

                return (
                  <div
                    key={rental.id}
                    className={`p-4 rounded-lg border ${
                      isOverdue 
                        ? 'bg-red-500/10 border-red-500/50' 
                        : isDueSoon
                        ? 'bg-yellow-500/10 border-yellow-500/50'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <p className="text-white font-medium">{rental.equipment}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-gray-400'}`}>
                            Due: {rental.dueDate}
                          </p>
                          {isOverdue && (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">
                              OVERDUE
                            </Badge>
                          )}
                          {isDueSoon && !isOverdue && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                              DUE SOON
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`${
                          isOverdue 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
                        } text-white`}
                        onClick={async () => {
                          try {
                            await equipmentService.returnItem(rental.id);
                            // Refresh the page to show updated status
                            window.location.reload();
                          } catch (error: any) {
                            console.error('Return failed:', error);
                            alert(error?.response?.data?.detail || 'Failed to return equipment');
                          }
                        }}
                      >
                        Return Now
                      </Button>
                    </div>
                  </div>
                );
              })
            )}

            {activeRentals.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400">Return Reminder</p>
                  <p className="text-xs text-gray-400">Return by due date to avoid penalties</p>
                </div>
              </div>
            )}
            <Button
              className="w-full bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
              onClick={() => onNavigate('equipment-rental')}
            >
              <Package className="h-4 w-4 mr-2" /> Browse Equipment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
              Continue Learning
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-400 hover:text-teal-300"
              onClick={() => onNavigate('tutorials')}
            >
              All Tutorials
            </Button>
          </div>
          <CardDescription className="text-gray-400">Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {recentTutorials.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-4 text-sm">
                No tutorials started. Go watch one!
              </p>
            ) : (
              recentTutorials.map((tutorial) => (
                <button
                  key={tutorial.id}
                  onClick={() => onNavigate('tutorials', { videoId: tutorial.id })}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3 hover:bg-gray-800 hover:border-teal-500/50 transition-all cursor-pointer text-left w-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p
                        className={
                          theme === 'light'
                            ? 'text-slate-900 hover:text-teal-600 transition-colors line-clamp-1'
                            : 'text-white hover:text-teal-400 transition-colors line-clamp-1'
                        }
                      >
                        {tutorial.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Badge className="bg-gray-700 text-gray-300 text-xs">{tutorial.category}</Badge>
                        <span>•</span>
                        <span>{tutorial.duration}</span>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <Play className="h-4 w-4 text-teal-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
                        {tutorial.progress}%
                      </span>
                    </div>
                    <Progress value={tutorial.progress} className="h-2 bg-gray-700" />
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/20">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <h3 className="text-white mb-1">Build Your CV</h3>
            <p className="text-gray-400 text-sm">Create professional CVs</p>
          </div>
          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            onClick={() => onNavigate('cv-generator')}
          >
            <FolderOpen className="h-4 w-4 mr-2" /> Create CV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
