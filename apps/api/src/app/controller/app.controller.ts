import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from '../service/app.service';
import { EvaluationResult, Form, FormSession } from '@repo/prisma';
import { SocketId } from '../decorator/socket-id.decorator';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getForms(): Promise<{ forms: Form[] }> {
    return this.appService.getForms();
  }

  @Get(':id')
  getForm(@Param('id') id: string): Promise<Form> {
    return this.appService.getForm(id);
  }

  @Post('forms/start')
  startSurvey(@Body() body: { formId: string }): Promise<{ sessionId: string }> {
    return this.appService.startSurvey(body.formId);
  }

  @Get('forms/session/:id')
  getSession(@Param('id') id: string): Promise<FormSession> {
    return this.appService.getSession(id);
  }

  @Post('forms/session/:id/answer')
  saveAnswer(
    @Param('id') id: string,
    @Body() body: { stepId: string, value: string | number | string[] | boolean },
    @SocketId() socketId?: string,
  ): Promise<{ success: boolean, nextStepId: string | null, end: EvaluationResult | null }> {
    return this.appService.saveAnswer(id, body.stepId, body.value, socketId);
  }
}

