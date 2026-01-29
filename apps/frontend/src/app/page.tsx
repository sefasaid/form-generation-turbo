'use client';
import { fetchData } from '@repo/nextFetch';
import { Form } from './_types';
import startSurveyAction from './actions/start-survey';
import { useState } from 'react';
import { useEffect } from 'react';
export default function Page() {
  const [formData, setFormData] = useState<{ forms: Form[] } | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      const data = await fetchData<{ forms: Form[] }>('/');
      setFormData(data);
    }
    fetchFormData();
  }, []);
  return (
    <>
      {formData && formData.forms[0] && (
        <>
          <div className="p-8 md:p-12 text-center">
            <h1 className="font-manrope text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
              {formData.forms[0]?.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-slate-900 dark:text-slate-100">
              {formData.forms[0]?.description || ''}
            </p>
          </div>
          <div className="px-8 md:px-20 pb-16 ">
            <form action={startSurveyAction}>
              <input type="hidden" name="formId" value={formData.forms[0].id} />
              <div className="flex items-center justify-center pt-8 ">
                <button type="submit" id='start-survey-button' className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                  Start
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
