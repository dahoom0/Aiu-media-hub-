import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

export function SignupPage({ onNavigate }: SignupPageProps) {
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 4) {
      setError("Password is too short");
      return;
    }

    setLoading(true);

    try {
      // 2. Format Data for Django
      // Your backend expects: first_name, last_name, username, etc.
      
      // Split "John Doe" -> "John" and "Doe"
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const registerPayload = {
        username: formData.studentId, // We use Student ID as the username
        email: formData.email,
        password: formData.password,
        first_name: firstName,
        last_name: lastName,
        student_id: formData.studentId, // Ensure this is sent if your profile model needs it
        user_type: 'student' // Required by your custom permission logic
      };

      // 3. Call API
      // Since we updated authService.js, this will auto-save the tokens
      await authService.register(registerPayload);

      // 4. Success!
      alert("Account created successfully!");
      // Because your backend logs us in automatically on register, go straight to dashboard
      onNavigate('student-dashboard');

    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle backend errors
      if (err.response && err.response.data) {
        // Check for specific field errors
        if (err.response.data.username) {
            setError(`Student ID error: ${err.response.data.username[0]}`);
        } else if (err.response.data.email) {
            setError(`Email error: ${err.response.data.email[0]}`);
        } else if (err.response.data.error) {
            setError(err.response.data.error);
        } else {
            setError("Registration failed. Please check your details.");
        }
      } else {
        setError("Unable to connect to server. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join AIU Media Hub</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Student Registration</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className="bg-gray-950 border-gray-700 text-white focus:border-teal-500"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-gray-300">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="1234567"
                    className="bg-gray-950 border-gray-700 text-white focus:border-teal-500"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@aiu.edu.my"
                    className="bg-gray-950 border-gray-700 text-white focus:border-teal-500"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-gray-950 border-gray-700 text-white focus:border-teal-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-gray-950 border-gray-700 text-white focus:border-teal-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white mt-6"
              >
                {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                ) : (
                    'Register'
                )}
              </Button>

              <div className="text-center text-sm text-gray-400 mt-4">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-teal-400 transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}