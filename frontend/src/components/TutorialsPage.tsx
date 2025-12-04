import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Play, Eye, Filter, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { VideoPlayerPage } from './VideoPlayerPage';
import { useTheme } from './ThemeProvider';
import tutorialService from '../services/tutorialService';

interface TutorialsPageProps {
  onNavigate?: (page: string) => void;
}

export function TutorialsPage({ onNavigate }: TutorialsPageProps) {
  const { theme } = useTheme();
  
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Real Data State
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, any>>({}); // Map ID -> Progress Object
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Tutorials and Progress in parallel
        const [tData, pData] = await Promise.all([
          tutorialService.getAll(),
          tutorialService.getProgress()
        ]);

        const tList = tData.results || tData;
        const pList = pData.results || pData;

        // 1. Create a quick lookup map for progress: { tutorial_id: { percentage, completed } }
        const pMap: Record<number, any> = {};
        pList.forEach((p: any) => {
            pMap[p.tutorial] = {
                percentage: p.progress_percentage,
                completed: p.completed
            };
        });
        setProgressMap(pMap);

        // 2. Map Backend Data to UI
        const mappedTutorials = tList.map((t: any) => ({
            id: t.id,
            title: t.title,
            // Assuming category is an object or ID. If ID, we default to 'General'
            // Ideally backend serializer sends 'category_name'
            category: (t.category_name || 'general').toLowerCase(), 
            duration: t.duration ? `${t.duration}:00` : '10:00',
            views: t.views || 0,
            thumbnail: t.thumbnail,
            description: t.description,
            level: t.level || 'Beginner',
            videoUrl: t.video_url
        }));

        setTutorials(mappedTutorials);
      } catch (error) {
        console.error("Failed to load tutorials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- RENDER VIDEO PLAYER ---
  if (selectedVideo) {
    return (
        <VideoPlayerPage 
            video={selectedVideo} 
            initialProgress={progressMap[selectedVideo.id]?.percentage || 0}
            isInitiallyCompleted={progressMap[selectedVideo.id]?.completed || false}
            onBack={() => {
                setSelectedVideo(null);
                // Optional: Re-fetch progress here to update the card immediately after watching
                window.location.reload(); // Simple way to refresh state, or move fetchData outside useEffect
            }} 
        />
    );
  }

  // Categories Setup
  const categories = [
    { id: 'all', label: 'All Tutorials', count: tutorials.length },
    { id: 'equipment', label: 'Equipment', count: tutorials.filter(t => ['camera', 'audio', 'lighting', 'equipment'].some(c => t.category.includes(c))).length },
    { id: 'general', label: 'General', count: tutorials.filter(t => t.category.includes('general') || t.category.includes('editing')).length },
  ];

  // Filtering Logic
  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = selectedCategory === 'all';
    if (!matchesCategory) {
        if (selectedCategory === 'equipment') {
            matchesCategory = ['camera', 'audio', 'lighting', 'equipment'].some(c => tutorial.category.includes(c));
        } else {
            matchesCategory = tutorial.category.includes(selectedCategory);
        }
    }
    
    return matchesSearch && matchesCategory;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900 mb-2' : 'text-white mb-2'}>Video Tutorials</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          Learn how to use professional media equipment with our comprehensive guides
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500'
                : 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500'
            }`}
          />
        </div>
        <Button
          variant="outline"
          className={theme === 'light' 
            ? 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50' 
            : 'border-gray-700 bg-gray-900 text-white hover:bg-gray-800'
          }
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className={`border w-full justify-start overflow-x-auto ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-900/50 border-gray-800'
        }`}>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              {category.label}
              <Badge className={`ml-2 text-xs ${
                theme === 'light' ? 'bg-gray-100 text-gray-700' : 'bg-gray-800 text-gray-300'
              }`}>
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Tutorial Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutorials.map((tutorial) => {
              const progress = progressMap[tutorial.id]?.percentage || 0;
              const completed = progressMap[tutorial.id]?.completed;

              return (
                <Card
                  key={tutorial.id}
                  className={`hover:border-teal-500/50 transition-all cursor-pointer group ${
                    theme === 'light' 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-900/50 border-gray-800'
                  }`}
                  onClick={() => setSelectedVideo(tutorial)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      {tutorial.thumbnail ? (
                          <ImageWithFallback
                              src={tutorial.thumbnail}
                              alt={tutorial.title}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                              <Play className="h-12 w-12 opacity-50" />
                          </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[rgba(0,0,0,0)]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/90">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-xs text-white">
                        {tutorial.duration}
                      </div>
                      {completed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className={`mb-1 line-clamp-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{tutorial.title}</h4>
                        <p className={`text-sm line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {tutorial.description}
                        </p>
                      </div>

                      {/* Progress Bar (Visible if started) */}
                      {progress > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5 bg-gray-800" indicatorClassName="bg-teal-500" />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                          <Badge className={`text-xs ${getLevelColor(tutorial.level)}`}>
                              {tutorial.level}
                          </Badge>
                          <div className={`flex items-center gap-1 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                              <Eye className="h-4 w-4" />
                              <span>{tutorial.views}</span>
                          </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No tutorials found matching your criteria</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}