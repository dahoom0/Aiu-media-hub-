import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { toast } from 'sonner';

import labBookingService from '../services/labBookingService';

type BackendLab = {
  id: number;
  name: string;
  location?: string | null;
  facilities?: string | null;
  facilities_list?: string[]; // from serializer
  is_active?: boolean;
  type?: string | null; // in case your model has it
  lab_type?: string | null; // in case your model has it
};

type BackendBooking = {
  id: number;
  lab?: number | null;
  lab_name?: string | null;      // read-only
  lab_room?: string | null;      // added in to_representation
  booking_date?: string | null;
  date?: string | null;          // added in to_representation
  time_slot?: string | null;     // stored like "10:00-12:00"
  status?: string | null;        // e.g. "Pending"
  purpose?: string | null;
  imac_number?: number | null;
};

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTimeSlot(slot: string): string {
  // backend expects "HH:MM-HH:MM" (spaces are ok, but we standardize)
  return slot.replace(/\s+/g, '');
}

function normalizeStatus(raw?: string | null): string {
  return (raw || '').toLowerCase().trim();
}

export function LabBookingPage() {
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);

  // lab/time/purpose
  const [selectedLab, setSelectedLab] = useState(''); // string labId
  const [selectedTime, setSelectedTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // iMac availability
  const [availableImacs, setAvailableImacs] = useState<number[]>([]);
  const [selectedImac, setSelectedImac] = useState<string>(''); // keep select value as string
  const [isFetchingImacs, setIsFetchingImacs] = useState(false);
  const [imacFetchError, setImacFetchError] = useState<string | null>(null);

  // backend data
  const [labs, setLabs] = useState<BackendLab[]>([]);
  const [myBookings, setMyBookings] = useState<BackendBooking[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo availability data - some dates are fully booked (kept as-is; UI only)
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const bookedDates = useMemo(
    () => [
      new Date(2025, 10, 25), // Nov 25
      new Date(2025, 10, 28), // Nov 28
      new Date(2025, 11, 2),  // Dec 2
      new Date(2025, 11, 5),  // Dec 5
    ],
    []
  );

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) =>
        bookedDate.getDate() === date.getDate() &&
        bookedDate.getMonth() === date.getMonth() &&
        bookedDate.getFullYear() === date.getFullYear()
    );
  };

  const isDateInPast = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const timeSlots = useMemo(
    () => ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'],
    []
  );

  const selectedLabObj = useMemo(() => {
    const idNum = Number(selectedLab);
    if (!idNum) return null;
    return labs.find((l) => l.id === idNum) || null;
  }, [labs, selectedLab]);

  // ---- STATUS UI helpers (no style changes, just smarter mapping) ----
  const getStatusIcon = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'approved':
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'approved':
      case 'confirmed':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const prettyStatus = (status?: string | null) => {
    const s = normalizeStatus(status);
    if (s === 'approved') return 'confirmed';
    return s || 'unknown';
  };

  // ---- Fetch labs + bookings ----
  const fetchLabs = async () => {
    setIsLoadingLabs(true);
    try {
      const data = await labBookingService.getLabs();
      // backend might return array directly or paginated
      const list = Array.isArray(data) ? data : data?.results || [];
      setLabs(list);
    } catch (err) {
      toast.error('Failed to load labs.');
    } finally {
      setIsLoadingLabs(false);
    }
  };

  const fetchMyBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const data = await labBookingService.getMyBookings();
      const list = Array.isArray(data) ? data : data?.results || [];
      setMyBookings(list);
    } catch (err) {
      toast.error('Failed to load your bookings.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Fetch available iMacs when lab + date + time_slot chosen ----
  useEffect(() => {
    const run = async () => {
      setImacFetchError(null);
      setAvailableImacs([]);
      setSelectedImac('');

      if (!selectedLabObj || !selectedDate || !selectedTime) return;

      const dateStr = formatDateYYYYMMDD(selectedDate);
      const timeSlotNormalized = normalizeTimeSlot(selectedTime);

      setIsFetchingImacs(true);
      try {
        const res = await labBookingService.getAvailableImacs({
          lab_room: selectedLabObj.name, // IMPORTANT: backend expects name
          date: dateStr,
          time_slot: timeSlotNormalized,
        });

        const list = Array.isArray(res) ? res : res?.available_imacs;
        if (!Array.isArray(list)) {
          setImacFetchError('Invalid availability response.');
          setAvailableImacs([]);
          return;
        }

        setAvailableImacs(list);
      } catch (e: any) {
        setImacFetchError('Failed to fetch available iMacs for this slot.');
        setAvailableImacs([]);
        toast.error('Failed to fetch available iMacs for this slot.');
      } finally {
        setIsFetchingImacs(false);
      }
    };

    run();
  }, [selectedLabObj, selectedDate, selectedTime]);

  const handleBooking = async () => {
    if (!selectedLabObj) {
      toast.error('Please select a lab.');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date.');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a time slot.');
      return;
    }
    if (!selectedImac) {
      toast.error('Please select an iMac number.');
      return;
    }
    if (!purpose.trim()) {
      toast.error('Please enter a purpose.');
      return;
    }

    const dateStr = formatDateYYYYMMDD(selectedDate);
    const timeSlotNormalized = normalizeTimeSlot(selectedTime);

    setIsSubmitting(true);
    try {
      await labBookingService.create({
        lab_room: selectedLabObj.name, // IMPORTANT: serializer resolves lab by name
        date: dateStr,
        time_slot: timeSlotNormalized,
        imac_number: Number(selectedImac),
        purpose: purpose.trim(),
        participants: 1,
      });

      toast.success('Booking request submitted.');

      // refresh bookings
      await fetchMyBookings();

      // reset + close
      setShowBookingModal(false);
      setSelectedLab('');
      setSelectedTime('');
      setPurpose('');
      setSelectedImac('');
      setAvailableImacs([]);
      setImacFetchError(null);
    } catch (e: any) {
      toast.error('Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Render helpers (keep the same UI fields) ----
  const labsForUI = useMemo(() => {
    // Convert backend labs into the same structure your UI expects, without changing layout.
    return labs.map((lab) => {
      const facilitiesList =
        lab.facilities_list ||
        (lab.facilities ? lab.facilities.split(',').map((s) => s.trim()).filter(Boolean) : []);

      return {
        id: String(lab.id), // UI expects string
        name: lab.name,
        type: lab.lab_type || lab.type || 'Lab',
        capacity: '—', // backend not provided; do not guess
        equipment: facilitiesList.length ? facilitiesList.join(', ') : '—',
        location: lab.location || '—',
        _raw: lab,
      };
    });
  }, [labs]);

  const bookingsForUI = useMemo(() => {
    return myBookings.map((b) => {
      const date = b.booking_date || b.date || '';
      const time = b.time_slot ? b.time_slot.replace('-', ' - ') : '';
      const labName = b.lab_name || b.lab_room || '—';
      const status = b.status || 'pending';

      return {
        id: b.id,
        lab: labName,
        date,
        time,
        status: prettyStatus(status),
        purpose: b.purpose || '',
      };
    });
  }, [myBookings]);

  const canSubmit =
    !!selectedLabObj &&
    !!selectedDate &&
    !!selectedTime &&
    !!selectedImac &&
    !!purpose.trim() &&
    !isSubmitting;

  const isSlotFullyBooked = selectedLabObj && selectedDate && selectedTime && !isFetchingImacs && availableImacs.length === 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-2">Lab Booking</h1>
          <p className="text-gray-400">Reserve studios and editing rooms for your projects</p>
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
              <CardDescription className="text-gray-400">Choose a date to view availability</CardDescription>
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
                    months: 'flex flex-col',
                    month: 'flex flex-col gap-3',
                    table: 'w-full border-collapse',
                    head_row: 'flex w-full',
                    head_cell: 'text-gray-400 rounded-md w-full text-[0.7rem]',
                    row: 'flex w-full mt-1',
                    cell: 'relative p-0 text-center text-xs focus-within:relative focus-within:z-20 w-full',
                    day: 'h-7 w-full p-0 font-normal text-xs hover:bg-gray-800',
                  }}
                />
              </div>
              <div className="mt-4 space-y-2 border-t border-gray-800 pt-3">
                <p className={`text-sm ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>Legend:</p>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#10b981', minWidth: '12px', minHeight: '12px' }}
                  ></div>
                  <span className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>Available</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: '#ef4444', minWidth: '12px', minHeight: '12px' }}
                  ></div>
                  <span className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>Fully Booked</span>
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
              {isLoadingLabs && (
                <div className="text-sm text-gray-400">Loading labs...</div>
              )}

              {!isLoadingLabs &&
                labsForUI.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white mb-1">{lab.name}</h4>
                        <p className="text-sm text-gray-400">{lab.type}</p>
                      </div>
                      <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">Available</Badge>
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
                      <Badge variant="outline" className="bg-gray-900 text-gray-300 border-gray-600">
                        +2 more
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Bookings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">My Bookings</CardTitle>
          <CardDescription className="text-gray-400">View and manage your lab reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingBookings && <div className="text-sm text-gray-400">Loading bookings...</div>}

            {!isLoadingBookings && bookingsForUI.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">No bookings found.</div>
            )}

            {!isLoadingBookings &&
              bookingsForUI.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-white">{booking.lab}</h4>
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
                        <span>{booking.time}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">{booking.purpose}</p>
                  </div>

                  {/* Keep cancel button styling. (Only works if backend cancel action exists.) */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => toast.message('Cancel endpoint is not implemented on backend yet.')}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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
              <Select
                value={selectedLab}
                onValueChange={(v) => {
                  setSelectedLab(v);
                  // reset dependent fields
                  setSelectedImac('');
                  setAvailableImacs([]);
                  setImacFetchError(null);
                }}
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                  <SelectValue placeholder={isLoadingLabs ? 'Loading...' : 'Select a lab'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {labsForUI.map((lab) => (
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
              <Select
                value={selectedTime}
                onValueChange={(v) => {
                  setSelectedTime(v);
                  // reset iMac when changing time
                  setSelectedImac('');
                  setAvailableImacs([]);
                  setImacFetchError(null);
                }}
              >
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

            {/* ✅ iMac dropdown (based on backend availability) */}
            <div className="space-y-2">
              <Label className="text-gray-300">iMac Number</Label>
              <Select
                value={selectedImac}
                onValueChange={setSelectedImac}
                disabled={!selectedLabObj || !selectedDate || !selectedTime || isFetchingImacs}
              >
                <SelectTrigger className="bg-gray-950 border-gray-700 text-white">
                  <SelectValue
                    placeholder={
                      !selectedLabObj || !selectedTime
                        ? 'Select lab & time first'
                        : isFetchingImacs
                          ? 'Checking availability...'
                          : availableImacs.length
                            ? 'Select iMac number'
                            : 'No iMacs available'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {availableImacs.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {imacFetchError && <p className="text-xs text-red-400">{imacFetchError}</p>}
              {!imacFetchError && isSlotFullyBooked && selectedLabObj && selectedTime && (
                <p className="text-xs text-red-400">This time slot is fully booked.</p>
              )}
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
              >
                Cancel
              </Button>

              <Button
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={handleBooking}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
