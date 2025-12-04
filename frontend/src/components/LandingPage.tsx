import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Video, Calendar, Package, FolderOpen, BookOpen, Users, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const features = [
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Access comprehensive guides on using professional media equipment, from cameras to audio gear.',
    },
    {
      icon: Calendar,
      title: 'Lab Booking',
      description: 'Reserve studios and editing rooms with admin approval. View availability in real-time.',
    },
    {
      icon: Package,
      title: 'Equipment Rental',
      description: 'Rent professional equipment with QR-based tracking. Simple checkout and return process.',
    },
    {
      icon: FolderOpen,
      title: 'Digital Portfolio',
      description: 'Auto-generate your professional portfolio from your projects. Showcase your best work.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-white">AIU Media Hub</h1>
                <p className="text-xs text-gray-400">Bachelor of Media & Communication</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
                <Button
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  onClick={() => onNavigate('login')}
                >
                  Login
                </Button>
              </div>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2">
              <span className="text-xs text-teal-400">Albukhary International University</span>
            </div>
            <h2 className="text-white">
              Your All-in-One Media Production Platform
            </h2>
            <p className="text-lg text-gray-400">
              Streamline your media production workflow with integrated tutorials, lab bookings, equipment rentals, and portfolio management — all in one connected platform.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={() => onNavigate('login')}
            >
              Get Started
            </Button>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-400" />
                <div>
                  <p className="text-sm text-gray-400">Active Users</p>
                  <p className="text-white">250+ Students</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-400" />
                <div>
                  <p className="text-sm text-gray-400">Equipment</p>
                  <p className="text-white">50+ Items</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 blur-2xl" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1761850215840-2775d7229cad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpYSUyMHN0dWRpbyUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NjI4NjU5ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Media Studio Equipment"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-white mb-4">Everything You Need</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A comprehensive platform designed specifically for BMC students to manage their entire media production workflow
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-teal-500/50 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                  <feature.icon className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-white mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/20">
          <CardContent className="p-12 text-center">
            <h3 className="text-white mb-4">Ready to Get Started?</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join hundreds of BMC students already using AIU Media Hub to streamline their production workflow
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              onClick={() => onNavigate('login')}
            >
              Access Platform
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 AIU Media Hub. Built for Albukhary International University.
            </p>
            <p className="text-sm text-gray-400">
              ReactJS + TailwindCSS + Django
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}