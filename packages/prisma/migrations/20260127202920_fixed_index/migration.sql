/*
  Warnings:

  - A unique constraint covering the columns `[formId,key,version]` on the table `form_steps` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "form_steps_formId_key_idx";

-- DropIndex
DROP INDEX "form_steps_formId_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "form_steps_formId_key_version_key" ON "form_steps"("formId", "key", "version");
