
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import labBookingService from '../services/labBookingService';

export function LabBookingPage() {
  const { theme } = useTheme();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Form State
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [purpose, setPurpose] = useState('');
  
  // Data State
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Fetch Real Bookings on Load ---
  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const data = await labBookingService.getMyBookings();
      setMyBookings(data.results || data);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  // --- Static Data (Labs & Slots) - Kept static to preserve UI structure ---
  // In a real app, you might fetch labs from backend too, but keeping it static ensures UI consistency
  const labs = [
    {
      id: 'Studio A (Photography)', // ID matches backend expectation if possible
      name: 'Studio A',
      type: 'Video Production',
      capacity: '10 people',
      equipment: 'Green screen, Lighting setup, Camera rails',
      location: 'Building B, Floor 2',
    },
    {
      id: 'Studio B (Green Screen)',
      name: 'Studio B',
      type: 'Audio Recording',
      capacity: '6 people',
      equipment: 'Soundproof booth, Mixing console, Microphones',
      location: 'Building B, Floor 2',
    },
    {
      id: 'Editing Suite 1',
      name: 'Editing Room 1',
      type: 'Post Production',
      capacity: '4 people',
      equipment: 'iMac Pro, Adobe Creative Suite, Color grading monitors',
      location: 'Building B, Floor 3',
    },
    {
        id: 'Editing Suite 2',
        name: 'Editing Room 2',
        type: 'Post Production',
        capacity: '4 people',
        equipment: 'iMac Pro, Adobe Creative Suite',
        location: 'Building B, Floor 3',
      },
  ];

  const timeSlots = [
    '09:00-11:00',
    '11:00-13:00',
    '14:00-16:00',
    '16:00-18:00',
  ];

  // Helper: Date Logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateInPast = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // --- 2. Handle Booking Submission ---
  const handleBooking = async () => {
    if (!selectedLab || !selectedDate || !selectedTime || !purpose) {
        alert("Please fill in all fields");
        return;
    }

    setIsSubmitting(true);
    try {
        // Prepare data for backend
        // Format date to YYYY-MM-DD
        const formattedDate = selectedDate.toISOString().split('T')[0];
        
        const bookingData = {
            lab_room: selectedLab,
            date: formattedDate,
            time_slot: selectedTime,
            purpose: purpose
        };

        await labBookingService.create(bookingData);
        
        alert("Booking Request Submitted!");
        setShowBookingModal(false);
        
        // Reset form
        setSelectedLab('');
        setSelectedTime('');
        setPurpose('');
        
        // Refresh list
        fetchMyBookings();

    } catch (error: any) {
        console.error(error);
        alert("Booking Failed: " + (error.response?.data?.detail || "Unknown error"));
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-2">Lab Booking</h1>
          <p className="text-gray-400">
            Reserve studios and editing rooms for your projects
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          onClick={() => setShowBookingModal(true)}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar - Fixed Width */}
        <div className="lg:w-96 flex-shrink-0">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Select Date</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a date to view availability
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="max-w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isDateInPast(date)}
                  className="rounded-lg border border-gray-800 bg-gray-950 text-white mx-auto"
                  classNames={{
                    months: "flex flex-col",
                    month: "flex flex-col gap-3",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-gray-400 rounded-md w-full text-[0.7rem]",
                    row: "flex w-full mt-1",
                    cell: "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 w-full",
                    day: "h-7 w-full p-0 font-normal text-xs hover:bg-gray-800",
                  }}
                />
              </div>
              <div className="mt-4 space-y-2 border-t border-gray-800 pt-3">
                <p className={`text-sm ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Legend:</p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#10b981', minWidth: '12px', minHeight: '12px' }}></div>
                  <span className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Labs */}
        <div className="flex-1">
          <Card className="bg-gray-900/50 border-gray-800 flex flex-col lg:max-h-[480px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white">Available Labs</CardTitle>
              <CardDescription className="text-gray-400">
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1 min-h-0">
              {labs.map((lab) => (
                <div
                  key={lab.id}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-teal-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white mb-1">{lab.name}</h4>
                      <p className="text-sm text-gray-400">{lab.type}</p>
                    </div>
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                      Available
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{lab.location}</span>
                    </div>
                    <p className="text-gray-500">{lab.equipment}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {timeSlots.slice(0, 3).map((slot, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-gray-900 text-gray-300 border-gray-600 hover:border-teal-500 hover:text-teal-400 cursor-pointer"
                        onClick={() => {
                          setSelectedLab(lab.id);
                          setSelectedTime(slot);
                          setShowBookingModal(true);
                        }}
                      >
                        {slot}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Bookings - REAL DATA */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">My Bookings</CardTitle>
          <CardDescription className="text-gray-400">
            View and manage your lab reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No bookings found.</p>
            ) : (
                myBookings.map((booking: any) => (
                <div
                    key={booking.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 gap-4"
                >
                    <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h4 className="text-white">{booking.lab_room}</h4>
                        <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{booking.date}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time_slot}</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{booking.purpose}</p>
                    </div>
                </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">New Lab Booking</DialogTitle>
            <DialogDescription className="text-gray-400">
              Submit a booking request for admin approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Lab</Label>
              <Select value={selectedLab} onValueChange={setSelectedLab}>
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                  <SelectValue placeholder="Select a lab" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name} - {lab.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Date</Label>
              <div className="px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-white">
                {selectedDate?.toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Time Slot</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Purpose</Label>
              <Textarea
                placeholder="Describe the purpose of your booking..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setShowBookingModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={handleBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}