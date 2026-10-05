import type { HajjType, Rite } from "./pilgrimageTypes";

/**
 * English text of the two books. The structure (order, sources, importance, tools) comes from the
 * French book; each entry here gives the same sentences, in the same order, for one page.
 * Quoted verses follow Saheeh International and quoted hadiths the English of the collections.
 */

export type DifferenceText = {
  question: string;
  establishedPoint?: string;
  views: { label: string; position: string; consequence?: string }[];
  practicalNote?: string;
};

export type StepText = {
  title: string;
  summary: string;
  todo: string[];
  notes?: string[];
  men?: string[];
  women?: string[];
  avoid?: string[];
  mistakes?: string[];
  differences?: DifferenceText[];
};

export const BOOK_TITLES_EN: Record<Rite, string> = { umrah: "Umrah", hajj: "Hajj" };

export const CHAPTERS_EN: Record<string, { title: string; marker: string }> = {
  "u-before": { title: "Before you leave", marker: "Prepare" },
  "u-ihram": { title: "Entering the rite", marker: "Ihram" },
  "u-tawaf": { title: "The Tawaf", marker: "Tawaf" },
  "u-sai": { title: "The Sa‘y", marker: "Sa‘y" },
  "u-end": { title: "Completing the Umrah", marker: "End" },
  medina: { title: "Visiting Medina", marker: "Medina" },
  "h-types": { title: "Choosing your Hajj", marker: "Type" },
  "h-before": { title: "Before 8 Dhul-Hijjah", marker: "Ihram" },
  "h-arrival": { title: "Arriving in Makkah", marker: "Makkah" },
  "h-mina": { title: "8 Dhul-Hijjah — Mina", marker: "8 · Mina" },
  "h-arafat": { title: "9 Dhul-Hijjah — ‘Arafah", marker: "9 · ‘Arafah" },
  "h-muzdalifa": { title: "The night of Muzdalifah", marker: "Muzdalifah" },
  "h-nahr": { title: "10 Dhul-Hijjah — Day of Sacrifice", marker: "10 · Nahr" },
  "h-tashriq": { title: "The days of Tashriq", marker: "11–13 · Mina" },
  "h-farewell": { title: "Leaving", marker: "Farewell" },
  "h-medina": { title: "Visiting Medina", marker: "Medina" },
};

export const HAJJ_TYPE_LABELS_EN: Record<HajjType, { title: string; short: string }> = {
  tamattu: { title: "Tamattu‘", short: "Umrah, a break, then Hajj" },
  qiran: { title: "Qiran", short: "Umrah and Hajj, one ihram" },
  ifrad: { title: "Ifrad", short: "Hajj only" },
};

export const HAJJ_TYPE_GUIDANCE_EN: Record<HajjType, string> = {
  tamattu: "Tamattu‘: you first perform the Umrah, leave ihram, then enter ihram again for the Hajj; the hady (sacrifice) applies under the established conditions.",
  qiran: "Qiran: you combine the Umrah and the Hajj in a single ihram; the hady applies under the established conditions.",
  ifrad: "Ifrad: you perform the Hajj alone; the sacrifice specific to Tamattu‘ or Qiran does not apply merely because of Ifrad.",
};

const hair: StepText = {
  title: "Halq or taqsir",
  summary: "Halq is shaving the head and taqsir is shortening the hair. The rules differ for men and women.",
  todo: [
    "Do not cut before the proper ritual moment.",
    "After the required acts, a man shaves or shortens; a woman shortens a little from the ends.",
  ],
  men: ["The Prophet ﷺ asked mercy three times for those who shave their heads, then for those who shorten."],
  women: ["Shaving does not apply to women: they only shorten."],
};

