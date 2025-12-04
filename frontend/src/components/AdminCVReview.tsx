import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useTheme } from './ThemeProvider';
import { 
  FileText,
  Download,
  ArrowLeft,
  Flag,
  User,
  CheckCircle2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentCV {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastUpdated: string;
  status: 'approved' | 'needs-changes' | 'flagged' | 'pending';
  cvData: {
    personal: {
      fullName: string;
      title: string;
      summary: string;
    };
    contact: {
      email: string;
      phone: string;
      location: string;
      linkedin?: string;
      website?: string;
    };
    education: any[];
    experience: any[];
    projects: any[];
    certifications: any[];
    involvement: any[];
    skills: any[];
    references: any[];
  };
}

export function AdminCVReview({ onNavigate, initialStudentId }: { onNavigate?: (page: string, params?: any) => void; initialStudentId?: string }) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list');
  const [selectedCV, setSelectedCV] = useState<StudentCV | null>(null);
  const [adminComment, setAdminComment] = useState('');

  // Mock data - matching Profile Management
  const [studentCVs] = useState<StudentCV[]>([
    {
      id: '1',
      studentId: 'S001',
      studentName: 'Sarah Johnson',
      studentEmail: 'sarah@aiu.edu.my',
      lastUpdated: '2025-11-24',
      status: 'approved',
      cvData: {
        personal: {
          fullName: 'Sarah Johnson',
          title: 'Digital Content Creator & Media Production Specialist',
          summary: 'Creative and passionate media student with extensive experience in digital content creation, social media management, and video production. Specialized in storytelling through visual media with a proven track record in creating engaging content for various platforms.'
        },
        contact: {
          email: 'sarah@aiu.edu.my',
          phone: '+60 13-456 7890',
          location: 'Kuala Lumpur, Malaysia',
          linkedin: 'linkedin.com/in/sarahjohnson',
          website: 'sarahjohnson.com'
        },
        education: [
          {
            id: '1',
            degree: 'Bachelor of Media & Communication',
            institution: 'Albukhary International University',
            startDate: '2022',
            endDate: '2026',
            description: 'Specialization in Digital Media and Content Creation. Current GPA: 3.8/4.0'
          }
        ],
        experience: [
          {
            id: '1',
            position: 'Social Media Content Creator',
            company: 'Digital Wave Agency',
            startDate: '2024-01',
            endDate: 'Present',
            description: 'Create engaging social media content for clients, manage content calendars, and analyze engagement metrics. Increased client engagement by 45% through strategic content planning.'
          },
          {
            id: '2',
            position: 'Video Production Intern',
            company: 'MediaHub Studios',
            startDate: '2023-06',
            endDate: '2023-12',
            description: 'Assisted in video production, editing, and post-production for commercial and corporate clients.'
          }
        ],
        projects: [
          {
            id: '1',
            name: 'Campus Life Documentary Series',
            description: 'A 5-episode documentary series exploring diverse student experiences at AIU. Won "Best Documentary" at University Media Festival 2024.',
            technologies: 'Adobe Premiere Pro, After Effects, DaVinci Resolve'
          },
          {
            id: '2',
            name: 'Social Impact Campaign',
            description: 'Led a team of 5 students to create a social awareness campaign that reached over 50,000 people on social media.',
            technologies: 'Canva, Instagram, TikTok, Analytics Tools'
          }
        ],
        certifications: [
          {
            id: '1',
            name: 'Adobe Certified Professional - Premiere Pro',
            issuer: 'Adobe',
            year: '2024'
          },
          {
            id: '2',
            name: 'Social Media Marketing Specialization',
            issuer: 'Coursera',
            year: '2024'
          }
        ],
        involvement: [
          {
            id: '1',
            role: 'President',
            organization: 'AIU Media Club',
            year: '2024-2025',
            description: 'Leading a team of 30+ members, organizing workshops and events, managing club social media presence.'
          }
        ],
        skills: [
          { id: '1', name: 'Video Editing' },
          { id: '2', name: 'Social Media Management' },
          { id: '3', name: 'Adobe Creative Suite' },
          { id: '4', name: 'Content Strategy' },
          { id: '5', name: 'Photography' }
        ],
        references: [
          {
            id: '1',
            name: 'Dr. Ahmad Hassan',
            position: 'Senior Lecturer',
            workplace: 'Albukhary International University',
            phone: '+60 12-987 6543',
            email: 'ahmad@aiu.edu.my'
          }
        ]
      }
    },
    {
      id: '2',
      studentId: 'S002',
      studentName: 'Michael Chen',
      studentEmail: 'michael@aiu.edu.my',
      lastUpdated: '2025-11-22',
      status: 'pending',
      cvData: {
        personal: {
          fullName: 'Michael Chen',
          title: 'Broadcast Journalism & Video Production Student',
          summary: 'Aspiring broadcast journalist with strong skills in investigative reporting, video journalism, and multimedia storytelling. Passionate about telling impactful stories that drive social change.'
        },
        contact: {
          email: 'michael@aiu.edu.my',
          phone: '+60 14-567 8901',
          location: 'Penang, Malaysia',
          linkedin: 'linkedin.com/in/michaelchen'
        },
        education: [
          {
            id: '1',
            degree: 'Bachelor of Media & Communication',
            institution: 'Albukhary International University',
            startDate: '2023',
            endDate: '2027',
            description: 'Focus on Journalism and Broadcasting'
          }
        ],
        experience: [
          {
            id: '1',
            position: 'Student Reporter',
            company: 'AIU Campus News',
            startDate: '2023-09',
            endDate: 'Present',
            description: 'Research, write, and produce news stories covering campus events and student issues.'
          }
        ],
        projects: [
          {
            id: '1',
            name: 'Investigative Report: Student Mental Health',
            description: 'A comprehensive 10-minute video report exploring mental health resources and challenges faced by university students.',
            technologies: 'Final Cut Pro, Sony A7III, Audio Recording Equipment'
          }
        ],
        certifications: [
          {
            id: '1',
            name: 'Journalism Ethics Certificate',
            issuer: 'Knight Center for Journalism',
            year: '2024'
          }
        ],
        involvement: [
          {
            id: '1',
            role: 'Video Journalist',
            organization: 'AIU Campus TV',
            year: '2023-Present',
            description: 'Producing weekly news segments and feature stories for campus television.'
          }
        ],
        skills: [
          { id: '1', name: 'Video Journalism' },
          { id: '2', name: 'Investigative Reporting' },
          { id: '3', name: 'Final Cut Pro' },
          { id: '4', name: 'Interview Techniques' }
        ],
        references: [
          {
            id: '1',
            name: 'Prof. Lisa Wong',
            position: 'Journalism Instructor',
            workplace: 'Albukhary International University',
            phone: '+60 13-876 5432',
            email: 'lisa@aiu.edu.my'
          }
        ]
      }
    },
    {
      id: '3',
      studentId: 'S003',
      studentName: 'Emily Rodriguez',
      studentEmail: 'emily@aiu.edu.my',
      lastUpdated: '2025-11-20',
      status: 'needs-changes',
      cvData: {
        personal: {
          fullName: 'Emily Rodriguez',
          title: 'Photography & Visual Arts Enthusiast',
          summary: 'First-year media student with a passion for visual storytelling through photography and design. Eager to learn and develop skills in commercial and documentary photography.'
        },
        contact: {
          email: 'emily@aiu.edu.my',
          phone: '+60 12-345 6789',
          location: 'Alor Setar, Kedah',
          linkedin: 'linkedin.com/in/emilyrodriguez'
        },
        education: [
          {
            id: '1',
            degree: 'Bachelor of Media & Communication',
            institution: 'Albukhary International University',
            startDate: '2024',
            endDate: '2028',
            description: 'Focus on Visual Communication and Photography'
          }
        ],
        experience: [
          {
            id: '1',
            position: 'Photography Assistant',
            company: 'Freelance',
            startDate: '2024-06',
            endDate: 'Present',
            description: 'Assisting professional photographers with event coverage and portrait sessions.'
          }
        ],
        projects: [
          {
            id: '1',
            name: 'Photo Essay: Life in Alor Setar',
            description: 'A 20-photo collection documenting daily life and culture in Alor Setar.',
            technologies: 'Canon 5D Mark IV, Adobe Lightroom, Photoshop'
          }
        ],
        certifications: [],
        involvement: [
          {
            id: '1',
            role: 'Member',
            organization: 'AIU Photography Club',
            year: '2024-Present',
            description: 'Participating in club workshops and photo walks.'
          }
        ],
        skills: [
          { id: '1', name: 'Photography' },
          { id: '2', name: 'Adobe Lightroom' },
          { id: '3', name: 'Photo Composition' }
        ],
        references: []
      }
    }
  ]);

  const handleViewCV = (cv: StudentCV) => {
    setSelectedCV(cv);
    setViewMode('review');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCV(null);
    setAdminComment('');
  };

  const handleFlagCV = () => {
    toast.success('CV flagged for review');
  };

  const handleDownloadCV = () => {
    toast.success('CV downloaded successfully');
  };

  const handleSaveComment = () => {
    if (!adminComment) {
      toast.error('Please enter a comment');
      return;
    }
    toast.success('Comment saved and sent to student');
    setAdminComment('');
  };

  const handleViewStudentProfile = () => {
    if (onNavigate && selectedCV) {
      onNavigate('admin-profiles', { studentId: selectedCV.studentId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'needs-changes':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'flagged':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'pending':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Auto-open CV if initialStudentId is provided
  useEffect(() => {
    if (initialStudentId) {
      const cv = studentCVs.find(c => c.studentId === initialStudentId);
      if (cv) {
        handleViewCV(cv);
      }
    }
  }, [initialStudentId]);

  if (viewMode === 'review' && selectedCV) {
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
              <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedCV.studentName}'s CV</h1>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                Review and provide feedback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleViewStudentProfile}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              <User className="h-4 w-4 mr-2" />
              View Student Profile
            </Button>
            <Button
              variant="outline"
              onClick={handleFlagCV}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Flag className="h-4 w-4 mr-2" />
              Flag CV
            </Button>
            <Button
              onClick={handleDownloadCV}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CV
            </Button>
          </div>
        </div>

        {/* CV Content */}
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-8 space-y-8">
            {/* Personal Details */}
            <div>
              <h2 className={`text-2xl mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {selectedCV.cvData.personal.fullName}
              </h2>
              <p className={`text-lg mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {selectedCV.cvData.personal.title}
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                {selectedCV.cvData.personal.summary}
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Email</p>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedCV.cvData.contact.email}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Phone</p>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedCV.cvData.contact.phone}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Location</p>
                  <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedCV.cvData.contact.location}</p>
                </div>
                {selectedCV.cvData.contact.linkedin && (
                  <div>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>LinkedIn</p>
                    <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{selectedCV.cvData.contact.linkedin}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            {selectedCV.cvData.education.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Education</h3>
                <div className="space-y-4">
                  {selectedCV.cvData.education.map((edu) => (
                    <div key={edu.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{edu.degree}</p>
                      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{edu.institution}</p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {edu.startDate} - {edu.endDate}
                      </p>
                      {edu.description && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {selectedCV.cvData.experience.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Experience</h3>
                <div className="space-y-4">
                  {selectedCV.cvData.experience.map((exp) => (
                    <div key={exp.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{exp.position}</p>
                      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{exp.company}</p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {exp.startDate} - {exp.endDate}
                      </p>
                      {exp.description && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {selectedCV.cvData.projects.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Projects</h3>
                <div className="space-y-4">
                  {selectedCV.cvData.projects.map((proj) => (
                    <div key={proj.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{proj.name}</p>
                      <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{proj.description}</p>
                      {proj.technologies && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          Technologies: {proj.technologies}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedCV.cvData.certifications.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Certifications</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedCV.cvData.certifications.map((cert) => (
                    <div key={cert.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{cert.name}</p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {cert.issuer} • {cert.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Involvement */}
            {selectedCV.cvData.involvement.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Involvement & Leadership</h3>
                <div className="space-y-4">
                  {selectedCV.cvData.involvement.map((inv) => (
                    <div key={inv.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{inv.role}</p>
                      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{inv.organization}</p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{inv.year}</p>
                      {inv.description && (
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{inv.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {selectedCV.cvData.skills.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCV.cvData.skills.map((skill) => (
                    <Badge key={skill.id} className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* References */}
            {selectedCV.cvData.references.length > 0 && (
              <div>
                <h3 className={`text-lg mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>References</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedCV.cvData.references.map((ref) => (
                    <div key={ref.id} className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{ref.name}</p>
                      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{ref.position}</p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{ref.workplace}</p>
                      {ref.phone && (
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Phone: {ref.phone}</p>
                      )}
                      {ref.email && (
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Email: {ref.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Comments */}
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardHeader>
            <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Admin Feedback</CardTitle>
            <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
              Provide feedback to the student
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder="Enter your feedback and comments for the student..."
              rows={6}
              className={theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}
            />
            <Button
              onClick={handleSaveComment}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Save & Send Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student CVs</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          Review and manage student CV submissions
        </p>
      </div>

      {/* CV List */}
      <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
        <CardHeader>
          <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>All Student CVs</CardTitle>
          <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Click on a student name to review their CV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Email</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Last Updated</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentCVs.map((cv) => (
                <TableRow key={cv.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                  <TableCell>
                    <button
                      onClick={() => handleViewCV(cv)}
                      className="text-left hover:underline"
                    >
                      <p className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} hover:text-teal-400 transition-colors`}>
                        {cv.studentName}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {cv.studentId}
                      </p>
                    </button>
                  </TableCell>
                  <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    {cv.studentEmail}
                  </TableCell>
                  <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    {cv.lastUpdated}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cv.status)}>
                      {cv.status === 'needs-changes' ? 'Needs Changes' : cv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewCV(cv)}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}