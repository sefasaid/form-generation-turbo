'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getData, putData } from '@repo/nextFetch';
import { Form } from '../../../../_types';
import { toast } from 'sonner';
import { use } from 'react';
export default function FormEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await getData<Form>(`/admin/forms/${id}`);
        setForm(data);
        setJsonText(JSON.stringify(data, null, 2));
        setJsonError(null);
      } catch (error) {
        console.error('Failed to fetch form:', error);
        toast.error('Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

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

  const handleSave = async () => {
    if (!validateJson(jsonText)) {
      toast.error('Invalid JSON format');
      return;
    }

    setSaving(true);
    try {
      const formData = JSON.parse(jsonText);
      await putData(`/admin/forms/${id}`, formData);
      toast.success('Form updated successfully');
      router.push(`/admin/forms/${id}`);
    } catch (error: any) {
      console.error('Failed to save form:', error);
      toast.error(error?.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      toast.success('JSON formatted');
    } catch (error: any) {
      toast.error('Invalid JSON format');
    }
  };

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
        <h1 className="text-3xl font-bold">Edit Form: {form.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Format JSON
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!jsonError}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Form'}
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
            Edit the form JSON below. Make sure the JSON is valid before saving.
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
