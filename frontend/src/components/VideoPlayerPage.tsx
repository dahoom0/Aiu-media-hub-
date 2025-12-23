import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Share2,
  Eye,
  Clock,
  AlertCircle,
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

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
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

  const [progress, setProgress] = useState<number>(initialProgress);
  const [progressId, setProgressId] = useState<number | null>(
    (video as any).progressId ?? null,
  );

  const hasCountedView = useRef(false);

  // HTML5 player refs
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // YouTube player refs
  const ytPlayerRef = useRef<any>(null);
  const ytPollIntervalRef = useRef<number | null>(null);
  const ytReadyRef = useRef(false);

  // progress saving refs
  const lastSavedRef = useRef(initialProgress || 0);
  const lastSentAtRef = useRef<number>(0);

  // --- Helper: normalize + throttle save ---
  const saveProgress = async (percentage: number, completedFlag?: boolean) => {
    try {
      const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)));
      const now = Date.now();

      // Basic throttle (avoid hammering API)
      if (now - lastSentAtRef.current < 1000) return;
      lastSentAtRef.current = now;

      let res;
      if (progressId) {
        // Some implementations PATCH by id
        res = await tutorialService.saveProgress({
          id: progressId,
          tutorial: video.id, // keep tutorial too (safe)
          progress_percentage: safePercentage,
          completed: completedFlag ?? false,
        });
      } else {
        // Create (or backend UPSERT create)
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
          const data = await tutorialService.incrementViews(video.id);

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

    // Save every +10%
    if (rounded < 100 && rounded - lastSavedRef.current >= 10) {
      lastSavedRef.current = rounded;
      await saveProgress(rounded, false);
    }

    // If near-end, auto complete (safety)
    if (rounded >= 95 && !isCompleted) {
      setIsCompleted(true);
      setProgress(100);
      lastSavedRef.current = 100;
      await saveProgress(100, true);
    }
  };

  const handleVideoEnded = async () => {
    setIsCompleted(true);
    setProgress(100);
    lastSavedRef.current = 100;
    await saveProgress(100, true);
  };

  // --- YouTube helpers ---
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

  const getYouTubeId = (url: string) => {
    const m = url.match(youtubeRegex);
    return m && m[1] ? m[1] : null;
  };

  const ensureYouTubeApi = (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();

      const existing = document.querySelector('script[data-yt-iframe-api="1"]');
      if (existing) {
        const check = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.setAttribute('data-yt-iframe-api', '1');

      window.onYouTubeIframeAPIReady = () => resolve();
      document.body.appendChild(tag);
    });
  };

  const clearYouTubePolling = () => {
    if (ytPollIntervalRef.current) {
      window.clearInterval(ytPollIntervalRef.current);
      ytPollIntervalRef.current = null;
    }
  };

  const destroyYouTubePlayer = () => {
    clearYouTubePolling();
    try {
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
      }
    } catch {
      // ignore
    }
    ytPlayerRef.current = null;
    ytReadyRef.current = false;
  };

  const startYouTubePolling = () => {
    clearYouTubePolling();

    ytPollIntervalRef.current = window.setInterval(async () => {
      try {
        const player = ytPlayerRef.current;
        if (!player || !ytReadyRef.current) return;

        const duration = player.getDuration?.();
        const currentTime = player.getCurrentTime?.();
        if (!duration || duration <= 0) return;

        const percentage = (currentTime / duration) * 100;
        const rounded = Math.floor(percentage);

        if (rounded > progress) {
          setProgress(rounded);
        }

        // Save every +10%
        if (rounded < 100 && rounded - lastSavedRef.current >= 10) {
          lastSavedRef.current = rounded;
          await saveProgress(rounded, false);
        }

        // Auto complete near end
        if (rounded >= 95 && !isCompleted) {
          setIsCompleted(true);
          setProgress(100);
          lastSavedRef.current = 100;
          await saveProgress(100, true);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
  };

  // --- 4. Setup YouTube Player when URL is YouTube ---
  useEffect(() => {
    const url = video?.videoUrl;
    if (!url) return;

    const ytId = getYouTubeId(url);
    if (!ytId) {
      destroyYouTubePlayer();
      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        await ensureYouTubeApi();
        if (cancelled) return;

        destroyYouTubePlayer();

        ytPlayerRef.current = new window.YT.Player('yt-player-container', {
          videoId: ytId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              ytReadyRef.current = true;
              startYouTubePolling();
            },
            onStateChange: async (event: any) => {
              if (event?.data === 0) {
                setIsCompleted(true);
                setProgress(100);
                lastSavedRef.current = 100;
                await saveProgress(100, true);
              }
            },
          },
        });
      } catch (e) {
        console.error('Failed to setup YouTube player', e);
      }
    };

    setup();

    return () => {
      cancelled = true;
      destroyYouTubePlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.videoUrl, video?.id]);

  // Save progress on unmount (best-effort)
  useEffect(() => {
    return () => {
      try {
        if (video?.id && progress > 0 && progress < 100) {
          saveProgress(progress, isCompleted);
        }
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, progress, isCompleted]);

  // --- 5. Render Video Player ---
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

    const ytId = getYouTubeId(url);

    if (ytId) {
      return <div id="yt-player-container" className="w-full h-full" />;
    }

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
