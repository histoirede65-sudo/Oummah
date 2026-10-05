import type { LanguageCode } from "../../i18n";

type Localized = { fr: string; en: string };

export type AllahNameEvidence =
  | { kind: "quran"; ref: string; surah: string; arabic: string; text: Localized }
  | { kind: "sunnah"; text: Localized; source: Localized };

type AllahNameEntry = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: Localized;
  explanation: Localized;
  reflection: Localized;
  practice: Localized;
  evidence: AllahNameEvidence;
};

export type AllahName = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  explanation: string;
  reflection: string;
  practice: string;
  evidence:
    | { kind: "quran"; ref: string; surah: string; arabic: string; text: string }
    | { kind: "sunnah"; text: string; source: string };
};

export const ALLAH_NAMES_SOURCE = {
  label: "Islamic Relief UK",
  reviewer: "Sheikh Dr. Saalim Al-Azhari",
  url: "https://www.islamic-relief.org.uk/resources/knowledge-base/99-names-of-allah/",
};

// Arabic, transliteration and base meanings follow the Islamic Relief UK list. Quran fragments are taken word for word
// from the Uthmani text. Explanations are teaching summaries; keep FR and EN in step when editing.
const ENTRIES: AllahNameEntry[] = [
  {
    "id": 1,
    "arabic": "الرَّحْمَٰنُ",
    "transliteration": "Ar-Raḥmān",
    "translation": {
      "fr": "Le Tout Miséricordieux",
      "en": "The Most Merciful"
    },
    "explanation": {
      "fr": "Ar-Raḥmān désigne Celui dont la miséricorde est immense et embrasse toute la création, croyants comme non-croyants, dans ce monde. C’est un nom propre à Allah : on ne l’attribue à personne d’autre.",
      "en": "Ar-Raḥmān is the One whose mercy is vast and embraces all of creation, believers and disbelievers alike, in this world. It is a name that belongs to Allah alone: no one else is called by it."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit qu’Allah a divisé la miséricorde en cent parts : Il en a fait descendre une seule sur terre, et c’est par elle que les créatures s’aiment les unes les autres (rapporté par al-Bukhârî et Muslim).",
      "en": "The Prophet ﷺ said that Allah divided mercy into a hundred parts and sent down only one of them to the earth; through it, creatures show compassion to one another (reported by al-Bukhârî and Muslim)."
    },
    "practice": {
      "fr": "Ne jamais désespérer de la miséricorde d’Allah, et faire preuve de compassion envers les gens et les animaux.",
      "en": "Never despair of Allah’s mercy, and show compassion to people and to animals."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:22",
      "surah": "Al-Ḥashr",
      "arabic": "هُوَ الرَّحْمَٰنُ الرَّحِيمُ",
      "text": {
        "fr": "C’est Lui le Tout Miséricordieux, le Très Miséricordieux.",
        "en": "He is the Most Merciful, the Especially Merciful."
      }
    }
  },
  {
    "id": 2,
    "arabic": "الرَّحِيمُ",
    "transliteration": "Ar-Raḥīm",
    "translation": {
      "fr": "Le Très Miséricordieux",
      "en": "The Especially Merciful"
    },
    "explanation": {
      "fr": "Ar-Raḥīm désigne Celui qui fait parvenir concrètement Sa miséricorde à Ses serviteurs, et tout particulièrement aux croyants, dans ce monde et dans l’au-delà.",
      "en": "Ar-Raḥīm is the One who actually extends His mercy to His servants, and especially to the believers, in this world and in the Hereafter."
    },
    "reflection": {
      "fr": "Voyant une mère serrer son enfant contre elle, le Prophète ﷺ a dit : « Allah est plus miséricordieux envers Ses serviteurs que cette femme envers son enfant. » (al-Bukhârî et Muslim)",
      "en": "Seeing a mother hold her child close, the Prophet ﷺ said: “Allah is more merciful to His servants than this woman is to her child.” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Demander la miséricorde d’Allah dans ses invocations et revenir vers Lui après chaque faute, avec confiance.",
      "en": "Ask for Allah’s mercy in your supplications and turn back to Him after every mistake, with confidence."
    },
    "evidence": {
      "kind": "quran",
      "ref": "33:43",
      "surah": "Al-Aḥzāb",
      "arabic": "وَكَانَ بِالْمُؤْمِنِينَ رَحِيمًا",
      "text": {
        "fr": "Il est Très Miséricordieux envers les croyants.",
        "en": "And He is ever Merciful to the believers."
      }
    }
  },
  {
    "id": 3,
    "arabic": "الْمَلِكُ",
    "transliteration": "Al-Malik",
    "translation": {
      "fr": "Le Souverain",
      "en": "The King"
    },
    "explanation": {
      "fr": "Al-Malik est le Roi véritable : tout Lui appartient, Il dispose de Sa création comme Il veut, et Sa royauté n’a ni début, ni fin, ni besoin de personne.",
      "en": "Al-Malik is the true King: everything belongs to Him, He governs His creation as He wills, and His kingship has no beginning, no end and no need of anyone."
    },
    "reflection": {
      "fr": "Le Jour de la Résurrection, Allah dira : « C’est Moi le Roi. Où sont les rois de la terre ? » (al-Bukhârî et Muslim). Toute autorité humaine est prêtée et passagère.",
      "en": "On the Day of Resurrection, Allah will say: “I am the King. Where are the kings of the earth?” (al-Bukhârî and Muslim). All human authority is lent and temporary."
    },
    "practice": {
      "fr": "Ne pas s’attacher au pouvoir ni craindre les puissants plus qu’Allah, et user avec justice de toute responsabilité confiée.",
      "en": "Do not cling to power or fear the powerful more than Allah, and use any responsibility you are given with justice."
    },
    "evidence": {
      "kind": "quran",
      "ref": "20:114",
      "surah": "Ṭā-Hā",
      "arabic": "فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ",
      "text": {
        "fr": "Que soit exalté Allah, le Roi, la Vérité !",
        "en": "So high above all is Allah, the King, the Truth."
      }
    }
  },
  {
    "id": 4,
    "arabic": "الْقُدُّوسُ",
    "transliteration": "Al-Quddūs",
    "translation": {
      "fr": "Le Très Saint",
      "en": "The Most Holy"
    },
    "explanation": {
      "fr": "Al-Quddūs est Celui qui est pur de tout défaut, de toute imperfection et de toute ressemblance avec les créatures. Rien de ce qu’on imagine de faible ne s’applique à Lui.",
      "en": "Al-Quddūs is the One who is free of every flaw, every imperfection and every likeness to creation. Nothing weak that one might imagine applies to Him."
    },
    "reflection": {
      "fr": "Après le witr, le Prophète ﷺ disait trois fois « Subḥāna l-Maliki l-Quddūs » (Abû Dâwûd et an-Nasâ’î, authentifié par al-Albânî).",
      "en": "After the witr prayer, the Prophet ﷺ would say three times “Subḥāna l-Maliki l-Quddūs” (Abû Dâwûd and an-Nasâ’î, graded authentic by al-Albânî)."
    },
    "practice": {
      "fr": "Purifier son cœur et ses paroles, et dire cette glorification après le witr comme le faisait le Prophète ﷺ.",
      "en": "Purify your heart and your words, and say this glorification after the witr as the Prophet ﷺ did."
    },
    "evidence": {
      "kind": "quran",
      "ref": "62:1",
      "surah": "Al-Jumu‘a",
      "arabic": "الْمَلِكِ الْقُدُّوسِ الْعَزِيزِ الْحَكِيمِ",
      "text": {
        "fr": "… le Roi, le Très Saint, le Tout-Puissant, le Sage.",
        "en": "… the King, the Most Holy, the Almighty, the Wise."
      }
    }
  },
  {
    "id": 5,
    "arabic": "السَّلَامُ",
    "transliteration": "As-Salām",
    "translation": {
      "fr": "La Paix, Le Parfait",
      "en": "The Source of Peace"
    },
    "explanation": {
      "fr": "As-Salām est Celui qui est exempt de tout défaut et de tout manque, et de qui vient toute paix et toute sécurité pour Ses créatures.",
      "en": "As-Salām is the One who is free of every defect and every lack, and from whom all peace and safety come to His creation."
    },
    "reflection": {
      "fr": "Après chaque prière, le Prophète ﷺ disait : « Allāhumma anta s-Salām wa minka s-salām, tabārakta yā Dhā l-jalāli wa-l-ikrām. » (Muslim)",
      "en": "After each prayer, the Prophet ﷺ would say: “Allāhumma anta s-Salām wa minka s-salām, tabārakta yā Dhā l-jalāli wa-l-ikrām.” (Muslim)"
    },
    "practice": {
      "fr": "Répandre le salām entre les gens et dire cette invocation après chaque prière.",
      "en": "Spread the greeting of salām among people and say this supplication after each prayer."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "الْمَلِكُ الْقُدُّوسُ السَّلَامُ",
      "text": {
        "fr": "… le Roi, le Très Saint, la Paix…",
        "en": "… the King, the Most Holy, the Source of Peace…"
      }
    }
  },
  {
    "id": 6,
    "arabic": "الْمُؤْمِنُ",
    "transliteration": "Al-Mu’min",
    "translation": {
      "fr": "Celui qui accorde la sécurité",
      "en": "The Giver of Security"
    },
    "explanation": {
      "fr": "Al-Mu’min est Celui qui accorde la sécurité à Ses serviteurs, qui confirme la véracité de Ses messagers par des preuves, et qui ne trahit jamais Sa promesse.",
      "en": "Al-Mu’min is the One who grants security to His servants, confirms the truthfulness of His messengers with proofs, and never breaks His promise."
    },
    "reflection": {
      "fr": "La vraie sécurité ne vient ni de l’argent ni des gens, mais d’Allah : « Ceux qui ont cru et n’ont pas mêlé leur foi d’injustice, à eux la sécurité. » (6:82)",
      "en": "True security comes neither from money nor from people, but from Allah: “Those who believe and do not mix their faith with wrongdoing, theirs is security.” (6:82)"
    },
    "practice": {
      "fr": "Être quelqu’un auprès de qui les autres se sentent en sécurité, dans ses paroles comme dans ses actes.",
      "en": "Be someone with whom others feel safe, in your words as in your actions."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ",
      "text": {
        "fr": "… la Paix, Celui qui accorde la sécurité, le Gardien…",
        "en": "… the Source of Peace, the Giver of Security, the Overseer…"
      }
    }
  },
  {
    "id": 7,
    "arabic": "الْمُهَيْمِنُ",
    "transliteration": "Al-Muhaymin",
    "translation": {
      "fr": "Le Gardien, Celui qui veille sur tout",
      "en": "The Overseer"
    },
    "explanation": {
      "fr": "Al-Muhaymin est Celui qui veille sur toute chose, en est témoin et la maintient. Rien n’échappe à Sa surveillance ni à Sa garde.",
      "en": "Al-Muhaymin is the One who watches over everything, witnesses it and sustains it. Nothing escapes His oversight or His care."
    },
    "reflection": {
      "fr": "Savoir qu’Allah veille sur chaque situation apaise le cœur dans l’épreuve et retient la main devant le péché.",
      "en": "Knowing that Allah oversees every situation calms the heart in hardship and holds the hand back from sin."
    },
    "practice": {
      "fr": "Agir en privé comme en public, en se rappelant qu’Allah voit et garde toute chose.",
      "en": "Act in private as you act in public, remembering that Allah sees and guards everything."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ",
      "text": {
        "fr": "… Celui qui accorde la sécurité, le Gardien, le Tout-Puissant…",
        "en": "… the Giver of Security, the Overseer, the Almighty…"
      }
    }
  },
  {
    "id": 8,
    "arabic": "الْعَزِيزُ",
    "transliteration": "Al-‘Azīz",
    "translation": {
      "fr": "Le Tout-Puissant",
      "en": "The Almighty"
    },
    "explanation": {
      "fr": "Al-‘Azīz est Celui qui ne peut être vaincu ni atteint, dont la puissance est totale et à qui appartient toute dignité.",
      "en": "Al-‘Azīz is the One who cannot be overcome or harmed, whose might is complete and to whom all honour belongs."
    },
    "reflection": {
      "fr": "« La puissance appartient à Allah, à Son Messager et aux croyants. » (63:8) La vraie dignité se trouve dans l’obéissance à Allah, pas dans l’orgueil.",
      "en": "“Honour belongs to Allah, to His Messenger and to the believers.” (63:8) True dignity is found in obeying Allah, not in pride."
    },
    "practice": {
      "fr": "Rechercher sa dignité dans l’obéissance à Allah, et ne pas s’humilier devant les créatures pour obtenir ce qui n’appartient qu’à Lui.",
      "en": "Seek your dignity in obeying Allah, and do not humble yourself before creatures to obtain what belongs only to Him."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:6",
      "surah": "Āl ‘Imrān",
      "arabic": "لَا إِلَٰهَ إِلَّا هُوَ الْعَزِيزُ الْحَكِيمُ",
      "text": {
        "fr": "Nulle divinité en dehors de Lui, le Tout-Puissant, le Sage.",
        "en": "There is no god but Him, the Almighty, the Wise."
      }
    }
  },
  {
    "id": 9,
    "arabic": "الْجَبَّارُ",
    "transliteration": "Al-Jabbār",
    "translation": {
      "fr": "Le Contraignant, Celui qui répare",
      "en": "The Compeller, the Restorer"
    },
    "explanation": {
      "fr": "Al-Jabbār réunit plusieurs sens : Celui dont la volonté s’impose à toute chose, Celui qui est au-dessus de Sa création, et Celui qui répare ce qui est brisé, console les cœurs et relève les faibles.",
      "en": "Al-Jabbār joins several meanings: the One whose will prevails over everything, the One who is above His creation, and the One who mends what is broken, consoles hearts and lifts up the weak."
    },
    "reflection": {
      "fr": "Un cœur brisé, une situation cassée : Allah est Celui qui répare. Entre les deux prosternations, le Prophète ﷺ demandait notamment « wajburnī », « répare-moi » (at-Tirmidhî).",
      "en": "A broken heart, a broken situation: Allah is the One who mends. Between the two prostrations, the Prophet ﷺ would ask, among other things, “wajburnī”, “mend me” (at-Tirmidhî)."
    },
    "practice": {
      "fr": "Confier à Allah ce qui est brisé en soi, et aider à réparer les cœurs des autres par une parole ou un geste.",
      "en": "Entrust to Allah what is broken within you, and help mend the hearts of others with a word or a gesture."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ",
      "text": {
        "fr": "… le Tout-Puissant, le Contraignant, le Suprême…",
        "en": "… the Almighty, the Compeller, the Supreme…"
      }
    }
  },
  {
    "id": 10,
    "arabic": "الْمُتَكَبِّرُ",
    "transliteration": "Al-Mutakabbir",
    "translation": {
      "fr": "Le Suprême, Le Majestueux",
      "en": "The Supreme in Greatness"
    },
    "explanation": {
      "fr": "Al-Mutakabbir est Celui à qui revient toute grandeur, au-dessus de tout défaut et de toute comparaison. Chez Allah, la grandeur est une perfection ; chez la créature, l’orgueil est un défaut.",
      "en": "Al-Mutakabbir is the One to whom all greatness belongs, above every flaw and every comparison. In Allah, greatness is a perfection; in a creature, arrogance is a defect."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « N’entrera pas au Paradis celui qui a dans le cœur le poids d’un atome d’orgueil. » (Muslim)",
      "en": "The Prophet ﷺ said: “Whoever has an atom’s weight of arrogance in his heart will not enter Paradise.” (Muslim)"
    },
    "practice": {
      "fr": "Laisser la grandeur à Allah : accepter la vérité d’où qu’elle vienne et ne mépriser personne.",
      "en": "Leave greatness to Allah: accept the truth wherever it comes from and look down on no one."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "… le Contraignant, le Suprême. Gloire à Allah, bien au-dessus de ce qu’ils Lui associent !",
        "en": "… the Compeller, the Supreme. Exalted is Allah above what they associate with Him."
      }
    }
  },
  {
    "id": 11,
    "arabic": "الْخَالِقُ",
    "transliteration": "Al-Khāliq",
    "translation": {
      "fr": "Le Créateur",
      "en": "The Creator"
    },
    "explanation": {
      "fr": "Al-Khāliq est Celui qui crée toute chose à partir du néant, selon une mesure parfaite. Personne d’autre ne crée véritablement.",
      "en": "Al-Khāliq is the One who creates everything from nothing, according to a perfect measure. No one else truly creates."
    },
    "reflection": {
      "fr": "Regarder le ciel, un enfant ou une simple graine, c’est voir la trace du Créateur. Le Coran invite sans cesse à cette réflexion.",
      "en": "Looking at the sky, at a child or at a simple seed is seeing the trace of the Creator. The Quran constantly invites this reflection."
    },
    "practice": {
      "fr": "Contempler la création avec gratitude, et utiliser ses capacités dans ce qui plaît à Celui qui les a données.",
      "en": "Contemplate creation with gratitude, and use your abilities in what pleases the One who gave them."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:24",
      "surah": "Al-Ḥashr",
      "arabic": "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ",
      "text": {
        "fr": "C’est Lui, Allah, le Créateur, Celui qui donne l’existence, Celui qui façonne.",
        "en": "He is Allah, the Creator, the Originator, the Fashioner."
      }
    }
  },
  {
    "id": 12,
    "arabic": "الْبَارِئُ",
    "transliteration": "Al-Bāri’",
    "translation": {
      "fr": "Celui qui donne l’existence",
      "en": "The Originator"
    },
    "explanation": {
      "fr": "Al-Bāri’ est Celui qui fait exister ce qu’Il a décrété, en le distinguant des autres choses, sans modèle préalable et sans défaut.",
      "en": "Al-Bāri’ is the One who brings into existence what He has decreed, distinguishing it from other things, without any prior model and without flaw."
    },
    "reflection": {
      "fr": "Chaque être est voulu et façonné de manière unique. Personne n’existe par hasard.",
      "en": "Every being is willed and made in a unique way. No one exists by chance."
    },
    "practice": {
      "fr": "Ne pas mépriser ce qu’Allah a créé, ni en soi ni chez les autres.",
      "en": "Do not look down on what Allah has created, in yourself or in others."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:24",
      "surah": "Al-Ḥashr",
      "arabic": "الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ",
      "text": {
        "fr": "… le Créateur, Celui qui donne l’existence, Celui qui façonne. À Lui les plus beaux noms.",
        "en": "… the Creator, the Originator, the Fashioner. His are the most beautiful names."
      }
    }
  },
  {
    "id": 13,
    "arabic": "الْمُصَوِّرُ",
    "transliteration": "Al-Muṣawwir",
    "translation": {
      "fr": "Celui qui façonne les formes",
      "en": "The Fashioner"
    },
    "explanation": {
      "fr": "Al-Muṣawwir est Celui qui donne à chaque créature sa forme et son apparence propres, dans une diversité sans fin.",
      "en": "Al-Muṣawwir is the One who gives every creature its own form and appearance, in endless variety."
    },
    "reflection": {
      "fr": "Aucun visage n’est identique à un autre. Cette diversité est un signe de la science et de la puissance d’Allah.",
      "en": "No face is identical to another. This variety is a sign of Allah’s knowledge and power."
    },
    "practice": {
      "fr": "Remercier Allah pour son corps et sa forme, et ne pas se moquer de l’apparence de quiconque.",
      "en": "Thank Allah for your body and form, and never mock anyone’s appearance."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:6",
      "surah": "Āl ‘Imrān",
      "arabic": "هُوَ الَّذِي يُصَوِّرُكُمْ فِي الْأَرْحَامِ كَيْفَ يَشَاءُ",
      "text": {
        "fr": "C’est Lui qui vous façonne dans les matrices comme Il veut.",
        "en": "It is He who shapes you in the wombs however He wills."
      }
    }
  },
  {
    "id": 14,
    "arabic": "الْغَفَّارُ",
    "transliteration": "Al-Ghaffār",
    "translation": {
      "fr": "Celui qui pardonne sans cesse",
      "en": "The Ever-Forgiving"
    },
    "explanation": {
      "fr": "Al-Ghaffār est Celui qui pardonne encore et encore, aussi nombreuses que soient les fautes, à celui qui revient vers Lui. Il couvre les péchés et en efface les conséquences.",
      "en": "Al-Ghaffār is the One who forgives again and again, however many the sins, for whoever turns back to Him. He covers sins and erases their consequences."
    },
    "reflection": {
      "fr": "Allah dit dans un hadith qudsî : « Ô fils d’Adam, tant que tu M’invoques et M’espères, Je te pardonne ce que tu as fait, sans M’en soucier. » (at-Tirmidhî)",
      "en": "Allah says in a hadith qudsî: “O son of Adam, as long as you call upon Me and hope in Me, I will forgive you what you have done, and I do not mind.” (at-Tirmidhî)"
    },
    "practice": {
      "fr": "Demander pardon régulièrement, même après la même faute répétée, sans jamais se dire qu’il est trop tard.",
      "en": "Ask for forgiveness regularly, even after repeating the same mistake, and never tell yourself it is too late."
    },
    "evidence": {
      "kind": "quran",
      "ref": "71:10",
      "surah": "Nūḥ",
      "arabic": "اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا",
      "text": {
        "fr": "Implorez le pardon de votre Seigneur, car Il pardonne sans cesse.",
        "en": "Ask forgiveness of your Lord; indeed, He is ever Forgiving."
      }
    }
  },
  {
    "id": 15,
    "arabic": "الْقَهَّارُ",
    "transliteration": "Al-Qahhār",
    "translation": {
      "fr": "Le Dominateur suprême",
      "en": "The Subduer"
    },
    "explanation": {
      "fr": "Al-Qahhār est Celui qui domine toute chose : toutes les créatures sont soumises à Sa volonté, et rien ne Lui résiste.",
      "en": "Al-Qahhār is the One who prevails over everything: all creatures are subject to His will, and nothing resists Him."
    },
    "reflection": {
      "fr": "Les tyrans passent, les empires tombent. Le Jour dernier, tous comparaîtront devant Allah, l’Unique, le Dominateur.",
      "en": "Tyrants pass, empires fall. On the Last Day, all will stand before Allah, the One, the Subduer."
    },
    "practice": {
      "fr": "Dominer ses passions par obéissance à Allah, et ne pas craindre l’oppresseur plus qu’Allah.",
      "en": "Master your desires out of obedience to Allah, and do not fear an oppressor more than Allah."
    },
    "evidence": {
      "kind": "quran",
      "ref": "14:48",
      "surah": "Ibrāhīm",
      "arabic": "وَبَرَزُوا لِلَّهِ الْوَاحِدِ الْقَهَّارِ",
      "text": {
        "fr": "… et ils comparaîtront devant Allah, l’Unique, le Dominateur suprême.",
        "en": "… and they will come out before Allah, the One, the Prevailing."
      }
    }
  },
  {
    "id": 16,
    "arabic": "الْوَهَّابُ",
    "transliteration": "Al-Wahhāb",
    "translation": {
      "fr": "Le Grand Donateur",
      "en": "The Bestower"
    },
    "explanation": {
      "fr": "Al-Wahhāb est Celui qui donne sans cesse et sans contrepartie, sans qu’on le mérite et sans que Ses trésors diminuent.",
      "en": "Al-Wahhāb is the One who gives constantly and freely, without it being earned and without His treasures ever decreasing."
    },
    "reflection": {
      "fr": "Les prophètes demandaient à Allah par ce nom : Sulaymān (38:35) et Zakariyyā (3:38) ont invoqué « Toi, le Grand Donateur ».",
      "en": "The prophets asked Allah by this name: Sulaymān (38:35) and Zakariyyā (3:38) called on Him as “the Bestower”."
    },
    "practice": {
      "fr": "Demander à Allah ce dont on a besoin, même ce qui semble impossible, et donner soi-même sans attendre de retour.",
      "en": "Ask Allah for what you need, even what seems impossible, and give yourself without expecting anything back."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:8",
      "surah": "Āl ‘Imrān",
      "arabic": "وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً ۚ إِنَّكَ أَنْتَ الْوَهَّابُ",
      "text": {
        "fr": "… et accorde-nous de Ta part une miséricorde. C’est Toi le Grand Donateur.",
        "en": "… and grant us mercy from Yourself. Indeed, You are the Bestower."
      }
    }
  },
  {
    "id": 17,
    "arabic": "الرَّزَّاقُ",
    "transliteration": "Ar-Razzāq",
    "translation": {
      "fr": "Le Pourvoyeur",
      "en": "The Provider"
    },
    "explanation": {
      "fr": "Ar-Razzāq est Celui qui pourvoit à la subsistance de toutes Ses créatures : nourriture, santé, science, foi et tout ce qui fait vivre le corps et le cœur.",
      "en": "Ar-Razzāq is the One who provides for all His creatures: food, health, knowledge, faith and everything that keeps the body and the heart alive."
    },
    "reflection": {
      "fr": "« Il n’est pas de bête sur terre dont la subsistance n’incombe à Allah. » (11:6) Le rizq de chacun est écrit ; aucune âme ne meurt avant de l’avoir reçu en entier.",
      "en": "“There is no creature on earth but that its provision is upon Allah.” (11:6) Each person’s provision is written; no soul dies before receiving it in full."
    },
    "practice": {
      "fr": "Travailler de manière licite, sans angoisse ni avidité, et remercier pour ce qui est accordé.",
      "en": "Work in lawful ways, without anxiety or greed, and be thankful for what you are given."
    },
    "evidence": {
      "kind": "quran",
      "ref": "51:58",
      "surah": "Adh-Dhāriyāt",
      "arabic": "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ",
      "text": {
        "fr": "C’est Allah le Pourvoyeur, le Détenteur de la force, l’Inébranlable.",
        "en": "Indeed, it is Allah who is the Provider, the Possessor of strength, the Firm."
      }
    }
  },
  {
    "id": 18,
    "arabic": "الْفَتَّاحُ",
    "transliteration": "Al-Fattāḥ",
    "translation": {
      "fr": "Celui qui ouvre et qui juge",
      "en": "The Opener, the Judge"
    },
    "explanation": {
      "fr": "Al-Fattāḥ est Celui qui ouvre les portes de Sa miséricorde, de la subsistance et de la science, et qui tranche avec vérité entre Ses serviteurs.",
      "en": "Al-Fattāḥ is the One who opens the doors of His mercy, of provision and of knowledge, and who judges with truth between His servants."
    },
    "reflection": {
      "fr": "Aucune porte fermée ne l’est pour Allah. Ce qu’Il ouvre, personne ne peut le fermer (35:2).",
      "en": "No closed door is closed for Allah. What He opens, no one can close (35:2)."
    },
    "practice": {
      "fr": "Demander à Allah d’ouvrir son cœur à la compréhension, et ne pas désespérer face à une situation bloquée.",
      "en": "Ask Allah to open your heart to understanding, and do not despair when a situation seems stuck."
    },
    "evidence": {
      "kind": "quran",
      "ref": "34:26",
      "surah": "Saba’",
      "arabic": "وَهُوَ الْفَتَّاحُ الْعَلِيمُ",
      "text": {
        "fr": "… et c’est Lui le Juge suprême, l’Omniscient.",
        "en": "… and He is the Knowing Judge."
      }
    }
  },
  {
    "id": 19,
    "arabic": "الْعَلِيمُ",
    "transliteration": "Al-‘Alīm",
    "translation": {
      "fr": "L’Omniscient",
      "en": "The All-Knowing"
    },
    "explanation": {
      "fr": "Al-‘Alīm est Celui dont la science embrasse toute chose : le passé, le présent et l’avenir, l’apparent et le caché, ce qui est et ce qui aurait pu être.",
      "en": "Al-‘Alīm is the One whose knowledge encompasses everything: past, present and future, the visible and the hidden, what is and what could have been."
    },
    "reflection": {
      "fr": "Allah connaît les pensées que l’on ne dit à personne. Cela rassure celui qui souffre en silence et retient celui qui pense être caché.",
      "en": "Allah knows the thoughts we tell no one. This reassures the one who suffers in silence and restrains the one who thinks they are hidden."
    },
    "practice": {
      "fr": "Rechercher la science utile avec humilité, et dire « Allah sait mieux » quand on ne sait pas.",
      "en": "Seek beneficial knowledge with humility, and say “Allah knows best” when you do not know."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:32",
      "surah": "Al-Baqara",
      "arabic": "سُبْحَانَكَ لَا عِلْمَ لَنَا إِلَّا مَا عَلَّمْتَنَا ۖ إِنَّكَ أَنْتَ الْعَلِيمُ الْحَكِيمُ",
      "text": {
        "fr": "Gloire à Toi ! Nous n’avons de savoir que ce que Tu nous as appris. C’est Toi l’Omniscient, le Sage.",
        "en": "Exalted are You; we have no knowledge except what You have taught us. Indeed, You are the All-Knowing, the Wise."
      }
    }
  },
  {
    "id": 20,
    "arabic": "الْقَابِضُ",
    "transliteration": "Al-Qābiḍ",
    "translation": {
      "fr": "Celui qui retient",
      "en": "The Withholder"
    },
    "explanation": {
      "fr": "Al-Qābiḍ est Celui qui restreint la subsistance ou reprend les âmes selon Sa sagesse. Ce nom se comprend avec son opposé, Al-Bāsiṭ : Allah retient et Il étend.",
      "en": "Al-Qābiḍ is the One who restricts provision or takes back souls according to His wisdom. This name is understood together with its opposite, Al-Bāsiṭ: Allah withholds and He extends."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « C’est Allah qui fixe les prix, Celui qui retient, Celui qui étend, le Pourvoyeur. » (Abû Dâwûd et at-Tirmidhî, authentifié par al-Albânî)",
      "en": "The Prophet ﷺ said: “Allah is the One who sets prices, who withholds, who extends, the Provider.” (Abû Dâwûd and at-Tirmidhî, graded authentic by al-Albânî)"
    },
    "practice": {
      "fr": "Patienter dans les moments de gêne, en sachant qu’ils ont une sagesse et qu’ils ne durent pas.",
      "en": "Be patient in times of difficulty, knowing they carry wisdom and do not last."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:245",
      "surah": "Al-Baqara",
      "arabic": "وَاللَّهُ يَقْبِضُ وَيَبْسُطُ وَإِلَيْهِ تُرْجَعُونَ",
      "text": {
        "fr": "Allah restreint et étend, et c’est vers Lui que vous serez ramenés.",
        "en": "Allah withholds and extends, and to Him you will be returned."
      }
    }
  },
  {
    "id": 21,
    "arabic": "الْبَاسِطُ",
    "transliteration": "Al-Bāsiṭ",
    "translation": {
      "fr": "Celui qui étend",
      "en": "The Extender"
    },
    "explanation": {
      "fr": "Al-Bāsiṭ est Celui qui étend la subsistance, la miséricorde et le bien à qui Il veut. Il étend aussi Sa main la nuit pour accueillir le repentir de celui qui a fauté le jour (Muslim).",
      "en": "Al-Bāsiṭ is the One who extends provision, mercy and good to whom He wills. He also extends His hand at night to accept the repentance of the one who sinned by day (Muslim)."
    },
    "reflection": {
      "fr": "L’aisance est une épreuve autant que la gêne : elle demande de la gratitude.",
      "en": "Ease is a test just as hardship is: it calls for gratitude."
    },
    "practice": {
      "fr": "Remercier Allah dans l’aisance et partager ce qu’Il a donné.",
      "en": "Thank Allah in times of ease and share what He has given."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:245",
      "surah": "Al-Baqara",
      "arabic": "وَاللَّهُ يَقْبِضُ وَيَبْسُطُ",
      "text": {
        "fr": "Allah restreint et étend.",
        "en": "Allah withholds and extends."
      }
    }
  },
  {
    "id": 22,
    "arabic": "الْخَافِضُ",
    "transliteration": "Al-Khāfiḍ",
    "translation": {
      "fr": "Celui qui abaisse",
      "en": "The Abaser"
    },
    "explanation": {
      "fr": "Al-Khāfiḍ est Celui qui abaisse qui Il veut, par Sa justice : l’orgueilleux, l’oppresseur, celui qui se détourne de la vérité. Ce nom se comprend avec son opposé, Ar-Rāfi‘.",
      "en": "Al-Khāfiḍ is the One who lowers whom He wills, by His justice: the arrogant, the oppressor, the one who turns away from the truth. This name is understood together with its opposite, Ar-Rāfi‘."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit d’Allah : « Dans Son autre main est la balance : Il abaisse et Il élève. » (al-Bukhârî et Muslim)",
      "en": "The Prophet ﷺ said of Allah: “In His other hand is the balance: He lowers and He raises.” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Se méfier de l’orgueil, car c’est lui qui fait tomber, et ne pas se réjouir de l’abaissement des autres.",
      "en": "Beware of pride, for it is what brings one down, and do not rejoice when others are brought low."
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "« Dans Son autre main est la balance : Il abaisse et Il élève. »",
        "en": "“In His other hand is the balance: He lowers and He raises.”"
      },
      "source": {
        "fr": "al-Bukhârî et Muslim",
        "en": "al-Bukhârî and Muslim"
      }
    }
  },
  {
    "id": 23,
    "arabic": "الرَّافِعُ",
    "transliteration": "Ar-Rāfi‘",
    "translation": {
      "fr": "Celui qui élève",
      "en": "The Exalter"
    },
    "explanation": {
      "fr": "Ar-Rāfi‘ est Celui qui élève qui Il veut, en rang, en science et en honneur. Il élève les croyants et ceux qui ont reçu la science (58:11).",
      "en": "Ar-Rāfi‘ is the One who raises whom He wills, in rank, in knowledge and in honour. He raises the believers and those given knowledge (58:11)."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Personne ne se fait humble pour Allah sans qu’Allah ne l’élève. » (Muslim)",
      "en": "The Prophet ﷺ said: “No one humbles himself for Allah except that Allah raises him.” (Muslim)"
    },
    "practice": {
      "fr": "Rechercher l’élévation auprès d’Allah par l’humilité et la science, plutôt que la reconnaissance des gens.",
      "en": "Seek to be raised by Allah through humility and knowledge, rather than through people’s recognition."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:55",
      "surah": "Āl ‘Imrān",
      "arabic": "إِنِّي مُتَوَفِّيكَ وَرَافِعُكَ إِلَيَّ",
      "text": {
        "fr": "Je vais mettre fin à ta vie terrestre et t’élever vers Moi.",
        "en": "I will take you and raise you to Myself."
      }
    }
  },
  {
    "id": 24,
    "arabic": "الْمُعِزُّ",
    "transliteration": "Al-Mu‘izz",
    "translation": {
      "fr": "Celui qui honore",
      "en": "The Honourer"
    },
    "explanation": {
      "fr": "Al-Mu‘izz est Celui qui donne l’honneur et la puissance à qui Il veut. Ce nom se comprend avec son opposé, Al-Mudhill.",
      "en": "Al-Mu‘izz is the One who gives honour and strength to whom He wills. This name is understood together with its opposite, Al-Mudhill."
    },
    "reflection": {
      "fr": "L’honneur ne s’achète pas et ne se prend pas : il est donné par Allah, souvent à ceux que les gens ne remarquent pas.",
      "en": "Honour cannot be bought or seized: it is given by Allah, often to those people do not notice."
    },
    "practice": {
      "fr": "Chercher l’honneur dans l’obéissance à Allah et non dans l’approbation des gens.",
      "en": "Seek honour in obeying Allah, not in people’s approval."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:26",
      "surah": "Āl ‘Imrān",
      "arabic": "وَتُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ ۖ بِيَدِكَ الْخَيْرُ",
      "text": {
        "fr": "Tu honores qui Tu veux et Tu humilies qui Tu veux. Le bien est dans Ta main.",
        "en": "You honour whom You will and You humble whom You will. In Your hand is all good."
      }
    }
  },
  {
    "id": 25,
    "arabic": "الْمُذِلُّ",
    "transliteration": "Al-Mudhill",
    "translation": {
      "fr": "Celui qui humilie",
      "en": "The Humbler"
    },
    "explanation": {
      "fr": "Al-Mudhill est Celui qui retire l’honneur à qui Il veut, par Sa justice et Sa sagesse. Ce nom se comprend avec son opposé, Al-Mu‘izz : Allah honore et Il humilie.",
      "en": "Al-Mudhill is the One who removes honour from whom He wills, by His justice and wisdom. This name is understood together with its opposite, Al-Mu‘izz: Allah honours and He humbles."
    },
    "reflection": {
      "fr": "Celui qui recherche l’honneur en dehors d’Allah finit par être humilié. Ce nom invite à la prudence plus qu’à la peur.",
      "en": "Whoever seeks honour away from Allah ends up humbled. This name calls for caution more than fear."
    },
    "practice": {
      "fr": "Ne jamais humilier quelqu’un, et demander à Allah de ne pas être de ceux qu’Il abaisse.",
      "en": "Never humiliate anyone, and ask Allah not to be among those He lowers."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:26",
      "surah": "Āl ‘Imrān",
      "arabic": "وَتُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ",
      "text": {
        "fr": "Tu honores qui Tu veux et Tu humilies qui Tu veux.",
        "en": "You honour whom You will and You humble whom You will."
      }
    }
  },
  {
    "id": 26,
    "arabic": "السَّمِيعُ",
    "transliteration": "As-Samī‘",
    "translation": {
      "fr": "Celui qui entend tout",
      "en": "The All-Hearing"
    },
    "explanation": {
      "fr": "As-Samī‘ est Celui qui entend toute chose, les voix les plus faibles comme les plus fortes, dans toutes les langues, sans qu’aucune ne Le distraie d’une autre. Il entend aussi les invocations, au sens où Il y répond.",
      "en": "As-Samī‘ is the One who hears everything, the faintest voices as well as the loudest, in every language, without any distracting Him from another. He also hears supplications, in the sense that He answers them."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Vous n’invoquez ni un sourd ni un absent : vous invoquez Celui qui entend tout, qui est proche. » (al-Bukhârî et Muslim)",
      "en": "The Prophet ﷺ said: “You are not calling upon one who is deaf or absent: you are calling upon One who is All-Hearing and near.” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Surveiller ses paroles, et invoquer Allah même à voix basse, en sachant qu’Il entend.",
      "en": "Watch your words, and call upon Allah even quietly, knowing that He hears."
    },
    "evidence": {
      "kind": "quran",
      "ref": "42:11",
      "surah": "Ash-Shūrā",
      "arabic": "لَيْسَ كَمِثْلِهِ شَيْءٌ ۖ وَهُوَ السَّمِيعُ الْبَصِيرُ",
      "text": {
        "fr": "Rien ne Lui ressemble, et c’est Lui qui entend tout et voit tout.",
        "en": "There is nothing like Him, and He is the All-Hearing, the All-Seeing."
      }
    }
  },
  {
    "id": 27,
    "arabic": "الْبَصِيرُ",
    "transliteration": "Al-Baṣīr",
    "translation": {
      "fr": "Celui qui voit tout",
      "en": "The All-Seeing"
    },
    "explanation": {
      "fr": "Al-Baṣīr est Celui qui voit toute chose, l’apparent et le caché, sans que rien ne Lui échappe : la fourmi noire sur la pierre noire dans la nuit noire.",
      "en": "Al-Baṣīr is the One who sees everything, the visible and the hidden, without anything escaping Him: the black ant on a black stone in the dark night."
    },
    "reflection": {
      "fr": "C’est le sens de l’iḥsān décrit par le Prophète ﷺ : « Adorer Allah comme si tu Le voyais ; car si tu ne Le vois pas, Lui te voit. » (Muslim)",
      "en": "This is the meaning of iḥsān described by the Prophet ﷺ: “To worship Allah as though you see Him; for if you do not see Him, He sees you.” (Muslim)"
    },
    "practice": {
      "fr": "Soigner ses actes même quand personne ne regarde.",
      "en": "Take care over your actions even when no one is watching."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:4",
      "surah": "Al-Ḥadīd",
      "arabic": "وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ",
      "text": {
        "fr": "Et Allah voit parfaitement ce que vous faites.",
        "en": "And Allah is Seeing of what you do."
      }
    }
  },
  {
    "id": 28,
    "arabic": "الْحَكَمُ",
    "transliteration": "Al-Ḥakam",
    "translation": {
      "fr": "Le Juge",
      "en": "The Judge"
    },
    "explanation": {
      "fr": "Al-Ḥakam est Celui qui juge entre Ses créatures, dans ce monde par Sa loi et dans l’au-delà par Son jugement, sans jamais commettre d’injustice.",
      "en": "Al-Ḥakam is the One who judges between His creatures, in this world by His law and in the Hereafter by His judgement, without ever being unjust."
    },
    "reflection": {
      "fr": "Les injustices qu’on n’a pas pu régler ici seront jugées par Celui qui n’oublie rien.",
      "en": "The injustices we could not settle here will be judged by the One who forgets nothing."
    },
    "practice": {
      "fr": "Prendre la loi d’Allah comme référence dans ses désaccords, et juger les autres avec équité.",
      "en": "Take Allah’s law as the reference in your disagreements, and judge others fairly."
    },
    "evidence": {
      "kind": "quran",
      "ref": "6:114",
      "surah": "Al-An‘ām",
      "arabic": "أَفَغَيْرَ اللَّهِ أَبْتَغِي حَكَمًا",
      "text": {
        "fr": "Chercherais-je un autre juge qu’Allah ?",
        "en": "Shall I seek a judge other than Allah?"
      }
    }
  },
  {
    "id": 29,
    "arabic": "الْعَدْلُ",
    "transliteration": "Al-‘Adl",
    "translation": {
      "fr": "Le Parfaitement Juste",
      "en": "The Utterly Just"
    },
    "explanation": {
      "fr": "Al-‘Adl est Celui dont la justice est parfaite : Il ne lèse personne du poids d’un atome, et chaque décision est à sa juste place.",
      "en": "Al-‘Adl is the One whose justice is perfect: He does not wrong anyone by an atom’s weight, and every decision is in its rightful place."
    },
    "reflection": {
      "fr": "Allah dit dans un hadith qudsî : « Ô Mes serviteurs, Je Me suis interdit l’injustice et Je l’ai rendue interdite entre vous. » (Muslim)",
      "en": "Allah says in a hadith qudsî: “O My servants, I have forbidden injustice for Myself and made it forbidden among you.” (Muslim)"
    },
    "practice": {
      "fr": "Être juste dans ses paroles et ses jugements, même envers ceux qu’on n’aime pas (5:8).",
      "en": "Be just in your words and judgements, even towards those you dislike (5:8)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:40",
      "surah": "An-Nisā’",
      "arabic": "إِنَّ اللَّهَ لَا يَظْلِمُ مِثْقَالَ ذَرَّةٍ",
      "text": {
        "fr": "Allah ne lèse personne, fût-ce du poids d’un atome.",
        "en": "Indeed, Allah does not do injustice, even as much as an atom’s weight."
      }
    }
  },
  {
    "id": 30,
    "arabic": "اللَّطِيفُ",
    "transliteration": "Al-Laṭīf",
    "translation": {
      "fr": "Le Subtil, Le Très Doux",
      "en": "The Subtle, the Gentle"
    },
    "explanation": {
      "fr": "Al-Laṭīf réunit deux sens : Celui dont la science atteint les choses les plus cachées et les plus fines, et Celui qui fait parvenir Sa bonté à Ses serviteurs par des chemins qu’ils ne perçoivent pas.",
      "en": "Al-Laṭīf joins two meanings: the One whose knowledge reaches the most hidden and subtle things, and the One who brings His kindness to His servants through ways they do not perceive."
    },
    "reflection": {
      "fr": "Une épreuve peut porter un bien que l’on ne voit pas encore. Yūsuf l’a dit après des années d’épreuves : « Mon Seigneur est doux pour ce qu’Il veut. » (12:100)",
      "en": "A trial may carry a good we cannot yet see. Yūsuf said it after years of trials: “My Lord is subtle in what He wills.” (12:100)"
    },
    "practice": {
      "fr": "Être doux dans sa manière de conseiller et de corriger, et faire du bien discrètement.",
      "en": "Be gentle in the way you advise and correct, and do good discreetly."
    },
    "evidence": {
      "kind": "quran",
      "ref": "67:14",
      "surah": "Al-Mulk",
      "arabic": "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ",
      "text": {
        "fr": "Ne connaît-Il pas ce qu’Il a créé, alors que c’est Lui le Subtil, le Parfaitement Informé ?",
        "en": "Does He who created not know, while He is the Subtle, the Acquainted?"
      }
    }
  },
  {
    "id": 31,
    "arabic": "الْخَبِيرُ",
    "transliteration": "Al-Khabīr",
    "translation": {
      "fr": "Le Parfaitement Informé",
      "en": "The All-Aware"
    },
    "explanation": {
      "fr": "Al-Khabīr est Celui qui connaît le fond des choses : les intentions, les secrets et les conséquences cachées de chaque acte.",
      "en": "Al-Khabīr is the One who knows the inner reality of things: intentions, secrets and the hidden consequences of every act."
    },
    "reflection": {
      "fr": "Les gens jugent sur l’apparence ; Allah connaît l’intention. Cela rend humble devant ses propres œuvres et indulgent envers celles des autres.",
      "en": "People judge by appearances; Allah knows the intention. This makes one humble about one’s own deeds and lenient about those of others."
    },
    "practice": {
      "fr": "Soigner ses intentions avant ses actes, puisque c’est sur elles qu’Allah juge.",
      "en": "Take care of your intentions before your actions, since it is by them that Allah judges."
    },
    "evidence": {
      "kind": "quran",
      "ref": "49:13",
      "surah": "Al-Ḥujurāt",
      "arabic": "إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ ۚ إِنَّ اللَّهَ عَلِيمٌ خَبِيرٌ",
      "text": {
        "fr": "Le plus noble d’entre vous auprès d’Allah est le plus pieux. Allah est Omniscient et Parfaitement Informé.",
        "en": "The most noble of you in the sight of Allah is the most righteous. Indeed, Allah is Knowing and Acquainted."
      }
    }
  },
  {
    "id": 32,
    "arabic": "الْحَلِيمُ",
    "transliteration": "Al-Ḥalīm",
    "translation": {
      "fr": "Le Très Clément",
      "en": "The Forbearing"
    },
    "explanation": {
      "fr": "Al-Ḥalīm est Celui qui ne se hâte pas de punir alors qu’Il le pourrait. Il voit les fautes, accorde un délai et laisse le temps de revenir.",
      "en": "Al-Ḥalīm is the One who does not hasten to punish, although He could. He sees the sins, grants respite and leaves time to return."
    },
    "reflection": {
      "fr": "Dans l’angoisse, le Prophète ﷺ disait : « Lā ilāha illā Allāhu l-‘Aẓīmu l-Ḥalīm… » (al-Bukhârî et Muslim)",
      "en": "In distress, the Prophet ﷺ would say: “Lā ilāha illā Allāhu l-‘Aẓīmu l-Ḥalīm…” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Ne pas profiter du délai d’Allah pour persister dans la faute, et se montrer patient face à la colère.",
      "en": "Do not take advantage of Allah’s respite to persist in sin, and be patient in the face of anger."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:263",
      "surah": "Al-Baqara",
      "arabic": "وَاللَّهُ غَنِيٌّ حَلِيمٌ",
      "text": {
        "fr": "Et Allah se suffit à Lui-même, Il est Très Clément.",
        "en": "And Allah is Free of need and Forbearing."
      }
    }
  },
  {
    "id": 33,
    "arabic": "الْعَظِيمُ",
    "transliteration": "Al-‘Aẓīm",
    "translation": {
      "fr": "L’Immense",
      "en": "The Magnificent"
    },
    "explanation": {
      "fr": "Al-‘Aẓīm est Celui dont la grandeur est absolue, dans Son être, Ses noms et Ses attributs. Les cieux et la terre ne sont rien face à Sa grandeur.",
      "en": "Al-‘Aẓīm is the One whose greatness is absolute, in His being, His names and His attributes. The heavens and the earth are nothing before His greatness."
    },
    "reflection": {
      "fr": "Dans chaque inclinaison de la prière, on dit « Subḥāna rabbiya l-‘aẓīm » (Muslim). Ce nom est au cœur de l’adoration quotidienne.",
      "en": "In every bowing of the prayer, one says “Subḥāna rabbiya l-‘aẓīm” (Muslim). This name is at the heart of daily worship."
    },
    "practice": {
      "fr": "Prononcer cette glorification en pensant à son sens, et respecter ce qu’Allah a rendu sacré.",
      "en": "Say this glorification while thinking of its meaning, and respect what Allah has made sacred."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:255",
      "surah": "Al-Baqara",
      "arabic": "وَهُوَ الْعَلِيُّ الْعَظِيمُ",
      "text": {
        "fr": "Et Il est le Très-Haut, l’Immense.",
        "en": "And He is the Most High, the Most Great."
      }
    }
  },
  {
    "id": 34,
    "arabic": "الْغَفُورُ",
    "transliteration": "Al-Ghafūr",
    "translation": {
      "fr": "Le Grand Pardonneur",
      "en": "The All-Forgiving"
    },
    "explanation": {
      "fr": "Al-Ghafūr est Celui dont le pardon est immense : aucun péché n’est trop grand pour Son pardon lorsque le serviteur revient sincèrement vers Lui.",
      "en": "Al-Ghafūr is the One whose forgiveness is immense: no sin is too great for His forgiveness when the servant sincerely returns to Him."
    },
    "reflection": {
      "fr": "Ce verset s’adresse à ceux qui ont commis des excès contre eux-mêmes : il interdit le désespoir, pas l’effort.",
      "en": "This verse speaks to those who have wronged themselves: it forbids despair, not effort."
    },
    "practice": {
      "fr": "Multiplier l’istighfār, et pardonner à son tour à ceux qui nous ont fait du tort (24:22).",
      "en": "Say istighfār often, and in turn forgive those who have wronged you (24:22)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "39:53",
      "surah": "Az-Zumar",
      "arabic": "إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
      "text": {
        "fr": "Allah pardonne tous les péchés. C’est Lui le Grand Pardonneur, le Très Miséricordieux.",
        "en": "Indeed, Allah forgives all sins. It is He who is the Forgiving, the Merciful."
      }
    }
  },
  {
    "id": 35,
    "arabic": "الشَّكُورُ",
    "transliteration": "Ash-Shakūr",
    "translation": {
      "fr": "Celui qui récompense abondamment",
      "en": "The Most Appreciative"
    },
    "explanation": {
      "fr": "Ash-Shakūr est Celui qui récompense largement les actes, même petits, et multiplie leur récompense au-delà de ce qu’ils valent.",
      "en": "Ash-Shakūr is the One who rewards deeds generously, even small ones, and multiplies their reward beyond what they are worth."
    },
    "reflection": {
      "fr": "Un homme a retiré une branche épineuse du chemin : Allah l’en a remercié et lui a pardonné (al-Bukhârî et Muslim).",
      "en": "A man removed a thorny branch from the road: Allah thanked him for it and forgave him (al-Bukhârî and Muslim)."
    },
    "practice": {
      "fr": "Ne mépriser aucune bonne action, et remercier les gens pour ce qu’ils font.",
      "en": "Do not belittle any good deed, and thank people for what they do."
    },
    "evidence": {
      "kind": "quran",
      "ref": "35:30",
      "surah": "Fāṭir",
      "arabic": "إِنَّهُ غَفُورٌ شَكُورٌ",
      "text": {
        "fr": "Il est Pardonneur et Reconnaissant.",
        "en": "Indeed, He is Forgiving and Appreciative."
      }
    }
  },
  {
    "id": 36,
    "arabic": "الْعَلِيُّ",
    "transliteration": "Al-‘Aliyy",
    "translation": {
      "fr": "Le Très-Haut",
      "en": "The Most High"
    },
    "explanation": {
      "fr": "Al-‘Aliyy est Celui qui est au-dessus de toute chose : par Son être, au-dessus de Sa création, par Sa valeur et par Sa domination.",
      "en": "Al-‘Aliyy is the One who is above all things: in His being, above His creation, in His worth and in His dominion."
    },
    "reflection": {
      "fr": "Dans chaque prosternation, au moment où l’on est le plus bas, on dit « Subḥāna rabbiya l-a‘lā » : Gloire à mon Seigneur, le Très-Haut.",
      "en": "In every prostration, at the moment one is lowest, one says “Subḥāna rabbiya l-a‘lā”: Glory to my Lord, the Most High."
    },
    "practice": {
      "fr": "Élever ses buts, et s’abaisser devant Allah seul.",
      "en": "Raise your aims high, and lower yourself before Allah alone."
    },
    "evidence": {
      "kind": "quran",
      "ref": "22:62",
      "surah": "Al-Ḥajj",
      "arabic": "وَأَنَّ اللَّهَ هُوَ الْعَلِيُّ الْكَبِيرُ",
      "text": {
        "fr": "… et c’est Allah le Très-Haut, le Très Grand.",
        "en": "… and Allah is the Most High, the Grand."
      }
    }
  },
  {
    "id": 37,
    "arabic": "الْكَبِيرُ",
    "transliteration": "Al-Kabīr",
    "translation": {
      "fr": "Le Très Grand",
      "en": "The Most Great"
    },
    "explanation": {
      "fr": "Al-Kabīr est Celui qui est plus grand que tout : aucune créature ne peut Le mesurer ni L’égaler.",
      "en": "Al-Kabīr is the One who is greater than everything: no creature can measure Him or equal Him."
    },
    "reflection": {
      "fr": "« Allāhu akbar » ouvre chaque prière : ce qui occupe l’esprit est plus petit qu’Allah.",
      "en": "“Allāhu akbar” opens every prayer: whatever occupies the mind is smaller than Allah."
    },
    "practice": {
      "fr": "Dire le takbīr en le pensant, et ne pas laisser un souci prendre plus de place qu’Allah dans son cœur.",
      "en": "Say the takbīr meaning it, and do not let a worry take more room in your heart than Allah."
    },
    "evidence": {
      "kind": "quran",
      "ref": "13:9",
      "surah": "Ar-Ra‘d",
      "arabic": "عَالِمُ الْغَيْبِ وَالشَّهَادَةِ الْكَبِيرُ الْمُتَعَالِ",
      "text": {
        "fr": "Il connaît l’invisible et le visible, le Très Grand, le Très Élevé.",
        "en": "Knower of the unseen and the witnessed, the Grand, the Exalted."
      }
    }
  },
  {
    "id": 38,
    "arabic": "الْحَفِيظُ",
    "transliteration": "Al-Ḥafīẓ",
    "translation": {
      "fr": "Le Préservateur",
      "en": "The Preserver"
    },
    "explanation": {
      "fr": "Al-Ḥafīẓ est Celui qui préserve Sa création, protège Ses serviteurs et conserve le compte exact de leurs œuvres.",
      "en": "Al-Ḥafīẓ is the One who preserves His creation, protects His servants and keeps an exact record of their deeds."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit à Ibn ‘Abbās : « Préserve Allah, Il te préservera. » (at-Tirmidhî, authentifié par al-Albânî)",
      "en": "The Prophet ﷺ said to Ibn ‘Abbās: “Be mindful of Allah, and He will protect you.” (at-Tirmidhî, graded authentic by al-Albânî)"
    },
    "practice": {
      "fr": "Préserver les limites d’Allah, sa prière et sa langue, et dire les invocations de protection du matin et du soir.",
      "en": "Preserve Allah’s limits, your prayer and your tongue, and say the morning and evening supplications of protection."
    },
    "evidence": {
      "kind": "quran",
      "ref": "11:57",
      "surah": "Hūd",
      "arabic": "إِنَّ رَبِّي عَلَىٰ كُلِّ شَيْءٍ حَفِيظٌ",
      "text": {
        "fr": "Mon Seigneur préserve toute chose.",
        "en": "Indeed, my Lord is Guardian over all things."
      }
    }
  },
  {
    "id": 39,
    "arabic": "الْمُقِيتُ",
    "transliteration": "Al-Muqīt",
    "translation": {
      "fr": "Le Nourricier, Le Soutien",
      "en": "The Nourisher"
    },
    "explanation": {
      "fr": "Al-Muqīt est Celui qui donne à chaque créature sa nourriture et ce qui la maintient en vie, et qui a pouvoir et regard sur toute chose.",
      "en": "Al-Muqīt is the One who gives every creature its food and what keeps it alive, and who has power and oversight over everything."
    },
    "reflection": {
      "fr": "Le corps a besoin de nourriture, le cœur aussi : la prière, le Coran et le rappel sont sa subsistance.",
      "en": "The body needs food, and so does the heart: prayer, the Quran and remembrance are its nourishment."
    },
    "practice": {
      "fr": "Nourrir son cœur comme on nourrit son corps, avec régularité.",
      "en": "Nourish your heart as you nourish your body, regularly."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:85",
      "surah": "An-Nisā’",
      "arabic": "وَكَانَ اللَّهُ عَلَىٰ كُلِّ شَيْءٍ مُقِيتًا",
      "text": {
        "fr": "Et Allah veille et pourvoit à toute chose.",
        "en": "And Allah is ever, over all things, a Keeper."
      }
    }
  },
  {
    "id": 40,
    "arabic": "الْحَسِيبُ",
    "transliteration": "Al-Ḥasīb",
    "translation": {
      "fr": "Celui qui suffit et qui tient les comptes",
      "en": "The Reckoner, the Sufficient"
    },
    "explanation": {
      "fr": "Al-Ḥasīb réunit deux sens : Celui qui suffit à Ses serviteurs pour tout ce qui les concerne, et Celui qui leur demandera compte de leurs actes.",
      "en": "Al-Ḥasīb joins two meanings: the One who is sufficient for His servants in all their affairs, and the One who will call them to account for their deeds."
    },
    "reflection": {
      "fr": "« Ḥasbiya Allāh » : Allah me suffit. Celui qui s’en remet à Lui n’est jamais laissé seul.",
      "en": "“Ḥasbiya Allāh”: Allah is enough for me. Whoever relies on Him is never left alone."
    },
    "practice": {
      "fr": "Se demander des comptes avant d’en rendre, et se contenter d’Allah face à l’inquiétude.",
      "en": "Take account of yourself before you are taken to account, and be content with Allah in the face of worry."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:6",
      "surah": "An-Nisā’",
      "arabic": "وَكَفَىٰ بِاللَّهِ حَسِيبًا",
      "text": {
        "fr": "Et Allah suffit pour tenir les comptes.",
        "en": "And sufficient is Allah as Accountant."
      }
    }
  },
  {
    "id": 41,
    "arabic": "الْجَلِيلُ",
    "transliteration": "Al-Jalīl",
    "translation": {
      "fr": "Le Majestueux",
      "en": "The Majestic"
    },
    "explanation": {
      "fr": "Al-Jalīl est Celui qui possède toutes les qualités de majesté et de grandeur. Sa majesté inspire le respect et la crainte révérencielle.",
      "en": "Al-Jalīl is the One who possesses every quality of majesty and greatness. His majesty inspires respect and reverent awe."
    },
    "reflection": {
      "fr": "Le Coran décrit Allah comme « le Détenteur de la majesté et de la générosité » : Sa majesté va avec Sa bonté.",
      "en": "The Quran describes Allah as “the Owner of majesty and honour”: His majesty goes together with His goodness."
    },
    "practice": {
      "fr": "Parler d’Allah avec respect, et éviter les plaisanteries sur ce qui touche à la religion.",
      "en": "Speak of Allah with respect, and avoid joking about matters of religion."
    },
    "evidence": {
      "kind": "quran",
      "ref": "55:27",
      "surah": "Ar-Raḥmān",
      "arabic": "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو الْجَلَالِ وَالْإِكْرَامِ",
      "text": {
        "fr": "Seul demeure le Visage de ton Seigneur, plein de majesté et de générosité.",
        "en": "And there will remain the Face of your Lord, Owner of Majesty and Honour."
      }
    }
  },
  {
    "id": 42,
    "arabic": "الْكَرِيمُ",
    "transliteration": "Al-Karīm",
    "translation": {
      "fr": "Le Très Généreux",
      "en": "The Most Generous"
    },
    "explanation": {
      "fr": "Al-Karīm est Celui dont la générosité est sans limite : Il donne avant qu’on demande, pardonne quand Il pourrait punir et honore quand on ne le mérite pas.",
      "en": "Al-Karīm is the One whose generosity has no limit: He gives before being asked, forgives when He could punish and honours when it is not deserved."
    },
    "reflection": {
      "fr": "« Ô homme ! Qu’est-ce qui t’a trompé au sujet de ton Seigneur, le Généreux ? » Sa générosité ne doit pas rendre négligent.",
      "en": "“O mankind, what has deceived you about your Lord, the Generous?” His generosity should not make one careless."
    },
    "practice": {
      "fr": "Être généreux de son temps, de son argent et de son pardon.",
      "en": "Be generous with your time, your money and your forgiveness."
    },
    "evidence": {
      "kind": "quran",
      "ref": "82:6",
      "surah": "Al-Infiṭār",
      "arabic": "يَا أَيُّهَا الْإِنْسَانُ مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ",
      "text": {
        "fr": "Ô homme ! Qu’est-ce qui t’a trompé au sujet de ton Seigneur, le Généreux ?",
        "en": "O mankind, what has deceived you concerning your Lord, the Generous?"
      }
    }
  },
  {
    "id": 43,
    "arabic": "الرَّقِيبُ",
    "transliteration": "Ar-Raqīb",
    "translation": {
      "fr": "Le Vigilant",
      "en": "The Watchful"
    },
    "explanation": {
      "fr": "Ar-Raqīb est Celui qui observe en permanence Ses créatures, leurs actes, leurs paroles et leurs pensées, sans jamais s’absenter.",
      "en": "Ar-Raqīb is the One who constantly observes His creatures, their deeds, their words and their thoughts, without ever being absent."
    },
    "reflection": {
      "fr": "La conscience qu’Allah observe (murāqaba) est un frein devant le péché et un réconfort dans la solitude.",
      "en": "Awareness that Allah is watching (murāqaba) is a brake before sin and a comfort in loneliness."
    },
    "practice": {
      "fr": "Se rappeler ce nom au moment de la tentation, surtout quand on est seul.",
      "en": "Remember this name at the moment of temptation, especially when you are alone."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:1",
      "surah": "An-Nisā’",
      "arabic": "إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا",
      "text": {
        "fr": "Allah vous observe parfaitement.",
        "en": "Indeed, Allah is ever, over you, an Observer."
      }
    }
  },
  {
    "id": 44,
    "arabic": "الْمُجِيبُ",
    "transliteration": "Al-Mujīb",
    "translation": {
      "fr": "Celui qui répond",
      "en": "The Responsive"
    },
    "explanation": {
      "fr": "Al-Mujīb est Celui qui répond aux invocations de ceux qui L’appellent et vient au secours de ceux qui sont dans la détresse.",
      "en": "Al-Mujīb is the One who answers the supplications of those who call upon Him and comes to the aid of those in distress."
    },
    "reflection": {
      "fr": "« Je suis proche : Je réponds à l’appel de celui qui M’invoque. » (2:186) La réponse peut être ce qu’on a demandé, un mal écarté ou une récompense gardée pour l’au-delà (Aḥmad).",
      "en": "“I am near: I answer the call of the one who calls upon Me.” (2:186) The answer may be what was asked for, a harm averted or a reward kept for the Hereafter (Aḥmad)."
    },
    "practice": {
      "fr": "Invoquer souvent, avec certitude, sans se décourager si la réponse tarde.",
      "en": "Make supplication often, with certainty, without losing heart if the answer is delayed."
    },
    "evidence": {
      "kind": "quran",
      "ref": "11:61",
      "surah": "Hūd",
      "arabic": "إِنَّ رَبِّي قَرِيبٌ مُجِيبٌ",
      "text": {
        "fr": "Mon Seigneur est proche et Il répond.",
        "en": "Indeed, my Lord is near and responsive."
      }
    }
  },
  {
    "id": 45,
    "arabic": "الْوَاسِعُ",
    "transliteration": "Al-Wāsi‘",
    "translation": {
      "fr": "Celui qui embrasse toute chose",
      "en": "The All-Encompassing"
    },
    "explanation": {
      "fr": "Al-Wāsi‘ est Celui dont la science, la miséricorde, la générosité et la puissance s’étendent à toute chose.",
      "en": "Al-Wāsi‘ is the One whose knowledge, mercy, generosity and power extend to everything."
    },
    "reflection": {
      "fr": "« Ma miséricorde embrasse toute chose. » (7:156) Aucun péché, aucune situation n’est plus vaste que ce qu’Allah embrasse.",
      "en": "“My mercy encompasses all things.” (7:156) No sin and no situation is wider than what Allah encompasses."
    },
    "practice": {
      "fr": "Avoir l’esprit large envers les gens et ne pas restreindre la miséricorde d’Allah dans ses jugements.",
      "en": "Be broad-minded with people and do not narrow Allah’s mercy in your judgements."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:115",
      "surah": "Al-Baqara",
      "arabic": "إِنَّ اللَّهَ وَاسِعٌ عَلِيمٌ",
      "text": {
        "fr": "Allah a une grâce immense, Il est Omniscient.",
        "en": "Indeed, Allah is all-Encompassing and Knowing."
      }
    }
  },
  {
    "id": 46,
    "arabic": "الْحَكِيمُ",
    "transliteration": "Al-Ḥakīm",
    "translation": {
      "fr": "Le Parfaitement Sage",
      "en": "The All-Wise"
    },
    "explanation": {
      "fr": "Al-Ḥakīm est Celui qui place chaque chose à sa juste place : Ses ordres, Ses interdits et Ses décrets ont tous une sagesse, que nous la comprenions ou non.",
      "en": "Al-Ḥakīm is the One who puts everything in its right place: His commands, His prohibitions and His decrees all have wisdom, whether we understand it or not."
    },
    "reflection": {
      "fr": "Ne pas comprendre la sagesse d’un événement ne veut pas dire qu’elle n’existe pas.",
      "en": "Not understanding the wisdom behind an event does not mean there is none."
    },
    "practice": {
      "fr": "Faire confiance à Allah tout en prenant les moyens licites et raisonnables.",
      "en": "Trust Allah while taking lawful and sensible means."
    },
    "evidence": {
      "kind": "quran",
      "ref": "6:18",
      "surah": "Al-An‘ām",
      "arabic": "وَهُوَ الْحَكِيمُ الْخَبِيرُ",
      "text": {
        "fr": "Et c’est Lui le Sage, le Parfaitement Informé.",
        "en": "And He is the Wise, the Acquainted."
      }
    }
  },
  {
    "id": 47,
    "arabic": "الْوَدُودُ",
    "transliteration": "Al-Wadūd",
    "translation": {
      "fr": "Le Très Aimant",
      "en": "The Most Loving"
    },
    "explanation": {
      "fr": "Al-Wadūd réunit deux sens : Celui qui aime Ses serviteurs croyants, et Celui qui est aimé par eux plus que tout.",
      "en": "Al-Wadūd joins two meanings: the One who loves His believing servants, and the One who is loved by them above all else."
    },
    "reflection": {
      "fr": "Allah aime ceux qui se repentent, ceux qui se purifient, ceux qui font le bien. Son amour se recherche par les actes qu’Il aime.",
      "en": "Allah loves those who repent, those who purify themselves, those who do good. His love is sought through the deeds He loves."
    },
    "practice": {
      "fr": "Rechercher l’amour d’Allah par les œuvres surérogatoires, et répandre l’affection entre les gens.",
      "en": "Seek Allah’s love through voluntary good deeds, and spread affection among people."
    },
    "evidence": {
      "kind": "quran",
      "ref": "85:14",
      "surah": "Al-Burūj",
      "arabic": "وَهُوَ الْغَفُورُ الْوَدُودُ",
      "text": {
        "fr": "Et c’est Lui le Pardonneur, le Très Aimant.",
        "en": "And He is the Forgiving, the Affectionate."
      }
    }
  },
  {
    "id": 48,
    "arabic": "الْمَجِيدُ",
    "transliteration": "Al-Majīd",
    "translation": {
      "fr": "Le Glorieux",
      "en": "The Most Glorious"
    },
    "explanation": {
      "fr": "Al-Majīd est Celui dont la gloire est immense, dont les qualités sont parfaites et dont les bienfaits sont abondants.",
      "en": "Al-Majīd is the One whose glory is immense, whose qualities are perfect and whose favours are abundant."
    },
    "reflection": {
      "fr": "Dans la prière sur le Prophète ﷺ, on conclut par « innaka Ḥamīdun Majīd » : Tu es digne de louange et glorieux.",
      "en": "In the prayer upon the Prophet ﷺ, one concludes with “innaka Ḥamīdun Majīd”: You are Praiseworthy and Glorious."
    },
    "practice": {
      "fr": "Glorifier Allah dans sa prière et dans son quotidien, et rechercher la noblesse de caractère.",
      "en": "Glorify Allah in your prayer and in your daily life, and seek nobility of character."
    },
    "evidence": {
      "kind": "quran",
      "ref": "11:73",
      "surah": "Hūd",
      "arabic": "إِنَّهُ حَمِيدٌ مَجِيدٌ",
      "text": {
        "fr": "Il est Digne de louange et Glorieux.",
        "en": "Indeed, He is Praiseworthy and Honourable."
      }
    }
  },
  {
    "id": 49,
    "arabic": "الْبَاعِثُ",
    "transliteration": "Al-Bā‘ith",
    "translation": {
      "fr": "Celui qui ressuscite",
      "en": "The Resurrector"
    },
    "explanation": {
      "fr": "Al-Bā‘ith est Celui qui ressuscitera les morts pour le Jugement, et qui envoie les messagers vers les peuples.",
      "en": "Al-Bā‘ith is the One who will raise the dead for the Judgement, and who sends messengers to the nations."
    },
    "reflection": {
      "fr": "Chaque réveil est un rappel : le Prophète ﷺ disait en se levant « Louange à Allah qui nous a rendu la vie après nous avoir fait mourir, et vers Lui est la résurrection » (al-Bukhârî).",
      "en": "Every awakening is a reminder: on waking, the Prophet ﷺ would say “Praise be to Allah who gave us life after causing us to die, and to Him is the resurrection” (al-Bukhârî)."
    },
    "practice": {
      "fr": "Vivre en se préparant à ce jour, et dire l’invocation du réveil.",
      "en": "Live preparing for that day, and say the supplication on waking."
    },
    "evidence": {
      "kind": "quran",
      "ref": "22:7",
      "surah": "Al-Ḥajj",
      "arabic": "وَأَنَّ اللَّهَ يَبْعَثُ مَنْ فِي الْقُبُورِ",
      "text": {
        "fr": "Et Allah ressuscitera ceux qui sont dans les tombes.",
        "en": "And Allah will resurrect those in the graves."
      }
    }
  },
  {
    "id": 50,
    "arabic": "الشَّهِيدُ",
    "transliteration": "Ash-Shahīd",
    "translation": {
      "fr": "Le Témoin de toute chose",
      "en": "The Witness"
    },
    "explanation": {
      "fr": "Ash-Shahīd est Celui qui est présent et témoin de toute chose : rien ne se passe sans qu’Il le voie et le sache.",
      "en": "Ash-Shahīd is the One who is present and witness to everything: nothing happens without Him seeing and knowing it."
    },
    "reflection": {
      "fr": "Quand personne ne croit notre version, Allah est témoin de la vérité.",
      "en": "When no one believes our side of the story, Allah is witness to the truth."
    },
    "practice": {
      "fr": "Témoigner avec justice, même contre soi-même (4:135).",
      "en": "Bear witness with justice, even against yourself (4:135)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:33",
      "surah": "An-Nisā’",
      "arabic": "إِنَّ اللَّهَ كَانَ عَلَىٰ كُلِّ شَيْءٍ شَهِيدًا",
      "text": {
        "fr": "Allah est témoin de toute chose.",
        "en": "Indeed, Allah is ever, over all things, a Witness."
      }
    }
  },
  {
    "id": 51,
    "arabic": "الْحَقُّ",
    "transliteration": "Al-Ḥaqq",
    "translation": {
      "fr": "La Vérité",
      "en": "The Truth"
    },
    "explanation": {
      "fr": "Al-Ḥaqq est Celui dont l’existence est certaine et nécessaire, dont la parole, la promesse et le jugement sont vrais. Tout ce qu’on adore en dehors de Lui est faux.",
      "en": "Al-Ḥaqq is the One whose existence is certain and necessary, whose word, promise and judgement are true. Everything worshipped besides Him is false."
    },
    "reflection": {
      "fr": "Dans sa prière de la nuit, le Prophète ﷺ disait : « Tu es la Vérité, Ta promesse est vérité, Ta rencontre est vérité… » (al-Bukhârî et Muslim)",
      "en": "In his night prayer, the Prophet ﷺ would say: “You are the Truth, Your promise is true, the meeting with You is true…” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Suivre la vérité même quand elle coûte, et ne pas dire ce qu’on sait faux.",
      "en": "Follow the truth even when it costs, and do not say what you know to be false."
    },
    "evidence": {
      "kind": "quran",
      "ref": "22:6",
      "surah": "Al-Ḥajj",
      "arabic": "ذَٰلِكَ بِأَنَّ اللَّهَ هُوَ الْحَقُّ",
      "text": {
        "fr": "Il en est ainsi parce qu’Allah est la Vérité.",
        "en": "That is because Allah is the Truth."
      }
    }
  },
  {
    "id": 52,
    "arabic": "الْوَكِيلُ",
    "transliteration": "Al-Wakīl",
    "translation": {
      "fr": "Le Garant, Celui à qui l’on se confie",
      "en": "The Trustee"
    },
    "explanation": {
      "fr": "Al-Wakīl est Celui qui prend en charge les affaires de Ses créatures et à qui l’on peut tout confier. Il suffit à celui qui s’en remet à Lui.",
      "en": "Al-Wakīl is the One who takes charge of the affairs of His creatures and to whom everything can be entrusted. He is enough for whoever relies on Him."
    },
    "reflection": {
      "fr": "« Ḥasbunā Allāhu wa ni‘ma l-Wakīl » : c’est ce qu’a dit Ibrāhīm lorsqu’il fut jeté dans le feu (al-Bukhârî).",
      "en": "“Ḥasbunā Allāhu wa ni‘ma l-Wakīl”: this is what Ibrāhīm said when he was thrown into the fire (al-Bukhârî)."
    },
    "practice": {
      "fr": "Prendre les moyens, puis confier le résultat à Allah sans angoisse.",
      "en": "Take the means, then entrust the outcome to Allah without anxiety."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:173",
      "surah": "Āl ‘Imrān",
      "arabic": "وَقَالُوا حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
      "text": {
        "fr": "Et ils dirent : « Allah nous suffit, et quel excellent Garant ! »",
        "en": "And they said: “Sufficient for us is Allah, and He is the best Disposer of affairs.”"
      }
    }
  },
  {
    "id": 53,
    "arabic": "الْقَوِيُّ",
    "transliteration": "Al-Qawiyy",
    "translation": {
      "fr": "Le Très Fort",
      "en": "The Most Strong"
    },
    "explanation": {
      "fr": "Al-Qawiyy est Celui dont la force est parfaite : rien ne L’épuise, rien ne Lui est difficile.",
      "en": "Al-Qawiyy is the One whose strength is perfect: nothing tires Him and nothing is difficult for Him."
    },
    "reflection": {
      "fr": "« Lā ḥawla wa lā quwwata illā billāh » : il n’y a de force que par Allah. Le Prophète ﷺ l’a appelée un trésor du Paradis (al-Bukhârî et Muslim).",
      "en": "“Lā ḥawla wa lā quwwata illā billāh”: there is no strength except through Allah. The Prophet ﷺ called it a treasure of Paradise (al-Bukhârî and Muslim)."
    },
    "practice": {
      "fr": "Chercher sa force en Allah, et utiliser la sienne pour protéger plutôt que pour dominer.",
      "en": "Seek your strength in Allah, and use your own to protect rather than to dominate."
    },
    "evidence": {
      "kind": "quran",
      "ref": "22:74",
      "surah": "Al-Ḥajj",
      "arabic": "إِنَّ اللَّهَ لَقَوِيٌّ عَزِيزٌ",
      "text": {
        "fr": "Allah est Fort et Tout-Puissant.",
        "en": "Indeed, Allah is Powerful and Exalted in Might."
      }
    }
  },
  {
    "id": 54,
    "arabic": "الْمَتِينُ",
    "transliteration": "Al-Matīn",
    "translation": {
      "fr": "L’Inébranlable",
      "en": "The Firm"
    },
    "explanation": {
      "fr": "Al-Matīn est Celui dont la force est si grande et si ferme qu’elle ne faiblit jamais et ne peut être ébranlée.",
      "en": "Al-Matīn is the One whose strength is so great and so firm that it never weakens and cannot be shaken."
    },
    "reflection": {
      "fr": "S’attacher à Allah, c’est s’attacher à ce qui ne cède jamais.",
      "en": "Holding on to Allah is holding on to what never gives way."
    },
    "practice": {
      "fr": "Rester ferme dans la foi et constant dans ses bonnes habitudes, même petites.",
      "en": "Stay firm in faith and consistent in your good habits, even small ones."
    },
    "evidence": {
      "kind": "quran",
      "ref": "51:58",
      "surah": "Adh-Dhāriyāt",
      "arabic": "ذُو الْقُوَّةِ الْمَتِينُ",
      "text": {
        "fr": "… le Détenteur de la force, l’Inébranlable.",
        "en": "… the Possessor of strength, the Firm."
      }
    }
  },
  {
    "id": 55,
    "arabic": "الْوَلِيُّ",
    "transliteration": "Al-Waliyy",
    "translation": {
      "fr": "Le Protecteur proche",
      "en": "The Protecting Friend"
    },
    "explanation": {
      "fr": "Al-Waliyy est Celui qui prend soin des croyants, les aime, les soutient et les guide. Sa walāya particulière est réservée à ceux qui croient et Le craignent.",
      "en": "Al-Waliyy is the One who takes care of the believers, loves them, supports them and guides them. His special friendship is for those who believe and fear Him."
    },
    "reflection": {
      "fr": "Ce verset décrit ce que fait cette protection : faire sortir des ténèbres vers la lumière.",
      "en": "This verse describes what this protection does: bringing out of darkness into light."
    },
    "practice": {
      "fr": "Prendre Allah pour allié en faisant ce qu’Il aime, et choisir ses amis parmi les gens de bien.",
      "en": "Take Allah as your ally by doing what He loves, and choose your friends among good people."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:257",
      "surah": "Al-Baqara",
      "arabic": "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ",
      "text": {
        "fr": "Allah est le Protecteur de ceux qui ont cru : Il les fait sortir des ténèbres vers la lumière.",
        "en": "Allah is the ally of those who believe. He brings them out of darkness into the light."
      }
    }
  },
  {
    "id": 56,
    "arabic": "الْحَمِيدُ",
    "transliteration": "Al-Ḥamīd",
    "translation": {
      "fr": "Le Digne de louange",
      "en": "The Praiseworthy"
    },
    "explanation": {
      "fr": "Al-Ḥamīd est Celui qui est loué pour Ses noms, Ses attributs et Ses actes, dans l’aisance comme dans l’épreuve. Toute louange Lui revient.",
      "en": "Al-Ḥamīd is the One who is praised for His names, His attributes and His actions, in ease as in hardship. All praise is His."
    },
    "reflection": {
      "fr": "« Al-ḥamdu lillāh » emplit la balance (Muslim). Le Prophète ﷺ disait « Al-ḥamdu lillāh ‘alā kulli ḥāl » face à ce qui lui déplaisait (Ibn Mâjah).",
      "en": "“Al-ḥamdu lillāh” fills the scale (Muslim). The Prophet ﷺ would say “Al-ḥamdu lillāh ‘alā kulli ḥāl” when facing something he disliked (Ibn Mâjah)."
    },
    "practice": {
      "fr": "Louer Allah en toute situation, et pas seulement quand tout va bien.",
      "en": "Praise Allah in every situation, not only when all is well."
    },
    "evidence": {
      "kind": "quran",
      "ref": "14:1",
      "surah": "Ibrāhīm",
      "arabic": "إِلَىٰ صِرَاطِ الْعَزِيزِ الْحَمِيدِ",
      "text": {
        "fr": "… vers le chemin du Tout-Puissant, du Digne de louange.",
        "en": "… to the path of the Exalted in Might, the Praiseworthy."
      }
    }
  },
  {
    "id": 57,
    "arabic": "الْمُحْصِي",
    "transliteration": "Al-Muḥṣī",
    "translation": {
      "fr": "Celui qui dénombre toute chose",
      "en": "The Accounter"
    },
    "explanation": {
      "fr": "Al-Muḥṣī est Celui qui connaît le nombre exact de toute chose : les grains de sable, les gouttes de pluie, les souffles et les actes de chacun.",
      "en": "Al-Muḥṣī is the One who knows the exact number of everything: grains of sand, drops of rain, every breath and every deed."
    },
    "reflection": {
      "fr": "Rien n’est perdu : ni une bonne action discrète, ni une injustice subie.",
      "en": "Nothing is lost: neither a discreet good deed nor an injustice suffered."
    },
    "practice": {
      "fr": "Faire le compte de ses journées avant de dormir, pour remercier et pour corriger.",
      "en": "Review your day before sleeping, to give thanks and to correct yourself."
    },
    "evidence": {
      "kind": "quran",
      "ref": "72:28",
      "surah": "Al-Jinn",
      "arabic": "وَأَحْصَىٰ كُلَّ شَيْءٍ عَدَدًا",
      "text": {
        "fr": "… et Il a dénombré toute chose avec exactitude.",
        "en": "… and He has enumerated all things in number."
      }
    }
  },
  {
    "id": 58,
    "arabic": "الْمُبْدِئُ",
    "transliteration": "Al-Mubdi’",
    "translation": {
      "fr": "Celui qui commence la création",
      "en": "The Originator"
    },
    "explanation": {
      "fr": "Al-Mubdi’ est Celui qui a commencé la création une première fois, sans modèle. Ce nom va avec Al-Mu‘īd : Celui qui commence est Celui qui ramènera.",
      "en": "Al-Mubdi’ is the One who began creation the first time, without a model. This name goes with Al-Mu‘īd: the One who began is the One who will bring back."
    },
    "reflection": {
      "fr": "Celui qui a créé la première fois n’aura aucune difficulté à recréer (30:27).",
      "en": "The One who created the first time will have no difficulty creating again (30:27)."
    },
    "practice": {
      "fr": "Penser à son origine pour rester humble, et à son retour pour bien agir.",
      "en": "Think of your origin to stay humble, and of your return to act well."
    },
    "evidence": {
      "kind": "quran",
      "ref": "85:13",
      "surah": "Al-Burūj",
      "arabic": "إِنَّهُ هُوَ يُبْدِئُ وَيُعِيدُ",
      "text": {
        "fr": "C’est Lui qui commence la création et qui la recommence.",
        "en": "Indeed, it is He who originates and repeats."
      }
    }
  },
  {
    "id": 59,
    "arabic": "الْمُعِيدُ",
    "transliteration": "Al-Mu‘īd",
    "translation": {
      "fr": "Celui qui ramène à la vie",
      "en": "The Restorer"
    },
    "explanation": {
      "fr": "Al-Mu‘īd est Celui qui ramènera les créatures à la vie après leur mort, pour le Jugement.",
      "en": "Al-Mu‘īd is the One who will bring creatures back to life after their death, for the Judgement."
    },
    "reflection": {
      "fr": "La mort n’est pas une fin mais un passage. Ce nom donne son sens à chaque acte d’ici-bas.",
      "en": "Death is not an end but a passage. This name gives meaning to every act in this world."
    },
    "practice": {
      "fr": "Agir aujourd’hui en pensant au jour du retour.",
      "en": "Act today with the day of return in mind."
    },
    "evidence": {
      "kind": "quran",
      "ref": "85:13",
      "surah": "Al-Burūj",
      "arabic": "إِنَّهُ هُوَ يُبْدِئُ وَيُعِيدُ",
      "text": {
        "fr": "C’est Lui qui commence la création et qui la recommence.",
        "en": "Indeed, it is He who originates and repeats."
      }
    }
  },
  {
    "id": 60,
    "arabic": "الْمُحْيِي",
    "transliteration": "Al-Muḥyī",
    "translation": {
      "fr": "Celui qui donne la vie",
      "en": "The Giver of Life"
    },
    "explanation": {
      "fr": "Al-Muḥyī est Celui qui donne la vie aux corps, à la terre morte par la pluie, et aux cœurs par la foi.",
      "en": "Al-Muḥyī is the One who gives life to bodies, to the dead earth through rain, and to hearts through faith."
    },
    "reflection": {
      "fr": "Un cœur endurci peut revivre, comme une terre sèche après la pluie (57:17).",
      "en": "A hardened heart can come back to life, like dry earth after rain (57:17)."
    },
    "practice": {
      "fr": "Faire revivre son cœur par le Coran et le rappel, et préserver la vie sous toutes ses formes.",
      "en": "Revive your heart through the Quran and remembrance, and protect life in all its forms."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:2",
      "surah": "Al-Ḥadīd",
      "arabic": "يُحْيِي وَيُمِيتُ ۖ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      "text": {
        "fr": "Il donne la vie et la mort, et Il est capable de toute chose.",
        "en": "He gives life and causes death, and He is over all things competent."
      }
    }
  },
  {
    "id": 61,
    "arabic": "الْمُمِيتُ",
    "transliteration": "Al-Mumīt",
    "translation": {
      "fr": "Celui qui donne la mort",
      "en": "The Bringer of Death"
    },
    "explanation": {
      "fr": "Al-Mumīt est Celui qui fait mourir chaque être au moment qu’Il a fixé, ni avant ni après. La mort est un décret d’Allah, pas un accident.",
      "en": "Al-Mumīt is the One who causes every being to die at the time He has set, neither before nor after. Death is Allah’s decree, not an accident."
    },
    "reflection": {
      "fr": "La vie et la mort sont créées pour éprouver : « afin de voir qui d’entre vous agit le mieux ».",
      "en": "Life and death are created as a test: “to see which of you is best in deed”."
    },
    "practice": {
      "fr": "Se souvenir souvent de la mort, comme le recommandait le Prophète ﷺ, pour bien vivre et non pour avoir peur.",
      "en": "Remember death often, as the Prophet ﷺ advised, in order to live well, not to be afraid."
    },
    "evidence": {
      "kind": "quran",
      "ref": "67:2",
      "surah": "Al-Mulk",
      "arabic": "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا",
      "text": {
        "fr": "Celui qui a créé la mort et la vie afin de vous éprouver : qui de vous agit le mieux.",
        "en": "He who created death and life to test you as to which of you is best in deed."
      }
    }
  },
  {
    "id": 62,
    "arabic": "الْحَيُّ",
    "transliteration": "Al-Ḥayy",
    "translation": {
      "fr": "Le Vivant",
      "en": "The Ever-Living"
    },
    "explanation": {
      "fr": "Al-Ḥayy est Celui dont la vie est parfaite : sans début, sans fin, sans sommeil ni faiblesse. Toute autre vie vient de Lui.",
      "en": "Al-Ḥayy is the One whose life is perfect: without beginning, without end, without sleep or weakness. All other life comes from Him."
    },
    "reflection": {
      "fr": "S’appuyer sur quelqu’un qui mourra, c’est s’appuyer sur ce qui partira. S’appuyer sur Al-Ḥayy, c’est s’appuyer sur ce qui demeure.",
      "en": "Leaning on someone who will die is leaning on what will leave. Leaning on Al-Ḥayy is leaning on what remains."
    },
    "practice": {
      "fr": "Dans la détresse, dire « Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth » (at-Tirmidhî, jugé bon par al-Albânî).",
      "en": "In distress, say “Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth” (at-Tirmidhî, graded good by al-Albânî)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "25:58",
      "surah": "Al-Furqān",
      "arabic": "وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ",
      "text": {
        "fr": "Et place ta confiance dans le Vivant qui ne meurt jamais.",
        "en": "And rely upon the Ever-Living who does not die."
      }
    }
  },
  {
    "id": 63,
    "arabic": "الْقَيُّومُ",
    "transliteration": "Al-Qayyūm",
    "translation": {
      "fr": "Celui qui subsiste par Lui-même",
      "en": "The Self-Subsisting Sustainer"
    },
    "explanation": {
      "fr": "Al-Qayyūm est Celui qui existe par Lui-même sans avoir besoin de rien, et par qui toute chose existe et tient. Sans Lui, rien ne subsisterait un instant.",
      "en": "Al-Qayyūm is the One who exists by Himself without needing anything, and by whom everything exists and holds together. Without Him, nothing would last a moment."
    },
    "reflection": {
      "fr": "Ce nom ouvre Āyat al-Kursī, le plus grand verset du Coran (Muslim). Ni somnolence ni sommeil ne Le saisissent.",
      "en": "This name opens Āyat al-Kursī, the greatest verse of the Quran (Muslim). Neither drowsiness nor sleep overtakes Him."
    },
    "practice": {
      "fr": "Réciter Āyat al-Kursī après chaque prière et avant de dormir.",
      "en": "Recite Āyat al-Kursī after each prayer and before sleeping."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:255",
      "surah": "Al-Baqara",
      "arabic": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
      "text": {
        "fr": "Allah ! Nulle divinité en dehors de Lui, le Vivant, Celui qui subsiste par Lui-même.",
        "en": "Allah, there is no god except Him, the Ever-Living, the Sustainer of existence."
      }
    }
  },
  {
    "id": 64,
    "arabic": "الْوَاجِدُ",
    "transliteration": "Al-Wājid",
    "translation": {
      "fr": "Celui qui ne manque de rien",
      "en": "The Finder, the Self-Sufficient"
    },
    "explanation": {
      "fr": "Al-Wājid est Celui qui trouve tout ce qu’Il veut et à qui rien ne manque. Rien ne Lui échappe et rien ne Lui fait défaut.",
      "en": "Al-Wājid is the One who finds whatever He wills and lacks nothing. Nothing escapes Him and nothing is missing to Him."
    },
    "reflection": {
      "fr": "Nous manquons de tout, Lui de rien : c’est pour cela qu’on se tourne vers Lui.",
      "en": "We lack everything and He lacks nothing: that is why we turn to Him."
    },
    "practice": {
      "fr": "Reconnaître son besoin d’Allah dans chaque invocation.",
      "en": "Acknowledge your need of Allah in every supplication."
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Ce nom figure dans la liste rapportée par at-Tirmidhî (3507). Son sens est confirmé par le Coran : « Vous êtes les pauvres ayant besoin d’Allah, et Allah est Celui qui se suffit à Lui-même. » (35:15)",
        "en": "This name appears in the list reported by at-Tirmidhî (3507). Its meaning is confirmed by the Quran: “You are the ones in need of Allah, and Allah is the Free of need.” (35:15)"
      },
      "source": {
        "fr": "at-Tirmidhî",
        "en": "at-Tirmidhî"
      }
    }
  },
  {
    "id": 65,
    "arabic": "الْمَاجِدُ",
    "transliteration": "Al-Mājid",
    "translation": {
      "fr": "L’Illustre",
      "en": "The Illustrious"
    },
    "explanation": {
      "fr": "Al-Mājid est Celui dont la gloire et la générosité sont immenses. Il est de la même racine qu’Al-Majīd et en partage le sens.",
      "en": "Al-Mājid is the One whose glory and generosity are immense. It shares its root and meaning with Al-Majīd."
    },
    "reflection": {
      "fr": "La gloire d’Allah se voit dans l’abondance de Ses bienfaits sur ceux qui ne les méritent pas.",
      "en": "Allah’s glory is seen in the abundance of His favours upon those who do not deserve them."
    },
    "practice": {
      "fr": "Reconnaître les bienfaits reçus et les mentionner pour remercier, sans vantardise.",
      "en": "Acknowledge the favours you have received and mention them to give thanks, without boasting."
    },
    "evidence": {
      "kind": "quran",
      "ref": "85:15",
      "surah": "Al-Burūj",
      "arabic": "ذُو الْعَرْشِ الْمَجِيدُ",
      "text": {
        "fr": "Le Maître du Trône, le Glorieux.",
        "en": "Owner of the Throne, the Glorious."
      }
    }
  },
  {
    "id": 66,
    "arabic": "الْوَاحِدُ",
    "transliteration": "Al-Wāḥid",
    "translation": {
      "fr": "L’Unique",
      "en": "The One"
    },
    "explanation": {
      "fr": "Al-Wāḥid est Celui qui est unique dans Son être, Ses attributs et Ses actes : Il n’a ni associé, ni égal, ni semblable.",
      "en": "Al-Wāḥid is the One who is unique in His being, His attributes and His actions: He has no partner, no equal and no likeness."
    },
    "reflection": {
      "fr": "C’est le cœur du tawḥīd : un seul Seigneur, donc une seule direction pour le cœur.",
      "en": "This is the heart of tawḥīd: one Lord, and therefore one direction for the heart."
    },
    "practice": {
      "fr": "Vouer son adoration à Allah seul et purifier ses intentions de tout désir d’être vu.",
      "en": "Devote your worship to Allah alone and purify your intentions of any desire to be seen."
    },
    "evidence": {
      "kind": "quran",
      "ref": "13:16",
      "surah": "Ar-Ra‘d",
      "arabic": "قُلِ اللَّهُ خَالِقُ كُلِّ شَيْءٍ وَهُوَ الْوَاحِدُ الْقَهَّارُ",
      "text": {
        "fr": "Dis : « Allah est le Créateur de toute chose, et c’est Lui l’Unique, le Dominateur suprême. »",
        "en": "Say: “Allah is the Creator of all things, and He is the One, the Prevailing.”"
      }
    }
  },
  {
    "id": 67,
    "arabic": "الْأَحَدُ",
    "transliteration": "Al-Aḥad",
    "translation": {
      "fr": "L’Un, L’Absolument Unique",
      "en": "The Unique"
    },
    "explanation": {
      "fr": "Al-Aḥad est Celui qui est absolument un, indivisible, et à qui rien n’est comparable. Ce nom ouvre la sourate al-Ikhlāṣ.",
      "en": "Al-Aḥad is the One who is absolutely one, indivisible, and to whom nothing is comparable. This name opens Sūrat al-Ikhlāṣ."
    },
    "reflection": {
      "fr": "Sous la torture, Bilāl répétait « Aḥad, Aḥad » : l’unicité d’Allah donne une force que rien ne brise.",
      "en": "Under torture, Bilāl kept repeating “Aḥad, Aḥad”: the oneness of Allah gives a strength that nothing breaks."
    },
    "practice": {
      "fr": "Réciter souvent la sourate al-Ikhlāṣ, qui équivaut au tiers du Coran (al-Bukhârî).",
      "en": "Recite Sūrat al-Ikhlāṣ often; it equals a third of the Quran (al-Bukhârî)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "112:1",
      "surah": "Al-Ikhlāṣ",
      "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ",
      "text": {
        "fr": "Dis : « Il est Allah, Unique. »",
        "en": "Say: “He is Allah, the One.”"
      }
    }
  },
  {
    "id": 68,
    "arabic": "الصَّمَدُ",
    "transliteration": "Aṣ-Ṣamad",
    "translation": {
      "fr": "Celui vers qui tous se tournent",
      "en": "The Eternal Refuge"
    },
    "explanation": {
      "fr": "Aṣ-Ṣamad est le Seigneur parfait vers qui toutes les créatures se tournent dans leurs besoins, alors que Lui n’a besoin de personne.",
      "en": "Aṣ-Ṣamad is the perfect Lord to whom all creatures turn in their needs, while He needs no one."
    },
    "reflection": {
      "fr": "Tout le monde a besoin de quelqu’un. Celui qui se tourne vers Aṣ-Ṣamad a frappé à la seule porte qui ne se ferme pas.",
      "en": "Everyone needs someone. Whoever turns to Aṣ-Ṣamad has knocked on the only door that never closes."
    },
    "practice": {
      "fr": "Présenter ses besoins à Allah avant de les présenter aux gens.",
      "en": "Bring your needs to Allah before bringing them to people."
    },
    "evidence": {
      "kind": "quran",
      "ref": "112:2",
      "surah": "Al-Ikhlāṣ",
      "arabic": "اللَّهُ الصَّمَدُ",
      "text": {
        "fr": "Allah, Celui vers qui tous se tournent.",
        "en": "Allah, the Eternal Refuge."
      }
    }
  },
  {
    "id": 69,
    "arabic": "الْقَادِرُ",
    "transliteration": "Al-Qādir",
    "translation": {
      "fr": "Le Tout-Capable",
      "en": "The All-Capable"
    },
    "explanation": {
      "fr": "Al-Qādir est Celui qui a le pouvoir de faire tout ce qu’Il veut, sans difficulté ni aide.",
      "en": "Al-Qādir is the One who has the power to do whatever He wills, without difficulty or help."
    },
    "reflection": {
      "fr": "Ce qui nous paraît impossible ne l’est pas pour Allah. Il suffit qu’Il dise « Sois » pour que la chose soit.",
      "en": "What seems impossible to us is not so for Allah. He only has to say “Be” and it is."
    },
    "practice": {
      "fr": "Ne jamais désespérer d’une situation, et utiliser son propre pouvoir avec justice.",
      "en": "Never despair of a situation, and use your own power with justice."
    },
    "evidence": {
      "kind": "quran",
      "ref": "75:40",
      "surah": "Al-Qiyāma",
      "arabic": "أَلَيْسَ ذَٰلِكَ بِقَادِرٍ عَلَىٰ أَنْ يُحْيِيَ الْمَوْتَىٰ",
      "text": {
        "fr": "Celui-là n’est-Il pas capable de redonner vie aux morts ?",
        "en": "Is not that Creator able to give life to the dead?"
      }
    }
  },
  {
    "id": 70,
    "arabic": "الْمُقْتَدِرُ",
    "transliteration": "Al-Muqtadir",
    "translation": {
      "fr": "Le Parfaitement Puissant",
      "en": "The Omnipotent"
    },
    "explanation": {
      "fr": "Al-Muqtadir est Celui dont le pouvoir est total et s’exerce pleinement sur toute chose. C’est une forme plus intense d’Al-Qādir.",
      "en": "Al-Muqtadir is the One whose power is total and fully exercised over everything. It is a more intense form of Al-Qādir."
    },
    "reflection": {
      "fr": "Ce verset décrit la récompense des pieux : être auprès du Souverain tout-puissant.",
      "en": "This verse describes the reward of the righteous: to be near the All-Powerful Sovereign."
    },
    "practice": {
      "fr": "Craindre Allah plus que toute autre puissance, et ne pas abuser de celle qu’on a.",
      "en": "Fear Allah more than any other power, and do not abuse the power you have."
    },
    "evidence": {
      "kind": "quran",
      "ref": "54:55",
      "surah": "Al-Qamar",
      "arabic": "فِي مَقْعَدِ صِدْقٍ عِنْدَ مَلِيكٍ مُقْتَدِرٍ",
      "text": {
        "fr": "… dans une demeure de vérité, auprès d’un Souverain tout-puissant.",
        "en": "… in a seat of honour near a Sovereign, Perfect in Ability."
      }
    }
  },
  {
    "id": 71,
    "arabic": "الْمُقَدِّمُ",
    "transliteration": "Al-Muqaddim",
    "translation": {
      "fr": "Celui qui fait avancer",
      "en": "The Expediter"
    },
    "explanation": {
      "fr": "Al-Muqaddim est Celui qui fait avancer ce qu’Il veut et qui Il veut : dans le temps, en rang ou en mérite. Ce nom va avec Al-Mu’akhkhir.",
      "en": "Al-Muqaddim is the One who brings forward what He wills and whom He wills: in time, in rank or in merit. This name goes with Al-Mu’akhkhir."
    },
    "reflection": {
      "fr": "Ce qui arrive plus tôt qu’on ne l’espérait, ou plus tard, arrive au moment qu’Allah a choisi.",
      "en": "What comes earlier than hoped, or later, comes at the moment Allah has chosen."
    },
    "practice": {
      "fr": "Avancer vers le bien sans attendre, et accepter le moment choisi par Allah.",
      "en": "Hasten towards good without waiting, and accept the moment Allah has chosen."
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Dans son invocation, le Prophète ﷺ disait : « Tu es Celui qui fait avancer et Tu es Celui qui retarde, nulle divinité en dehors de Toi. »",
        "en": "In his supplication, the Prophet ﷺ would say: “You are the One who brings forward and You are the One who delays; there is no god but You.”"
      },
      "source": {
        "fr": "al-Bukhârî et Muslim",
        "en": "al-Bukhârî and Muslim"
      }
    }
  },
  {
    "id": 72,
    "arabic": "الْمُؤَخِّرُ",
    "transliteration": "Al-Mu’akhkhir",
    "translation": {
      "fr": "Celui qui retarde",
      "en": "The Delayer"
    },
    "explanation": {
      "fr": "Al-Mu’akhkhir est Celui qui retarde ce qu’Il veut et qui Il veut, selon Sa sagesse. Il retarde aussi le châtiment pour laisser le temps du repentir.",
      "en": "Al-Mu’akhkhir is the One who delays what He wills and whom He wills, according to His wisdom. He also delays punishment to leave time for repentance."
    },
    "reflection": {
      "fr": "Un retard n’est pas un refus. Ce qu’Allah retarde peut être meilleur plus tard.",
      "en": "A delay is not a refusal. What Allah delays may be better later."
    },
    "practice": {
      "fr": "Patienter quand une chose tarde, sans remettre à plus tard le repentir.",
      "en": "Be patient when something is delayed, without delaying your own repentance."
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Dans son invocation, le Prophète ﷺ disait : « Tu es Celui qui fait avancer et Tu es Celui qui retarde, nulle divinité en dehors de Toi. »",
        "en": "In his supplication, the Prophet ﷺ would say: “You are the One who brings forward and You are the One who delays; there is no god but You.”"
      },
      "source": {
        "fr": "al-Bukhârî et Muslim",
        "en": "al-Bukhârî and Muslim"
      }
    }
  },
  {
    "id": 73,
    "arabic": "الْأَوَّلُ",
    "transliteration": "Al-Awwal",
    "translation": {
      "fr": "Le Premier",
      "en": "The First"
    },
    "explanation": {
      "fr": "Al-Awwal est Celui qui existe avant toute chose : rien n’est avant Lui. Le Prophète ﷺ disait : « Tu es le Premier, rien n’est avant Toi. » (Muslim)",
      "en": "Al-Awwal is the One who exists before everything: nothing is before Him. The Prophet ﷺ said: “You are the First, nothing is before You.” (Muslim)"
    },
    "reflection": {
      "fr": "Tout ce que l’on a a commencé un jour et vient de Lui. Cela enlève l’orgueil de ce qu’on possède.",
      "en": "Everything we have began one day and comes from Him. This removes pride in what we own."
    },
    "practice": {
      "fr": "Mettre Allah en premier dans ses priorités, à commencer par la prière à l’heure.",
      "en": "Put Allah first in your priorities, starting with praying on time."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:3",
      "surah": "Al-Ḥadīd",
      "arabic": "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché.",
        "en": "He is the First and the Last, the Ascendant and the Intimate."
      }
    }
  },
  {
    "id": 74,
    "arabic": "الْآخِرُ",
    "transliteration": "Al-Ākhir",
    "translation": {
      "fr": "Le Dernier",
      "en": "The Last"
    },
    "explanation": {
      "fr": "Al-Ākhir est Celui qui demeure après toute chose : rien n’est après Lui. Tout disparaîtra, Lui seul restera.",
      "en": "Al-Ākhir is the One who remains after everything: nothing is after Him. Everything will vanish; He alone will remain."
    },
    "reflection": {
      "fr": "Tout ce à quoi on s’attache prendra fin. Ce qui est fait pour Allah, Lui, demeure.",
      "en": "Everything we cling to will end. What is done for Allah remains."
    },
    "practice": {
      "fr": "Faire ses actes pour ce qui dure, et finir ses journées en se tournant vers Allah.",
      "en": "Do your deeds for what lasts, and end your days by turning to Allah."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:3",
      "surah": "Al-Ḥadīd",
      "arabic": "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché.",
        "en": "He is the First and the Last, the Ascendant and the Intimate."
      }
    }
  },
  {
    "id": 75,
    "arabic": "الظَّاهِرُ",
    "transliteration": "Aẓ-Ẓāhir",
    "translation": {
      "fr": "L’Apparent, Le Très-Haut",
      "en": "The Manifest"
    },
    "explanation": {
      "fr": "Aẓ-Ẓāhir est Celui qui est au-dessus de toute chose : rien n’est au-dessus de Lui (Muslim). Ses signes sont aussi manifestes partout dans la création.",
      "en": "Aẓ-Ẓāhir is the One who is above everything: nothing is above Him (Muslim). His signs are also manifest throughout creation."
    },
    "reflection": {
      "fr": "Les signes d’Allah sont visibles à celui qui prend le temps de regarder.",
      "en": "Allah’s signs are visible to whoever takes the time to look."
    },
    "practice": {
      "fr": "Prendre chaque jour un moment pour réfléchir à un signe de la création.",
      "en": "Take a moment each day to reflect on a sign in creation."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:3",
      "surah": "Al-Ḥadīd",
      "arabic": "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché.",
        "en": "He is the First and the Last, the Ascendant and the Intimate."
      }
    }
  },
  {
    "id": 76,
    "arabic": "الْبَاطِنُ",
    "transliteration": "Al-Bāṭin",
    "translation": {
      "fr": "Le Caché, Le Très Proche",
      "en": "The Hidden"
    },
    "explanation": {
      "fr": "Al-Bāṭin est Celui dont rien n’est plus proche : rien n’est en deçà de Lui (Muslim). Il connaît l’intérieur des choses, et Son essence échappe aux regards dans ce monde.",
      "en": "Al-Bāṭin is the One than whom nothing is closer: nothing is beneath Him (Muslim). He knows the inner reality of things, and His essence is beyond sight in this world."
    },
    "reflection": {
      "fr": "Allah connaît ce qu’on cache aux autres et parfois à soi-même.",
      "en": "Allah knows what we hide from others and sometimes from ourselves."
    },
    "practice": {
      "fr": "Soigner son intérieur autant que son apparence.",
      "en": "Take care of your inner self as much as your appearance."
    },
    "evidence": {
      "kind": "quran",
      "ref": "57:3",
      "surah": "Al-Ḥadīd",
      "arabic": "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché, et Il connaît toute chose.",
        "en": "He is the First and the Last, the Ascendant and the Intimate, and He is Knowing of all things."
      }
    }
  },
  {
    "id": 77,
    "arabic": "الْوَالِي",
    "transliteration": "Al-Wālī",
    "translation": {
      "fr": "Le Gouverneur",
      "en": "The Governor"
    },
    "explanation": {
      "fr": "Al-Wālī est Celui qui gouverne toute chose et en dispose seul : rien ne se fait dans l’univers sans Son administration.",
      "en": "Al-Wālī is the One who governs everything and disposes of it alone: nothing happens in the universe without His management."
    },
    "reflection": {
      "fr": "Quand Allah veut une chose pour un peuple, nul ne peut la repousser, et ils n’ont pas d’autre protecteur que Lui.",
      "en": "When Allah wills something for a people, no one can repel it, and they have no protector besides Him."
    },
    "practice": {
      "fr": "Changer ce qui est en soi pour qu’Allah change la situation (13:11).",
      "en": "Change what is within yourself so that Allah changes the situation (13:11)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "13:11",
      "surah": "Ar-Ra‘d",
      "arabic": "وَمَا لَهُمْ مِنْ دُونِهِ مِنْ وَالٍ",
      "text": {
        "fr": "… et ils n’ont, en dehors de Lui, aucun protecteur.",
        "en": "… and there is not for them besides Him any patron."
      }
    }
  },
  {
    "id": 78,
    "arabic": "الْمُتَعَالِي",
    "transliteration": "Al-Muta‘ālī",
    "translation": {
      "fr": "Le Très Élevé",
      "en": "The Supremely Exalted"
    },
    "explanation": {
      "fr": "Al-Muta‘ālī est Celui qui est élevé au-dessus de toute la création et au-dessus de tout ce qu’on Lui attribue de faux.",
      "en": "Al-Muta‘ālī is the One who is exalted above all creation and above every false thing attributed to Him."
    },
    "reflection": {
      "fr": "Allah est au-dessus de ce que notre imagination peut concevoir.",
      "en": "Allah is above whatever our imagination can conceive."
    },
    "practice": {
      "fr": "Parler d’Allah avec ce qu’Il a dit de Lui-même, sans inventer.",
      "en": "Speak of Allah with what He has said about Himself, without inventing."
    },
    "evidence": {
      "kind": "quran",
      "ref": "13:9",
      "surah": "Ar-Ra‘d",
      "arabic": "الْكَبِيرُ الْمُتَعَالِ",
      "text": {
        "fr": "… le Très Grand, le Très Élevé.",
        "en": "… the Grand, the Exalted."
      }
    }
  },
  {
    "id": 79,
    "arabic": "الْبَرُّ",
    "transliteration": "Al-Barr",
    "translation": {
      "fr": "Le Bienfaisant",
      "en": "The Source of All Goodness"
    },
    "explanation": {
      "fr": "Al-Barr est Celui dont la bonté est vaste : Il fait du bien à Ses créatures, tient Ses promesses et récompense largement.",
      "en": "Al-Barr is the One whose goodness is vast: He does good to His creatures, keeps His promises and rewards generously."
    },
    "reflection": {
      "fr": "Ce sont les paroles des gens du Paradis : « Nous L’invoquions auparavant : c’est Lui le Bienfaisant, le Très Miséricordieux. »",
      "en": "These are the words of the people of Paradise: “We used to call upon Him before: He is the Beneficent, the Merciful.”"
    },
    "practice": {
      "fr": "Faire le bien autour de soi, en commençant par ses parents (birr al-wālidayn).",
      "en": "Do good around you, starting with your parents (birr al-wālidayn)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "52:28",
      "surah": "Aṭ-Ṭūr",
      "arabic": "إِنَّهُ هُوَ الْبَرُّ الرَّحِيمُ",
      "text": {
        "fr": "C’est Lui le Bienfaisant, le Très Miséricordieux.",
        "en": "Indeed, it is He who is the Beneficent, the Merciful."
      }
    }
  },
  {
    "id": 80,
    "arabic": "التَّوَّابُ",
    "transliteration": "At-Tawwāb",
    "translation": {
      "fr": "Celui qui accueille sans cesse le repentir",
      "en": "The Accepter of Repentance"
    },
    "explanation": {
      "fr": "At-Tawwāb est Celui qui guide Ses serviteurs vers le repentir, puis l’accepte, encore et encore.",
      "en": "At-Tawwāb is the One who guides His servants to repentance, then accepts it, again and again."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit qu’Allah se réjouit plus du repentir de Son serviteur qu’un homme qui retrouve sa monture perdue dans le désert (al-Bukhârî et Muslim).",
      "en": "The Prophet ﷺ said that Allah rejoices more at His servant’s repentance than a man who finds his lost mount in the desert (al-Bukhârî and Muslim)."
    },
    "practice": {
      "fr": "Se repentir vite, sincèrement, et recommencer autant de fois qu’il le faut.",
      "en": "Repent quickly and sincerely, and start again as many times as needed."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:37",
      "surah": "Al-Baqara",
      "arabic": "إِنَّهُ هُوَ التَّوَّابُ الرَّحِيمُ",
      "text": {
        "fr": "C’est Lui qui accueille le repentir, le Très Miséricordieux.",
        "en": "Indeed, it is He who is the Accepting of repentance, the Merciful."
      }
    }
  },
  {
    "id": 81,
    "arabic": "الْمُنْتَقِمُ",
    "transliteration": "Al-Muntaqim",
    "translation": {
      "fr": "Celui qui châtie avec justice",
      "en": "The Avenger"
    },
    "explanation": {
      "fr": "Al-Muntaqim est Celui qui punit avec justice ceux qui persistent dans l’injustice après avoir été avertis. Dans le Coran, ce sens vient sous la forme « Dhū intiqām », « Détenteur du châtiment ».",
      "en": "Al-Muntaqim is the One who punishes with justice those who persist in wrongdoing after being warned. In the Quran, this meaning comes in the form “Dhū intiqām”, “Owner of retribution”."
    },
    "reflection": {
      "fr": "La justice d’Allah rassure l’opprimé : aucune injustice ne reste sans réponse.",
      "en": "Allah’s justice reassures the oppressed: no injustice goes unanswered."
    },
    "practice": {
      "fr": "Ne pas se venger soi-même au-delà du droit, et confier à Allah ce qu’on ne peut pas régler.",
      "en": "Do not take revenge beyond what is right, and leave to Allah what you cannot settle."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:4",
      "surah": "Āl ‘Imrān",
      "arabic": "وَاللَّهُ عَزِيزٌ ذُو انْتِقَامٍ",
      "text": {
        "fr": "Allah est Tout-Puissant, Détenteur du châtiment.",
        "en": "And Allah is Exalted in Might, the Owner of Retribution."
      }
    }
  },
  {
    "id": 82,
    "arabic": "الْعَفُوُّ",
    "transliteration": "Al-‘Afuww",
    "translation": {
      "fr": "Celui qui efface les fautes",
      "en": "The Pardoner"
    },
    "explanation": {
      "fr": "Al-‘Afuww est Celui qui efface les péchés au point de ne plus en laisser de trace, comme s’ils n’avaient jamais existé.",
      "en": "Al-‘Afuww is the One who erases sins until no trace remains, as if they had never existed."
    },
    "reflection": {
      "fr": "Pour la Nuit du Destin, le Prophète ﷺ a enseigné : « Allāhumma innaka ‘afuwwun tuḥibbu l-‘afwa fa‘fu ‘annī » (at-Tirmidhî, authentifié par al-Albânî).",
      "en": "For the Night of Decree, the Prophet ﷺ taught: “Allāhumma innaka ‘afuwwun tuḥibbu l-‘afwa fa‘fu ‘annī” (at-Tirmidhî, graded authentic by al-Albânî)."
    },
    "practice": {
      "fr": "Dire cette invocation, surtout pendant les dix dernières nuits de Ramadan, et effacer soi-même les torts des autres.",
      "en": "Say this supplication, especially during the last ten nights of Ramadan, and erase the wrongs of others yourself."
    },
    "evidence": {
      "kind": "quran",
      "ref": "4:99",
      "surah": "An-Nisā’",
      "arabic": "وَكَانَ اللَّهُ عَفُوًّا غَفُورًا",
      "text": {
        "fr": "Allah efface les fautes et pardonne.",
        "en": "And Allah is ever Pardoning and Forgiving."
      }
    }
  },
  {
    "id": 83,
    "arabic": "الرَّءُوفُ",
    "transliteration": "Ar-Ra’ūf",
    "translation": {
      "fr": "Le Très Compatissant",
      "en": "The Most Kind"
    },
    "explanation": {
      "fr": "Ar-Ra’ūf est Celui dont la tendresse est extrême : Il épargne à Ses serviteurs ce qui leur est pénible et allège leurs obligations.",
      "en": "Ar-Ra’ūf is the One whose tenderness is extreme: He spares His servants what is hard for them and lightens their obligations."
    },
    "reflection": {
      "fr": "Les facilités de la religion (raccourcir la prière en voyage, ne pas jeûner malade) sont des traces de cette tendresse.",
      "en": "The concessions of the religion (shortening prayer when travelling, not fasting when ill) are traces of this tenderness."
    },
    "practice": {
      "fr": "Être tendre avec les faibles, et faciliter plutôt que compliquer.",
      "en": "Be tender with the weak, and make things easy rather than difficult."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:143",
      "surah": "Al-Baqara",
      "arabic": "إِنَّ اللَّهَ بِالنَّاسِ لَرَءُوفٌ رَحِيمٌ",
      "text": {
        "fr": "Allah est Compatissant et Très Miséricordieux envers les gens.",
        "en": "Indeed, Allah is, to the people, Kind and Merciful."
      }
    }
  },
  {
    "id": 84,
    "arabic": "مَالِكُ الْمُلْكِ",
    "transliteration": "Mālik al-Mulk",
    "translation": {
      "fr": "Le Maître de la royauté",
      "en": "Owner of All Sovereignty"
    },
    "explanation": {
      "fr": "Mālik al-Mulk est Celui qui possède toute royauté : Il la donne à qui Il veut et la retire à qui Il veut.",
      "en": "Mālik al-Mulk is the One who owns all sovereignty: He gives it to whom He wills and takes it from whom He wills."
    },
    "reflection": {
      "fr": "Tout pouvoir terrestre est un prêt temporaire, et il sera demandé compte de son usage.",
      "en": "All earthly power is a temporary loan, and its use will be accounted for."
    },
    "practice": {
      "fr": "Voir ce qu’on possède comme un dépôt, et l’utiliser comme Allah l’aime.",
      "en": "See what you own as a trust, and use it as Allah loves."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:26",
      "surah": "Āl ‘Imrān",
      "arabic": "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ",
      "text": {
        "fr": "Dis : « Ô Allah, Maître de la royauté, Tu donnes la royauté à qui Tu veux. »",
        "en": "Say: “O Allah, Owner of Sovereignty, You give sovereignty to whom You will.”"
      }
    }
  },
  {
    "id": 85,
    "arabic": "ذُو الْجَلَالِ وَالْإِكْرَامِ",
    "transliteration": "Dhū l-Jalāli wa-l-Ikrām",
    "translation": {
      "fr": "Le Détenteur de la majesté et de la générosité",
      "en": "Lord of Majesty and Honour"
    },
    "explanation": {
      "fr": "Dhū l-Jalāli wa-l-Ikrām est Celui qui réunit la majesté qui inspire le respect et la générosité qui comble Ses serviteurs.",
      "en": "Dhū l-Jalāli wa-l-Ikrām is the One who unites majesty that inspires respect and generosity that showers His servants."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Attachez-vous à “Yā Dhā l-jalāli wa-l-ikrām”. » (at-Tirmidhî, authentifié par al-Albânî)",
      "en": "The Prophet ﷺ said: “Hold fast to ‘Yā Dhā l-jalāli wa-l-ikrām’.” (at-Tirmidhî, graded authentic by al-Albânî)"
    },
    "practice": {
      "fr": "Invoquer Allah par ce nom, notamment après chaque prière.",
      "en": "Call upon Allah by this name, especially after each prayer."
    },
    "evidence": {
      "kind": "quran",
      "ref": "55:78",
      "surah": "Ar-Raḥmān",
      "arabic": "تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ",
      "text": {
        "fr": "Béni soit le nom de ton Seigneur, plein de majesté et de générosité.",
        "en": "Blessed is the name of your Lord, Owner of Majesty and Honour."
      }
    }
  },
  {
    "id": 86,
    "arabic": "الْمُقْسِطُ",
    "transliteration": "Al-Muqsiṭ",
    "translation": {
      "fr": "Le Parfaitement Équitable",
      "en": "The Equitable"
    },
    "explanation": {
      "fr": "Al-Muqsiṭ est Celui qui établit l’équité dans Ses jugements et rend à chacun son droit, y compris à l’opprimé contre l’oppresseur.",
      "en": "Al-Muqsiṭ is the One who establishes equity in His judgements and gives everyone their due, including the oppressed against the oppressor."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit que les équitables seront auprès d’Allah sur des chaires de lumière (Muslim).",
      "en": "The Prophet ﷺ said that the just will be with Allah on pulpits of light (Muslim)."
    },
    "practice": {
      "fr": "Être équitable entre ses enfants, dans son travail et dans ses décisions.",
      "en": "Be fair between your children, at work and in your decisions."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:18",
      "surah": "Āl ‘Imrān",
      "arabic": "قَائِمًا بِالْقِسْطِ",
      "text": {
        "fr": "… Lui qui maintient l’équité.",
        "en": "… maintaining creation in justice."
      }
    }
  },
  {
    "id": 87,
    "arabic": "الْجَامِعُ",
    "transliteration": "Al-Jāmi‘",
    "translation": {
      "fr": "Le Rassembleur",
      "en": "The Gatherer"
    },
    "explanation": {
      "fr": "Al-Jāmi‘ est Celui qui rassemblera toutes les créatures le Jour du Jugement, et qui réunit ce qui est dispersé.",
      "en": "Al-Jāmi‘ is the One who will gather all creatures on the Day of Judgement, and who brings together what is scattered."
    },
    "reflection": {
      "fr": "Les séparations d’ici-bas ne sont pas définitives : Allah réunira.",
      "en": "The separations of this world are not final: Allah will gather."
    },
    "practice": {
      "fr": "Œuvrer à rassembler les gens et à réconcilier plutôt qu’à diviser.",
      "en": "Work to bring people together and reconcile rather than divide."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:9",
      "surah": "Āl ‘Imrān",
      "arabic": "رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ",
      "text": {
        "fr": "Seigneur, c’est Toi qui rassembleras les gens, un Jour au sujet duquel il n’y a aucun doute.",
        "en": "Our Lord, surely You will gather the people for a Day about which there is no doubt."
      }
    }
  },
  {
    "id": 88,
    "arabic": "الْغَنِيُّ",
    "transliteration": "Al-Ghaniyy",
    "translation": {
      "fr": "Celui qui se suffit à Lui-même",
      "en": "The Self-Sufficient"
    },
    "explanation": {
      "fr": "Al-Ghaniyy est Celui qui n’a besoin de rien ni de personne, alors que toutes les créatures ont besoin de Lui.",
      "en": "Al-Ghaniyy is the One who needs nothing and no one, while all creatures need Him."
    },
    "reflection": {
      "fr": "Allah n’a pas besoin de notre adoration : c’est nous qui en avons besoin.",
      "en": "Allah does not need our worship: we are the ones who need it."
    },
    "practice": {
      "fr": "Chercher la vraie richesse, celle du cœur (al-Bukhârî et Muslim), et ne pas s’humilier devant les gens pour ce qu’ils possèdent.",
      "en": "Seek true wealth, the wealth of the heart (al-Bukhârî and Muslim), and do not humble yourself before people for what they own."
    },
    "evidence": {
      "kind": "quran",
      "ref": "35:15",
      "surah": "Fāṭir",
      "arabic": "يَا أَيُّهَا النَّاسُ أَنْتُمُ الْفُقَرَاءُ إِلَى اللَّهِ ۖ وَاللَّهُ هُوَ الْغَنِيُّ الْحَمِيدُ",
      "text": {
        "fr": "Ô gens ! Vous êtes les pauvres ayant besoin d’Allah, et Allah est Celui qui se suffit à Lui-même, le Digne de louange.",
        "en": "O mankind, you are those in need of Allah, while Allah is the Free of need, the Praiseworthy."
      }
    }
  },
  {
    "id": 89,
    "arabic": "الْمُغْنِي",
    "transliteration": "Al-Mughnī",
    "translation": {
      "fr": "Celui qui enrichit",
      "en": "The Enricher"
    },
    "explanation": {
      "fr": "Al-Mughnī est Celui qui enrichit qui Il veut, matériellement et spirituellement, et qui rend Ses serviteurs indépendants des autres.",
      "en": "Al-Mughnī is the One who enriches whom He wills, materially and spiritually, and who makes His servants independent of others."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ enseignait : « Ô Allah, suffis-moi par le licite pour que je me passe de l’illicite, et enrichis-moi par Ta grâce pour que je me passe de tout autre que Toi. » (at-Tirmidhî)",
      "en": "The Prophet ﷺ taught: “O Allah, suffice me with what is lawful against what is unlawful, and enrich me by Your grace so I need none but You.” (at-Tirmidhî)"
    },
    "practice": {
      "fr": "Dire cette invocation et se contenter du licite.",
      "en": "Say this supplication and be content with what is lawful."
    },
    "evidence": {
      "kind": "quran",
      "ref": "53:48",
      "surah": "An-Najm",
      "arabic": "وَأَنَّهُ هُوَ أَغْنَىٰ وَأَقْنَىٰ",
      "text": {
        "fr": "Et c’est Lui qui enrichit et qui fait posséder.",
        "en": "And it is He who enriches and suffices."
      }
    }
  },
  {
    "id": 90,
    "arabic": "الْمَانِعُ",
    "transliteration": "Al-Māni‘",
    "translation": {
      "fr": "Celui qui empêche et protège",
      "en": "The Preventer"
    },
    "explanation": {
      "fr": "Al-Māni‘ est Celui qui retient ce qu’Il veut, par sagesse, et qui protège Ses serviteurs de ce qui leur nuirait.",
      "en": "Al-Māni‘ is the One who withholds what He wills, out of wisdom, and protects His servants from what would harm them."
    },
    "reflection": {
      "fr": "Ce qu’Allah nous refuse peut être une protection. On ne voit pas toujours le mal qu’Il a écarté.",
      "en": "What Allah refuses us may be a protection. We do not always see the harm He has kept away."
    },
    "practice": {
      "fr": "Dire après la prière : « Nul ne peut empêcher ce que Tu donnes, ni donner ce que Tu empêches. »",
      "en": "Say after the prayer: “None can withhold what You give, and none can give what You withhold.”"
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Après la prière, le Prophète ﷺ disait : « Ô Allah, nul ne peut empêcher ce que Tu donnes, ni donner ce que Tu empêches. »",
        "en": "After the prayer, the Prophet ﷺ would say: “O Allah, none can withhold what You give, and none can give what You withhold.”"
      },
      "source": {
        "fr": "al-Bukhârî et Muslim",
        "en": "al-Bukhârî and Muslim"
      }
    }
  },
  {
    "id": 91,
    "arabic": "الضَّارُّ",
    "transliteration": "Aḍ-Ḍārr",
    "translation": {
      "fr": "Celui qui permet l’épreuve",
      "en": "The Distresser"
    },
    "explanation": {
      "fr": "Aḍ-Ḍārr est Celui par la volonté de qui arrive toute épreuve, avec une sagesse. Ce nom ne s’emploie qu’avec son opposé, An-Nāfi‘ : le mal n’est jamais attribué seul à Allah.",
      "en": "Aḍ-Ḍārr is the One by whose will every hardship comes, with wisdom. This name is used only together with its opposite, An-Nāfi‘: harm is never attributed to Allah on its own."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit à Ibn ‘Abbās : si toute la communauté se réunissait pour te nuire, elle ne te nuirait que par ce qu’Allah a écrit pour toi (at-Tirmidhî).",
      "en": "The Prophet ﷺ told Ibn ‘Abbās: if the whole community gathered to harm you, they could only harm you with what Allah has written for you (at-Tirmidhî)."
    },
    "practice": {
      "fr": "Ne craindre aucune créature au point d’oublier Allah, et patienter dans l’épreuve.",
      "en": "Do not fear any creature to the point of forgetting Allah, and be patient in hardship."
    },
    "evidence": {
      "kind": "quran",
      "ref": "10:107",
      "surah": "Yūnus",
      "arabic": "وَإِنْ يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ",
      "text": {
        "fr": "Si Allah fait qu’un mal te touche, nul ne peut l’écarter en dehors de Lui.",
        "en": "And if Allah should touch you with adversity, there is no remover of it except Him."
      }
    }
  },
  {
    "id": 92,
    "arabic": "النَّافِعُ",
    "transliteration": "An-Nāfi‘",
    "translation": {
      "fr": "Celui qui accorde le bienfait",
      "en": "The Benefactor"
    },
    "explanation": {
      "fr": "An-Nāfi‘ est Celui de qui vient tout bienfait. Ce nom va avec Aḍ-Ḍārr : le bien comme l’épreuve n’arrivent que par Sa volonté.",
      "en": "An-Nāfi‘ is the One from whom every benefit comes. This name goes with Aḍ-Ḍārr: good and hardship come only by His will."
    },
    "reflection": {
      "fr": "Les médicaments, les gens, les moyens ne profitent que si Allah le veut.",
      "en": "Medicine, people and means only benefit if Allah wills."
    },
    "practice": {
      "fr": "Demander à Allah une science utile et être utile aux autres.",
      "en": "Ask Allah for beneficial knowledge and be of benefit to others."
    },
    "evidence": {
      "kind": "quran",
      "ref": "10:107",
      "surah": "Yūnus",
      "arabic": "وَإِنْ يُرِدْكَ بِخَيْرٍ فَلَا رَادَّ لِفَضْلِهِ",
      "text": {
        "fr": "Et s’Il te veut un bien, nul ne peut repousser Sa grâce.",
        "en": "And if He intends good for you, there is no repeller of His bounty."
      }
    }
  },
  {
    "id": 93,
    "arabic": "النُّورُ",
    "transliteration": "An-Nūr",
    "translation": {
      "fr": "La Lumière",
      "en": "The Light"
    },
    "explanation": {
      "fr": "An-Nūr est Celui qui est lumière, qui illumine les cieux et la terre, et qui éclaire les cœurs des croyants par la guidance.",
      "en": "An-Nūr is the One who is light, who illuminates the heavens and the earth, and who lights up the hearts of the believers with guidance."
    },
    "reflection": {
      "fr": "Le Prophète ﷺ demandait : « Ô Allah, mets dans mon cœur une lumière… » (al-Bukhârî et Muslim)",
      "en": "The Prophet ﷺ would ask: “O Allah, place light in my heart…” (al-Bukhârî and Muslim)"
    },
    "practice": {
      "fr": "Demander la lumière de la guidance, et la chercher dans le Coran.",
      "en": "Ask for the light of guidance, and seek it in the Quran."
    },
    "evidence": {
      "kind": "quran",
      "ref": "24:35",
      "surah": "An-Nūr",
      "arabic": "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ",
      "text": {
        "fr": "Allah est la Lumière des cieux et de la terre.",
        "en": "Allah is the Light of the heavens and the earth."
      }
    }
  },
  {
    "id": 94,
    "arabic": "الْهَادِي",
    "transliteration": "Al-Hādī",
    "translation": {
      "fr": "Le Guide",
      "en": "The Guide"
    },
    "explanation": {
      "fr": "Al-Hādī est Celui qui guide Ses créatures vers ce qui leur est utile, et qui guide qui Il veut vers la vérité et la foi.",
      "en": "Al-Hādī is the One who guides His creatures to what benefits them, and who guides whom He wills to the truth and to faith."
    },
    "reflection": {
      "fr": "Dans chaque rak‘a, on demande : « Guide-nous vers le droit chemin. » Même le croyant a besoin de cette guidance chaque jour.",
      "en": "In every rak‘a, we ask: “Guide us to the straight path.” Even the believer needs this guidance every day."
    },
    "practice": {
      "fr": "Demander la guidance avec sincérité, rechercher la vérité et agir selon ce qu’on apprend.",
      "en": "Ask for guidance sincerely, seek the truth and act on what you learn."
    },
    "evidence": {
      "kind": "quran",
      "ref": "25:31",
      "surah": "Al-Furqān",
      "arabic": "وَكَفَىٰ بِرَبِّكَ هَادِيًا وَنَصِيرًا",
      "text": {
        "fr": "Ton Seigneur suffit comme Guide et comme Soutien.",
        "en": "But sufficient is your Lord as a Guide and a Helper."
      }
    }
  },
  {
    "id": 95,
    "arabic": "الْبَدِيعُ",
    "transliteration": "Al-Badī‘",
    "translation": {
      "fr": "Le Créateur sans modèle",
      "en": "The Incomparable Originator"
    },
    "explanation": {
      "fr": "Al-Badī‘ est Celui qui a créé les cieux et la terre sans modèle préalable, d’une manière merveilleuse et sans précédent.",
      "en": "Al-Badī‘ is the One who created the heavens and the earth without any prior model, in a wondrous and unprecedented way."
    },
    "reflection": {
      "fr": "La beauté du monde est une invitation à connaître Celui qui l’a créée.",
      "en": "The beauty of the world is an invitation to know the One who created it."
    },
    "practice": {
      "fr": "S’émerveiller devant la création et en remercier Allah.",
      "en": "Marvel at creation and thank Allah for it."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:117",
      "surah": "Al-Baqara",
      "arabic": "بَدِيعُ السَّمَاوَاتِ وَالْأَرْضِ",
      "text": {
        "fr": "Créateur sans modèle des cieux et de la terre.",
        "en": "Originator of the heavens and the earth."
      }
    }
  },
  {
    "id": 96,
    "arabic": "الْبَاقِي",
    "transliteration": "Al-Bāqī",
    "translation": {
      "fr": "L’Éternel, Celui qui demeure",
      "en": "The Everlasting"
    },
    "explanation": {
      "fr": "Al-Bāqī est Celui qui demeure pour toujours, alors que toute chose disparaît.",
      "en": "Al-Bāqī is the One who remains forever, while everything else passes away."
    },
    "reflection": {
      "fr": "« Tout ce qui est sur terre disparaîtra », sauf Lui. Ce qui est fait pour Lui reste.",
      "en": "“Everyone upon the earth will perish”, except Him. What is done for Him remains."
    },
    "practice": {
      "fr": "Investir dans ce qui reste : la sadaqa continue, la science utile, l’enfant pieux (Muslim).",
      "en": "Invest in what lasts: ongoing charity, beneficial knowledge, a righteous child (Muslim)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "55:27",
      "surah": "Ar-Raḥmān",
      "arabic": "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو الْجَلَالِ وَالْإِكْرَامِ",
      "text": {
        "fr": "Seul demeure le Visage de ton Seigneur, plein de majesté et de générosité.",
        "en": "And there will remain the Face of your Lord, Owner of Majesty and Honour."
      }
    }
  },
  {
    "id": 97,
    "arabic": "الْوَارِثُ",
    "transliteration": "Al-Wārith",
    "translation": {
      "fr": "L’Héritier ultime",
      "en": "The Inheritor"
    },
    "explanation": {
      "fr": "Al-Wārith est Celui qui demeure après la disparition de toutes les créatures, et à qui revient tout ce qu’elles possédaient.",
      "en": "Al-Wārith is the One who remains after all creatures have passed away, and to whom everything they owned returns."
    },
    "reflection": {
      "fr": "Zakariyyā invoquait : « Seigneur, ne me laisse pas seul, Tu es le meilleur des héritiers. » (21:89)",
      "en": "Zakariyyā prayed: “My Lord, do not leave me alone, and You are the best of inheritors.” (21:89)"
    },
    "practice": {
      "fr": "Ne pas s’attacher à ce qu’on laissera derrière soi, et donner de son vivant.",
      "en": "Do not cling to what you will leave behind, and give while you are alive."
    },
    "evidence": {
      "kind": "quran",
      "ref": "15:23",
      "surah": "Al-Ḥijr",
      "arabic": "وَإِنَّا لَنَحْنُ نُحْيِي وَنُمِيتُ وَنَحْنُ الْوَارِثُونَ",
      "text": {
        "fr": "C’est Nous qui donnons la vie et la mort, et c’est Nous qui sommes l’Héritier.",
        "en": "And indeed, it is We who give life and cause death, and We are the Inheritor."
      }
    }
  },
  {
    "id": 98,
    "arabic": "الرَّشِيدُ",
    "transliteration": "Ar-Rashīd",
    "translation": {
      "fr": "Le Guide vers la droiture",
      "en": "The Guide to the Right Path"
    },
    "explanation": {
      "fr": "Ar-Rashīd est Celui dont tous les actes sont droits et qui dirige Ses serviteurs vers ce qui est juste et bon pour eux.",
      "en": "Ar-Rashīd is the One whose every act is right and who directs His servants to what is right and good for them."
    },
    "reflection": {
      "fr": "Les jeunes de la caverne ont demandé à Allah de leur préparer la droiture dans leur affaire. Une décision droite vient d’Allah.",
      "en": "The youths of the cave asked Allah to prepare right guidance for them in their affair. A right decision comes from Allah."
    },
    "practice": {
      "fr": "Faire l’istikhāra avant les décisions importantes, et demander conseil aux gens sages.",
      "en": "Pray istikhāra before important decisions, and seek advice from wise people."
    },
    "evidence": {
      "kind": "quran",
      "ref": "18:10",
      "surah": "Al-Kahf",
      "arabic": "رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
      "text": {
        "fr": "Seigneur, accorde-nous de Ta part une miséricorde, et prépare-nous la droiture dans notre affaire.",
        "en": "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance."
      }
    }
  },
  {
    "id": 99,
    "arabic": "الصَّبُورُ",
    "transliteration": "Aṣ-Ṣabūr",
    "translation": {
      "fr": "Le Très Patient",
      "en": "The Most Patient"
    },
    "explanation": {
      "fr": "Aṣ-Ṣabūr est Celui qui ne se hâte pas de punir ceux qui Lui désobéissent ou Lui attribuent ce qui ne Lui convient pas, et qui leur laisse le temps de revenir.",
      "en": "Aṣ-Ṣabūr is the One who does not hasten to punish those who disobey Him or attribute to Him what does not befit Him, and who leaves them time to return."
    },
    "reflection": {
      "fr": "Si Allah est patient avec nous malgré nos fautes, nous pouvons l’être avec les autres.",
      "en": "If Allah is patient with us despite our faults, we can be patient with others."
    },
    "practice": {
      "fr": "Patienter dans l’obéissance, face au péché et dans l’épreuve.",
      "en": "Be patient in obedience, in resisting sin and in hardship."
    },
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Le Prophète ﷺ a dit : « Nul n’est plus patient qu’Allah face aux paroles blessantes qu’Il entend : on Lui attribue un enfant, et pourtant Il leur accorde la santé et la subsistance. »",
        "en": "The Prophet ﷺ said: “No one is more patient than Allah with the hurtful words He hears: they attribute a son to Him, yet He still gives them health and provision.”"
      },
      "source": {
        "fr": "al-Bukhârî et Muslim",
        "en": "al-Bukhârî and Muslim"
      }
    }
  }
];

