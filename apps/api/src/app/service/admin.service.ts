import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@repo/prisma';
import { Form, FormSession } from '@repo/prisma';
import { FormResponseDto } from '../dto/form-response.dto';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async getForms(): Promise<{ forms: Form[] }> {
        // Get all forms
        const forms = await this.prisma.form.findMany({
            where: { isActive: true },
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


        return { forms };
    }

    async getForm(key: string): Promise<FormResponseDto> {
        const form = await this.prisma.form.findFirst({
            where: { key, isActive: true },
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
        if (!form) {
            throw new NotFoundException('Form not found');
        }
        return form as FormResponseDto;
    }

    async getSessions(): Promise<{ sessions: FormSession[] }> {
        const sessions = await this.prisma.formSession.findMany({
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
        return { sessions };
    }

    async getSession(id: string): Promise<FormSession> {
        const session = await this.prisma.formSession.findUnique({
            where: { id },
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
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        return session;
    }

    private async createStepsWithVersion(
        formId: string,
        steps: FormResponseDto['steps'],
        version: number,
    ): Promise<Map<string, string>> {
        const stepMap = new Map<string, string>();
        const branchMap = new Map<string, string>();

        // First pass: Create all steps and branches, store their IDs
        for (const stepData of steps || []) {
            const step = await this.prisma.formStep.create({
                data: {
                    formId: formId,
                    key: stepData.key,
                    type: stepData.type,
                    prompt: stepData.prompt || null,
                    minValue: stepData.minValue || null,
                    maxValue: stepData.maxValue || null,
                    computeExpr: stepData.computeExpr || null,
                    version: version,
                    nextStepKey: stepData.nextStepKey || null,
                    options: {
                        create: stepData.options?.map(option => ({
                            value: option.value,
                            label: option.label,
                            order: option.order,
                        })) || [],
                    },
                },
            });
            stepMap.set(stepData.key, step.id);

            // Create branches and store mapping
            if (stepData.branches) {
                for (let i = 0; i < stepData.branches.length; i++) {
                    const branchData = stepData.branches[i];
                    if (!branchData) continue;
                    const branch = await this.prisma.formBranchRule.create({
                        data: {
                            stepId: step.id,
                            operator: branchData.operator,
                            compareValue: branchData.compareValue,
                            nextStepKey: branchData.nextStepKey || null,
                            endResult: branchData.endResult || null,
                            endReason: branchData.endReason || null,
                            priority: branchData.priority || 0,
                        },
                    });
                    // Use branch ID if available, otherwise use index-based key
                    const branchKey = branchData.id || `${stepData.key}_branch_${i}`;
                    branchMap.set(branchKey, branch.id);
                }
            }
        }

        // Second pass: Update nextStepId references using stepMap
        for (const stepData of steps || []) {
            const stepId = stepMap.get(stepData.key);
            if (!stepId) continue;

            // Update step's nextStepId
            if (stepData.nextStepKey) {
                const nextStepId = stepMap.get(stepData.nextStepKey);
                if (nextStepId) {
                    await this.prisma.formStep.update({
                        where: { id: stepId },
                        data: {
                            nextStepId: nextStepId,
                        },
                    });
                }
            }

            // Update branch nextStepId references
            if (stepData.branches) {
                for (let i = 0; i < stepData.branches.length; i++) {
                    const branchData = stepData.branches[i];
                    if (!branchData) continue;
                    const branchKey = branchData.id || `${stepData.key}_branch_${i}`;
                    const branchId = branchMap.get(branchKey);

                    if (branchId && branchData.nextStepKey) {
                        const nextStepId = stepMap.get(branchData.nextStepKey);
                        if (nextStepId) {
                            await this.prisma.formBranchRule.update({
                                where: { id: branchId },
                                data: {
                                    nextStepId: nextStepId,
                                },
                            });
                        }
                    }
                }
            }
        }

        return stepMap;
    }

    async createForm(formData: FormResponseDto): Promise<FormResponseDto> {
        const form = await this.prisma.form.create({
            data: {
                id: formData.id || undefined,
                key: formData.key,
                name: formData.name,
                version: 1,
                startStepKey: formData.startStepKey || null,
            },
        });

        // Create steps for new form (version 1)
        const stepMap = await this.createStepsWithVersion(form.id, formData.steps, 1);

        // Update startStepId if startStepKey provided
        if (formData.startStepKey) {
            const startStepId = stepMap.get(formData.startStepKey);
            if (startStepId) {
                await this.prisma.form.update({
                    where: { id: form.id },
                    data: { startStepId },
                });
            }
        }

        // Create optional rules
        for (const ruleData of formData.formOptionalRules || []) {
            const rule = await this.prisma.formOptionalRule.create({
                data: {
                    formId: form.id,
                    endResult: ruleData.endResult,
                    endReason: ruleData.endReason,
                    priority: ruleData.priority,
                },
            });

            for (const keyValueData of ruleData.keyValues || []) {
                const stepId = stepMap.get(keyValueData.step.key) || keyValueData.stepId;
                await this.prisma.formOptionalRuleKeyValue.create({
                    data: {
                        ruleId: rule.id,
                        stepId: stepId,
                        stepKey: keyValueData.step.key,
                        value: keyValueData.value,
                    },
                });
            }
        }

        return this.getForm(form.key);

    }
    async createOrUpdateFormFromJson(formData: FormResponseDto): Promise<FormResponseDto> {
        if (!formData.key) {
            throw new BadRequestException('Form key is required');
        }

        // Try to find existing form by ID if provided, otherwise by key
        const existingForm = await this.prisma.form.findFirst({
            where: { key: formData.key, isActive: true },
            orderBy: { version: 'desc' },
        });

        let form;
        if (existingForm) {

            const newVersionInt = existingForm.version + 1;
            await this.prisma.form.updateMany({
                where: { key: existingForm.key },
                data: { isActive: false },
            });
            // Update existing form with new version
            form = await this.prisma.form.create({
                data: {
                    key: formData.key,
                    name: formData.name,
                    version: newVersionInt,
                    startStepKey: formData.startStepKey || null,
                },
            });
            // Create new FormStep versions with the new version number
            const stepMap = await this.createStepsWithVersion(form.id, formData.steps, newVersionInt);

            // Update startStepId if startStepKey provided
            if (formData.startStepKey) {
                const startStepId = stepMap.get(formData.startStepKey);
                if (startStepId) {
                    await this.prisma.form.update({
                        where: { id: form.id },
                        data: { startStepId },
                    });
                }
            }

            return this.getForm(form.key);
        } else {
            return this.createForm(formData);
        }
    }


}
