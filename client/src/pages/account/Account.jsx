import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Phone, Camera, Lock, Eye, EyeOff, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingState from '@/components/shared/LoadingState';
import ProfileImage from '@/components/shared/ProfileImage';
import PageHeader from '@/components/shared/PageHeader';

const Account = () => {
  const { user, login } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'password', or 'system'

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    language: 'en',
    region: 'US',
    currency: 'USD',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Initialize preview with existing profile image
  useEffect(() => {
    if (user?.profileImage) {
      console.log('👤 User profile image updated:', user.profileImage);
      setPreviewUrl(user.profileImage);
    }
  }, [user?.profileImage]);

  // Debug: Log preview URL changes
  useEffect(() => {
    console.log('🔄 Preview URL changed:', previewUrl);
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(API_ENDPOINTS.USER.PROFILE, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update auth store with new user data
      const updatedUser = data.data || data.user || data;
      login(updatedUser, localStorage.getItem('token'));
      queryClient.invalidateQueries(['user-profile']);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(API_ENDPOINTS.USER.CHANGE_PASSWORD, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Upload profile photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Revoke old blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create local preview URL
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    setUploadingPhoto(true);

    try {
      // Get presigned URL
      const uploadUrlResponse = await api.get('/api/v1/upload/profile-photo-upload-url', {
        params: {
          fileName: file.name,
          fileType: file.type,
        },
      });

      const { uploadURL, fileUrl } = uploadUrlResponse.data.data;

      // Upload to S3
      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Update user profile with photo URL
      const response = await api.put(API_ENDPOINTS.USER.PROFILE, {
        profileImage: fileUrl,
      });

      const updatedUser = response.data.data || response.data.user || response.data;
      
      console.log('📸 Photo upload successful:', {
        fileUrl,
        updatedUser,
        profileImage: updatedUser.profileImage
      });
      
      login(updatedUser, localStorage.getItem('token'));
      queryClient.invalidateQueries(['user-profile']);
      
      // Replace blob URL with S3 URL
      // Revoke the blob URL since we now have the S3 URL
      if (localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      
      // Set preview URL to S3 URL
      setPreviewUrl(fileUrl);
      
      console.log('✅ Preview URL updated to:', fileUrl);
      
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload profile photo');
      // Keep the blob preview on error, don't revert
      // User can see what they selected even if upload failed
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  // Sidebar menu items
  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    // { id: 'system', label: 'System', icon: Globe },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
      <div className="flex-shrink-0">
        <div className="hidden md:block">
          <PageHeader
            title="Account Settings"
            subtitle="Manage your profile and security settings"
          />
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className="w-full lg:w-64 flex-shrink-0">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Account Settings</h3>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <div className="flex gap-2 border-b">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 lg:mt-0">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Card className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  className="mt-1"
                  placeholder="Please Enter First Name"
                />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="mt-1"
                  placeholder="Please Enter Last Name"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="mt-1"
                  placeholder="Please Enter Phone Number"
                />
              </div>

              {/* Profile Image */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Profile Image</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors relative"
                  >
                    {uploadingPhoto ? (
                      <div className="flex flex-col items-center">
                        <LoadingState compact={true} />
                        <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                      </div>
                    ) : previewUrl || user?.profileImage ? (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3">
                          <ProfileImage
                            imageUrl={previewUrl || user.profileImage}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Camera className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to change photo</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <span className="text-2xl text-gray-400">+</span>
                        </div>
                        <span className="text-sm text-gray-600">Upload</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>

                {/* Update Profile Button */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 py-5 text-base"
                  >
                    {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Password Section */}
          {activeSection === 'password' && (
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    placeholder="Please Enter Current Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    placeholder="Please Enter New Password (min 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    placeholder="Please Confirm New Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

                  {/* Change Password Button */}
                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 py-5 text-base"
                    >
                      {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* System Section */}
            {activeSection === 'system' && (
              <Card className="p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('System settings updated successfully!');
                }} className="space-y-6">
                  
                  {/* Language and Region */}
                  <div>
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                      Language and Region <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={systemSettings.language} 
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (United States)</SelectItem>
                        <SelectItem value="en-ca">English (Canada)</SelectItem>
                        <SelectItem value="fr">French (France)</SelectItem>
                        <SelectItem value="fr-ca">French (Canada)</SelectItem>
                        <SelectItem value="es">Spanish (Spain)</SelectItem>
                        <SelectItem value="de">German (Germany)</SelectItem>
                        <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                        <SelectItem value="ja">Japanese (Japan)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Currency */}
                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={systemSettings.currency} 
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar ($)</SelectItem>
                        <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">This will affect how amounts are displayed throughout the app</p>
                  </div>

                  {/* Save System Settings Button */}
                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 py-5 text-base"
                    >
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default Account;

