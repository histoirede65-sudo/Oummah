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
  /** Only a cited verse or hadith, quoted word for word. */
  reflection?: Localized;
  evidence: AllahNameEvidence;
};

export type AllahName = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  reflection?: string;
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
// Hadith quotes are word for word from the collections (fawazahmed0 fra/eng). Never add text that is not a cited source.
const ENTRIES: AllahNameEntry[] = [
  {
    "id": 1,
    "arabic": "الرَّحْمَٰنُ",
    "transliteration": "Ar-Raḥmān",
    "translation": {
      "fr": "Le Tout Miséricordieux",
      "en": "The Most Merciful"
    },
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Allah a partagé la miséricorde en cent parties. Il en a gardé quatre-vingt-dix-neuf auprès de Lui et a fait descendre une seule partie sur la terre. Grâce à cette unique part, les créatures sont compatissantes entre elles » (al-Bukhârî 6000).",
      "en": "The Prophet ﷺ said: “Allah divided Mercy into one hundred parts. He kept ninety nine parts with Him and sent down one part to the earth, and because of that, its one single part, His Creations are merciful to each other” (al-Bukhârî 6000)."
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
    "reflection": {
      "fr": "Devant une captive qui allaitait chaque enfant qu’elle trouvait, le Prophète ﷺ a dit : « Allah est encore plus miséricordieux envers Ses serviteurs que cette femme envers son enfant. » (al-Bukhârî 5999)",
      "en": "Seeing a captive woman nursing every child she found, the Prophet ﷺ said: “Allah is more merciful to His slaves than this lady to her son.” (al-Bukhârî 5999)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Allah tiendra toute la terre, et enroulera tous les cieux dans Sa Main droite, puis Il dira : ‘Je suis le Roi ; où sont les rois de la terre ?’ » (al-Bukhârî 4812)",
      "en": "The Prophet ﷺ said: “Allah will hold the whole earth, and roll all the heavens up in His Right Hand, and then He will say, ‘I am the King; where are the kings of the earth?’” (al-Bukhârî 4812)"
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
    "reflection": {
      "fr": "À la fin du witr, le Prophète ﷺ disait trois fois : « Subhanal-Malikil-Quddus » (Gloire au Souverain, le Très Saint) (an-Nasâ’î 1699, authentifié par al-Albânî).",
      "en": "At the end of the witr, the Prophet ﷺ would say three times: “Subhanal-Malikil-Quddus” (Glory be to the Sovereign, the Most Holy) (an-Nasâ’î 1699, graded authentic by al-Albânî)."
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
    "reflection": {
      "fr": "Lorsqu’il terminait sa prière, le Prophète ﷺ disait : « Ô Allah ! Tu es la Paix, et la paix vient de Toi ; Béni sois-Tu, Ô Détenteur de Majesté et d’Honneur. » (Muslim 591)",
      "en": "When he finished his prayer, the Prophet ﷺ would say: “O Allah! Thou art Peace, and peace comes from Thee; Blessed art Thou, O Possessor of Glory and Honour.” (Muslim 591)"
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
    "reflection": {
      "fr": "« Or c’est à Allah qu’est la puissance ainsi qu’à Son Messager et aux croyants. » (63:8)",
      "en": "“And to Allāh belongs [all] honor, and to His Messenger, and to the believers” (63:8)"
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
    "reflection": {
      "fr": "Entre les deux prosternations, le Prophète ﷺ disait : « Allahummaghfir li, warhamni, wajburni, wahdini, warzuqni » (at-Tirmidhî 284, authentifié par al-Albânî).",
      "en": "Between the two prostrations, the Prophet ﷺ would say: “Allahummaghfir li, warhamni, wajburni, wahdini, warzuqni. O Allah! Pardon me, have mercy on me, help me, guide me, and grant me sustenance” (at-Tirmidhî 284, graded authentic by al-Albânî)."
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Celui qui a dans son cœur ne serait-ce qu’un grain de moutarde d’orgueil n’entrera pas au Paradis. » (Muslim 91)",
      "en": "The Prophet ﷺ said: “He who has in his heart the weight of a mustard seed of pride shall not enter Paradise.” (Muslim 91)"
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
    "reflection": {
      "fr": "Sulaymân a dit : « C’est Toi le grand Dispensateur. » (38:35)",
      "en": "Solomon said: “Indeed, You are the Bestower.” (38:35)"
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
    "reflection": {
      "fr": "« Il n’y a point de bête sur Terre dont la subsistance n’incombe à Allah qui connaît son gîte et son dépôt; tout est dans un Livre explicite. » (11:6)",
      "en": "“And there is no creature on earth but that upon Allāh is its provision, and He knows its place of dwelling and place of storage. All is in a clear register.” (11:6)"
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
    "reflection": {
      "fr": "« Ce qu’Allah accorde en miséricorde aux gens, il n’est personne à pouvoir le retenir. Et ce qu’Il retient, il n’est personne à le relâcher après Lui. » (35:2)",
      "en": "“Whatever Allāh grants to people of mercy - none can withhold it; and whatever He withholds - none can release it thereafter.” (35:2)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « C’est Allah qui fixe les prix, qui retient, qui donne largement et qui accorde la subsistance. » (Abû Dâwûd 3451, authentifié par al-Albânî)",
      "en": "The Prophet ﷺ said: “Allah is the one Who fixes prices, Who withholds, gives lavishly and provides” (Abû Dâwûd 3451, graded authentic by al-Albânî)."
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Le Prophète ﷺ a dit : « Son Trône est sur l’eau et dans Son autre Main se trouve la balance (de la Justice), et Il élève et abaisse qui Il veut. »",
        "en": "The Prophet ﷺ said: “His Throne is over the water and in His other Hand is the balance (of Justice) and He raises and lowers (whomever He will).”"
      },
      "source": {
        "fr": "al-Bukhârî 7411",
        "en": "al-Bukhârî 7411"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « … personne ne s’humilie pour Allah sans qu’Allah n’élève son rang. » (Muslim 2588)",
      "en": "The Prophet ﷺ said: “… no one humbles himself for the sake of Allah except that Allah raises his status.” (Muslim 2588)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Vous n’appelez pas un sourd ou quelqu’un d’absent, mais Celui qui est avec vous. Sans aucun doute, Il entend tout et Il est tout proche. » (al-Bukhârî 2992)",
      "en": "The Prophet ﷺ said: “You are not calling a deaf or an absent one, but One Who is with you, no doubt He is All-Hearer, ever Near (to all things).” (al-Bukhârî 2992)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a défini l’Ihsan : « C’est adorer Allah comme si tu Le voyais, et si tu ne Le vois pas, sache qu’Il te voit. » (al-Bukhârî 50)",
      "en": "The Prophet ﷺ defined Ihsan: “To worship Allah as if you see Him, and if you cannot achieve this state of devotion then you must consider that He is looking at you.” (al-Bukhârî 50)"
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
    "reflection": {
      "fr": "Allah a dit : « Ô Mes serviteurs, Je Me suis interdit l’injustice à Moi-même et Je l’ai rendue interdite entre vous » (Muslim 2577).",
      "en": "Allah said: “O My servants, I have forbidden oppression for Myself and have made it forbidden amongst you” (Muslim 2577)."
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
    "reflection": {
      "fr": "Yûsuf a dit : « Mon Seigneur est plein de douceur pour ce qu’Il veut. » (12:100)",
      "en": "Joseph said: “Indeed, my Lord is Subtle in what He wills.” (12:100)"
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
    "reflection": {
      "fr": "Dans les moments difficiles, le Prophète ﷺ invoquait : « Il n’y a pas de divinité en dehors d’Allah, le Grand, le Tolérant. » (Muslim 2730)",
      "en": "In times of trouble, the Prophet ﷺ would supplicate: “There is no god but Allah, the Great, the Tolerant” (Muslim 2730)."
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
    "reflection": {
      "fr": "En s’inclinant, le Prophète ﷺ disait : « Gloire à mon Seigneur le Puissant » (Muslim 772).",
      "en": "When bowing, the Prophet ﷺ would say: “Glory be to my Mighty Lord” (Muslim 772)."
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Pendant qu’un homme marchait sur un chemin, il a vu une branche épineuse et l’a enlevée du chemin. Allah a été satisfait de son action et lui a pardonné. » (al-Bukhârî 652)",
      "en": "The Prophet ﷺ said: “While a man was going on a way, he saw a thorny branch and removed it from the way and Allah became pleased by his action and forgave him for that.” (al-Bukhârî 652)"
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
    "reflection": {
      "fr": "En se prosternant, le Prophète ﷺ disait : « Gloire à mon Seigneur le Très-Haut » (Muslim 772).",
      "en": "When prostrating, the Prophet ﷺ would say: “Glory be to my Lord most High” (Muslim 772)."
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
    "reflection": {
      "fr": "« Et quand Mes serviteurs t’interrogent sur Moi, alors Je suis tout proche: Je réponds à l’appel de celui qui M’invoque quand il M’invoque. Qu’ils répondent donc à Mon appel, et qu’ils croient en Moi, afin qu’ils soient bien guidés. » (2:186)",
      "en": "“And when My servants ask you, [O Muḥammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. So let them respond to Me [by obedience] and believe in Me that they may be [rightly] guided.” (2:186)"
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
    "reflection": {
      "fr": "Allah dit : « Et Ma miséricorde embrasse toute chose. » (7:156)",
      "en": "Allāh said: “My mercy encompasses all things.” (7:156)"
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
    "reflection": {
      "fr": "Dans la prière sur le Prophète ﷺ qu’il a enseignée : « car Tu es le Digne de louange, le Glorieux. » (al-Bukhârî 3370)",
      "en": "In the prayer upon the Prophet ﷺ that he taught: “for You are the Most Praise-worthy, the Most Glorious.” (al-Bukhârî 3370)"
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
    "reflection": {
      "fr": "Au réveil, le Prophète ﷺ disait : « Al-hamdu li l-lahil-ladhi ahyana ba'da ma amatana wa ilaihin-nushur. » (al-Bukhârî 6312)",
      "en": "When he got up, the Prophet ﷺ would say: “Al-hamdu li l-lahil-ladhi ahyana ba'da ma amatana wa ilaihin-nushur.” (al-Bukhârî 6312)"
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
    "reflection": {
      "fr": "Dans sa prière de la nuit, le Prophète ﷺ disait : « Tu es la Vérité, Ta promesse est Vérité, la rencontre avec Toi est Vérité. » (Muslim 769)",
      "en": "In his night prayer, the Prophet ﷺ would say: “Thou art the Truth; Thy promise is True, the meeting with Thee is True.” (Muslim 769)"
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
    "reflection": {
      "fr": "Selon Ibn ‘Abbâs, « Allah nous suffit et Il est le meilleur garant » est ce qu’a dit Ibrâhîm lorsqu’il fut jeté dans le feu (al-Bukhârî 4563).",
      "en": "According to Ibn ‘Abbās, “Allah is Sufficient for us and He Is the Best Disposer of affairs” was said by Abraham when he was thrown into the fire (al-Bukhârî 4563)."
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Veux-tu que je t’indique un trésor parmi les trésors du Paradis ? » … « Alors dis : “Il n’y a de force ni de puissance qu’en Allah.” » (Muslim 2704)",
      "en": "The Prophet ﷺ said: “Should I not direct you to a treasure from amongst the treasures of Paradise?” … “Then recite: ‘There is no might and no power but that of Allah.’” (Muslim 2704)"
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
    "reflection": {
      "fr": "« Allah est le défenseur de ceux qui ont la foi: Il les fait sortir des ténèbres à la lumière. » (2:257)",
      "en": "“Allāh is the Ally of those who believe. He brings them out from darknesses into the light.” (2:257)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « “Al-Hamdu Lillah” (la louange et la reconnaissance reviennent à Allah seul) remplit la balance » (Muslim 223). Face à ce qu’il n’aimait pas, il disait : « Al-hamdu lillahi ‘ala kulli hal (Louange à Allah en toute circonstance). » (Ibn Mâjah 3803, jugé bon par al-Albânî)",
      "en": "The Prophet ﷺ said: “al-Hamdu Lillah (all praise and gratitude is for Allah alone) fills the scale” (Muslim 223). When he saw something he disliked, he would say: “Al-hamdu lillahi 'ala kulli hal (Praise is to Allah in all circumstances).” (Ibn Mâjah 3803, graded good by al-Albânî)"
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
    "reflection": {
      "fr": "« Et c’est Lui qui commence la création puis la refait; et cela Lui est plus facile. » (30:27)",
      "en": "“And it is He who begins creation; then He repeats it, and that is [even] easier for Him.” (30:27)"
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
    "reflection": {
      "fr": "« Sachez qu’Allah redonne la vie à la terre une fois morte. » (57:17)",
      "en": "“Know that Allāh gives life to the earth after its lifelessness.” (57:17)"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a demandé à Ubayy quel est le plus grand verset du Livre d’Allah. Il a répondu : « Allah, il n’y a pas d’autre divinité que Lui, le Vivant, l’Éternel. » Le Prophète ﷺ lui a dit : « Que la connaissance te soit agréable, ô Abu al-Mundhir ! » (Muslim 810)",
      "en": "The Prophet ﷺ asked Ubayy which verse of the Book of Allah is the greatest. He answered: “Allah, there is no god but He, the Living, the Eternal.” The Prophet ﷺ said: “May knowledge be pleasant for you, O Abu'l-Mundhir.” (Muslim 810)"
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Ce nom figure dans la liste des 99 noms rapportée par at-Tirmidhî (3507), jugée faible par al-Albânî.",
        "en": "This name appears in the list of 99 names reported by at-Tirmidhî (3507), graded weak by al-Albânî."
      },
      "source": {
        "fr": "at-Tirmidhî 3507",
        "en": "at-Tirmidhî 3507"
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
    "reflection": {
      "fr": "Torturé à La Mecque, Bilal disait : « Ahad, Ahad (Unique, Unique) » (Ibn Mâjah 150, jugé bon et authentique par al-Albânî).",
      "en": "Tortured in Makkah, Bilal kept saying: “Ahad, Ahad (One, One)” (Ibn Mâjah 150, graded hasan sahih by al-Albânî)."
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Dans sa prière de la nuit, le Prophète ﷺ disait : « Tu fais avancer qui Tu veux et reculer qui Tu veux. Il n’y a de divinité que Toi. »",
        "en": "In his night prayer, the Prophet ﷺ would say: “You are the One who make (some people) forward And (some) backward. There is none to be worshipped but you.”"
      },
      "source": {
        "fr": "al-Bukhârî 1120",
        "en": "al-Bukhârî 1120"
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Dans sa prière de la nuit, le Prophète ﷺ disait : « Tu fais avancer qui Tu veux et reculer qui Tu veux. Il n’y a de divinité que Toi. »",
        "en": "In his night prayer, the Prophet ﷺ would say: “You are the One who make (some people) forward And (some) backward. There is none to be worshipped but you.”"
      },
      "source": {
        "fr": "al-Bukhârî 1120",
        "en": "al-Bukhârî 1120"
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Allah est plus heureux du repentir de Son serviteur que l’un de vous ne l’est en retrouvant son chameau qu’il avait perdu dans le désert. » (al-Bukhârî 6309)",
      "en": "The Prophet ﷺ said: “Allah is more pleased with the repentance of His slave than anyone of you is pleased with finding his camel which he had lost in the desert.” (al-Bukhârî 6309)"
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
    "reflection": {
      "fr": "À ‘Â’isha qui demandait quoi dire si elle savait quelle nuit est la Nuit du Destin, le Prophète ﷺ a répondu : « Allāhumma innaka ‘Afuwwun tuḥibbul-‘afwa fa‘fu ‘annī » (at-Tirmidhî 3513, authentifié par al-Albânî).",
      "en": "When ‘Ā’ishah asked what to say if she knew which night is the Night of Al-Qadr, the Prophet ﷺ said: “O Allah, indeed You are Pardoning, You love pardon, so pardon me (Allāhumma innaka `Afuwwun, tuḥibbul-`afwa fa`fu `annī)” (at-Tirmidhî 3513, graded authentic by al-Albânî)."
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
    "reflection": {
      "fr": "Le Prophète ﷺ a dit : « Les justes seront assis sur des chaires de lumière à côté d’Allah » (Muslim 1827).",
      "en": "The Prophet ﷺ said: “the Dispensers of justice will be seated on the pulpits of light beside God” (Muslim 1827)."
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Après la prière, le Prophète ﷺ disait : « Ô Allah ! Nul ne peut retenir ce que Tu donnes, ni donner ce que Tu retiens »",
        "en": "After the prayer, the Prophet ﷺ would say: “O Allah! no one can withhold what Thou givest, or give what Thou withholdest”"
      },
      "source": {
        "fr": "Muslim 593",
        "en": "Muslim 593"
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
    "reflection": {
      "fr": "Le Prophète ﷺ invoquait : « … de la lumière dans mon cœur, de la lumière dans ma vue, de la lumière dans mon ouïe… » (Muslim 763)",
      "en": "The Prophet ﷺ would supplicate: “… light in my heart, light in my sight, light in my hearing…” (Muslim 763)"
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
    "reflection": {
      "fr": "« Guide-nous dans le droit chemin, » (1:6)",
      "en": "“Guide us to the straight path -” (1:6)"
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
    "reflection": {
      "fr": "« Et Zacharie, quand il implora son Seigneur : \"Seigneur ! Ne me laisse pas seul alors que Tu es le meilleur des héritiers !\" » (21:89)",
      "en": "“And [mention] Zechariah, when he called to his Lord, \"My Lord, do not leave me alone [with no heir], while You are the best of inheritors.\"” (21:89)"
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
    "evidence": {
      "kind": "sunnah",
      "text": {
        "fr": "Le Prophète ﷺ a dit : « Personne n’est plus patient qu’Allah face aux paroles blessantes. Il entend les gens Lui attribuer des enfants, pourtant Il leur accorde la santé et leur donne de quoi vivre »",
        "en": "The Prophet ﷺ said: “None is more patient than Allah against the harmful saying. He hears from the people they ascribe children to Him, yet He gives them health and (supplies them with) provision”"
      },
      "source": {
        "fr": "al-Bukhârî 6099",
        "en": "al-Bukhârî 6099"
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
    reflection: entry.reflection ? pick(entry.reflection, language) : undefined,
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
