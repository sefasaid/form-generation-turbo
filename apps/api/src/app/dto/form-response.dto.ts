import { StepType, Operator, EvaluationResult } from '@repo/prisma';

export class FormOptionDto {
  id!: string;
  value!: string;
  label!: string;
  order!: number;
}

export class FormBranchRuleDto {
  id!: string;
  operator!: Operator;
  compareValue!: any;
  nextStepId!: string | null;
  nextStepKey!: string | null;
  endResult!: EvaluationResult | null;
  endReason!: string | null;
  priority!: number;
}

export class FormStepDto {
  id?: string;
  key!: string;
  nextStepKey?: string;
  type!: StepType;
  prompt!: string | null;
  minValue!: number | null;
  maxValue!: number | null;
  computeExpr!: string | null;
  nextStepId!: string | null;
  options!: FormOptionDto[];
  branches!: FormBranchRuleDto[];
}

export class FormOptionalRuleKeyValueDto {
  id!: string;
  stepId!: string;
  value!: string;
  step!: {
    id: string;
    key: string;
    type: StepType;
  };
}

export class FormOptionalRuleDto {
  id!: string;
  endResult!: EvaluationResult | null;
  endReason!: string | null;
  priority!: number;
  keyValues!: FormOptionalRuleKeyValueDto[];
}

export class FormResponseDto {
  id!: string;
  key!: string;
  name!: string;
  version!: number;
  startStepId!: string | null;
  startStepKey!: string | null;
  createdAt!: Date;
  steps!: FormStepDto[];
  formOptionalRules!: FormOptionalRuleDto[];
}
