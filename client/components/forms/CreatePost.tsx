'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePost({ postId }: { postId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      axios.get(`${API_ROUTES.fetchPosts}/${postId}`, { withCredentials: true })
        .then((res) => {
          setCaption(res.data.caption || '');
          setLocation(res.data.location || '');
          setTags(res.data.tags || '');
          if (res.data.imageUrl) setImagePreview(res.data.imageUrl);
          if (res.data.videoUrl) setVideoPreview(res.data.videoUrl);
        })
        .catch(() => alert('Failed to load post'));
    }
  }, [postId]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setVideo(null);
      setVideoPreview(null);
    }
  }, []);

  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setImage(null);
      setImagePreview(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to create a post');
      return;
    }

    if (!caption.trim()) {
      alert('Caption is required');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', location);
    formData.append('tags', tags);
    formData.append('created_by', user.id);
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);
    if (postId) formData.append('_id', postId);

    try {
      if (postId) {
        await axios.put(API_ROUTES.updatePost, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        alert('Post updated!');
      } else {
        await axios.post(API_ROUTES.createPost, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        alert('Post created!');
      }
      router.push('/home');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-300">
        <div className="flex items-center gap-3 p-4 border-b border-gray-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="font-semibold text-gray-900">{user?.username || 'User'}</span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full p-3 border border-gray-300 rounded text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            required
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location (optional)"
            className="w-full p-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags #example (optional)"
            className="w-full p-3 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                📷 Photo
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600">
                🎥 Video
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              </label>
            </div>
          </div>

          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded object-cover" style={{ maxHeight: '400px' }} />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">Remove</button>
            </div>
          )}

          {videoPreview && (
            <div className="relative">
              <video src={videoPreview} controls className="w-full rounded" style={{ maxHeight: '400px' }} />
              <button type="button" onClick={() => { setVideo(null); setVideoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">Remove</button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Posting...' : postId ? 'Update Post' : 'Share Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
