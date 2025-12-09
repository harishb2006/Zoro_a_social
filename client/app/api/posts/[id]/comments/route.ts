import { NextRequest, NextResponse } from 'next/server';
import { CommentService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await CommentService.findByPostId(id);
    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = authenticate(req);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { comment } = await req.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ message: 'Comment text is required' }, { status: 400 });
    }

    const newComment = await CommentService.create({
      post_id: id,
      user_id: authUser.id,
      text: comment.trim()
    });
    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
