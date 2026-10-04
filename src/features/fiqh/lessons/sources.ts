import type { FiqhSource } from "../fiqhTypes";

const B = (n: string, scope: string): FiqhSource => ({ id: `bukhari-${n}`, kind: "hadith", reference: `Sahîh al-Bukhârî, ${n}`, canonicalReference: n, authenticity: "Sahîh", scope });
const M = (n: string, scope: string): FiqhSource => ({ id: `muslim-${n}`, kind: "hadith", reference: `Sahîh Muslim, ${n}`, canonicalReference: n, authenticity: "Sahîh", scope });
const AD = (n: string, scope: string, grade = "Sahîh selon al-Albânî"): FiqhSource => ({ id: `abudawud-${n}`, kind: "hadith", reference: `Sunan Abî Dâwûd, ${n}`, canonicalReference: n, authenticity: grade, scope });
const T = (n: string, scope: string, grade = "Sahîh selon al-Albânî"): FiqhSource => ({ id: `tirmidhi-${n}`, kind: "hadith", reference: `Jâmi‘ at-Tirmidhî, ${n}`, canonicalReference: n, authenticity: grade, scope });
const IM = (n: string, scope: string, grade = "Sahîh selon al-Albânî"): FiqhSource => ({ id: `ibnmajah-${n}`, kind: "hadith", reference: `Sunan Ibn Mâjah, ${n}`, canonicalReference: n, authenticity: grade, scope });
const Q = (s: number, v: number, scope: string): FiqhSource => ({ id: `quran-${s}-${v}`, kind: "quran", reference: `Coran ${s}:${v}`, scope });

/**
 * Sources added with the hand-written lessons (2026 rewrite).
 * Each one is listed in the review file sent to the scholar.
 */
export const LESSON_SOURCES: FiqhSource[] = [
  // Purification
  M("223", "« La purification est la moitié de la foi »"),
  M("224", "aucune prière n’est acceptée sans purification"),
  B("157", "le Prophète ﷺ a fait ses ablutions en lavant chaque membre une fois"),
  B("158", "le Prophète ﷺ a fait ses ablutions en lavant chaque membre deux fois"),
  B("168", "le Prophète ﷺ aimait commencer par la droite, notamment dans sa purification"),
  B("185", "description des ablutions par ‘Abdullah ibn Zayd : essuyage de la tête de l’avant vers l’arrière puis retour"),
  B("60", "« Malheur aux talons [négligés], du Feu »"),
  M("241", "« Malheur aux talons [négligés], du Feu » : les pieds doivent être entièrement lavés"),
  M("234", "attestation de foi prononcée après les ablutions et sa récompense"),
  M("243", "un homme avait laissé sur son pied une partie sèche de la taille d’un ongle : « Retourne et fais bien tes ablutions »"),
  AD("175", "l’homme qui avait laissé une partie sèche sur son pied reçut l’ordre de refaire ablutions et prière"),
  AD("142", "bien faire les ablutions, passer l’eau entre les doigts et bien aspirer l’eau sauf en jeûnant"),
  B("201", "ablutions avec un mudd d’eau et ghusl avec un sâ‘ à cinq mudd"),
  B("887", "« Si ce n’était pas pénible pour ma communauté, je leur aurais ordonné le siwâk à chaque prière »"),
  B("269", "le madhy impose le wudû’ et le lavage de la partie intime, sans ghusl"),
  M("360", "question sur la viande de chameau : « Oui, faites les ablutions »"),
  B("137", "celui qui doute en prière ne la quitte pas avant d’entendre un son ou de sentir une odeur"),
  M("362", "celui qui ressent quelque chose dans son ventre et doute ne quitte pas la mosquée sans certitude"),
  M("330", "Umm Salama n’a pas à défaire ses tresses pour le ghusl : trois poignées d’eau sur la tête suffisent"),
  B("249", "description du ghusl du Prophète ﷺ par Maymûna"),
  B("877", "« Quand l’un de vous vient au vendredi, qu’il fasse le ghusl »"),
  B("879", "« Le ghusl du vendredi est un devoir pour tout pubère »"),
  B("282", "la femme qui a un rêve érotique fait le ghusl si elle voit le liquide"),
  AD("355", "Qays ibn ‘Âsim reçut l’ordre de faire le ghusl en embrassant l’islam"),
  B("335", "la terre a été rendue pour le Prophète ﷺ lieu de prière et moyen de purification"),
  AD("338", "deux hommes ont prié avec le tayammum puis trouvé l’eau dans le temps : l’un a refait, l’autre non, et tous deux ont été approuvés"),
  AD("162", "‘Alî : l’essuyage se fait sur le dessus des khuff"),
  T("96", "Safwân ibn ‘Assâl : on garde les khuff trois jours en voyage, sauf en cas de janâba"),
  B("305", "‘Â’isha, ayant ses règles pendant le Hajj : « Fais tout ce que fait le pèlerin, sauf le tawâf »"),
  B("304", "la femme qui a ses règles ne prie pas et ne jeûne pas"),
  M("302", "« Faites tout, sauf le rapport » avec l’épouse qui a ses règles"),
  B("228", "Fâtima bint Abî Hubaysh : la femme en istihâda fait le wudû’ pour chaque prière"),
  B("1926", "le Prophète ﷺ se levait en état de janâba à l’aube, faisait le ghusl et jeûnait"),
  B("223", "urine d’un nourrisson garçon : de l’eau aspergée sur le vêtement"),
  B("218", "deux hommes punis dans leur tombe, dont l’un ne se préservait pas de l’urine"),
  AD("650", "le Prophète ﷺ a retiré ses sandales pendant la prière en apprenant qu’elles étaient souillées, et a poursuivi"),
  Q(6, 145, "la bête morte, le sang répandu et la viande de porc sont une souillure (rijs)"),
  M("366", "« Quand la peau est tannée, elle devient pure »"),
  M("288", "‘Â’isha grattait le sperme du vêtement du Prophète ﷺ qui priait avec"),
  B("283", "« Le croyant ne devient pas impur »"),
  B("194", "le Prophète ﷺ a versé l’eau de ses ablutions sur Jâbir malade"),
];

export { B, M, AD, T, IM, Q };
