/** « Ma valise » : practical preparation, checked off and kept on the device. */
export type ChecklistSection = { id: string; title: string; icon: string; items: Array<{ id: string; label: string; hint?: string }> };

export const CHECKLIST: ChecklistSection[] = [
  {
    id: "papers",
    title: "Papiers",
    icon: "document-text-outline",
    items: [
      { id: "passport", label: "Passeport valide", hint: "Vérifiez la durée de validité exigée." },
      { id: "visa", label: "Visa ou permis de pèlerinage" },
      { id: "insurance", label: "Assurance et contacts d’urgence" },
      { id: "vaccines", label: "Vaccinations exigées", hint: "Vérifiez les exigences officielles à jour avant le départ." },
      { id: "copies", label: "Copies des papiers (papier et téléphone)" },
      { id: "agency", label: "Numéros de l’agence et du guide" },
    ],
  },
  {
    id: "ihram",
    title: "Ihrâm et vêtements",
    icon: "shirt-outline",
    items: [
      { id: "ihram-cloth", label: "Deux pièces d’ihrâm (et un change)", hint: "Pour les hommes." },
      { id: "women-clothes", label: "Tenues amples et pudiques", hint: "Pour les femmes." },
      { id: "belt", label: "Ceinture ou pochette pour l’argent" },
      { id: "sandals", label: "Sandales confortables" },
      { id: "light", label: "Vêtements légers et un pull pour la climatisation" },
    ],
  },
  {
    id: "care",
    title: "Hygiène sans parfum",
    icon: "water-outline",
    items: [
      { id: "soap", label: "Savon et shampooing non parfumés" },
      { id: "deo", label: "Déodorant non parfumé" },
      { id: "sun", label: "Crème solaire non parfumée" },
      { id: "nails", label: "Coupe-ongles, à utiliser avant l’ihrâm" },
      { id: "scissors", label: "Petits ciseaux pour la coupe des cheveux" },
    ],
  },
  {
    id: "health",
    title: "Santé",
    icon: "medkit-outline",
    items: [
      { id: "meds", label: "Médicaments personnels et ordonnances" },
      { id: "blisters", label: "Pansements anti-ampoules" },
      { id: "salts", label: "Sels de réhydratation" },
      { id: "mask", label: "Masques" },
    ],
  },
  {
    id: "onsite",
    title: "Sur place",
    icon: "walk-outline",
    items: [
      { id: "bottle", label: "Gourde" },
      { id: "umbrella", label: "Ombrelle ou parapluie contre le soleil" },
      { id: "battery", label: "Batterie externe et câble" },
      { id: "bag", label: "Petit sac à dos et sac pour les chaussures" },
      { id: "pebbles", label: "Petit sac pour les cailloux", hint: "Pour le Hajj." },
      { id: "group-card", label: "Carte ou bracelet du groupe" },
    ],
  },
  {
    id: "heart",
    title: "Le cœur",
    icon: "heart-outline",
    items: [
      { id: "debts", label: "Régler ses dettes et ses affaires" },
      { id: "forgive", label: "Demander pardon à ses proches" },
      { id: "will", label: "Rédiger son testament (wasiyya)" },
      { id: "duas", label: "Préparer sa liste de dou‘as personnelles" },
      { id: "learn", label: "Lire le guide de son pèlerinage" },
    ],
  },
];

export const CHECKLIST_TOTAL = CHECKLIST.reduce((sum, section) => sum + section.items.length, 0);
