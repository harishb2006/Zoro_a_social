import { NextRequest, NextResponse } from 'next/server';
import { PostModel } from '@/lib/db/models/PostModel';
import { UserModel } from '@/lib/db/models/UserModel';
import { handleFileUploads } from '@/lib/utils/file-upload';
import { authenticate } from '@/lib/auth/middleware';

// Format post for response
async function formatPost(post: any, userId?: string) {
  const likedByUser = userId 
    ? await PostModel.hasLiked(post.id, parseInt(userId))
    : false;
  
  const savedByUser = userId 
    ? await PostModel.hasSaved(post.id, parseInt(userId))
    : false;

  // Get creator info
  const creator = await UserModel.findById(post.created_by);
  
  const isFollowing = userId && creator
    ? await UserModel.isFollowing(userId, creator.id)
    : false;

  return {
    id: post.id.toString(),
    caption: post.caption,
    location: post.location,
    tags: post.tags,
    imageUrl: post.image_url,
    videoUrl: post.video_url,
    likes: post.likes ?? 0,
    saves: post.saves ?? 0,
    created_by: post.created_by.toString(),
    creatorUsername: creator?.username || 'User',
    likedByCurrentUser: likedByUser,
    savedByCurrentUser: savedByUser,
    isFollowingCreator: isFollowing,
    isOwnPost: userId ? userId === post.created_by.toString() : false,
  };
}

// GET /api/posts - Fetch all posts
export async function GET(req: NextRequest) {
  try {
    // Get current user if authenticated
    let currentUserId: string | undefined;
    try {
      const user = authenticate(req);
      currentUserId = user?.id;
    } catch {
      // User not authenticated
    }

    // Check query parameters
    const url = new URL(req.url);
    const savedOnly = url.searchParams.get('saved') === 'true';
    const followingOnly = url.searchParams.get('following') === 'true';

    let posts;
    if (savedOnly && currentUserId) {
      posts = await PostModel.findSavedByUser(parseInt(currentUserId));
    } else if (followingOnly && currentUserId) {
      posts = await PostModel.findByFollowing(parseInt(currentUserId));
    } else {
      posts = await PostModel.findAll();
    }

    const formattedPosts = await Promise.all(
      posts.map(post => formatPost(post, currentUserId))
    );

    return NextResponse.json(formattedPosts);
  } catch (error: any) {
    console.error('Posts fetch error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/posts - Create new post
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string || '';
    const tags = formData.get('tags') as string || '';
    const created_by = formData.get('created_by') as string;

    if (!caption || !created_by) {
      return NextResponse.json(
        { message: 'Caption and creator are required' },
        { status: 400 }
      );
    }

    const creator = await UserModel.findById(parseInt(created_by));
    if (!creator) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const { image, video } = await handleFileUploads(formData);

    const post = await PostModel.create({
      caption,
      location,
      tags,
      created_by: parseInt(created_by),
      imageurl: image || undefined,
      videourl: video || undefined,
    });

    const formattedPost = await formatPost(post, created_by);

    return NextResponse.json(
      {
        message: 'Post created successfully!',
        post: formattedPost,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/posts - Update post
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const postId = formData.get('_id') as string;

    if (!postId) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }

    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string || '';
    const tags = formData.get('tags') as string || '';

    if (!caption) {
      return NextResponse.json(
        { message: 'Caption is required' },
        { status: 400 }
      );
    }

    const { image, video } = await handleFileUploads(formData);

    const updateData: any = { caption, location, tags };
    if (image) updateData.image_url = image;
    if (video) updateData.video_url = video;

    const post = await PostModel.update(parseInt(postId), updateData);

    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    const formattedPost = await formatPost(post);

    return NextResponse.json(
      {
        message: 'Post updated successfully!',
        post: formattedPost,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
