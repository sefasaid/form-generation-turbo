export default function Input({ type }: { type: 'text' | 'number' }) {
    return (
        <input type={type} name="answer" placeholder="Type your answer here..." className="w-full bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary text-2xl py-4 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100 md:min-w-96" />
    )
}