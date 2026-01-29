-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('NUMBER', 'TEXT', 'RADIO', 'CHECKBOX', 'COMPUTED', 'FINAL');

-- CreateEnum
CREATE TYPE "Operator" AS ENUM ('EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'INCLUDES', 'NOT_INCLUDES', 'COUNT_GTE');

-- CreateEnum
CREATE TYPE "EvaluationResult" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'CLINICAL_REVIEW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "startStepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_steps" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "StepType" NOT NULL,
    "prompt" TEXT,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "computeExpr" TEXT,
    "nextStepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "form_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_options" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "form_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_branch_rules" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "operator" "Operator" NOT NULL,
    "compareValue" JSONB NOT NULL,
    "nextStepId" TEXT,
    "endResult" "EvaluationResult",
    "endReason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_branch_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_optional_rules" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "endResult" "EvaluationResult",
    "endReason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_optional_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_optional_rule_key_values" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "form_optional_rule_key_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_sessions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "currentStepId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "result" "EvaluationResult",
    "resultReasons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "forms_key_key" ON "forms"("key");

-- CreateIndex
CREATE INDEX "forms_key_idx" ON "forms"("key");

-- CreateIndex
CREATE INDEX "form_steps_formId_key_version_idx" ON "form_steps"("formId", "key", "version");

-- CreateIndex
CREATE INDEX "form_steps_formId_key_idx" ON "form_steps"("formId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "form_steps_formId_key_key" ON "form_steps"("formId", "key");

-- CreateIndex
CREATE INDEX "form_options_stepId_idx" ON "form_options"("stepId");

-- CreateIndex
CREATE INDEX "form_branch_rules_stepId_idx" ON "form_branch_rules"("stepId");

-- CreateIndex
CREATE INDEX "form_optional_rules_formId_idx" ON "form_optional_rules"("formId");

-- CreateIndex
CREATE INDEX "form_optional_rule_key_values_ruleId_stepId_idx" ON "form_optional_rule_key_values"("ruleId", "stepId");

-- CreateIndex
CREATE INDEX "form_sessions_formId_idx" ON "form_sessions"("formId");

-- CreateIndex
CREATE INDEX "form_answers_sessionId_stepId_idx" ON "form_answers"("sessionId", "stepId");

-- CreateIndex
CREATE UNIQUE INDEX "form_answers_sessionId_stepId_key" ON "form_answers"("sessionId", "stepId");

-- AddForeignKey
ALTER TABLE "form_steps" ADD CONSTRAINT "form_steps_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_steps" ADD CONSTRAINT "form_steps_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "form_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_options" ADD CONSTRAINT "form_options_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "form_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_branch_rules" ADD CONSTRAINT "form_branch_rules_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "form_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_branch_rules" ADD CONSTRAINT "form_branch_rules_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "form_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_optional_rules" ADD CONSTRAINT "form_optional_rules_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_optional_rule_key_values" ADD CONSTRAINT "form_optional_rule_key_values_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "form_optional_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_optional_rule_key_values" ADD CONSTRAINT "form_optional_rule_key_values_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "form_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sessions" ADD CONSTRAINT "form_sessions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sessions" ADD CONSTRAINT "form_sessions_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "form_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "form_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "form_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
