import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from '../service/app.service';
import { EvaluationResult, Form, FormSession } from '@repo/prisma';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  const mockAppService = {
    getForms: jest.fn(),
    getForm: jest.fn(),
    startSurvey: jest.fn(),
    getSession: jest.fn(),
    saveAnswer: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getForms', () => {
    it('should return forms', async () => {
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

      mockAppService.getForms.mockResolvedValue({ forms: mockForms });

      const result = await controller.getForms();

      expect(result).toEqual({ forms: mockForms });
      expect(mockAppService.getForms).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no forms exist', async () => {
      mockAppService.getForms.mockResolvedValue({ forms: [] });

      const result = await controller.getForms();

      expect(result).toEqual({ forms: [] });
      expect(mockAppService.getForms).toHaveBeenCalledTimes(1);
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

      mockAppService.getForm.mockResolvedValue(mockForm);

      const result = await controller.getForm('form-1');

      expect(result).toEqual(mockForm);
      expect(mockAppService.getForm).toHaveBeenCalledWith('form-1');
      expect(mockAppService.getForm).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when form not found', async () => {
      mockAppService.getForm.mockRejectedValue(
        new NotFoundException('Form not found')
      );

      await expect(controller.getForm('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.getForm('non-existent')).rejects.toThrow(
        'Form not found'
      );
      expect(mockAppService.getForm).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('startSurvey', () => {
    it('should create session and return sessionId', async () => {
      const mockResponse = { sessionId: 'session-1' };

      mockAppService.startSurvey.mockResolvedValue(mockResponse);

      const result = await controller.startSurvey({ formId: 'form-1' });

      expect(result).toEqual(mockResponse);
      expect(mockAppService.startSurvey).toHaveBeenCalledWith('form-1');
      expect(mockAppService.startSurvey).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when form not found', async () => {
      mockAppService.startSurvey.mockRejectedValue(
        new NotFoundException('Form not found')
      );

      await expect(
        controller.startSurvey({ formId: 'non-existent' })
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.startSurvey({ formId: 'non-existent' })
      ).rejects.toThrow('Form not found');
      expect(mockAppService.startSurvey).toHaveBeenCalledWith(
        'non-existent'
      );
    });
  });

  describe('getSession', () => {
    it('should return session when found', async () => {
      const mockSession: FormSession = {
        id: 'session-1',
        formId: 'form-1',
        currentStepId: 'step-1',
        status: 'IN_PROGRESS',
        result: null,
        resultReasons: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAppService.getSession.mockResolvedValue(mockSession);

      const result = await controller.getSession('session-1');

      expect(result).toEqual(mockSession);
      expect(mockAppService.getSession).toHaveBeenCalledWith('session-1');
      expect(mockAppService.getSession).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockAppService.getSession.mockRejectedValue(
        new NotFoundException('Session not found')
      );

      await expect(controller.getSession('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.getSession('non-existent')).rejects.toThrow(
        'Session not found'
      );
      expect(mockAppService.getSession).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('saveAnswer', () => {
    it('should save answer and return success with nextStepId', async () => {
      const mockResponse = {
        success: true,
        nextStepId: 'step-2',
        end: null,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: 10,
      }, 'socket-id');

      expect(result).toEqual(mockResponse);
      expect(mockAppService.saveAnswer).toHaveBeenCalledWith(
        'session-1',
        'step-1',
        10,
        'socket-id'
      );
      expect(mockAppService.saveAnswer).toHaveBeenCalledTimes(1);
    });

    it('should handle string value', async () => {
      const mockResponse = {
        success: true,
        nextStepId: 'step-2',
        end: null,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: 'test-value',
      }, 'socket-id');

      expect(result).toEqual(mockResponse);
      expect(mockAppService.saveAnswer).toHaveBeenCalledWith(
        'session-1',
        'step-1',
        'test-value',
        'socket-id'
      );
    });

    it('should handle array value', async () => {
      const mockResponse = {
        success: true,
        nextStepId: 'step-2',
        end: null,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: ['option-1', 'option-2'],
      }, 'socket-id');

      expect(result).toEqual(mockResponse);
      expect(mockAppService.saveAnswer).toHaveBeenCalledWith(
        'session-1',
        'step-1',
        ['option-1', 'option-2'],
        'socket-id'
      );
    });

    it('should handle boolean value', async () => {
      const mockResponse = {
        success: true,
        nextStepId: 'step-2',
        end: null,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: true,
      }, 'socket-id');

      expect(result).toEqual(mockResponse);
      expect(mockAppService.saveAnswer).toHaveBeenCalledWith(
        'session-1',
        'step-1',
        true,
        'socket-id'
      );
    });

    it('should return end result when survey ends', async () => {
      const mockResponse = {
        success: true,
        nextStepId: null,
        end: EvaluationResult.INELIGIBLE,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: 10,
      });

      expect(result).toEqual(mockResponse);
      expect(result.end).toBe(EvaluationResult.INELIGIBLE);
      expect(result.nextStepId).toBeNull();
    });

    it('should throw NotFoundException when session not found', async () => {
      mockAppService.saveAnswer.mockRejectedValue(
        new NotFoundException('Session not found')
      );

      await expect(
        controller.saveAnswer('non-existent', {
          stepId: 'step-1',
          value: 10,
        })
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.saveAnswer('non-existent', {
          stepId: 'step-1',
          value: 10,
        })
      ).rejects.toThrow('Session not found');
    });

    it('should throw NotFoundException when step not found', async () => {
      mockAppService.saveAnswer.mockRejectedValue(
        new NotFoundException('Step not found')
      );

      await expect(
        controller.saveAnswer('session-1', {
          stepId: 'non-existent',
          value: 10,
        })
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.saveAnswer('session-1', {
          stepId: 'non-existent',
          value: 10,
        })
      ).rejects.toThrow('Step not found');
    });

    it('should throw BadRequestException when step is not current step', async () => {
      mockAppService.saveAnswer.mockRejectedValue(
        new BadRequestException('Step is not the current step')
      );

      await expect(
        controller.saveAnswer('session-1', {
          stepId: 'wrong-step',
          value: 10,
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.saveAnswer('session-1', {
          stepId: 'wrong-step',
          value: 10,
        })
      ).rejects.toThrow('Step is not the current step');
    });

    it('should handle ELIGIBLE result', async () => {
      const mockResponse = {
        success: true,
        nextStepId: null,
        end: EvaluationResult.ELIGIBLE,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: 10,
      });

      expect(result.end).toBe(EvaluationResult.ELIGIBLE);
    });

    it('should handle CLINICAL_REVIEW result', async () => {
      const mockResponse = {
        success: true,
        nextStepId: null,
        end: EvaluationResult.CLINICAL_REVIEW,
      };

      mockAppService.saveAnswer.mockResolvedValue(mockResponse);

      const result = await controller.saveAnswer('session-1', {
        stepId: 'step-1',
        value: 10,
      });

      expect(result.end).toBe(EvaluationResult.CLINICAL_REVIEW);
    });
  });
});
