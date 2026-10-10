import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import api from '@/lib/axios';

const ProfileImage = ({ imageUrl, alt = "Profile", className = "w-full h-full object-cover" }) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!imageUrl) {
        setLoading(false);
        return;
      }

      // If it's a blob URL (local preview), use it directly
      if (imageUrl.startsWith('blob:')) {
        setSignedUrl(imageUrl);
        setLoading(false);
        return;
      }

      // If it's already a signed URL or doesn't need signing, use directly
      if (!imageUrl.includes('s3.') && !imageUrl.includes('amazonaws.com')) {
        setSignedUrl(imageUrl);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // Extract S3 key from URL
        const url = new URL(imageUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        console.log('🔑 Fetching signed URL for profile image:', key);

        // Get signed URL from backend
        const response = await api.get('/api/v1/upload/s3-download-url', {
          params: { key }
        });

        const downloadURL = response.data.data?.downloadURL || response.data.downloadURL;
        
        console.log('✅ Signed URL received for profile image');
        setSignedUrl(downloadURL);
      } catch (err) {
        console.error('❌ Failed to get signed URL for profile image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [imageUrl]);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <User className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <User className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      onError={() => {
        console.error('❌ Profile image failed to load');
        setError(true);
      }}
    />
  );
};

export default ProfileImage;

