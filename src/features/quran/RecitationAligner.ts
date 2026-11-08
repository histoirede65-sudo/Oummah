/**
 * Suit la récitation de l'utilisateur dans le texte du Coran : chaque mot reconnu par le téléphone est
 * comparé aux mots attendus (texte uthmani, sans voyelles) et le pointeur avance quand ça correspond.
 * La reconnaissance vocale se trompe souvent sur le Coran récité : la comparaison est donc tolérante
 * (lettres de base seulement, petite marge d'erreur) et regarde quelques mots en avance pour suivre
 * un mot mal entendu ou sauté. Elle ne recule jamais et n'invente rien : un mot non reconnu est ignoré.
 */

export type ReciteWord = { verseKey: string; position: number; norm: string };

// Voyelles, signes coraniques, tatweel, hamza isolée.
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـء]/g;

/** Squelette d'un mot arabe : lettres de base, variantes unifiées, alif retiré (écrit ou non selon l'orthographe). */
export function normalizeArabic(value: string) {
  return value
    .replace(MARKS, '')
    .replace(/[آأإٱا]/g, '') // alif sous toutes ses formes
    .replace(/ى/g, 'ي') // alif maqsura → ya
    .replace(/ة/g, 'ه') // ta marbuta → ha
    .replace(/ؤ/g, 'و') // waw hamza → waw
    .replace(/ئ/g, 'ي') // ya hamza → ya
    .replace(/[^ب-ي]/g, '');
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
    for (const raw of heardWords) {
      const heard = normalizeArabic(raw);
      if (!heard) continue;
      for (let offset = 0; offset <= LOOKAHEAD && this.pointer + offset < this.words.length; offset += 1) {
        if (wordsMatch(heard, this.words[this.pointer + offset].norm)) {
          this.lastMatched = this.pointer + offset;
          this.pointer += offset + 1;
          break;
        }
      }
    }
    return this.lastMatched === null ? null : this.words[this.lastMatched];
  }

  get finished() {
    return this.pointer >= this.words.length;
  }
}
