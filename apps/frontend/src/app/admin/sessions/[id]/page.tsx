'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { getData } from '@repo/nextFetch';
import { FormSession } from '../../../_types';

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<FormSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getData<FormSession>(`/admin/sessions/${id}`);
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Session Details</h1>
      <div className="bg-white dark:bg-card-dark rounded-lg shadow p-6 mb-6">
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-slate-900 dark:text-slate-100">
          <strong>Form:</strong> {session.form?.name || 'Unknown'}
        </p>
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-slate-900 dark:text-slate-100">
          <strong>Form Version:</strong> {session.form?.version || 'Unknown'}
        </p>
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-slate-900 dark:text-slate-100">
          <strong>Status:</strong> {session.status}
        </p>
        {session.result && (
          <p className="text-slate-600 dark:text-slate-400 mb-2 text-slate-900 dark:text-slate-100">
            <strong>Result:</strong> {session.result}
          </p>
        )}
        {session.resultReasons && session.resultReasons.length > 0 && (
          <div className="mb-2">
            <strong className="text-slate-900 dark:text-slate-100">Reasons:</strong>
            <ul className="list-disc list-inside mt-1">
              {session.resultReasons.map((reason, idx) => (
                <li key={idx} className="text-slate-600 dark:text-slate-400 text-slate-900 dark:text-slate-100">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-slate-600 dark:text-slate-400 text-slate-900 dark:text-slate-100">
          <strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Answers</h2>
        {session.answers && session.answers.length > 0 ? (
          session.answers.map((answer) => (
            <div
              key={answer.id}
              className="bg-white dark:bg-card-dark rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                {answer.step?.key || 'Unknown Step'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 text-slate-900 dark:text-slate-100">
                Step Type: {answer.step?.type}
              </p>
              <div className="mt-2">
                <strong className="text-slate-900 dark:text-slate-100"    >Answer:</strong>
                <pre className="mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm overflow-auto">
                  {JSON.stringify(answer.value, null, 2)}
                </pre>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-slate-900 dark:text-slate-100">No answers yet</p>
        )}
      </div>
    </div>
  );
}
