/**
 * EvalAI Brand Color System
 * ─────────────────────────
 * All badge, button, and status colors must use these tokens.
 * Never use dark backgrounds in judge/admin/student UI.
 * This file is the single source of truth for EvalAI's visual language.
 * When adding new components, import and apply tokens from here.
 */
export const brandColors = {
  primary:   'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  status: {
    PENDING:          'bg-slate-100 text-slate-600 border border-slate-200',
    JUDGE_EVALUATING: 'bg-amber-100 text-amber-700 border border-amber-200',
    AI_EVALUATING:    'bg-blue-100 text-blue-700 border border-blue-200',
    AI_COMPLETED:     'bg-purple-100 text-purple-700 border border-purple-200',
    COMPLETED:        'bg-emerald-100 text-emerald-700 border border-emerald-200',
    EVALUATED:        'bg-green-100 text-green-700 border border-green-200',
  },
  score: {
    ai:    'bg-blue-50 text-blue-700 border border-blue-200',
    judge: 'bg-orange-50 text-orange-700 border border-orange-200',
    final: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  materials: {
    github: 'bg-slate-800 text-white hover:bg-slate-700',
    pdf:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    slides: 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100',
    video:  'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100',
  },
}
