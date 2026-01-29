import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@repo/prisma';
import { EvaluationResult, Form, FormAnswer, FormSession, StepType } from '@repo/prisma';
import { EvaluateBranchService } from './evaluate-branch.service';
import { FormStep, FormBranchRule } from '@repo/prisma';
import { SocketService } from './socket.service';
@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluateBranchService: EvaluateBranchService,
    private readonly socketService: SocketService
  ) { }
  async getForms(): Promise<{ forms: Form[] }> {
    // Get all forms
    const forms = await this.prisma.form.findMany({
      include: {
        steps: {
          include: {
            options: true,
            branches: true
          }
        }
      },
      orderBy: {
        version: 'desc',
      },
      distinct: ['key'],
    });



    return { forms };
  }

  async getForm(id: string): Promise<Form> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            options: true,
            branches: true
          }
        }
      },
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  async startSurvey(formId: string): Promise<{ sessionId: string }> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: {
        startStepId: true,
      },
    });
    if (!form || !form.startStepId) {
      throw new NotFoundException('Form not found');
    }
    const session = await this.prisma.formSession.create({
      data: {
        formId,
        currentStepId: form.startStepId,
      },
    });
    return { sessionId: session.id };
  }

  async getSession(id: string): Promise<FormSession> {
    const session = await this.prisma.formSession.findUnique({
      where: { id },
      include: {
        currentStep: {
          include: {
            branches: true,
            options: true
          }
        },
        form: {
          include: {
            _count: {
              select: {
                steps: {
                  where: {
                    type: {
                      not: StepType.COMPUTED
                    }
                  }
                }
              },
            }
          }
        },
        answers: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }


    return session;
  }

  async saveAnswer(sessionId: string, stepId: string, value: string | number | string[] | boolean, socketId?: string): Promise<{ success: boolean, nextStepId: string | null, end: EvaluationResult | null }> {
    const session = await this.prisma.formSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const step = await this.prisma.formStep.findUnique({
      where: { id: stepId },
      include: {
        branches: true,
        form: true
      },
    });
    if (!step) {
      throw new NotFoundException('Step not found');
    }
    if (session.currentStepId !== stepId) {
      throw new BadRequestException('Step is not the current step');
    }
    await this.prisma.formAnswer.create({
      data: {
        sessionId,
        stepId,
        value,
      },
    });

    const answers = await this.prisma.formAnswer.findMany({
      where: { sessionId },
      include: { step: true }
    })

    const branchResult = await this.evaluateBranchService.evaluateBranch(step, answers);
    let nextStepId: string | null = null

    if (branchResult) {
      if (branchResult.type === 'END') {
        const resultReasons = [...(session.resultReasons || []), branchResult.reason ?? '']
        await this.prisma.formSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            result: branchResult.result,
            resultReasons: resultReasons
          }
        })

        this.socketService.sendMessage(sessionId, 'RELOAD', socketId);

        return {
          success: true,
          end: branchResult.result,
          nextStepId: null
        }
      }

      if (branchResult.type === 'NEXT_STEP') {
        nextStepId = branchResult.nextStepId
        if (branchResult.reason) {
          const resultReasons = [...(session.resultReasons || []), branchResult.reason ?? '']
          await this.prisma.formSession.update({
            where: { id: sessionId },
            data: {
              resultReasons: resultReasons
            }
          })
        }
      }
    }

    if (!nextStepId) {
      if (!step.nextStepId) {
        const optionalRules = await this.prisma.formOptionalRule.findMany({
          where: { formId: session.formId },
          include: {
            keyValues: true
          }
        })
        const optionalRuleResults = this.evaluateBranchService.evaluateOptionalRule(optionalRules, answers);
        let result = session.result ?? EvaluationResult.ELIGIBLE
        if (optionalRuleResults.length > 0 && optionalRuleResults[0]) {
          result = optionalRuleResults[0].result
        }
        const resultReasons = [...(session.resultReasons || []), ...optionalRuleResults.map(r => r.reason)]
        await this.prisma.formSession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            result: result,
            resultReasons: resultReasons.length > 0 ? resultReasons : ['FORM_COMPLETED']
          }
        })
        this.socketService.sendMessage(sessionId, 'RELOAD', socketId);
        return { success: true, nextStepId: null, end: result }
      }
      nextStepId = step.nextStepId
    }

    let updatedSession = await this.prisma.formSession.update({
      where: { id: sessionId },
      data: {
        currentStepId: nextStepId
      },
      include: {
        currentStep: {
          include: {
            branches: true
          }
        },
        answers: true
      }
    })

    while (updatedSession?.currentStep.type === 'COMPUTED') {
      const { session, nextStepId: nextStepIdFromComputedStep, end } = await this.saveAnswerWithComputedStep(updatedSession, socketId);
      updatedSession = session;
      nextStepId = nextStepIdFromComputedStep ?? null;
      if (end) {
        return {
          success: true,
          nextStepId: null,
          end: end
        }
      }
    }



    return {
      success: true,
      nextStepId: nextStepId,
      end: null,
    }
  }

  async saveAnswerWithComputedStep(session: FormSession & { currentStep: FormStep & { branches: FormBranchRule[] }, answers: FormAnswer[] }, socketId?: string) {
    const step: FormStep & { branches: FormBranchRule[] } = session.currentStep

    const stepKeyMap = new Map<string, string>()
    const steps = await this.prisma.formStep.findMany({
      where: { formId: session.formId },
    })
    steps.forEach(step => {
      stepKeyMap.set(step.id, step.key)
    })
    const computedValue = this.evaluateBranchService.computeValue({
      expr: step.computeExpr!,
      answers: session.answers,
      stepKeyMap
    })

    await this.prisma.formAnswer.upsert({
      where: {
        sessionId_stepId: {
          sessionId: session.id,
          stepId: step.id
        }
      },
      update: { value: computedValue },
      create: {
        sessionId: session.id,
        stepId: step.id,
        value: computedValue
      }
    })


    session.answers.push({
      stepId: step.id,
      value: computedValue
    } as any)

    const branchResult = await this.evaluateBranchService.evaluateBranch(step, session.answers);

    let nextStepId: string | null = null

    if (branchResult && branchResult.type === 'END') {
      const resultReasons = [...(session.resultReasons || []), branchResult.reason ?? '']
      const updatedSession = await this.prisma.formSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          result: branchResult.result,
          resultReasons: resultReasons
        },
        include: {
          currentStep: {
            include: {
              branches: true
            }
          },
          answers: true
        }
      })
      this.socketService.sendMessage(session.id, 'RELOAD', socketId);
      return {
        nextStepId: null,
        end: branchResult.result,
        session: updatedSession as any
      }
    }

    if (branchResult && branchResult.type === 'NEXT_STEP') {
      nextStepId = branchResult.nextStepId
    }

    if (!nextStepId) {
      nextStepId = step.nextStepId
    }

    session = await this.prisma.formSession.update({
      where: { id: session.id },
      data: {
        currentStepId: nextStepId!
      },
      include: {
        currentStep: {
          include: {
            branches: true
          }
        },
        answers: true
      }
    })
    this.socketService.sendMessage(session.id, 'RELOAD', socketId);
    return { session, nextStepId };
  }
}
