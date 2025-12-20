'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Navbar';
import ZoroEntity from '@/components/ZoroEntity';
import { PostCardSkeleton } from '@/components/LoadingSkeleton';
import {
  API_ROUTES,
  CultureItem,
  UserSummary,
} from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

type ContentFilter = 'all' | 'videos' | 'images';

export default function ExplorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cultures, setCultures] = useState<CultureItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentFilter>('all');
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAllCultures();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get<UserSummary[]>(API_ROUTES.users, { withCredentials: true });
      const usersData = Array.isArray(res.data) ? res.data : [];
      setUsers(usersData);
      
      const states: Record<string, boolean> = {};
      usersData.forEach(u => {
        states[u.id] = u.isFollowing || false;
      });
      setFollowingStates(states);
    } catch {
      setUsers([]);
    }
  };

  const fetchAllCultures = async () => {
    setLoading(true);
    try {
      const res = await axios.get<CultureItem[]>(API_ROUTES.fetchPosts, { 
        withCredentials: true 
      });
      setCultures(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCultures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await axios.delete(API_ROUTES.deletePost(id), { withCredentials: true });
      setCultures((prev) => prev.filter((culture) => culture.id !== id));
      alert('Entry deleted successfully!');
    } catch {
      // no-op
    }
  }, []);

  const handleFollowToggle = async (userId: string) => {
    try {
      const response = await axios.put(
        API_ROUTES.followUser(userId),
        {},
        { withCredentials: true }
      );
      
      setFollowingStates(prev => ({
        ...prev,
        [userId]: response.data.isFollowing
      }));
    } catch (error) {
      console.error('Follow error:', error);
      alert('Failed to update follow status');
    }
  };

  const filteredCultures = useMemo(() => {
    if (contentType === 'videos') {
      return cultures.filter((item) => Boolean(item.videoUrl || item.VideoURL));
    }
    if (contentType === 'images') {
      return cultures.filter(
        (item) => Boolean(item.imageUrl || item.ImageURL) && !(item.videoUrl || item.VideoURL)
      );
    }
    return cultures;
  }, [contentType, cultures]);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="flex md:ml-64">
        {/* Main Feed - Center */}
        <div className="flex-1 max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore</h1>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setContentType('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  contentType === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setContentType('images')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  contentType === 'images'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setContentType('videos')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  contentType === 'videos'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCultures.length > 0 ? (
            <div className="space-y-6">
              {filteredCultures.map((culture) => (
                <ZoroEntity
                  key={culture.id}
                  {...culture}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-300 bg-white p-6 text-center text-gray-500">
              No posts found.
            </div>
          )}
        </div>

        {/* Right Sidebar - Suggested Users */}
        <div className="hidden xl:block w-80 px-4 py-6">
          <div className="fixed w-72">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                Suggested For You
              </h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {u.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {u.username}
                        </p>
                        <p className="text-xs text-gray-500">Suggested for you</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowToggle(u.id)}
                      className={`text-xs font-semibold transition-colors ${
                        followingStates[u.id] 
                          ? 'text-gray-400 hover:text-gray-600' 
                          : 'text-blue-500 hover:text-blue-700'
                      }`}
                    >
                      {followingStates[u.id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
