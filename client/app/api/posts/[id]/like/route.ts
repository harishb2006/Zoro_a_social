import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = authenticate(req);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = authUser.id;

    // Check if already liked
    const isLiked = await PostService.hasLiked(id, userId);

    if (isLiked) {
      // Unlike
      await PostService.unlike(id, userId);
      return NextResponse.json({
        message: 'Post unliked',
        liked: false,
      });
    } else {
      // Like
      await PostService.like(id, userId);
      return NextResponse.json({
        message: 'Post liked',
        liked: true,
      });
    }
  } catch (error: any) {
    console.error('Like error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
