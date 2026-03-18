import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useTheme } from './ThemeProvider';
import { CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import equipmentAdmin from '../services/equipmentAdmin';

type RentalStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'pending_return' | 'returned' | 'overdue' | 'damaged';

interface Rental {
  id: number;
  equipment_name?: string;
  equipment_id?: string;
  student_name?: string;
  student_email?: string;
  status?: RentalStatus;
  rental_date?: string;
  expected_return_date?: string;
  actual_return_date?: string;
  return_remark?: string;
  return_approved_by?: any;
  return_approved_at?: string;
  reject_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export function AdminEquipmentHistory() {
  const { theme } = useTheme();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Return approval dialog
  const [isApproveReturnDialogOpen, setIsApproveReturnDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [returnRemark, setReturnRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRentals = async () => {
    setLoading(true);
    try {
      const data = await equipmentAdmin.listRentals();
      const list = Array.isArray(data) ? data : data?.results || [];
      setRentals(list);
    } catch (error) {
      console.error('Failed to load rentals:', error);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const handleApproveReturn = (rental: Rental) => {
    setSelectedRental(rental);
    setReturnRemark('');
    setIsApproveReturnDialogOpen(true);
  };

  const confirmApproveReturn = async () => {
    if (!selectedRental) return;
    
    setActionLoading(true);
    try {
      await equipmentAdmin.approveReturn(selectedRental.id, returnRemark);
      setIsApproveReturnDialogOpen(false);
      setSelectedRental(null);
      setReturnRemark('');
      await loadRentals();
    } catch (error) {
      console.error('Failed to approve return:', error);
      alert('Failed to approve return');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status?: RentalStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved':
      case 'active':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'pending_return':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'returned':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'overdue':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const pendingReturns = rentals.filter(r => r.status === 'pending_return');
  const allRentals = rentals;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Booking History</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          View all equipment rentals and approve returns
        </p>
      </div>

      <Tabs defaultValue="pending-returns" className="w-full">
        <TabsList className={theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}>
          <TabsTrigger 
            value="pending-returns" 
            className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}
          >
            Pending Returns ({pendingReturns.length})
          </TabsTrigger>
          <TabsTrigger 
            value="all-history" 
            className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}
          >
            All History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-returns" className="space-y-4">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                Equipment Pending Return Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : pendingReturns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No pending returns</div>
              ) : (
                <div className="space-y-3">
                  {pendingReturns.map((rental) => (
                    <div
                      key={rental.id}
                      className={`p-4 rounded-lg border ${
                        theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                            <Package className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              {rental.equipment_name || 'Equipment'}
                            </p>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                              {rental.student_name || rental.student_email || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Returned: {formatDate(rental.actual_return_date)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApproveReturn(rental)}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Check & Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-history" className="space-y-4">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                All Equipment Rentals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : allRentals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No rental history</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment</TableHead>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Rental Date</TableHead>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Return Date</TableHead>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                        <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRentals.map((rental) => (
                        <TableRow key={rental.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                          <TableCell>
                            <div>
                              <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                                {rental.equipment_name || 'Equipment'}
                              </p>
                              <p className="text-xs text-gray-500">{rental.equipment_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            {rental.student_name || rental.student_email || '—'}
                          </TableCell>
                          <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            {formatDate(rental.rental_date)}
                          </TableCell>
                          <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            {formatDate(rental.actual_return_date || rental.expected_return_date)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(rental.status)}>
                              {rental.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                            {rental.return_remark || rental.reject_reason || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Return Dialog */}
      <Dialog open={isApproveReturnDialogOpen} onOpenChange={setIsApproveReturnDialogOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900'}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
              Approve Equipment Return
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                Equipment: {selectedRental?.equipment_name}
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Student: {selectedRental?.student_name || selectedRental?.student_email}
              </p>
            </div>
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                Remark (Equipment Condition)
              </Label>
              <Textarea
                value={returnRemark}
                onChange={(e) => setReturnRemark(e.target.value)}
                placeholder="Enter remarks about equipment condition (e.g., 'Good condition', 'Minor scratches', etc.)"
                className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-950 border-gray-700'}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsApproveReturnDialogOpen(false)}
                disabled={actionLoading}
                className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproveReturn}
                disabled={actionLoading}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {actionLoading ? 'Approving...' : 'Approve Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
