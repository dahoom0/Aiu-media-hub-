import { useState } from 'react';
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
  Calendar,
  Monitor,
  Clock,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface Lab {
  id: string;
  name: string;
  capacity: number;
  pcCount: number;
  status: 'available' | 'occupied' | 'maintenance';
}

interface PC {
  id: string;
  labId: string;
  pcNumber: string;
  status: 'available' | 'occupied' | 'maintenance';
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lab: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export function AdminLabManagement() {
  const { theme } = useTheme();
  const [isAddLabDialogOpen, setIsAddLabDialogOpen] = useState(false);
  const [isAddPCDialogOpen, setIsAddPCDialogOpen] = useState(false);
  const [isAddTimeSlotDialogOpen, setIsAddTimeSlotDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Lab settings state
  const [newLabName, setNewLabName] = useState('');
  const [newLabCapacity, setNewLabCapacity] = useState('');
  const [newPCNumber, setNewPCNumber] = useState('');
  const [selectedLabForPC, setSelectedLabForPC] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  // Mock data
  const [labs] = useState<Lab[]>([
    { id: '1', name: 'Studio A', capacity: 15, pcCount: 8, status: 'available' },
    { id: '2', name: 'Studio B', capacity: 12, pcCount: 6, status: 'occupied' },
    { id: '3', name: 'Editing Room 1', capacity: 10, pcCount: 10, status: 'available' },
    { id: '4', name: 'Editing Room 2', capacity: 10, pcCount: 10, status: 'maintenance' }
  ]);

  const [pcs] = useState<PC[]>([
    { id: '1', labId: '1', pcNumber: 'PC-01', status: 'available' },
    { id: '2', labId: '1', pcNumber: 'PC-02', status: 'occupied' },
    { id: '3', labId: '3', pcNumber: 'PC-01', status: 'available' }
  ]);

  const [timeSlots] = useState<TimeSlot[]>([
    { id: '1', time: '08:00 - 10:00', available: true },
    { id: '2', time: '10:00 - 12:00', available: true },
    { id: '3', time: '14:00 - 16:00', available: true },
    { id: '4', time: '16:00 - 18:00', available: true }
  ]);

  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([
    {
      id: '1',
      studentId: 'S001',
      studentName: 'John Smith',
      studentEmail: 'john@aiu.edu.my',
      lab: 'Studio A',
      date: '2025-11-15',
      timeSlot: '10:00 - 12:00',
      purpose: 'Video production project',
      status: 'pending',
      requestedAt: '2 hours ago'
    },
    {
      id: '2',
      studentId: 'S002',
      studentName: 'Sarah Johnson',
      studentEmail: 'sarah@aiu.edu.my',
      lab: 'Editing Room 1',
      date: '2025-11-16',
      timeSlot: '14:00 - 16:00',
      purpose: 'Post-production editing',
      status: 'pending',
      requestedAt: '5 hours ago'
    },
    {
      id: '3',
      studentId: 'S003',
      studentName: 'Mike Chen',
      studentEmail: 'mike@aiu.edu.my',
      lab: 'Studio B',
      date: '2025-11-17',
      timeSlot: '08:00 - 10:00',
      purpose: 'Photography session',
      status: 'approved',
      requestedAt: '1 day ago'
    }
  ]);

  const handleAddLab = () => {
    if (!newLabName || !newLabCapacity) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Lab added successfully!');
    setNewLabName('');
    setNewLabCapacity('');
    setIsAddLabDialogOpen(false);
  };

  const handleAddPC = () => {
    if (!newPCNumber || !selectedLabForPC) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('PC added successfully!');
    setNewPCNumber('');
    setSelectedLabForPC('');
    setIsAddPCDialogOpen(false);
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot) {
      toast.error('Please enter a time slot');
      return;
    }
    toast.success('Time slot added successfully!');
    setNewTimeSlot('');
    setIsAddTimeSlotDialogOpen(false);
  };

  const handleApproveRequest = (requestId: string) => {
    setBookingRequests(prev =>
      prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
    );
    toast.success('Booking request approved!');
  };

  const handleRejectRequest = () => {
    if (!rejectReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (selectedRequest) {
      setBookingRequests(prev =>
        prev.map(req => req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req)
      );
      toast.success('Booking request rejected');
      setRejectReason('');
      setSelectedRequest(null);
      setIsRejectDialogOpen(false);
    }
  };

  const openRejectDialog = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  const openStudentProfile = (request: BookingRequest) => {
    // Mock student data
    setSelectedStudent({
      id: request.studentId,
      name: request.studentName,
      email: request.studentEmail,
      phone: '+60 12-345 6789',
      program: 'Bachelor of Media & Communication',
      year: '3rd Year',
      totalBookings: 12,
      activeRentals: 2
    });
    setIsStudentProfileOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'approved':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'occupied':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'maintenance':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Lab Booking Management</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          Manage lab settings and booking requests
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className={theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}>
          <TabsTrigger value="requests" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Booking Requests
          </TabsTrigger>
          <TabsTrigger value="settings" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Lab Settings
          </TabsTrigger>
        </TabsList>

        {/* Lab Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Labs */}
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Labs & Studios</CardTitle>
                  <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    Manage available labs and studios
                  </CardDescription>
                </div>
                <Dialog open={isAddLabDialogOpen} onOpenChange={setIsAddLabDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lab
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
                    <DialogHeader>
                      <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Add New Lab</DialogTitle>
                      <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        Create a new lab or studio
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Lab Name</Label>
                        <Input
                          value={newLabName}
                          onChange={(e) => setNewLabName(e.target.value)}
                          placeholder="e.g., Studio C"
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Capacity</Label>
                        <Input
                          type="number"
                          value={newLabCapacity}
                          onChange={(e) => setNewLabCapacity(e.target.value)}
                          placeholder="Maximum number of students"
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddLabDialogOpen(false)}
                        className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddLab}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        Add Lab
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Lab Name</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Capacity</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>PCs</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labs.map((lab) => (
                    <TableRow key={lab.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{lab.name}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{lab.capacity} students</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{lab.pcCount} PCs</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lab.status)}>{lab.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* PCs */}
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>PCs</CardTitle>
                  <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    Manage computers in each lab
                  </CardDescription>
                </div>
                <Dialog open={isAddPCDialogOpen} onOpenChange={setIsAddPCDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add PC
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
                    <DialogHeader>
                      <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Add New PC</DialogTitle>
                      <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        Add a PC to a lab
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Lab</Label>
                        <select
                          value={selectedLabForPC}
                          onChange={(e) => setSelectedLabForPC(e.target.value)}
                          className={`mt-2 w-full px-3 py-2 rounded-md border ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        >
                          <option value="">Select a lab</option>
                          {labs.map(lab => (
                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>PC Number</Label>
                        <Input
                          value={newPCNumber}
                          onChange={(e) => setNewPCNumber(e.target.value)}
                          placeholder="e.g., PC-01"
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddPCDialogOpen(false)}
                        className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddPC}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        Add PC
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pcs.map((pc) => {
                  const lab = labs.find(l => l.id === pc.labId);
                  return (
                    <div
                      key={pc.id}
                      className={`p-4 rounded-lg border ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                            <Monitor className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{pc.pcNumber}</p>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{lab?.name}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(pc.status)}>{pc.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className={`flex-1 ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Time Slots</CardTitle>
                  <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    Configure available booking time slots
                  </CardDescription>
                </div>
                <Dialog open={isAddTimeSlotDialogOpen} onOpenChange={setIsAddTimeSlotDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
                    <DialogHeader>
                      <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Add Time Slot</DialogTitle>
                      <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        Create a new booking time slot
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Time Slot</Label>
                        <Input
                          value={newTimeSlot}
                          onChange={(e) => setNewTimeSlot(e.target.value)}
                          placeholder="e.g., 18:00 - 20:00"
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddTimeSlotDialogOpen(false)}
                        className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddTimeSlot}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        Add Time Slot
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                        <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{slot.time}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Booking Requests</CardTitle>
              <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                Review and manage lab booking requests from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Lab</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Date & Time</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Purpose</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingRequests.map((request) => (
                    <TableRow key={request.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell>
                        <button
                          onClick={() => openStudentProfile(request)}
                          className="text-left hover:underline"
                        >
                          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} hover:text-teal-400 transition-colors`}>
                            {request.studentName}
                          </p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {request.studentEmail}
                          </p>
                        </button>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {request.lab}
                      </TableCell>
                      <TableCell>
                        <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{request.date}</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{request.timeSlot}</p>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {request.purpose}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              onClick={() => openRejectDialog(request)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {request.requestedAt}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Reject Booking Request</DialogTitle>
            <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={4}
                className={`mt-2 ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200 text-gray-900'
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectRequest}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Reject Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-xl">
                  {selectedStudent.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p className={`text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedStudent.name}</p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{selectedStudent.id}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Email</Label>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedStudent.email}</p>
                </div>
                <div>
                  <Label className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Phone</Label>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedStudent.phone}</p>
                </div>
                <div>
                  <Label className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Program</Label>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedStudent.program}</p>
                </div>
                <div>
                  <Label className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Year</Label>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedStudent.year}</p>
                </div>
                <div className={`p-4 rounded-lg grid grid-cols-2 gap-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Total Bookings</p>
                    <p className={`text-xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedStudent.totalBookings}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Active Rentals</p>
                    <p className={`text-xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedStudent.activeRentals}</p>
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={() => setIsStudentProfileOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
