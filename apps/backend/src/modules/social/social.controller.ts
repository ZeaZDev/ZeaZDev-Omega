import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('profile')
  async createProfile(@Body() body: { userId: string; displayName?: string; bio?: string; avatar?: string }) {
    return this.socialService.createProfile(body.userId, body.displayName, body.bio, body.avatar);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.socialService.getProfile(userId);
  }

  @Put('profile/:userId')
  async updateProfile(@Param('userId') userId: string, @Body() data: { displayName?: string; bio?: string; avatar?: string }) {
    return this.socialService.updateProfile(userId, data);
  }

  @Post('follow')
  async followUser(@Body() body: { followerId: string; followingId: string }) {
    return this.socialService.followUser(body.followerId, body.followingId);
  }

  @Post('unfollow')
  async unfollowUser(@Body() body: { followerId: string; followingId: string }) {
    return this.socialService.unfollowUser(body.followerId, body.followingId);
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.socialService.getFollowers(userId, page || 1, limit || 20);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.socialService.getFollowing(userId, page || 1, limit || 20);
  }

  @Post('post')
  async createPost(@Body() body: { userId: string; content: string }) {
    return this.socialService.createPost(body.userId, body.content);
  }

  @Get('feed/:userId')
  async getFeed(@Param('userId') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.socialService.getFeed(userId, page || 1, limit || 20);
  }

  @Post('post/:postId/like')
  async likePost(@Param('postId') postId: string) {
    return this.socialService.likePost(postId);
  }

  @Get('achievements/:userId')
  async getAchievements(@Param('userId') userId: string) {
    return this.socialService.getAchievements(userId);
  }
}
