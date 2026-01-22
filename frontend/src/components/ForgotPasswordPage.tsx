import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Loader2, Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

type Step = 'request' | 'confirm';

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('request');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // UI cooldown (backend also has cooldown)
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => setCooldownSec((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  const canSubmitRequest = useMemo(() => {
    return email.trim().length > 3 && !loading && cooldownSec === 0;
  }, [email, loading, cooldownSec]);

  const canSubmitConfirm = useMemo(() => {
    return (
      email.trim().length > 3 &&
      otp.trim().length >= 4 &&
      newPassword.length >= 8 &&
      confirmPassword.length >= 8 &&
      newPassword === confirmPassword &&
      !loading
    );
  }, [email, otp, newPassword, confirmPassword, loading]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      // ✅ matches your authService.js
      const res = await authService.requestPasswordReset(cleanEmail);

      setInfo(res?.message || 'If an account exists for this email, an OTP has been sent.');
      setStep('confirm');

      // frontend cooldown display (optional)
      setCooldownSec(60);
    } catch (err: any) {
      console.error('request OTP error:', err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Unable to request OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // ✅ matches your authService.js payload signature
      const res = await authService.confirmPasswordReset({
        email: cleanEmail,
        otp: cleanOtp,
        new_password: newPassword,
      });

      setInfo(res?.message || 'Password has been reset successfully.');

      // go back to login after success
      setTimeout(() => onNavigate('login'), 700);
    } catch (err: any) {
      console.error('confirm reset error:', err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'OTP invalid or expired. Please request a new OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'confirm') {
      setStep('request');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setInfo(null);
      return;
    }
    onNavigate('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="mb-6">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-teal-400 transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {(error || info) && (
          <div
            className={`mb-4 p-3 rounded-md border flex items-start gap-2 text-sm ${
              error
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-teal-500/10 border-teal-500/20 text-teal-300'
            }`}
          >
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error || info}</span>
          </div>
        )}

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 'request' ? 'Forgot Password' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 'request'
                ? 'Enter your email to receive a 6-digit OTP code.'
                : 'Enter the OTP and your new password to reset your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@aiu.edu.my"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmitRequest}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : cooldownSec > 0 ? (
                    `Please wait ${cooldownSec}s`
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email2" className="text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email2"
                      type="email"
                      placeholder="student@aiu.edu.my"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-300">
                    OTP Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-10 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newpass" className="text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="newpass"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Minimum 8 characters.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confpass" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="confpass"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmitConfirm}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-gray-400 hover:text-teal-400 transition-colors"
                    disabled={loading}
                  >
                    Request new OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-gray-400 hover:text-teal-400 transition-colors"
                    disabled={loading}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
