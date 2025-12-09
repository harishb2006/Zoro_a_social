import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/services';
import { authenticate } from '@/lib/auth/middleware';
import User from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    let currentUserId: string | undefined;
    try {
      const user = authenticate(req);
      currentUserId = user?.id;
    } catch {
      // User not authenticated
    }

    const allUsers = await User.find().select('_id username profile_picture');

    const usersWithFollowStatus = await Promise.all(
      allUsers
        .filter((user: any) => user._id.toString() !== currentUserId) // Exclude current user
        .map(async (user: any) => {
          const isFollowing = currentUserId
            ? await UserService.isFollowing(currentUserId, user._id.toString())
            : false;
          
          return {
            id: user._id.toString(),
            username: user.username,
            isFollowing,
          };
        })
    );

    return NextResponse.json(usersWithFollowStatus);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