const pick = (value: Localized, language: LanguageCode) => (language === "en" ? value.en : value.fr);

function localize(entry: AllahNameEntry, language: LanguageCode): AllahName {
  const evidence = entry.evidence;
  return {
    id: entry.id,
    arabic: entry.arabic,
    transliteration: entry.transliteration,
    translation: pick(entry.translation, language),
    explanation: pick(entry.explanation, language),
    reflection: pick(entry.reflection, language),
    practice: pick(entry.practice, language),
    evidence: evidence.kind === "quran"
      ? { ...evidence, text: pick(evidence.text, language) }
      : { kind: "sunnah", text: pick(evidence.text, language), source: pick(evidence.source, language) },
  };
}

const cache = new Map<LanguageCode, AllahName[]>();

export function getAllahNames(language: LanguageCode): AllahName[] {
  let names = cache.get(language);
  if (!names) {
    names = ENTRIES.map((entry) => localize(entry, language));
    cache.set(language, names);
  }
  return names;
}

export function getAllahName(id: number, language: LanguageCode) {
  return getAllahNames(language)[id - 1];
}

/** Same name for everyone on a given local day, cycling through the 99. */
export function nameOfTheDay(date = new Date()) {
  // Calendar days counted in UTC so daylight-saving changes never repeat or skip a name.
  const day = Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return (day % 99) + 1;
}
