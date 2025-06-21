"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ token }: { token: string }) {
  const router = useRouter();
  const [phNumber, setPhNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [qrCodePic, setQrCodePic] = useState<File | null>(null);
  const [qrCodePicUrl, setQrCodePicUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3000/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) {
          console.error(`Error fetching profile: ${res.status}`);
          setIsLoading(false);
          return;
        }
        
        const { data } = await res.json();
          if (data) {
          if (data.ph_number) setPhNumber(data.ph_number);
          if (data.full_name) setFullName(data.full_name);
          if (data.profile_pic) setProfilePicUrl(data.profile_pic);
          if (data.qr_code_pic) setQrCodePicUrl(data.qr_code_pic);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();    setError("");
    setSuccess("");
    
    // Use current profilePicUrl unless we're uploading a new image
    let uploadedPicUrl = profilePicUrl;
    let uploadedQrCodeUrl = qrCodePicUrl;
    
    if (profilePic) {
      try {
        // Upload profile picture to backend
        const formData = new FormData();
        formData.append("profile_pic", profilePic);
        const uploadRes = await fetch("http://localhost:3000/profile/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error(`Error ${uploadRes.status}: ${uploadRes.statusText}`);
        }
        
        // Check content type to avoid parsing HTML as JSON
        const contentType = uploadRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        
        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          throw new Error('Invalid response format');
        }        
        uploadedPicUrl = uploadData.url;
      } catch (err: any) {
        console.error("Error uploading profile picture:", err);
        setError(err.message || "Profile picture upload failed");
        return;
      }
    }

    // Upload QR code if provided
    if (qrCodePic) {
      try {
        const formData = new FormData();
        formData.append("qr_code_pic", qrCodePic);
        const uploadRes = await fetch("http://localhost:3000/profile/qr-upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error(`QR upload error ${uploadRes.status}: ${uploadRes.statusText}`);
        }
        
        const contentType = uploadRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }
        
        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          throw new Error('Invalid QR upload response format');
        }        
        uploadedQrCodeUrl = uploadData.url;
      } catch (err: any) {
        console.error("Error uploading QR code:", err);
        setError(err.message || "QR code upload failed");
        return;
      }
    }// Send profile data
    try {      const res = await fetch("http://localhost:3000/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },        body: JSON.stringify({ 
          ph_number: phNumber, 
          full_name: fullName, 
          profile_pic: uploadedPicUrl || undefined,
          qr_code_pic: uploadedQrCodeUrl || undefined
        }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }
        const data = await res.json();      setSuccess("Profile updated successfully!");
      setPhNumber("");
      setFullName("");
      setProfilePic(null);
      setQrCodePic(null);
      // Redirect to home/dashboard after success
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Profile update failed");
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto p-6 bg-white rounded shadow">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading your profile...</p>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto p-6 bg-white rounded shadow" encType="multipart/form-data">
      <h2 className="text-xl font-bold mb-4">Your Profile</h2>
        {/* Show current profile picture if available */}
      {profilePicUrl && (
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img 
              src={profilePicUrl} 
              alt="Current profile" 
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Show current QR code if available */}
      {qrCodePicUrl && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current QR Code</label>
          <div className="flex justify-center">
            <img 
              src={qrCodePicUrl} 
              alt="Current QR Code" 
              className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg bg-white p-2"
            />
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            placeholder="Your phone number"
            className="w-full border p-2 rounded"
            value={phNumber}
            onChange={e => setPhNumber(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            className="w-full border p-2 rounded"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </div>
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            className="w-full border p-2 rounded"
            onChange={e => setProfilePic(e.target.files?.[0] || null)}
          />
          {profilePicUrl && !profilePic && (
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep your current profile picture</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            QR Code Picture 
            <span className="text-xs text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full border p-2 rounded"
            onChange={e => setQrCodePic(e.target.files?.[0] || null)}
          />
          {qrCodePic && (
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">Preview:</p>
              <img 
                src={URL.createObjectURL(qrCodePic)} 
                alt="QR Code Preview" 
                className="w-24 h-24 object-contain border border-gray-300 rounded bg-white p-1"
              />
            </div>
          )}
          {qrCodePicUrl && !qrCodePic && (
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep your current QR code</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Upload your payment QR code for easy transactions
          </p>
        </div></div>
      
      <div className="flex gap-3">
        <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded">
          Save Changes
        </button>
        <button 
          type="button" 
          onClick={() => router.push('/home')}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded border border-gray-300"
        >
          Cancel
        </button>
      </div>
      
      {error && <div className="mt-3 text-red-600 p-2 bg-red-50 border border-red-100 rounded">{error}</div>}
      {success && <div className="mt-3 text-green-600 p-2 bg-green-50 border border-green-100 rounded">{success}</div>}
    </form>
  );
}
