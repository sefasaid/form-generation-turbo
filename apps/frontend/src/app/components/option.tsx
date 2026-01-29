import { useState } from "react";
import { FormOption } from "../_types/generated/FormOption";

export default function Option({ options }: { options: FormOption[] }) {
    const [active, setActive] = useState<FormOption | null>();
    return (
        <div className=" flex flex-wrap gap-3 items-center justify-center">
            {options.sort((a, b) => a.order - b.order).map((option) => (
                <button
                    type="button"
                    key={option.label}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${active?.id === option.id
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5"
                        }`}
                    onClick={() => setActive(option)}
                >
                    <span className={`text-2xl mb-1 ${active?.id === option.id
                        ? "text-primary"
                        : "text-slate-500"
                        }`}>{option.label}</span>
                </button>
            ))}
            <input type="hidden" name="answer" value={active?.value || ''} />
        </div>
    )
}