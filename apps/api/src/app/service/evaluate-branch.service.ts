import { Injectable } from '@nestjs/common';
import { EvaluationResult, Form, FormAnswer, FormBranchRule, FormOptionalRule, FormOptionalRuleKeyValue, FormStep, Operator, } from '@repo/prisma';

type BranchEvaluationResult =
    | { type: 'NEXT_STEP'; nextStepId: string; reason?: string }
    | { type: 'END'; result: EvaluationResult; reason?: string }
    | null

type ConditionInput = {
    operator: Operator
    answer: any
    compareValue: any
}
@Injectable()
export class EvaluateBranchService {

    async evaluateBranch(
        step: FormStep & {
            branches: FormBranchRule[]
        },
        answers: FormAnswer[]
    ): Promise<BranchEvaluationResult> {

        const answer = answers.find(a => a.stepId === step.id)?.value

        if (!step.branches || step.branches.length === 0) {
            return null
        }

        const sortedRules = [...step.branches].sort(
            (a, b) => b.priority - a.priority
        )

        for (const rule of sortedRules) {
            const match = this.evaluateCondition({
                operator: rule.operator,
                answer,
                compareValue: rule.compareValue
            })

            if (match) {
                if (rule.endResult && rule.endResult === EvaluationResult.INELIGIBLE) {
                    return {
                        type: 'END',
                        result: EvaluationResult.INELIGIBLE,
                        reason: rule.endReason ?? undefined
                    }
                }
                if (rule.endResult && rule.endResult === EvaluationResult.CLINICAL_REVIEW) {
                    return {
                        type: 'NEXT_STEP',
                        nextStepId: rule.nextStepId ?? '',
                        reason: rule.endReason ?? undefined
                    }
                }

                if (rule.nextStepId) {
                    return {
                        type: 'NEXT_STEP',
                        nextStepId: rule.nextStepId
                    }
                }
            }
        }

        return null
    }

    private evaluateCondition({
        operator,
        answer,
        compareValue
    }: ConditionInput): boolean {
        if (answer === undefined || answer === null) return false

        switch (operator) {
            case 'EQ':
                return answer === compareValue

            case 'NEQ':
                return answer !== compareValue

            case 'GT':
                return Number(answer) > Number(compareValue)

            case 'GTE':
                return Number(answer) >= Number(compareValue)

            case 'LT':
                return Number(answer) < Number(compareValue)

            case 'LTE':
                return Number(answer) <= Number(compareValue)

            case 'INCLUDES':
                return Array.isArray(answer) && answer.includes(compareValue)

            case 'NOT_INCLUDES':
                return Array.isArray(answer) && !answer.includes(compareValue)

            case 'COUNT_GTE':
                return Array.isArray(answer) && answer.length >= Number(compareValue)

            default:
                return false
        }
    }

    public computeValue({
        expr,
        answers,
        stepKeyMap
    }: {
        expr: string
        answers: { stepId: string; value: any }[]
        stepKeyMap: Map<string, string>
    }) {
        const context: Record<string, number> = {}

        for (const answer of answers) {
            const key = stepKeyMap.get(answer.stepId)
            if (!key) continue

            const numericValue = Number(answer.value)
            if (!Number.isNaN(numericValue)) {
                context[key] = numericValue
            }
        }

        const safeExpr = expr.replace(/\^/g, '**')

        return Function(
            ...Object.keys(context),
            `return ${safeExpr}`
        )(...Object.values(context))
    }

    public evaluateOptionalRule(
        rules: (FormOptionalRule & { keyValues: FormOptionalRuleKeyValue[] })[],
        answers: FormAnswer[]
    ): { result: EvaluationResult; reason: string }[] {
        const results: { result: EvaluationResult; reason: string }[] = [];

        for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
            let allKeyValuesMatch = true;

            for (const keyValue of rule.keyValues) {
                const matchingAnswer = answers.find(
                    answer => answer.stepId === keyValue.stepId
                );

                if (!matchingAnswer || matchingAnswer.value !== keyValue.value) {
                    allKeyValuesMatch = false;
                    break;
                }
            }

            if (allKeyValuesMatch && rule.endResult) {
                results.push({
                    result: rule.endResult,
                    reason: rule.endReason || ''
                });
            }
        }

        return results;
    }
}