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
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

interface StudentCVListItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastUpdated: string;
  status: 'approved' | 'needs-changes' | 'flagged' | 'pending';
}

interface StudentCVDetail extends StudentCVListItem {
  // You can keep extra fields later if needed. For PDF preview, we mainly need id + student info.
}

const normalizeList = (respData: any) => {
  const data = respData?.results ?? respData;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
};

const toDateString = (val: any) => {
  if (!val) return '';
  const s = String(val);
  if (s.includes('T')) return s.split('T')[0];
  return s;
};

const safeStr = (v: any) => (v === null || v === undefined ? '' : String(v));

const mapCvListItem = (raw: any): StudentCVListItem => {
  const studentObj = raw?.student || raw?.user || raw?.owner || raw?.student_user || null;
  const studentProfile = raw?.student_profile || studentObj?.student_profile || raw?.profile || null;
  const studentUser = studentObj?.user || studentObj || raw?.user || null;

  const studentId =
    safeStr(studentProfile?.student_id) ||
    safeStr(studentObj?.student_id) ||
    safeStr(raw?.student_id) ||
    safeStr(raw?.studentId) ||
    safeStr(raw?.student) ||
    '';

  const studentName =
    safeStr(raw?.full_name) ||
    safeStr(raw?.student_name) ||
    safeStr(studentUser?.full_name) ||
    `${safeStr(studentUser?.first_name)} ${safeStr(studentUser?.last_name)}`.trim() ||
    safeStr(studentUser?.username) ||
    'Student';

  const studentEmail =
    safeStr(raw?.email) ||
    safeStr(raw?.student_email) ||
    safeStr(studentUser?.email) ||
    '';

  const lastUpdated =
    toDateString(raw?.updated_at) ||
    toDateString(raw?.modified) ||
    toDateString(raw?.last_updated) ||
    toDateString(raw?.created_at) ||
    '';

  const statusRaw = (raw?.status || raw?.review_status || raw?.approval_status || 'pending') as any;
  const status: StudentCVListItem['status'] =
    statusRaw === 'approved' ||
    statusRaw === 'needs-changes' ||
    statusRaw === 'flagged' ||
    statusRaw === 'pending'
      ? statusRaw
      : 'pending';

  return {
    id: safeStr(raw?.id),
    studentId,
    studentName,
    studentEmail,
    lastUpdated,
    status,
  };
};

const extractFilenameFromContentDisposition = (headerValue?: string | null) => {
  if (!headerValue) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^;"\n]+)"?/i.exec(headerValue);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
};

