import HandlerHeader from "@/components/handler-header";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/20">
      <HandlerHeader />
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-xl overflow-hidden">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  )
}