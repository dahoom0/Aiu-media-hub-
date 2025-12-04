import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useTheme } from './ThemeProvider';
import { 
  User,
  Mail,
  Phone,
  GraduationCap,
  FileText,
  Calendar,
  ArrowLeft,
  BookOpen,
  Package2
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  phone: string;
  program: string;
  year: string;
  status: 'active' | 'inactive';
  profilePicture?: string;
  totalBookings: number;
  activeRentals: number;
  tutorialsWatched: number;
  hasCV: boolean;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  adminId: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  profilePicture?: string;
}

export function AdminProfileManagement({ onNavigate, initialStudentId }: { onNavigate?: (page: string, params?: any) => void; initialStudentId?: string }) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProfile, setSelectedProfile] = useState<Student | Admin | null>(null);
  const [profileType, setProfileType] = useState<'student' | 'admin'>('student');

  // Mock data
  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@aiu.edu.my',
      studentId: 'S001',
      phone: '+60 13-456 7890',
      program: 'Bachelor of Media & Communication',
      year: '3rd Year',
      status: 'active',
      totalBookings: 15,
      activeRentals: 2,
      tutorialsWatched: 32,
      hasCV: true
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@aiu.edu.my',
      studentId: 'S002',
      phone: '+60 14-567 8901',
      program: 'Bachelor of Media & Communication',
      year: '2nd Year',
      status: 'active',
      totalBookings: 8,
      activeRentals: 1,
      tutorialsWatched: 18,
      hasCV: true
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@aiu.edu.my',
      studentId: 'S003',
      phone: '+60 12-345 6789',
      program: 'Bachelor of Media & Communication',
      year: '1st Year',
      status: 'active',
      totalBookings: 5,
      activeRentals: 0,
      tutorialsWatched: 12,
      hasCV: true
    },
    {
      id: '4',
      name: 'David Lee',
      email: 'david@aiu.edu.my',
      studentId: 'S004',
      phone: '+60 15-678 9012',
      program: 'Bachelor of Media & Communication',
      year: '1st Year',
      status: 'active',
      totalBookings: 3,
      activeRentals: 0,
      tutorialsWatched: 8,
      hasCV: false
    }
  ]);

  const [admins] = useState<Admin[]>([
    {
      id: '1',
      name: 'Dr. Ahmad Hassan',
      email: 'ahmad@aiu.edu.my',
      adminId: 'A001',
      phone: '+60 12-987 6543',
      role: 'System Administrator',
      status: 'active'
    },
    {
      id: '2',
      name: 'Lisa Wong',
      email: 'lisa@aiu.edu.my',
      adminId: 'A002',
      phone: '+60 13-876 5432',
      role: 'Content Manager',
      status: 'active'
    }
  ]);

  const handleViewProfile = (profile: Student | Admin, type: 'student' | 'admin') => {
    setSelectedProfile(profile);
    setProfileType(type);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProfile(null);
  };

  const handleViewCV = () => {
    if (selectedProfile && 'hasCV' in selectedProfile && selectedProfile.hasCV) {
      if (onNavigate) {
        onNavigate('admin-cv-review', { studentId: (selectedProfile as Student).studentId });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Auto-open student profile if initialStudentId is provided
  useEffect(() => {
    if (initialStudentId) {
      const student = students.find(s => s.studentId === initialStudentId);
      if (student) {
        handleViewProfile(student, 'student');
      }
    }
  }, [initialStudentId]);

  // Detail View
  if (viewMode === 'detail' && selectedProfile) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedProfile.name}</h1>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                {profileType === 'student' ? 'Student' : 'Admin'} Profile
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(selectedProfile.status)}>
            {selectedProfile.status}
          </Badge>
        </div>

        {/* Profile Card */}
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-8 space-y-8">
            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${
                profileType === 'student' ? 'from-teal-500 to-cyan-500' : 'from-purple-500 to-pink-500'
              } text-white text-3xl`}>
                {selectedProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className={`text-2xl mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {selectedProfile.name}
                </h2>
                <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {profileType === 'student' 
                    ? (selectedProfile as Student).studentId
                    : (selectedProfile as Admin).adminId
                  }
                </p>
                {profileType === 'student' && (
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    {(selectedProfile as Student).year}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className={`text-lg mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Email</p>
                  </div>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedProfile.email}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Phone</p>
                  </div>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedProfile.phone}</p>
                </div>
              </div>
            </div>

            {/* Academic Information (Students only) */}
            {profileType === 'student' && (
              <div>
                <h3 className={`text-lg mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Academic Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Program</p>
                    </div>
                    <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      {(selectedProfile as Student).program}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Current Year</p>
                    </div>
                    <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      {(selectedProfile as Student).year}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Information (Admins only) */}
            {profileType === 'admin' && (
              <div>
                <h3 className={`text-lg mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Role Information
                </h3>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Role</p>
                  </div>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                    {(selectedProfile as Admin).role}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Statistics (Students only) */}
        {profileType === 'student' && (
          <div className="grid grid-cols-3 gap-6">
            <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Total Bookings
                    </p>
                    <p className={`text-2xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {(selectedProfile as Student).totalBookings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                    <Package2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Active Rentals
                    </p>
                    <p className={`text-2xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {(selectedProfile as Student).activeRentals}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Tutorials Watched
                    </p>
                    <p className={`text-2xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {(selectedProfile as Student).tutorialsWatched}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CV Section (Students with CV only) */}
        {profileType === 'student' && (selectedProfile as Student).hasCV && (
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                Digital Portfolio (CV)
              </CardTitle>
              <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                This student has an active CV/Portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleViewCV}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full CV
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Profile Management</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          Manage student and admin accounts
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className={theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}>
          <TabsTrigger value="students" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Students
          </TabsTrigger>
          <TabsTrigger value="admins" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Admins
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student Accounts</CardTitle>
              <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                View and manage student profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student ID</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Email</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Program</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{student.name}</p>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{student.year}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {student.studentId}
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {student.email}
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {student.program}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewProfile(student, 'student')}
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        >
                          <User className="h-3 w-3 mr-1" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-6">
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Admin Accounts</CardTitle>
              <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                View and manage admin profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Admin</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Admin ID</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Email</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Role</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                    <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {admin.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{admin.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {admin.adminId}
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {admin.email}
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {admin.role}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(admin.status)}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewProfile(admin, 'admin')}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                          <User className="h-3 w-3 mr-1" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}