import muhammadSiddiqAlMinshawi from '../../../../assets/reciters/webp/Muhammad Siddiq Al-Minshawi.webp';
import aliJaber from '../../../../assets/reciters/webp/ali_jaber.webp';
import abdulBasit from '../../../../assets/reciters/webp/abdul_basit.webp';
import abuBakrAlShatri from '../../../../assets/reciters/webp/abu_bakr_alshatri.webp';
import ahmedAlAjmi from '../../../../assets/reciters/webp/ahmed_alajmi.webp';
import bandarBalila from '../../../../assets/reciters/webp/bandar_balila.webp';
import faresAbbad from '../../../../assets/reciters/webp/fares_abbad.webp';
import haniArRifai from '../../../../assets/reciters/webp/hani_arrifai.webp';
import houdaifi from '../../../../assets/reciters/webp/houdaifi.webp';
import khalidAlQahtani from '../../../../assets/reciters/webp/khalid_alqahtani.webp';
import maherAlMuaiqly from '../../../../assets/reciters/webp/maher_almuaiqly.webp';
import mahmoudAlHusary from '../../../../assets/reciters/webp/mahmoud_alhusary.webp';
import misharyAlAfasy from '../../../../assets/reciters/webp/mishary_alafasy.webp';
import saadAlGhamdi from '../../../../assets/reciters/webp/saad_alghamdi.webp';
import shuraim from '../../../../assets/reciters/webp/shuraim.webp';
import sudais from '../../../../assets/reciters/webp/sudais.webp';
import yasserAlDossari from '../../../../assets/reciters/webp/yasser_aldossari.webp';
import ahmedAbdelhamidTahoun from '../../../../assets/reciters/webp/ahmed_abdelhamid_tahoun.webp';

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
  12: mahmoudAlHusary,
  9: muhammadSiddiqAlMinshawi,
  1: abdulBasit,
  2: abdulBasit,
  160: bandarBalila,
  174: yasserAlDossari,
  176: ahmedAbdelhamidTahoun,
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
