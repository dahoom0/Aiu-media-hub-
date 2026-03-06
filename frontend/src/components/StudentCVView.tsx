import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from './ThemeProvider';
import { CVPreviewPage } from './CVPreviewPage';
import cvService from '../services/cvService';
import { toast } from 'sonner';
import { 
  Download,
  Edit,
  AlertCircle,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  Flag,
  AlertTriangle
} from 'lucide-react';

interface StudentCVViewProps {
  onNavigate: (page: string) => void;
}

export function StudentCVView({ onNavigate }: StudentCVViewProps) {
  const { theme } = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCV = async () => {
      try {
        const data = await cvService.getMyCV();
        setCvData(data);
        
        // Show notification if there's new feedback
        if (data.status === 'flagged' || data.status === 'needs-changes') {
          if (data.admin_comment) {
            toast.info('You have new feedback on your CV', {
              description: 'Please review the admin comments below',
              duration: 5000
            });
          }
        } else if (data.status === 'approved') {
          toast.success('Your CV has been approved!', {
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Failed to fetch CV:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCV();
  }, []);

  const hasFeedback = cvData?.admin_comment && (cvData?.status === 'flagged' || cvData?.status === 'needs-changes');
  const isApproved = cvData?.status === 'approved';
  const adminComments = cvData?.admin_comment || '';
  const reviewedBy = cvData?.reviewed_by_name || 'Admin';
  const reviewedAt = cvData?.reviewed_at ? new Date(cvData.reviewed_at).toLocaleString() : '';

  const handleDownloadCV = async () => {
    try {
      await cvService.downloadMyCV();
      toast.success('CV downloaded successfully!');
    } catch (error) {
      console.error('Failed to download CV:', error);
      toast.error('Failed to download CV');
    }
  };

  const getStatusBadge = () => {
    if (!cvData) return null;
    
    switch (cvData.status) {
      case 'approved':
        return (
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'flagged':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Flagged
          </Badge>
        );
      case 'needs-changes':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Needs Changes
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
            Pending Review
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
            Draft
          </Badge>
        );
    }
  };

  // Mock CV data for preview
  const mockCVData = {
    personal: {
      fullName: cvData?.full_name || 'Ahmad bin Abdullah',
      title: cvData?.title || 'Media Production Student',
      summary: cvData?.summary || 'Passionate media and communication student with hands-on experience in video production, photography, and digital content creation. Seeking opportunities to apply creative skills in a professional environment.'
    },
    contact: {
      email: cvData?.email || 'ahmad@student.aiu.edu.my',
      phone: cvData?.phone || '+60 12-345 6789',
      location: cvData?.location || 'Alor Setar, Kedah',
      linkedin: cvData?.linkedin || 'linkedin.com/in/ahmadbinabdullah',
      website: cvData?.portfolio_website || 'ahmadportfolio.com'
    },
    education: [
      {
        id: '1',
        institution: 'Albukhary International University',
        degree: 'Bachelor of Media and Communication',
        field: 'Media Production',
        startDate: '2022-09',
        endDate: '2026-06',
        current: true,
        gpa: '3.75',
        description: 'Focus on video production, digital media, and content creation'
      }
    ],
    experience: [
      {
        id: '1',
        company: 'AIU Media Center',
        position: 'Student Assistant',
        location: 'Alor Setar, Kedah',
        startDate: '2023-01',
        endDate: '2024-12',
        current: false,
        description: 'Assisted in video production for university events and managed equipment rentals'
      }
    ],
    projects: [
      {
        id: '1',
        name: 'Documentary: Local Heritage',
        description: 'Produced a 15-minute documentary showcasing local cultural heritage',
        technologies: 'Adobe Premiere Pro, After Effects',
        link: 'youtube.com/watch?v=example',
        startDate: '2023-09',
        endDate: '2023-12'
      }
    ],
    certifications: [],
    languages: [],
    awards: [],
    skills: [
      { id: '1', name: 'Video Editing' },
      { id: '2', name: 'Photography' },
      { id: '3', name: 'Adobe Creative Suite' }
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
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className={`mt-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Loading CV...</p>
        </div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="p-6">
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400">
            You haven't created a CV yet. Click the button below to get started.
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Button
            onClick={() => onNavigate('cv-generator')}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Your CV
          </Button>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return <CVPreviewPage formData={mockCVData} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>My CV</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          View and manage your CV
        </p>
      </div>

      {/* Approval Status Alert */}
      {isApproved && (
        <Alert className="border-teal-500/50 bg-teal-500/10">
          <CheckCircle className="h-4 w-4 text-teal-400" />
          <AlertDescription className="text-teal-400">
            Congratulations! Your CV has been approved by the admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Feedback Alert */}
      {hasFeedback && (
        <Alert className={cvData.status === 'flagged' ? 'border-red-500/50 bg-red-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}>
          <AlertCircle className={`h-4 w-4 ${cvData.status === 'flagged' ? 'text-red-400' : 'text-yellow-400'}`} />
          <AlertDescription className={cvData.status === 'flagged' ? 'text-red-400' : 'text-yellow-400'}>
            {cvData.status === 'flagged' 
              ? 'Your CV has been flagged. Please review the feedback below and make necessary changes.'
              : 'Your CV requires changes. Please review the feedback below and update your CV accordingly.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Comments */}
      {adminComments && (
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                <MessageSquare className="h-5 w-5 text-teal-400" />
                Admin Feedback
              </CardTitle>
              {reviewedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  {reviewedAt}
                </div>
              )}
            </div>
            {reviewedBy && (
              <p className="text-sm text-gray-400 mt-1">Reviewed by: {reviewedBy}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border-l-4 ${
              cvData.status === 'flagged' 
                ? 'border-red-500 bg-red-500/10' 
                : cvData.status === 'approved'
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-yellow-500 bg-yellow-500/10'
            }`}>
              <p className={`whitespace-pre-wrap ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                {adminComments}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CV Actions */}
      <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <FileText className="h-8 w-8 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Your Professional CV</h3>
                  {getStatusBadge()}
                </div>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Last updated: {cvData.updated_at ? new Date(cvData.updated_at).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview CV
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('cv-generator')}
                className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit CV
              </Button>
              <Button
                onClick={handleDownloadCV}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV Sections Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardHeader>
            <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>CV Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Personal Details</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Education</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">1 Entry</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Experience</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">1 Entry</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Skills</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">3 Skills</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Projects</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">1 Project</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>References</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">1 Reference</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardHeader>
            <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Tips for a Great CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                ✓ Keep your summary concise and impactful
              </p>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                ✓ Use action verbs in your experience descriptions
              </p>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                ✓ List your most relevant skills first
              </p>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                ✓ Update your CV regularly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
