import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- REAL DATA STATE ---
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [activeRentals, setActiveRentals] = useState<any[]>([]);
  const [recentTutorials, setRecentTutorials] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    bookingsCount: 0,
    rentalsCount: 0,
    tutorialsWatched: 0, 
    projectsCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = authService.getUser() || await authService.getProfile();
        setUser(currentUser);

        // Initialize variables
        let bookingsData: any = [];
        let rentalsData: any = [];
        let cvData: any = {};
        let tutorialsData: any = [];
        let progressData: any = [];

        // 1. Fetch Services
        try { 
            const res = await labBookingService.getMyBookings(); 
            bookingsData = res.results || res;
        } catch(e) { console.warn("Bookings fetch failed", e); }

        try { 
            const res = await equipmentService.getMyActiveRentals(); 
            rentalsData = res.results || res;
        } catch(e) { console.warn("Rentals fetch failed", e); }

        try { 
            cvData = await cvService.getMyCV(); 
        } catch(e) { console.warn("CV fetch failed", e); }
        
        try {
            const [tData, pData] = await Promise.all([
                tutorialService.getAll(),
                tutorialService.getProgress()
            ]);
            const tRaw = tData.results || tData;
            const pRaw = pData.results || pData;
            tutorialsData = Array.isArray(tRaw) ? tRaw : [];
            progressData = Array.isArray(pRaw) ? pRaw : [];
        } catch (e) { console.warn("Tutorials fetch failed", e); }

        // --- PROCESS DATA ---

        // A. Bookings
        const bList = Array.isArray(bookingsData) ? bookingsData : [];
        const myBookings = bList
          .filter((b: any) => b.status === 'pending' || b.status === 'approved')
          .map((b: any) => ({
            id: b.id,
            lab: b.lab_name || b.lab_room || `Lab #${b.lab}`,
            date: b.booking_date,
            time: b.start_time ? `${b.start_time.toString().slice(0,5)}` : b.time_slot,
            status: b.status === 'approved' ? 'confirmed' : 'pending' 
          }));
        setUpcomingBookings(myBookings);

        // B. Rentals
        const rList = Array.isArray(rentalsData) ? rentalsData : [];
        const myRentals = rList
          .filter((r: any) => r.status === 'active')
          .map((r: any) => ({
            id: r.id,
            equipment: r.equipment_name || r.equipment_details?.name || "Equipment",
            dueDate: r.expected_return_date ? new Date(r.expected_return_date).toLocaleDateString() : 'N/A',
            status: 'active'
          }));
        setActiveRentals(myRentals);

        // C. TUTORIALS LOGIC (Fixed to read progress correctly)
        const completedCount = Array.isArray(progressData) 
            ? progressData.filter((p: any) => p.completed || p.progress_percentage === 100).length 
            : 0;

        const inProgressList = Array.isArray(progressData) 
            ? progressData
                // Filter items that are actually in progress (not 0 and not 100)
                .filter((p: any) => {
                    const percent = p.progress_percentage;
                    return typeof percent === 'number' && percent > 0 && percent < 100;
                })
                .map((p: any) => {
                    // SAFE ID EXTRACTION: Handle if 'tutorial' is an ID or an Object
                    const tutorialId = (typeof p.tutorial === 'object' && p.tutorial !== null) 
                        ? p.tutorial.id 
                        : p.tutorial;

                    // Find matching tutorial details
                    const videoInfo = Array.isArray(tutorialsData) 
                        ? tutorialsData.find((t: any) => t.id === tutorialId) 
                        : null;
                    
                    if (!videoInfo) return null; // Skip if we have progress but no tutorial info

                    return {
                        id: tutorialId,
                        title: videoInfo.title || "Untitled Tutorial",
                        category: videoInfo.category_name || "General",
                        duration: videoInfo.duration ? `${videoInfo.duration} min` : "10:00",
                        progress: p.progress_percentage,
                        videoUrl: videoInfo.video_url
                    };
                })
                .filter(Boolean) // Remove nulls from missing videos
                .sort((a: any, b: any) => b.progress - a.progress) // Sort by highest progress
                .slice(0, 2)
            : [];

        // Fallback: If no progress found, show generic suggestions
        if (inProgressList.length === 0 && Array.isArray(tutorialsData) && tutorialsData.length > 0) {
            const newTuts = tutorialsData.slice(0, 2).map((t: any) => ({
                id: t.id,
                title: t.title,
                category: t.category_name || "General",
                duration: t.duration ? `${t.duration} min` : "15:00",
                progress: 0, 
                videoUrl: t.video_url
            }));
            setRecentTutorials(newTuts);
        } else {
            setRecentTutorials(inProgressList);
        }

        // D. Update Stats
        const projectsCount = cvData?.projects?.length || 0;
        setStats({
          bookingsCount: myBookings.length,
          rentalsCount: myRentals.length,
          tutorialsWatched: completedCount,
          projectsCount: projectsCount
        });

      } catch (error) {
        console.error("Dashboard load error", error);
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
        <h1 className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-2 text-2xl font-bold`}>
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
                {upcomingBookings.filter(b => b.status === 'pending').length} pending approval
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
              <p className="text-gray-500 text-sm text-center py-4">
                No upcoming bookings.
              </p>
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
              <p className="text-gray-500 text-sm text-center py-4">
                No active rentals.
              </p>
            ) : (
              activeRentals.slice(0, 3).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="space-y-1">
                    <p className="text-white">{rental.equipment}</p>
                    <p className="text-sm text-gray-400">
                      Due: {rental.dueDate}
                    </p>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                    Active
                  </Badge>
                </div>
              ))
            )}
            {activeRentals.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400">Return Reminder</p>
                  <p className="text-xs text-gray-400">
                    Return by due date to avoid penalties
                  </p>
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
      <div className={`rounded-xl border p-6 ${
        theme === 'light' 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-900/50 border-gray-800'
      }`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Continue Learning
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-600 hover:text-teal-700 font-medium"
              onClick={() => onNavigate('tutorials')}
            >
              All Tutorials
            </Button>
          </div>
          <p className="text-gray-500 mb-6">
            Pick up where you left off
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {recentTutorials.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-4 text-sm">
                No tutorials started. Go watch one!
              </p>
            ) : (
              recentTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  // When clicking, we navigate to the player directly with the ID
                  onClick={() => onNavigate(`video-player?id=${tutorial.id}`)}
                  className={`relative p-5 rounded-lg border flex flex-col justify-between h-[140px] transition-all cursor-pointer ${
                    theme === 'light' 
                      ? 'bg-gray-50/80 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                      : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {/* Top Row: Title and Video Icon */}
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium text-base line-clamp-1 pr-8 ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                        {tutorial.title}
                    </h3>
                    <Video className={`h-5 w-5 ${theme === 'light' ? 'text-teal-600' : 'text-teal-400'}`} />
                  </div>

                  {/* Middle Row: Badge and Duration */}
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                         theme === 'light' 
                            ? 'bg-gray-200 text-gray-700' 
                            : 'bg-gray-700 text-gray-300'
                     }`}>
                        {tutorial.category}
                     </span>
                     <span className="text-gray-400 text-sm flex items-center gap-1">
                        • {tutorial.duration}
                     </span>
                  </div>

                  {/* Bottom Row: Progress Labels and Bar */}
                  <div className="mt-auto pt-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-500 font-medium">Progress</span>
                      <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {tutorial.progress}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div 
                            className={`h-full rounded-full ${
                                theme === 'light' ? 'bg-slate-900' : 'bg-teal-500' 
                            }`} 
                            style={{ width: `${tutorial.progress}%` }} 
                        />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

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