/** Keyed by step id; « hajj:<id> » overrides a shared page inside the Hajj book. */
export const STEPS_EN: Record<string, StepText | Partial<StepText>> = {
  preparation: {
    title: "Preparing to leave",
    summary: "Learn what to do, settle your affairs and study the rites.",
    todo: [
      "Prepare your practical needs and your spiritual state before the journey.",
      "Learn the rites, check the itinerary and prepare for your health and safety needs.",
      "Settle your debts and affairs, and ask forgiveness of those you may have hurt.",
    ],
    notes: [
      "Whoever performs the pilgrimage without obscene talk or sins returns as on the day his mother gave birth to him.",
      "When: before the miqat.",
    ],
  },
  miqat: {
    title: "The miqat — the boundary",
    summary: "The miqat is the boundary that someone intending the pilgrimage must not cross towards Makkah without ihram.",
    todo: [
      "Do not cross the miqat while deliberately putting off ihram.",
      "Enter ihram before crossing the miqat if you intend Umrah.",
    ],
    notes: [
      "The Prophet ﷺ set Dhul-Hulayfah for the people of Medina, al-Juhfah for those of Sham, Qarn al-Manazil for those of Najd and Yalamlam for those of Yemen; these boundaries also apply to anyone passing through them.",
      "Dhat ‘Irq was set for the people of Iraq.",
      "On a plane, get ready before the announced crossing; if the miqat has been passed, ask for advice quickly.",
    ],
  },
  ihram: {
    title: "Entering ihram",
    summary: "Ihram is the ritual state of the pilgrim, with an intention and particular rules.",
    todo: [
      "The intention is made in the heart; the talbiyah accompanies entering the rite.",
      "Ihram is the ritual state that begins with the intention; it is not only a garment.",
    ],
    men: ["A man wears the two prescribed pieces of cloth and keeps the prohibitions of ihram."],
    women: ["A woman wears her usual modest clothing; the details about the face and gloves belong to fiqh."],
  },
  "hajj:ihram": {
    notes: ["Tamattu‘: the intention is for Umrah. Qiran: Umrah and Hajj together. Ifrad: Hajj only."],
  },
  talbiyah: {
    title: "The talbiyah",
    summary: "Repeat the talbiyah and avoid arguments and improper speech.",
    todo: ["Repeat it after entering ihram until the rite that ends this recitation."],
  },
  prohibitions: {
    title: "What ihram forbids",
    summary: "The prohibitions vary with people and situations; do not turn practical advice into a universal rule.",
    todo: ["Avoid perfume, hunting and forbidden acts; questions of compensation need a qualified opinion."],
    avoid: [
      "Avoid marital relations, deliberate perfume, hunting and the other prohibitions; the consequence depends on the case.",
      "Hunting is forbidden in the state of ihram.",
      "The muhrim does not conclude a marriage.",
    ],
    men: ["A man wears no shirt, turban, trousers, hooded cloak, high shoes, or garment touched by saffron or wars."],
    women: ["A woman wears neither niqab nor gloves."],
    mistakes: ["Do not automatically give the same consequence to forgetfulness, coercion and a deliberate act."],
  },
  haram: {
    title: "Arriving at the Sacred Mosque",
    summary: "Enter with reverence and head for the Tawaf.",
    todo: [
      "No specific obligatory supplication is established for each movement.",
      "Enter with reverence and join the Tawaf without blocking the way.",
    ],
  },
  "tawaf-prep": {
    title: "Preparing for Tawaf",
    summary: "Tawaf means circling the Kaaba. Purity is an important legal question with detailed opinions.",
    todo: [
      "Follow the qualified opinion that fits your situation; avoid inconveniencing others.",
      "Find the starting point, keep the Kaaba on your left and keep the flow moving; purity is a separate fiqh question.",
    ],
    women: ["A menstruating woman may enter ihram and perform the rites other than Tawaf; the Tawaf is normally postponed until she is pure. If she must leave before, ask for a qualified opinion quickly."],
    differences: [{
      question: "Is wudu a condition for the Tawaf to be valid?",
      establishedPoint: "Purity is the recommended practice and the precaution to follow.",
      views: [
        { label: "Majority view", position: "Purity is a condition for the Tawaf to be valid.", consequence: "Renew your wudu and ask what to do if it is lost." },
        { label: "Different legal view", position: "Hanafi jurists and an opinion reported from Ahmad do not consider it a condition of validity.", consequence: "The consequence depends on the case and the school followed; do not start over on your own." },
      ],
      practicalNote: "A situation in progress needs the quick advice of a qualified person.",
    }],
  },
  tawaf: {
    title: "Tawaf — 7 circuits",
    summary: "Count seven complete circuits, keeping the Kaaba on your left.",
    todo: [
      "Complete seven circuits around the Kaaba, without imposing a supplication for each circuit.",
      "Each circuit begins and ends in line with the Black Stone.",
    ],
    notes: ["There is no authentic obligatory supplication for each circuit."],
    mistakes: ["Do not count back-and-forth walking as circuits, and do not push."],
  },
  "black-stone": {
    title: "Black Stone and Yemeni Corner",
    summary: "Greet the Black Stone if you can without pushing. Between the two corners, supplicate freely.",
    todo: [
      "Greet the Black Stone without shoving; if you cannot reach it, gesture towards it as you pass.",
      "Touch the Yemeni Corner if you safely can; do not greet it from a distance with a gesture.",
    ],
    avoid: ["Do not put yourself in danger and do not hurt anyone."],
  },
  ramal: {
    title: "Ramal and idtiba‘",
    summary: "These practices concern some men in some circumstances; they do not concern women.",
    todo: ["Never force your way through the crowd."],
    men: [
      "Ramal and idtiba‘ are practices for men whose conditions belong to fiqh; safety comes first.",
      "The Prophet ﷺ walked briskly for three circuits and walked normally for four.",
    ],
    women: ["A woman walks normally and puts modesty and safety first."],
  },
  prayer: {
    title: "Two rak‘ahs after the Tawaf",
    summary: "Pray behind Maqam Ibrahim if you can, without blocking the flow.",
    todo: [
      "Safety and ease come first in the practical arrangements.",
      "After the seven circuits, pray two rak‘ahs in a permitted place without blocking the flow.",
    ],
    notes: ["The Prophet ﷺ recited Surat al-Kafirun and Surat al-Ikhlas in them."],
  },
  zamzam: {
    title: "Zamzam",
    summary: "Drink if you can and supplicate Allah freely.",
    todo: [
      "No single obligatory formula is established here.",
      "Drink Zamzam if you can without inconveniencing others; supplicate Allah freely.",
    ],
  },
  sai: {
    title: "Safa and Marwah — the Sa‘y",
    summary: "The Sa‘y is seven trips: Safa→Marwah = 1, then Marwah→Safa = 2, up to Safa→Marwah = 7.",
    todo: [
      "Make seven trips: Safa to Marwah counts as one, the way back as two, until you finish at Marwah.",
      "Climbing Safa, the Prophet ﷺ recited the verse about Safa and Marwah, then faced the Kaaba to declare the oneness and greatness of Allah and to supplicate; he did the same on Marwah.",
    ],
    men: ["A man hurries between the markers (green lights) if it is safe."],
    women: ["A woman walks normally."],
  },
  hair,
  exit: {
    title: "Leaving ihram",
    summary: "After the required acts and cutting the hair, the restrictions end according to the rite performed.",
    todo: [
      "If you are unsure about the order or a compensation, consult a qualified person.",
      "After the required acts and the cut, you leave ihram according to the rite.",
    ],
  },

  // Medina
  "arrive-medina": {
    title: "Arriving in Medina",
    summary: "Visiting Medina is neither a pillar nor an obligation of the Umrah or the Hajj: it is a recommended visit to the Mosque of the Prophet ﷺ.",
    todo: [
      "Travel with the intention of praying in the Mosque of the Prophet ﷺ: one travels specially only to three mosques.",
      "Enter the mosque with the right foot, saying the supplication for entering.",
    ],
    notes: [
      "A prayer in this mosque is better than a thousand prayers elsewhere, except in the Sacred Mosque.",
      "No ihram is needed for Medina: the visit is not a rite of the pilgrimage.",
    ],
  },
  rawda: {
    title: "Ar-Rawdah",
    summary: "\"Between my house and my pulpit there is a garden of the gardens of Paradise.\"",
    todo: [
      "Pray there if you get a place, then leave it to others.",
      "Access is usually by booking: ask your group.",
    ],
    avoid: ["Do not push anyone to get in."],
  },
  salam: {
    title: "Greeting the Prophet ﷺ",
    summary: "At the grave of the Prophet ﷺ, greet him calmly and respectfully, then his two companions Abu Bakr and ‘Umar.",
    todo: ["Say: \"As-salamu ‘alayka ya Rasula llah\", then greet Abu Bakr and ‘Umar."],
    notes: ["\"Indeed, Allāh confers blessing upon the Prophet, and His angels [ask Him to do so]. O you who have believed, ask [Allāh to confer] blessing upon him and ask [Allāh to grant him] peace.\" This can be done from anywhere."],
    avoid: [
      "Do not raise your voice: \"do not raise your voices above the voice of the Prophet.\"",
      "Supplications are addressed to Allah alone: \"so do not invoke with Allāh anyone.\"",
    ],
  },
  quba: {
    title: "The Quba Mosque",
    summary: "The first mosque built by the Prophet ﷺ when he arrived in Medina.",
    todo: ["The Prophet ﷺ went there every Saturday, walking or riding, and prayed two rak‘ahs."],
    notes: ["Whoever purifies himself at home and then comes to pray at Quba receives a reward like that of an Umrah."],
  },
  baqi: {
    title: "Al-Baqi‘",
    summary: "The cemetery of Medina, where many companions are buried.",
    todo: ["Greet the dead and supplicate Allah for them."],
    avoid: ["We supplicate Allah for the dead; we do not address requests to them."],
  },
  uhud: {
    title: "Mount Uhud",
    summary: "The site of the battle of Uhud, where the martyrs are buried, among them Hamzah.",
    todo: ["Greet the martyrs and supplicate Allah for them, as for anyone who has died."],
    notes: ["On seeing Uhud, the Prophet ﷺ said: \"This mountain loves us and we love it.\""],
  },

  // End of the Umrah
  complete: {
    title: "Umrah completed",
    summary: "The Umrah is complete; keep its lessons and your gratitude.",
    todo: [
      "The counter is a memory aid, not a religious validation.",
      "Check the acts you have performed; tracking on the phone is a memory aid, not a ruling on validity.",
    ],
    notes: [
      "One Umrah to the next expiates what is between them.",
      "An Umrah performed in Ramadan is equal to a Hajj.",
    ],
  },

  // Hajj
  types: {
    title: "The three types of Hajj",
    summary: "Tamattu‘, Qiran and Ifrad are three distinct forms.",
    todo: [
      "Tamattu‘: Umrah, then leaving ihram before the Hajj; Qiran: Umrah and Hajj in a single ihram; Ifrad: Hajj only.",
      "The sacrifice applies in particular to Tamattu‘ and Qiran under conditions; ask for a qualified opinion if your situation is special.",
    ],
    notes: ["An accepted Hajj (mabrur) has no reward but Paradise."],
  },
  "tamattu-umrah": {
    title: "The Umrah of Tamattu‘",
    summary: "The pilgrim doing Tamattu‘ performs a full Umrah: Tawaf, Sa‘y, then cutting the hair.",
    todo: [
      "Perform the Tawaf of Umrah (seven circuits), the two rak‘ahs, then the Sa‘y (seven trips).",
      "Shorten or shave your hair, then leave ihram until 8 Dhul-Hijjah.",
    ],
    notes: ["The Umrah book details each of these steps."],
  },
  qudum: {
    title: "Arrival Tawaf (al-qudum)",
    summary: "In Qiran and Ifrad, the pilgrim stays in ihram and performs the Arrival Tawaf on arriving.",
    todo: [
      "Complete seven circuits, then the two rak‘ahs, as for any Tawaf.",
      "Stay in ihram: there is no cutting of the hair at this point.",
    ],
    notes: ["The Sa‘y of Hajj may be done after this Tawaf; it is then not repeated after Tawaf al-Ifadah. Check your case with your group leaders."],
  },
  "mina-8": {
    title: "The Day of Tarwiyah in Mina",
    summary: "The pilgrim goes to Mina according to the programme and the rules of the rite.",
    todo: [
      "Organise the day and the night according to the official instructions and your group leaders.",
      "On 8 Dhul-Hijjah, go to Mina as officially organised and get ready for ‘Arafat.",
      "The Prophet ﷺ prayed Dhuhr, ‘Asr, Maghrib, ‘Isha and Fajr there.",
    ],
    notes: ["Tamattu‘: enter ihram again for the Hajj from where you are staying, before leaving for Mina."],
  },
  "arafat-9": {
    title: "The standing at ‘Arafat",
    summary: "The wuquf is the standing at ‘Arafat, the central moment of the Hajj.",
    todo: [
      "Be present at ‘Arafat during the time of the wuquf, the central standing of the Hajj, and supplicate Allah.",
      "The Prophet ﷺ prayed Dhuhr and ‘Asr together there, then devoted himself to supplication until sunset.",
    ],
    notes: [
      "\"Hajj is Arafah.\"",
      "There is no day when Allah sets free more servants from the Fire than the Day of ‘Arafah.",
    ],
    avoid: ["Make sure you are inside the boundaries of ‘Arafat, which are marked on site."],
  },
  muzdalifah: {
    title: "The night at Muzdalifah",
    summary: "The pilgrim goes to Muzdalifah after ‘Arafat.",
    todo: [
      "After ‘Arafat, go to Muzdalifah and follow the times and safety instructions of your group leaders.",
      "The Prophet ﷺ prayed Maghrib and ‘Isha together there, spent the night, then stood after Fajr supplicating until it was fully light.",
    ],
    notes: ["The normal case is to stay at Muzdalifah after ‘Arafat. Permission to leave during the night is reported for some vulnerable people to avoid the crowd; it is not a general rule."],
  },
  "nahr-10": {
    title: "The rites of the day",
    summary: "A day of major rites: Jamrat al-‘Aqabah, the sacrifice when it applies, the hair and Tawaf al-Ifadah.",
    todo: [
      "On the 10th, perform the rites that are due from you according to your type of Hajj and your group leaders.",
      "Respect the order and conditions for your type of Hajj; the legal details may differ.",
    ],
    notes: ["Asked that day about a rite done before another, the Prophet ﷺ replied: \"Do it, and no harm is there (for you).\""],
  },
  aqaba: {
    title: "Jamrat al-‘Aqabah",
    summary: "On this day only the large pillar is stoned: seven pebbles, one at a time.",
    todo: [
      "Throw seven pebbles, one after another, saying \"Allahu akbar\" with each pebble.",
      "The talbiyah stops with this stoning.",
    ],
    avoid: ["Do not put yourself in danger in the crowd; keep to the times given to your group."],
  },
  sacrifice: {
    title: "The sacrifice (hady)",
    summary: "The sacrifice is due from the pilgrim doing Tamattu‘ or Qiran.",
    todo: [
      "The sacrifice applies in particular to Tamattu‘ and Qiran under conditions; ask for a qualified opinion if your situation is special.",
      "Whoever cannot afford it fasts three days during the Hajj and seven on returning.",
    ],
    notes: ["It is usually arranged through an official voucher: keep your receipt and the announced time."],
  },
  "nahr-hair": { ...hair, summary: "After the stoning (and the sacrifice if it is due from you), a man shaves or shortens; a woman shortens." },
  ifada: {
    title: "Tawaf al-Ifadah",
    summary: "Tawaf al-Ifadah is a pillar of the Hajj; it may be performed on this day or the following days.",
    todo: [
      "Complete seven circuits, then the two rak‘ahs.",
      "Tamattu‘: then perform the Sa‘y of Hajj. Qiran and Ifrad: only if you did not do it after the Arrival Tawaf.",
    ],
    notes: ["After the stoning and the cut, most prohibitions are lifted; marital relations remain forbidden until Tawaf al-Ifadah."],
  },
  "tashriq-11": {
    title: "11 Dhul-Hijjah",
    summary: "The three Jamarat are stoned in order.",
    todo: [
      "Stone the three Jamarat, seven pebbles each: the small, then the middle, then the large, at the official times.",
      "After the small and the middle one, stop facing the qiblah to supplicate at length; after the large one, leave without stopping.",
    ],
    notes: [
      "On these days the Prophet ﷺ stoned after the sun had passed its zenith.",
      "Spending the nights in Mina is the rule for the days concerned; exemptions and their consequences depend on necessity and legal opinions.",
    ],
  },
  "tashriq-12": {
    title: "12 Dhul-Hijjah",
    summary: "The pilgrim may leave after the rites of the day under the established conditions.",
    todo: [
      "Keep to the times and do not leave hastily before doing what is due from you.",
      "On the 12th, stone the Jamarat; leaving early is subject to conditions.",
    ],
    notes: ["\"Then whoever hastens [his departure] in two days - there is no sin upon him; and whoever delays [until the third] - there is no sin upon him - for him who fears Allāh.\""],
  },
  "tashriq-13": {
    title: "13 Dhul-Hijjah — for those who stay",
    summary: "Whoever stays performs the rites of the thirteenth day.",
    todo: ["Stone the three Jamarat if you stay until the thirteenth."],
  },
  farewell: {
    title: "Tawaf al-Wada‘ — the Farewell Tawaf",
    summary: "It closes the stay in Makkah, with exemptions and legal details to check according to the situation.",
    todo: ["Perform the Farewell Tawaf when you leave Makkah, unless an established exemption applies to you."],
    women: ["It was made lighter for a woman who has her menses."],
  },
  "complete-hajj": {
    title: "Hajj completed",
    summary: "The Hajj is complete.",
    todo: [
      "Tracking on the phone is a memory aid and does not replace the advice of a qualified guide.",
      "Check your programme with your group leaders before leaving.",
    ],
    notes: ["An accepted Hajj (mabrur) has no reward but Paradise."],
  },
};
