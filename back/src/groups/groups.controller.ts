import { Controller, Post, Get, Body, UseGuards, Req, Param, NotFoundException, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { SpotifyService } from '../spotify/spotify.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private spotifyService: SpotifyService,
    private prisma: PrismaService
  ) {}

  @Post()
  async createGroup(@Body() data: { name: string }, @Req() req) {
    return this.groupsService.createGroup(data.name, req.user.id);
  }

  @Get()
  async getMyGroups(@Req() req) {
    return this.groupsService.getUserGroups(req.user.id);
  }

  @Get(':id')
  async getGroupDetails(@Param('id') id: string) {
    return this.groupsService.getGroupWithMembers(id);
  }

  @Post('join')
  async joinGroup(@Body() data: { groupId: string }, @Req() req) {
    return this.groupsService.joinGroup(data.groupId, req.user.id);
  }

  @Get('invite-code/:groupId')
  async generateInviteCode(@Param('groupId') groupId: string) {
    return this.groupsService.generateInviteCode(groupId);
  }

  @Post('join-by-code')
  async joinByCode(@Body() data: { code: string }, @Req() req) {
    return this.groupsService.joinByCode(data.code, req.user.id);
  }

  @Post(':id/update-tracks')
  async updateMemberTracks(
    @Param('id') groupId: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const member = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.spotifyService.updateMemberCurrentTrack(member.id);
    await this.spotifyService.updateMemberTopTrack(member.id);

    return this.groupsService.getGroupWithMembers(groupId);
  }
} 