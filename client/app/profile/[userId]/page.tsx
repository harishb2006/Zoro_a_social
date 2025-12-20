'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Image from 'next/image';
import { FaUser, FaCog } from 'react-icons/fa';
import { BsGrid3X3 } from 'react-icons/bs';
import Sidebar from '@/components/Navbar';
import { PostCardSkeleton } from '@/components/LoadingSkeleton';
import { API_ROUTES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  profilePic: string | null;
  followersCount: number;
  followingCount: number;
  posts: {
    id: string;
    imageUrl: string | null;
    videoUrl: string | null;
    likes: number;
    saves: number;
  }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/${userId}`, { withCredentials: true });
      setProfile(res.data);

      // Check if current user is following this profile
      if (user && !isOwnProfile) {
        const currentUserRes = await axios.get(`/api/users/${user.id}`, { withCredentials: true });
        const following = currentUserRes.data.following || [];
        setIsFollowing(following.some((id: string) => id === userId));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, user, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (isFollowing) {
      setShowUnfollowModal(true);
      return;
    }

    // Follow
    const previousState = isFollowing;
    setIsFollowing(true);
    setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);

    try {
      await axios.put(API_ROUTES.followUser(userId), {}, { withCredentials: true });
    } catch (error) {
      setIsFollowing(previousState);
      setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);
      alert('Failed to follow user.');
    }
  };

  const handleUnfollow = async () => {
    const previousState = isFollowing;
    setIsFollowing(false);
    setShowUnfollowModal(false);
    setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);

    try {
      await axios.put(API_ROUTES.followUser(userId), {}, { withCredentials: true });
    } catch (error) {
      setIsFollowing(previousState);
      setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
      alert('Failed to unfollow user.');
    }
  };

  const handleSendMessage = async () => {
    try {
      // Check if conversation already exists
      const convRes = await axios.get('/api/messages', { withCredentials: true });
      const existingConversation = convRes.data.find(
        (c: any) => c.other_user_id.toString() === userId
      );
      
      if (existingConversation) {
        // Navigate to existing conversation
        router.push(`/messages/${existingConversation.id}`);
      } else {
        // Create new conversation by navigating to a special route
        // We'll create the conversation when the first message is sent
        router.push(`/messages/new?userId=${userId}&username=${profile?.username || 'User'}`);
      }
    } catch (error: any) {
      console.error('Error checking conversations:', error);
      // Just navigate to messages page
      router.push('/messages');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="md:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="flex items-start gap-8">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />
        <div className="flex md:ml-64 items-center justify-center h-screen">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="flex items-start gap-8 md:gap-20 mb-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profilePic ? (
                <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border border-gray-300">
                  <Image 
                    src={profile.profilePic} 
                    alt={profile.username} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 128px, 160px"
                    priority
                    quality={90}
                  />
                </div>
              ) : (
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                  <FaUser className="text-white text-5xl md:text-6xl" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-xl md:text-2xl font-light">{profile.username}</h1>
                {isOwnProfile ? (
                  <Link
                    href="/profile/edit"
                    className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold inline-block"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`px-6 py-1.5 rounded-lg text-sm font-semibold ${
                        isFollowing
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
                    >
                      Message
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <FaCog className="text-xl text-gray-700" />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 mb-4">
                <div>
                  <span className="font-semibold">{profile.posts.length}</span>
                  <span className="text-gray-600"> posts</span>
                </div>
                <button className="hover:opacity-60">
                  <span className="font-semibold">{profile.followersCount}</span>
                  <span className="text-gray-600"> followers</span>
                </button>
                <button className="hover:opacity-60">
                  <span className="font-semibold">{profile.followingCount}</span>
                  <span className="text-gray-600"> following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="text-sm">
                  <p className="whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-300">
            <div className="flex justify-center gap-12">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 py-3 text-xs tracking-widest font-semibold ${
                  activeTab === 'posts'
                    ? 'text-gray-900 border-t border-gray-900'
                    : 'text-gray-400'
                }`}
              >
                <BsGrid3X3 />
                POSTS
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="mt-8">
            {profile.posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {profile.posts.map((post) => (
                  <Link
                    key={post.id}
                    href="/home"
                    className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden block"
                  >
                    {post.imageUrl ? (
                      <Image
                        src={post.imageUrl}
                        alt="Post"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                        loading="lazy"
                        quality={75}
                      />
                    ) : post.videoUrl ? (
                      <video
                        src={post.videoUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No media</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-6 text-white">
                        <div className="flex items-center gap-2">
                          <span>♥</span>
                          <span className="font-semibold">{post.likes}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="inline-block p-4 border-2 border-gray-900 rounded-full">
                    <BsGrid3X3 className="text-4xl text-gray-900" />
                  </div>
                </div>
                <p className="text-2xl font-light text-gray-900 mb-1">No Posts Yet</p>
                {isOwnProfile && (
                  <p className="text-sm text-gray-500">
                    Share your first photo or video
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowUnfollowModal(false)}
        >
          <div
            className="bg-white rounded-lg w-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center border-b border-gray-300">
              {profile.profilePic ? (
                <div className="relative h-20 w-20 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image src={profile.profilePic} alt={profile.username} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                  <FaUser className="text-white text-3xl" />
                </div>
              )}
              <p className="text-sm text-gray-900">Unfollow @{profile.username}?</p>
            </div>
            <button
              onClick={handleUnfollow}
              className="w-full py-3 text-sm font-bold text-red-500 hover:bg-gray-50 border-b border-gray-300"
            >
              Unfollow
            </button>
            <button
              onClick={() => setShowUnfollowModal(false)}
              className="w-full py-3 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
