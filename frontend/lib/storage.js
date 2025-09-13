import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  ref as refFromURL,
} from "firebase/storage";
import { storage } from "./firebase";

export const uploadProductImage = async (file, productId) => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { url: downloadURL, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

export const deleteProductImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Cloudinary: unsigned upload using preset
export const uploadImageToCloudinary = async (file, productId, options = {}) => {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnfkcjujc';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Artivio';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (productId) formData.append('folder', `products/${productId}`);
    if (options.tags) formData.append('tags', options.tags.join(','));

    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Cloudinary upload failed');
    }
    const data = await res.json();
    return { url: data.secure_url || data.url, publicId: data.public_id, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};
