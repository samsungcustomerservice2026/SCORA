/**
 * GoGo hybrid router — traditional → (agentic via API) → generative → safe fallback.
 * Returns structured turn results for GoGoAssistant to apply.
 */

import {
  GOGO_SMART_CHIPS,
} from './gogoGeminiContext';
import {
  matchFreeTextToFlow,
  resolveFlowReply,
} from './gogoGuideFlow';
import {
  getGoGoSoftRedirectReply,
  isGoGoDeniedMessage,
  resolveGoGoReply,
} from './gogoKnowledge';
import {
  findGoGoOrgPerson,
  formatGoGoOrgAmbiguousAnswer,
  formatGoGoOrgPersonAnswer,
  answerGoGoOrgRelationQuestion,
  detectGoGoOrgRelationIntent,
} from './gogoOrgAndKpis';
import { matchLearnedAnswer, buildLearningPromptHints } from './gogoLearning';
import { matchAdminQaAnswer } from './gogoQaCatalog';
import { getGsmArenaConfirmReply, isGsmArenaSourceQuestion } from './gogoSamsungProducts';
import { prepareGoGoReplyPair } from './gogoSpeechText';

/**
 * @typedef {{
 *   mode: 'guard'|'traditional'|'learned'|'generative_needed'|'fallback',
 *   source: string,
 *   reply?: string,
 *   spoken?: string,
 *   chips?: string[],
 *   flowNodeId?: string,
 *   action?: string|null,
 *   learnable?: boolean,
 *   denied?: boolean,
 *   expression?: string,
 *   question?: string,
 *   productName?: string|null,
 *   dataStatus?: string|null,
 *   preferredStates?: string[],
 *   learningHint?: string,
 *   learnedMatch?: object|null,
 *   extraReply?: string,
 * }} GoGoTurnResult
 */

function pair(reply, lang) {
  return prepareGoGoReplyPair(reply, lang);
}

/** Sync traditional / guard stages before async product / generative. */
export function resolveGoGoTraditionalTurn(text, lang = 'en') {
  const L = lang === 'ar' ? 'ar' : 'en';
  const raw = String(text || '').trim();
  if (!raw) return null;

  if (isGoGoDeniedMessage(raw)) {
    const soft = getGoGoSoftRedirectReply(L);
    const denied = resolveFlowReply('denied', L);
    const reply = soft || denied.reply;
    const { display, spoken } = pair(reply, L);
    return {
      mode: 'guard',
      source: 'guard',
      reply: display,
      spoken,
      chips: denied.chips,
      denied: true,
      learnable: false,
      expression: 'empathetic',
    };
  }

  if (isGsmArenaSourceQuestion(raw)) {
    const reply = getGsmArenaConfirmReply(L);
    const { display, spoken } = pair(reply, L);
    return {
      mode: 'traditional',
      source: 'samsung_source_confirm',
      reply: display,
      spoken,
      chips: GOGO_SMART_CHIPS,
      learnable: false,
      expression: 'success',
    };
  }

  const isBuiltQuestion = /who\s*(built|made|created)|مين\s*(بنى|صنع)|من\s*(بنى|صنع)|who\s*developed/i.test(raw);
  if (!isBuiltQuestion) {
    const relationReply = answerGoGoOrgRelationQuestion(raw, L);
    if (relationReply) {
      const { display, spoken } = pair(relationReply, L);
      return {
        mode: 'traditional',
        source: 'cs_org_relation',
        reply: display,
        spoken,
        chips: GOGO_SMART_CHIPS,
        learnable: false,
        expression: 'explaining',
        question: raw,
      };
    }

    // Relation intent without a resolvable person — do not dump full org.
    if (detectGoGoOrgRelationIntent(raw)) {
      const reply =
        L === 'ar'
          ? 'أخبرني باسم الشخص لأحدد قائد الفريق أو قائد القطاع من الهيكل المحفوظ.'
          : 'Tell me the person’s name so I can look up their Team Leader or Part Leader from the saved hierarchy.';
      const { display, spoken } = pair(reply, L);
      return {
        mode: 'traditional',
        source: 'cs_org_relation_miss',
        reply: display,
        spoken,
        chips: ['cs_org', 'main_menu'],
        learnable: false,
        expression: 'thinking',
        question: raw,
      };
    }

    const orgHit = findGoGoOrgPerson(raw);
    if (orgHit?.person || orgHit?.ambiguous) {
      const reply = orgHit.ambiguous
        ? formatGoGoOrgAmbiguousAnswer(orgHit.ambiguous, L)
        : formatGoGoOrgPersonAnswer(orgHit.person, L);
      const { display, spoken } = pair(reply, L);
      return {
        mode: 'traditional',
        source: 'cs_org_person',
        reply: display,
        spoken,
        chips: GOGO_SMART_CHIPS,
        learnable: false,
        expression: 'explaining',
        question: raw,
      };
    }
    // Who-is question but no employee match — never dump full org structure.
    if (/^(who\s*is|who's|مين\s*هو|من\s*هو|مين\s+|من\s+)/i.test(raw)) {
      const reply =
        L === 'ar'
          ? 'لم أجد هذا الاسم في هيكل مكتب خدمة العملاء المحفوظ. جرّب الاسم بالكامل، أو اسأل عن الهيكل للصورة الكاملة.'
          : 'I could not find that name in the saved CS Head Office directory. Try the full name, or ask for the org structure for the full picture.';
      const { display, spoken } = pair(reply, L);
      return {
        mode: 'traditional',
        source: 'cs_org_person_miss',
        reply: display,
        spoken,
        chips: ['cs_org', 'main_menu'],
        learnable: false,
        expression: 'thinking',
        question: raw,
      };
    }
  }

  const matched = matchFreeTextToFlow(raw, L);
  if (matched && /^(what_|tcs_|mx_|da_|av_|pqa_|how_|goto_|main_|feedback|survey|who_|nice_|george_|cs_org|knowledge_)/.test(matched)) {
    const looksOpen =
      raw.split(/\s+/).length > 8 ||
      /why|how come|explain|compare|difference|ليه|ازاي|اشرح|فرق/i.test(raw);
    if (!looksOpen || matched === 'cs_org') {
      return {
        mode: 'traditional',
        source: 'guide',
        flowNodeId: matched,
        question: raw,
      };
    }
  }

  return null;
}

/** Published admin catalog hit — beats learned memory on free text. */
export function resolveGoGoAdminQaTurn(text, lang, qaEntries) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const hit = matchAdminQaAnswer(qaEntries, text, L);
  if (!hit?.answer) return null;
  const { display, spoken } = pair(hit.answer, L);
  return {
    mode: 'admin_qa',
    source: 'admin_qa',
    reply: display,
    spoken,
    chips: GOGO_SMART_CHIPS,
    learnable: false,
    question: text,
    expression: 'success',
    adminQaMatch: hit,
  };
}

