import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { UserService } from '@/lib/db/services';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authUser = authenticate(req);
    if (!authUser) {
      console.log('No authenticated user found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching following for user:', authUser.id);

    // Get the list of users that the current user follows
    const followingUsers = await UserService.getFollowingWithDetails(authUser.id);

    console.log('Found following users:', followingUsers.length);

    return NextResponse.json(followingUsers);
  } catch (error: any) {
    console.error('Error fetching following users:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
