-- DropIndex
DROP INDEX "forms_key_key";

-- AlterTable
ALTER TABLE "form_branch_rules" ADD COLUMN     "nextStepKey" TEXT;

-- AlterTable
ALTER TABLE "form_optional_rule_key_values" ADD COLUMN     "stepKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "form_steps" ADD COLUMN     "nextStepKey" TEXT;
