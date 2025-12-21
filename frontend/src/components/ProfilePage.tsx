import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTheme } from './ThemeProvider';
import { User, Mail, Lock, Save, Phone, Camera, Loader2 } from 'lucide-react';
import { ImageCropDialog } from './ImageCropDialog';
import authService from '../services/authService';

interface ProfilePageProps {
  isAdmin?: boolean;
  onNavigate?: (page: string) => void;
}

// helper: base64 → Blob
function dataURLToBlob(dataURL: string): Blob | null {
  if (!dataURL.startsWith('data:')) return null;
  const parts = dataURL.split(',');
  if (parts.length < 2) return null;
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export function ProfilePage({ isAdmin = false, onNavigate }: ProfilePageProps) {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | Blob | null>(
    null,
  );

  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // load from backend (User + StudentProfile)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const merged = await authService.getProfile(); // GET /auth/profile/

        const fName = merged.first_name || '';
        const lName = merged.last_name || '';
        const combinedName =
          fName || lName
            ? `${fName} ${lName}`.trim()
            : merged.username || 'User';

        setFullName(combinedName);
        setEmail(merged.email || '');
        setPhoneNumber(merged.phone || '');
        setStudentId(
          merged.student_id ||
            merged.student_profile?.student_id ||
            merged.username ||
            '',
        );
        setProfileImage(merged.profile_picture || null);
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // split fullName into first + last
      const trimmed = fullName.trim();
      const [firstName, ...rest] = trimmed.split(' ');
      const lastName = rest.join(' ');

      const formData = new FormData();
      formData.append('first_name', firstName || '');
      formData.append('last_name', lastName || '');
      formData.append('phone', phoneNumber || '');

      if (profileImageFile) {
        formData.append('profile_picture', profileImageFile);
      }

      // PATCH /auth/profile/
      const merged = await authService.updateProfile(formData);

      const fName = merged.first_name || '';
      const lName = merged.last_name || '';
      const combinedName =
        fName || lName
          ? `${fName} ${lName}`.trim()
          : merged.username || fullName;

      setFullName(combinedName);
      setEmail(merged.email || email);
      setPhoneNumber(merged.phone || phoneNumber);
      setStudentId(
        merged.student_id ||
          merged.student_profile?.student_id ||
          studentId,
      );
      setProfileImage(merged.profile_picture || profileImage);

      // fire event so DashboardLayout refreshes avatar + name
      window.dispatchEvent(new CustomEvent('profileUpdated'));

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // image upload + crop
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileImageFile(file); // original file as fallback

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setProfileImage(croppedImageUrl);
    setTempImageUrl(null);
    setIsCropDialogOpen(false);

    const blob = dataURLToBlob(croppedImageUrl);
    if (blob) {
      setProfileImageFile(blob);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'
        }`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${
        theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
            My Profile
          </h1>
          <p
            className={
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }
          >
            Manage your account information and security settings
          </p>
        </div>

        {/* Profile Card */}
        <Card
          className={`rounded-2xl shadow-sm p-8 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-900/50 border-gray-800'
          }`}
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl">
                    {fullName
                      ? fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : isAdmin
                      ? 'AD'
                      : 'ST'}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={() =>
                  document.getElementById('image-upload')?.click()
                }
                className={`absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                <Camera
                  className={`h-4 w-4 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                />
              </button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div>
              <h2
                className={
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }
              >
                {fullName || 'User Profile'}
              </h2>
              <p
                className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {isAdmin ? 'Administrator' : 'Student Account'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label
                className={
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }
              >
                Full Name
              </Label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`pl-10 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gray-950 border-gray-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                className={
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className={`pl-10 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gray-950 border-gray-700 text-white'
                  }`}
                  readOnly
                />
              </div>
            </div>

            {/* Password row */}
            <div className="space-y-2">
              <Label
                className={
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }
              >
                Password
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                      theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className={`pl-10 ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-gray-950 border-gray-700 text-white'
                    }`}
                  />
                </div>
                <Button
                  onClick={() => onNavigate?.('change-password')}
                  variant="outline"
                  className={`${
                    theme === 'light'
                      ? 'border-gray-300 hover:bg-gray-50'
                      : 'border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label
                className={
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }
              >
                Phone Number
              </Label>
              <div className="relative">
                <Phone
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className={`pl-10 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gray-950 border-gray-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* Student ID */}
            {!isAdmin && (
              <div className="space-y-2">
                <Label
                  className={
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }
                >
                  Student ID
                </Label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  className={`${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gray-950 border-gray-700 text-white'
                  }`}
                  readOnly
                />
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Crop dialog */}
        <ImageCropDialog
          isOpen={isCropDialogOpen}
          onClose={() => setIsCropDialogOpen(false)}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
}
