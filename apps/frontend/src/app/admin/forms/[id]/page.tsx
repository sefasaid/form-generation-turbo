'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { getData } from '@repo/nextFetch';
import { Form } from '../../../_types';

export default function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await getData<Form>(`/admin/forms/${id}`);
        setForm(data);
      } catch (error) {
        console.error('Failed to fetch form:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return <div>Form not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{form.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {showJson ? 'Show Details' : 'Show JSON'}
          </button>
          <a
            href={`/admin/forms/${id}/edit`}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Edit JSON
          </a>
        </div>
      </div>

      {showJson ? (
        <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">JSON Format</h2>
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(form, null, 2)}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(form, null, 2));
                alert('JSON copied to clipboard!');
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Copy JSON
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(form, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${form.key}-${form.version}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Download JSON
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6 mb-6">
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              <strong>Key:</strong> {form.key}
            </p>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              <strong>Version:</strong> {form.version}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Steps:</strong> {form.steps?.length || 0}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Steps</h2>
            {form.steps?.map((step) => (
              <div
                key={step.id}
                className="bg-white dark:bg-card-dark rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{step.key}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                  Type: {step.type}
                </p>
                {step.prompt && (
                  <p className="text-slate-700 dark:text-slate-300 mb-4">
                    {step.prompt}
                  </p>
                )}
                {step.options && step.options.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Options:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {step.options.map((option) => (
                        <li
                          key={option.id}
                          className="text-slate-600 dark:text-slate-400"
                        >
                          {option.label} ({option.value})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {step.branches && step.branches.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Branch Rules:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {step.branches.map((branch) => (
                        <li
                          key={branch.id}
                          className="text-slate-600 dark:text-slate-400 text-sm"
                        >
                          {branch.operator} - {branch.endResult || branch.nextStepId ? 'Active' : 'Inactive'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
