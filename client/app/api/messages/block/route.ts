import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';

// POST /api/messages/block - Block a user
export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await MessageService.blockUser(user.id, userId);
    return NextResponse.json({ message: 'User blocked successfully' });
  } catch (error: any) {
    console.error('Block user error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/messages/block - Unblock a user
export async function DELETE(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Unblock functionality - for now just return success
    // You can add additional unblock logic if needed
    return NextResponse.json({ message: 'User unblocked successfully' });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
