import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, User, Shield, Sun, Moon, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import authService from '../services/authService';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

const isAdminUser = (u: any) => {
  const role = String(u?.role || '').toLowerCase();
  return role.includes('admin') || u?.user_type === 'admin' || u?.is_staff === true;
};

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { theme, toggleTheme } = useTheme();

  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);

    try {
      await authService.login(username, pass);

      const user = authService.getUser();
      const admin = isAdminUser(user);

      if (admin) onNavigate('admin-dashboard');
      else onNavigate('student-dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.response && err.response.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Unable to connect to server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(studentEmail, studentPassword);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(adminEmail, adminPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-white mb-2">AIU Media Hub</h2>
          <p className="text-gray-400">Bachelor of Media & Communication</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800">
            <TabsTrigger
              value="student"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Student
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Student Login</CardTitle>
                <CardDescription className="text-gray-400">
                  Access your dashboard, bookings, and portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-email" className="text-gray-300">
                      University Email / ID
                    </Label>
                    <Input
                      id="student-email"
                      type="text"
                      placeholder="student@aiu.edu.my"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="student-password" className="text-gray-300">
                        Password
                      </Label>

                      {/* ✅ NEW: Forgot password button (Student tab only) */}
                      <button
                        type="button"
                        onClick={() => onNavigate('forgot-password')}
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                        disabled={loading}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Input
                      id="student-password"
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login to Dashboard'
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('signup')}
                      className="text-teal-400 hover:text-teal-300 transition-colors"
                      disabled={loading}
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Admin Login</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage bookings, equipment, and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-gray-300">
                      Admin Email / ID
                    </Label>
                    <Input
                      id="admin-email"
                      type="text"
                      placeholder="admin@aiu.edu.my"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Login to Admin Panel'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('landing')}
            className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
