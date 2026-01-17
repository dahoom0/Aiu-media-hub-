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

import adminProfileManagementService from '../services/adminProfileManagement';

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

type BackendList<T> = T[] | { results: T[] };

type BackendUser = {
  email?: string;
  phone?: string | null;
  profile_picture?: string | null;
};

type BackendStudentProfile = {
  id?: number | string;
  full_name?: string | null;
  student_id?: string | null;
  program?: string | null;
  year?: string | null;
  status?: string | null;
  total_bookings?: number | null;
  active_rentals?: number | null;
  tutorials_watched?: number | null;
  user?: BackendUser | null;

  hasCV?: boolean;
  has_cv?: boolean;
};

type BackendAdminProfile = {
  id?: number | string;
  full_name?: string | null;
  admin_id?: string | null;
  role?: string | null;
  position?: string | null;
  status?: string | null;
  user?: BackendUser | null;
};

function extractList<T>(data: BackendList<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).results)) return (data as any).results;
  return [];
}

export function AdminProfileManagement({
  onNavigate,
  initialStudentId
}: {
  onNavigate?: (page: string, params?: any) => void;
  initialStudentId?: string;
}) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProfile, setSelectedProfile] = useState<Student | Admin | null>(null);
  const [profileType, setProfileType] = useState<'student' | 'admin'>('student');

  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);

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

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [studentsRes, adminsRes] = await Promise.all([
          adminProfileManagementService.getStudentProfiles(),
          adminProfileManagementService.getAdminProfiles()
        ]);

        const studentRawList = extractList<BackendStudentProfile>(studentsRes.data as BackendList<BackendStudentProfile>);
        const adminRawList = extractList<BackendAdminProfile>(adminsRes.data as BackendList<BackendAdminProfile>);

        // ✅ FIX: Do NOT drop profiles just because phone/program/year is empty.
        // Only "student_id" and "user.email" and "full_name" are essential for list rendering.
        const mappedStudents: Student[] = studentRawList
          .map((p) => {
            if (!p) return null;

            const user = p.user || undefined;

            const studentId = p.student_id ? String(p.student_id) : '';
            const email = user?.email ? String(user.email) : '';
            const name = p.full_name ? String(p.full_name) : '';

            if (!studentId || !email || !name) {
              console.warn('Skipping student profile due to missing required fields (full_name/student_id/user.email):', p);
              return null;
            }

            const status = String(p.status || '').toLowerCase();
            const normalizedStatus: 'active' | 'inactive' = status === 'inactive' ? 'inactive' : 'active';

            const hasCvValue =
              typeof p.hasCV === 'boolean'
                ? p.hasCV
                : typeof p.has_cv === 'boolean'
                  ? p.has_cv
                  : false;

            return {
              id: String(p.id ?? studentId),
              name,
              email,
              phone: user?.phone ? String(user.phone) : '',
              studentId,
              program: p.program ? String(p.program) : '',
              year: p.year ? String(p.year) : '',
              status: normalizedStatus,
              profilePicture: user?.profile_picture || undefined,
              totalBookings: Number(p.total_bookings ?? 0),
              activeRentals: Number(p.active_rentals ?? 0),
              tutorialsWatched: Number(p.tutorials_watched ?? 0),
              hasCV: hasCvValue
            };
          })
          .filter(Boolean) as Student[];

        const mappedAdmins: Admin[] = adminRawList
          .map((p) => {
            if (!p) return null;

            const user = p.user || undefined;

            const adminId = p.admin_id ? String(p.admin_id) : '';
            const email = user?.email ? String(user.email) : '';
            const name = p.full_name ? String(p.full_name) : '';

            if (!adminId || !email || !name) {
              console.warn('Skipping admin profile due to missing required fields (full_name/admin_id/user.email):', p);
              return null;
            }

            const roleValue =
              typeof p.role === 'string'
                ? p.role
                : typeof p.position === 'string'
                  ? p.position
                  : '';

            const status = String(p.status || '').toLowerCase();
            const normalizedStatus: 'active' | 'inactive' = status === 'inactive' ? 'inactive' : 'active';

            return {
              id: String(p.id ?? adminId),
              name,
              email,
              phone: user?.phone ? String(user.phone) : '',
              adminId,
              role: roleValue || '',
              status: normalizedStatus,
              profilePicture: user?.profile_picture || undefined
            };
          })
          .filter(Boolean) as Admin[];

        if (!isMounted) return;
        setStudents(mappedStudents);
        setAdmins(mappedAdmins);
      } catch (err) {
        console.error('Failed to load profiles:', err);
        if (!isMounted) return;
        setStudents([]);
        setAdmins([]);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialStudentId) {
      const student = students.find((s) => s.studentId === initialStudentId);
      if (student) {
        handleViewProfile(student, 'student');
      }
    }
  }, [initialStudentId, students]);

  if (viewMode === 'detail' && selectedProfile) {
    return (
      <div className="p-6 space-y-6">
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
          <Badge className={getStatusColor(selectedProfile.status)}>{selectedProfile.status}</Badge>
        </div>

        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${
                  profileType === 'student' ? 'from-teal-500 to-cyan-500' : 'from-purple-500 to-pink-500'
                } text-white text-3xl`}
              >
                {selectedProfile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <h2 className={`text-2xl mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {selectedProfile.name}
                </h2>
                <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {profileType === 'student' ? (selectedProfile as Student).studentId : (selectedProfile as Admin).adminId}
                </p>
                {profileType === 'student' && (
                  <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    {(selectedProfile as Student).year}
                  </p>
                )}
              </div>
            </div>

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
                    <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{(selectedProfile as Student).program}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Current Year</p>
                    </div>
                    <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{(selectedProfile as Student).year}</p>
                  </div>
                </div>
              </div>
            )}

            {profileType === 'admin' && (
              <div>
                <h3 className={`text-lg mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Role Information</h3>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className={`h-4 w-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Role</p>
                  </div>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{(selectedProfile as Admin).role}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {profileType === 'student' && (
          <div className="grid grid-cols-3 gap-6">
            <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Total Bookings</p>
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
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Active Rentals</p>
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
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Tutorials Watched</p>
                    <p className={`text-2xl ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {(selectedProfile as Student).tutorialsWatched}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {profileType === 'student' && (selectedProfile as Student).hasCV && (
          <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
            <CardHeader>
              <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Digital Portfolio (CV)</CardTitle>
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Profile Management</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Manage student and admin accounts</p>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className={theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}>
          <TabsTrigger value="students" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Students
          </TabsTrigger>
          <TabsTrigger value="admins" className={theme === 'light' ? 'data-[state=active]:bg-white' : 'data-[state=active]:bg-gray-900'}>
            Admins
          </TabsTrigger>
        </TabsList>

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
                            {student.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>

                          {/* ✅ FIX: show ONLY full name (do NOT show year under the name) */}
                          <div>
                            <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{student.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{student.studentId}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{student.email}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{student.program}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
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
                            {admin.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{admin.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{admin.adminId}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{admin.email}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{admin.role}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(admin.status)}>{admin.status}</Badge>
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
