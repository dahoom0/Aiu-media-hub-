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
  Play
} from 'lucide-react';
import authService from '../services/authService';
import labBookingService from '../services/labBookingService';
import equipmentService from '../services/equipmentService';
import cvService from '../services/cvService';
import tutorialService from '../services/tutorialService';
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

  // --- REAL DATA STATE ---
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [activeRentals, setActiveRentals] = useState<any[]>([]);
  const [recentTutorials, setRecentTutorials] = useState<any[]>([]);

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

        // 1) Fetch bookings
        try {
          const res = await labBookingService.getMyBookings();
          bookingsData = normalizeList(res);
        } catch (e) {
          console.warn('Bookings fetch failed', e);
          bookingsData = [];
        }

        // 2) Fetch rentals (student scope)
        try {
          const res = await equipmentService.getMyActiveRentals();
          rentalsData = normalizeList(res);
        } catch (e) {
          console.warn('Rentals fetch failed', e);
          rentalsData = [];
        }

        // 3) Fetch CV (for projects count)
        try {
          cvData = await cvService.getMyCV();
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
        const activeLikeStatuses = new Set(['approved', 'active', 'overdue', 'damaged']);

        const myRentals = rList
          .filter((r: any) => activeLikeStatuses.has(norm(r?.status)))
          .map((r: any) => {
            const eq =
              r.equipment_name ||
              r.equipment_details?.name ||
              r.equipment?.name ||
              (r.equipment ? `Equipment #${r.equipment}` : 'Equipment');

            return {
              id: r.id,
              equipment: eq,
              dueDate: r.expected_return_date
                ? new Date(r.expected_return_date).toLocaleDateString()
                : 'N/A',
              status: norm(r?.status) || 'active'
            };
          });

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
      {/* Welcome */}
      <div>
        <h1 className="text-white mb-2 text-2xl font-bold">
          Welcome back, {user?.first_name || 'Student'}!
        </h1>
        <p className="text-gray-400">Here's what's happening with your media projects today.</p>
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
              <CardTitle className="text-white">Active Rentals</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-400"
                onClick={() => onNavigate('equipment-rental')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRentals.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No active rentals.</p>
            ) : (
              activeRentals.slice(0, 3).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="space-y-1">
                    <p className="text-white">{rental.equipment}</p>
                    <p className="text-sm text-gray-400">Due: {rental.dueDate}</p>
                  </div>

                  <Badge
                    className={
                      rental.status === 'overdue'
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                    }
                  >
                    {rental.status === 'overdue' ? 'Overdue' : 'Active'}
                  </Badge>
                </div>
              ))
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
                  onClick={() => onNavigate(`video-player?id=${tutorial.id}`)}
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
