import type { CatalogReciter } from '../domain/audio';

import abuBakrAlShatri from '../../../../assets/reciters/abu_bakr_alshatri.png';
import abdulBasit from '../../../../assets/reciters/abdul_basit.png';
import ahmedAlAjmi from '../../../../assets/reciters/ahmed_alajmi.png';
import aliJaber from '../../../../assets/reciters/ali_jaber.png';
import bandarBalila from '../../../../assets/reciters/bandar_balila.png';
import faresAbbad from '../../../../assets/reciters/fares_abbad.png';
import haniArRifai from '../../../../assets/reciters/hani_arrifai.png';
import houdaifi from '../../../../assets/reciters/houdaifi.png';
import idrisAbkar from '../../../../assets/reciters/idris_abkar.png';
import khalidAlQahtani from '../../../../assets/reciters/khalid_alqahtani.png';
import maherAlMuaiqly from '../../../../assets/reciters/maher_almuaiqly.png';
import mahmoudAlHusary from '../../../../assets/reciters/mahmoud_alhusary.png';
import misharyAlAfasy from '../../../../assets/reciters/mishary_alafasy.png';
import muhammadAyyub from '../../../../assets/reciters/muhammad_ayyub.png';
import muhammadSiddiqAlMinshawi from '../../../../assets/reciters/Muhammad Siddiq Al-Minshawi.png';
import nasserAlQatami from '../../../../assets/reciters/nasser_alqatami.png';
import saadAlGhamdi from '../../../../assets/reciters/saad_alghamdi.png';
import shuraim from '../../../../assets/reciters/shuraim.png';
import sudais from '../../../../assets/reciters/sudais.png';
import yasserAlDossari from '../../../../assets/reciters/yasser_aldossari.png';

type ReciterSeed = Pick<CatalogReciter, 'id' | 'name' | 'country' | 'style' | 'image' | 'birthYear'>;

const seeds: readonly ReciterSeed[] = [
  { id: 'mishary-alafasy', name: 'Mishary Rashid Al-Afasy', country: 'Koweït', style: 'murattal', image: misharyAlAfasy, birthYear: 1976 },
  { id: 'abdulbasit-abdulsamad', name: 'Abdul Basit Abdus-Samad', country: 'Égypte', style: 'mujawwad', image: abdulBasit, birthYear: 1927 },
  { id: 'maher-al-muaiqly', name: 'Maher Al-Muaiqly', country: 'Arabie saoudite', style: 'murattal', image: maherAlMuaiqly, birthYear: 1969 },
  { id: 'saad-al-ghamdi', name: 'Saad Al-Ghamdi', country: 'Arabie saoudite', style: 'murattal', image: saadAlGhamdi, birthYear: 1967 },
  { id: 'yasser-al-dosari', name: 'Yasser Al-Dosari', country: 'Arabie saoudite', style: 'murattal', image: yasserAlDossari, birthYear: 1980 },
  { id: 'muhammad-siddiq-minshawi', name: 'Muhammad Siddiq Al-Minshawi', country: 'Égypte', style: 'mujawwad', image: muhammadSiddiqAlMinshawi, birthYear: 1920 },
  { id: 'mahmoud-khalil-al-husary', name: 'Mahmoud Khalil Al-Husary', country: 'Égypte', style: 'murattal', image: mahmoudAlHusary, birthYear: 1917 },
  { id: 'abdurrahman-as-sudais', name: 'Abdurrahman As-Sudais', country: 'Arabie saoudite', style: 'murattal', image: sudais, birthYear: 1960 },
  { id: 'saud-ash-shuraim', name: 'Saud Ash-Shuraim', country: 'Arabie saoudite', style: 'murattal', image: shuraim, birthYear: 1964 },
  { id: 'ali-jaber', name: 'Ali Jaber', country: 'Arabie saoudite', style: 'murattal', image: aliJaber, birthYear: 1953 },
  { id: 'muhammad-ayyub', name: 'Muhammad Ayyub', country: 'Arabie saoudite', style: 'murattal', image: muhammadAyyub, birthYear: 1952 },
  { id: 'abu-bakr-ash-shatri', name: 'Abu Bakr Ash-Shatri', country: 'Arabie saoudite', style: 'murattal', image: abuBakrAlShatri, birthYear: 1970 },
  { id: 'ahmed-al-ajmi', name: 'Ahmed Al-Ajmi', country: 'Arabie saoudite', style: 'murattal', image: ahmedAlAjmi, birthYear: 1968 },
  { id: 'fares-abbad', name: 'Fares Abbad', country: 'Yémen', style: 'murattal', image: faresAbbad, birthYear: 1980 },
  { id: 'hani-ar-rifai', name: 'Hani Ar-Rifai', country: 'Arabie saoudite', style: 'murattal', image: haniArRifai, birthYear: 1974 },
  { id: 'idris-abkar', name: 'Idris Abkar', country: 'Somalie', style: 'murattal', image: idrisAbkar, birthYear: 1975 },
  { id: 'nasser-al-qatami', name: 'Nasser Al-Qatami', country: 'Arabie saoudite', style: 'murattal', image: nasserAlQatami, birthYear: 1980 },
  { id: 'khalid-al-qahtani', name: 'Khalid Al-Qahtani', country: 'Arabie saoudite', style: 'murattal', image: khalidAlQahtani },
  { id: 'bandar-balila', name: 'Bandar Balila', country: 'Arabie saoudite', style: 'murattal', image: bandarBalila, birthYear: 1975 },
  { id: 'ali-al-hudhaify', name: 'Ali Al-Hudhaify', country: 'Arabie saoudite', style: 'murattal', image: houdaifi, birthYear: 1947 },
];

export const RECITERS: readonly CatalogReciter[] = seeds.map((reciter, index) => ({
  ...reciter,
  language: 'ar',
  photoUri: reciter.id,
  portraitHdUri: reciter.id,
  audioSource: `mock:${reciter.id}`,
  availableSurahs: 114,
  popularity: 100 - index,
  popularSurahIds: [1, 2, 18, 36, 55, 67],
  totalDurationSeconds: 28_800,
  biography: `Une récitation reconnue, proposée pour l’écoute complète du Coran.`,
}));

export class MockReciterDataSource {
  async list() { return RECITERS; }
  async get(id: string) { return RECITERS.find((reciter) => reciter.id === id) ?? null; }
}
