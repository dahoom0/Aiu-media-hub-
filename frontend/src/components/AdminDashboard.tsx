import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Users,
  Package,
  Calendar,
  Video,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

import adminService from '../services/adminService';
import equipmentAdminService from '../services/equipmentAdmin';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

type StatusString =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'active'
  | 'returned'
  | string;

type LabBooking = {
  id: number;
  lab_room?: string;
  booking_date?: string;
  date?: string;
  time_slot?: string;
  imac_number?: number | string;
  participants?: number;
  purpose?: string;
  status?: StatusString;

  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  student_name?: string;

  created_at?: string;
  updated_at?: string;
};

type EquipmentRental = {
  id: number;
  equipment_name?: string;
  item_name?: string;
  status?: StatusString;

  start_date?: string;
  end_date?: string;
  duration?: string;

  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  student_name?: string;

  created_at?: string;
  updated_at?: string;
};

type CVItem = {
  id: number;
  status?: StatusString;

  title?: string;
  template_name?: string;

  user?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  student_name?: string;

  created_at?: string;
  updated_at?: string;
};

type DashboardStats = {
  totalStudents: number;
  pendingBookings: number;
  activeRentals: number;
  pendingCVs: number;
};

type EquipmentUI = {
  id: string | number;
  name?: string;
  equipmentId?: string;
  category?: string;
  status?: string;
  imageUrl?: string;
  description?: string;
};

function normalizeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function safeStatus(x: any) {
  return String(x || '').toLowerCase();
}

