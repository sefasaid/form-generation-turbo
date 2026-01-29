'use client';
import { EvaluationResult, FormSession } from "../../_types";
import { getData } from "@repo/nextFetch";
import { use, useContext, useEffect, useState } from "react";
import { SideImageContext } from "../../layout";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [sessionData, setSessionData] = useState<FormSession | null>(null);
    const [loading, setLoading] = useState(true);
    const { setSideImage } = useContext(SideImageContext);
    const fetchSessionData = async () => {
        setLoading(true);
        const data = await getData<FormSession>(`/forms/session/${id}`);
        setSessionData(data);
        setLoading(false);
        setSideImage(data?.id || '');
    }
    useEffect(() => {
        fetchSessionData();
    }, [id]);
    return (
        <>
            {loading ? <div className="flex items-center justify-center h-screen">
                <span className="material-symbols-rounded animate-spin text-slate-900 dark:text-slate-100">sync</span>
            </div> : <>

                <div className="p-8 md:p-20 pb-16 space-y-12">
                    <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100">
                        {sessionData?.result === EvaluationResult.ELIGIBLE ? 'You are eligible for the program' : sessionData?.result === EvaluationResult.INELIGIBLE ? 'You are not eligible for the program' : 'You need to be reviewed by a clinical professional'}
                    </h1>
                    <div className="text-center text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 justify-center items-center text-slate-900 dark:text-slate-100">
                        {sessionData?.resultReasons.map((reason: string, index: number) => (
                            <div className="flex items-center gap-2" key={index}>
                                <span className="material-symbols-rounded">info</span>
                                <span className="text-slate-900 dark:text-slate-100">{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </>}


        </>
    );
}
