'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Navbar';
import ZoroEntity from '@/components/ZoroEntity';
import { API_ROUTES, CultureItem } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function SavedPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<CultureItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user) return;
      
      setLoadingPosts(true);
      try {
        const res = await axios.get<CultureItem[]>(
          `${API_ROUTES.fetchPosts}?saved=true`,
          { withCredentials: true }
        );
        setSavedPosts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch saved posts:', error);
        setSavedPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(API_ROUTES.deletePost(id), { withCredentials: true });
      setSavedPosts((prev) => prev.filter((post) => post.id !== id));
      alert('Post deleted successfully!');
    } catch {
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-800">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="flex md:ml-64">
        {/* Main Content */}
        <div className="flex-1 max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Posts</h1>
            <p className="text-gray-500 text-sm">
              Only you can see what you've saved
            </p>
          </div>

          {/* Saved Posts */}
          {loadingPosts ? (
            <div className="flex justify-center items-center py-10 gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          ) : savedPosts.length > 0 ? (
            <div className="space-y-6">
              {savedPosts.map((post) => (
                <ZoroEntity
                  key={post.id}
                  {...post}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4">
                <svg
                  className="w-20 h-20 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No saved posts yet
              </h2>
              <p className="text-gray-500 text-center max-w-sm">
                Save posts to easily find them later
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
