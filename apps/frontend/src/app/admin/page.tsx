'use client';

import { useEffect, useState } from 'react';
import { getData } from '@repo/nextFetch';
import { Form } from '../_types';
import Link from 'next/link';

export default function AdminPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const data = await getData<{ forms: Form[] }>('/admin/forms');
        setForms(data.forms);
      } catch (error) {
        console.error('Failed to fetch forms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading forms...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Forms</h1>
        <Link
          href="/admin/forms/create"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          + Create Form
        </Link>
      </div>
      <div className="grid gap-4">
        {forms.map((form) => (
          <Link
            key={form.id}
            href={`/admin/forms/${form.key}`}
            className="block p-6 bg-white dark:bg-card-dark rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{form.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm text-slate-900 dark:text-slate-100">
              Key: {form.key} | Version: {form.version}
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-2 text-slate-900 dark:text-slate-100">
              {form.steps?.length || 0} steps
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
