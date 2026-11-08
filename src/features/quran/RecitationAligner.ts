/**
 * Suit la récitation de l'utilisateur dans le texte du Coran : chaque mot reconnu par le téléphone est
 * comparé aux mots attendus (texte uthmani, sans voyelles) et le pointeur avance quand ça correspond.
 * La reconnaissance vocale se trompe souvent sur le Coran récité : la comparaison est donc tolérante
 * (lettres de base seulement, petite marge d'erreur) et regarde quelques mots en avance pour suivre
 * un mot mal entendu ou sauté. Elle ne recule jamais et n'invente rien : un mot non reconnu est ignoré.
 */

export type ReciteWord = { verseKey: string; position: number; norm: string; text?: string };

// Voyelles, signes coraniques, tatweel, hamza isolée.
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u0621]/g;

/** Squelette d'un mot arabe : lettres de base, variantes unifiées, alif retiré (écrit ou non selon l'orthographe). */
export function normalizeArabic(value: string) {
  return value
    .replace(MARKS, '')
    .replace(/[\u0622\u0623\u0625\u0671\u0627]/g, '') // alif sous toutes ses formes
    .replace(/\u0649/g, '\u064A') // alif maqsura → ya
    .replace(/\u0629/g, '\u0647') // ta marbuta → ha
    .replace(/\u0624/g, '\u0648') // waw hamza → waw
    .replace(/\u0626/g, '\u064A') // ya hamza → ya
    .replace(/[^\u0628-\u064A]/g, '');
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** Vrai si le mot entendu correspond au mot attendu (exact pour les mots très courts). */
export function wordsMatch(heard: string, expected: string) {
  if (!heard || !expected) return false;
  if (heard === expected) return true;
  const longest = Math.max(heard.length, expected.length);
  if (longest <= 2) return false;
  return 1 - distance(heard, expected) / longest >= 0.6;
}

const LOOKAHEAD = 3;

export class RecitationAligner {
  private pointer: number;
  private lastMatched: number | null = null;

  constructor(private readonly words: readonly ReciteWord[], startIndex = 0) {
    this.pointer = Math.max(0, Math.min(startIndex, words.length));
  }

  /** Traite des mots entendus ; renvoie le dernier mot reconnu dans le texte (ou null). */
  feed(heardWords: readonly string[]) {
    return this.feedAll(heardWords).at(-1) ?? (this.lastMatched === null ? null : this.words[this.lastMatched]);
  }

  /** Comme feed, mais renvoie tous les mots du texte reconnus, dans l'ordre (pour les allumer un par un). */
  feedAll(heardWords: readonly string[], strict = false) {
    // Mode strict (paquets du serveur) : on essaie sur une copie, et on n'avance que si une bonne part
    // de ce qui a été entendu suit le texte. Du français ou des paroles sans rapport sont rejetés.
    if (strict) {
      const trial = new RecitationAligner(this.words, this.pointer);
      const result = trial.feedAll(heardWords);
      const heardCount = heardWords.map(normalizeArabic).filter(Boolean).length;
      if (!result.length || result.length < Math.max(1, Math.ceil(heardCount * 0.5)) || (heardCount >= 3 && result.length < 2)) return [];
    }
    const matched: ReciteWord[] = [];
    for (const raw of heardWords) {
      const heard = normalizeArabic(raw);
      if (!heard) continue;
      for (let offset = 0; offset <= LOOKAHEAD && this.pointer + offset < this.words.length; offset += 1) {
        if (wordsMatch(heard, this.words[this.pointer + offset].norm)) {
          this.lastMatched = this.pointer + offset;
          matched.push(this.words[this.pointer + offset]);
          this.pointer += offset + 1;
          break;
        }
      }
    }
    return matched;
  }

  /** Texte des prochains mots attendus (indice donné à la transcription côté serveur). */
  upcoming(count: number) {
    return this.words.slice(this.pointer, this.pointer + count).map((word) => word.text ?? '').join(' ').trim();
  }

  get finished() {
    return this.pointer >= this.words.length;
  }
}
