import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import HelpTip from './HelpTip';

export default function SidebarSection({
  step,
  totalSteps,
  title,
  subtitle,
  icon: Icon,
  tip,
  onBack,
  onNext,
  isFirst,
  isLast,
  children,
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2f6cf6]">
            {Icon ? <Icon className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Step {step} of {totalSteps}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        <HelpTip text={tip} />
      </div>

      <div className="space-y-4">{children}</div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f6cf6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245fe6]"
        >
          {isLast ? 'Review design' : 'Next step'}
          {!isLast ? <ChevronRight className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}