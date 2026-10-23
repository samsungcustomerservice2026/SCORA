/**
 * Survey definition model for the public Academy form.
 *
 * Language is chosen at creation time and locked onto the form itself
 * (lang + dir + translate="no"). The visitor's device locale must not
 * rewrite, flip, or auto-translate the authored copy.
 */

export const DEFAULT_SURVEY_ID = 'academy-default';
export const ACADEMY_RATING_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** `rating` = 1–10 scale; `single` = pick exactly one of the authored options. */
export const QUESTION_TYPES = ['rating', 'single'];

const AR_COPY = {
  kicker: 'SAMSUNG ACADEMY',
  title: 'استبيان أكاديمية سامسونج',
  subtitle: 'رأيك مهم جدا لتحسين جودة المحتوى وتجربة التدريب.',
  ratingSection: 'تقييم التدريب',
  ratingLegend:
    'التقييم من 1 إلى 10: 1–6 غير راضي | 7–8 محايد | 9–10 راضي',
  bandPrefix: 'التصنيف',
  bands: { dissatisfied: 'غير راضي', neutral: 'محايد', satisfied: 'راضي' },
  notesLabel: 'ملاحظات إضافية (اختياري)',
  notesPlaceholder: 'اكتب أي اقتراحات أو ملاحظات إضافية...',
  submit: 'إرسال الاستبيان',
  submitting: 'جاري الإرسال...',
  thanksTitle: 'شكرا لمشاركتك',
  thanksBody: 'تم إرسال الاستبيان بنجاح.',
  sendAnother: 'إرسال استبيان جديد',
  backHome: 'العودة للرئيسية',
  back: 'رجوع',
  hideShortcut: 'إخفاء',
  validation: {
    name: 'من فضلك اكتب الاسم بالكامل.',
    nameTwo: 'الاسم يجب أن يكون ثنائي (الاسم الأول واسم العائلة).',
    company: 'من فضلك اكتب اسم الشركة.',
    phone: 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.',
    requiredSelect: 'من فضلك أكمل هذا الحقل.',
    ratings: 'من فضلك أكمل كل أسئلة التقييم.',
    choices: 'من فضلك اختر إجابة لكل سؤال.',
    generic: 'من فضلك أكمل الحقول المطلوبة.',
  },
};

const EN_COPY = {
  kicker: 'SAMSUNG ACADEMY',
  title: 'Samsung Academy Survey',
  subtitle: 'Your feedback helps us improve training content and the session experience.',
  ratingSection: 'Training rating',
  ratingLegend: 'Rate 1 to 10: 1–6 Dissatisfied | 7–8 Neutral | 9–10 Satisfied',
  bandPrefix: 'Band',
  bands: { dissatisfied: 'Dissatisfied', neutral: 'Neutral', satisfied: 'Satisfied' },
  notesLabel: 'Additional notes (optional)',
  notesPlaceholder: 'Share any extra comments or suggestions…',
  submit: 'Submit survey',
  submitting: 'Sending…',
  thanksTitle: 'Thank you',
  thanksBody: 'Your survey was sent successfully.',
  sendAnother: 'Submit another response',
  backHome: 'Back to home',
  back: 'Back',
  hideShortcut: 'Hide',
  validation: {
    name: 'Please enter your full name.',
    nameTwo: 'Please enter first and last name.',
    company: 'Please enter the company name.',
    phone: 'Phone must be 11 digits starting with 010, 011, 012 or 015.',
    requiredSelect: 'Please complete this field.',
    ratings: 'Please answer every rating question.',
    choices: 'Please choose an answer for every question.',
    generic: 'Please complete the required fields.',
  },
};

export const SURVEY_COPY = { ar: AR_COPY, en: EN_COPY };

