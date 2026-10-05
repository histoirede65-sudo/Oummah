import type { LanguageCode } from "../../i18n";
import type { DuaCategory, DuaItem } from "./DuaCatalog";

// Titres anglais, indexés par le titre français du catalogue.
const ENGLISH_TITLES: Readonly<Record<string, string>> = {
  "Adhkār du matin": "Morning adhkār",
  "Adhkār du soir": "Evening adhkār",
  "Adhkār du matin et du soir": "Morning and evening adhkār",
  "Avant de dormir": "Before sleeping",
  "Au réveil": "Upon waking up",
  "En entrant aux toilettes": "Entering the toilet",
  "En sortant des toilettes": "Leaving the toilet",
  "Avant les ablutions": "Before ablution",
  "Après les ablutions": "After ablution",
  "En sortant de chez soi": "Leaving home",
  "En entrant chez soi": "Entering home",
  "En allant à la mosquée": "Going to the mosque",
  "En entrant à la mosquée": "Entering the mosque",
  "En sortant de la mosquée": "Leaving the mosque",
  "Autour de l’adhān": "Around the adhān",
  "En s’habillant": "Getting dressed",
  "En portant un vêtement neuf": "Wearing a new garment",
  "Pour celui qui porte un vêtement neuf": "For someone wearing a new garment",
  "En retirant ses vêtements": "Undressing",
  "Invocation d’ouverture de la prière": "Opening supplication of the prayer",
  "Pendant l’inclinaison": "During rukū‘",
  "En se relevant de l’inclinaison": "Rising from rukū‘",
  "Pendant la prosternation": "During prostration",
  "Entre les deux prosternations": "Between the two prostrations",
  "Prosternation de récitation": "Prostration of recitation",
  "Prière sur le Prophète après le tashahhud": "Prayer upon the Prophet after the tashahhud",
  "Après le dernier tashahhud": "After the last tashahhud",
  "Après la prière": "After the prayer",
  "Prière de consultation": "Prayer of seeking guidance (istikhārah)",
  "Dans l’angoisse et la tristesse": "In anxiety and sorrow",
  "Face aux doutes dans la foi": "Facing doubts in faith",
  "Pour s’acquitter d’une dette": "To settle a debt",
  "Lorsqu’une chose paraît difficile": "When something seems difficult",
  "Après avoir commis une faute": "After committing a sin",
  "Pour repousser les insufflations": "To repel evil whispers",
  "À la rupture du jeûne": "When breaking the fast",
  "Avant de manger": "Before eating",
  "Après avoir mangé": "After eating",
  "Invocation de l’invité pour son hôte": "The guest’s supplication for the host",
  "Lors de l’éternuement": "When sneezing",
  "Pour les nouveaux mariés": "For the newlyweds",
  "Invocation du voyage": "Supplication for travel",
  "En montant dans un moyen de transport": "Boarding a means of transport",
  "En entrant au marché": "Entering the market",
  "Lorsqu’il pleut": "When it rains",
  "Lorsque le vent souffle": "When the wind blows",
  "À la vue de la nouvelle lune": "On sighting the new moon",
  "Lors de la colère": "When angry",
  "En visitant un malade": "Visiting the sick",
  "Invocation du malade éprouvé": "Supplication of the afflicted sick person",
  "Pour présenter ses condoléances": "Offering condolences",
  "Invocation pour le défunt": "Supplication for the deceased",
  "En visitant les tombes": "Visiting the graves",
  "Par crainte de l’association": "For fear of associating partners with Allah",
  "Invocation du jour de ‘Arafah": "Supplication on the day of ‘Arafah",
  "Dua à Al-Mash‘ar Al-Harām": "Supplication at Al-Mash‘ar Al-Harām",
  "Lorsqu’on se retourne pendant la nuit": "Turning over during the night",
  "Après un rêve ou un songe": "After a dream",
  "Invocation du qunūt dans le Witr": "Qunūt supplication in the Witr",
  "Après la prière du Witr": "After the Witr prayer",
  "Contre l’inquiétude et la tristesse": "Against worry and sorrow",
  "Dans une grande détresse": "In great distress",
  "Face à un ennemi ou une autorité": "Facing an enemy or a person in authority",
  "Face à l’injustice d’un dirigeant": "Facing a ruler’s injustice",
  "Face à l’hostilité d’un ennemi": "Facing an enemy’s hostility",
  "Lorsqu’on craint certaines personnes": "When fearing certain people",
  "Contre les doutes dans la foi": "Against doubts in faith",
  "Pour repousser Satan et ses suggestions": "To repel Satan and his whispers",
  "Pour féliciter la naissance d’un enfant": "Congratulating on the birth of a child",
  "Pour protéger ses enfants": "Protecting one’s children",
  "En visitant une personne malade": "Visiting a sick person",
  "Mérite de la visite au malade": "Merit of visiting the sick",
  "Auprès d’une personne mourante": "With a dying person",
  "Lorsqu’on est touché par une épreuve": "When struck by a calamity",
  "Au moment de fermer les yeux du défunt": "Closing the eyes of the deceased",
  "Prière funéraire pour un enfant": "Funeral prayer for a child",
  "Lors de la mise en terre du défunt": "Placing the deceased in the grave",
  "Après l’enterrement": "After the burial",
  "Lorsqu’on entend le tonnerre": "On hearing thunder",
  "Pour demander la pluie": "Asking for rain",
  "Lorsque la pluie tombe": "When rain falls",
  "Après la pluie": "After the rain",
  "Lorsque la pluie devient excessive": "When rain becomes excessive",
  "Après avoir rompu le jeûne chez quelqu’un": "After breaking the fast at someone’s home",
  "Pour le jeûneur présent à un repas": "For a fasting person invited to a meal",
  "Lorsque le jeûneur est insulté": "When a fasting person is insulted",
  "À la vue des premiers fruits": "On seeing the first fruits",
  "Au mariage ou lors d’une nouvelle acquisition": "At marriage or a new acquisition",
  "Avant l’intimité conjugale": "Before marital intimacy",
  "À la vue d’une personne éprouvée": "On seeing someone afflicted",
  "Pendant une assemblée": "During a gathering",
  "À la fin d’une assemblée": "At the end of a gathering",
  "Répondre à celui qui demande votre pardon": "Replying to someone who asks Allah to forgive you",
  "Remercier celui qui vous a rendu service": "Thanking someone who did you a favour",
  "Protection contre l’Antéchrist": "Protection from the Dajjāl",
  "Pour celui qui propose son aide financière": "For someone who offers financial help",
  "Lors du remboursement d’un prêt": "When repaying a loan",
  "Répondre à « Qu’Allah te bénisse »": "Replying to “May Allah bless you”",
  "Contre les mauvais présages": "Against bad omens",
  "En entrant dans une ville ou un village": "Entering a town or village",
  "Lorsque le moyen de transport trébuche": "When the mount stumbles",
  "Paroles du voyageur à celui qui reste": "The traveller’s words to those staying behind",
  "Paroles à celui qui part en voyage": "Words to someone setting out on a journey",
  "Dhikr pendant le trajet": "Dhikr while travelling",
  "Invocation du voyageur à l’aube": "The traveller’s supplication at dawn",
  "Lorsqu’on s’arrête dans un lieu": "When stopping at a place",
  "Au retour d’un voyage": "Returning from a journey",
  "Répandre la salutation de paix": "Spreading the greeting of peace",
  "En entendant les chiens aboyer la nuit": "On hearing dogs bark at night",
  "Pour une personne que l’on a offensée": "For someone you have wronged",
  "Lorsqu’on fait l’éloge d’une personne": "When praising someone",
  "Lorsqu’on reçoit un compliment": "When receiving praise",
  "Talbiyah du Hajj et de la ‘Umrah": "Talbiyah of Hajj and ‘Umrah",
  "Au niveau de la Pierre noire": "At the Black Stone",
  "Sur As-Safā et Al-Marwah": "On As-Safā and Al-Marwah",
  "Lors de la lapidation des stèles": "When stoning the jamarāt",
  "Lors d’un étonnement ou d’un événement heureux": "On amazement or a happy event",
  "Lorsqu’une heureuse nouvelle arrive": "On receiving good news",
  "Lorsqu’on ressent une douleur dans le corps": "When feeling pain in the body",
  "Par crainte de causer le mauvais œil": "For fear of causing the evil eye",
  "Lors d’une peur soudaine": "On sudden fright",
  "Au moment du sacrifice": "At the time of sacrifice",
  "Pour repousser les démons rebelles": "To repel rebellious devils",
  "Demander pardon et se repentir": "Seeking forgiveness and repenting",
  "Comment le Prophète comptait son dhikr": "How the Prophet counted his dhikr",
  "Bonnes actions et règles de savoir-vivre": "Good deeds and etiquette",
  "Examens, études et concentration": "Exams, study and focus",
  "Mariage, couple et famille": "Marriage, couple and family",
  "Maladie, douleur et guérison": "Illness, pain and healing",
};

