/**
 * Suit la récitation de l'utilisateur dans le texte du Coran : chaque mot reconnu par le téléphone est
 * comparé aux mots attendus (texte uthmani, sans voyelles) et le pointeur avance quand ça correspond.
 * La reconnaissance vocale se trompe souvent sur le Coran récité : la comparaison est donc tolérante
 * (lettres de base seulement, petite marge d'erreur) et regarde quelques mots en avance pour suivre
 * un mot mal entendu ou sauté. Elle ne recule jamais et n'invente rien : un mot non reconnu est ignoré.
 */

export type ReciteWord = { verseKey: string; position: number; norm: string; text?: string };

// Voyelles, signes coraniques, tatweel, hamza isolée.
const MARKS = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640\u0621]/g;

/**
 * Squelette d'un mot arabe : lettres de base et variantes unifiées. L'alif est gardé ; le petit alif
 * suscrit du texte uthmani compte comme un alif (ٱلْعَٰلَمِينَ = العالمين).
 */
export function normalizeArabic(value: string) {
  return value
    .replace(/\u0670/g, '\u0627') // alif suscrit → alif
    .replace(MARKS, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // alif sous toutes ses formes
    .replace(/\u0649/g, '\u064A') // alif maqsura → ya
    .replace(/\u0629/g, '\u0647') // ta marbuta → ha
    .replace(/\u0624/g, '\u0648') // waw hamza → waw
    .replace(/\u0626/g, '\u064A') // ya hamza → ya
    .replace(/[^\u0627-\u064A]/g, '');
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
  // Mots courts (لا, ما, الا…) : exacts seulement, sinon ils se confondent entre eux.
  if (longest <= 3) return false;
  return 1 - distance(heard, expected) / longest >= 0.6;
}

/**
 * Plus souple, seulement pour le mot attendu juste après la position actuelle : un mot coupé entre deux
 * morceaux (fragment de début ou de fin, 3 lettres au moins) ou allongé en fin de verset.
 */
function nextWordMatch(heard: string, expected: string) {
  if (wordsMatch(heard, expected)) return true;
  if (heard.length < 3 || expected.length < 4) return false;
  if (expected.startsWith(heard) || expected.endsWith(heard)) return true;
  return 1 - distance(heard, expected) / Math.max(heard.length, expected.length) >= 0.5;
}

const LOOKAHEAD = 3;
// Mots entendus non placés gardés pour retrouver où l'on est dans la sourate.
const MISSED_WINDOW = 10;
// Pour sauter ailleurs dans la sourate : au moins 3 mots qui se suivent, et 60 % de ce qui a été entendu.
const RELOCATE_MIN_WORDS = 3;
const RELOCATE_MIN_RATIO = 0.6;
// Mots derrière la position actuelle encore considérés comme « ici » (début du verset en cours).
const NEAR_BEHIND = 15;

/** `hits` : mots réellement entendus et reconnus (sert à décider) ; `matches` inclut les mots sautés (affichage). */
/**
 * `hits` : mots réellement entendus et reconnus (sert à décider) ; `matches` inclut les mots sautés (affichage) ;
 * `first` : index du premier mot reconnu.
 */
type Run = { matches: ReciteWord[]; hits: number; end: number; last: number | null; first: number | null };

export class RecitationAligner {
  private pointer: number;
  private lastMatched: number | null = null;
  private missed: string[] = [];
  // Mot(s) gardé(s) en attente quand la position n'est pas sûre : un seul mot ne suffit pas à la trouver.
  private pending: string[] = [];

  constructor(private readonly words: readonly ReciteWord[], startIndex = 0) {
    this.pointer = Math.max(0, Math.min(startIndex, words.length));
  }

  /** Traite des mots entendus ; renvoie le dernier mot reconnu dans le texte (ou null). */
  feed(heardWords: readonly string[]) {
    return this.feedAll(heardWords).at(-1) ?? (this.lastMatched === null ? null : this.words[this.lastMatched]);
  }

  /**
   * Renvoie les mots du texte reconnus, dans l'ordre (pour les allumer un par un).
   * Suit d'abord la suite du texte ; si ce qui est entendu n'y correspond pas, cherche le passage dans
   * toute la sourate (l'utilisateur peut commencer n'importe où). `strict` (paquets du serveur) : un paquet
   * n'est accepté que si une bonne part de ce qui a été entendu suit le texte.
   */
  feedAll(heardWords: readonly string[], strict = false) {
    const heard = [...this.pending, ...heardWords.map(normalizeArabic).filter(Boolean)];
    this.pending = [];
    if (!heard.length) return [];

    const local = this.matchFrom(this.pointer, heard);
    // Début d'écoute, ou suite retrouvée seulement en sautant des mots : la position n'est pas sûre
    // (ex. Al-Fâtiha 1:3 = fin de 1:1). On compare avec le reste de la sourate, en préférant un début de verset.
    const unsure = this.lastMatched === null || (local.first !== null && local.first - this.pointer >= 2);
    // Un seul mot entendu et la position n'est pas sûre (ex. « الرحمن » est dans 1:1 et 1:3) : on attend le suivant.
    if (unsure && heard.length < 2) {
      this.pending = heard;
      return [];
    }
    // Passages presque identiques (histoires parallèles, refrains) : un passage qui correspond mieux l'emporte.
    const partial = local.hits < heard.length && heard.length >= RELOCATE_MIN_WORDS;
    if (partial || (unsure && heard.length >= 2)) {
      const better = this.relocate(heard, heard.length >= RELOCATE_MIN_WORDS ? RELOCATE_MIN_WORDS : heard.length, unsure);
      const startsVerse = (run: Run) => run.first !== null && this.words[run.first].position === 1;
      // On récite en avançant : revenir en arrière vers un passage semblable demande une correspondance nettement meilleure.
      const backward = better !== null && better.first !== null && better.first < this.pointer - NEAR_BEHIND;
      const margin = backward ? 2 : 1;
      if (better && better.first !== local.first && (better.hits >= local.hits + margin || (!backward && unsure && better.hits === local.hits && startsVerse(better) && !startsVerse(local)))) {
        this.commit(better);
        return better.matches;
      }
    }
    const enough = local.hits >= Math.max(1, Math.ceil(heard.length * 0.5)) && (heard.length < 3 || local.hits >= 2);
    if (local.hits && (!strict || enough)) {
      this.commit(local);
      return local.matches;
    }

    this.missed = [...this.missed, ...heard].slice(-MISSED_WINDOW);
    const found = this.relocate(this.missed);
    if (!found) return [];
    this.commit(found);
    return found.matches;
  }

  private commit(run: Run) {
    this.pointer = run.end;
    this.lastMatched = run.last;
    this.missed = [];
  }

  /** Suit les mots entendus à partir de `start`, en tolérant un mot sauté ou mal entendu. */
  private matchFrom(start: number, heard: readonly string[]): Run {
    let pointer = start;
    let last: number | null = null;
    let first: number | null = null;
    let hits = 0;
    const matches: ReciteWord[] = [];
    for (const word of heard) {
      for (let offset = 0; offset <= LOOKAHEAD && pointer + offset < this.words.length; offset += 1) {
        const expected = this.words[pointer + offset].norm;
        const loose = start === this.pointer && offset === 0;
        if (loose ? nextWordMatch(word, expected) : wordsMatch(word, expected)) {
          last = pointer + offset;
          if (first === null) first = last;
          // Mots sautés (perdus entre deux morceaux, mal entendus) : forcément lus, on les allume aussi,
          // sauf avant le tout premier mot retrouvé (on ne sait pas d'où l'utilisateur est parti).
          if (matches.length || start === this.pointer) for (let skipped = pointer; skipped < last; skipped += 1) matches.push(this.words[skipped]);
          matches.push(this.words[last]);
          hits += 1;
          pointer = last + 1;
          break;
        }
      }
    }
    return { matches, hits, end: pointer, last, first };
  }

  /**
   * Cherche dans toute la sourate le passage qui correspond le mieux aux mots entendus.
   * Classement : plus de mots reconnus ; puis (si `preferVerseStart`) un passage qui commence au début d'un
   * verset ; puis le plus proche de la position actuelle (le verset en cours compte comme tout proche).
   */
  private relocate(heard: readonly string[], minHits = RELOCATE_MIN_WORDS, preferVerseStart = false): Run | null {
    if (heard.length < minHits) return null;
    let best: { run: Run; verseStart: boolean; distance: number } | null = null;
    for (let start = 0; start < this.words.length; start += 1) {
      // On ne part que d'un mot qui ressemble à l'un des premiers mots entendus.
      if (!heard.slice(0, 3).some((word) => wordsMatch(word, this.words[start].norm))) continue;
      const run = this.matchFrom(start, heard);
      const count = run.hits;
      if (count < minHits || count < heard.length * RELOCATE_MIN_RATIO) continue;
      const verseStart = preferVerseStart && run.first !== null && this.words[run.first].position === 1;
      const distance = start >= this.pointer - NEAR_BEHIND ? Math.abs(start - this.pointer) : this.words.length + (this.pointer - start);
      const better = !best
        || count > best.run.hits
        || (count === best.run.hits && verseStart && !best.verseStart)
        || (count === best.run.hits && verseStart === best.verseStart && distance < best.distance);
      if (better) best = { run, verseStart, distance };
    }
    return best?.run ?? null;
  }

  get finished() {
    return this.pointer >= this.words.length;
  }
}
