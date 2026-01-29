import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import * as bcrypt from 'bcrypt'
import path from 'path';
import { PrismaClient } from './src/generated/client';
import { StepType, Operator, EvaluationResult } from './src/generated/enums';
dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    // Ensure database is up to date
    console.log('🔄 Checking database migrations...')
    try {
        // Try to query a table to see if migrations are applied
        await prisma.$queryRaw`SELECT 1 FROM "forms" LIMIT 1`
        console.log('✅ Database schema is up to date')
    } catch (error: any) {
        if (error.code === 'P2022' || error.message?.includes('does not exist')) {
            console.error('❌ Database migrations not applied!')
            console.error('Please run: yarn migrate')
            console.error('Or: cd packages/prisma && yarn migrate')
            process.exit(1)
        }
        throw error
    }

    // FORM
    const form = await prisma.form.create({
        data: {
            key: 'glp1',
            name: 'GLP-1 Eligibility Form',
            version: 1,
            isActive: true,
            startStepKey: 'age'
        }
    })

    const createStep = (data: any) => {
        console.log(data)
        return prisma.formStep.create({
            data: {
                formId: form.id,
                version: 1,
                ...data
            }
        })
    }

    // 1️⃣ Age
    const age = await createStep({
        key: 'age',
        type: StepType.NUMBER,
        prompt: 'What is your age?',
        minValue: 1,
        maxValue: 120
    })

    // 2️⃣ Weight
    const weight = await createStep({
        key: 'weight',
        type: StepType.NUMBER,
        prompt: 'Enter your weight in kilograms',
        minValue: 0,
        maxValue: 500
    })

    // 3️⃣ Height
    const height = await createStep({
        key: 'height',
        type: StepType.NUMBER,
        prompt: 'Enter your height in centimeters',
        minValue: 0,
        maxValue: 500
    })

    // 4️⃣ BMI (computed)
    const bmi = await createStep({
        key: 'bmi',
        type: StepType.COMPUTED,
        computeExpr: 'weight / ((height / 100) ^ 2)'
    })

    // 5️⃣ Pregnancy
    const pregnancy = await createStep({
        key: 'pregnancy',
        type: StepType.RADIO,
        prompt: 'Are you currently pregnant?'
    })

    // 6️⃣ Comorbidities
    const comorbidities = await createStep({
        key: 'comorbidities',
        type: StepType.CHECKBOX,
        prompt:
            'Which chronic conditions have you been diagnosed with? (Select all that apply)'
    })

    // 7️⃣ Diabetes
    const diabetes = await createStep({
        key: 'diabetes',
        type: StepType.RADIO,
        prompt: 'Have you ever been diagnosed with diabetes?'
    })

    // 8️⃣ HbA1c
    const hba1c = await createStep({
        key: 'hba1c',
        type: StepType.NUMBER,
        prompt: 'Enter your latest HbA1c (%)'
    })

    // 9️⃣ Blood Pressure
    const bloodPressure = await createStep({
        key: 'blood_pressure',
        type: StepType.CHECKBOX,
        prompt:
            'Check all that apply based on your most recent blood pressure reading'
    })

    // 🔟 Medications
    const medications = await createStep({
        key: 'medications',
        type: StepType.CHECKBOX,
        prompt: 'Which medications are you currently prescribed?'
    })

    // 11️⃣ Smoking
    const smoking = await createStep({
        key: 'smoking',
        type: StepType.RADIO,
        prompt: 'Do you currently smoke tobacco?'
    })

    // 12️⃣ Alcohol
    const alcohol = await createStep({
        key: 'alcohol',
        type: StepType.RADIO,
        prompt: 'How often do you consume alcohol?'
    })

    // 13️⃣ Activity
    const activity = await createStep({
        key: 'activity',
        type: StepType.RADIO,
        prompt: 'How would you describe your typical activity level?'
    })

    // 14️⃣ Diet
    const diet = await createStep({
        key: 'diet',
        type: StepType.CHECKBOX,
        prompt: 'Which best describes your diet? (Select all that apply)'
    })


    // 🔗 Default flow - using nextStepKey
    const flow = [
        { step: age, key: 'age' },
        { step: weight, key: 'weight' },
        { step: height, key: 'height' },
        { step: bmi, key: 'bmi' },
        { step: pregnancy, key: 'pregnancy' },
        { step: comorbidities, key: 'comorbidities' },
        { step: diabetes, key: 'diabetes' },
        { step: hba1c, key: 'hba1c' },
        { step: bloodPressure, key: 'blood_pressure' },
        { step: medications, key: 'medications' },
        { step: smoking, key: 'smoking' },
        { step: alcohol, key: 'alcohol' },
        { step: activity, key: 'activity' },
        { step: diet, key: 'diet' },
    ]

    for (let i = 0; i < flow.length - 1; i++) {
        await prisma.formStep.update({
            where: { id: flow[i]?.step.id },
            data: {
                nextStepKey: flow[i + 1]?.key,
                nextStepId: flow[i + 1]?.step.id
            }
        })
    }

    // 🧩 OPTIONS

    await prisma.formOption.createMany({
        data: [
            { stepId: pregnancy.id, value: 'Yes', label: 'Yes', order: 1 },
            { stepId: pregnancy.id, value: 'No', label: 'No', order: 2 },

            { stepId: diabetes.id, value: 'Yes', label: 'Yes', order: 1 },
            { stepId: diabetes.id, value: 'No', label: 'No', order: 2 },

            { stepId: smoking.id, value: 'Yes', label: 'Yes', order: 1 },
            { stepId: smoking.id, value: 'No', label: 'No', order: 2 },

            { stepId: alcohol.id, value: 'Never', label: 'Never', order: 1 },
            { stepId: alcohol.id, value: 'Monthly', label: 'Monthly', order: 2 },
            { stepId: alcohol.id, value: 'Weekly', label: 'Weekly', order: 3 },
            { stepId: alcohol.id, value: 'Daily', label: 'Daily', order: 4 },

            { stepId: activity.id, value: 'Sedentary', label: 'Sedentary', order: 1 },
            { stepId: activity.id, value: 'Light', label: 'Light (1–2x/week)', order: 2 },
            { stepId: activity.id, value: 'Moderate', label: 'Moderate (3–4x/week)', order: 3 },
            { stepId: activity.id, value: 'Vigorous', label: 'Vigorous (5+x/week)', order: 4 }
        ]
    })

    // 🧩 Checkbox options
    await prisma.formOption.createMany({
        data: [
            // Comorbidities
            { stepId: comorbidities.id, value: 'Hypertension', label: 'Hypertension', order: 1 },
            { stepId: comorbidities.id, value: 'Dyslipidemia', label: 'Dyslipidemia', order: 2 },
            { stepId: comorbidities.id, value: 'Sleep Apnea', label: 'Sleep Apnea', order: 3 },
            { stepId: comorbidities.id, value: 'GERD', label: 'GERD', order: 4 },
            { stepId: comorbidities.id, value: 'Thyroid Disorder', label: 'Thyroid Disorder', order: 5 },

            // Blood Pressure
            { stepId: bloodPressure.id, value: 'Normal', label: 'Normal (<120/80)', order: 1 },
            { stepId: bloodPressure.id, value: 'Elevated', label: 'Elevated (120–129)', order: 2 },
            { stepId: bloodPressure.id, value: 'Stage 1', label: 'Stage 1 Hypertension', order: 3 },
            { stepId: bloodPressure.id, value: 'Stage 2', label: 'Stage 2 Hypertension', order: 4 },
            { stepId: bloodPressure.id, value: 'Crisis', label: 'Hypertensive Crisis', order: 5 },

            // Medications
            { stepId: medications.id, value: 'ACE', label: 'ACE inhibitors', order: 1 },
            { stepId: medications.id, value: 'Beta', label: 'Beta blockers', order: 2 },
            { stepId: medications.id, value: 'Statins', label: 'Statins', order: 3 },
            { stepId: medications.id, value: 'Thyroid', label: 'Thyroid medication', order: 4 },
            { stepId: medications.id, value: 'GLP1', label: 'GLP-1 receptor agonist', order: 5 },

            // Diet
            { stepId: diet.id, value: 'HighSugar', label: 'High sugar intake', order: 1 },
            { stepId: diet.id, value: 'Processed', label: 'High processed foods', order: 2 },
            { stepId: diet.id, value: 'SugaryDrinks', label: 'Frequent sugary beverages', order: 3 },
            { stepId: diet.id, value: 'Fiber', label: 'High fiber diet', order: 4 },
            { stepId: diet.id, value: 'Balanced', label: 'Balanced diet', order: 5 }
        ]
    })

    // 🔀 BRANCH RULES (STEP-LEVEL)

    await prisma.formBranchRule.createMany({
        data: [
            // Age
            {
                stepId: age.id,
                operator: Operator.LT,
                compareValue: 18,
                endResult: EvaluationResult.INELIGIBLE,
                endReason: 'UNDERAGE',
                priority: 100
            },
            {
                stepId: age.id,
                operator: Operator.GT,
                compareValue: 75,
                endResult: EvaluationResult.CLINICAL_REVIEW,
                endReason: 'AGE_OVER_75',
                priority: 90
            },

            // BMI
            {
                stepId: bmi.id,
                operator: Operator.LT,
                compareValue: 25,
                endResult: EvaluationResult.INELIGIBLE,
                endReason: 'BMI_TOO_LOW',
                priority: 100
            },
            {
                stepId: bmi.id,
                operator: Operator.GTE,
                compareValue: 40,
                endResult: EvaluationResult.CLINICAL_REVIEW,
                endReason: 'HIGH_BMI',
                priority: 90
            },

            // Pregnancy
            {
                stepId: pregnancy.id,
                operator: Operator.EQ,
                compareValue: 'Yes',
                endResult: EvaluationResult.INELIGIBLE,
                endReason: 'PREGNANCY',
                priority: 100
            },

            // HbA1c
            {
                stepId: hba1c.id,
                operator: Operator.GT,
                compareValue: 9,
                endResult: EvaluationResult.INELIGIBLE,
                endReason: 'UNCONTROLLED_DIABETES',
                priority: 100
            },

            // Medications
            {
                stepId: medications.id,
                operator: Operator.INCLUDES,
                compareValue: 'GLP1',
                endResult: EvaluationResult.CLINICAL_REVIEW,
                endReason: 'ALREADY_ON_GLP1',
                priority: 100
            },
            {
                stepId: comorbidities.id,
                operator: Operator.COUNT_GTE,
                compareValue: 2,
                endResult: EvaluationResult.CLINICAL_REVIEW,
                endReason: 'TOO_MANY_COMBORIDITIES',
                priority: 100
            },
            {
                stepId: diabetes.id,
                operator: Operator.EQ,
                compareValue: 'Yes',
                nextStepKey: 'hba1c',
                nextStepId: hba1c.id,
                priority: 100
            },
            {
                stepId: diabetes.id,
                operator: Operator.EQ,
                compareValue: 'No',
                nextStepKey: 'blood_pressure',
                nextStepId: bloodPressure.id,
                priority: 100
            },
            {
                stepId: bloodPressure.id,
                operator: Operator.INCLUDES,
                compareValue: 'Stage 2',
                endResult: EvaluationResult.CLINICAL_REVIEW,
                endReason: 'TOO_HIGH_BLOOD_PRESSURE',
                priority: 100
            }
        ]
    })


    // 🧩 OPTIONAL RULES
    const optionalRule = await prisma.formOptionalRule.create({
        data: {
            formId: form.id,
            endResult: EvaluationResult.CLINICAL_REVIEW,
            endReason: 'TOO_MANY_COMBORIDITIES',
            priority: 90
        }
    })
    await prisma.formOptionalRuleKeyValue.createMany({
        data: [
            { ruleId: optionalRule.id, stepId: bloodPressure.id, value: 'Stage 1' },
            { ruleId: optionalRule.id, stepId: activity.id, value: 'Sedentary' },
            { ruleId: optionalRule.id, stepId: diet.id, value: 'HighSugar' }
        ]
    })
    const optionalRule2 = await prisma.formOptionalRule.create({
        data: {
            formId: form.id,
            endResult: EvaluationResult.CLINICAL_REVIEW,
            endReason: 'TOO_MANY_COMBORIDITIES',
            priority: 100
        }
    })
    await prisma.formOptionalRuleKeyValue.createMany({
        data: [
            { ruleId: optionalRule2.id, stepId: alcohol.id, value: 'Daily' },
            { ruleId: optionalRule2.id, stepId: medications.id, value: 'Beta' }
        ]
    })
    // 🚀 Start step - startStepKey is already set in form creation, just update startStepId
    await prisma.form.update({
        where: { id: form.id },
        data: { startStepId: age.id }
    })

    console.log('✅ GLP-1 form fully seeded (15 steps)')

    // if user exists, update password, if not, create user
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        create: {
            username: 'admin',
            password: await bcrypt.hash('admin', 10), // used 10 as salt rounds for test (in production, use a higher number)
        },
        update: {
            password: await bcrypt.hash('admin', 10), // used 10 as salt rounds for test (in production, use a higher number)
        },
    })
    console.log(`User created: ${user.username}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())