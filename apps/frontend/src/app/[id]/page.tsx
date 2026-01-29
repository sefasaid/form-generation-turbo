'use client';
import { EvaluationResult, FormSession, SessionStatus, StepType } from "../_types";
import { getData } from "@repo/nextFetch";
import { saveFormAnswerAction } from "../actions/save-form";
import { use, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Input from '../components/input';
import Option from '../components/option';
import Checkbox from '../components/checkbox';
import { socket, socketId } from '@repo/nextFetch';
import { SideImageContext } from "../layout";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { setSideImage } = useContext(SideImageContext);
    const [sessionData, setSessionData] = useState<FormSession | null>(null);
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!sessionData?.form) return;
            const form = sessionData.form as typeof sessionData.form & { _count?: { steps?: number } };
            const stepCount = form._count?.steps;
            if (stepCount && sessionData.answers?.length === stepCount) {
                setProgress(100);
            } else if (stepCount) {
                setProgress(((sessionData.answers?.length || 0) + 1) / stepCount * 100);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [sessionData]);

    const fetchSessionData = async () => {
        setLoading(true);
        const data = await getData<FormSession>(`/forms/session/${id}`);
        setSessionData(data);
        if (data?.status === SessionStatus.COMPLETED && data?.result === EvaluationResult.INELIGIBLE) {
            router.push(`/${id}/result`);
            return;
        }
        setSideImage(data?.id || '');
        setLoading(false);
    }
    useEffect(() => {
        console.log('fetching session data', id);
        fetchSessionData();
        socket.emit('session-id', id);
        socket.on('message', (message: { sender: string, data: any }) => {
            if (message.data === 'RELOAD' && socketId !== message.sender) {
                fetchSessionData();
            }
        });
    }, [id]);






    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setIsSubmitting(true);
        const data = await saveFormAnswerAction(formData);
        if (data?.success && data?.nextStepId) {
            toast.success('Answer saved');
            fetchSessionData();
            setIsSubmitting(false);
            (e.target as HTMLFormElement).reset()
        } else if (data?.success && data?.end) {
            toast.success('Answer saved');
            fetchSessionData();
            router.push(`/${id}/result`);
            setIsSubmitting(false);
        } else {
            toast.error(data?.error);
            setIsSubmitting(false);
        }
    }


    return (
        <>
            {loading ? <div className="flex items-center justify-center h-screen">
                <span className="material-symbols-rounded animate-spin">sync</span>
            </div> : <>
                <form className="p-2 md:p-8 " onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <h1 className="block text-center text-2xl font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {sessionData?.currentStep?.prompt}
                        </h1>

                    </div>
                    <input type="hidden" name="sessionId" value={id} />
                    <input type="hidden" name="stepId" value={sessionData?.currentStep?.id} />
                    <input type="hidden" name="stepType" value={sessionData?.currentStep?.type} />
                    {sessionData?.currentStep?.type === StepType.NUMBER && <Input type="number" />}
                    {sessionData?.currentStep?.type === StepType.TEXT && <Input type="text" />}
                    {sessionData?.currentStep?.type === StepType.RADIO && <Option options={sessionData?.currentStep?.options || []} />}
                    {sessionData?.currentStep?.type === StepType.CHECKBOX && <Checkbox options={sessionData?.currentStep?.options || []} />}

                    <div className="flex items-center flex-col justify-center pt-8 gap-4 ">

                        <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                            {isSubmitting ? <span className="material-symbols-rounded animate-spin">sync</span> : <>Next <span className="material-symbols-rounded">arrow_forward</span></>}
                        </button>
                        <div className="flex items-center gap-1 text-slate-400 font-bold text-lg">
                            <span className="font-bold">Enter</span>
                            <span>to submit</span>
                            <span className="material-symbols-rounded font-bold text-lg ml-1">
                                keyboard_return
                            </span>
                        </div>
                    </div>
                </form>


                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-card-dark px-6 py-3 rounded-full shadow-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-100">{(sessionData?.answers?.length || 0) + 1} / {sessionData?.form ? ((sessionData.form as typeof sessionData.form & { _count?: { steps?: number } })._count?.steps || 0) : 0}</span>
                    <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary dark:bg-accent-purple transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </>}

        </>

    );
}
