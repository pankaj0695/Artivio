"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImageToCloudinary } from '@/lib/storage';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export function ImageUploader({ productId, onImagesChange, initialImages = [] }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(initialImages);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
  const uploadPromises = files.map(file => uploadImageToCloudinary(file, productId || 'temp'));
    
    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results
        .filter(result => result.url && !result.error)
        .map(result => result.url);
      
      const newImages = [...images, ...successfulUploads];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={imageUrl}
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors">
          <label className="cursor-pointer flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Upload Images</span>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {uploading && (
        <p className="text-sm text-gray-600">Uploading images...</p>
      )}
    </div>
  );
}