import { useState } from 'react';
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
  HardDrive, 
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

interface Tutorial {
  id: string;
  title: string;
  category: string;
  views: number;
  dateAdded: string;
  status: 'active' | 'draft' | 'archived';
  source: string;
  linkedEquipment?: string[];
}

interface Equipment {
  id: string;
  name: string;
  category: string;
}

export function AdminTutorialManagement() {
  const { theme } = useTheme();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);

  // Upload form state
  const [sourceType, setSourceType] = useState<'local' | 'drive' | 'youtube'>('local');
  const [tutorialTitle, setTutorialTitle] = useState('');
  const [tutorialDescription, setTutorialDescription] = useState('');
  const [tutorialCategory, setTutorialCategory] = useState<'equipment' | 'general'>('general');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Mock data
  const [tutorials] = useState<Tutorial[]>([
    {
      id: '1',
      title: 'Advanced Lighting Techniques',
      category: 'Equipment',
      views: 342,
      dateAdded: '2025-11-10',
      status: 'active',
      source: 'youtube',
      linkedEquipment: ['Sony A7S III', 'LED Light Panel']
    },
    {
      id: '2',
      title: 'Audio Recording Basics',
      category: 'General',
      views: 278,
      dateAdded: '2025-11-08',
      status: 'active',
      source: 'drive'
    },
    {
      id: '3',
      title: 'Camera Operation Guide',
      category: 'Equipment',
      views: 456,
      dateAdded: '2025-11-05',
      status: 'active',
      source: 'local',
      linkedEquipment: ['Canon EOS R5']
    }
  ]);

  const availableEquipment: Equipment[] = [
    { id: '1', name: 'Sony A7S III', category: 'Camera' },
    { id: '2', name: 'Canon EOS R5', category: 'Camera' },
    { id: '3', name: 'LED Light Panel', category: 'Lighting' },
    { id: '4', name: 'Rode NTG4+ Microphone', category: 'Audio' },
  ];

  const handleUploadSubmit = () => {
    // Validate based on step
    if (uploadStep === 1) {
      if (sourceType === 'local' && !videoFile) {
        toast.error('Please select a video file');
        return;
      }
      if ((sourceType === 'drive' || sourceType === 'youtube') && !videoUrl) {
        toast.error('Please enter a video URL');
        return;
      }
      setUploadStep(2);
    } else if (uploadStep === 2) {
      if (!tutorialTitle || !tutorialDescription) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (tutorialCategory === 'equipment') {
        setUploadStep(3);
      } else {
        // Submit directly for general tutorials
        toast.success('Tutorial uploaded successfully!');
        resetUploadForm();
        setIsUploadDialogOpen(false);
      }
    } else if (uploadStep === 3) {
      toast.success('Tutorial uploaded with equipment links!');
      resetUploadForm();
      setIsUploadDialogOpen(false);
    }
  };

  const resetUploadForm = () => {
    setUploadStep(1);
    setSourceType('local');
    setTutorialTitle('');
    setTutorialDescription('');
    setTutorialCategory('general');
    setSelectedEquipment([]);
    setVideoFile(null);
    setVideoUrl('');
  };

  const toggleEquipmentSelection = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'drive':
        return <Link className="h-4 w-4" />;
      case 'local':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Tutorial Management</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage tutorial content and videos
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={() => setUploadStep(1)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
            <DialogHeader>
              <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                Upload New Tutorial - Step {uploadStep} of {tutorialCategory === 'equipment' && uploadStep >= 2 ? '3' : '2'}
              </DialogTitle>
              <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                {uploadStep === 1 && 'Select your tutorial source'}
                {uploadStep === 2 && 'Enter tutorial details'}
                {uploadStep === 3 && 'Link related equipment'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Step 1: Tutorial Source */}
              {uploadStep === 1 && (
                <div className="space-y-4">
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                    Choose Source Type
                  </Label>
                  <div className="grid gap-4">
                    <button
                      onClick={() => setSourceType('local')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        sourceType === 'local'
                          ? 'border-teal-500 bg-teal-500/10'
                          : theme === 'light'
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          sourceType === 'local' ? 'bg-teal-500/20' : theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                        }`}>
                          <HardDrive className={`h-6 w-6 ${sourceType === 'local' ? 'text-teal-400' : theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Upload Local Video File</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            Upload video from your computer
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSourceType('drive')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        sourceType === 'drive'
                          ? 'border-teal-500 bg-teal-500/10'
                          : theme === 'light'
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          sourceType === 'drive' ? 'bg-teal-500/20' : theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                        }`}>
                          <Link className={`h-6 w-6 ${sourceType === 'drive' ? 'text-teal-400' : theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Google Drive Link</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            Paste a shareable Google Drive link
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSourceType('youtube')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        sourceType === 'youtube'
                          ? 'border-teal-500 bg-teal-500/10'
                          : theme === 'light'
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          sourceType === 'youtube' ? 'bg-teal-500/20' : theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                        }`}>
                          <Youtube className={`h-6 w-6 ${sourceType === 'youtube' ? 'text-teal-400' : theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>YouTube Link</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            Paste a YouTube video URL
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* File/URL Input */}
                  <div className="pt-4">
                    {sourceType === 'local' ? (
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                          Select Video File
                        </Label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900'
                              : 'bg-gray-800 border-gray-700 text-white'
                          }`}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                          {sourceType === 'drive' ? 'Google Drive Link' : 'YouTube URL'}
                        </Label>
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder={sourceType === 'drive' ? 'https://drive.google.com/...' : 'https://youtube.com/...'}
                          className={`mt-2 ${
                            theme === 'light'
                              ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                              : 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Basic Details */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Tutorial Title *
                    </Label>
                    <Input
                      value={tutorialTitle}
                      onChange={(e) => setTutorialTitle(e.target.value)}
                      placeholder="Enter tutorial title"
                      className={`mt-2 ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                          : 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Description *
                    </Label>
                    <Textarea
                      value={tutorialDescription}
                      onChange={(e) => setTutorialDescription(e.target.value)}
                      placeholder="Enter tutorial description"
                      rows={4}
                      className={`mt-2 ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                          : 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                      }`}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Category *
                    </Label>
                    <Select value={tutorialCategory} onValueChange={(value: 'equipment' | 'general') => setTutorialCategory(value)}>
                      <SelectTrigger className={`mt-2 ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200 text-gray-900'
                          : 'bg-gray-800 border-gray-700 text-white'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                    <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-400'}`}>
                      All tutorials appear under "All Tutorials" for students.
                      {tutorialCategory === 'equipment' && ' You\'ll be able to link equipment in the next step.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Equipment Link (only if category is equipment) */}
              {uploadStep === 3 && tutorialCategory === 'equipment' && (
                <div className="space-y-4">
                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Link Related Equipment
                    </Label>
                    <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Students will see links to these equipment items when viewing this tutorial
                    </p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableEquipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className={`p-4 rounded-lg border cursor-pointer ${
                          selectedEquipment.includes(equipment.id)
                            ? 'border-teal-500 bg-teal-500/10'
                            : theme === 'light'
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => toggleEquipmentSelection(equipment.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEquipment.includes(equipment.id)}
                            onCheckedChange={() => toggleEquipmentSelection(equipment.id)}
                          />
                          <div className="flex-1">
                            <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{equipment.name}</p>
                            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                              {equipment.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-gray-800/50 border border-gray-700'}`}>
                    <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Selected: {selectedEquipment.length} equipment item(s)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div className="flex justify-between pt-4">
              {uploadStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setUploadStep((prev) => (prev - 1) as 1 | 2 | 3)}
                  className={theme === 'light' ? 'border-gray-200 text-gray-900' : 'border-gray-700 text-white'}
                >
                  Back
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetUploadForm();
                    setIsUploadDialogOpen(false);
                  }}
                  className={theme === 'light' ? 'border-gray-200 text-gray-900' : 'border-gray-700 text-white'}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadSubmit}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  {uploadStep === 3 || (uploadStep === 2 && tutorialCategory === 'general') ? 'Upload' : 'Next'}
                  {uploadStep < 3 && tutorialCategory === 'equipment' && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tutorials Table */}
      <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
        <CardHeader>
          <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>All Tutorials</CardTitle>
          <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage and organize tutorial content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Tutorial</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Source</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Views</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Date Added</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutorials.map((tutorial) => (
                <TableRow key={tutorial.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                  <TableCell>
                    <div>
                      <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{tutorial.title}</p>
                      {tutorial.linkedEquipment && tutorial.linkedEquipment.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {tutorial.linkedEquipment.map((eq, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs ${theme === 'light' ? 'border-gray-300 text-gray-600' : 'border-gray-700 text-gray-400'}`}>
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tutorial.category === 'Equipment' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'}>
                      {tutorial.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSourceIcon(tutorial.source)}
                      <span className={`text-sm capitalize ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {tutorial.source}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                    {tutorial.views}
                  </TableCell>
                  <TableCell className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    {tutorial.dateAdded}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tutorial.status)}>
                      {tutorial.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
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
