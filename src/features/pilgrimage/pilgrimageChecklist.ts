import type { LanguageCode } from "../../i18n";

type Localized = Record<LanguageCode, string>;

/** « Ma valise » : practical preparation, checked off and kept on the device. */
export type ChecklistSection = { id: string; title: Localized; icon: string; items: Array<{ id: string; label: Localized; hint?: Localized }> };

export const CHECKLIST: ChecklistSection[] = [
  {
    id: "papers",
    title: { fr: "Papiers", en: "Documents" },
    icon: "document-text-outline",
    items: [
      { id: "passport", label: { fr: "Passeport valide", en: "Valid passport" }, hint: { fr: "Vérifiez la durée de validité exigée.", en: "Check the required validity period." } },
      { id: "visa", label: { fr: "Visa ou permis de pèlerinage", en: "Visa or pilgrimage permit" } },
      { id: "insurance", label: { fr: "Assurance et contacts d’urgence", en: "Insurance and emergency contacts" } },
      { id: "vaccines", label: { fr: "Vaccinations exigées", en: "Required vaccinations" }, hint: { fr: "Vérifiez les exigences officielles à jour avant le départ.", en: "Check the current official requirements before leaving." } },
      { id: "copies", label: { fr: "Copies des papiers (papier et téléphone)", en: "Copies of your documents (paper and phone)" } },
      { id: "agency", label: { fr: "Numéros de l’agence et du guide", en: "Phone numbers of the agency and the guide" } },
    ],
  },
  {
    id: "ihram",
    title: { fr: "Ihrâm et vêtements", en: "Ihram and clothing" },
    icon: "shirt-outline",
    items: [
      { id: "ihram-cloth", label: { fr: "Deux pièces d’ihrâm (et un change)", en: "Two ihram cloths (and a spare set)" }, hint: { fr: "Pour les hommes.", en: "For men." } },
      { id: "women-clothes", label: { fr: "Tenues amples et pudiques", en: "Loose, modest clothing" }, hint: { fr: "Pour les femmes.", en: "For women." } },
      { id: "belt", label: { fr: "Ceinture ou pochette pour l’argent", en: "Money belt or pouch" } },
      { id: "sandals", label: { fr: "Sandales confortables", en: "Comfortable sandals" } },
      { id: "light", label: { fr: "Vêtements légers et un pull pour la climatisation", en: "Light clothes and a jumper for the air conditioning" } },
    ],
  },
  {
    id: "care",
    title: { fr: "Hygiène sans parfum", en: "Unscented hygiene" },
    icon: "water-outline",
    items: [
      { id: "soap", label: { fr: "Savon et shampooing non parfumés", en: "Unscented soap and shampoo" } },
      { id: "deo", label: { fr: "Déodorant non parfumé", en: "Unscented deodorant" } },
      { id: "sun", label: { fr: "Crème solaire non parfumée", en: "Unscented sunscreen" } },
      { id: "nails", label: { fr: "Coupe-ongles, à utiliser avant l’ihrâm", en: "Nail clippers, to use before ihram" } },
      { id: "scissors", label: { fr: "Petits ciseaux pour la coupe des cheveux", en: "Small scissors for cutting the hair" } },
    ],
  },
  {
    id: "health",
    title: { fr: "Santé", en: "Health" },
    icon: "medkit-outline",
    items: [
      { id: "meds", label: { fr: "Médicaments personnels et ordonnances", en: "Personal medicines and prescriptions" } },
      { id: "blisters", label: { fr: "Pansements anti-ampoules", en: "Blister plasters" } },
      { id: "salts", label: { fr: "Sels de réhydratation", en: "Rehydration salts" } },
      { id: "mask", label: { fr: "Masques", en: "Face masks" } },
    ],
  },
  {
    id: "onsite",
    title: { fr: "Sur place", en: "On site" },
    icon: "walk-outline",
    items: [
      { id: "bottle", label: { fr: "Gourde", en: "Water bottle" } },
      { id: "umbrella", label: { fr: "Ombrelle ou parapluie contre le soleil", en: "Umbrella for the sun" } },
      { id: "battery", label: { fr: "Batterie externe et câble", en: "Power bank and cable" } },
      { id: "bag", label: { fr: "Petit sac à dos et sac pour les chaussures", en: "Small backpack and a bag for your shoes" } },
      { id: "pebbles", label: { fr: "Petit sac pour les cailloux", en: "Small bag for the pebbles" }, hint: { fr: "Pour le Hajj.", en: "For the Hajj." } },
      { id: "group-card", label: { fr: "Carte ou bracelet du groupe", en: "Group card or wristband" } },
    ],
  },
  {
    id: "heart",
    title: { fr: "Le cœur", en: "The heart" },
    icon: "heart-outline",
    items: [
      { id: "debts", label: { fr: "Régler ses dettes et ses affaires", en: "Settle your debts and affairs" } },
      { id: "will", label: { fr: "Rédiger son testament (wasiyya)", en: "Write your will (wasiyyah)" } },
      { id: "duas", label: { fr: "Préparer sa liste de dou‘as personnelles", en: "Prepare your list of personal du‘as" } },
      { id: "learn", label: { fr: "Lire le guide de son pèlerinage", en: "Read the guide for your pilgrimage" } },
    ],
  },
];

export const CHECKLIST_TOTAL = CHECKLIST.reduce((sum, section) => sum + section.items.length, 0);
