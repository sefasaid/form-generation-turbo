import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '@repo/prisma';
import { EvaluateBranchService } from './evaluate-branch.service';
import {
  EvaluationResult,
  Form,
  FormAnswer,
  FormBranchRule,
  FormSession,
  FormStep,
  SessionStatus,
  StepType,
} from '@repo/prisma';
import { SocketService } from './socket.service';
describe('AppService', () => {
  let service: AppService;

  const mockPrismaService = {
    form: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    formSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    formStep: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    formAnswer: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    formOptionalRule: {
      findMany: jest.fn(),
    },
  };

  const mockEvaluateBranchService = {
    evaluateBranch: jest.fn(),
    evaluateOptionalRule: jest.fn(),
    computeValue: jest.fn(),
  };

  const mockSocketService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EvaluateBranchService,
          useValue: mockEvaluateBranchService,
        },
        {
          provide: SocketService,
          useValue: mockSocketService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getForms', () => {
    it('should return forms with steps, options, and branches', async () => {
      const mockForms: Form[] = [
        {
          id: 'form-1',
          key: 'glp1',
          name: 'Test Form',
          version: 1,
          startStepId: 'step-1',
          createdAt: new Date(),
          startStepKey: 'step-1',
          description: 'Test Description',
          isActive: true,
        },
      ];

      mockPrismaService.form.findMany.mockResolvedValue(mockForms);

      const result = await service.getForms();

      expect(result.forms).toEqual(mockForms);
      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith({
        include: {
          steps: {
            include: {
              options: true,
              branches: true,
            },
          },
        },
        orderBy: {
          version: 'desc',
        },
        distinct: ['key'],
      });
    });

    it('should return empty array when no forms exist', async () => {
      mockPrismaService.form.findMany.mockResolvedValue([]);

      const result = await service.getForms();

      expect(result.forms).toEqual([]);
    });
  });

  describe('getForm', () => {
    it('should return form when found', async () => {
      const mockForm: Form = {
        id: 'form-1',
        key: 'glp1',
        name: 'Test Form',
        version: 1,
        startStepId: 'step-1',
        createdAt: new Date(),
        startStepKey: 'step-1',
        description: 'Test Description',
        isActive: true,
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);

      const result = await service.getForm('form-1');

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.form.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-1' },
        include: {
          steps: {
            include: {
              options: true,
              branches: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.getForm('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getForm('non-existent')).rejects.toThrow(
        'Form not found'
      );
    });
  });

  describe('startSurvey', () => {
    it('should create session and return sessionId', async () => {
      const mockForm = {
        id: 'form-1',
        startStepId: 'step-1',
        startStepKey: 'step-1',
        description: 'Test Description',
        isActive: true,
      };

      const mockSession: FormSession = {
        id: 'session-1',
        formId: 'form-1',
        currentStepId: 'step-1',
        status: SessionStatus.IN_PROGRESS,
        result: null,
        resultReasons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSession.create.mockResolvedValue(mockSession);

      const result = await service.startSurvey('form-1');

      expect(result.sessionId).toBe('session-1');
      expect(mockPrismaService.form.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-1' },
        select: {
          startStepId: true,
        },
      });
      expect(mockPrismaService.formSession.create).toHaveBeenCalledWith({
        data: {
          formId: 'form-1',
          currentStepId: 'step-1',
        },
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.startSurvey('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.startSurvey('non-existent')).rejects.toThrow(
        'Form not found'
      );
    });

    it('should throw NotFoundException when form has no startStepId', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue({
        id: 'form-1',
        startStepId: null,
      });

      await expect(service.startSurvey('form-1')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.startSurvey('form-1')).rejects.toThrow(
        'Form not found'
      );
    });
  });

  describe('getSession', () => {
    it('should return session when found', async () => {
      const mockSession: FormSession & {
        currentStep: FormStep & { branches: FormBranchRule[]; options: any[] };
        form: any;
        answers: FormAnswer[];
      } = {
        id: 'session-1',
        formId: 'form-1',
        currentStepId: 'step-1',
        status: SessionStatus.IN_PROGRESS,
        result: null,
        resultReasons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        currentStep: {
          id: 'step-1',
          formId: 'form-1',
          key: 'step1',
          type: StepType.NUMBER,
          prompt: 'Test',
          minValue: null,
          maxValue: null,
          computeExpr: null,
          nextStepId: null,
          createdAt: new Date(),
          branches: [],
          options: [],
          version: 1,
          nextStepKey: null,
        },
        form: {
          _count: {
            steps: 5,
          },
        },
        answers: [],
      };

      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);

      const result = await service.getSession('session-1');

      expect(result).toEqual(mockSession);
      expect(mockPrismaService.formSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        include: {
          currentStep: {
            include: {
              branches: true,
              options: true,
            },
          },
          form: {
            include: {
              _count: {
                select: {
                  steps: {
                    where: {
                      type: {
                        not: StepType.COMPUTED,
                      },
                    },
                  },
                },
              },
            },
          },
          answers: true,
        },
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.formSession.findUnique.mockResolvedValue(null);

      await expect(service.getSession('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getSession('non-existent')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('saveAnswer', () => {
    const mockSession: FormSession = {
      id: 'session-1',
      formId: 'form-1',
      currentStepId: 'step-1',
      status: SessionStatus.IN_PROGRESS,
      result: null,
      resultReasons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockStep: FormStep & { branches: FormBranchRule[]; form: Form } = {
      id: 'step-1',
      formId: 'form-1',
      key: 'step1',
      type: StepType.NUMBER,
      prompt: 'Test',
      minValue: null,
      maxValue: null,
      computeExpr: null,
      nextStepId: 'step-2',
      createdAt: new Date(),
      branches: [],
      form: {
        id: 'form-1',
        key: 'glp1',
        name: 'Test Form',
        version: 1,
        startStepId: 'step-1',
        createdAt: new Date(),
        startStepKey: 'step-1',
        description: 'Test Description',
        isActive: true,
      },
      version: 1,
      nextStepKey: null,
    };

    const mockAnswer: FormAnswer = {
      id: 'answer-1',
      sessionId: 'session-1',
      stepId: 'step-1',
      value: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.formSession.findUnique.mockResolvedValue(null);

      await expect(
        service.saveAnswer('non-existent', 'step-1', 10)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.saveAnswer('non-existent', 'step-1', 10)
      ).rejects.toThrow('Session not found');
    });

    it('should throw NotFoundException when step not found', async () => {
      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(null);

      await expect(
        service.saveAnswer('session-1', 'non-existent', 10)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.saveAnswer('session-1', 'non-existent', 10)
      ).rejects.toThrow('Step not found');
    });

    it('should throw BadRequestException when step is not current step', async () => {
      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(mockStep);

      await expect(
        service.saveAnswer('session-1', 'step-2', 10)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.saveAnswer('session-1', 'step-2', 10)
      ).rejects.toThrow('Step is not the current step');
    });



    it('should handle branch result with END type and INELIGIBLE', async () => {
      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.formAnswer.create.mockResolvedValue(mockAnswer);
      mockPrismaService.formAnswer.findMany.mockResolvedValue([mockAnswer]);
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue({
        type: 'END',
        result: EvaluationResult.INELIGIBLE,
        reason: 'Value too low',
      });
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.COMPLETED,
        result: EvaluationResult.INELIGIBLE,
        resultReasons: ['Value too low'],
      });

      const result = await service.saveAnswer('session-1', 'step-1', 10);

      expect(result.success).toBe(true);
      expect(result.nextStepId).toBeNull();
      expect(result.end).toBe(EvaluationResult.INELIGIBLE);
      expect(mockPrismaService.formSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          status: 'COMPLETED',
          result: EvaluationResult.INELIGIBLE,
          resultReasons: ['Value too low'],
        },
      });
    });


    it('should handle optional rules when no nextStepId and no branch result', async () => {
      const stepWithoutNext: FormStep & {
        branches: FormBranchRule[];
        form: Form;
      } = {
        ...mockStep,
        nextStepId: null,
      };

      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(stepWithoutNext);
      mockPrismaService.formAnswer.create.mockResolvedValue(mockAnswer);
      mockPrismaService.formAnswer.findMany.mockResolvedValue([mockAnswer]);
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue(null);
      mockPrismaService.formOptionalRule.findMany.mockResolvedValue([]);
      mockEvaluateBranchService.evaluateOptionalRule.mockReturnValue([]);
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.COMPLETED,
        result: EvaluationResult.ELIGIBLE,
        resultReasons: ['FORM_COMPLETED'],
      });

      const result = await service.saveAnswer('session-1', 'step-1', 10);

      expect(result.success).toBe(true);
      expect(result.nextStepId).toBeNull();
      expect(result.end).toBe(EvaluationResult.ELIGIBLE);
      expect(mockPrismaService.formOptionalRule.findMany).toHaveBeenCalledWith({
        where: { formId: 'form-1' },
        include: {
          keyValues: true,
        },
      });
    });

    it('should handle optional rules with results', async () => {
      const stepWithoutNext: FormStep & {
        branches: FormBranchRule[];
        form: Form;
      } = {
        ...mockStep,
        nextStepId: null,
      };

      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(stepWithoutNext);
      mockPrismaService.formAnswer.create.mockResolvedValue(mockAnswer);
      mockPrismaService.formAnswer.findMany.mockResolvedValue([mockAnswer]);
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue(null);
      mockPrismaService.formOptionalRule.findMany.mockResolvedValue([]);
      mockEvaluateBranchService.evaluateOptionalRule.mockReturnValue([
        {
          result: EvaluationResult.INELIGIBLE,
          reason: 'Optional rule reason',
        },
      ]);
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.COMPLETED,
        result: EvaluationResult.INELIGIBLE,
        resultReasons: ['Optional rule reason'],
      });

      const result = await service.saveAnswer('session-1', 'step-1', 10);

      expect(result.success).toBe(true);
      expect(result.nextStepId).toBeNull();
      expect(result.end).toBe(EvaluationResult.INELIGIBLE);
    });


    it('should handle computed step that ends with result', async () => {
      const computedStep: FormStep & {
        branches: FormBranchRule[];
        form: Form;
      } = {
        ...mockStep,
        type: StepType.COMPUTED,
        computeExpr: 'age + weight',
        nextStepId: 'step-2',
      };

      mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.formStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.formAnswer.create.mockResolvedValue(mockAnswer);
      mockPrismaService.formAnswer.findMany.mockResolvedValue([mockAnswer]);

      // First evaluateBranch call for the normal step returns null
      // Second evaluateBranch call for computed step returns END
      mockEvaluateBranchService.evaluateBranch
        .mockResolvedValueOnce(null) // For normal step
        .mockResolvedValueOnce({
          type: 'END',
          result: EvaluationResult.INELIGIBLE,
          reason: 'Computed value too high',
        }); // For computed step

      // First update: after normal step, moves to computed step
      mockPrismaService.formSession.update
        .mockResolvedValueOnce({
          ...mockSession,
          currentStepId: 'step-2',
          currentStep: computedStep,
          answers: [mockAnswer],
        })
        .mockResolvedValueOnce({
          ...mockSession,
          status: SessionStatus.COMPLETED,
          result: EvaluationResult.INELIGIBLE,
          resultReasons: ['Computed value too high'],
        });

      // For saveAnswerWithComputedStep
      mockPrismaService.formStep.findMany.mockResolvedValue([
        {
          id: 'step-1',
          key: 'age',
        },
      ]);
      mockEvaluateBranchService.computeValue.mockReturnValue(30);
      mockPrismaService.formAnswer.upsert.mockResolvedValue({
        ...mockAnswer,
        value: 30,
      });

      const result = await service.saveAnswer('session-1', 'step-1', 10);

      expect(result.success).toBe(true);
      expect(result.nextStepId).toBeNull();
      expect(result.end).toBe(EvaluationResult.INELIGIBLE);
    });
  });

  describe('saveAnswerWithComputedStep', () => {
    const mockSession: FormSession & {
      currentStep: FormStep & { branches: FormBranchRule[] };
      answers: FormAnswer[];
    } = {
      id: 'session-1',
      formId: 'form-1',
      currentStepId: 'step-computed',
      status: SessionStatus.IN_PROGRESS,
      result: null,
      resultReasons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStep: {
        id: 'step-computed',
        formId: 'form-1',
        key: 'computed_step',
        type: StepType.COMPUTED,
        prompt: null,
        minValue: null,
        maxValue: null,
        computeExpr: 'age + weight',
        nextStepId: 'step-2',
        createdAt: new Date(),
        branches: [],
        version: 1,
        nextStepKey: null,
      },
      answers: [
        {
          id: 'answer-1',
          sessionId: 'session-1',
          stepId: 'step-1',
          value: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'answer-2',
          sessionId: 'session-1',
          stepId: 'step-2',
          value: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it('should compute value and return nextStepId', async () => {
      mockPrismaService.formStep.findMany.mockResolvedValue([
        {
          id: 'step-1',
          key: 'age',
        },
        {
          id: 'step-2',
          key: 'weight',
        },
        {
          id: 'step-computed',
          key: 'computed_step',
        },
      ]);
      mockEvaluateBranchService.computeValue.mockReturnValue(30);
      mockPrismaService.formAnswer.upsert.mockResolvedValue({
        id: 'answer-computed',
        sessionId: 'session-1',
        stepId: 'step-computed',
        value: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue(null);
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        currentStepId: 'step-2',
      });

      const result = await service.saveAnswerWithComputedStep(mockSession);

      expect(result.nextStepId).toBe('step-2');
      expect(result.end).toBeUndefined();
      expect(mockEvaluateBranchService.computeValue).toHaveBeenCalledWith({
        expr: 'age + weight',
        answers: mockSession.answers,
        stepKeyMap: expect.any(Map),
      });
      expect(mockPrismaService.formAnswer.upsert).toHaveBeenCalled();
    });

    it('should handle branch result with END type', async () => {
      mockPrismaService.formStep.findMany.mockResolvedValue([
        {
          id: 'step-1',
          key: 'age',
        },
        {
          id: 'step-2',
          key: 'weight',
        },
      ]);
      mockEvaluateBranchService.computeValue.mockReturnValue(30);
      mockPrismaService.formAnswer.upsert.mockResolvedValue({
        id: 'answer-computed',
        sessionId: 'session-1',
        stepId: 'step-computed',
        value: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue({
        type: 'END',
        result: EvaluationResult.INELIGIBLE,
        reason: 'Computed value too high',
      });
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.COMPLETED,
        result: EvaluationResult.INELIGIBLE,
        resultReasons: ['Computed value too high'],
      });

      const result = await service.saveAnswerWithComputedStep(mockSession);

      expect(result.nextStepId).toBeNull();
      expect(result.end).toBe(EvaluationResult.INELIGIBLE);
      expect(mockPrismaService.formSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          status: 'COMPLETED',
          result: EvaluationResult.INELIGIBLE,
          resultReasons: ['Computed value too high'],
        },
        include: {
          answers: true,
          currentStep: {
            include: {
              branches: true,
            },
          },
        },
      });
    });

    it('should use step.nextStepId when no branch result', async () => {
      mockPrismaService.formStep.findMany.mockResolvedValue([
        {
          id: 'step-1',
          key: 'age',
        },
      ]);
      mockEvaluateBranchService.computeValue.mockReturnValue(30);
      mockPrismaService.formAnswer.upsert.mockResolvedValue({
        id: 'answer-computed',
        sessionId: 'session-1',
        stepId: 'step-computed',
        value: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEvaluateBranchService.evaluateBranch.mockResolvedValue(null);
      mockPrismaService.formSession.update.mockResolvedValue({
        ...mockSession,
        currentStepId: 'step-2',
      });

      const result = await service.saveAnswerWithComputedStep(mockSession);

      expect(result.nextStepId).toBe('step-2');
    });
  });
});
