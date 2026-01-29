import { useState } from "react";
import { FormOption } from "../_types/generated/FormOption";

export default function Checkbox({ options }: { options: FormOption[] }) {
    const [selected, setSelected] = useState<FormOption[]>([]);

    const handleSelect = (option: FormOption) => {
        if (selected.includes(option)) {
            setSelected(selected.filter(o => o.id !== option.id));
        } else {
            setSelected([...selected, option]);
        }
    }
    return (
        <div className=" flex flex-wrap gap-3 items-center justify-center">
            {options.sort((a, b) => a.order - b.order).map((option) => (
                <button
                    type="button"
                    key={option.label}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${selected.includes(option)
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5"
                        }`}
                    onClick={() => handleSelect(option)}
                >
                    <span className={`text-2xl mb-1 ${selected.includes(option)
                        ? "text-primary"
                        : "text-slate-500"
                        }`}>{option.label}</span>
                </button>
            ))}
            <div className="hidden">
                {selected.map(option => (
                    <input type="checkbox" key={option.id} className="hidden" name="answer" value={option.value} />
                ))}
            </div>
        </div>
    )
}