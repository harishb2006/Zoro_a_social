import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = authenticate(req);
    const { id } = await params;
    
    const post = await PostService.findById(id);
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Get post error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = authenticate(req);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if post exists and belongs to user
    const post = await PostService.findById(id);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const createdBy = post.created_by?._id?.toString() || post.created_by?.toString();
    if (createdBy !== authUser.id) {
      return NextResponse.json({ message: 'Unauthorized to delete this post' }, { status: 403 });
    }

    // Delete post (cascade will handle related data)
    await PostService.delete(id);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

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
    const { caption, location, tags } = await req.json();

    // Check if post exists and belongs to user
    const post = await PostService.findById(id);

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    const createdBy = post.created_by?._id?.toString() || post.created_by?.toString();
    if (createdBy !== authUser.id) {
      return NextResponse.json({ message: 'Unauthorized to edit this post' }, { status: 403 });
    }

    // Update post
    const updatedPost = await PostService.update(id, {
      caption: caption || '',
      location: location || '',
      tags: tags || '',
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('Update post error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
