import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Eye,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
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

export function VideoPlayerPage({
  video,
  initialProgress = 0,
  isInitiallyCompleted = false,
  onBack,
}: VideoPlayerPageProps) {
  const { theme } = useTheme();

  const [isCompleted, setIsCompleted] = useState(isInitiallyCompleted);
  const [currentViews, setCurrentViews] = useState<number>(video.views || 0);
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState<number>(initialProgress);
  const [progressId, setProgressId] = useState<number | null>(
    (video as any).progressId ?? null,
  );

  const hasCountedView = useRef(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef(initialProgress || 0);

  // --- Helper: Save Progress (create or update) ---
  const saveProgress = async (percentage: number, completedFlag?: boolean) => {
    try {
      const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));

      let res;
      if (progressId) {
        // Update existing progress row
        res = await tutorialService.saveProgress({
          id: progressId,
          progress_percentage: safePercentage,
          completed: completedFlag ?? false,
        });
      } else {
        // Create new progress row
        res = await tutorialService.saveProgress({
          tutorial: video.id,
          progress_percentage: safePercentage,
          completed: completedFlag ?? false,
        });
        if (res && res.id) {
          setProgressId(res.id);
        }
      }
      return res;
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  };

  // --- 1. Increment Views Once (backend + frontend) ---
  useEffect(() => {
    if (video?.id && !hasCountedView.current) {
      const trackView = async () => {
        try {
          // Calls POST /tutorials/:id/increment_views/
          const data = await tutorialService.incrementViews(video.id);

          // Backend returns updated tutorial (TutorialSerializer)
          const updatedViews =
            data?.views ??
            data?.view_count ??
            data?.views_count ??
            currentViews;

          setCurrentViews(updatedViews);
          hasCountedView.current = true;
        } catch (e) {
          console.error('Failed to track view', e);
        }
      };
      trackView();
    }
  }, [video, currentViews]);

  // --- 2. Initial Progress: mark as started (5%) if no progress yet ---
  useEffect(() => {
    if (
      video?.id &&
      !isInitiallyCompleted &&
      initialProgress === 0 &&
      !progressId
    ) {
      const start = async () => {
        try {
          const res = await tutorialService.saveProgress({
            tutorial: video.id,
            progress_percentage: 5,
            completed: false,
          });
          setProgress(5);
          lastSavedRef.current = 5;
          if (res && res.id) {
            setProgressId(res.id);
          }
        } catch (e) {
          console.error('Failed to create initial progress', e);
        }
      };
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  // --- 3. HTML5 Video Progress Tracking (non-YouTube URLs) ---
  const handleVideoTimeUpdate = async () => {
    const el = videoElementRef.current;
    if (!el || !el.duration) return;

    const percentage = (el.currentTime / el.duration) * 100;
    const rounded = Math.floor(percentage);

    if (rounded <= progress) return;

    setProgress(rounded);

    // Save every extra 10% (but not at 100%, handled in onEnded)
    if (rounded < 100 && rounded - lastSavedRef.current >= 10) {
      lastSavedRef.current = rounded;
      await saveProgress(rounded, false);
    }
  };

  const handleVideoEnded = async () => {
    setIsCompleted(true);
    setProgress(100);
    lastSavedRef.current = 100;
    await saveProgress(100, true);
  };

  // --- 4. Render Video Player ---
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

    // YouTube detection
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(youtubeRegex);

    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];

      // With YouTube iframe we can't track time easily without extra API,
      // so we rely on the "Mark Complete" button for full completion.
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

    // Direct video file: HTML5 player, we can track progress & completion
    return (
      <video
        className="w-full h-full bg-black"
        controls
        autoPlay
        src={url}
        ref={videoElementRef}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  // --- 5. Mark Complete Button (works for all videos, including YouTube) ---
  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      const newStatus = !isCompleted;
      const newPercentage = newStatus ? 100 : Math.max(progress, 50);

      setIsCompleted(newStatus);
      setProgress(newPercentage);
      lastSavedRef.current = newPercentage;

      await saveProgress(newPercentage, newStatus);
    } catch (e) {
      console.error('Failed to save completion', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className={
            theme === 'light'
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-gray-400 hover:text-white'
          }
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Video + Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            {renderVideoPlayer()}
          </div>

          <div className="space-y-4">
            {/* Title + Top Row */}
            <div className="flex items-start justify-between gap-4">
              {/* Title + Meta */}
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {video.title}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <Badge
                    variant="secondary"
                    className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/20"
                  >
                    {video.category}
                  </Badge>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> {video.duration}
                  </span>
                  <span className="flex items-center text-teal-400 font-bold">
                    <Eye className="h-3 w-3 mr-1" /> {currentViews} views
                  </span>
                  <span>•</span>
                  <span>{video.level}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Shared!')}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
                <Button
                  variant={isCompleted ? 'default' : 'outline'}
                  size="sm"
                  className={
                    isCompleted
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : ''
                  }
                  onClick={handleMarkComplete}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </Button>
              </div>
            </div>

            {/* Description Box */}
            <div
              className={`p-4 rounded-lg ${
                theme === 'light' ? 'bg-gray-100' : 'bg-gray-900/50'
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}
              >
                Description
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                }`}
              >
                {video.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Up Next */}
        <div className="space-y-4">
          <h3
            className={`font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}
          >
            Up Next
          </h3>
          <div
            className={`p-4 rounded-lg border text-center py-10 ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-gray-900/30 border-gray-800'
            }`}
          >
            <p className="text-gray-500 text-sm">
              More tutorials coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
