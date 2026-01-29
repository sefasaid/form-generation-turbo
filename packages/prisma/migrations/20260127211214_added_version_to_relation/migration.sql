/*
  Warnings:

  - A unique constraint covering the columns `[id,version]` on the table `forms` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `version` on the `forms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "form_steps" DROP CONSTRAINT "form_steps_formId_fkey";

-- AlterTable
ALTER TABLE "forms" DROP COLUMN "version",
ADD COLUMN     "version" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "forms_id_version_key" ON "forms"("id", "version");

-- AddForeignKey
ALTER TABLE "form_steps" ADD CONSTRAINT "form_steps_formId_version_fkey" FOREIGN KEY ("formId", "version") REFERENCES "forms"("id", "version") ON DELETE CASCADE ON UPDATE CASCADE;
