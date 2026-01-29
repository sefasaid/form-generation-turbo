import { Test } from '@nestjs/testing';
import { EvaluateBranchService } from './evaluate-branch.service';
import {
    EvaluationResult,
    FormAnswer,
    FormBranchRule,
    FormOptionalRule,
    FormOptionalRuleKeyValue,
    FormStep,
    Operator,
    StepType,
} from '@repo/prisma';

describe('EvaluateBranchService', () => {
    let service: EvaluateBranchService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [EvaluateBranchService],
        }).compile();

        service = module.get<EvaluateBranchService>(EvaluateBranchService);
    });

    describe('evaluateBranch', () => {
        const mockStep: FormStep = {
            id: 'step-1',
            formId: 'form-1',
            nextStepKey: null,
            version: 1,
            key: 'test-step',
            type: StepType.NUMBER,
            prompt: 'Test prompt',
            minValue: null,
            maxValue: null,
            computeExpr: null,
            nextStepId: null,
            createdAt: new Date(),
        };

        it('should return null when step has no branches', async () => {
            const step = { ...mockStep, branches: [] };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toBeNull();
        });

        it('should return null when no answer exists for the step', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-2',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toBeNull();
        });

        it('should return null when no rules match', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 20,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toBeNull();
        });

        it('should return NEXT_STEP when rule matches with nextStepId', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toEqual({
                type: 'NEXT_STEP',
                nextStepId: 'step-2',
            });
        });

        it('should return END with INELIGIBLE when rule matches with endResult INELIGIBLE', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: null,
                        nextStepKey: null,
                        endResult: EvaluationResult.INELIGIBLE,
                        endReason: 'Value too low',
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toEqual({
                type: 'END',
                result: EvaluationResult.INELIGIBLE,
                reason: 'Value too low',
            });
        });

        it('should return NEXT_STEP with CLINICAL_REVIEW when rule matches with endResult CLINICAL_REVIEW', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: EvaluationResult.CLINICAL_REVIEW,
                        endReason: 'Requires review',
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toEqual({
                type: 'NEXT_STEP',
                nextStepId: 'step-2',
                reason: 'Requires review',
            });
        });

        it('should respect priority ordering - higher priority rules evaluated first', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-low-priority',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                    {
                        id: 'branch-2',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-high-priority',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 10,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toEqual({
                type: 'NEXT_STEP',
                nextStepId: 'step-high-priority',
            });
        });

        it('should handle undefined reason gracefully', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: null,
                        nextStepKey: null,
                        endResult: EvaluationResult.INELIGIBLE,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toEqual({
                type: 'END',
                result: EvaluationResult.INELIGIBLE,
                reason: undefined,
            });
        });
    });

    describe('evaluateCondition (tested through evaluateBranch)', () => {
        const mockStep: FormStep = {
            id: 'step-1',
            formId: 'form-1',
            key: 'test-step',
            type: StepType.NUMBER,
            prompt: 'Test prompt',
            minValue: null,
            maxValue: null,
            computeExpr: null,
            nextStepId: null,
            nextStepKey: null,
            version: 1,
            createdAt: new Date(),
        };

        it('should return false for null answer', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toBeNull();
        });

        it('should return false for undefined answer', async () => {
            const step: FormStep & { branches: FormBranchRule[] } = {
                ...mockStep,
                branches: [
                    {
                        id: 'branch-1',
                        stepId: 'step-1',
                        operator: Operator.EQ,
                        compareValue: 10,
                        nextStepId: 'step-2',
                        nextStepKey: null,
                        endResult: null,
                        endReason: null,
                        priority: 0,
                    },
                ],
            };
            const answers: FormAnswer[] = [];

            const result = await service.evaluateBranch(step, answers);
            expect(result).toBeNull();
        });

        describe('EQ operator', () => {
            it('should match equal values', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.EQ,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 10,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
                expect(result?.type).toBe('NEXT_STEP');
            });

            it('should not match unequal values', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.EQ,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 20,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).toBeNull();
            });
        });

        describe('NEQ operator', () => {
            it('should match non-equal values', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.NEQ,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 20,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });
        });

        describe('GT operator', () => {
            it('should match when answer is greater than compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.GT,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 15,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });

            it('should not match when answer is equal to compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.GT,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 10,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).toBeNull();
            });
        });

        describe('GTE operator', () => {
            it('should match when answer is greater than or equal to compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.GTE,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 10,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });
        });

        describe('LT operator', () => {
            it('should match when answer is less than compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.LT,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });
        });

        describe('LTE operator', () => {
            it('should match when answer is less than or equal to compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.LTE,
                            compareValue: 10,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 10,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });
        });

        describe('INCLUDES operator', () => {
            it('should match when array includes compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.INCLUDES,
                            compareValue: 'option-1',
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: ['option-1', 'option-2'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });

            it('should not match when array does not include compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.INCLUDES,
                            compareValue: 'option-3',
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: ['option-1', 'option-2'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).toBeNull();
            });

            it('should not match when answer is not an array', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.INCLUDES,
                            compareValue: 'option-1',
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: 'option-1',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).toBeNull();
            });
        });

        describe('NOT_INCLUDES operator', () => {
            it('should match when array does not include compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.NOT_INCLUDES,
                            compareValue: 'option-3',
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: ['option-1', 'option-2'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });
        });

        describe('COUNT_GTE operator', () => {
            it('should match when array length is greater than or equal to compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.COUNT_GTE,
                            compareValue: 2,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: ['option-1', 'option-2', 'option-3'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).not.toBeNull();
            });

            it('should not match when array length is less than compareValue', async () => {
                const step: FormStep & { branches: FormBranchRule[] } = {
                    ...mockStep,
                    branches: [
                        {
                            id: 'branch-1',
                            stepId: 'step-1',
                            operator: Operator.COUNT_GTE,
                            compareValue: 5,
                            nextStepId: 'step-2',
                            nextStepKey: null,
                            endResult: null,
                            endReason: null,
                            priority: 0,
                        },
                    ],
                };
                const answers: FormAnswer[] = [
                    {
                        id: 'answer-1',
                        sessionId: 'session-1',
                        stepId: 'step-1',
                        value: ['option-1', 'option-2'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                const result = await service.evaluateBranch(step, answers);
                expect(result).toBeNull();
            });
        });
    });

    describe('computeValue', () => {
        it('should compute basic arithmetic expressions', () => {
            const answers = [
                { stepId: 'step-1', value: 10 },
                { stepId: 'step-2', value: 20 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'age'],
                ['step-2', 'weight'],
            ]);

            const result = service.computeValue({
                expr: 'age + weight',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(30);
        });

        it('should compute subtraction', () => {
            const answers = [
                { stepId: 'step-1', value: 20 },
                { stepId: 'step-2', value: 5 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
            ]);

            const result = service.computeValue({
                expr: 'a - b',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(15);
        });

        it('should compute multiplication', () => {
            const answers = [
                { stepId: 'step-1', value: 5 },
                { stepId: 'step-2', value: 4 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'x'],
                ['step-2', 'y'],
            ]);

            const result = service.computeValue({
                expr: 'x * y',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(20);
        });

        it('should compute division', () => {
            const answers = [
                { stepId: 'step-1', value: 20 },
                { stepId: 'step-2', value: 4 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
            ]);

            const result = service.computeValue({
                expr: 'a / b',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(5);
        });

        it('should convert ^ to ** for power operation', () => {
            const answers = [{ stepId: 'step-1', value: 2 }];
            const stepKeyMap = new Map([['step-1', 'x']]);

            const result = service.computeValue({
                expr: 'x ^ 3',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(8);
        });

        it('should handle complex expressions', () => {
            const answers = [
                { stepId: 'step-1', value: 10 },
                { stepId: 'step-2', value: 5 },
                { stepId: 'step-3', value: 2 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
                ['step-3', 'c'],
            ]);

            const result = service.computeValue({
                expr: '(a + b) * c',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(30);
        });

        it('should ignore answers without matching keys in stepKeyMap', () => {
            const answers = [
                { stepId: 'step-1', value: 10 },
                { stepId: 'step-2', value: 20 },
                { stepId: 'step-3', value: 30 },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
            ]);

            const result = service.computeValue({
                expr: 'a + b',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(30);
        });

        it('should ignore non-numeric values', () => {
            const answers = [
                { stepId: 'step-1', value: 10 },
                { stepId: 'step-2', value: 'not-a-number' },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
            ]);

            const result = service.computeValue({
                expr: 'a',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(10);
        });

        it('should handle string numbers', () => {
            const answers = [
                { stepId: 'step-1', value: '10' },
                { stepId: 'step-2', value: '20' },
            ];
            const stepKeyMap = new Map([
                ['step-1', 'a'],
                ['step-2', 'b'],
            ]);

            const result = service.computeValue({
                expr: 'a + b',
                answers,
                stepKeyMap,
            });

            expect(result).toBe(30);
        });
    });

    describe('evaluateOptionalRule', () => {
        it('should return empty array when no rules match', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Test reason',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'different-value',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([]);
        });

        it('should return results when all keyValues match', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Test reason',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                        {
                            id: 'kv-2',
                            ruleId: 'rule-1',
                            stepId: 'step-2',
                            stepKey: '',
                            value: 'value-2',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'answer-2',
                    sessionId: 'session-1',
                    stepId: 'step-2',
                    value: 'value-2',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([
                {
                    result: EvaluationResult.INELIGIBLE,
                    reason: 'Test reason',
                },
            ]);
        });

        it('should not return results when one keyValue does not match', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Test reason',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                        {
                            id: 'kv-2',
                            ruleId: 'rule-1',
                            stepId: 'step-2',
                            stepKey: '',
                            value: 'value-2',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'answer-2',
                    sessionId: 'session-1',
                    stepId: 'step-2',
                    value: 'wrong-value',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([]);
        });

        it('should not return results when answer is missing', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Test reason',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                        {
                            id: 'kv-2',
                            ruleId: 'rule-1',
                            stepId: 'step-2',
                            stepKey: '',
                            value: 'value-2',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([]);
        });

        it('should respect priority ordering - higher priority rules first', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Low priority',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
                {
                    id: 'rule-2',
                    formId: 'form-1',
                    priority: 10,
                    endResult: EvaluationResult.CLINICAL_REVIEW,
                    endReason: 'High priority',
                    keyValues: [
                        {
                            id: 'kv-2',
                            ruleId: 'rule-2',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([
                {
                    result: EvaluationResult.CLINICAL_REVIEW,
                    reason: 'High priority',
                },
                {
                    result: EvaluationResult.INELIGIBLE,
                    reason: 'Low priority',
                },
            ]);
        });

        it('should return multiple results when multiple rules match', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: 'Reason 1',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
                {
                    id: 'rule-2',
                    formId: 'form-1',
                    priority: 5,
                    endResult: EvaluationResult.CLINICAL_REVIEW,
                    endReason: 'Reason 2',
                    keyValues: [
                        {
                            id: 'kv-2',
                            ruleId: 'rule-2',
                            stepId: 'step-2',
                            stepKey: '',
                            value: 'value-2',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'answer-2',
                    sessionId: 'session-1',
                    stepId: 'step-2',
                    value: 'value-2',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([
                {
                    result: EvaluationResult.CLINICAL_REVIEW,
                    reason: 'Reason 2',
                },
                {
                    result: EvaluationResult.INELIGIBLE,
                    reason: 'Reason 1',
                },
            ]);
        });

        it('should handle empty reason string', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: EvaluationResult.INELIGIBLE,
                    endReason: '',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([
                {
                    result: EvaluationResult.INELIGIBLE,
                    reason: '',
                },
            ]);
        });

        it('should not return results when rule has no endResult', () => {
            const rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[] = [
                {
                    id: 'rule-1',
                    formId: 'form-1',
                    priority: 0,
                    endResult: null,
                    endReason: 'Test reason',
                    keyValues: [
                        {
                            id: 'kv-1',
                            ruleId: 'rule-1',
                            stepId: 'step-1',
                            stepKey: '',
                            value: 'value-1',
                        },
                    ],
                },
            ];
            const answers: FormAnswer[] = [
                {
                    id: 'answer-1',
                    sessionId: 'session-1',
                    stepId: 'step-1',
                    value: 'value-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const result = service.evaluateOptionalRule(rules, answers);
            expect(result).toEqual([]);
        });
    });
});
