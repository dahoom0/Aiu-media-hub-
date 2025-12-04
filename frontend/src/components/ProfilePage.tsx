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

export function ProfilePage({ isAdmin = false, onNavigate }: ProfilePageProps) {
  const { theme } = useTheme();
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Profile State (Initialized empty to wait for real data)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Image Crop Dialog State
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // --- NEW: Fetch Real Data ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. Get data from LocalStorage or API
        const userData = authService.getUser() || await authService.getProfile();
        
        if (userData) {
          // 2. Populate State
          const fName = userData.first_name || '';
          const lName = userData.last_name || '';
          setFullName(`${fName} ${lName}`.trim() || userData.username);
          setEmail(userData.email || '');
          setStudentId(userData.student_id || userData.username || '');
          // Note: Phone isn't in default Django User model, so we keep it blank or mock it
          setPhoneNumber(userData.phone || ''); 
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSaveProfile = () => {
    // Ideally you would call authService.updateProfile() here
    alert('Profile updated successfully! (Backend update pending)');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    setProfileImage(croppedImageUrl);
    setTempImageUrl(null);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>My Profile</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage your account information and security settings
          </p>
        </div>

        {/* Profile Information Card */}
        <Card className={`rounded-2xl shadow-sm p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}`}>
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl">
                    {/* Dynamic Initials */}
                    {fullName ? 
                      fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                      : (isAdmin ? 'AD' : 'ST')}
                  </AvatarFallback>
                )}
              </Avatar>
              <button
                onClick={() => document.getElementById('image-upload')?.click()}
                className={`absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                <Camera className={`h-4 w-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`} />
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
              <h2 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                {fullName || 'User Profile'}
              </h2>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {isAdmin ? 'Administrator' : 'Student Account'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Full Name</Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`pl-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Email Address</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  className={`pl-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                  readOnly // Usually email shouldn't be changed easily
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className={`pl-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                  />
                </div>
                <Button
                  onClick={() => onNavigate?.('change-password')}
                  variant="outline"
                  className={`${theme === 'light' ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-800'}`}
                >
                  Change Password
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Phone Number</Label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className={`pl-10 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                />
              </div>
            </div>

            {!isAdmin && (
              <div className="space-y-2">
                <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Student ID</Label>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  className={`${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-950 border-gray-700 text-white'}`}
                  readOnly
                />
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Image Crop Dialog */}
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