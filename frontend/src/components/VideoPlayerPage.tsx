import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Share2, Eye, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTheme } from './ThemeProvider';
import tutorialService from '../services/tutorialService';

interface VideoPlayerPageProps {
  video: any;
  initialProgress?: number;
  isInitiallyCompleted?: boolean;
  onBack: () => void;
}

export function VideoPlayerPage({ video, initialProgress = 0, isInitiallyCompleted = false, onBack }: VideoPlayerPageProps) {
  const { theme } = useTheme();
  const [isCompleted, setIsCompleted] = useState(isInitiallyCompleted);
  const [currentViews, setCurrentViews] = useState(video.views || 0);
  const [loading, setLoading] = useState(false);
  const hasCountedView = useRef(false);

  // --- 1. Track View Count (Once) ---
  useEffect(() => {
    if (video?.id && !hasCountedView.current) {
        const trackView = async () => {
            try {
                const response = await tutorialService.incrementViews(video.id);
                if (response && response.views) {
                    setCurrentViews(response.views);
                }
                hasCountedView.current = true;
            } catch (e) {
                console.error("Failed to track view", e);
            }
        };
        trackView();
    }
  }, [video]);

  // --- 2. Update Progress on Load (Start) ---
  useEffect(() => {
      if (video?.id && !isInitiallyCompleted && initialProgress === 0) {
          // Mark as started (5%)
          tutorialService.saveProgress({
              tutorial: video.id,
              progress_percentage: 5,
              completed: false
          }).catch(console.error);
      }
  }, [video]);

  // --- 3. Render Video Player ---
  const renderVideoPlayer = () => {
    const url = video?.videoUrl;

    if (!url) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400">
                <AlertCircle className="h-12 w-12 mb-2 text-red-500" />
                <p>No video URL provided.</p>
            </div>
        );
    }

    // YouTube Regex
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(youtubeRegex);

    if (ytMatch && ytMatch[1]) {
        const videoId = ytMatch[1];
        return (
            <iframe
                className="w-full h-full object-cover"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
            />
        );
    }
    
    // Direct File
    return (
        <video className="w-full h-full bg-black" controls autoPlay src={url}>
            Your browser does not support the video tag.
        </video>
    );
  };

  // --- 4. Mark Complete ---
  const handleMarkComplete = async () => {
      setLoading(true);
      try {
          const newStatus = !isCompleted;
          setIsCompleted(newStatus); // Toggle UI immediately
          
          await tutorialService.saveProgress({
              tutorial: video.id,
              progress_percentage: newStatus ? 100 : 50,
              completed: newStatus
          });
      } catch (e) {
          console.error("Failed to save completion", e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div>
        <Button 
            variant="ghost" 
            onClick={onBack}
            className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {renderVideoPlayer()}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {video.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <Badge variant="secondary" className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20">
                            {video.category}
                        </Badge>
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {video.duration}</span>
                        <span className="flex items-center text-teal-400 font-bold">
                            <Eye className="h-3 w-3 mr-1" /> {currentViews} views
                        </span>
                        <span>•</span>
                        <span>{video.level}</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => alert("Shared!")}>
                        <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button 
                        variant={isCompleted ? "default" : "outline"}
                        size="sm"
                        className={isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        onClick={handleMarkComplete}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {isCompleted ? "Completed" : "Mark Complete"}
                    </Button>
                </div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900/50'}`}>
                <h3 className={`font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Description</h3>
                <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    {video.description || "No description provided."}
                </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
            <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Up Next</h3>
            <div className={`p-4 rounded-lg border text-center py-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/30 border-gray-800'}`}>
                <p className="text-gray-500 text-sm">More tutorials coming soon.</p>
            </div>
        </div>
      </div>
    </div>
  );
}