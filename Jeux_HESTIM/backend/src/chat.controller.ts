import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('context/:userId')
  async getContext(@Param('userId') userId: number) {
    return await this.chatService.getContextForUser(userId);
  }

  @Get('animateur-summary')
  async getAnimateurSummary() {
    return await this.chatService.getAnimateurSummary();
  }

  @Get('animateur-alertes')
  async getAlertes() {
    return await this.chatService.getAlertesAnimateur();
  }
}
