/**
 * English text of the invocations, keyed by id. Arabic, sources and status come from the French list.
 * Quranic invocations follow Saheeh International.
 */
export const INVOCATIONS_EN: Record<string, { moment: string; title: string; translation: string; context: string; transliteration?: string }> = {
  travel: {
    moment: "The journey",
    title: "Setting off",
    translation: "Allah is the Greatest (×3). Glory be to Him who has subjected this to us, and we could not have done it ourselves; and to our Lord we will surely return. O Allah, we ask You on this journey of ours for righteousness and piety, and for deeds that please You.",
    context: "When getting onto your means of transport, at the start of the journey.",
  },
  talbiyah: {
    moment: "Ihram",
    title: "The talbiyah",
    translation: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Praise, grace and sovereignty belong to You. You have no partner.",
    context: "From entering ihram, repeated until the rite that ends this recitation.",
  },
  takbir: {
    moment: "Tawaf",
    title: "Passing the Black Stone",
    translation: "Allah is the Greatest.",
    context: "The Prophet ﷺ pointed towards the corner of the Black Stone and said \"Allahu akbar\" each time he passed it. Also with each pebble thrown at the Jamarat.",
  },
  rabbana: {
    moment: "Tawaf",
    title: "Good in this world and the next",
    translation: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
    context: "A general Quranic supplication during the rites, without tying it to a particular circuit.",
  },
  free: {
    moment: "Tawaf",
    title: "Your own supplication",
    transliteration: "Your own supplication",
    translation: "The pilgrim calls on Allah in their own words, in their own language.",
    context: "During the Tawaf and the Sa‘y, where no specific formula is established.",
  },
  safa: {
    moment: "Sa‘y",
    title: "Approaching Safa",
    translation: "Indeed, aṣ-Ṣafā and al-Marwah are among the symbols of Allāh. — I begin with what Allah began with.",
    context: "Recited by the Prophet ﷺ as he approached Safa at the start of the Sa‘y; it is not a formula required at each passage.",
  },
  "safa-dhikr": {
    moment: "Sa‘y",
    title: "On Safa and on Marwah",
    translation: "There is no god but Allah alone, without partner; to Him belong sovereignty and praise, and He has power over all things. There is no god but Allah alone; He fulfilled His promise, supported His servant and defeated the confederates alone.",
    context: "Facing the Kaaba, after declaring the greatness of Allah: the Prophet ﷺ said it three times, supplicating in between, on Safa and then on Marwah.",
  },
  forgiveness: {
    moment: "Sa‘y",
    title: "Forgiveness and mercy",
    translation: "My Lord, forgive and have mercy.",
    context: "A general Quranic supplication while moving and during the rites, without presenting it as a formula specific to this rite.",
  },
  arafa: {
    moment: "‘Arafah",
    title: "The best supplication of ‘Arafah",
    translation: "There is no god but Allah alone, without partner; to Him belong sovereignty and praise, and He has power over all things.",
    context: "The Prophet ﷺ said that the best supplication is that of the Day of ‘Arafah, and that the best words he and the prophets before him said are these.",
  },
  mashar: {
    moment: "Muzdalifah",
    title: "At al-Mash‘ar al-Haram",
    translation: "But when you depart from ʿArafāt, remember Allāh at al-Mashʿar al-Ḥarām.",
    context: "After Fajr at Muzdalifah, the Prophet ﷺ stood facing the qiblah to supplicate and to declare His greatness and oneness until it was fully light.",
  },
  "mosque-entry": {
    moment: "Medina",
    title: "Entering the mosque",
    translation: "O Allah, open for me the doors of Your mercy.",
    context: "On entering any mosque, including the Mosque of the Prophet ﷺ and the Sacred Mosque.",
  },
  baqi: {
    moment: "Medina",
    title: "Visiting the graves",
    translation: "Peace be upon you, people of these dwellings, believers and Muslims. We will join you, if Allah wills. I ask Allah for well-being for us and for you.",
    context: "Taught by the Prophet ﷺ to his companions for visiting cemeteries (al-Baqi‘, the martyrs of Uhud…).",
  },
  acceptance: {
    moment: "At the end",
    title: "Asking for acceptance",
    translation: "Our Lord, accept [this] from us. Indeed, You are the Hearing, the Knowing.",
    context: "A general Quranic supplication after a good deed, without presenting it as a formula specific to the rite.",
  },
};
