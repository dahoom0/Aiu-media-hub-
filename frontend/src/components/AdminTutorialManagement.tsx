import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { useTheme } from './ThemeProvider';
import {
  Video,
  Upload,
  Link,
  Youtube,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Import the admin-specific service
import tutorialAdminService from '../services/tutorialAdminService';

interface TutorialRow {
  id: string | number;
  title: string;
  category: string;
  views: number;
  dateAdded: string;
  status: 'active' | 'draft' | 'archived' | string;
  source: string; 
  linkedEquipment?: string[];
}

interface Equipment {
  id: string;
  name: string;
  category: string;
}

const safeDate = (v: any) => {
  if (!v) return '';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v);
  }
};

export function AdminTutorialManagement() {
  const { theme } = useTheme();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);

  // Upload form state
  const [sourceType, setSourceType] = useState<'drive' | 'youtube'>('youtube');
  const [tutorialTitle, setTutorialTitle] = useState('');
  const [tutorialDescription, setTutorialDescription] = useState('');
  const [tutorialCategory, setTutorialCategory] = useState<'equipment' | 'general'>('general');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Backend data
  const [tutorials, setTutorials] = useState<TutorialRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock equipment (Update this to fetch from your equipment service later)
  const availableEquipment: Equipment[] = [
    { id: '1', name: 'Sony A7S III', category: 'Camera' },
    { id: '2', name: 'Canon EOS R5', category: 'Camera' },
    { id: '3', name: 'LED Light Panel', category: 'Lighting' },
    { id: '4', name: 'Rode NTG4+ Microphone', category: 'Audio' },
  ];

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const list = await tutorialAdminService.list();
      const mapped: TutorialRow[] = list.map((t: any) => ({
        id: t.id,
        title: t.title || 'Untitled',
        category: t.category_display || t.category || 'General',
        views: Number(t.views) || 0,
        dateAdded: safeDate(t.created_at || t.date_added),
        status: t.is_active ? 'active' : 'draft',
        source: t.video_url?.includes('youtube') ? 'youtube' : 'link',
        linkedEquipment: t.related_equipment_names || [],
      }));
      setTutorials(mapped);
    } catch (e: any) {
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  const resetUploadForm = () => {
    setUploadStep(1);
    setSourceType('youtube');
    setTutorialTitle('');
    setTutorialDescription('');
    setTutorialCategory('general');
    setSelectedEquipment([]);
    setVideoUrl('');
    setThumbnailFile(null);
  };

  const handleUploadSubmit = async () => {
    // Step 1 Validation: URL
    if (uploadStep === 1) {
      if (!videoUrl) {
        toast.error('Please enter a video URL');
        return;
      }
      setUploadStep(2);
      return;
    }

    // Step 2 Validation: Details
    if (uploadStep === 2) {
      if (!tutorialTitle || !tutorialDescription) {
        toast.error('Title and Description are required');
        return;
      }
      if (tutorialCategory === 'equipment') {
        setUploadStep(3);
        return;
      }
    }

    // Final Submission (either from Step 2 for general or Step 3 for equipment)
    try {
      setLoading(true);
      
      const payload = {
        title: tutorialTitle,
        description: tutorialDescription,
        category: tutorialCategory, // Ensure this matches your backend Category IDs/Slugs
        videoUrl: videoUrl,
        thumbnail: thumbnailFile,
        linkedEquipmentIds: selectedEquipment,
        is_active: true,
        duration: 0, // Could add a field for this in Step 2
      };

      await tutorialAdminService.create(payload);
      toast.success('Tutorial published successfully!');
      resetUploadForm();
      setIsUploadDialogOpen(false);
      await loadTutorials();
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload tutorial');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) return;
    try {
      setLoading(true);
      await tutorialAdminService.remove(id);
      toast.success('Tutorial deleted');
      await loadTutorials();
    } catch (e: any) {
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={theme === 'light' ? 'text-2xl font-bold text-gray-900' : 'text-2xl font-bold text-white'}>Tutorial Management</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Create and manage external video tutorials</p>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white" onClick={resetUploadForm}>
              <Upload className="h-4 w-4 mr-2" /> Publish Tutorial
            </Button>
          </DialogTrigger>

          <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
            <DialogHeader>
              <DialogTitle>Step {uploadStep}: {uploadStep === 1 ? 'Source' : uploadStep === 2 ? 'Details' : 'Link Equipment'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Step 1: Source */}
              {uploadStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant={sourceType === 'youtube' ? 'default' : 'outline'}
                      onClick={() => setSourceType('youtube')}
                      className="h-20 flex flex-col gap-2"
                    >
                      <Youtube className="h-6 w-6" /> YouTube
                    </Button>
                    <Button 
                      variant={sourceType === 'drive' ? 'default' : 'outline'}
                      onClick={() => setSourceType('drive')}
                      className="h-20 flex flex-col gap-2"
                    >
                      <Link className="h-6 w-6" /> External Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input 
                      placeholder="https://..." 
                      value={videoUrl} 
                      onChange={(e) => setVideoUrl(e.target.value)} 
                      className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={tutorialTitle} onChange={(e) => setTutorialTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={tutorialDescription} onChange={(e) => setTutorialDescription(e.target.value)} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={tutorialCategory} onValueChange={(v: any) => setTutorialCategory(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="equipment">Equipment Specific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Thumbnail (Optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Equipment Link */}
              {uploadStep === 3 && (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  <Label>Select Related Equipment</Label>
                  {availableEquipment.map((eq) => (
                    <div key={eq.id} className="flex items-center space-x-3 p-2 border rounded-md mb-2">
                      <Checkbox 
                        checked={selectedEquipment.includes(eq.id)} 
                        onCheckedChange={() => {
                          setSelectedEquipment(prev => prev.includes(eq.id) ? prev.filter(i => i !== eq.id) : [...prev, eq.id])
                        }} 
                      />
                      <span>{eq.name} <Badge variant="secondary" className="ml-2">{eq.category}</Badge></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              {uploadStep > 1 && <Button variant="ghost" onClick={() => setUploadStep(prev => (prev - 1) as any)}>Back</Button>}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUploadSubmit} disabled={loading}>
                  {uploadStep === 3 || (uploadStep === 2 && tutorialCategory === 'general') ? 'Publish' : 'Next'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className={theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : ''}>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutorial</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutorials.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                  <TableCell>{t.views}</TableCell>
                  <TableCell>{t.dateAdded}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
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