const ENGLISH_SECTIONS: Readonly<Record<string, { label: string; subtitle: string }>> = {
  morning: { label: "Morning adhkār", subtitle: "Start the day under protection" },
  evening: { label: "Evening adhkār", subtitle: "End the day under protection" },
  sleep: { label: "Sleep & waking", subtitle: "Bedtime, waking and dreams" },
  prayer: { label: "Prayer & mosque", subtitle: "Ablution, adhān and salāh" },
  home: { label: "Home & daily life", subtitle: "Entering, leaving and dressing" },
  family: { label: "Couple & family", subtitle: "Marriage, children and home" },
  food: { label: "Meals & fasting", subtitle: "Eating, drinking and breaking the fast" },
  protection: { label: "Protection & calm", subtitle: "Fear, anxiety and temptation" },
  health: { label: "Health, trials & grief", subtitle: "Illness, pain and condolences" },
  travel: { label: "Travel & journeys", subtitle: "Departure, journey and return" },
  work: { label: "Study, work & money", subtitle: "Knowledge, decisions and debts" },
  nature: { label: "Rain & nature", subtitle: "Wind, thunder and the new moon" },
  etiquette: { label: "Relations & good words", subtitle: "Greetings, gratitude and gatherings" },
  hajj: { label: "Hajj & ‘Umrah", subtitle: "Rites and holy places" },
  daily: { label: "Other occasions", subtitle: "Further supplications" },
  "morning-evening": { label: "Morning & evening", subtitle: "Daily adhkār" },
};

