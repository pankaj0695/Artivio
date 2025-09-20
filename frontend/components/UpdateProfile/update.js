"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile } from "@/lib/firestore";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function UpdateProfileInline({ onClose }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    photoURL: "",
    phoneNo: "",
    role: "Customer",
    city: "",
    state: "",
    address: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!user) return;
    setForm({
      name: profile?.name || user.displayName || "",
      email: profile?.email || user.email || "",
      photoURL: profile?.photoURL || user.photoURL || "",
      phoneNo: profile?.phoneNo || "",
      role: profile?.role || "Customer",
      city: profile?.city || "",
      state: profile?.state || "",
      address: profile?.address || "",
    });
  }, [user, profile]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setForm({ ...form, photoURL: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setForm({ ...form, photoURL: user.photoURL || "/default-avatar.png" });
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setUploading(true);

      let photoURL = form.photoURL;
      if (file) photoURL = await uploadToCloudinary(file);

      await updateUserProfile(user.uid, { ...form, photoURL });
      alert("Profile updated successfully!");
      setUploading(false);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-md rounded-2xl space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Image */}
        <div className="flex justify-center relative">
          <div
            onClick={() => fileInputRef.current.click()}
            className="relative w-28 h-28 rounded-full border border-gray-300 cursor-pointer overflow-hidden group hover:border-amber-500 transition"
          >
            {form.photoURL && (
              <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
              <Plus className="w-6 h-6 text-white opacity-90" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          {form.photoURL && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border rounded px-3 py-2" />
          <input name="email" value={form.email} disabled placeholder="Email" className="border rounded px-3 py-2 bg-gray-100" />
          <input name="phoneNo" value={form.phoneNo} onChange={handleChange} placeholder="Phone" className="border rounded px-3 py-2" />
          <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="border rounded px-3 py-2" />
          <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="border rounded px-3 py-2" />
          <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="border rounded px-3 py-2" />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="border rounded px-3 py-2 sm:col-span-2" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Cancel</button>
          <button type="submit" disabled={uploading} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">
            {uploading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Card>
  );
}
