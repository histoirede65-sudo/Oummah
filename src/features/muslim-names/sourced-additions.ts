import type { MuslimName } from './types';

/**
 * Names added on 2026-10-05, each with a source for every field shown:
 * - meaning: Behind the Name entry (name-meanings.ts), or the Quran in Hamidullah's translation for al-Yasa‘;
 * - Companions: a hadith of Sahih al-Bukhârî naming the person (French text of the fawazahmed0 collection);
 * - role sentences: translation of the Behind the Name entry when it is the source.
 */
export const SOURCED_ADDITION_NAMES: MuslimName[] = [
  {
    id: 'al-yasa', gender: 'boy', name: 'Al-Yasa‘', arabic: 'اليسع', transliteration: 'al-Yasaʿ',
    origin: ['Usage arabe'],
    meaning: 'Nom d’un prophète cité dans le Coran (6:86 ; 38:48), que la traduction de Hamidullah rend par « Elisée ».',
    story: '',
    status: 'recommended', statusReason: '',
    variants: ['Alyasa', 'Elyasa', 'Al-Yasa'],
    tags: ['coranique', 'prophete', 'rare'],
    historicalRole: 'Prophète al-Yasa‘ عليه السلام.',
    quranReference: '6:86-89 · 38:48',
    sources: [{ kind: 'quran', label: 'Coran · traduction Hamidullah', reference: '6:89 — « C’est à eux que Nous avons donné le Livre, la sagesse et la prophétie. »', url: 'https://quran.com/6/86-89', supports: ['nom d’un prophète'] }],
  },
  {
    id: 'uthman', gender: 'boy', name: 'Uthman', arabic: 'عثمان', transliteration: 'ʿUthmān',
    origin: ['Arabe'],
    meaning: '« Petit de l’outarde » en arabe (l’outarde est un grand oiseau).',
    story: '‘Uthmân fut un Compagnon du Prophète Muhammad ﷺ et épousa deux de ses filles. Il fut le troisième calife des musulmans.',
    status: 'permitted', statusReason: '',
    variants: ['Othman', 'Osman', 'Outhmane', 'Usman'],
    tags: ['compagnon', 'classique'],
    historicalRole: '‘Uthmân ibn ‘Affân رضي الله عنه.',
    sources: [{ kind: 'hadith', label: 'Sahih al-Bukhârî 450', reference: 'Hadith rapporté par ‘Ubaydullah al-Khawlânî : « J’ai entendu ‘Uthman bin ‘Affan dire… »', url: 'https://sunnah.com/bukhari:450', supports: ['Compagnon nommé dans le hadith'] }],
  },
  {
    id: 'usama', gender: 'boy', name: 'Usama', arabic: 'أسامة', transliteration: 'Usāma',
    origin: ['Arabe'],
    meaning: '« Lion » en arabe.',
    story: '',
    status: 'permitted', statusReason: '',
    variants: ['Oussama', 'Osama', 'Ousama'],
    tags: ['compagnon', 'court', 'facile-france'],
    historicalRole: 'Usâma ibn Zayd رضي الله عنهما.',
    sources: [{ kind: 'hadith', label: 'Sahih al-Bukhârî 139', reference: 'Hadith rapporté par Usama bin Zaid.', url: 'https://sunnah.com/bukhari:139', supports: ['Compagnon nommé dans le hadith'] }],
  },
  {
    id: 'musab', gender: 'boy', name: 'Musab', arabic: 'مصعب', transliteration: 'Muṣʿab',
    origin: ['Arabe'],
    meaning: '« Dur, difficile, coriace » en arabe, de la racine صعب (ṣaʿuba), « être dur, être difficile ».',
    story: 'Mus‘ab ibn ‘Umayr fut un Compagnon du Prophète Muhammad ﷺ.',
    status: 'permitted', statusReason: '',
    variants: ['Mosab', 'Moussab', 'Mus‘ab'],
    tags: ['compagnon', 'rare'],
    historicalRole: 'Mus‘ab ibn ‘Umayr رضي الله عنه.',
    sources: [{ kind: 'hadith', label: 'Sahih al-Bukhârî 1274', reference: '‘Abd ar-Rahmân ibn ‘Awf : « Mus‘ab bin ‘Umair a été martyrisé… »', url: 'https://sunnah.com/bukhari:1274', supports: ['Compagnon nommé dans le hadith'] }],
  },
  {
    id: 'sawda', gender: 'girl', name: 'Sawda', arabic: 'سودة', transliteration: 'Sawda',
    origin: ['Arabe'],
    meaning: '« Noire » en arabe.',
    story: 'C’était le nom d’une épouse du Prophète Muhammad ﷺ.',
    status: 'recommended', statusReason: '',
    variants: ['Sauda', 'Saouda'],
    tags: ['sahabiyya', 'rare'],
    historicalRole: 'Sawda bint Zam‘a رضي الله عنها.',
    sources: [{ kind: 'hadith', label: 'Sahih al-Bukhârî 146', reference: '‘Aisha : « Sauda bint Zam‘a, l’épouse du Prophète (ﷺ), est sortie… »', url: 'https://sunnah.com/bukhari:146', supports: ['Compagnonne nommée dans le hadith'] }],
  },
  {
    id: 'hind', gender: 'girl', name: 'Hind', arabic: 'هند', transliteration: 'Hind',
    origin: ['Arabe'],
    meaning: 'Signifie peut-être « groupe de chameaux » en arabe.',
    story: '',
    status: 'recommended', statusReason: '',
    variants: ['Hinde'],
    tags: ['sahabiyya', 'court'],
    historicalRole: 'Hind bint ‘Utba رضي الله عنها.',
    sources: [{ kind: 'hadith', label: 'Sahih al-Bukhârî 3825', reference: '‘Aisha : « Hind bint ‘Utba est venue et a dit : Ô Messager d’Allah !… »', url: 'https://sunnah.com/bukhari:3825', supports: ['Compagnonne nommée dans le hadith'] }],
  },
  {
    id: 'ramla', gender: 'girl', name: 'Ramla', arabic: 'رملة', transliteration: 'Ramla',
    origin: ['Arabe'],
    meaning: '« Sable » en arabe.',
    story: 'C’était le nom de l’une des épouses du Prophète Muhammad ﷺ.',
    status: 'recommended', statusReason: '',
    variants: ['Ramlah'],
    tags: ['sahabiyya', 'rare'],
  },
];
