import { NextRequest, NextResponse } from 'next/server';
import { UserService, PostService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';
import { handleFileUploads } from '@/lib/utils/file-upload';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const user = await UserService.findById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get user's posts
    const posts = await PostService.findByUserId(userId);
    
    // Get followers and following
    const following = await UserService.getFollowing(userId);
    const followers = await UserService.getFollowers(userId);

    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      bio: user.bio || '',
      profilePic: user.profile_picture || null,
      followersCount: followers.length,
      followingCount: following.length,
      following,
      followers,
      posts: posts.map((post: any) => ({
        id: post._id.toString(),
        imageUrl: post.imageurl,
        videoUrl: post.videourl,
        likes: post.likes || 0,
        saves: post.saves || 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Authenticate user
    const authUser = authenticate(req);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Check if user is updating their own profile
    if (authUser.id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string;

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    const updateData: any = {
      username: username.trim(),
      bio: bio?.trim() || '',
    };

    // Handle profile picture upload
    const { image } = await handleFileUploads(formData);
    if (image) {
      updateData.profile_picture = image;
    }

    const user = await UserService.update(userId, updateData);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        username: user.username,
        bio: user.bio,
        profilePic: user.profile_picture,
      },
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
