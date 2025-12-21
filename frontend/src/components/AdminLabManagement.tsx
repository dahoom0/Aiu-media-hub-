import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTheme } from './ThemeProvider';
import {
  Plus,
  Edit,
  Trash2,
  Monitor,
  Clock,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import labAdminService from '../services/labAdminService';

// --- Interfaces ---
interface Lab {
  id: string;
  name: string;
  capacity: number;
  pcCount: number;
  status: 'available' | 'occupied' | 'maintenance' | string;
}

interface PC {
  id: string;
  labId: string;
  pcNumber: string;
  status: 'available' | 'occupied' | 'maintenance' | string;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface BookingRequest {
  id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentProfileId?: string | number;
  userId?: string | number;
  lab: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  requestedAt: string;
}

// --- Helper Functions ---
const normalizeList = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const safeDate = (v: any) => {
  if (!v) return '';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v);
  }
};

const relativeTime = (iso: any) => {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return String(iso);
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export function AdminLabManagement() {
  const { theme } = useTheme();
  
  // Dialog States
  const [isAddLabDialogOpen, setIsAddLabDialogOpen] = useState(false);
  const [isAddPCDialogOpen, setIsAddPCDialogOpen] = useState(false);
  const [isAddTimeSlotDialogOpen, setIsAddTimeSlotDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  // Selection States
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States
  const [newLabName, setNewLabName] = useState('');
  const [newLabCapacity, setNewLabCapacity] = useState('');
  const [newPCNumber, setNewPCNumber] = useState('');
  const [selectedLabForPC, setSelectedLabForPC] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  // Data States
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<PC[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', time: '08:00 - 10:00', available: true },
    { id: '2', time: '10:00 - 12:00', available: true },
    { id: '3', time: '14:00 - 16:00', available: true },
    { id: '4', time: '16:00 - 18:00', available: true }
  ]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);

  // --- Data Loading ---
  const loadAll = async () => {
    setLoading(true);
    try {
      const [labsRaw, bookingsRaw] = await Promise.all([
        labAdminService.getLabs(),
        labAdminService.getLabBookings(),
      ]);

      const mappedLabs: Lab[] = normalizeList(labsRaw).map((l: any) => ({
        id: String(l.id),
        name: l.name || l.lab_name || 'Lab',
        capacity: Number(l.capacity) || 0,
        pcCount: Number(l.pc_count ?? l.pcCount ?? l.pc_total ?? 0),
        status: l.status || 'available',
      }));
      setLabs(mappedLabs);

      const mappedBookings: BookingRequest[] = normalizeList(bookingsRaw).map((b: any) => {
        const user = b.user || {};
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return {
          id: String(b.id),
          studentId: b.student_id || b.studentId,
          studentName: b.student_name || fullName || user.username || 'Student',
          studentEmail: b.student_email || user.email || '—',
          studentProfileId: b.student_profile_id || b.studentProfileId || b.student_profile,
          userId: user.id || b.user_id || b.userId,
          lab: b.lab_room || b.lab || b.lab_name || 'Lab',
          date: safeDate(b.booking_date || b.date || b.bookingDay),
          timeSlot: b.time_slot || b.timeSlot || b.slot || '',
          purpose: b.purpose || '',
          status: (b.status || 'pending') as any,
          requestedAt: relativeTime(b.created_at || b.requested_at || b.created),
        };
      });
      setBookingRequests(mappedBookings);

      const allPcs: PC[] = [];
      normalizeList(labsRaw).forEach((l: any) => {
        if (Array.isArray(l.pcs)) {
          l.pcs.forEach((p: any) => {
            allPcs.push({
              id: String(p.id),
              labId: String(l.id),
              pcNumber: p.pc_number || p.pcNumber || p.name || 'PC',
              status: p.status || 'available',
            });
          });
        }
      });
      setPcs(allPcs);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- Handlers ---
  const handleAddLab = async () => {
    if (!newLabName || !newLabCapacity) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      await labAdminService.createLab({ name: newLabName, capacity: Number(newLabCapacity) });
      toast.success('Lab added successfully!');
      setNewLabName(''); setNewLabCapacity(''); setIsAddLabDialogOpen(false);
      await loadAll();
    } catch (e: any) {
      toast.error('Failed to add lab');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await labAdminService.approveBooking(requestId);
      toast.success('Booking approved!');
      await loadAll();
    } catch (e: any) {
      toast.error('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectReason || !selectedRequest) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      setLoading(true);
      await labAdminService.rejectBooking(selectedRequest.id, rejectReason);
      toast.success('Booking rejected');
      setRejectReason(''); setSelectedRequest(null); setIsRejectDialogOpen(false);
      await loadAll();
    } catch (e: any) {
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const openStudentProfile = async (request: BookingRequest) => {
    try {
      setLoading(true);
      let profile = request.studentProfileId 
        ? await labAdminService.getStudentProfile(request.studentProfileId)
        : request.userId ? await labAdminService.getStudentProfileByUserId(request.userId) : null;

      setSelectedStudent({
        id: profile?.student_id || request.studentId || '—',
        name: profile?.full_name || request.studentName,
        email: profile?.email || request.studentEmail,
        program: profile?.program || '—',
        year: profile?.year || '—',
        totalBookings: profile?.total_bookings ?? '—',
        activeRentals: profile?.active_rentals ?? '—',
      });
      setIsStudentProfileOpen(true);
    } catch (e) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'available': case 'approved': return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'occupied': case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'maintenance': case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const memoLabs = useMemo(() => labs, [labs]);
  const memoPcs = useMemo(() => pcs, [pcs]);
  const memoSlots = useMemo(() => timeSlots, [timeSlots]);
  const memoRequests = useMemo(() => bookingRequests, [bookingRequests]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Lab Booking Management</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Manage lab settings and requests</p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className={theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}>
          <TabsTrigger value="requests">Booking Requests</TabsTrigger>
          <TabsTrigger value="settings">Lab Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Labs Table */}
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Labs & Studios</CardTitle>
                <CardDescription>Manage your facilities</CardDescription>
              </div>
              <Button onClick={() => setIsAddLabDialogOpen(true)} className="bg-teal-500 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Lab
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lab Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>PCs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoLabs.map((lab) => (
                    <TableRow key={lab.id}>
                      <TableCell className="font-medium">{lab.name}</TableCell>
                      <TableCell>{lab.capacity} seats</TableCell>
                      <TableCell>{lab.pcCount} Units</TableCell>
                      <TableCell><Badge className={getStatusColor(lab.status)}>{lab.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle>Booking Requests</CardTitle>
              <CardDescription>Review student applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <button onClick={() => openStudentProfile(req)} className="text-left group">
                          <p className="font-medium group-hover:text-teal-500 transition-colors">{req.studentName}</p>
                          <p className="text-xs text-gray-500">{req.studentEmail}</p>
                        </button>
                      </TableCell>
                      <TableCell>{req.lab}</TableCell>
                      <TableCell>
                        <p>{req.date}</p>
                        <p className="text-xs text-gray-500">{req.timeSlot}</p>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-gray-500">{req.purpose}</TableCell>
                      <TableCell><Badge className={getStatusColor(req.status)}>{req.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveRequest(req.id)} className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => { setSelectedRequest(req); setIsRejectDialogOpen(true); }} className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REJECT DIALOG */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader><DialogTitle>Reject Booking</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Reason for rejection</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectRequest} disabled={loading}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STUDENT PROFILE DIALOG */}
      <Dialog open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-teal-500/10">
                <div className="h-12 w-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xl">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h3 className="font-bold">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label className="text-xs text-gray-500">Program</Label><p>{selectedStudent.program}</p></div>
                <div><Label className="text-xs text-gray-500">Year</Label><p>{selectedStudent.year}</p></div>
                <div className="p-3 border rounded-lg"><p className="text-xs text-gray-500">Total Bookings</p><p className="text-lg font-bold">{selectedStudent.totalBookings}</p></div>
                <div className="p-3 border rounded-lg"><p className="text-xs text-gray-500">Active Rentals</p><p className="text-lg font-bold">{selectedStudent.activeRentals}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD LAB DIALOG */}
      <Dialog open={isAddLabDialogOpen} onOpenChange={setIsAddLabDialogOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader><DialogTitle>Add New Lab</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lab Name</Label>
              <Input value={newLabName} onChange={(e) => setNewLabName(e.target.value)} placeholder="e.g. Media Lab 1" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={newLabCapacity} onChange={(e) => setNewLabCapacity(e.target.value)} placeholder="30" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddLabDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLab} className="bg-teal-500 text-white" disabled={loading}>Create Lab</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}