function safeTime(t?: string) {
  if (!t) return '—';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [cvs, setCvs] = useState<CVItem[]>([]);

  const [statsData, setStatsData] = useState<DashboardStats>({
    totalStudents: 0,
    pendingBookings: 0,
    activeRentals: 0,
    pendingCVs: 0,
  });

  // ✅ Equipment stats from backend
  const [equipmentStats, setEquipmentStats] = useState({
    available: 0,
    inUse: 0, // backend "rented"
    maintenance: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<Record<number, 'approve' | 'reject' | null>>({});

  const studentDisplay = (obj: { student_name?: string; user?: any }) => {
    if (obj.student_name) return obj.student_name;
    const first = obj.user?.first_name || '';
    const last = obj.user?.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || obj.user?.username || 'Student';
  };

  const bookingDate = (b: LabBooking) => b.booking_date || b.date || '';

  const bookingItemLabel = (b: LabBooking) => {
    const lab = b.lab_room || 'BMC Lab';
    const imac =
      b.imac_number !== undefined && b.imac_number !== null && String(b.imac_number).trim() !== ''
        ? `iMac ${b.imac_number}`
        : '';
    return imac ? `${lab} • ${imac}` : lab;
  };

  const rentalItemLabel = (r: EquipmentRental) => {
    return r.equipment_name || r.item_name || 'Equipment';
  };

  const rentalDurationLabel = (r: EquipmentRental) => {
    if (r.duration) return r.duration;
    if (r.start_date && r.end_date) return `${r.start_date} → ${r.end_date}`;
    if (r.start_date) return `From ${r.start_date}`;
    return '—';
  };

  const cvItemLabel = (c: CVItem) => {
    return c.title || c.template_name || 'CV Submission';
  };

  const fetchEquipmentStats = async () => {
    try {
      const list = await equipmentAdminService.list();
      const items = normalizeList(list) as EquipmentUI[];

      const available = items.filter((e) => safeStatus(e.status) === 'available').length;
      const inUse = items.filter((e) => safeStatus(e.status) === 'rented').length;
      const maintenance = items.filter((e) => safeStatus(e.status) === 'maintenance').length;

      setEquipmentStats({
        available,
        inUse,
        maintenance,
        total: items.length,
      });
    } catch (e) {
      // don't break dashboard UI if equipment fails
      console.error('Failed to fetch equipment stats', e);
      setEquipmentStats({
        available: 0,
        inUse: 0,
        maintenance: 0,
        total: 0,
      });
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookingsRes, rentalsRes, cvsRes, dashboardStats] = await Promise.all([
        adminService.getAllBookings(),
        adminService.getAllRentals(),
        adminService.getAllCVs(),
        adminService.getDashboardStats(),
      ]);

      setBookings(normalizeList(bookingsRes) as LabBooking[]);
      setRentals(normalizeList(rentalsRes) as EquipmentRental[]);
      setCvs(normalizeList(cvsRes) as CVItem[]);
      setStatsData(dashboardStats);

      // ✅ also fetch equipment counts
      await fetchEquipmentStats();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load admin dashboard data.');
      setBookings([]);
      setRentals([]);
      setCvs([]);
      setStatsData({
        totalStudents: 0,
        pendingBookings: 0,
        activeRentals: 0,
        pendingCVs: 0,
      });

      // still try equipment (optional)
      await fetchEquipmentStats();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingApprovals = useMemo(() => {
    const pendingBookings = bookings
      .filter((b) => safeStatus(b.status) === 'pending')
      .map((b) => ({
        id: b.id,
        type: 'booking',
        student: studentDisplay(b),
        item: bookingItemLabel(b),
        date: bookingDate(b),
        time: b.time_slot || '',
        requestedAt: safeTime(b.created_at),
      }));

    const pendingRentals = rentals
      .filter((r) => safeStatus(r.status) === 'pending')
      .map((r) => ({
        id: r.id,
        type: 'rental',
        student: studentDisplay(r),
        item: rentalItemLabel(r),
        duration: rentalDurationLabel(r),
        requestedAt: safeTime(r.created_at),
      }));

    const pendingCVs = cvs
      .filter((c) => safeStatus(c.status) === 'pending')
      .map((c) => ({
        id: c.id,
        type: 'cv',
        student: studentDisplay(c),
        item: cvItemLabel(c),
        duration: 'CV review',
        requestedAt: safeTime(c.created_at),
      }));

    return [...pendingBookings, ...pendingRentals, ...pendingCVs].slice(0, 6);
  }, [bookings, rentals, cvs]);

  const recentActivity = useMemo(() => {
    const rows: Array<{
      id: number;
      kind: 'booking' | 'rental' | 'cv';
      student: string;
      item: string;
      status: string;
      created_at?: string;
      updated_at?: string;
    }> = [];

    bookings.forEach((b) =>
      rows.push({
        id: b.id,
        kind: 'booking',
        student: studentDisplay(b),
        item: bookingItemLabel(b),
        status: safeStatus(b.status),
        created_at: b.created_at,
        updated_at: b.updated_at,
      })
    );

    rentals.forEach((r) =>
      rows.push({
        id: r.id,
        kind: 'rental',
        student: studentDisplay(r),
        item: rentalItemLabel(r),
        status: safeStatus(r.status),
        created_at: r.created_at,
        updated_at: r.updated_at,
      })
    );

    cvs.forEach((c) =>
      rows.push({
        id: c.id,
        kind: 'cv',
        student: studentDisplay(c),
        item: cvItemLabel(c),
        status: safeStatus(c.status),
        created_at: c.created_at,
        updated_at: c.updated_at,
      })
    );

    const sorted = rows.sort((a, b) => {
      const aT = new Date(a.updated_at || a.created_at || 0).getTime();
      const bT = new Date(b.updated_at || b.created_at || 0).getTime();
      return bT - aT;
    });

    return sorted.slice(0, 3).map((x) => {
      const s = x.status;
      let action = 'Updated';
      if (x.kind === 'booking') {
        action =
          s === 'approved'
            ? 'Booking approved'
            : s === 'rejected'
            ? 'Booking rejected'
            : s === 'pending'
            ? 'Booking requested'
            : s === 'completed'
            ? 'Booking completed'
            : 'Booking updated';
      } else if (x.kind === 'rental') {
        action =
          s === 'active'
            ? 'Rental active'
            : s === 'returned'
            ? 'Equipment returned'
            : s === 'pending'
            ? 'Rental requested'
            : s === 'approved'
            ? 'Rental approved'
            : 'Rental updated';
      } else {
        action =
          s === 'approved'
            ? 'CV approved'
            : s === 'pending'
            ? 'CV submitted'
            : s === 'rejected'
            ? 'CV rejected'
            : 'CV updated';
      }

      return {
        id: x.id,
        action,
        student: x.student,
        item: x.item,
        time: safeTime(x.updated_at || x.created_at),
        status: s === 'approved' ? 'approved' : 'completed',
      };
    });
  }, [bookings, rentals, cvs]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Active Students',
        value: String(statsData.totalStudents),
        change: '',
        trend: 'up',
        icon: Users,
        color: 'teal',
      },
      {
        // ✅ now from equipment list
        label: 'Equipment in Use',
        value: String(equipmentStats.inUse),
        change: '',
        trend: 'down',
        icon: Package,
        color: 'cyan',
      },
      {
        label: 'Active Bookings',
        value: String(statsData.pendingBookings),
        change: '',
        trend: 'up',
        icon: Calendar,
        color: 'purple',
      },
      {
        label: 'Tutorial Views',
        value: String(statsData.pendingCVs),
        change: '',
        trend: 'up',
        icon: Video,
        color: 'orange',
      },
    ];
  }, [statsData, equipmentStats]);

  const getTypeIcon = (type: string) => {
    return type === 'booking' ? Calendar : Package;
  };

  const getTypeColor = (type: string) => {
    return type === 'booking'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-teal-400';
      case 'approved':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    setError(null);
    try {
      await adminService.approveBooking(id);
      await loadDashboard();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to approve booking.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    setError(null);
    try {
      await adminService.rejectBooking(id);
      await loadDashboard();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to reject booking.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Manage bookings, equipment, and content
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Clock className="h-4 w-4" />
            Loading dashboard...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            teal: 'from-teal-500/20 to-teal-500/10',
            cyan: 'from-cyan-500/20 to-cyan-500/10',
            purple: 'from-purple-500/20 to-purple-500/10',
            orange: 'from-orange-500/20 to-orange-500/10',
          };
          const iconColorMap: Record<string, string> = {
            teal: 'text-teal-400',
            cyan: 'text-cyan-400',
            purple: 'text-purple-400',
            orange: 'text-orange-400',
          };
          return (
            <Card key={index} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[stat.color]}`}>
                    <Icon className={`h-6 w-6 ${iconColorMap[stat.color]}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-teal-400' : 'text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl text-white mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Pending Approvals</CardTitle>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                {pendingApprovals.length} Pending
              </Badge>
            </div>
            <CardDescription className="text-gray-400">
              Requests awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((approval: any) => {
              const TypeIcon = getTypeIcon(approval.type);
              const rowLoading =
                actionLoading[approval.id] !== null && actionLoading[approval.id] !== undefined;

              return (
                <div
                  key={approval.id}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${approval.type === 'booking' ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                        <TypeIcon className={`h-5 w-5 ${approval.type === 'booking' ? 'text-purple-400' : 'text-cyan-400'}`} />
                      </div>
                      <div>
                        <p className="text-white">{approval.student}</p>
                        <p className="text-sm text-gray-400">{approval.item}</p>
                        {approval.type === 'booking' ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {approval.date} • {approval.time}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Duration: {approval.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getTypeColor(approval.type)}>
                      {approval.type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500">{approval.requestedAt}</p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        disabled={loading || rowLoading || approval.type !== 'booking'}
                        onClick={() => handleReject(approval.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        disabled={loading || rowLoading || approval.type !== 'booking'}
                        onClick={() => handleApprove(approval.id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                  <CheckCircle2 className={`h-4 w-4 ${getStatusColor(activity.status)}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-sm text-gray-400">{activity.student} • {activity.item}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Equipment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Available</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                {equipmentStats.available} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">In Use</span>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                {equipmentStats.inUse} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Maintenance</span>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                {equipmentStats.maintenance} items
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lab Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Studio A</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Studio B</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                72%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Editing Rooms</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                68%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Database</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-sm text-teal-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Server</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-sm text-teal-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Storage</span>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                78% Used
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white mb-2">Content Management</h3>
                <p className="text-gray-400">
                  Upload new tutorials and manage existing content
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={() => onNavigate('admin-tutorials')}
              >
                <Video className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white mb-2">User Management</h3>
                <p className="text-gray-400">
                  Manage student accounts and permissions
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => onNavigate('admin-profiles')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
