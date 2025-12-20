'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import {
  FaComment,
  FaEllipsisH,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaRegBookmark,
} from 'react-icons/fa';
import { BsBookmarkFill } from 'react-icons/bs';
import {
  API_BASE_URL,
  API_ROUTES,
  CultureComment,
  CultureItem,
} from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

type Props = CultureItem & {
  onDelete: (id: string) => void;
};

const colorOptions = [
  'bg-orange-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export default function ZoroEntity({
  id,
  caption,
  location,
  tags,
  imageUrl,
  videoUrl,
  likes = 0,
  saves = 0,
  likedByCurrentUser = false,
  savedByCurrentUser = false,
  created_by,
  creatorUsername,
  isFollowingCreator = false,
  isOwnPost = false,
  onDelete,
  // Legacy support
  CultureName,
  CultureDescription,
  Region,
  Significance,
  ImageURL,
  VideoURL,
  Likes,
}: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Use new fields, fallback to legacy fields
  const displayCaption = caption || CultureName || '';
  const displayLocation = location || Region || '';
  const displayImage = imageUrl || ImageURL;
  const displayVideo = videoUrl || VideoURL;
  const displayLikes = likes || Likes || 0;
  const displayUsername = creatorUsername || displayLocation || 'User';
  
  const [liked, setLiked] = useState(likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(displayLikes);
  const [saved, setSaved] = useState(savedByCurrentUser);
  const [saveCount, setSaveCount] = useState(saves);
  const [comments, setComments] = useState<CultureComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(isFollowingCreator);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  // Update liked state when likedByCurrentUser prop changes
  useEffect(() => {
    setLiked(likedByCurrentUser);
  }, [likedByCurrentUser]);

  // Update saved state when savedByCurrentUser prop changes
  useEffect(() => {
    setSaved(savedByCurrentUser);
  }, [savedByCurrentUser]);

  // Update following state when prop changes
  useEffect(() => {
    setIsFollowing(isFollowingCreator);
  }, [isFollowingCreator]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !created_by) {
      alert('Please login to follow users.');
      return;
    }

    if (isFollowing) {
      setShowUnfollowModal(true);
      return;
    }

    // Follow
    const previousState = isFollowing;
    setIsFollowing(true);

    try {
      const response = await axios.put(
        API_ROUTES.followUser(created_by),
        {},
        { withCredentials: true }
      );
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      setIsFollowing(previousState);
      alert('Failed to follow user.');
    }
  };

  const handleUnfollow = async () => {
    const previousState = isFollowing;
    setIsFollowing(false);
    setShowUnfollowModal(false);

    try {
      const response = await axios.put(
        API_ROUTES.followUser(created_by!),
        {},
        { withCredentials: true }
      );
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      setIsFollowing(previousState);
      alert('Failed to unfollow user.');
    }
  };

  const accentColor = useMemo(() => {
    if (!id) {
      return colorOptions[0];
    }
    const hash = Array.from(id).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return colorOptions[hash % colorOptions.length];
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(
          API_ROUTES.comments(id),
          { withCredentials: true }
        );
        if (res.data.comments && Array.isArray(res.data.comments)) {
          setComments(res.data.comments);
          setCommentCount(res.data.count || res.data.comments.length);
        } else if (Array.isArray(res.data)) {
          // Fallback for old API format
          setComments(res.data);
          setCommentCount(res.data.length);
        } else {
          setComments([]);
          setCommentCount(0);
        }
      } catch {
        setComments([]);
        setCommentCount(0);
      }
    };

    fetchComments();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please login to like posts.');
      return;
    }

    // Optimistic update
    const newLikedState = !liked;
    const previousLiked = liked;
    const previousCount = likeCount;
    
    setLiked(newLikedState);
    setLikeCount((prev: number) => newLikedState ? (prev ?? 0) + 1 : Math.max((prev ?? 1) - 1, 0));

    try {
      const response = await axios.put(
        API_ROUTES.likePost(id),
        {},
        { withCredentials: true }
      );
      
      // Sync with server response
      if (response.data.likes !== undefined) {
        setLikeCount(response.data.likes);
      }
    } catch (error: any) {
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      alert('Failed to update like. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      alert('Please login to save posts.');
      return;
    }

    // Optimistic update
    const newSavedState = !saved;
    const previousSaved = saved;
    const previousSaveCount = saveCount;
    
    setSaved(newSavedState);
    setSaveCount((prev) => newSavedState ? (prev ?? 0) + 1 : Math.max((prev ?? 1) - 1, 0));

    try {
      const response = await axios.put(
        API_ROUTES.savePost(id),
        {},
        { withCredentials: true }
      );
      
      // Sync with server response
      if (response.data.saves !== undefined) {
        setSaveCount(response.data.saves);
      }
    } catch (error: any) {
      // Revert on error
      setSaved(previousSaved);
      setSaveCount(previousSaveCount);
      alert('Failed to update save. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated || !user) {
      alert('Please login to comment.');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      await axios.post(
        API_ROUTES.addComment(id),
        {
          item_id: id,
          user_id: user.id,
          comment: commentText,
        },
        { withCredentials: true }
      );
      setCommentText('');
      
      // Refresh comments with backend response
      const res = await axios.get(
        API_ROUTES.comments(id),
        { withCredentials: true }
      );
      if (res.data.comments && Array.isArray(res.data.comments)) {
        setComments(res.data.comments);
        setCommentCount(res.data.count || res.data.comments.length);
      } else if (Array.isArray(res.data)) {
        setComments(res.data);
        setCommentCount(res.data.length);
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const assetUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm ${accentColor}`}>
            {displayUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">{displayUsername}</span>
            {!isOwnPost && isAuthenticated && created_by && (
              <>
                <span className="text-gray-400">•</span>
                <button
                  onClick={handleFollowToggle}
                  className={`text-xs font-semibold ${
                    isFollowing
                      ? 'text-gray-900'
                      : 'text-blue-500 hover:text-blue-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>
        {isOwnPost && (
          <>
            <button type="button" onClick={() => setShowOptions(!showOptions)} className="text-gray-900">
              <FaEllipsisH />
            </button>
            {showOptions && (
              <div className="absolute right-4 mt-32 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <button onClick={() => router.push(`/form/${id}`)} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Edit</button>
                <button onClick={() => onDelete(id)} className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100">Delete</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Media */}
      {displayImage && (
        <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
          <Image 
            src={assetUrl(displayImage) || '/images/photo-1585607344893-43a4bd91169a.png'} 
            alt={displayCaption} 
            fill 
            className="object-cover" 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            quality={85}
          />
        </div>
      )}
      {displayVideo && (
        <video 
          src={assetUrl(displayVideo) || undefined} 
          controls 
          className="w-full" 
          style={{ maxHeight: '600px' }}
          preload="metadata"
          playsInline
        />
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4">
        <button 
          onClick={handleLike} 
          className="hover:opacity-60 transition-all active:scale-90"
          title={liked ? 'Liked' : 'Like'}
        >
          {liked ? (
            <FaHeart className="text-red-500 text-[26px]" />
          ) : (
            <FaRegHeart className="text-gray-900 text-[26px]" />
          )}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="hover:opacity-60 transition-all active:scale-90"
          title="Comment"
        >
          <FaComment className="text-gray-900 text-[26px]" />
        </button>
        <button 
          className="hover:opacity-60 transition-all active:scale-90"
          title="Share"
        >
          <FaShare className="text-gray-900 text-[26px]" />
        </button>
        <button 
          onClick={handleSave} 
          className="ml-auto hover:opacity-60 transition-all active:scale-90"
          title={saved ? 'Unsave' : 'Save'}
        >
          {saved ? (
            <BsBookmarkFill className="text-gray-900 text-[26px]" />
          ) : (
            <FaRegBookmark className="text-gray-900 text-[26px]" />
          )}
        </button>
      </div>

      {/* Likes */}
      <div className="px-4 pb-2">
        <button className="font-semibold text-sm text-gray-900 hover:text-gray-600">
          {likeCount === 1 ? '1 like' : `${likeCount} likes`}
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-2">
        <p className="text-sm">
          <span className="font-semibold mr-2">{displayLocation || 'User'}</span>
          {displayCaption}
        </p>
        {(CultureDescription || Significance) && (
          <p className="text-sm text-gray-600 mt-1">
            {CultureDescription || Significance}
          </p>
        )}
      </div>

      {/* Comments */}
      {commentCount > 0 && !showComments && (
        <button 
          onClick={() => setShowComments(true)} 
          className="px-4 pb-2 text-sm text-gray-500 hover:text-gray-700"
        >
          View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      {showComments && (
        <div className="px-4 pb-3">
          <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                    {(comment.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2 text-gray-900">{comment.username || 'User'}</span>
                    <span className="text-gray-900">{comment.comment}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 border-t border-gray-200 pt-4 items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
            />
            <button 
              onClick={handleAddComment} 
              disabled={!commentText.trim()} 
              className="text-blue-500 font-semibold text-sm disabled:opacity-30 hover:text-blue-700"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUnfollowModal(false)}>
          <div className="bg-white rounded-lg w-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 text-center border-b border-gray-300">
              <div className={`flex h-20 w-20 mx-auto mb-4 items-center justify-center rounded-full text-white font-bold text-2xl ${accentColor}`}>
                {displayUsername.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-gray-900">Unfollow @{displayUsername}?</p>
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
