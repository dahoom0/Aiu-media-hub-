import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { useTheme } from './ThemeProvider';
import { Upload, Link, Youtube, Edit, Trash2, FileDown } from 'lucide-react';
import { toast } from 'sonner';

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
  id: number | string;
  name?: string;
  category?: any;
  type?: string;
  title?: string;
}

interface Category {
  id: number | string;
  name?: string;
  title?: string;
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

const unwrapList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const getCategoryLabel = (c: any) => c?.name || c?.title || `Category #${c?.id ?? ''}`;
const getEquipmentLabel = (e: any) => e?.name || e?.title || `Equipment #${e?.id ?? ''}`;

const getEquipmentBadge = (e: any) => {
  if (typeof e?.type === 'string' && e.type.trim()) return e.type;
  const cat = e?.category;
  if (typeof cat === 'string' && cat.trim()) return cat;
  if (typeof cat === 'number') return `Category ${cat}`;
  if (typeof cat === 'object' && cat) return cat?.name || cat?.title || (cat?.id ? `Category ${cat.id}` : 'Equipment');
  return 'Equipment';
};

const levelToUi = (v: any): 'Beginner' | 'Intermediate' | 'Advanced' => {
  const s = String(v || '').trim();
  const low = s.toLowerCase();
  if (low === 'beginner') return 'Beginner';
  if (low === 'intermediate') return 'Intermediate';
  if (low === 'advanced') return 'Advanced';
  if (s === 'Beginner' || s === 'Intermediate' || s === 'Advanced') return s as any;
  return 'Beginner';
};

const extractCategoryId = (t: any): string => {
  const c = t?.category;
  if (typeof c === 'number' || typeof c === 'string') return String(c);
  if (typeof c === 'object' && c?.id !== undefined && c?.id !== null) return String(c.id);
  if (t?.category_id !== undefined && t?.category_id !== null) return String(t.category_id);
  return '';
};

const extractEquipmentIds = (t: any): string[] => {
  const raw =
    t?.equipment_ids ||
    t?.equipments ||
    t?.equipment ||
    t?.related_equipments ||
    t?.related_equipment_ids ||
    t?.linked_equipments;

  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => {
        if (typeof x === 'number' || typeof x === 'string') return String(x);
        if (typeof x === 'object' && x?.id !== undefined && x?.id !== null) return String(x.id);
        return null;
      })
      .filter(Boolean) as string[];
  }

  return [];
};

