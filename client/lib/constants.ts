// Since backend is now in the same Next.js app, use relative API paths
export const API_BASE_URL = '';

export const API_ROUTES = {
  fetchPosts: `/api/posts`,
  users: `/api/users`,
  postsByUser: (userId: string | number) => `/api/posts/user/${userId}`,
  deletePost: (id: string | number) => `/api/posts/${id}`,
  likePost: (id: string | number) => `/api/posts/${id}/like`,
  savePost: (id: string | number) => `/api/posts/${id}/save`,
  comments: (id: string | number) => `/api/posts/${id}/comments`,
  addComment: (id: string | number) => `/api/posts/${id}/comments`,
  createPost: `/api/posts`,
  updatePost: `/api/posts`,
  signup: `/api/auth/signup`,
  login: `/api/auth/login`,
  LOGOUT: `/api/auth/logout`,
  followUser: (userId: string | number) => `/api/users/${userId}/follow`,
  getUser: (userId: string | number) => `/api/users/${userId}`,
  updateUser: (userId: string | number) => `/api/users/${userId}`,
};

export interface UserSummary {
  id: string;
  username: string;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  caption?: string;
  location?: string;
  tags?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  likes?: number | null;
  saves?: number | null;
  created_by?: string | null;
  creatorUsername?: string;
  likedByCurrentUser?: boolean;
  savedByCurrentUser?: boolean;
  isFollowingCreator?: boolean;
  isOwnPost?: boolean;
  // Legacy fields for backwards compatibility
  CultureName?: string;
  CultureDescription?: string;
  Region?: string;
  Significance?: string;
  ImageURL?: string | null;
  VideoURL?: string | null;
  Likes?: number | null;
}

export interface Comment {
  id: string;
  user_id: string;
  comment: string;
  username?: string | null;
  created_at?: string;
}

// Legacy support - keep old names pointing to new ones
export type CultureItem = Post;
export type CultureComment = Comment;
