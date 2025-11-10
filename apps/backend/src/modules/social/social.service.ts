import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, displayName?: string, bio?: string, avatar?: string) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: { displayName, bio, avatar },
      create: { userId, displayName, bio, avatar },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatar?: string }) {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      throw new Error('Already following this user');
    }

    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId },
      }),
      this.prisma.userProfile.update({
        where: { userId: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      this.prisma.userProfile.update({
        where: { userId: followingId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) {
      throw new Error('Not following this user');
    }

    await this.prisma.$transaction([
      this.prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      }),
      this.prisma.userProfile.update({
        where: { userId: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
      this.prisma.userProfile.update({
        where: { userId: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
    });
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
    });
  }

  async createPost(userId: string, content: string) {
    return this.prisma.communityPost.create({
      data: { userId, content },
    });
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    return this.prisma.communityPost.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async likePost(postId: string) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
    });
  }

  async addExperience(userId: string, xp: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const newExp = profile.experience + xp;
    const newLevel = Math.floor(newExp / 1000) + 1;

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        experience: newExp,
        level: newLevel,
      },
    });
  }

  async unlockAchievement(userId: string, achievementType: string, title: string, description: string, xpReward: number) {
    const existing = await this.prisma.achievement.findFirst({
      where: { userId, achievementType },
    });

    if (existing) {
      return existing;
    }

    const achievement = await this.prisma.achievement.create({
      data: {
        userId,
        achievementType,
        title,
        description,
        xpReward,
      },
    });

    if (xpReward > 0) {
      await this.addExperience(userId, xpReward);
    }

    return achievement;
  }

  async getAchievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async getLeaderboard(limit = 20) {
    return this.prisma.userProfile.findMany({
      orderBy: [
        { level: 'desc' },
        { experience: 'desc' },
      ],
      take: limit,
      select: {
        userId: true,
        displayName: true,
        avatar: true,
        level: true,
        experience: true,
      },
    });
  }
}
