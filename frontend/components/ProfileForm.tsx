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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile", {
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
    e.preventDefault();
    setError("");
    setSuccess("");
    // Use current profilePicUrl unless we're uploading a new image
    let uploadedPicUrl = profilePicUrl;
    let uploadedQrCodeUrl = qrCodePicUrl;
    
    if (profilePic) {
      try {
        // Upload profile picture to backend
        const formData = new FormData();
        formData.append("profile_pic", profilePic);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/upload", {
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
    
    if (qrCodePic) {
      try {
        // Upload QR code picture to backend
        const formData = new FormData();
        formData.append("qr_code_pic", qrCodePic);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/qr-upload", {
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
        uploadedQrCodeUrl = uploadData.url;
      } catch (err: any) {
        console.error("Error uploading QR code picture:", err);
        setError(err.message || "QR code upload failed");
        return;
      }
    }    
    // Send profile data
    try {      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },        body: JSON.stringify({ 
          ph_number: phNumber, 
          full_name: fullName, 
          profile_pic: uploadedPicUrl || undefined,
          qr_code_pic: uploadedQrCodeUrl || undefined,
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
        const data = await res.json();
      setSuccess("Profile updated successfully!");
      // Save updated profile info to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userAvatar", uploadedPicUrl || profilePicUrl || "");
        localStorage.setItem("userPhone", phNumber);
      }
      setPhNumber("");
      setFullName("");
      setProfilePic(null);
      setQrCodePic(null);
      // Redirect to home/dashboard after success
      setTimeout(() => {
        router.push("/");
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto bg-white rounded-" encType="multipart/form-data">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#3a0ca3' }}>Phone Number</label>
          <input
            type="text"
            placeholder="Your phone number"
            className="w-full border-b-2 border-gray-300 focus:border-[#035fa5] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2"
            value={phNumber}
            onChange={e => setPhNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#3a0ca3' }}>Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            className="w-full border-b-2 border-gray-300 focus:border-[#035fa5] bg-transparent outline-none text-gray-800 placeholder-gray-400 py-2"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#3a0ca3' }}>
                Profile Picture
            </label>
            <div className="flex items-center gap-4">
                {profilePic
                    ? (
                        <img
                            src={URL.createObjectURL(profilePic)}
                            alt="Preview"
                            className="w-12 h-12 rounded-full object-cover border"
                        />
                    )
                    : profilePicUrl && (
                        <img
                            src={profilePicUrl}
                            alt="Current Profile"
                            className="w-12 h-12 rounded-full object-cover border"
                        />
                    )
                }
                <label className="cursor-pointer bg-[#f1f3f6] hover:bg-[#e2e6ee] text-[#3a0ca3] px-4 py-2 rounded-full font-medium shadow border border-gray-200 transition-all duration-200">
                    <span>Choose File</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setProfilePic(e.target.files?.[0] || null)}
                    />
                </label>
            </div>
            {profilePicUrl && !profilePic && (
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep your current profile picture</p>
            )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#3a0ca3' }}>
            QR Code Picture
            <span className="text-xs text-gray-500 font-normal"> (Required)</span>
          </label>
          <div className="flex items-center gap-4">
            {qrCodePic
              ? (
                <img
                  src={URL.createObjectURL(qrCodePic)}
                  alt="QR Code Preview"
                  className="w-12 h-12 rounded object-contain border"
                />
              )
              : qrCodePicUrl && (
                <img
                  src={qrCodePicUrl}
                  alt="Current QR Code"
                  className="w-12 h-12 rounded object-contain border"
                />
              )
            }
            <label className="cursor-pointer bg-[#f1f3f6] hover:bg-[#e2e6ee] text-[#3a0ca3] px-4 py-2 rounded-full font-medium shadow border border-gray-200 transition-all duration-200">
              <span>Choose File</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setQrCodePic(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {qrCodePicUrl && !qrCodePic && (
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep your current QR code</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Upload your payment Esewa QR code for easy transactions
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="flex-1 bg-[#3a0ca3] hover:bg-[#2a087a] text-white p-3 rounded-full font-semibold shadow-md transition-all duration-300 hover:scale-105">
          Save Changes
        </button>
        <button 
          type="button" 
          onClick={() => router.push('/home')}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-full border border-gray-300 font-semibold"
        >
          Cancel
        </button>
      </div>
      {error && <div className="mt-3 text-red-600 p-2 bg-red-50 border border-red-100 rounded">{error}</div>}
      {success && <div className="mt-3 text-green-600 p-2 bg-green-50 border border-green-100 rounded">{success}</div>}
    </form>
  );
}


