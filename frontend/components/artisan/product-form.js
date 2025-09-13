"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/ui/image-uploader';
import { AIButton } from '@/components/ai/ai-button';
import { createProduct, updateProduct } from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const categories = [
  'pottery', 'textiles', 'jewelry', 'woodwork', 'metalwork', 'painting', 'sculpture', 'other'
];

export function ProductForm({ product, isEdit = false }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [images, setImages] = useState(product?.images || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: product?.title || '',
      tagline: product?.tagline || '',
      description: product?.description || '',
      price: product?.price || '',
      stock: product?.stock || '',
      category: product?.category || '',
      tags: product?.tags?.join(', ') || '',
      videoUrl: product?.videoUrl || '',
      status: product?.status || 'active'
    }
  });

  const watchedFields = watch();

  const callAI = async (endpoint, data, field) => {
    setAiLoading(prev => ({ ...prev, [field]: true }));
    
    try {
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.error('AI Error:', result.error);
        return;
      }
      
      if (field === 'hashtags') {
        setValue('tags', result.hashtags?.join(', ') || '');
      } else {
        setValue(field, result[field] || '');
      }
    } catch (error) {
      console.error('AI call failed:', error);
    } finally {
      setAiLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const generateVideo = () => {
    if (images.length < 3) {
      alert('Please upload at least 3 images to generate a video');
      return;
    }
    
    callAI('video', {
      image_urls: images.slice(0, 5),
      duration_seconds: 10,
      add_captions: true,
      add_music: true,
      preset: 'product_showcase'
    }, 'videoUrl');
  };

  const generateDescription = () => {
    callAI('description', {
      product_name: watchedFields.title,
      keywords: watchedFields.tags.split(',').map(tag => tag.trim()),
      materials: '',
      style: 'engaging',
      story_depth: 'medium'
    }, 'description');
  };

  const generateTagline = () => {
    callAI('tagline', {
      product_name: watchedFields.title,
      style: 'catchy'
    }, 'tagline');
  };

  const generateHashtags = () => {
    callAI('hashtags', {
      product_name: watchedFields.title,
      keywords: watchedFields.description.split(' ').slice(0, 10),
      style: 'trending',
      platforms: ['instagram', 'twitter']
    }, 'hashtags');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    const productData = {
      ...data,
      artisanId: user.uid,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      images,
      currency: 'INR'
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, productData);
      } else {
        await createProduct(productData);
      }
      
      router.push('/artisan/products');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="title">Product Title</Label>
                <AIButton
                  onClick={generateTagline}
                  loading={aiLoading.tagline}
                  tooltip="Generate tagline"
                />
              </div>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                error={errors.title?.message}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="tagline">Tagline</Label>
                <AIButton
                  onClick={generateTagline}
                  loading={aiLoading.tagline}
                  tooltip="Generate tagline with AI"
                />
              </div>
              <Input
                id="tagline"
                {...register('tagline')}
                placeholder="A catchy tagline for your product"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="description">Description</Label>
                <AIButton
                  onClick={generateDescription}
                  loading={aiLoading.description}
                  tooltip="Generate description with AI"
                />
              </div>
              <Textarea
                id="description"
                rows={4}
                {...register('description', { required: 'Description is required' })}
                error={errors.description?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'Price is required' })}
                  error={errors.price?.message}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', { required: 'Stock is required' })}
                  error={errors.stock?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <AIButton
                  onClick={generateHashtags}
                  loading={aiLoading.hashtags}
                  tooltip="Generate hashtags with AI"
                />
              </div>
              <Input
                id="tags"
                {...register('tags')}
                placeholder="handmade, pottery, ceramic"
              />
            </div>

            <div>
              <Label>Product Images</Label>
              <ImageUploader
                productId={product?.id || 'new'}
                onImagesChange={setImages}
                initialImages={images}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <AIButton
                  onClick={generateVideo}
                  loading={aiLoading.videoUrl}
                  tooltip="Generate video from images with AI"
                />
              </div>
              <Input
                id="videoUrl"
                {...register('videoUrl')}
                placeholder="Optional video URL"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}