'use client';

import { useEffect, useState } from 'react';
import { getData } from '@repo/nextFetch';
import { FormSession } from '../../_types';
import Link from 'next/link';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<FormSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getData<{ sessions: FormSession[] }>('/admin/sessions');
        setSessions(data.sessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Answers (Sessions)</h1>
      <div className="grid gap-4">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/admin/sessions/${session.id}`}
            className="block p-6 bg-white dark:bg-card-dark rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {session.form?.name || 'Unknown Form'} Version {session.form?.version || 'Unknown'}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : session.status === 'FAILED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
              >
                {session.status}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 text-slate-900 dark:text-slate-100">
              Session ID: {session.id}
            </p>
            {session.result && (
              <p className="text-slate-500 dark:text-slate-500 text-xs mb-2 text-slate-900 dark:text-slate-100">
                Result: {session.result}
              </p>
            )}
            <p className="text-slate-500 dark:text-slate-500 text-xs text-slate-900 dark:text-slate-100">
              {session.answers?.length || 0} answers | Created:{' '}
              {new Date(session.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