function copyFor(language) {
  return language === 'ar' ? { ...AR_COPY } : { ...EN_COPY };
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function surveyLanguage(def) {
  return def?.language === 'ar' ? 'ar' : 'en';
}

export function surveyDir(def) {
  return surveyLanguage(def) === 'ar' ? 'rtl' : 'ltr';
}

export function surveyLangAttr(def) {
  return surveyLanguage(def) === 'ar' ? 'ar' : 'en';
}

export function surveyRateBandLabel(def, value) {
  const n = parseInt(String(value || ''), 10);
  const bands = def?.copy?.bands || copyFor(surveyLanguage(def)).bands;
  if (!Number.isFinite(n)) return '';
  if (n <= 6) return bands.dissatisfied;
  if (n <= 8) return bands.neutral;
  return bands.satisfied;
}

export const DEFAULT_ACADEMY_SURVEY = Object.freeze({
  id: DEFAULT_SURVEY_ID,
  name: 'استبيان أكاديمية سامسونج',
  shortcutLabel: 'استبيان أكاديمية سامسونج',
  language: 'ar',
  profileFields: [
    { id: 'fullName', type: 'text', label: 'الاسم', placeholder: 'اكتب الاسم بالكامل', required: true, validate: 'full-name' },
    { id: 'phoneNumber', type: 'tel', label: 'رقم الهاتف', placeholder: '01012345678', required: true, validate: 'eg-mobile' },
    { id: 'company', type: 'text', label: 'الشركة', placeholder: 'اكتب اسم الشركة', required: true },
    {
      id: 'product',
      type: 'select',
      label: 'المنتج',
      placeholder: 'اختر المنتج',
      required: true,
      options: ['موبايل', 'تلفزيون', 'أجهزة منزلية'],
    },
    {
      id: 'academyLocation',
      type: 'select',
      label: 'موقع أكاديمية سامسونج',
      placeholder: 'اختر الموقع',
      required: true,
      options: ['القاهرة', 'الإسكندرية', 'أسيوط', 'طنطا'],
    },
  ],
  ratingQuestions: [
    { id: 'contentValue', label: 'هل كان المحتوى مفيد وقيم؟ (1-10)' },
    { id: 'trainerClarity', label: 'هل كان شرح المدرب واضح وجيد؟ (1-10)' },
    { id: 'needMoreSessions', label: 'هل تؤيد تدريبات اكثر من خلال أكاديمية سامسونج ؟ (1-10)' },
    { id: 'periodSuitable', label: 'هل فترة التدريب كانت مناسبة؟ (1-10)' },
    { id: 'placeAccommodation', label: 'هل مكان التدريب والتجهيزات كانت مناسبة؟ (1-10)' },
  ],
  notesEnabled: true,
  copy: AR_COPY,
});

function sanitizeField(raw, index) {
  const type = ['text', 'tel', 'select'].includes(raw?.type) ? raw.type : 'text';
  const options = Array.isArray(raw?.options)
    ? raw.options.map((o) => String(o || '').trim()).filter(Boolean)
    : [];
  return {
    id: String(raw?.id || `field_${index}`).trim() || `field_${index}`,
    type,
    label: String(raw?.label || '').trim() || `Field ${index + 1}`,
    placeholder: String(raw?.placeholder || '').trim(),
    required: raw?.required !== false,
    validate: raw?.validate === 'full-name' || raw?.validate === 'eg-mobile' ? raw.validate : '',
    options: type === 'select' ? options : [],
  };
}

function sanitizeQuestion(raw, index) {
  const type = QUESTION_TYPES.includes(raw?.type) ? raw.type : 'rating';
  const options = Array.isArray(raw?.options)
    ? raw.options.map((o) => String(o || '').trim()).filter(Boolean)
    : [];
  return {
    id: String(raw?.id || `q_${index}`).trim() || `q_${index}`,
    type,
    label: String(raw?.label || '').trim() || `Question ${index + 1}`,
    options: type === 'single' ? [...new Set(options)] : [],
  };
}

export function newSurveyQuestion(type, language) {
  const isAr = language === 'ar';
  if (type === 'single') {
    return {
      id: newId('q'),
      type: 'single',
      label: isAr ? 'سؤال اختيار واحد' : 'Single choice question',
      options: isAr ? ['نعم', 'لا'] : ['Yes', 'No'],
    };
  }
  return { id: newId('q'), type: 'rating', label: isAr ? 'سؤال جديد (1-10)' : 'New question (1-10)', options: [] };
}

export function normalizeSurveyDefinition(raw) {
  const language = raw?.language === 'ar' ? 'ar' : 'en';
  const fallback = copyFor(language);
  const copyIn = raw?.copy && typeof raw.copy === 'object' ? raw.copy : {};
  const profileFields = (Array.isArray(raw?.profileFields) && raw.profileFields.length
    ? raw.profileFields
    : DEFAULT_ACADEMY_SURVEY.profileFields
  ).map(sanitizeField);
  const ratingQuestions = (Array.isArray(raw?.ratingQuestions) && raw.ratingQuestions.length
    ? raw.ratingQuestions
    : [{ id: 'q1', label: language === 'ar' ? 'تقييم عام (1-10)' : 'Overall rating (1-10)' }]
  ).map(sanitizeQuestion);

  return {
    id: String(raw?.id || '').trim(),
    name: String(raw?.name || copyIn.title || fallback.title).trim() || fallback.title,
    shortcutLabel: String(raw?.shortcutLabel || raw?.name || fallback.title).trim(),
    language,
    profileFields,
    ratingQuestions,
    notesEnabled: raw?.notesEnabled !== false,
    copy: {
      ...fallback,
      ...copyIn,
      bands: { ...fallback.bands, ...(copyIn.bands || {}) },
      validation: { ...fallback.validation, ...(copyIn.validation || {}) },
    },
    updatedAt: raw?.updatedAt || null,
    updatedBy: raw?.updatedBy || null,
  };
}

export function blankSurveyDefinition(language = 'en') {
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = copyFor(lang);
  const isAr = lang === 'ar';
  return normalizeSurveyDefinition({
    id: '',
    name: isAr ? 'استبيان جديد' : 'New survey',
    shortcutLabel: isAr ? 'استبيان جديد' : 'New survey',
    language: lang,
    profileFields: [
      { id: 'fullName', type: 'text', label: isAr ? 'الاسم' : 'Full name', placeholder: isAr ? 'اكتب الاسم بالكامل' : 'First and last name', required: true, validate: 'full-name' },
      { id: 'phoneNumber', type: 'tel', label: isAr ? 'رقم الهاتف' : 'Phone number', placeholder: '01012345678', required: true, validate: 'eg-mobile' },
      { id: 'company', type: 'text', label: isAr ? 'الشركة' : 'Company', placeholder: isAr ? 'اكتب اسم الشركة' : 'Company name', required: true },
      {
        id: 'product',
        type: 'select',
        label: isAr ? 'المنتج' : 'Product',
        placeholder: isAr ? 'اختر المنتج' : 'Select product',
        required: true,
        options: isAr ? ['موبايل', 'تلفزيون', 'أجهزة منزلية'] : ['Mobile', 'TV', 'Home appliances'],
      },
      {
        id: 'academyLocation',
        type: 'select',
        label: isAr ? 'الموقع' : 'Academy location',
        placeholder: isAr ? 'اختر الموقع' : 'Select location',
        required: true,
        options: isAr ? ['القاهرة', 'الإسكندرية', 'أسيوط', 'طنطا'] : ['Cairo', 'Alexandria', 'Assiut', 'Tanta'],
      },
    ],
    ratingQuestions: [
      { id: 'q1', label: isAr ? 'تقييم عام (1-10)' : 'Overall rating (1-10)' },
    ],
    notesEnabled: true,
    copy,
  });
}

export function cloneSurveyDefinition(def, language) {
  const base = normalizeSurveyDefinition(def);
  const lang = language === 'ar' || language === 'en' ? language : base.language;
  return {
    ...base,
    id: '',
    name: `${base.name} (copy)`,
    shortcutLabel: base.shortcutLabel,
    language: lang,
    profileFields: base.profileFields.map((f, i) => ({ ...f, id: f.id || `field_${i}` })),
    ratingQuestions: base.ratingQuestions.map((q, i) => ({ ...q, id: q.id.startsWith('q_') ? newId('q') : q.id })),
  };
}

export function emptySurveyAnswers(def) {
  const out = {};
  for (const field of def?.profileFields || []) out[field.id] = '';
  for (const q of def?.ratingQuestions || []) out[q.id] = '';
  out.notes = '';
  return out;
}

export function displaySurveyName(def) {
  if (!def) return 'Survey';
  return String(def.shortcutLabel || def.name || def.copy?.title || 'Survey').trim() || 'Survey';
}

export function validateSurveyAnswers(def, answers) {
  const copy = def?.copy?.validation || copyFor(surveyLanguage(def)).validation;
  const value = (id) => String(answers?.[id] ?? '').trim();

  for (const field of def?.profileFields || []) {
    const raw = String(answers?.[field.id] ?? '');
    const trimmed = raw.trim().replace(/\s+/g, field.type === 'tel' ? '' : ' ');
    if (field.required && !trimmed) {
      if (field.id === 'fullName' || field.validate === 'full-name') return copy.name;
      if (field.id === 'company') return copy.company;
      if (field.type === 'select') return copy.requiredSelect;
      return copy.generic;
    }
    if (field.validate === 'full-name' && trimmed) {
      const parts = trimmed.split(' ').filter(Boolean);
      if (parts.length < 2) return copy.nameTwo;
    }
    if (field.validate === 'eg-mobile' && trimmed) {
      if (!/^01(0|1|2|5)\d{8}$/.test(trimmed.replace(/\s+/g, ''))) return copy.phone;
    }
  }

  for (const q of def?.ratingQuestions || []) {
    if (!value(q.id)) return q.type === 'single' ? copy.choices : copy.ratings;
  }
  return null;
}

export function buildSurveyResponsePayload(def, answers, extra = {}) {
  const payload = {
    surveyId: def.id || DEFAULT_SURVEY_ID,
    surveyName: def.name || displaySurveyName(def),
    language: surveyLanguage(def),
    notes: String(answers.notes || '').trim(),
    answers: { ...(answers || {}) },
    ratings: {},
    choices: {},
    ...extra,
  };

  for (const field of def.profileFields || []) {
    let val = String(answers[field.id] ?? '');
    if (field.type === 'tel' || field.validate === 'eg-mobile') val = val.replace(/\s+/g, '');
    else val = val.trim().replace(/\s+/g, ' ');
    payload[field.id] = val;
  }
  for (const q of def.ratingQuestions || []) {
    const val = String(answers[q.id] ?? '');
    if (q.type === 'single') payload.choices[q.id] = val;
    else payload.ratings[q.id] = val;
    payload[q.id] = val;
  }
  return payload;
}