/** Instant learned (traditional memory) hit, or signal generative with learning hints. */
export function resolveGoGoLearnedTurn(text, lang, learnedEntries) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const learnedMatch = matchLearnedAnswer(learnedEntries, text, L);
  if (learnedMatch?.instant && learnedMatch.answer) {
    const spokenStored = learnedMatch.spoken || '';
    const { display, spoken } = pair(learnedMatch.answer, L);
    return {
      mode: 'learned',
      source: 'learned',
      reply: display,
      spoken: spokenStored || spoken,
      chips: GOGO_SMART_CHIPS,
      learnable: true,
      question: text,
      expression: learnedMatch.preferredStates?.[0] || 'success',
      preferredStates: learnedMatch.preferredStates || [],
      learnedMatch,
    };
  }
  return {
    mode: 'generative_needed',
    source: 'pending_generative',
    learnedMatch: learnedMatch || null,
    learningHint: buildLearningPromptHints(learnedMatch),
  };
}

export function resolveGoGoSafeFallback(text, lang, visitorName) {
  const L = lang === 'ar' ? 'ar' : 'en';
  const matchedNode = matchFreeTextToFlow(text, L);
  if (matchedNode) {
    const result = resolveFlowReply(matchedNode, L, visitorName);
    const { display, spoken } = pair(result.reply, L);
    return {
      mode: 'fallback',
      source: 'guide_fallback',
      reply: display,
      spoken,
      chips: result.chips || GOGO_SMART_CHIPS,
      action: result.action || null,
      learnable: true,
      question: text,
    };
  }

  const knowledge = resolveGoGoReply(text, L);
  const reply = String(knowledge?.reply || '').trim();
  const menu = resolveFlowReply('main_menu', L, visitorName);
  if (reply && knowledge?.topicId !== 'welcome') {
    const { display, spoken } = pair(reply, L);
    return {
      mode: 'fallback',
      source: 'faq_fallback',
      reply: display,
      spoken,
      chips: knowledge.chips || menu.chips || GOGO_SMART_CHIPS,
      action: knowledge.action || null,
      learnable: !knowledge?.denied,
      denied: !!knowledge?.denied,
      question: text,
    };
  }

  const tip =
    L === 'ar'
      ? 'خلّينا نكمل بالأزرار دي — اختار موضوع وأنا أرشدك.'
      : 'Let’s use the buttons below — pick a topic and I’ll guide you.';
  const { display, spoken } = pair(tip, L);
  const menuPair = pair(menu.reply, L);
  return {
    mode: 'fallback',
    source: 'menu_fallback',
    reply: display,
    spoken,
    extraReply: menuPair.display,
    chips: menu.chips,
    learnable: false,
    question: text,
  };
}
