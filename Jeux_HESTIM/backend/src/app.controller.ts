import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('login')
  async login(@Body() loginData: any) {
    return this.appService.login(loginData);
  }

  @Post('register')
  async register(@Body() userData: any) {
    return this.appService.register(userData);
  }

  @Get('classes')
  async getClasses() {
    return this.appService.getClasses();
  }

  @Get('matieres/:classeId')
  async getMatieresByClasse(@Param('classeId') classeId: number) {
    return this.appService.getMatieresByClasse(classeId);
  }

  @Get('admin/dashboard')
  async getAdminDashboard() {
    return this.appService.getAdminDashboard();
  }

  @Post('admin/sessions')
  async createSession(@Body() sessionData: any) {
    return this.appService.createSession(sessionData);
  }

  @Get('admin/sessions')
  async getSessions() {
    return this.appService.getSessions();
  }

  @Get('participant/dashboard/:id')
  async getParticipantDashboard(@Param('id') id: number) {
    return this.appService.getParticipantDashboard(id);
  }

  @Get('enseignant/dashboard/:id')
  async getEnseignantDashboard(@Param('id') id: number) {
    return this.appService.getEnseignantDashboard(id);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: number) {
    return this.appService.getSessionDetails(id);
  }

  @Post('sessions/:id/assign-groups')
  async assignGroups(@Param('id') id: number, @Body() body: { assignments: { userId: number, groupeId: number }[] }) {
    return this.appService.assignGroupsToSessionParticipants(body.assignments);
  }

  @Post('users/:id/remove-from-group')
  async removeFromGroup(@Param('id') id: number) {
    return this.appService.removeUserFromGroup(id);
  }

  @Post('groupes/:id/progression')
  async updateProgression(@Param('id') id: number, @Body('progression') progression: number) {
    return this.appService.updateGroupeProgression(id, progression);
  }

  @Post('groupes/:id/commentaire')
  async updateCommentaire(@Param('id') id: number, @Body('commentaire') commentaire: string) {
    return this.appService.updateGroupeCommentaire(id, commentaire);
  }

  @Get('groupes')
  async getGroupes() {
    return this.appService.getGroupes();
  }

  @Put('admin/sessions/:id')
  async updateSession(@Param('id') id: number, @Body() sessionData: any) {
    return this.appService.updateSession(id, sessionData);
  }

  @Delete('admin/sessions/:id')
  async deleteSession(@Param('id') id: number) {
    return this.appService.deleteSession(id);
  }

  @Post('sessions/:id/end')
  async endSession(@Param('id') id: number) {
    return this.appService.endSession(id);
  }

  @Delete('admin/users/:id')
  async deleteUser(@Param('id') id: number) {
    return this.appService.deleteUser(id);
  }

  @Put('admin/users/:id')
  async updateUser(@Param('id') id: number, @Body() data: any) {
    return this.appService.updateUser(id, data);
  }

  @Post('auto-assign/:classeId')
  async autoAssigner(@Param('classeId') classeId: number) {
    return this.appService.autoAssignerGroupes(classeId);
  }

  @Get('chat/context/:userId')
  async getContext(@Param('userId') userId: number) {
    return await this.appService.getContextForUser(userId);
  }

  @Get('chat/animateur-summary')
  async getAnimateurSummary(@Query('classeId') classeId?: number) {
    return await this.appService.getAnimateurSummary(classeId);
  }

  @Get('chat/animateur-alertes')
  async getAlertes() {
    return await this.appService.getAlertesAnimateur();
  }

  // --- ROUTES REACTIK V2 ---

  @Get('reactik/state/:sessionId/:groupeId')
  async getReactikState(@Param('sessionId') sessionId: number, @Param('groupeId') groupeId: number) {
    return this.appService.getReactikState(sessionId, groupeId);
  }

  @Post('reactik/update/:sessionId/:groupeId')
  async updateReactikPhase(
    @Param('sessionId') sessionId: number, 
    @Param('groupeId') groupeId: number,
    @Body() body: { phase: number, data?: any }
  ) {
    return this.appService.updateReactikPhase(sessionId, groupeId, body.phase, body.data);
  }
}