const ENGLISH_GUIDES: Readonly<Record<string, { label: string; subtitle: string }>> = {
  study: { label: "Exams & study", subtitle: "Knowledge, focus, ease" },
  marriage: { label: "Marriage & family", subtitle: "Couple, blessing, home" },
  illness: { label: "Illness & healing", subtitle: "Pain, visits, protection" },
  anxiety: { label: "Stress & sadness", subtitle: "Anxiety, hardship, anger" },
  protection: { label: "Protection", subtitle: "Fear, evil eye, temptation" },
  food: { label: "Meals", subtitle: "Before and after eating" },
  travel: { label: "Travel", subtitle: "Departure, transport, return" },
  sleep: { label: "Sleep", subtitle: "Sleeping, waking and dreams" },
};

type Labelled = { id: string; label: string; subtitle: string };

export function duaSectionText(section: Labelled, language: LanguageCode) {
  if (language === "fr") return { label: section.label, subtitle: section.subtitle };
  return ENGLISH_SECTIONS[section.id] ?? { label: section.label, subtitle: section.subtitle };
}

export function duaGuideText(guide: Labelled, language: LanguageCode) {
  if (language === "fr") return { label: guide.label, subtitle: guide.subtitle };
  return ENGLISH_GUIDES[guide.id] ?? { label: guide.label, subtitle: guide.subtitle };
}

export function duaCategoryTitle(
  category: Pick<DuaCategory, "frenchTitle">,
  language: LanguageCode,
) {
  if (language === "fr") return category.frenchTitle;
  return ENGLISH_TITLES[category.frenchTitle] ?? category.frenchTitle;
}

/**
 * Sens de la dou'a dans la langue de l'app. L'anglais n'existe que lorsque la
 * source vérifiée le fournit ; sinon la traduction française reste affichée.
 */
export function duaMeaning(item: Pick<DuaItem, "french" | "english">, language: LanguageCode) {
  if (language === "en" && item.english) return item.english;
  return item.french;
}
