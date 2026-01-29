import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '@repo/prisma';
import {
    Form,
    FormSession,
    FormStep,
    FormOption,
    FormBranchRule,
    FormOptionalRule,
    FormOptionalRuleKeyValue,
    StepType,
    Operator,
    EvaluationResult,
    SessionStatus,
} from '@repo/prisma';
import { FormResponseDto } from '../dto/form-response.dto';

describe('AdminService', () => {
    let service: AdminService;

    const mockPrismaService = {
        form: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        formStep: {
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        formOption: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        formBranchRule: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        formOptionalRule: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        formOptionalRuleKeyValue: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        formSession: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);

        jest.clearAllMocks();
    });

    describe('getForms', () => {
        it('should return forms with all relations', async () => {
            const mockForms: Form[] = [
                {
                    id: 'form-1',
                    key: 'test-form',
                    name: 'Test Form',
                    version: 1,
                    startStepId: 'step-1',
                    startStepKey: 'step1',
                    description: 'Test Description',
                    isActive: true,
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.form.findMany.mockResolvedValue(mockForms);

            const result = await service.getForms();

            expect(result.forms).toEqual(mockForms);
            expect(mockPrismaService.form.findMany).toHaveBeenCalledWith({
                where: {
                    isActive: true,
                },
                include: {
                    steps: {
                        include: {
                            options: true,
                            branches: true,
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                    formOptionalRules: {
                        include: {
                            keyValues: {
                                include: {
                                    step: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    version: 'desc',
                },
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
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: 'step-1',
                createdAt: new Date(),
            } as Form;

            mockPrismaService.form.findFirst.mockResolvedValue(mockForm);

            const result = await service.getForm('test-form');

            expect(result).toEqual(mockForm);
            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { key: 'test-form', isActive: true },
                orderBy: {
                    version: 'desc',
                },
                include: {
                    steps: {
                        include: {
                            options: true,
                            branches: true,
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                    formOptionalRules: {
                        include: {
                            keyValues: {
                                include: {
                                    step: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should throw NotFoundException when form not found', async () => {
            mockPrismaService.form.findFirst.mockResolvedValue(null);

            await expect(service.getForm('non-existent')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.getForm('non-existent')).rejects.toThrow(
                'Form not found',
            );
        });
    });

    describe('getSessions', () => {
        it('should return sessions with form and answers', async () => {
            const mockSessions: FormSession[] = [
                {
                    id: 'session-1',
                    formId: 'form-1',
                    currentStepId: 'step-1',
                    status: SessionStatus.IN_PROGRESS,
                    result: null,
                    resultReasons: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as FormSession,
            ];

            mockPrismaService.formSession.findMany.mockResolvedValue(mockSessions);

            const result = await service.getSessions();

            expect(result.sessions).toEqual(mockSessions);
            expect(mockPrismaService.formSession.findMany).toHaveBeenCalledWith({
                include: {
                    form: {
                        select: {
                            id: true,
                            key: true,
                            name: true,
                            version: true,
                        },
                    },
                    currentStep: {
                        select: {
                            id: true,
                            key: true,
                            type: true,
                        },
                    },
                    answers: {
                        include: {
                            step: {
                                select: {
                                    id: true,
                                    key: true,
                                    type: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });

        it('should return empty array when no sessions exist', async () => {
            mockPrismaService.formSession.findMany.mockResolvedValue([]);

            const result = await service.getSessions();

            expect(result.sessions).toEqual([]);
        });
    });

    describe('getSession', () => {
        it('should return session when found', async () => {
            const mockSession: FormSession = {
                id: 'session-1',
                formId: 'form-1',
                currentStepId: 'step-1',
                status: SessionStatus.COMPLETED,
                result: EvaluationResult.ELIGIBLE,
                resultReasons: ['Reason 1'],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as FormSession;

            mockPrismaService.formSession.findUnique.mockResolvedValue(mockSession);

            const result = await service.getSession('session-1');

            expect(result).toEqual(mockSession);
            expect(mockPrismaService.formSession.findUnique).toHaveBeenCalledWith({
                where: { id: 'session-1' },
                include: {
                    form: {
                        include: {
                            steps: {
                                include: {
                                    options: true,
                                    branches: true,
                                },
                            },
                        },
                    },
                    currentStep: {
                        include: {
                            options: true,
                            branches: true,
                        },
                    },
                    answers: {
                        include: {
                            step: {
                                include: {
                                    options: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            });
        });

        it('should throw NotFoundException when session not found', async () => {
            mockPrismaService.formSession.findUnique.mockResolvedValue(null);

            await expect(service.getSession('non-existent')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.getSession('non-existent')).rejects.toThrow(
                'Session not found',
            );
        });
    });

    describe('createOrUpdateFormFromJson', () => {
        const mockFormData: FormResponseDto = {
            id: 'form-1',
            key: 'test-form',
            name: 'Test Form',
            version: 1,
            startStepId: 'step-1',
            startStepKey: 'step1',
            createdAt: new Date(),
            steps: [
                {
                    id: 'step-1',
                    key: 'step1',
                    type: StepType.TEXT,
                    prompt: 'Enter your name',
                    minValue: null,
                    maxValue: null,
                    computeExpr: null,
                    nextStepId: 'step-2',
                    options: [
                        {
                            id: 'option-1',
                            value: 'yes',
                            label: 'Yes',
                            order: 1,
                        },
                    ],
                    branches: [
                        {
                            id: 'branch-1',
                            operator: Operator.EQ,
                            compareValue: 'test',
                            nextStepId: null,
                            nextStepKey: null,
                            endResult: EvaluationResult.ELIGIBLE,
                            endReason: 'Test reason',
                            priority: 0,
                        },
                    ],
                },
            ],
            formOptionalRules: [
                {
                    id: 'rule-1',
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Rule reason',
                    priority: 0,
                    keyValues: [
                        {
                            id: 'kv-1',
                            stepId: 'step-1',
                            value: 'test',
                            step: {
                                id: 'step-1',
                                key: 'step1',
                                type: StepType.TEXT,
                            },
                        },
                    ],
                },
            ],
        };


        it('should update existing form when key is provided and form exists', async () => {
            const existingForm = {
                id: 'form-1',
                key: 'test-form',
                name: 'Old Name',
                version: 1,
                startStepId: null,
                createdAt: new Date(),
            };

            // Mock findFirst to return existing form
            mockPrismaService.form.findFirst.mockResolvedValueOnce(existingForm);
            mockPrismaService.form.updateMany.mockResolvedValue({ count: 1 });
            mockPrismaService.form.create.mockResolvedValue({
                ...existingForm,
                version: 2,
            });
            mockPrismaService.formStep.create.mockResolvedValue({
                id: 'step-1',
                key: 'step1',
                formId: 'form-1',
            } as FormStep);
            mockPrismaService.formOption.create.mockResolvedValue({
                id: 'option-1',
            } as FormOption);
            mockPrismaService.formBranchRule.create.mockResolvedValue({
                id: 'branch-1',
            } as FormBranchRule);
            mockPrismaService.formOptionalRule.create.mockResolvedValue({
                id: 'rule-1',
            } as FormOptionalRule);
            mockPrismaService.formOptionalRuleKeyValue.create.mockResolvedValue({
                id: 'kv-1',
            } as FormOptionalRuleKeyValue);
            mockPrismaService.form.update.mockResolvedValue({
                ...existingForm,
                version: 2,
                startStepId: 'step-1',
            });
            // Mock for getForm call at the end
            mockPrismaService.form.findFirst.mockResolvedValueOnce({
                ...existingForm,
                key: 'test-form',
                name: 'Test Form',
                version: 2,
                startStepId: 'step-1',
                steps: [],
                formOptionalRules: [],
            } as unknown as Form);

            const result = await service.createOrUpdateFormFromJson(mockFormData);

            expect(mockPrismaService.form.findFirst).toHaveBeenCalledWith({
                where: { key: 'test-form', isActive: true },
                orderBy: { version: 'desc' },
            });
            expect(mockPrismaService.form.updateMany).toHaveBeenCalledWith({
                where: { key: 'test-form' },
                data: { isActive: false },
            });
            expect(mockPrismaService.form.create).toHaveBeenCalledWith({
                data: {
                    key: 'test-form',
                    name: 'Test Form',
                    version: 2,
                    startStepKey: mockFormData.startStepKey || null,
                },
            });
            expect(result).toBeDefined();
        });

        it('should create new form when id is provided but form does not exist', async () => {
            // Mock findFirst to return null (no existing form)
            mockPrismaService.form.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.form.create.mockResolvedValue({
                id: 'form-1',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: null,
                createdAt: new Date(),
            });
            mockPrismaService.formStep.create.mockResolvedValue({
                id: 'step-1',
                key: 'step1',
                formId: 'form-1',
            } as FormStep);
            mockPrismaService.formOption.create.mockResolvedValue({
                id: 'option-1',
            } as FormOption);
            mockPrismaService.formBranchRule.create.mockResolvedValue({
                id: 'branch-1',
            } as FormBranchRule);
            mockPrismaService.formOptionalRule.create.mockResolvedValue({
                id: 'rule-1',
            } as FormOptionalRule);
            mockPrismaService.formOptionalRuleKeyValue.create.mockResolvedValue({
                id: 'kv-1',
            } as FormOptionalRuleKeyValue);
            mockPrismaService.form.update.mockResolvedValue({
                id: 'form-1',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: 'step-1',
            });
            // Mock for getForm call at the end
            mockPrismaService.form.findFirst.mockResolvedValueOnce({
                id: 'form-1',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: 'step-1',
                createdAt: new Date(),
                steps: [],
                formOptionalRules: [],
            } as unknown as Form);

            const result = await service.createOrUpdateFormFromJson(mockFormData);

            expect(mockPrismaService.form.create).toHaveBeenCalledWith({
                data: {
                    id: 'form-1',
                    key: 'test-form',
                    name: 'Test Form',
                    version: 1,
                    startStepKey: mockFormData.startStepKey || null,
                },
            });
            expect(result).toBeDefined();
        });

        it('should create steps with options and branches', async () => {
            const formDataWithoutId = { ...mockFormData, id: '' } as FormResponseDto;
            const createdForm = {
                id: 'new-form-id',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: null,
                createdAt: new Date(),
            };

            // Mock findFirst to return null (no existing form)
            mockPrismaService.form.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.form.create.mockResolvedValue(createdForm);
            mockPrismaService.formStep.create.mockResolvedValue({
                id: 'step-1',
                key: 'step1',
                formId: 'new-form-id',
            } as FormStep);
            mockPrismaService.formOption.create.mockResolvedValue({
                id: 'option-1',
            } as FormOption);
            mockPrismaService.formBranchRule.create.mockResolvedValue({
                id: 'branch-1',
            } as FormBranchRule);
            mockPrismaService.formOptionalRule.create.mockResolvedValue({
                id: 'rule-1',
            } as FormOptionalRule);
            mockPrismaService.formOptionalRuleKeyValue.create.mockResolvedValue({
                id: 'kv-1',
            } as FormOptionalRuleKeyValue);
            // Mock for getForm call at the end
            mockPrismaService.form.findFirst.mockResolvedValueOnce({
                ...createdForm,
                steps: [],
                formOptionalRules: [],
            } as unknown as Form);

            await service.createOrUpdateFormFromJson(formDataWithoutId);

            expect(mockPrismaService.formStep.create).toHaveBeenCalled();
            expect(mockPrismaService.formBranchRule.create).toHaveBeenCalled();
        });

        it('should create optional rules with key values', async () => {
            const formDataWithoutId = { ...mockFormData, id: '' } as FormResponseDto;
            const createdForm = {
                id: 'new-form-id',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: null,
                createdAt: new Date(),
            };

            // Mock findFirst to return null (no existing form)
            mockPrismaService.form.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.form.create.mockResolvedValue(createdForm);
            mockPrismaService.formStep.create.mockResolvedValue({
                id: 'step-1',
                key: 'step1',
                formId: 'new-form-id',
            } as FormStep);
            mockPrismaService.formOption.create.mockResolvedValue({
                id: 'option-1',
            } as FormOption);
            mockPrismaService.formBranchRule.create.mockResolvedValue({
                id: 'branch-1',
            } as FormBranchRule);
            mockPrismaService.formOptionalRule.create.mockResolvedValue({
                id: 'rule-1',
            } as FormOptionalRule);
            mockPrismaService.formOptionalRuleKeyValue.create.mockResolvedValue({
                id: 'kv-1',
            } as FormOptionalRuleKeyValue);
            // Mock for getForm call at the end
            mockPrismaService.form.findFirst.mockResolvedValueOnce({
                ...createdForm,
                steps: [],
                formOptionalRules: [],
            } as unknown as Form);

            await service.createOrUpdateFormFromJson(formDataWithoutId);

            expect(mockPrismaService.formOptionalRule.create).toHaveBeenCalled();
            expect(mockPrismaService.formOptionalRuleKeyValue.create).toHaveBeenCalled();
        });

        it('should handle form with no steps', async () => {
            const formDataWithoutSteps = {
                ...mockFormData,
                id: '',
                steps: [],
                formOptionalRules: [],
            } as FormResponseDto;

            const createdForm = {
                id: 'new-form-id',
                key: 'test-form',
                name: 'Test Form',
                version: 1,
                startStepId: null,
                createdAt: new Date(),
            };

            // Mock findFirst to return null (no existing form)
            mockPrismaService.form.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.form.create.mockResolvedValue(createdForm);
            // Mock for getForm call at the end
            mockPrismaService.form.findFirst.mockResolvedValueOnce({
                ...createdForm,
                steps: [],
                formOptionalRules: [],
            } as unknown as Form);

            const result = await service.createOrUpdateFormFromJson(formDataWithoutSteps);

            expect(mockPrismaService.formStep.create).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });
});
