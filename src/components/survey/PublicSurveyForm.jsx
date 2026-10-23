'use client';

import { CheckCircle, Send } from 'lucide-react';
import {
  ACADEMY_RATING_SCALE,
  surveyDir,
  surveyLangAttr,
  surveyRateBandLabel,
} from '../../lib/surveyDefinitions';

/**
 * Renders a survey from its authored definition. Language and direction are
 * taken from the definition, isolated from the device locale, and marked so
 * browsers do not auto-translate the copy.
 */
export default function PublicSurveyForm({
  definition,
  answers,
  onChange,
  sent,
  submitting,
  onSubmit,
  onReset,
  onBack,
}) {
  if (!definition) return null;

  const dir = surveyDir(definition);
  const lang = surveyLangAttr(definition);
  const copy = definition.copy || {};
  const setField = (id, value) => onChange?.({ ...answers, [id]: value });

  const fieldInputClass =
    'w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base font-semibold text-white outline-none focus:border-blue-500';

  return (
    <div
      lang={lang}
      dir={dir}
      translate="no"
      className="survey-lang-lock notranslate max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20"
    >
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-16 bg-blue-500/50" />
          <span className="text-[11px] font-black tracking-[0.35em] text-blue-300">{copy.kicker}</span>
          <div className="h-[1px] w-16 bg-blue-500/50" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">{copy.title || definition.name}</h2>
        {copy.subtitle ? (
          <p className="text-zinc-300 text-base md:text-lg">{copy.subtitle}</p>
        ) : null}
      </div>

      {sent ? (
        <div className="glass-card rounded-[2.5rem] p-10 md:p-14 flex flex-col items-center text-center space-y-5">
          <div className="w-20 h-20 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white">{copy.thanksTitle}</h3>
          <p className="text-zinc-400">{copy.thanksBody}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onReset}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all"
            >
              {copy.sendAnother}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-300 border border-white/10 font-black text-sm hover:text-white hover:border-white/20 transition-all"
            >
              {copy.backHome}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="glass-card rounded-[2.5rem] p-6 md:p-10 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {definition.profileFields.map((field) => {
              const span = field.type === 'select' || field.id === 'company' ? 'md:col-span-2' : '';
              const forceLtr = field.type === 'tel' || field.validate === 'eg-mobile';
              return (
                <div key={field.id} className={`space-y-2 ${span}`}>
                  <label className="text-sm md:text-base font-black text-zinc-200" htmlFor={`survey-${field.id}`}>
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`survey-${field.id}`}
                      value={answers[field.id] || ''}
                      onChange={(e) => setField(field.id, e.target.value)}
                      className={fieldInputClass}
                    >
                      <option value="">{field.placeholder || ''}</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`survey-${field.id}`}
                      type={field.type === 'tel' ? 'tel' : 'text'}
                      inputMode={forceLtr ? 'numeric' : undefined}
                      autoComplete={field.id === 'fullName' ? 'name' : field.type === 'tel' ? 'tel' : 'off'}
                      value={answers[field.id] || ''}
                      onChange={(e) => setField(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      dir={forceLtr ? 'ltr' : undefined}
                      className={`${fieldInputClass} ${forceLtr ? 'survey-ltr-input' : ''}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {definition.ratingQuestions?.length ? (
            <div className="space-y-5 border-t border-white/10 pt-6">
              <p className="text-base md:text-lg font-black text-blue-300">{copy.ratingSection}</p>
              {definition.ratingQuestions.some((q) => q.type !== 'single') ? (
                <p className="text-sm text-zinc-300 font-bold">{copy.ratingLegend}</p>
              ) : null}
              {definition.ratingQuestions.map((q) => q.type === 'single' ? (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm md:text-base font-black text-zinc-200" id={`survey-q-${q.id}`}>{q.label}</label>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`survey-q-${q.id}`}>
                    {(q.options || []).map((opt) => {
                      const picked = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={picked}
                          onClick={() => setField(q.id, opt)}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-black transition-all ${
                            picked
                              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                              : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm md:text-base font-black text-zinc-200">{q.label}</label>
                  <div className="flex flex-wrap gap-2" dir="ltr">
                    {ACADEMY_RATING_SCALE.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField(q.id, String(opt))}
                        className={`px-4 py-2 rounded-xl border text-sm font-black transition-all ${
                          answers[q.id] === String(opt)
                            ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                            : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {answers[q.id] ? (
                    <p className="text-xs text-zinc-300 font-bold">
                      {copy.bandPrefix}: {surveyRateBandLabel(definition, answers[q.id])}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {definition.notesEnabled ? (
            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-zinc-200" htmlFor="survey-notes">
                {copy.notesLabel}
              </label>
              <textarea
                id="survey-notes"
                value={answers.notes || ''}
                onChange={(e) => setField('notes', e.target.value)}
                rows={4}
                placeholder={copy.notesPlaceholder}
                className={`${fieldInputClass} font-medium resize-none`}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition-all hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? copy.submitting : copy.submit}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 py-3 text-xs font-black text-zinc-400 transition-all hover:text-white"
          >
            {copy.back}
          </button>
        </form>
      )}
    </div>
  );
}
