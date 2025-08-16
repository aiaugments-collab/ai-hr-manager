import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Hero(props: {
  capsuleText: string;
  capsuleLink: string;
  title: string;
  subtitle: string;
  credits?: React.ReactNode;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
}) {
  return (
    <section className="relative py-32 md:py-48 lg:py-52 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
      
      <div className="relative container flex max-w-[64rem] flex-col items-center gap-6 text-center">
        <Link
          href={props.capsuleLink}
          className="inline-flex items-center rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        >
          {props.capsuleText}
        </Link>
        <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-bold text-gradient-primary">
          {props.title}
        </h1>
        <p className="max-w-[42rem] leading-normal text-slate-600 dark:text-slate-400 sm:text-xl sm:leading-8">
          {props.subtitle}
        </p>
        <div className="flex gap-4 flex-wrap justify-center mt-4">
          <Link
            href={props.primaryCtaLink}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-12 px-8"
          >
            {props.primaryCtaText}
          </Link>

          <Link
            href={props.secondaryCtaLink}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:shadow-md transition-all duration-200 h-12 px-8"
          >
            {props.secondaryCtaText}
          </Link>
        </div>

        {props.credits && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-6">{props.credits}</p>
        )}
      </div>
    </section>
  );
}
