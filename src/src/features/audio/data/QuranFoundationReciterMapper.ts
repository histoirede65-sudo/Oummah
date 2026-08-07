import muhammadSiddiqAlMinshawi from '../../../../assets/reciters/Muhammad Siddiq Al-Minshawi.png';
import aliJaber from '../../../../assets/reciters/ali_jaber.png';
import abdulBasit from '../../../../assets/reciters/abdul_basit.png';
import abuBakrAlShatri from '../../../../assets/reciters/abu_bakr_alshatri.png';
import ahmedAlAjmi from '../../../../assets/reciters/ahmed_alajmi.png';
import bandarBalila from '../../../../assets/reciters/bandar_balila.png';
import faresAbbad from '../../../../assets/reciters/fares_abbad.png';
import haniArRifai from '../../../../assets/reciters/hani_arrifai.png';
import houdaifi from '../../../../assets/reciters/houdaifi.png';
import khalidAlQahtani from '../../../../assets/reciters/khalid_alqahtani.png';
import maherAlMuaiqly from '../../../../assets/reciters/maher_almuaiqly.png';
import mahmoudAlHusary from '../../../../assets/reciters/mahmoud_alhusary.png';
import misharyAlAfasy from '../../../../assets/reciters/mishary_alafasy.png';
import saadAlGhamdi from '../../../../assets/reciters/saad_alghamdi.png';
import shuraim from '../../../../assets/reciters/shuraim.png';
import sudais from '../../../../assets/reciters/sudais.png';
import yasserAlDossari from '../../../../assets/reciters/yasser_aldossari.png';

export const RECITER_IMAGES: Record<number, any> = {
  7: misharyAlAfasy,
  159: maherAlMuaiqly,
  3: sudais,
  10: shuraim,
  11: aliJaber,
  14: aliJaber,
  13: saadAlGhamdi,
  19: ahmedAlAjmi,
  4: abuBakrAlShatri,
  5: haniArRifai,
  6: mahmoudAlHusary,
  12: houdaifi,
  9: muhammadSiddiqAlMinshawi,
  1: abdulBasit,
  2: abdulBasit,
  160: bandarBalila,
  174: yasserAlDossari,
};

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function getReciterImage(id: number, name = '') {
  const normalized = normalizeName(name);

  if (RECITER_IMAGES[id]) return RECITER_IMAGES[id];
  if (normalized.includes('mishary') || normalized.includes('afasy') || normalized.includes('alafasi')) return misharyAlAfasy;
  if (normalized.includes('khalifahaltunaiji') || normalized.includes('khalifaaltunaiji') || normalized.includes('tunaiji')) return khalidAlQahtani;
  if (normalized.includes('abdullahhamadabusharida') || normalized.includes('abdullahhammadabusharida') || normalized.includes('abusharida') || normalized.includes('abushareeda') || normalized.includes('abushuraida')) return faresAbbad;
  if (normalized.includes('alijab') || normalized.includes('abdullahalijab')) return aliJaber;
  if (normalized.includes('minshawi') || normalized.includes('menshawi')) return muhammadSiddiqAlMinshawi;
  if (normalized.includes('hudaify') || normalized.includes('hudaifi') || normalized.includes('houdaifi') || normalized.includes('hudhaify')) return houdaifi;
  if (normalized.includes('husary') || normalized.includes('hussary')) return mahmoudAlHusary;
  if (normalized.includes('maher') || normalized.includes('muaiq')) return maherAlMuaiqly;
  if (normalized.includes('sudais')) return sudais;
  if (normalized.includes('shuraim')) return shuraim;
  if (normalized.includes('ghamdi')) return saadAlGhamdi;
  if (normalized.includes('ajmi')) return ahmedAlAjmi;
  if (normalized.includes('shatri')) return abuBakrAlShatri;
  if (normalized.includes('rifai')) return haniArRifai;
  if (normalized.includes('balila')) return bandarBalila;
  if (normalized.includes('dossari') || normalized.includes('dosari')) return yasserAlDossari;
  if (normalized.includes('abdulbasit')) return abdulBasit;

  return undefined;
}