export function AdminTutorialManagement() {
  const { theme } = useTheme();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);

  const [editingTutorialId, setEditingTutorialId] = useState<string | number | null>(null);

  const [sourceType, setSourceType] = useState<'drive' | 'youtube'>('youtube');
  const [tutorialTitle, setTutorialTitle] = useState('');
  const [tutorialDescription, setTutorialDescription] = useState('');

  const [tutorialCategoryId, setTutorialCategoryId] = useState<string>('');
  const [tutorialDuration, setTutorialDuration] = useState<string>('0');
  const [tutorialLevel, setTutorialLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [tutorials, setTutorials] = useState<TutorialRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingWizardData, setLoadingWizardData] = useState(false);
  const [isExporting, setIsExporting] = useState<string | number | null>(null);

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const res = await tutorialAdminService.list();
      const list = unwrapList(res);

      const mapped: TutorialRow[] = list.map((t: any) => ({
        id: t.id,
        title: t.title || 'Untitled',
        category: t.category_name || t.category_display || t.category || 'General',
        views: Number(t.views) || 0,
        dateAdded: safeDate(t.created_at || t.date_added || t.createdAt),
        status: t.is_active ? 'active' : 'draft',
        source: t.video_url?.includes('youtube') ? 'youtube' : 'link',
        linkedEquipment: t.related_equipment_names || t.linked_equipment_names || [],
      }));

      setTutorials(mapped);
    } catch (e: any) {
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const loadWizardData = async () => {
    setLoadingWizardData(true);
    try {
      const [cats, eqs] = await Promise.all([
        tutorialAdminService.listCategories(),
        tutorialAdminService.listEquipments(),
      ]);

      setCategories(cats);
      setEquipments(eqs);

      if (!tutorialCategoryId && cats?.length) {
        setTutorialCategoryId(String(cats[0].id));
      }
    } catch (err) {
      console.error('Failed to load categories/equipments:', err);
      toast.error('Failed to load categories/equipment from backend');
    } finally {
      setLoadingWizardData(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  useEffect(() => {
    if (isUploadDialogOpen) {
      loadWizardData();
    }
  }, [isUploadDialogOpen]);

  const resetUploadForm = () => {
    setEditingTutorialId(null);
    setUploadStep(1);
    setSourceType('youtube');
    setTutorialTitle('');
    setTutorialDescription('');
    setTutorialCategoryId(categories?.[0]?.id ? String(categories[0].id) : '');
    setTutorialDuration('0');
    setTutorialLevel('Beginner');
    setSelectedEquipment([]);
    setVideoUrl('');
    setThumbnailFile(null);
  };

  const handleEdit = async (id: string | number) => {
    try {
      setLoading(true);
      setEditingTutorialId(id);
      setIsUploadDialogOpen(true);
      setUploadStep(2);

      await loadWizardData();
      const detail = await tutorialAdminService.getById(id);

      setTutorialTitle(detail?.title || '');
      setTutorialDescription(detail?.description || '');
      setVideoUrl(detail?.video_url || '');

      const cid = extractCategoryId(detail);
      if (cid) setTutorialCategoryId(cid);

      const dur = detail?.duration;
      setTutorialDuration(
        dur === null || dur === undefined || dur === '' ? '0' : String(Number(dur))
      );

      setTutorialLevel(levelToUi(detail?.level));
      setSelectedEquipment(extractEquipmentIds(detail));
      setThumbnailFile(null);
    } catch (e: any) {
      toast.error('Failed to load tutorial for editing');
      setEditingTutorialId(null);
      setIsUploadDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NEW: Handle CSV Export
   */
  const handleExport = async (id: string | number) => {
    try {
      setIsExporting(id);
      toast.info('Generating completions report...');
      await tutorialAdminService.exportCompletedStudents(id);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export student list');
    } finally {
      setIsExporting(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (uploadStep === 1) {
      if (!videoUrl) {
        toast.error('Please enter a video URL');
        return;
      }
      setUploadStep(2);
      return;
    }

    if (uploadStep === 2) {
      if (!tutorialTitle || !tutorialDescription) {
        toast.error('Title and Description are required');
        return;
      }
      if (!tutorialCategoryId) {
        toast.error('Please select a category');
        return;
      }
      const dur = Number(tutorialDuration);
      if (!Number.isFinite(dur) || dur <= 0) {
        toast.error('Please enter a valid duration (minutes)');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        title: tutorialTitle,
        description: tutorialDescription,
        categoryId: tutorialCategoryId,
        videoUrl: videoUrl,
        duration: tutorialDuration,
        level: tutorialLevel,
        thumbnail: thumbnailFile,
        equipmentIds: selectedEquipment.map((id) => Number(id)).filter((n) => Number.isFinite(n)),
        is_active: true,
      };

      if (editingTutorialId !== null && editingTutorialId !== undefined) {
        await tutorialAdminService.update(editingTutorialId, payload);
        toast.success('Tutorial updated successfully!');
      } else {
        await tutorialAdminService.create(payload);
        toast.success('Tutorial published successfully!');
      }

      resetUploadForm();
      setIsUploadDialogOpen(false);
      await loadTutorials();
    } catch (e: any) {
      const data = e?.response?.data;
      toast.error(data ? JSON.stringify(data) : (e.message || 'Failed to submit tutorial'));
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
          <h1 className={theme === 'light' ? 'text-2xl font-bold text-gray-900' : 'text-2xl font-bold text-white'}>
            Tutorial Management
          </h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Create and manage external video tutorials
          </p>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white" onClick={resetUploadForm}>
              <Upload className="h-4 w-4 mr-2" /> Publish Tutorial
            </Button>
          </DialogTrigger>

          <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
            <DialogHeader>
              <DialogTitle>
                Step {uploadStep}: {uploadStep === 1 ? 'Source' : uploadStep === 2 ? 'Details' : 'Link Equipment'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
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
                      <Select
                        value={tutorialCategoryId}
                        onValueChange={(v: any) => setTutorialCategoryId(v)}
                        disabled={loadingWizardData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingWizardData ? 'Loading...' : 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c: any) => (
                            <SelectItem key={String(c.id)} value={String(c.id)}>
                              {getCategoryLabel(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Thumbnail (Optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={tutorialDuration}
                        onChange={(e) => setTutorialDuration(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={tutorialLevel} onValueChange={(v: any) => setTutorialLevel(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 3 && (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  <Label>Select Related Equipment</Label>
                  {loadingWizardData ? (
                    <div className="text-sm opacity-70">Loading equipments...</div>
                  ) : (
                    equipments.map((eq: any) => (
                      <div key={String(eq.id)} className="flex items-center space-x-3 p-2 border rounded-md mb-2">
                        <Checkbox
                          checked={selectedEquipment.includes(String(eq.id))}
                          onCheckedChange={() => {
                            setSelectedEquipment((prev) =>
                              prev.includes(String(eq.id))
                                ? prev.filter((i) => i !== String(eq.id))
                                : [...prev, String(eq.id)]
                            );
                          }}
                        />
                        <span>
                          {getEquipmentLabel(eq)}{' '}
                          <Badge variant="secondary" className="ml-2">
                            {getEquipmentBadge(eq)}
                          </Badge>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              {uploadStep > 1 && (
                <Button variant="ghost" onClick={() => setUploadStep((prev) => (prev - 1) as any)}>
                  Back
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadSubmit} disabled={loading}>
                  {uploadStep === 1 ? 'Next' : 'Publish'}
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
                <TableRow key={String(t.id)}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.category}</Badge>
                  </TableCell>
                  <TableCell>{t.views}</TableCell>
                  <TableCell>{t.dateAdded}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* ✅ Export completions button */}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-blue-500 hover:text-blue-600" 
                        title="Export Student Completions"
                        onClick={() => handleExport(t.id)}
                        disabled={isExporting === t.id}
                      >
                        <FileDown className={`h-4 w-4 ${isExporting === t.id ? 'animate-pulse' : ''}`} />
                      </Button>

                      <Button size="icon" variant="ghost" onClick={() => handleEdit(t.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {tutorials.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center opacity-70">
                    No tutorials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}