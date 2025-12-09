'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  FaArchway,
  FaImage,
  FaUser,
  FaVideo,
} from 'react-icons/fa';
import Sidebar from '@/components/Navbar';
import CulturalEntity from '@/components/CulturalEntity';
import {
  API_ROUTES,
  CultureItem,
  UserSummary,
} from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

type ContentFilter = 'all' | 'videos' | 'images';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cultures, setCultures] = useState<CultureItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentFilter>('all');
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followingCount, setFollowingCount] = useState(0);
  const [hasFollowing, setHasFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    fetchUsers();
    checkFollowingStatus();
  }, [user]);

  useEffect(() => {
    if (hasFollowing !== null) {
      fetchCultures();
      
      // Real-time polling for posts every 15 seconds
      const interval = setInterval(() => {
        fetchCultures(selectedUser);
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [hasFollowing, selectedUser]);

  const checkFollowingStatus = async () => {
    if (!user) {
      setHasFollowing(false);
      return;
    }
    
    try {
      const res = await axios.get(`/api/users/${user.id}`, { withCredentials: true });
      const followingLength = res.data.following?.length || 0;
      setFollowingCount(followingLength);
      setHasFollowing(followingLength > 0);
    } catch {
      setHasFollowing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get<UserSummary[]>(API_ROUTES.users, { withCredentials: true });
      const usersData = Array.isArray(res.data) ? res.data : [];
      setUsers(usersData);
      
      // Initialize following states
      const states: Record<string, boolean> = {};
      usersData.forEach(user => {
        states[user.id] = user.isFollowing || false;
      });
      setFollowingStates(states);
    } catch {
      setUsers([]);
    }
  };

  const fetchCultures = async (userId?: string) => {
    setLoading(true);
    try {
      let url;
      if (userId && userId.length > 0) {
        url = API_ROUTES.postsByUser(userId);
      } else if (hasFollowing) {
        // Fetch posts from followed users only
        url = `${API_ROUTES.fetchPosts}?following=true`;
      } else {
        // Don't fetch any posts if not following anyone
        setCultures([]);
        setLoading(false);
        return;
      }
      const res = await axios.get<CultureItem[]>(url, { withCredentials: true });
      setCultures(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCultures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
    setSelectedUser(userId);
    fetchCultures(userId);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(API_ROUTES.deletePost(id), { withCredentials: true });
      setCultures((prev) => prev.filter((culture) => culture.id !== id));
      alert('Entry deleted successfully!');
    } catch {
      // no-op
    }
  };

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
      
      // Update following count and status
      await checkFollowingStatus();
      // Refresh posts after follow/unfollow
      fetchCultures();
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
          {/* Stories Section */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {users.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 p-0.5">
                    <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-gray-300 text-gray-700 text-lg font-bold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <span className="mt-1 text-xs text-gray-800 truncate max-w-[64px]">
                    {user.username}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-orange-500" />
            </div>
          ) : !hasFollowing && filteredCultures.length === 0 ? (
            <div className="text-center py-10">
              <div className="mb-6">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Instagram!
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Follow people to see their photos and videos in your feed.
              </p>
              <button
                onClick={() => router.push('/explore')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Explore
              </button>
            </div>
          ) : filteredCultures.length > 0 ? (
            <div className="space-y-6">
              {filteredCultures.map((culture) => (
                <CulturalEntity
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

        {/* Right Sidebar - Suggestions */}
        <div className="hidden xl:block w-80 px-4 py-6">
          <div className="fixed w-72">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                Suggestions For You
              </h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">Suggested for you</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowToggle(user.id)}
                      className={`text-xs font-semibold transition-colors ${
                        followingStates[user.id] 
                          ? 'text-gray-400 hover:text-gray-600' 
                          : 'text-blue-500 hover:text-blue-700'
                      }`}
                    >
                      {followingStates[user.id] ? 'Following' : 'Follow'}
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
