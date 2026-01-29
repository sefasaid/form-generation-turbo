'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postData } from '@repo/nextFetch';
import { toast } from 'sonner';
import { StepType, Operator, EvaluationResult, Form } from '../../../_types';

interface FormOption {
  value: string;
  label: string;
  order: number;
}

interface FormBranch {
  operator: Operator;
  compareValue: any;
  nextStepKey?: string | null;
  endResult?: EvaluationResult | null;
  endReason?: string | null;
  priority?: number;
}

interface FormStep {
  key: string;
  type: StepType;
  prompt?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  computeExpr?: string | null;
  nextStepKey?: string | null;
  options?: FormOption[];
  branches?: FormBranch[];
}

interface FormData {
  key: string;
  name: string;
  version: string;
  startStepKey?: string | null;
  steps: FormStep[];
}

export default function CreateFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    key: '',
    name: '',
    version: '1.0',
    startStepKey: null,
    steps: [],
  });
  const [saving, setSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const addStep = () => {
    const stepKey = `step${formData.steps.length + 1}`;
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          key: stepKey,
          type: StepType.TEXT,
          prompt: '',
          nextStepKey: null,
          options: [],
          branches: [],
        },
      ],
    });
  };

  const updateStep = (index: number, updates: Partial<FormStep>) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], ...updates } as FormStep;
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const addOption = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (!step.options) step.options = [];
    step.options.push({
      value: '',
      label: '',
      order: step.options.length,
    });
    setFormData({ ...formData, steps: newSteps });
  };

  const updateOption = (stepIndex: number, optionIndex: number, updates: Partial<FormOption>) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (step.options) {
      step.options[optionIndex] = { ...step.options[optionIndex], ...updates } as FormOption;
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const removeOption = (stepIndex: number, optionIndex: number) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (step.options) {
      step.options = step.options.filter((_, i) => i !== optionIndex);
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const addBranch = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (!step.branches) step.branches = [];
    step.branches.push({
      operator: Operator.EQ,
      compareValue: '',
      nextStepKey: null,
      priority: 0,
    });
    setFormData({ ...formData, steps: newSteps });
  };

  const updateBranch = (stepIndex: number, branchIndex: number, updates: Partial<FormBranch>) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (step.branches) {
      step.branches[branchIndex] = { ...step.branches[branchIndex], ...updates } as FormBranch;
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const removeBranch = (stepIndex: number, branchIndex: number) => {
    const newSteps = [...formData.steps];
    const step = newSteps[stepIndex];
    if (!step) return;
    if (step.branches) {
      step.branches = step.branches.filter((_, i) => i !== branchIndex);
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const validateJson = (text: string): boolean => {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (error: any) {
      setJsonError(error.message);
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    validateJson(value);
  };

  const loadFromJson = () => {
    if (!validateJson(jsonText)) {
      toast.error('Invalid JSON format');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      setFormData(parsed);
      setJsonMode(false);
      toast.success('Form loaded from JSON');
    } catch (error: any) {
      toast.error('Failed to load form from JSON');
    }
  };

  const exportToJson = () => {
    setJsonText(JSON.stringify(formData, null, 2));
    setJsonMode(true);
  };

  const loadSampleJson = () => {
    const sampleForm: FormData = {
      key: 'sample-form',
      name: 'Sample Form',
      version: '1.0',
      startStepKey: 'age-question',
      steps: [
        {
          key: 'age-question',
          type: StepType.RADIO,
          prompt: 'What is your age?',
          nextStepKey: null,
          options: [
            {
              value: '18-25',
              label: '18-25',
              order: 0,
            },
            {
              value: '26-35',
              label: '26-35',
              order: 1,
            },
            {
              value: '36-50',
              label: '36-50',
              order: 2,
            },
            {
              value: '50+',
              label: '50+',
              order: 3,
            },
          ],
          branches: [
            {
              operator: Operator.EQ,
              compareValue: '18-25',
              nextStepKey: 'name-question',
              priority: 0,
            },
            {
              operator: Operator.EQ,
              compareValue: '26-35',
              nextStepKey: 'name-question',
              priority: 0,
            },
            {
              operator: Operator.EQ,
              compareValue: '50+',
              endResult: EvaluationResult.INELIGIBLE,
              endReason: 'Age requirement not met',
              priority: 0,
            },
          ],
        },
        {
          key: 'name-question',
          type: StepType.TEXT,
          prompt: 'What is your name?',
          nextStepKey: 'experience-question',
        },
        {
          key: 'experience-question',
          type: StepType.NUMBER,
          prompt: 'How many years of experience do you have?',
          minValue: 0,
          maxValue: 50,
          nextStepKey: 'skills-question',
        },
        {
          key: 'skills-question',
          type: StepType.CHECKBOX,
          prompt: 'Select your skills:',
          nextStepKey: 'final-step',
          options: [
            {
              value: 'javascript',
              label: 'JavaScript',
              order: 0,
            },
            {
              value: 'typescript',
              label: 'TypeScript',
              order: 1,
            },
            {
              value: 'react',
              label: 'React',
              order: 2,
            },
            {
              value: 'nodejs',
              label: 'Node.js',
              order: 3,
            },
          ],
          branches: [
            {
              operator: Operator.COUNT_GTE,
              compareValue: 3,
              nextStepKey: 'final-step',
              priority: 0,
            },
            {
              operator: Operator.COUNT_GTE,
              compareValue: 1,
              endResult: EvaluationResult.CLINICAL_REVIEW,
              endReason: 'Skills need review',
              priority: 1,
            },
          ],
        },
        {
          key: 'final-step',
          type: StepType.FINAL,
          prompt: 'Thank you for completing the form!',
          nextStepKey: null,
        },
      ],
    };
    const sampleJson = JSON.stringify(sampleForm, null, 2);
    setJsonText(sampleJson);
    setJsonError(null);
    toast.success('Sample JSON loaded');
  };

  const handleSave = async () => {
    if (!formData.key || !formData.name || !formData.version) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    setSaving(true);
    try {
      const response: Form = await postData('/admin/forms/simple', formData);
      toast.success('Form created successfully');
      router.push(`/admin/forms/${response.id}`);
    } catch (error: any) {
      console.error('Failed to create form:', error);
      toast.error(error?.message || 'Failed to create form');
    } finally {
      setSaving(false);
    }
  };

  if (jsonMode) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Create Form (JSON Mode)</h1>
          <div className="flex gap-2">
            <button
              onClick={loadSampleJson}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Load Sample JSON
            </button>
            <button
              onClick={() => {
                setJsonMode(false);
                setJsonError(null);
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Back to Form Builder
            </button>
            <button
              onClick={loadFromJson}
              disabled={!!jsonError}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load JSON
            </button>
          </div>
        </div>

        {jsonError && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold">JSON Error:</p>
            <p className="text-red-600 dark:text-red-300 text-sm">{jsonError}</p>
          </div>
        )}

        <div className="bg-white dark:bg-card-dark rounded-lg shadow">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold">JSON Editor</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Paste or edit the form JSON below. Make sure the JSON is valid before loading. Click "Load Sample JSON" to load a sample form for quick testing.
            </p>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full h-[calc(100vh-300px)] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Form</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToJson}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            JSON Mode
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Form'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Form Basic Info */}
        <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Form Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Key *</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="example-form"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Form Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Version *</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Step Key</label>
              <select
                value={formData.startStepKey || ''}
                onChange={(e) => setFormData({ ...formData, startStepKey: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select start step...</option>
                {formData.steps.map((step) => (
                  <option key={step.key} value={step.key}>
                    {step.key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Steps</h2>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              + Add Step
            </button>
          </div>

          {formData.steps.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              No steps yet. Click "Add Step" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Step {stepIndex + 1}: {step.key}</h3>
                    <button
                      onClick={() => removeStep(stepIndex)}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Key *</label>
                      <input
                        type="text"
                        value={step.key}
                        onChange={(e) => updateStep(stepIndex, { key: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type *</label>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(stepIndex, { type: e.target.value as StepType })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {Object.values(StepType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Prompt</label>
                      <textarea
                        value={step.prompt || ''}
                        onChange={(e) => updateStep(stepIndex, { prompt: e.target.value || null })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                    </div>
                    {(step.type === StepType.NUMBER) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Min Value</label>
                          <input
                            type="number"
                            value={step.minValue || ''}
                            onChange={(e) => updateStep(stepIndex, { minValue: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Max Value</label>
                          <input
                            type="number"
                            value={step.maxValue || ''}
                            onChange={(e) => updateStep(stepIndex, { maxValue: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </>
                    )}
                    {step.type === StepType.COMPUTED && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Compute Expression</label>
                        <input
                          type="text"
                          value={step.computeExpr || ''}
                          onChange={(e) => updateStep(stepIndex, { computeExpr: e.target.value || null })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g., step1 + step2"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2">Next Step Key</label>
                      <select
                        value={step.nextStepKey || ''}
                        onChange={(e) => updateStep(stepIndex, { nextStepKey: e.target.value || null })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">None</option>
                        {formData.steps
                          .filter((s, i) => i !== stepIndex)
                          .map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.key}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Options for RADIO and CHECKBOX */}
                  {(step.type === StepType.RADIO || step.type === StepType.CHECKBOX) && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">Options</h4>
                        <button
                          onClick={() => addOption(stepIndex)}
                          className="px-3 py-1 bg-primary text-white rounded hover:bg-indigo-600 transition-colors text-sm"
                        >
                          + Add Option
                        </button>
                      </div>
                      {step.options && step.options.length > 0 ? (
                        <div className="space-y-2">
                          {step.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800 rounded"
                            >
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) => updateOption(stepIndex, optionIndex, { value: e.target.value })}
                                placeholder="Value"
                                className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(stepIndex, optionIndex, { label: e.target.value })}
                                placeholder="Label"
                                className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <input
                                type="number"
                                value={option.order}
                                onChange={(e) => updateOption(stepIndex, optionIndex, { order: parseInt(e.target.value) || 0 })}
                                placeholder="Order"
                                className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                onClick={() => removeOption(stepIndex, optionIndex)}
                                className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No options yet.</p>
                      )}
                    </div>
                  )}

                  {/* Branches */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Branches</h4>
                      <button
                        onClick={() => addBranch(stepIndex)}
                        className="px-3 py-1 bg-primary text-white rounded hover:bg-indigo-600 transition-colors text-sm"
                      >
                        + Add Branch
                      </button>
                    </div>
                    {step.branches && step.branches.length > 0 ? (
                      <div className="space-y-2">
                        {step.branches.map((branch, branchIndex) => (
                          <div
                            key={branchIndex}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="block text-xs font-medium mb-1">Operator</label>
                                <select
                                  value={branch.operator}
                                  onChange={(e) => updateBranch(stepIndex, branchIndex, { operator: e.target.value as Operator })}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  {Object.values(Operator).map((op) => (
                                    <option key={op} value={op}>
                                      {op}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Compare Value</label>
                                <input
                                  type="text"
                                  value={typeof branch.compareValue === 'string' ? branch.compareValue : JSON.stringify(branch.compareValue)}
                                  onChange={(e) => {
                                    let value: any = e.target.value;
                                    try {
                                      value = JSON.parse(e.target.value);
                                    } catch {
                                      // Keep as string if not valid JSON
                                    }
                                    updateBranch(stepIndex, branchIndex, { compareValue: value });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  placeholder="Value or JSON"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Next Step Key</label>
                                <select
                                  value={branch.nextStepKey || ''}
                                  onChange={(e) => updateBranch(stepIndex, branchIndex, { nextStepKey: e.target.value || null })}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value="">None</option>
                                  {formData.steps
                                    .filter((s, i) => i !== stepIndex)
                                    .map((s) => (
                                      <option key={s.key} value={s.key}>
                                        {s.key}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">End Result</label>
                                <select
                                  value={branch.endResult || ''}
                                  onChange={(e) => updateBranch(stepIndex, branchIndex, { endResult: (e.target.value as EvaluationResult) || null })}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value="">None</option>
                                  {Object.values(EvaluationResult).map((result) => (
                                    <option key={result} value={result}>
                                      {result}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium mb-1">End Reason</label>
                                <input
                                  type="text"
                                  value={branch.endReason || ''}
                                  onChange={(e) => updateBranch(stepIndex, branchIndex, { endReason: e.target.value || null })}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  placeholder="Reason for ending"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Priority</label>
                                <input
                                  type="number"
                                  value={branch.priority || 0}
                                  onChange={(e) => updateBranch(stepIndex, branchIndex, { priority: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeBranch(stepIndex, branchIndex)}
                              className="mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm"
                            >
                              Remove Branch
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No branches yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
