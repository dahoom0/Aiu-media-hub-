import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, Sun, Moon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import authService from '../services/authService';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
  uid?: string;
  token?: string;
}

export function ResetPasswordPage({ onNavigate, uid, token }: ResetPasswordPageProps) {
  const { theme, toggleTheme } = useTheme();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [validating, setValidating] = useState(true);
  const [isValidLink, setIsValidLink] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setError(null);

      if (!uid || !token) {
        setValidating(false);
        setIsValidLink(false);
        setError('Invalid or missing reset link. Please request a new reset link.');
        return;
      }

      try {
        // Optional: validate token if your backend supports it
        await authService.validatePasswordResetToken(uid, token);
        setIsValidLink(true);
      } catch (err: any) {
        console.error('validatePasswordResetToken error:', err);
        // If validate endpoint is not configured, we can still allow confirm attempt,
        // but show a clear error only if backend explicitly rejects it.
        // Here we treat validation failure as invalid link.
        setIsValidLink(false);
        setError(
          err?.message ||
            'Reset link is invalid or expired. Please request a new reset link.'
        );
      } finally {
        setValidating(false);
      }
    };

    run();
  }, [uid, token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!uid || !token) {
      setError('Invalid or missing reset link. Please request a new reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.confirmPasswordReset(uid, token, password);
      setSuccess(true);

      // After success, go to login
      setTimeout(() => {
        onNavigate('login');
      }, 800);
    } catch (err: any) {
      console.error('confirmPasswordReset error:', err);
      setError(
        err?.message ||
          'Unable to reset password. Please check reset endpoint configuration or request a new link.'
      );
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-400">Set New Password</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center gap-2 text-teal-300 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Password updated successfully. Redirecting to login...</span>
          </div>
        )}

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Reset Password</CardTitle>
            <CardDescription className="text-gray-400">
              Enter a new password for your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {validating ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating reset link...
              </div>
            ) : (
              <>
                {isValidLink ? (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-300">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-300">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
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
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => onNavigate('login')}
                        className="text-gray-400 hover:text-teal-400 transition-colors"
                        disabled={loading}
                      >
                        ← Back to Login
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('forgot-password')}
                        className="text-gray-400 hover:text-teal-400 transition-colors"
                        disabled={loading}
                      >
                        Request new link
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400">
                      This reset link is invalid or expired.
                    </div>

                    <Button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                    >
                      Request a New Reset Link
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => onNavigate('login')}
                        className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
