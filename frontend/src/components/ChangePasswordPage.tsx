import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useTheme } from './ThemeProvider';
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

interface ChangePasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ChangePasswordPage({ onNavigate }: ChangePasswordPageProps) {
  const { theme } = useTheme();
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    alert('Password changed successfully!');
    onNavigate('profile');
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('profile')}
          className={`mb-4 ${theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Change Password</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Update your password to keep your account secure
          </p>
        </div>

        {/* Change Password Card */}
        <Card className={`rounded-2xl shadow-sm p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
              <KeyRound className={`h-6 w-6 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
            </div>
            <div>
              <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Password Settings</h2>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Enter your current password and choose a new one
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Current Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={`pl-10 pr-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>New Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`pl-10 pr-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Confirm New Password</Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`pl-10 pr-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/30'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
                <strong>Security Tips:</strong>
              </p>
              <ul className={`text-sm mt-2 space-y-1 ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>
                <li>• Use a unique password for this account</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid using personal information in your password</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => onNavigate('profile')}
                variant="outline"
                className={theme === 'light' ? 'border-gray-300' : 'border-gray-700'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
