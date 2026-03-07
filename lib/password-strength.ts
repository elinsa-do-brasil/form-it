import { zxcvbn, zxcvbnOptions, type Score } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import * as zxcvbnPtBrPackage from "@zxcvbn-ts/language-pt-br";

type PasswordStrengthTone = {
  label: "Muito fraca" | "Fraca" | "Razoável" | "Boa" | "Forte";
  progressClassName: string;
  textClassName: string;
};

export type PasswordStrengthSummary = {
  score: Score;
  label: PasswordStrengthTone["label"];
  progressPercent: number;
  progressClassName: string;
  textClassName: string;
  warning: string | null;
  suggestions: string[];
  crackTimeDisplay: string;
};

const PASSWORD_STRENGTH_TONE: Record<Score, PasswordStrengthTone> = {
  0: {
    label: "Muito fraca",
    progressClassName: "bg-red-500",
    textClassName: "text-red-500",
  },
  1: {
    label: "Fraca",
    progressClassName: "bg-orange-500",
    textClassName: "text-orange-500",
  },
  2: {
    label: "Razoável",
    progressClassName: "bg-yellow-500",
    textClassName: "text-yellow-500",
  },
  3: {
    label: "Boa",
    progressClassName: "bg-lime-500",
    textClassName: "text-lime-500",
  },
  4: {
    label: "Forte",
    progressClassName: "bg-emerald-500",
    textClassName: "text-emerald-500",
  },
};

let hasConfiguredZxcvbn = false;

const EN_TO_PT_BR_FEEDBACK: Record<string, string> = {
  "Use a few words, avoid common phrases":
    "Use várias palavras, mas evite frases comuns.",
  "No need for symbols, digits, or uppercase letters":
    "Você pode criar senhas fortes sem usar símbolos, números ou letras maiúsculas.",
  "Add another word or two. Uncommon words are better.":
    "Adicione mais palavras menos comuns.",
  "Straight rows of keys are easy to guess":
    "Letras que vêm em sequência no teclado são fáceis de adivinhar.",
  "Short keyboard patterns are easy to guess":
    "Padrões de teclado curtos são fáceis de adivinhar.",
  'Repeats like "aaa" are easy to guess':
    'Caracteres repetidos, como "aaa", são fáceis de adivinhar.',
  'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
    'Padrões repetidos como "abcabcabc" são fáceis de adivinhar.',
  "Sequences like abc or 6543 are easy to guess":
    'Sequências comuns de caracteres, como "abc", são fáceis de adivinhar.',
  "Recent years are easy to guess":
    "Anos recentes são fáceis de adivinhar.",
  Dates: "Datas são fáceis de adivinhar.",
  "This is a top-10 common password": "Esta é uma senha muito usada.",
  "This is a top-100 common password":
    "Esta é uma senha usada frequentemente.",
  "This is a very common password": "Esta é uma senha comumente usada.",
  "This is similar to a commonly used password":
    "Isso é semelhante a uma senha comumente usada.",
  "Single words are easy to guess": "Palavras simples são fáceis de adivinhar.",
  "Names and surnames by themselves are easy to guess":
    "Nomes ou sobrenomes são fáceis de adivinhar.",
  "Common names and surnames are easy to guess":
    "Nomes e sobrenomes comuns são fáceis de adivinhar.",
  "Avoid recent years": "Evite anos recentes.",
  "Avoid years that are associated with you":
    "Evite anos associados a você.",
  "Avoid dates and years that are associated with you":
    "Evite datas e anos associados a você.",
  "Avoid sequences": "Evite sequências comuns de caracteres.",
  "Avoid repeated words and characters":
    "Evite repetir sequências de caracteres e palavras.",
  "Avoid common words written backwards":
    'Evite utilizar palavras comuns escritas de "trás para frente".',
  "Avoid predictable substitutions like '@' instead of 'a'":
    "Evite substituições previsíveis de letras, como '@' por 'a'.",
};

function ensureZxcvbnConfigured() {
  if (hasConfiguredZxcvbn) {
    return;
  }

  zxcvbnOptions.setOptions({
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary,
      ...zxcvbnPtBrPackage.dictionary,
    },
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    translations: zxcvbnPtBrPackage.translations,
    useLevenshteinDistance: true,
  });

  hasConfiguredZxcvbn = true;
}

function toScore(value: number): Score {
  if (value <= 0) {
    return 0;
  }

  if (value >= 4) {
    return 4;
  }

  return value as Score;
}

export function resolvePasswordStrengthTone(score: number): PasswordStrengthTone {
  return PASSWORD_STRENGTH_TONE[toScore(score)];
}

export function evaluatePasswordStrength(
  password: string,
  userInputs: (string | number)[] = [],
): PasswordStrengthSummary | null {
  if (!password.trim()) {
    return null;
  }

  ensureZxcvbnConfigured();

  const filteredUserInputs = userInputs.filter((value) => {
    if (typeof value === "number") {
      return true;
    }

    return value.trim().length > 0;
  });

  const result = zxcvbn(password, filteredUserInputs);
  const score = toScore(result.score);
  const tone = resolvePasswordStrengthTone(score);

  const translatedWarning = result.feedback.warning
    ? EN_TO_PT_BR_FEEDBACK[result.feedback.warning] || result.feedback.warning
    : null;
  const translatedSuggestions = result.feedback.suggestions.map(
    (suggestion) => EN_TO_PT_BR_FEEDBACK[suggestion] || suggestion,
  );

  return {
    score,
    label: tone.label,
    progressPercent: ((score + 1) / 5) * 100,
    progressClassName: tone.progressClassName,
    textClassName: tone.textClassName,
    warning: translatedWarning,
    suggestions: translatedSuggestions,
    crackTimeDisplay: result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
  };
}
