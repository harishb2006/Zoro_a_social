'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { FaBookmark, FaComment, FaEllipsisH, FaShare, FaHeart, FaRegHeart } from 'react-icons/fa';
import { API_BASE_URL, API_ROUTES, Comment, Post } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

type Props = Post & {
  onDelete: (id: string) => void;
};

const colorOptions = ['bg-orange-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];

export default function PostCard({
  id,
  caption,
  location,
  tags,
  imageUrl,
  videoUrl,
  likes = 0,
  likedByCurrentUser = false,
  onDelete,
}: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(likes);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    setLiked(likedByCurrentUser);
  }, [likedByCurrentUser]);

  const accentColor = useMemo(() => {
    if (!id) return colorOptions[0];
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorOptions[hash % colorOptions.length];
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get<Comment[]>(API_ROUTES.comments(id), { withCredentials: true });
        setComments(Array.isArray(res.data) ? res.data : []);
      } catch {
        setComments([]);
      }
    };
    fetchComments();
    
    // Real-time polling for comments every 10 seconds
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please login to like posts.');
      return;
    }

    // Optimistic update
    const wasLiked = liked;
    const previousCount = likeCount;
    
    setLiked(!liked);
    setLikeCount(liked ? Math.max(0, (likeCount ?? 0) - 1) : (likeCount ?? 0) + 1);

    try {
      await axios.put(API_ROUTES.likePost(id), {}, { withCredentials: true });
    } catch (error: any) {
      // Revert on error
      setLiked(wasLiked);
      setLikeCount(previousCount);
      console.error('Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated || !user) {
      alert('Please login to comment.');
      return;
    }
    if (!commentText.trim()) return;

    const tempComment: Comment = {
      id: Date.now().toString(),
      user_id: user.id,
      username: user.username,
      comment: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic update - add comment immediately
    setComments(prev => [...prev, tempComment]);
    const savedText = commentText;
    setCommentText('');

    try {
      await axios.post(API_ROUTES.addComment(id), {
        item_id: id,
        user_id: user.id,
        comment: savedText,
      }, { withCredentials: true });
      
      // Fetch fresh comments to get the real ID
      const res = await axios.get<Comment[]>(API_ROUTES.comments(id), { withCredentials: true });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      // Revert on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
      setCommentText(savedText);
      alert('Failed to add comment.');
    }
  };

  const assetUrl = (path?: string | null): string => {
    if (!path) return '/images/photo-1585607344893-43a4bd91169a.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-sm mb-6">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm ${accentColor}`}>
            {(location || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900 block">{location || 'Unknown'}</span>
            {tags && <span className="text-xs text-gray-500">{tags}</span>}
          </div>
        </div>
        <button type="button" onClick={() => setShowOptions(!showOptions)} className="text-gray-900">
          <FaEllipsisH />
        </button>
        {showOptions && (
          <div className="absolute right-4 mt-32 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <button onClick={() => router.push(`/form/${id}`)} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Edit</button>
            <button onClick={() => onDelete(id)} className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100">Delete</button>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
          <Image 
            src={assetUrl(imageUrl)} 
            alt={caption || 'Post image'} 
            fill 
            className="object-cover" 
            sizes="100vw" 
          />
        </div>
      )}
      {videoUrl && (
        <video 
          src={assetUrl(videoUrl)} 
          controls 
          className="w-full" 
          style={{ maxHeight: '600px' }} 
        />
      )}

      <div className="px-4 py-2 flex items-center gap-4">
        <button onClick={handleLike} className="hover:opacity-60">
          {liked ? <FaHeart className="text-red-500 text-2xl" /> : <FaRegHeart className="text-2xl" />}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="hover:opacity-60">
          <FaComment className="text-2xl" />
        </button>
        <button className="hover:opacity-60">
          <FaShare className="text-2xl" />
        </button>
        <button onClick={() => setSaved(!saved)} className="ml-auto hover:opacity-60">
          <FaBookmark className={`text-2xl ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="px-4 pb-2">
        <span className="font-semibold text-sm">{likeCount} likes</span>
      </div>

      <div className="px-4 pb-2">
        <p className="text-sm">
          <span className="font-semibold mr-2">{location || 'User'}</span>
          {caption}
        </p>
      </div>

      {comments.length > 0 && !showComments && (
        <button onClick={() => setShowComments(true)} className="px-4 pb-2 text-sm text-gray-500">
          View all {comments.length} comments
        </button>
      )}

      {showComments && (
        <div className="px-4 pb-3 border-t border-gray-200 pt-3">
          <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold mr-2">{comment.username || 'User'}</span>
                {comment.comment}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-gray-200 pt-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 text-sm outline-none text-black"
            />
            <button onClick={handleAddComment} disabled={!commentText.trim()} className="text-blue-500 font-semibold text-sm disabled:opacity-50">
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
