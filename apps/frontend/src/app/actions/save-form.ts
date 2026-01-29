'use client';
import { postData } from '@repo/nextFetch';
import { EvaluationResult, StepType } from '../_types/generated/enums';

export async function saveFormAnswerAction(
    formData: FormData
) {
    const stepId = formData.get('stepId') as string;
    const sessionId = formData.get('sessionId') as string;
    const stepType = formData.get('stepType') as string

    let value: any

    switch (stepType) {
        case StepType.CHECKBOX:
            value = formData.getAll('answer')
            break

        case StepType.NUMBER:
            value = Number(formData.get('answer'))
            break

        case StepType.RADIO:
        default:
            value = formData.get('answer')
    }

    const data = await postData<{ nextStepId: string, end: EvaluationResult, error: string }>(`/forms/session/${sessionId}/answer`, {
        stepId,
        value
    })
    if (data?.nextStepId) {
        return { success: true, nextStepId: data.nextStepId };
    } else if (data?.end) {
        return { success: true, end: data.end };
    } else {
        return { success: false, error: data.error };
    }
}
