import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from './ThemeProvider';
import { CVPreviewPage } from './CVPreviewPage';
import { 
  Download,
  Edit,
  AlertCircle,
  FileText,
  ArrowLeft
} from 'lucide-react';

interface StudentCVViewProps {
  onNavigate: (page: string) => void;
}

export function StudentCVView({ onNavigate }: StudentCVViewProps) {
  const { theme } = useTheme();
  const [showPreview, setShowPreview] = useState(false);

  // Mock CV data - in a real app, this would come from API/state
  const hasFlaggedCV = true; // Example: admin has flagged this CV
  const adminComments = "Great work! Please update the experience section with more details about your role in the documentary project. Also, consider adding more specific skills related to video editing software.";

  const mockCVData = {
    personal: {
      fullName: 'John Smith',
      title: 'Media Production Student',
      summary: 'Passionate media and communication student with experience in video production and content creation.'
    },
    contact: {
      email: 'john@aiu.edu.my',
      phone: '+60 12-345 6789',
      location: 'Alor Setar, Kedah',
      linkedin: 'linkedin.com/in/johnsmith',
      website: 'johnsmith.com'
    },
    education: [
      {
        id: '1',
        degree: 'Bachelor of Media & Communication',
        institution: 'Albukhary International University',
        startDate: '2022',
        endDate: '2026',
        description: 'Focus on video production and digital media'
      }
    ],
    experience: [
      {
        id: '1',
        position: 'Video Production Intern',
        company: 'MediaCorp Malaysia',
        startDate: '2024-06',
        endDate: '2024-08',
        description: 'Assisted in video production and post-production tasks'
      }
    ],
    projects: [
      {
        id: '1',
        name: 'Documentary: Campus Life',
        description: 'A 15-minute documentary exploring student life at AIU',
        url: ''
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'Adobe Certified Professional',
        issuer: 'Adobe',
        year: '2024'
      }
    ],
    languages: [
      {
        id: '1',
        name: 'English',
        proficiency: 'Fluent'
      },
      {
        id: '2',
        name: 'Malay',
        proficiency: 'Native'
      }
    ],
    awards: [
      {
        id: '1',
        title: 'Best Documentary Award',
        issuer: 'AIU Media Festival',
        year: '2024',
        description: 'Won first place in documentary category'
      }
    ],
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

  const handleDownloadCV = () => {
    // In a real app, this would generate and download a PDF
    console.log('Downloading CV...');
  };

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

      {/* Flagged Alert */}
      {hasFlaggedCV && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400">
            Your CV requires changes. Please review the feedback below and update your CV accordingly.
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Comments */}
      {hasFlaggedCV && adminComments && (
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardHeader>
            <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Admin Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>{adminComments}</p>
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
                <h3 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Your Professional CV</h3>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Last updated: November 20, 2025
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