// A4 mm sizes for true paper ratio preview
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function AdminCVReview({
  onNavigate,
  initialStudentId,
}: {
  onNavigate?: (page: string, params?: any) => void;
  initialStudentId?: string;
}) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list');

  const [studentCVs, setStudentCVs] = useState<StudentCVListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedCV, setSelectedCV] = useState<StudentCVDetail | null>(null);
  const [adminComment, setAdminComment] = useState('');

  // PDF Preview state
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');

  const revokePdfUrl = (url?: string) => {
    if (!url) return;
    try {
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const fetchCvList = async () => {
    try {
      setLoadingList(true);
      const res = await apiClient.get('/cvs/');
      const list = normalizeList(res.data).map(mapCvListItem);
      setStudentCVs(list);
    } catch (e) {
      console.error('Failed to load CV list', e);
      toast.error('Failed to load student CVs.');
    } finally {
      setLoadingList(false);
    }
  };

  const loadPdfPreview = async (cvId: string) => {
    setPdfLoading(true);
    setPdfError('');

    setPdfUrl((old) => {
      revokePdfUrl(old);
      return '';
    });

    try {
      const res = await apiClient.get(`/cvs/${cvId}/download-pdf/`, {
        responseType: 'blob',
      });

      const contentType = (res?.headers?.['content-type'] as string) || 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
    } catch (e) {
      console.error('Failed to load PDF preview', e);
      setPdfError('Failed to load PDF preview.');
      setPdfUrl('');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleViewCV = async (cv: StudentCVListItem) => {
    try {
      // load minimal detail (for display)
      const res = await apiClient.get(`/cvs/${cv.id}/`);
      const detail = mapCvListItem(res.data);
      setSelectedCV(detail);
      setViewMode('review');

      // load pdf preview
      await loadPdfPreview(detail.id);
    } catch (e) {
      console.error('Failed to open CV', e);
      toast.error('Failed to open CV. Please try again.');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCV(null);
    setAdminComment('');

    setPdfUrl((old) => {
      revokePdfUrl(old);
      return '';
    });
    setPdfError('');
    setPdfLoading(false);
  };

  const handleFlagCV = () => {
    toast.success('CV flagged for review');
  };

  const handleDownloadCV = async () => {
    if (!selectedCV) return;

    try {
      const res = await apiClient.get(`/cvs/${selectedCV.id}/download-pdf/`, {
        responseType: 'blob',
      });

      const contentType = (res?.headers?.['content-type'] as string) || 'application/pdf';
      const cd = (res?.headers?.['content-disposition'] as string) || '';
      const serverFilename = extractFilenameFromContentDisposition(cd);

      const safeName = (selectedCV.studentName || 'cv').trim().replace(/\s+/g, '_');
      const filename = serverFilename || `${safeName}.pdf`;

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      toast.success('CV downloaded successfully');
    } catch (e) {
      console.error('CV download failed', e);
      toast.error('Failed to download CV. Please try again.');
    }
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

  // Initial load
  useEffect(() => {
    fetchCvList();
    return () => {
      // cleanup pdf url on unmount
      setPdfUrl((old) => {
        revokePdfUrl(old);
        return '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open CV if initialStudentId provided
  useEffect(() => {
    if (!initialStudentId || !studentCVs.length) return;

    const match = studentCVs.find(
      (c) => c.studentId === initialStudentId || c.id === initialStudentId
    );

    if (match) {
      handleViewCV(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStudentId, studentCVs]);

  // REVIEW MODE: PDF reader style preview
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
              <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                {selectedCV.studentName}&apos;s CV
              </h1>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                PDF preview (A4)
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
              variant="outline"
              onClick={() => loadPdfPreview(selectedCV.id)}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh Preview
                </>
              )}
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

        {/* PDF Preview Area */}
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-6">
            {/* status badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  Student ID: {selectedCV.studentId || `CV #${selectedCV.id}`}
                </span>
                <span className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                  {selectedCV.studentEmail ? ` • ${selectedCV.studentEmail}` : ''}
                </span>
              </div>

              <Badge className={getStatusColor(selectedCV.status)}>
                {selectedCV.status === 'needs-changes' ? 'Needs Changes' : selectedCV.status}
              </Badge>
            </div>

            {pdfError && (
              <div className="mb-4 text-sm text-red-600">
                {pdfError}
              </div>
            )}

            {/* Paper viewport */}
            <div className="w-full flex justify-center">
              <div className="w-full overflow-auto">
                {/* A4 paper wrapper */}
                <div
                  className="mx-auto bg-white shadow-md border border-gray-200"
                  style={{
                    width: `${A4_WIDTH_MM}mm`,
                    minHeight: `${A4_HEIGHT_MM}mm`,
                  }}
                >
                  {pdfUrl ? (
                    <iframe
                      title="CV PDF Preview"
                      src={pdfUrl}
                      className="w-full"
                      style={{
                        height: `${A4_HEIGHT_MM}mm`,
                        border: 'none',
                      }}
                    />
                  ) : (
                    <div className="p-6 flex items-center justify-center text-sm text-gray-600">
                      {pdfLoading ? 'Loading PDF…' : 'PDF preview not available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              className={
                theme === 'light'
                  ? 'bg-gray-50 border-gray-200 text-gray-900'
                  : 'bg-gray-800 border-gray-700 text-white'
              }
            />
            <Button
              onClick={handleSaveComment}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Save &amp; Send Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LIST MODE (unchanged layout)
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student CVs</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Review and manage student CV submissions
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchCvList}
          className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
          disabled={loadingList}
        >
          {loadingList ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
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
          {loadingList ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                Loading student CVs...
              </span>
            </div>
          ) : (
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
                {studentCVs.length === 0 ? (
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableCell colSpan={5} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      No CVs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  studentCVs.map((cv) => (
                    <TableRow key={cv.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell>
                        <button onClick={() => handleViewCV(cv)} className="text-left hover:underline">
                          <p className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} hover:text-teal-400 transition-colors`}>
                            {cv.studentName}
                          </p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {cv.studentId || `CV #${cv.id}`}
                          </p>
                        </button>
                      </TableCell>

                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {cv.studentEmail}
                      </TableCell>

                      <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        {cv.lastUpdated || '-'}
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
