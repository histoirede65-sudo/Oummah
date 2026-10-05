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
// with the official translations used by the Coran module (Hamidullah in French, Saheeh International in English).
// Never replace them with a home-made translation. Explanations are teaching summaries; keep FR and EN in step when editing.
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
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ۖ عَـٰلِمُ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ ۖ هُوَ ٱلرَّحْمَـٰنُ ٱلرَّحِيمُ",
      "text": {
        "fr": "C’est Lui Allah. Nulle divinité autre que Lui, le Connaisseur de l’Invisible tout comme du visible. C’est Lui, le Tout Miséricordieux, le Très Miséricordieux.",
        "en": "He is Allāh, other than whom there is no deity, Knower of the unseen and the witnessed. He is the Entirely Merciful, the Especially Merciful."
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
      "arabic": "هُوَ ٱلَّذِى يُصَلِّى عَلَيْكُمْ وَمَلَـٰٓئِكَتُهُۥ لِيُخْرِجَكُم مِّنَ ٱلظُّلُمَـٰتِ إِلَى ٱلنُّورِ ۚ وَكَانَ بِٱلْمُؤْمِنِينَ رَحِيمًا",
      "text": {
        "fr": "C’est Lui qui prie sur vous, - ainsi que Ses anges, - afin qu’Il vous fasse sortir des ténèbres à la lumière; et Il est Miséricordieux envers les croyants.",
        "en": "It is He who confers blessing upon you, and His angels [ask Him to do so] that He may bring you out from darknesses into the light. And ever is He, to the believers, Merciful."
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
      "ref": "23:116",
      "surah": "Al-Mu’minūn",
      "arabic": "فَتَعَـٰلَى ٱللَّهُ ٱلْمَلِكُ ٱلْحَقُّ ۖ لَآ إِلَـٰهَ إِلَّا هُوَ رَبُّ ٱلْعَرْشِ ٱلْكَرِيمِ",
      "text": {
        "fr": "Que soit exalté Allah, le vrai Souverain! Pas de divinité [véritable] en dehors de Lui, le Seigneur du Trône sublime !",
        "en": "So exalted is Allāh, the Sovereign, the Truth; there is no deity except Him, Lord of the Noble Throne."
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
      "arabic": " يُسَبِّحُ لِلَّهِ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ٱلْمَلِكِ ٱلْقُدُّوسِ ٱلْعَزِيزِ ٱلْحَكِيمِ",
      "text": {
        "fr": "Ce qui est dans les cieux et ce qui sur la Terre glorifient Allah, le Souverain, le Pur, le Puissant, le Sage.",
        "en": "Whatever is in the heavens and whatever is on the earth is exalting Allāh, the Sovereign, the Pure, the Exalted in Might, the Wise."
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
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "C’est Lui, Allah. Nulle divinité que Lui ; Le Souverain, le Pur, L’Apaisant, Le Rassurant, le Prédominant, Le Tout Puissant, Le Contraignant, L’Orgueilleux. Gloire à Allah! Il transcende ce qu’ils Lui associent.",
        "en": "He is Allāh, other than whom there is no deity, the Sovereign, the Pure, the Perfection, the Grantor of Security, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allāh above whatever they associate with Him."
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
      "fr": "La vraie sécurité ne vient ni de l’argent ni des gens, mais d’Allah : « Ceux qui ont cru et n’ont point entaché leur foi par quel qu’inéquité (association), ceux-là ont la sécurité; et ce sont eux les bien-guidés.\" » (6:82)",
      "en": "True security comes neither from money nor from people, but from Allah: “They who believe and do not mix their belief with injustice - those will have security, and they are [rightly] guided.” (6:82)"
    },
    "practice": {
      "fr": "Être quelqu’un auprès de qui les autres se sentent en sécurité, dans ses paroles comme dans ses actes.",
      "en": "Be someone with whom others feel safe, in your words as in your actions."
    },
    "evidence": {
      "kind": "quran",
      "ref": "59:23",
      "surah": "Al-Ḥashr",
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "C’est Lui, Allah. Nulle divinité que Lui ; Le Souverain, le Pur, L’Apaisant, Le Rassurant, le Prédominant, Le Tout Puissant, Le Contraignant, L’Orgueilleux. Gloire à Allah! Il transcende ce qu’ils Lui associent.",
        "en": "He is Allāh, other than whom there is no deity, the Sovereign, the Pure, the Perfection, the Grantor of Security, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allāh above whatever they associate with Him."
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
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "C’est Lui, Allah. Nulle divinité que Lui ; Le Souverain, le Pur, L’Apaisant, Le Rassurant, le Prédominant, Le Tout Puissant, Le Contraignant, L’Orgueilleux. Gloire à Allah! Il transcende ce qu’ils Lui associent.",
        "en": "He is Allāh, other than whom there is no deity, the Sovereign, the Pure, the Perfection, the Grantor of Security, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allāh above whatever they associate with Him."
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
      "fr": "Le Coran rappelle que la puissance appartient à Allah, à Son Messager et aux croyants (63:8) : la vraie dignité se trouve dans l’obéissance à Allah, pas dans l’orgueil.",
      "en": "The Quran reminds us that honour belongs to Allah, to His Messenger and to the believers (63:8): true dignity is found in obeying Allah, not in pride."
    },
    "practice": {
      "fr": "Rechercher sa dignité dans l’obéissance à Allah, et ne pas s’humilier devant les créatures pour obtenir ce qui n’appartient qu’à Lui.",
      "en": "Seek your dignity in obeying Allah, and do not humble yourself before creatures to obtain what belongs only to Him."
    },
    "evidence": {
      "kind": "quran",
      "ref": "3:6",
      "surah": "Āl ‘Imrān",
      "arabic": "هُوَ ٱلَّذِى يُصَوِّرُكُمْ فِى ٱلْأَرْحَامِ كَيْفَ يَشَآءُ ۚ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
      "text": {
        "fr": "C’est Lui qui vous donne forme dans les matrices, comme Il veut. Point de divinité à part Lui, le Puissant, le Sage.",
        "en": "It is He who forms you in the wombs however He wills. There is no deity except Him, the Exalted in Might, the Wise."
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
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "C’est Lui, Allah. Nulle divinité que Lui ; Le Souverain, le Pur, L’Apaisant, Le Rassurant, le Prédominant, Le Tout Puissant, Le Contraignant, L’Orgueilleux. Gloire à Allah! Il transcende ce qu’ils Lui associent.",
        "en": "He is Allāh, other than whom there is no deity, the Sovereign, the Pure, the Perfection, the Grantor of Security, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allāh above whatever they associate with Him."
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
      "arabic": "هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَـٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَـٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ",
      "text": {
        "fr": "C’est Lui, Allah. Nulle divinité que Lui ; Le Souverain, le Pur, L’Apaisant, Le Rassurant, le Prédominant, Le Tout Puissant, Le Contraignant, L’Orgueilleux. Gloire à Allah! Il transcende ce qu’ils Lui associent.",
        "en": "He is Allāh, other than whom there is no deity, the Sovereign, the Pure, the Perfection, the Grantor of Security, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allāh above whatever they associate with Him."
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
      "arabic": "هُوَ ٱللَّهُ ٱلْخَـٰلِقُ ٱلْبَارِئُ ٱلْمُصَوِّرُ ۖ لَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ ۚ يُسَبِّحُ لَهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۖ وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
      "text": {
        "fr": "C’est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. A Lui les plus beaux noms. Tout ce qui est dans les cieux et la Terre Le glorifie. Et c’est Lui le Puissant, le Sage.",
        "en": "He is Allāh, the Creator, the Producer, the Fashioner; to Him belong the best names. Whatever is in the heavens and earth is exalting Him. And He is the Exalted in Might, the Wise."
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
      "arabic": "هُوَ ٱللَّهُ ٱلْخَـٰلِقُ ٱلْبَارِئُ ٱلْمُصَوِّرُ ۖ لَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ ۚ يُسَبِّحُ لَهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۖ وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
      "text": {
        "fr": "C’est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. A Lui les plus beaux noms. Tout ce qui est dans les cieux et la Terre Le glorifie. Et c’est Lui le Puissant, le Sage.",
        "en": "He is Allāh, the Creator, the Producer, the Fashioner; to Him belong the best names. Whatever is in the heavens and earth is exalting Him. And He is the Exalted in Might, the Wise."
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
      "arabic": "هُوَ ٱلَّذِى يُصَوِّرُكُمْ فِى ٱلْأَرْحَامِ كَيْفَ يَشَآءُ ۚ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
      "text": {
        "fr": "C’est Lui qui vous donne forme dans les matrices, comme Il veut. Point de divinité à part Lui, le Puissant, le Sage.",
        "en": "It is He who forms you in the wombs however He wills. There is no deity except Him, the Exalted in Might, the Wise."
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
      "arabic": "فَقُلْتُ ٱسْتَغْفِرُوا۟ رَبَّكُمْ إِنَّهُۥ كَانَ غَفَّارًا",
      "text": {
        "fr": "J’ai donc dit : \"Implorez le pardon de votre Seigneur, car Il est grand Pardonneur,",
        "en": "And said, 'Ask forgiveness of your Lord. Indeed, He is ever a Perpetual Forgiver."
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
      "arabic": "يَوْمَ تُبَدَّلُ ٱلْأَرْضُ غَيْرَ ٱلْأَرْضِ وَٱلسَّمَـٰوَٰتُ ۖ وَبَرَزُوا۟ لِلَّهِ ٱلْوَٰحِدِ ٱلْقَهَّارِ",
      "text": {
        "fr": "au jour où la Terre sera remplacée par une autre, de même que les cieux et où (les hommes) comparaîtront devant Allah, l’Unique, Le Dominateur Suprême.",
        "en": "[It will be] on the Day the earth will be replaced by another earth, and the heavens [as well], and they [i.e., all creatures] will come out before Allāh, the One, the Prevailing,"
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
      "arabic": "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ",
      "text": {
        "fr": "\"Seigneur ! Ne laisse pas dévier nos cœurs après que Tu nous aies guidés; et accorde-nous Ta miséricorde. C’est Toi, certes, le Grand Donateur !",
        "en": "[Who say], \"Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower."
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
      "fr": "« Il n’y a point de bête sur Terre dont la subsistance n’incombe à Allah qui connaît son gîte et son dépôt; tout est dans un Livre explicite. » (11:6) Le rizq de chacun est écrit ; aucune âme ne meurt avant de l’avoir reçu en entier.",
      "en": "“And there is no creature on earth but that upon Allāh is its provision, and He knows its place of dwelling and place of storage. All is in a clear register.” (11:6) Each person’s provision is written; no soul dies before receiving it in full."
    },
    "practice": {
      "fr": "Travailler de manière licite, sans angoisse ni avidité, et remercier pour ce qui est accordé.",
      "en": "Work in lawful ways, without anxiety or greed, and be thankful for what you are given."
    },
    "evidence": {
      "kind": "quran",
      "ref": "51:58",
      "surah": "Adh-Dhāriyāt",
      "arabic": "إِنَّ ٱللَّهَ هُوَ ٱلرَّزَّاقُ ذُو ٱلْقُوَّةِ ٱلْمَتِينُ",
      "text": {
        "fr": "En vérité, c’est Allah qui est le Grand Pourvoyeur, Le Détenteur de la force, l’Inébranlable.",
        "en": "Indeed, it is Allāh who is the [continual] Provider, the firm possessor of strength."
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
      "fr": "Aucune porte fermée ne l’est pour Allah : « Ce qu’Allah accorde en miséricorde aux gens, il n’est personne à pouvoir le retenir. Et ce qu’Il retient, il n’est personne à le relâcher après Lui. Et c’est Lui le Puissant, le Sage. » (35:2)",
      "en": "No closed door is closed for Allah: “Whatever Allāh grants to people of mercy - none can withhold it; and whatever He withholds - none can release it thereafter. And He is the Exalted in Might, the Wise.” (35:2)"
    },
    "practice": {
      "fr": "Demander à Allah d’ouvrir son cœur à la compréhension, et ne pas désespérer face à une situation bloquée.",
      "en": "Ask Allah to open your heart to understanding, and do not despair when a situation seems stuck."
    },
    "evidence": {
      "kind": "quran",
      "ref": "34:26",
      "surah": "Saba’",
      "arabic": "قُلْ يَجْمَعُ بَيْنَنَا رَبُّنَا ثُمَّ يَفْتَحُ بَيْنَنَا بِٱلْحَقِّ وَهُوَ ٱلْفَتَّاحُ ٱلْعَلِيمُ",
      "text": {
        "fr": "Dis : \"Notre Seigneur nous réunira, puis Il tranchera entre nous, avec la vérité, car c’est Lui le Grand Juge, l’Omniscient.\"",
        "en": "Say, \"Our Lord will bring us together; then He will judge between us in truth. And He is the Knowing Judge.\""
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
      "arabic": "قَالُوا۟ سُبْحَـٰنَكَ لَا عِلْمَ لَنَآ إِلَّا مَا عَلَّمْتَنَآ ۖ إِنَّكَ أَنتَ ٱلْعَلِيمُ ٱلْحَكِيمُ",
      "text": {
        "fr": "Ils dirent: \"Gloire à Toi! Nous n’avons de savoir que ce que Tu nous a appris. Certes c’est Toi l’Omniscient, le Sage.\"",
        "en": "They said, \"Exalted are You; we have no knowledge except what You have taught us. Indeed, it is You who is the Knowing, the Wise.\""
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
      "arabic": "مَّن ذَا ٱلَّذِى يُقْرِضُ ٱللَّهَ قَرْضًا حَسَنًا فَيُضَـٰعِفَهُۥ لَهُۥٓ أَضْعَافًا كَثِيرَةً ۚ وَٱللَّهُ يَقْبِضُ وَيَبْصُۜطُ وَإِلَيْهِ تُرْجَعُونَ",
      "text": {
        "fr": "Quiconque prête à Allah de bonne grâce, Il le lui rendra multiplié plusieurs fois. Allah restreint ou étend (Ses faveurs). Et c’est à Lui que vous retournerez.",
        "en": "Who is it that would loan Allāh a goodly loan so He may multiply it for him many times over? And it is Allāh who withholds and grants abundance, and to Him you will be returned."
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
      "arabic": "مَّن ذَا ٱلَّذِى يُقْرِضُ ٱللَّهَ قَرْضًا حَسَنًا فَيُضَـٰعِفَهُۥ لَهُۥٓ أَضْعَافًا كَثِيرَةً ۚ وَٱللَّهُ يَقْبِضُ وَيَبْصُۜطُ وَإِلَيْهِ تُرْجَعُونَ",
      "text": {
        "fr": "Quiconque prête à Allah de bonne grâce, Il le lui rendra multiplié plusieurs fois. Allah restreint ou étend (Ses faveurs). Et c’est à Lui que vous retournerez.",
        "en": "Who is it that would loan Allāh a goodly loan so He may multiply it for him many times over? And it is Allāh who withholds and grants abundance, and to Him you will be returned."
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
      "ref": "6:83",
      "surah": "Al-An‘ām",
      "arabic": "وَتِلْكَ حُجَّتُنَآ ءَاتَيْنَـٰهَآ إِبْرَٰهِيمَ عَلَىٰ قَوْمِهِۦ ۚ نَرْفَعُ دَرَجَـٰتٍ مَّن نَّشَآءُ ۗ إِنَّ رَبَّكَ حَكِيمٌ عَلِيمٌ",
      "text": {
        "fr": "Tel est l’argument que Nous donnâmes à Abraham contre son peuple. Nous élevons en haut rang qui Nous voulons. Ton Seigneur est Sage et Omniscient.",
        "en": "And that was Our [conclusive] argument which We gave Abraham against his people. We raise by degrees whom We will. Indeed, your Lord is Wise and Knowing."
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
      "arabic": "قُلِ ٱللَّهُمَّ مَـٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ ۖ بِيَدِكَ ٱلْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
      "text": {
        "fr": "Dis: “Ô Allah! Maître de l’autorité absolue. Tu donnes l’autorité à qui Tu veux, et Tu arraches l’autorité à qui Tu veux; et Tu donnes la puissance à qui Tu veux, et Tu humilies qui Tu veux. Le bien est en Ta main et Tu es Omnipotent.",
        "en": "Say, \"O Allāh, Owner of Sovereignty, You give sovereignty to whom You will and You take sovereignty away from whom You will. You honor whom You will and You humble whom You will. In Your hand is [all] good. Indeed, You are over all things competent."
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
      "arabic": "قُلِ ٱللَّهُمَّ مَـٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ ۖ بِيَدِكَ ٱلْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
      "text": {
        "fr": "Dis: “Ô Allah! Maître de l’autorité absolue. Tu donnes l’autorité à qui Tu veux, et Tu arraches l’autorité à qui Tu veux; et Tu donnes la puissance à qui Tu veux, et Tu humilies qui Tu veux. Le bien est en Ta main et Tu es Omnipotent.",
        "en": "Say, \"O Allāh, Owner of Sovereignty, You give sovereignty to whom You will and You take sovereignty away from whom You will. You honor whom You will and You humble whom You will. In Your hand is [all] good. Indeed, You are over all things competent."
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
      "arabic": "فَاطِرُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۚ جَعَلَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا وَمِنَ ٱلْأَنْعَـٰمِ أَزْوَٰجًا ۖ يَذْرَؤُكُمْ فِيهِ ۚ لَيْسَ كَمِثْلِهِۦ شَىْءٌ ۖ وَهُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ",
      "text": {
        "fr": "...Créateur des cieux et de la terre. Il vous a donné des épouses [issues] de vous-même et des bestiaux par couples; par ce moyen Il vous multiplie. Il n’y a rien qui Lui ressemble; et c’est Lui l’Audient, le Clairvoyant.",
        "en": "[He is] Creator of the heavens and the earth. He has made for you from yourselves, mates, and among the cattle, mates; He multiplies you thereby. There is nothing like unto Him, and He is the Hearing, the Seeing."
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
      "ref": "40:44",
      "surah": "Ghāfir",
      "arabic": "فَسَتَذْكُرُونَ مَآ أَقُولُ لَكُمْ ۚ وَأُفَوِّضُ أَمْرِىٓ إِلَى ٱللَّهِ ۚ إِنَّ ٱللَّهَ بَصِيرٌۢ بِٱلْعِبَادِ",
      "text": {
        "fr": "Bientôt vous vous rappellerez ce que je vous dis ; et je confie mon sort à Allah. Allah est, certes Clairvoyant sur les serviteurs.",
        "en": "And you will remember what I [now] say to you, and I entrust my affair to Allāh. Indeed, Allāh is Seeing of [His] servants.\""
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
      "arabic": "أَفَغَيْرَ ٱللَّهِ أَبْتَغِى حَكَمًا وَهُوَ ٱلَّذِىٓ أَنزَلَ إِلَيْكُمُ ٱلْكِتَـٰبَ مُفَصَّلًا ۚ وَٱلَّذِينَ ءَاتَيْنَـٰهُمُ ٱلْكِتَـٰبَ يَعْلَمُونَ أَنَّهُۥ مُنَزَّلٌ مِّن رَّبِّكَ بِٱلْحَقِّ ۖ فَلَا تَكُونَنَّ مِنَ ٱلْمُمْتَرِينَ",
      "text": {
        "fr": "Chercherai-je un autre juge qu’Allah, alors que c’est Lui qui a fait descendre vers vous ce Livre bien exposé ? Ceux auxquels Nous avons donné le Livre savent qu’il est descendu avec la vérité venant de ton Seigneur. Ne sois donc point du nombre de ceux qui doutent.",
        "en": "[Say], \"Then is it other than Allāh I should seek as judge while it is He who has revealed to you the Book [i.e., the Qur’ān] explained in detail?\" And those to whom We [previously] gave the Scripture know that it is sent down from your Lord in truth, so never be among the doubters."
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
      "arabic": "إِنَّ ٱللَّهَ لَا يَظْلِمُ مِثْقَالَ ذَرَّةٍ ۖ وَإِن تَكُ حَسَنَةً يُضَـٰعِفْهَا وَيُؤْتِ مِن لَّدُنْهُ أَجْرًا عَظِيمًا",
      "text": {
        "fr": "Certes, Allah ne lèse (personne), fût-ce du poids d’un atome. S’il est une bonne action, Il la double, et accorde une immense récompense de Sa part.",
        "en": "Indeed, Allāh does not do injustice, [even] as much as an atom's weight; while if there is a good deed, He multiplies it and gives from Himself a great reward."
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
      "fr": "Une épreuve peut porter un bien que l’on ne voit pas encore. Après des années d’épreuves, Yūsuf a reconnu la douceur de son Seigneur dans ce qui lui était arrivé (12:100).",
      "en": "A trial may carry a good we cannot yet see. After years of trials, Yūsuf recognised his Lord’s subtle kindness in all that had happened to him (12:100)."
    },
    "practice": {
      "fr": "Être doux dans sa manière de conseiller et de corriger, et faire du bien discrètement.",
      "en": "Be gentle in the way you advise and correct, and do good discreetly."
    },
    "evidence": {
      "kind": "quran",
      "ref": "67:14",
      "surah": "Al-Mulk",
      "arabic": "أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ",
      "text": {
        "fr": "Ne connaît-Il pas ce qu’Il a créé alors que c’est Lui le Compatissant, le Parfaitement Connaisseur.",
        "en": "Does He who created not know, while He is the Subtle, the Aware?"
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
      "arabic": "يَـٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَـٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَـٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوٓا۟ ۚ إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ ۚ إِنَّ ٱللَّهَ عَلِيمٌ خَبِيرٌ",
      "text": {
        "fr": "Ô hommes ! Nous vous avons créés d’un mâle et d’une femelle, et Nous avons fait de vous des nations et des tribus, pour que vous vous entreconnaissiez. Le plus noble d’entre vous, auprès d’Allah, est le plus pieux. Allah est certes Omniscient et Grand- Connaisseur.",
        "en": "O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another. Indeed, the most noble of you in the sight of Allāh is the most righteous of you. Indeed, Allāh is Knowing and Aware."
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
      "arabic": "۞ قَوْلٌ مَّعْرُوفٌ وَمَغْفِرَةٌ خَيْرٌ مِّن صَدَقَةٍ يَتْبَعُهَآ أَذًى ۗ وَٱللَّهُ غَنِىٌّ حَلِيمٌ",
      "text": {
        "fr": "Une parole agréable et un pardon valent mieux qu’une aumône suivie d’un tort. Allah n’a besoin de rien, et Il est indulgent.",
        "en": "Kind speech and forgiveness are better than charity followed by injury. And Allāh is Free of need and Forbearing."
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
      "ref": "56:96",
      "surah": "Al-Wāqi‘a",
      "arabic": "فَسَبِّحْ بِٱسْمِ رَبِّكَ ٱلْعَظِيمِ",
      "text": {
        "fr": "Glorifie donc le nom de ton Seigneur, le Très Grand !",
        "en": "So exalt the name of your Lord, the Most Great."
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
      "arabic": "۞ قُلْ يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ",
      "text": {
        "fr": "Dis : \"Ô Mes serviteurs qui avez commis des excès à votre propre détriment, ne désespérez pas de la miséricorde d’Allah. Car Allah pardonne tous les péchés. Oui, c’est Lui le Pardonneur, le Très Miséricordieux.\"",
        "en": "Say, \"O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allāh. Indeed, Allāh forgives all sins. Indeed, it is He who is the Forgiving, the Merciful.\""
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
      "arabic": "لِيُوَفِّيَهُمْ أُجُورَهُمْ وَيَزِيدَهُم مِّن فَضْلِهِۦٓ ۚ إِنَّهُۥ غَفُورٌ شَكُورٌ",
      "text": {
        "fr": "afin [qu’Allah] les récompensent pleinement et leur ajoute Sa grâce. Il est Pardonneur et Reconnaissant.",
        "en": "That He may give them in full their rewards and increase for them of His bounty. Indeed, He is Forgiving and Appreciative."
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
      "arabic": "ذَٰلِكَ بِأَنَّ ٱللَّهَ هُوَ ٱلْحَقُّ وَأَنَّ مَا يَدْعُونَ مِن دُونِهِۦ هُوَ ٱلْبَـٰطِلُ وَأَنَّ ٱللَّهَ هُوَ ٱلْعَلِىُّ ٱلْكَبِيرُ",
      "text": {
        "fr": "C’est ainsi qu’Allah est Lui le Vrai, alors que ce qu’ils invoquent en dehors de Lui est le Faux ; et c’est Allah qui est le Sublime, le Grand.",
        "en": "That is because Allāh is the True Reality, and that which they call upon other than Him is falsehood, and because Allāh is the Most High, the Grand."
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
      "arabic": "عَـٰلِمُ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ ٱلْكَبِيرُ ٱلْمُتَعَالِ",
      "text": {
        "fr": "Le Connaisseur de ce qui est caché et de ce qui est apparent, Le Grand, Le Sublime.",
        "en": "[He is] Knower of the unseen and the witnessed, the Grand, the Exalted."
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
      "arabic": "فَإِن تَوَلَّوْا۟ فَقَدْ أَبْلَغْتُكُم مَّآ أُرْسِلْتُ بِهِۦٓ إِلَيْكُمْ ۚ وَيَسْتَخْلِفُ رَبِّى قَوْمًا غَيْرَكُمْ وَلَا تَضُرُّونَهُۥ شَيْـًٔا ۚ إِنَّ رَبِّى عَلَىٰ كُلِّ شَىْءٍ حَفِيظٌ",
      "text": {
        "fr": "Si vous vous détournez... voilà que je vous ai transmis [le message] que j’étais chargé de vous faire parvenir. Et mon Seigneur vous remplacera par un autre peuple, sans que vous ne Lui nuisiez en rien, car mon Seigneur, est gardien par excellence sur toute chose.\"",
        "en": "But if you turn away, then I have already conveyed that with which I was sent to you. My Lord will give succession to a people other than you, and you will not harm Him at all. Indeed my Lord is, over all things, Guardian.\""
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
      "arabic": "مَّن يَشْفَعْ شَفَـٰعَةً حَسَنَةً يَكُن لَّهُۥ نَصِيبٌ مِّنْهَا ۖ وَمَن يَشْفَعْ شَفَـٰعَةً سَيِّئَةً يَكُن لَّهُۥ كِفْلٌ مِّنْهَا ۗ وَكَانَ ٱللَّهُ عَلَىٰ كُلِّ شَىْءٍ مُّقِيتًا",
      "text": {
        "fr": "Quiconque intercède d’une bonne intercession, en aura une part; et quiconque intercède d’une mauvaise intercession portera une part de responsabilité. Et Allah veille sur toute chose.",
        "en": "Whoever intercedes for a good cause will have a share [i.e., reward] therefrom; and whoever intercedes for an evil cause will have a portion [i.e., burden] therefrom. And ever is Allāh, over all things, a Keeper."
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
      "ref": "33:39",
      "surah": "Al-Aḥzāb",
      "arabic": "ٱلَّذِينَ يُبَلِّغُونَ رِسَـٰلَـٰتِ ٱللَّهِ وَيَخْشَوْنَهُۥ وَلَا يَخْشَوْنَ أَحَدًا إِلَّا ٱللَّهَ ۗ وَكَفَىٰ بِٱللَّهِ حَسِيبًا",
      "text": {
        "fr": "Ceux qui communiquent les messages d’Allah, Le craignaient et ne redoutaient nul autre qu’Allah. Et Allah suffit pour tenir le compte de tout.",
        "en": "[Allāh praises] those who convey the messages of Allāh and fear Him and do not fear anyone but Allāh. And sufficient is Allāh as Accountant."
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
      "arabic": "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو ٱلْجَلَـٰلِ وَٱلْإِكْرَامِ",
      "text": {
        "fr": "[Seule] subsistera La Face [Wajh] de ton Seigneur, plein de majesté et de noblesse.",
        "en": "And there will remain the Face of your Lord, Owner of Majesty and Honor."
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
      "fr": "C’est le reproche du verset ci-dessus : la générosité d’Allah ne doit pas rendre négligent.",
      "en": "This is the reproach of the verse above: Allah’s generosity should not make one careless."
    },
    "practice": {
      "fr": "Être généreux de son temps, de son argent et de son pardon.",
      "en": "Be generous with your time, your money and your forgiveness."
    },
    "evidence": {
      "kind": "quran",
      "ref": "82:6",
      "surah": "Al-Infiṭār",
      "arabic": "يَـٰٓأَيُّهَا ٱلْإِنسَـٰنُ مَا غَرَّكَ بِرَبِّكَ ٱلْكَرِيمِ",
      "text": {
        "fr": "Ô homme ! Qu’est-ce qui t’a trompé au sujet de ton Seigneur, le Noble,",
        "en": "O mankind, what has deceived you concerning your Lord, the Generous,"
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
      "arabic": " يَـٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ ٱلَّذِى خَلَقَكُم مِّن نَّفْسٍ وَٰحِدَةٍ وَخَلَقَ مِنْهَا زَوْجَهَا وَبَثَّ مِنْهُمَا رِجَالًا كَثِيرًا وَنِسَآءً ۚ وَٱتَّقُوا۟ ٱللَّهَ ٱلَّذِى تَسَآءَلُونَ بِهِۦ وَٱلْأَرْحَامَ ۚ إِنَّ ٱللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا",
      "text": {
        "fr": "Ô hommes! Craignez votre Seigneur qui vous a créés d’un seul être, et a créé de celui-ci son épouse, et qui de ces deux-là a fait répandre (sur la terre) beaucoup d’hommes et de femmes. Craignez Allah au nom duquel vous vous implorez les uns les autres, et craignez de rompre les liens du sang. Certes Allah vous observe parfaitement.",
        "en": "O mankind, fear your Lord, who created you from one soul and created from it its mate and dispersed from both of them many men and women. And fear Allāh, through whom you ask one another, and the wombs. Indeed Allāh is ever, over you, an Observer."
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
      "fr": "« Et quand Mes serviteurs t’interrogent sur Moi, alors Je suis tout proche: Je réponds à l’appel de celui qui M’invoque quand il M’invoque. Qu’ils répondent donc à Mon appel, et qu’ils croient en Moi, afin qu’ils soient bien guidés. » (2:186) La réponse peut être ce qu’on a demandé, un mal écarté ou une récompense gardée pour l’au-delà (Aḥmad).",
      "en": "“And when My servants ask you, [O Muḥammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. So let them respond to Me [by obedience] and believe in Me that they may be [rightly] guided.” (2:186) The answer may be what was asked for, a harm averted or a reward kept for the Hereafter (Aḥmad)."
    },
    "practice": {
      "fr": "Invoquer souvent, avec certitude, sans se décourager si la réponse tarde.",
      "en": "Make supplication often, with certainty, without losing heart if the answer is delayed."
    },
    "evidence": {
      "kind": "quran",
      "ref": "37:75",
      "surah": "Aṣ-Ṣāffāt",
      "arabic": "وَلَقَدْ نَادَىٰنَا نُوحٌ فَلَنِعْمَ ٱلْمُجِيبُونَ",
      "text": {
        "fr": "Noé, en effet, fit appel à Nous qui sommes le Meilleur Répondeur (qui exauce les prières).",
        "en": "And Noah had certainly called Us, and [We are] the best of responders."
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
      "fr": "Allah dit que Sa miséricorde embrasse toute chose (7:156). Aucun péché, aucune situation n’est plus vaste que ce qu’Allah embrasse.",
      "en": "Allah says that His mercy encompasses all things (7:156). No sin and no situation is wider than what Allah encompasses."
    },
    "practice": {
      "fr": "Avoir l’esprit large envers les gens et ne pas restreindre la miséricorde d’Allah dans ses jugements.",
      "en": "Be broad-minded with people and do not narrow Allah’s mercy in your judgements."
    },
    "evidence": {
      "kind": "quran",
      "ref": "2:115",
      "surah": "Al-Baqara",
      "arabic": "وَلِلَّهِ ٱلْمَشْرِقُ وَٱلْمَغْرِبُ ۚ فَأَيْنَمَا تُوَلُّوا۟ فَثَمَّ وَجْهُ ٱللَّهِ ۚ إِنَّ ٱللَّهَ وَٰسِعٌ عَلِيمٌ",
      "text": {
        "fr": "A Allah seul appartiennent l’Est et l’Ouest. Où que vous vous tourniez, la Face d’Allah est donc là, car Allah a la grâce immense; Il est Omniscient.",
        "en": "And to Allāh belongs the east and the west. So wherever you [might] turn, there is the Face of Allāh. Indeed, Allāh is all-Encompassing and Knowing."
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
      "arabic": "وَهُوَ ٱلْقَاهِرُ فَوْقَ عِبَادِهِۦ ۚ وَهُوَ ٱلْحَكِيمُ ٱلْخَبِيرُ",
      "text": {
        "fr": "C’est Lui Dominateur Suprême au-dessus de Ses serviteurs; c’est Lui le Sage, le Parfaitement Informé.",
        "en": "And He is the subjugator over His servants. And He is the Wise, the Aware."
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
      "arabic": "وَهُوَ ٱلْغَفُورُ ٱلْوَدُودُ",
      "text": {
        "fr": "Et c’est Lui le Pardonneur, le Tout Affectueux,",
        "en": "And He is the Forgiving, the Affectionate,"
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
      "arabic": "قَالُوٓا۟ أَتَعْجَبِينَ مِنْ أَمْرِ ٱللَّهِ ۖ رَحْمَتُ ٱللَّهِ وَبَرَكَـٰتُهُۥ عَلَيْكُمْ أَهْلَ ٱلْبَيْتِ ۚ إِنَّهُۥ حَمِيدٌ مَّجِيدٌ",
      "text": {
        "fr": "Ils dirent : \"T’étonnes-tu de l’ordre d’Allah ? Que la miséricorde d’Allah et Ses bénédictions soient sur vous, gens de cette maison! Il est vraiment digne de louange et de glorification !\"",
        "en": "They said, \"Are you amazed at the decree of Allāh? May the mercy of Allāh and His blessings be upon you, people of the house. Indeed, He is Praiseworthy and Honorable.\""
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
      "arabic": "وَأَنَّ ٱلسَّاعَةَ ءَاتِيَةٌ لَّا رَيْبَ فِيهَا وَأَنَّ ٱللَّهَ يَبْعَثُ مَن فِى ٱلْقُبُورِ",
      "text": {
        "fr": "Et que l’Heure arrivera, pas de doute à son sujet, et qu’Allah ressuscitera ceux qui sont dans les tombes.",
        "en": "And [that they may know] that the Hour is coming - no doubt about it - and that Allāh will resurrect those in the graves."
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
      "ref": "85:9",
      "surah": "Al-Burūj",
      "arabic": "ٱلَّذِى لَهُۥ مُلْكُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۚ وَٱللَّهُ عَلَىٰ كُلِّ شَىْءٍ شَهِيدٌ",
      "text": {
        "fr": "Auquel appartient la royauté des cieux et de la Terre. Allah est témoin de toute chose.",
        "en": "To whom belongs the dominion of the heavens and the earth. And Allāh, over all things, is Witness."
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
      "arabic": "ذَٰلِكَ بِأَنَّ ٱللَّهَ هُوَ ٱلْحَقُّ وَأَنَّهُۥ يُحْىِ ٱلْمَوْتَىٰ وَأَنَّهُۥ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
      "text": {
        "fr": "Il en est ainsi parce qu’Allah est la vérité; et c’est Lui qui rend la vie aux morts; et c’est Lui qui est Omnipotent.",
        "en": "That is because Allāh is the True Reality and because He gives life to the dead and because He is over all things competent"
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
      "arabic": "ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدْ جَمَعُوا۟ لَكُمْ فَٱخْشَوْهُمْ فَزَادَهُمْ إِيمَـٰنًا وَقَالُوا۟ حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",
      "text": {
        "fr": "Certes, ceux auxquels l’on disait : \"Les gens se sont rassemblés contre vous; craignez-les !\" - Cela accrut leur foi - et ils dirent : \"Allah nous suffit; et Il est notre meilleur garant !\"",
        "en": "Those to whom people [i.e., hypocrites] said, \"Indeed, the people have gathered against you, so fear them.\" But it [merely] increased them in faith, and they said, \"Sufficient for us is Allāh, and [He is] the best Disposer of affairs.\""
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
      "arabic": "مَا قَدَرُوا۟ ٱللَّهَ حَقَّ قَدْرِهِۦٓ ۗ إِنَّ ٱللَّهَ لَقَوِىٌّ عَزِيزٌ",
      "text": {
        "fr": "Ils n’ont pas estimé Allah à sa juste valeur ; Allah est certes Fort et Puissant.",
        "en": "They have not appraised Allāh with true appraisal. Indeed, Allāh is Powerful and Exalted in Might."
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
      "arabic": "إِنَّ ٱللَّهَ هُوَ ٱلرَّزَّاقُ ذُو ٱلْقُوَّةِ ٱلْمَتِينُ",
      "text": {
        "fr": "En vérité, c’est Allah qui est le Grand Pourvoyeur, Le Détenteur de la force, l’Inébranlable.",
        "en": "Indeed, it is Allāh who is the [continual] Provider, the firm possessor of strength."
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
      "fr": "Sa protection fait sortir les croyants des ténèbres vers la lumière (2:257).",
      "en": "His protection brings the believers out of darkness into the light (2:257)."
    },
    "practice": {
      "fr": "Prendre Allah pour allié en faisant ce qu’Il aime, et choisir ses amis parmi les gens de bien.",
      "en": "Take Allah as your ally by doing what He loves, and choose your friends among good people."
    },
    "evidence": {
      "kind": "quran",
      "ref": "42:28",
      "surah": "Ash-Shūrā",
      "arabic": "وَهُوَ ٱلَّذِى يُنَزِّلُ ٱلْغَيْثَ مِنۢ بَعْدِ مَا قَنَطُوا۟ وَيَنشُرُ رَحْمَتَهُۥ ۚ وَهُوَ ٱلْوَلِىُّ ٱلْحَمِيدُ",
      "text": {
        "fr": "Et c’est Lui qui fait descendre la pluie après qu’on en a désespéré, et répand Sa miséricorde. Et c’est Lui le Maître, le Digne de louange.",
        "en": "And it is He who sends down the rain after they had despaired and spreads His mercy. And He is the Protector, the Praiseworthy."
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
      "arabic": " الٓر ۚ كِتَـٰبٌ أَنزَلْنَـٰهُ إِلَيْكَ لِتُخْرِجَ ٱلنَّاسَ مِنَ ٱلظُّلُمَـٰتِ إِلَى ٱلنُّورِ بِإِذْنِ رَبِّهِمْ إِلَىٰ صِرَٰطِ ٱلْعَزِيزِ ٱلْحَمِيدِ",
      "text": {
        "fr": "Alif, Lâm, Râ . (Voici) un livre que nous avons fait descendre sur toi, afin que - par la permission de leur Seigneur - tu fasses sortir les gens des ténèbres vers la lumière, sur la voie du Tout Puissant, du Digne de louange,",
        "en": "Alif, Lām, Rā. [This is] a Book which We have revealed to you, [O Muḥammad], that you might bring mankind out of darknesses into the light by permission of their Lord - to the path of the Exalted in Might, the Praiseworthy -"
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
      "arabic": "لِّيَعْلَمَ أَن قَدْ أَبْلَغُوا۟ رِسَـٰلَـٰتِ رَبِّهِمْ وَأَحَاطَ بِمَا لَدَيْهِمْ وَأَحْصَىٰ كُلَّ شَىْءٍ عَدَدًۢا",
      "text": {
        "fr": "afin qu’Il sache s’ils ont bien transmis les messages de leur Seigneur. Il cerne (de Son savoir) ce qui est avec eux, et dénombre exactement toute chose.\"",
        "en": "That he [i.e., Muḥammad (ﷺ)] may know that they have conveyed the messages of their Lord; and He has encompassed whatever is with them and has enumerated all things in number."
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
      "arabic": "إِنَّهُۥ هُوَ يُبْدِئُ وَيُعِيدُ",
      "text": {
        "fr": "C’est Lui, certes, qui commence (la création) et la refait.",
        "en": "Indeed, it is He who originates [creation] and repeats."
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
      "arabic": "إِنَّهُۥ هُوَ يُبْدِئُ وَيُعِيدُ",
      "text": {
        "fr": "C’est Lui, certes, qui commence (la création) et la refait.",
        "en": "Indeed, it is He who originates [creation] and repeats."
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
      "arabic": "لَهُۥ مُلْكُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۖ يُحْىِۦ وَيُمِيتُ ۖ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
      "text": {
        "fr": "A Lui appartient la souveraineté des cieux et de la terre. Il fait vivre et il fait mourir, et Il est Omnipotent.",
        "en": "His is the dominion of the heavens and earth. He gives life and causes death, and He is over all things competent."
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
      "fr": "Le verset ci-dessus le dit : la vie et la mort sont créées pour éprouver les gens sur la qualité de leurs actes.",
      "en": "The verse above says it: life and death are created to test people on the quality of their deeds."
    },
    "practice": {
      "fr": "Se souvenir souvent de la mort, comme le recommandait le Prophète ﷺ, pour bien vivre et non pour avoir peur.",
      "en": "Remember death often, as the Prophet ﷺ advised, in order to live well, not to be afraid."
    },
    "evidence": {
      "kind": "quran",
      "ref": "67:2",
      "surah": "Al-Mulk",
      "arabic": "ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ",
      "text": {
        "fr": "Celui qui a créé la mort et la vie afin de vous éprouver (et de savoir) qui de vous est le meilleur en œuvre, et c’est Lui le Puissant, le Pardonneur.",
        "en": "[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -"
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
      "arabic": "وَتَوَكَّلْ عَلَى ٱلْحَىِّ ٱلَّذِى لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِۦ ۚ وَكَفَىٰ بِهِۦ بِذُنُوبِ عِبَادِهِۦ خَبِيرًا",
      "text": {
        "fr": "Et place ta confiance en le Vivant qui ne meurt jamais. Et par Sa louange, glorifie-Le. Et il suffit comme Parfait Informé des péchés de Ses serviteurs.",
        "en": "And rely upon the Ever-Living who does not die, and exalt [Allāh] with His praise. And sufficient is He to be, with the sins of His servants, [fully] Aware -"
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
      "ref": "3:2",
      "surah": "Āl ‘Imrān",
      "arabic": "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ",
      "text": {
        "fr": "Allah! Pas de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même (Al Qayyum) .",
        "en": "Allāh - there is no deity except Him, the Ever-Living, the Self-Sustaining."
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
        "fr": "Ce nom figure dans la liste rapportée par at-Tirmidhî (3507). Son sens est confirmé par le Coran : « Ô hommes, vous êtes les indigents ayant besoin d’Allah, et c’est Allah, Lui qui se dispense de tout et Il est Le Digne de louange. » (35:15)",
        "en": "This name appears in the list reported by at-Tirmidhî (3507). Its meaning is confirmed by the Quran: “O mankind, you are those in need of Allāh, while Allāh is the Free of need, the Praiseworthy.” (35:15)"
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
      "arabic": "ذُو ٱلْعَرْشِ ٱلْمَجِيدُ",
      "text": {
        "fr": "Le Maître du Trône, le Tout Glorieux,",
        "en": "Honorable Owner of the Throne,"
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
      "ref": "12:39",
      "surah": "Yūsuf",
      "arabic": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ ءَأَرْبَابٌ مُّتَفَرِّقُونَ خَيْرٌ أَمِ ٱللَّهُ ٱلْوَٰحِدُ ٱلْقَهَّارُ",
      "text": {
        "fr": "Ô mes deux compagnons de prison ! Qui est le meilleur : des Seigneurs éparpillés ou Allah, l’Unique, le Dominateur suprême ?",
        "en": "O [my] two companions of prison, are separate lords better or Allāh, the One, the Prevailing?"
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
      "arabic": " قُلْ هُوَ ٱللَّهُ أَحَدٌ",
      "text": {
        "fr": "Dis : \"Il est Allah, Unique.",
        "en": "Say, \"He is Allāh, [who is] One,"
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
      "arabic": "ٱللَّهُ ٱلصَّمَدُ",
      "text": {
        "fr": "Allah, Le Seul à être imploré pour ce que nous désirons.",
        "en": "Allāh, the Eternal Refuge."
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
      "arabic": "أَلَيْسَ ذَٰلِكَ بِقَـٰدِرٍ عَلَىٰٓ أَن يُحْـِۧىَ ٱلْمَوْتَىٰ",
      "text": {
        "fr": "Celui-là (Allah) n’est-Il pas capable de faire revivre les morts ?",
        "en": "Is not that [Creator] Able to give life to the dead?"
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
      "arabic": "فِى مَقْعَدِ صِدْقٍ عِندَ مَلِيكٍ مُّقْتَدِرٍۭ",
      "text": {
        "fr": "dans un séjour de vérité, auprès d’un Souverain Omnipotent.",
        "en": "In a seat of honor near a Sovereign, Perfect in Ability."
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
      "arabic": "هُوَ ٱلْأَوَّلُ وَٱلْـَٔاخِرُ وَٱلظَّـٰهِرُ وَٱلْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché et Il est Omniscient.",
        "en": "He is the First and the Last, the Ascendant and the Intimate, and He is, of all things, Knowing."
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
      "arabic": "هُوَ ٱلْأَوَّلُ وَٱلْـَٔاخِرُ وَٱلظَّـٰهِرُ وَٱلْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché et Il est Omniscient.",
        "en": "He is the First and the Last, the Ascendant and the Intimate, and He is, of all things, Knowing."
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
      "arabic": "هُوَ ٱلْأَوَّلُ وَٱلْـَٔاخِرُ وَٱلظَّـٰهِرُ وَٱلْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché et Il est Omniscient.",
        "en": "He is the First and the Last, the Ascendant and the Intimate, and He is, of all things, Knowing."
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
      "arabic": "هُوَ ٱلْأَوَّلُ وَٱلْـَٔاخِرُ وَٱلظَّـٰهِرُ وَٱلْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ",
      "text": {
        "fr": "C’est Lui le Premier et le Dernier, l’Apparent et le Caché et Il est Omniscient.",
        "en": "He is the First and the Last, the Ascendant and the Intimate, and He is, of all things, Knowing."
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
      "arabic": "لَهُۥ مُعَقِّبَـٰتٌ مِّنۢ بَيْنِ يَدَيْهِ وَمِنْ خَلْفِهِۦ يَحْفَظُونَهُۥ مِنْ أَمْرِ ٱللَّهِ ۗ إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ ۗ وَإِذَآ أَرَادَ ٱللَّهُ بِقَوْمٍ سُوٓءًا فَلَا مَرَدَّ لَهُۥ ۚ وَمَا لَهُم مِّن دُونِهِۦ مِن وَالٍ",
      "text": {
        "fr": "Il [l’homme] a par devant lui et derrière lui des Anges qui se relaient et qui veillent sur lui par ordre d’Allah. En vérité, Allah ne modifie point l’état d’un peuple, tant que les [individus qui le composent] ne modifient pas ce qui est en eux-mêmes. Et lorsqu’Allah veut [infliger] un mal à un peuple, nul ne peut le repousser et ils n’ont en dehors de Lui aucun protecteur.",
        "en": "For him [i.e., each one] are successive [angels] before and behind him who protect him by the decree of Allāh. Indeed, Allāh will not change the condition of a people until they change what is in themselves. And when Allāh intends for a people ill, there is no repelling it. And there is not for them besides Him any patron."
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
      "arabic": "عَـٰلِمُ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ ٱلْكَبِيرُ ٱلْمُتَعَالِ",
      "text": {
        "fr": "Le Connaisseur de ce qui est caché et de ce qui est apparent, Le Grand, Le Sublime.",
        "en": "[He is] Knower of the unseen and the witnessed, the Grand, the Exalted."
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
      "fr": "Ce verset rapporte les paroles des gens du Paradis : ils invoquaient Allah dans ce monde, et ils Le reconnaissent comme le Bienfaisant.",
      "en": "This verse reports the words of the people of Paradise: they used to call upon Allah in this world, and they recognise Him as the Beneficent."
    },
    "practice": {
      "fr": "Faire le bien autour de soi, en commençant par ses parents (birr al-wālidayn).",
      "en": "Do good around you, starting with your parents (birr al-wālidayn)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "52:28",
      "surah": "Aṭ-Ṭūr",
      "arabic": "إِنَّا كُنَّا مِن قَبْلُ نَدْعُوهُ ۖ إِنَّهُۥ هُوَ ٱلْبَرُّ ٱلرَّحِيمُ",
      "text": {
        "fr": "Antérieurement, nous L’invoquions. C’est Lui certes, le Charitable, le Très Miséricordieux.\"",
        "en": "Indeed, we used to supplicate Him before. Indeed, it is He who is the Beneficent, the Merciful.\""
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
      "arabic": "فَتَلَقَّىٰٓ ءَادَمُ مِن رَّبِّهِۦ كَلِمَـٰتٍ فَتَابَ عَلَيْهِ ۚ إِنَّهُۥ هُوَ ٱلتَّوَّابُ ٱلرَّحِيمُ",
      "text": {
        "fr": "Puis, Adam reçut de son Seigneur des paroles, et Allah agréa son repentir car c’est Lui, certes, l’Accueillant au repentir, le Miséricordieux.",
        "en": "Then Adam received from his Lord [some] words, and He accepted his repentance. Indeed, it is He who is the Accepting of Repentance, the Merciful."
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
      "arabic": "مِن قَبْلُ هُدًى لِّلنَّاسِ وَأَنزَلَ ٱلْفُرْقَانَ ۗ إِنَّ ٱلَّذِينَ كَفَرُوا۟ بِـَٔايَـٰتِ ٱللَّهِ لَهُمْ عَذَابٌ شَدِيدٌ ۗ وَٱللَّهُ عَزِيزٌ ذُو ٱنتِقَامٍ",
      "text": {
        "fr": "auparavant, en tant que guide pour les gens. Et Il a fait descendre le Discernement. Ceux qui ne croient pas aux signes d’Allah auront, certes, un dur châtiment! Et, Allah est Puissant, Détenteur du pouvoir de punir.",
        "en": "Before, as guidance for the people. And He revealed the Criterion [i.e., the Qur’ān]. Indeed, those who disbelieve in the verses of Allāh will have a severe punishment, and Allāh is Exalted in Might, the Owner of Retribution."
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
      "arabic": "فَأُو۟لَـٰٓئِكَ عَسَى ٱللَّهُ أَن يَعْفُوَ عَنْهُمْ ۚ وَكَانَ ٱللَّهُ عَفُوًّا غَفُورًا",
      "text": {
        "fr": "À ceux-là, Allah accordera le pardon. Et Allah est Clément et Pardonneur.",
        "en": "For those it is expected that Allāh will pardon them, and Allāh is ever Pardoning and Forgiving."
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
      "ref": "57:9",
      "surah": "Al-Ḥadīd",
      "arabic": "هُوَ ٱلَّذِى يُنَزِّلُ عَلَىٰ عَبْدِهِۦٓ ءَايَـٰتٍۭ بَيِّنَـٰتٍ لِّيُخْرِجَكُم مِّنَ ٱلظُّلُمَـٰتِ إِلَى ٱلنُّورِ ۚ وَإِنَّ ٱللَّهَ بِكُمْ لَرَءُوفٌ رَّحِيمٌ",
      "text": {
        "fr": "C’est Lui qui fait descendre sur Son serviteur des versets claires, afin qu’il vous fasse sortir des ténèbres à la lumière; et assurément Allah est Compatissant envers vous, et Très Miséricordieux.",
        "en": "It is He who sends down upon His Servant [Muḥammad (ﷺ)] verses of clear evidence that He may bring you out from darknesses into the light. And indeed, Allāh is to you Kind and Merciful."
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
      "arabic": "قُلِ ٱللَّهُمَّ مَـٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ ۖ بِيَدِكَ ٱلْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
      "text": {
        "fr": "Dis: “Ô Allah! Maître de l’autorité absolue. Tu donnes l’autorité à qui Tu veux, et Tu arraches l’autorité à qui Tu veux; et Tu donnes la puissance à qui Tu veux, et Tu humilies qui Tu veux. Le bien est en Ta main et Tu es Omnipotent.",
        "en": "Say, \"O Allāh, Owner of Sovereignty, You give sovereignty to whom You will and You take sovereignty away from whom You will. You honor whom You will and You humble whom You will. In Your hand is [all] good. Indeed, You are over all things competent."
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
      "arabic": "تَبَـٰرَكَ ٱسْمُ رَبِّكَ ذِى ٱلْجَلَـٰلِ وَٱلْإِكْرَامِ",
      "text": {
        "fr": "Béni soit le Nom de ton Seigneur, Plein de Majesté et de Munificence !",
        "en": "Blessed is the name of your Lord, Owner of Majesty and Honor."
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
      "arabic": "شَهِدَ ٱللَّهُ أَنَّهُۥ لَآ إِلَـٰهَ إِلَّا هُوَ وَٱلْمَلَـٰٓئِكَةُ وَأُو۟لُوا۟ ٱلْعِلْمِ قَآئِمًۢا بِٱلْقِسْطِ ۚ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ",
      "text": {
        "fr": "Allah atteste, et aussi les Anges et les doués de science, qu’il n’y a point de divinité à part Lui, le Mainteneur de la justice. Point de divinité à part Lui, le Puissant, le Sage !",
        "en": "Allāh witnesses that there is no deity except Him, and [so do] the angels and those of knowledge - [that He is] maintaining [creation] in justice. There is no deity except Him, the Exalted in Might, the Wise."
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
      "arabic": "رَبَّنَآ إِنَّكَ جَامِعُ ٱلنَّاسِ لِيَوْمٍ لَّا رَيْبَ فِيهِ ۚ إِنَّ ٱللَّهَ لَا يُخْلِفُ ٱلْمِيعَادَ",
      "text": {
        "fr": "Seigneur! C’est Toi qui rassembleras les gens en un Jour au sujet duquel il n’y a aucun doute. Allah, vraiment, ne manque jamais à Sa promesse. ”",
        "en": "Our Lord, surely You will gather the people for a Day about which there is no doubt. Indeed, Allāh does not fail in His promise.\""
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
      "arabic": "۞ يَـٰٓأَيُّهَا ٱلنَّاسُ أَنتُمُ ٱلْفُقَرَآءُ إِلَى ٱللَّهِ ۖ وَٱللَّهُ هُوَ ٱلْغَنِىُّ ٱلْحَمِيدُ",
      "text": {
        "fr": "Ô hommes, vous êtes les indigents ayant besoin d’Allah, et c’est Allah, Lui qui se dispense de tout et Il est Le Digne de louange.",
        "en": "O mankind, you are those in need of Allāh, while Allāh is the Free of need, the Praiseworthy."
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
      "arabic": "وَأَنَّهُۥ هُوَ أَغْنَىٰ وَأَقْنَىٰ",
      "text": {
        "fr": "et c’est Lui qui a enrichi et qui a fait acquérir.",
        "en": "And that it is He who enriches and suffices"
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
      "arabic": "وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يُرِدْكَ بِخَيْرٍ فَلَا رَآدَّ لِفَضْلِهِۦ ۚ يُصِيبُ بِهِۦ مَن يَشَآءُ مِنْ عِبَادِهِۦ ۚ وَهُوَ ٱلْغَفُورُ ٱلرَّحِيمُ",
      "text": {
        "fr": "Et si Allah fait qu’un mal te touche, nul ne peut l’écarter en dehors de Lui. Et s’Il te veut un bien, nul ne peut repousser Sa grâce. Il en gratifie qui Il veut parmi Ses serviteurs. Et c’est Lui le Pardonneur, le Miséricordieux.",
        "en": "And if Allāh should touch you with adversity, there is no remover of it except Him; and if He intends for you good, then there is no repeller of His bounty. He causes it to reach whom He wills of His servants. And He is the Forgiving, the Merciful."
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
      "arabic": "وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يُرِدْكَ بِخَيْرٍ فَلَا رَآدَّ لِفَضْلِهِۦ ۚ يُصِيبُ بِهِۦ مَن يَشَآءُ مِنْ عِبَادِهِۦ ۚ وَهُوَ ٱلْغَفُورُ ٱلرَّحِيمُ",
      "text": {
        "fr": "Et si Allah fait qu’un mal te touche, nul ne peut l’écarter en dehors de Lui. Et s’Il te veut un bien, nul ne peut repousser Sa grâce. Il en gratifie qui Il veut parmi Ses serviteurs. Et c’est Lui le Pardonneur, le Miséricordieux.",
        "en": "And if Allāh should touch you with adversity, there is no remover of it except Him; and if He intends for you good, then there is no repeller of His bounty. He causes it to reach whom He wills of His servants. And He is the Forgiving, the Merciful."
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
      "arabic": "۞ ٱللَّهُ نُورُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۚ مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍ فِيهَا مِصْبَاحٌ ۖ ٱلْمِصْبَاحُ فِى زُجَاجَةٍ ۖ ٱلزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌ دُرِّىٌّ يُوقَدُ مِن شَجَرَةٍ مُّبَـٰرَكَةٍ زَيْتُونَةٍ لَّا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ يَكَادُ زَيْتُهَا يُضِىٓءُ وَلَوْ لَمْ تَمْسَسْهُ نَارٌ ۚ نُّورٌ عَلَىٰ نُورٍ ۗ يَهْدِى ٱللَّهُ لِنُورِهِۦ مَن يَشَآءُ ۚ وَيَضْرِبُ ٱللَّهُ ٱلْأَمْثَـٰلَ لِلنَّاسِ ۗ وَٱللَّهُ بِكُلِّ شَىْءٍ عَلِيمٌ",
      "text": {
        "fr": "Allah est la Lumière des cieux et de la terre. Sa lumière est semblable à une niche où se trouve une lampe. La lampe est dans un (récipient de) cristal et celui-ci ressemble à un astre de grand éclat ; son combustible vient d’un arbre béni: un olivier ni oriental ni occidental dont l’huile semble éclairer sans même que le feu la touche. Lumière sur lumière. Allah guide vers Sa lumière qui Il veut. Et Allah propose aux hommes des paraboles et Allah est Omniscient.",
        "en": "Allāh is the Light of the heavens and the earth. The example of His light is like a niche within which is a lamp; the lamp is within glass, the glass as if it were a pearly [white] star lit from [the oil of] a blessed olive tree, neither of the east nor of the west, whose oil would almost glow even if untouched by fire. Light upon light. Allāh guides to His light whom He wills. And Allāh presents examples for the people, and Allāh is Knowing of all things."
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
      "fr": "Dans chaque rak‘a, on demande : « Guide-nous dans le droit chemin, » (1:6) Même le croyant a besoin de cette guidance chaque jour.",
      "en": "In every rak‘a, we ask: “Guide us to the straight path -” (1:6) Even the believer needs this guidance every day."
    },
    "practice": {
      "fr": "Demander la guidance avec sincérité, rechercher la vérité et agir selon ce qu’on apprend.",
      "en": "Ask for guidance sincerely, seek the truth and act on what you learn."
    },
    "evidence": {
      "kind": "quran",
      "ref": "25:31",
      "surah": "Al-Furqān",
      "arabic": "وَكَذَٰلِكَ جَعَلْنَا لِكُلِّ نَبِىٍّ عَدُوًّا مِّنَ ٱلْمُجْرِمِينَ ۗ وَكَفَىٰ بِرَبِّكَ هَادِيًا وَنَصِيرًا",
      "text": {
        "fr": "Et c’est ainsi que Nous fîmes à chaque Prophète un ennemi parmi les criminels. Mais ton Seigneur suffit comme guide et comme secoureur.",
        "en": "And thus have We made for every prophet an enemy from among the criminals. But sufficient is your Lord as a guide and a helper."
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
      "arabic": "بَدِيعُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۖ وَإِذَا قَضَىٰٓ أَمْرًا فَإِنَّمَا يَقُولُ لَهُۥ كُن فَيَكُونُ",
      "text": {
        "fr": "Il est le Créateur des cieux et de la terre à partir du néant! Lorsqu’Il décide une chose, Il dit seulement: \"Sois!\", et elle est aussitôt.",
        "en": "Originator of the heavens and the earth. When He decrees a matter, He only says to it, \"Be,\" and it is."
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
      "fr": "« Tout ce qui est sur elle [la terre] doit disparaître, » (55:26) Lui seul demeure, et ce qui est fait pour Lui reste.",
      "en": "“Everyone upon it [i.e., the earth] will perish,” (55:26) He alone remains, and what is done for Him remains."
    },
    "practice": {
      "fr": "Investir dans ce qui reste : la sadaqa continue, la science utile, l’enfant pieux (Muslim).",
      "en": "Invest in what lasts: ongoing charity, beneficial knowledge, a righteous child (Muslim)."
    },
    "evidence": {
      "kind": "quran",
      "ref": "55:27",
      "surah": "Ar-Raḥmān",
      "arabic": "وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو ٱلْجَلَـٰلِ وَٱلْإِكْرَامِ",
      "text": {
        "fr": "[Seule] subsistera La Face [Wajh] de ton Seigneur, plein de majesté et de noblesse.",
        "en": "And there will remain the Face of your Lord, Owner of Majesty and Honor."
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
      "fr": "Zakariyyā invoquait ainsi : « Et Zacharie, quand il implora son Seigneur : \"Seigneur ! Ne me laisse pas seul alors que Tu es le meilleur des héritiers !\" » (21:89)",
      "en": "Zakariyyā prayed: “And [mention] Zechariah, when he called to his Lord, \"My Lord, do not leave me alone [with no heir], while You are the best of inheritors.\"” (21:89)"
    },
    "practice": {
      "fr": "Ne pas s’attacher à ce qu’on laissera derrière soi, et donner de son vivant.",
      "en": "Do not cling to what you will leave behind, and give while you are alive."
    },
    "evidence": {
      "kind": "quran",
      "ref": "15:23",
      "surah": "Al-Ḥijr",
      "arabic": "وَإِنَّا لَنَحْنُ نُحْىِۦ وَنُمِيتُ وَنَحْنُ ٱلْوَٰرِثُونَ",
      "text": {
        "fr": "Et c’est bien Nous qui donnons la vie et donnons la mort, et c’est Nous qui sommes l’héritier [de tout].",
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
      "arabic": "إِذْ أَوَى ٱلْفِتْيَةُ إِلَى ٱلْكَهْفِ فَقَالُوا۟ رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
      "text": {
        "fr": "Quand ces jeunes gens se réfugièrent dans la caverne, ils dirent : \"Ô notre Seigneur ! Donne-nous de Ta part une miséricorde ! Et assure nous la droiture dans tout ce qui nous concerne.\"",
        "en": "[Mention] when the youths retreated to the cave and said, \"Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.\""
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
