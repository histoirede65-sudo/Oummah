/**
 * Content of the « L’au-delà » module. Generated from the sources, nothing written by hand:
 * - verses: Arabic (quran.com, Uthmani), Hamidullah (quran.com 31) in French, Saheeh International (20) in English;
 * - hadiths: French and English text of the fawazahmed0 collections, word for word; references and links as on
 *   sunnah.com. « […] » marks a passage left out of a long hadith.
 * `highlight` is a phrase copied from the text itself, shown large on the page.
 */
export type AkhiraText = {
  id: string;
  kind: "quran" | "hadith";
  ref: string;
  refEn?: string;
  url: string;
  arabic?: string;
  fr: string;
  en: string;
  highlight: string;
  highlightEn: string;
};
export type AkhiraStage = { id: string; arabic: string; title: string; titleEn: string; texts: AkhiraText[] };
export type AkhiraPart = { id: string; title: string; titleEn: string; stages: AkhiraStage[] };

export const AKHIRA_PARTS: AkhiraPart[] = [
  {
    "id": "before",
    "title": "Avant la Résurrection",
    "titleEn": "Before the Resurrection",
    "stages": [
      {
        "id": "mort",
        "arabic": "الموت",
        "title": "La mort",
        "titleEn": "Death",
        "texts": [
          {
            "kind": "quran",
            "ref": "Coran 3:185",
            "refEn": "Quran 3:185",
            "url": "https://quran.com/3/185",
            "arabic": "كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَـٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَـٰعُ ٱلْغُرُورِ",
            "fr": "Toute âme goûtera la mort. Mais c’est seulement au Jour de la Résurrection que vous recevrez votre entière rétribution. Quiconque donc est écarté du Feu et introduit au Paradis, a certes réussi. Et la vie présente n’est qu’un objet de jouissance trompeuse.",
            "en": "Every soul will taste death, and you will only be given your [full] compensation on the Day of Resurrection. So he who is drawn away from the Fire and admitted to Paradise has attained [his desire]. And what is the life of this world except the enjoyment of delusion.",
            "highlight": "Toute âme goûtera la mort.",
            "highlightEn": "Every soul will taste death",
            "id": "mort-1"
          },
          {
            "kind": "quran",
            "ref": "Coran 32:11",
            "refEn": "Quran 32:11",
            "url": "https://quran.com/32/11",
            "arabic": "۞ قُلْ يَتَوَفَّىٰكُم مَّلَكُ ٱلْمَوْتِ ٱلَّذِى وُكِّلَ بِكُمْ ثُمَّ إِلَىٰ رَبِّكُمْ تُرْجَعُونَ",
            "fr": "Dis : \"L’Ange de la mort qui est chargé de vous, vous fera mourir. Ensuite, vous serez ramenés vers Votre Seigneur.\"",
            "en": "Say, \"The angel of death who has been entrusted with you will take you. Then to your Lord you will be returned.\"",
            "highlight": "L’Ange de la mort qui est chargé de vous, vous fera mourir.",
            "highlightEn": "The angel of death who has been entrusted with you will take you.",
            "id": "mort-2"
          },
          {
            "kind": "quran",
            "ref": "Coran 50:19",
            "refEn": "Quran 50:19",
            "url": "https://quran.com/50/19",
            "arabic": "وَجَآءَتْ سَكْرَةُ ٱلْمَوْتِ بِٱلْحَقِّ ۖ ذَٰلِكَ مَا كُنتَ مِنْهُ تَحِيدُ",
            "fr": "L’agonie de la mort fait apparaître la vérité : \"Voilà ce dont tu t’écartais.\"",
            "en": "And the intoxication of death will bring the truth; that is what you were trying to avoid.",
            "highlight": "L’agonie de la mort fait apparaître la vérité",
            "highlightEn": "the intoxication of death will bring the truth",
            "id": "mort-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6507",
            "url": "https://sunnah.com/bukhari:6507",
            "fr": "Rapporté par 'Ubada bin As-Samit : Le Prophète (ﷺ) a dit : « Celui qui aime rencontrer Allah, Allah aime aussi le rencontrer. Et celui qui déteste rencontrer Allah, Allah déteste aussi le rencontrer. » 'Aisha, ou l'une des épouses du Prophète (ﷺ), a dit : « Mais nous n'aimons pas la mort. » Il a répondu : « Ce n'est pas cela. Quand la mort d'un croyant approche, il reçoit la bonne nouvelle de la satisfaction et des bénédictions d'Allah, alors rien ne lui est plus cher que ce qui l'attend. Il aime donc rencontrer Allah, et Allah aime aussi le rencontrer. Mais quand la mort d'un mécréant approche, il reçoit la mauvaise nouvelle du châtiment et de la punition d'Allah, alors rien ne lui est plus détestable que ce qui l'attend. Il déteste donc rencontrer Allah, et Allah aussi déteste le rencontrer. »",
            "en": "Narrated 'Ubada bin As-Samit: The Prophet (ﷺ) said, \"Who-ever loves to meet Allah, Allah (too) loves to meet him and who-ever hates to meet Allah, Allah (too) hates to meet him\". `Aisha, or some of the wives of the Prophet (ﷺ) said, \"But we dislike death.\" He said: It is not like this, but it is meant that when the time of the death of a believer approaches, he receives the good news of Allah's pleasure with him and His blessings upon him, and so at that time nothing is dearer to him than what is in front of him. He therefore loves the meeting with Allah, and Allah (too) loves the meeting with him. But when the time of the death of a disbeliever approaches, he receives the evil news of Allah's torment and His Requital, whereupon nothing is more hateful to him than what is before him. Therefore, he hates the meeting with Allah, and Allah too, hates the meeting with him",
            "highlight": "Celui qui aime rencontrer Allah, Allah aime aussi le rencontrer.",
            "highlightEn": "Who-ever loves to meet Allah, Allah (too) loves to meet him",
            "id": "mort-4"
          }
        ]
      },
      {
        "id": "tombe",
        "arabic": "القبر",
        "title": "La tombe",
        "titleEn": "The grave",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1374",
            "url": "https://sunnah.com/bukhari:1374",
            "fr": "Rapporté par Anas bin Malik : Le Messager d’Allah (ﷺ) a dit : « Quand le serviteur d’Allah est placé dans sa tombe et que ses compagnons s’en vont, alors qu’il entend même leurs pas, deux anges viennent à lui, le font asseoir et lui demandent : ‘Que disais-tu à propos de cet homme (c’est-à-dire Muhammad) ?’ Le croyant fidèle dira : ‘J’atteste qu’il est le serviteur d’Allah et Son Messager.’ Alors ils lui diront : ‘Regarde ta place en Enfer ; Allah t’a donné une place au Paradis à la place.’ Il verra donc les deux endroits. » (Qatada a dit : « On nous a informés que sa tombe sera élargie. » Puis Qatada reprit le récit d’Anas qui dit :) Quant à l’hypocrite ou au non-croyant, on lui demandera : « Que disais-tu à propos de cet homme ? » Il répondra : « Je ne sais pas ; je disais ce que disaient les gens. » Alors ils lui diront : « Tu n’as ni su ni suivi la bonne voie (en récitant le Coran). » Il sera alors frappé avec des marteaux de fer, ce qui provoquera un cri que tout ce qui est proche de lui entendra, sauf les djinns et les humains",
            "en": "Narrated Anas bin Malik: Allah's Messenger (ﷺ) said, \"When (Allah's) slave is put in his grave and his companions return and he even hears their footsteps, two angels come to him and make him sit and ask, 'What did you use to say about this man (i.e. Muhammad)?' The faithful Believer will say, 'I testify that he is Allah's slave and His Apostle.' Then they will say to him, 'Look at your place in the Hell Fire; Allah has given you a place in Paradise instead of it.' So he will see both his places.\" (Qatada said, \"We were informed that his grave would be made spacious.\" Then Qatada went back to the narration of Anas who said;) Whereas a hypocrite or a non-believer will be asked, \"What did you use to say about this man.\" He will reply, \"I do not know; but I used to say what the people used to say.\" So they will say to him, \"Neither did you know nor did you take the guidance (by reciting the Qur'an).\" Then he will be hit with iron hammers once, that he will send such a cry as everything near to him will hear, except Jinns and human beings. (See Hadith No)",
            "highlight": "deux anges viennent à lui, le font asseoir et lui demandent",
            "highlightEn": "two angels come to him and make him sit and ask",
            "id": "tombe-1"
          },
          {
            "kind": "quran",
            "ref": "Coran 14:27",
            "refEn": "Quran 14:27",
            "url": "https://quran.com/14/27",
            "arabic": "يُثَبِّتُ ٱللَّهُ ٱلَّذِينَ ءَامَنُوا۟ بِٱلْقَوْلِ ٱلثَّابِتِ فِى ٱلْحَيَوٰةِ ٱلدُّنْيَا وَفِى ٱلْـَٔاخِرَةِ ۖ وَيُضِلُّ ٱللَّهُ ٱلظَّـٰلِمِينَ ۚ وَيَفْعَلُ ٱللَّهُ مَا يَشَآءُ",
            "fr": "Allah affermit les croyants par une parole ferme, dans la vie présente et dans l’au-delà . Et Il égare les injustes. Et Allah fait ce qu’Il veut.",
            "en": "Allāh keeps firm those who believe, with the firm word, in worldly life and in the Hereafter. And Allāh sends astray the wrongdoers. And Allāh does what He wills.",
            "highlight": "Allah affermit les croyants par une parole ferme, dans la vie présente et dans l’au-delà",
            "highlightEn": "Allāh keeps firm those who believe, with the firm word, in worldly life and in the Hereafter.",
            "id": "tombe-2"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1369",
            "url": "https://sunnah.com/bukhari:1369",
            "fr": "Rapporté par Al-Bara' bin 'Azib : Le Prophète (ﷺ) a dit : « Quand un croyant fidèle est assis dans sa tombe, alors (les anges) viennent à lui et il atteste que nul n’a le droit d’être adoré en dehors d’Allah et que Muhammad est le Messager d’Allah. Et cela correspond à la parole d’Allah : Allah affermit ceux qui croient par la parole ferme... (14.27). » Rapporté aussi par Shu'ba : Même chose, et il a ajouté : « Allah affermit ceux qui croient... (14.27) a été révélé à propos du châtiment de la tombe. »",
            "en": "Narrated Al-Bara' bin 'Azib : The Prophet (ﷺ) said, \"When a faithful believer is made to sit in his grave, then (the angels) come to him and he testifies that none has the right to be worshipped but Allah and Muhammad is Allah's Apostle. And that corresponds to Allah's statement: Allah will keep firm those who believe with the word that stands firm . . . (14.27). Narrated Shu'ba: Same as above and added, \"Allah will keep firm those who believe . . . (14.27) was revealed concerning the punishment of the grave",
            "highlight": "a été révélé à propos du châtiment de la tombe",
            "highlightEn": "was revealed concerning the punishment of the grave",
            "id": "tombe-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1377",
            "url": "https://sunnah.com/bukhari:1377",
            "fr": "Rapporté par Abou Hourayra : Le Messager d’Allah (ﷺ) invoquait Allah en disant : « Allahumma ini a`udhu bika min ‘adhabi-l-Qabr, wa min ‘adhabi-nnar, wa min fitnati-l-mahya wa-lmamat, wa min fitnati-l-masih ad-dajjal. » (Ô Allah ! Je cherche refuge auprès de Toi contre le châtiment dans la tombe, contre le châtiment du Feu, contre les épreuves de la vie et de la mort, et contre les tentations du faux Messie, Al-Masih Ad-Dajjal)",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) used to invoke (Allah): \"Allahumma ini a`udhu bika min 'adhabi-l-Qabr, wa min 'adhabi-nnar, wa min fitnati-l-mahya wa-lmamat, wa min fitnati-l-masih ad-dajjal. (O Allah! I seek refuge with you from the punishment in the grave and from the punishment in the Hell fire and from the afflictions of life and death, and the afflictions of Al-Masih Ad-Dajjal)",
            "highlight": "Je cherche refuge auprès de Toi contre le châtiment dans la tombe",
            "highlightEn": "I seek refuge with you from the punishment in the grave",
            "id": "tombe-4"
          }
        ]
      },
      {
        "id": "barzakh",
        "arabic": "البرزخ",
        "title": "Où sont les morts",
        "titleEn": "Where the dead are",
        "texts": [
          {
            "kind": "quran",
            "ref": "Coran 23:99-100",
            "refEn": "Quran 23:99-100",
            "url": "https://quran.com/23/99-100",
            "arabic": "حَتَّىٰٓ إِذَا جَآءَ أَحَدَهُمُ ٱلْمَوْتُ قَالَ رَبِّ ٱرْجِعُونِ لَعَلِّىٓ أَعْمَلُ صَـٰلِحًا فِيمَا تَرَكْتُ ۚ كَلَّآ ۚ إِنَّهَا كَلِمَةٌ هُوَ قَآئِلُهَا ۖ وَمِن وَرَآئِهِم بَرْزَخٌ إِلَىٰ يَوْمِ يُبْعَثُونَ",
            "fr": "Puis, lorsque la mort vient à l’un deux, il dit : \"Seigneur ! Fais-moi revenir (sur Terre), afin que je fasse du bien dans ce que je délaissais.\" Non, c’est simplement une parole qu’il dit. Derrière eux, cependant, il y a une barrière, jusqu’au jour où ils seront ressuscités.\"",
            "en": "[For such is the state of the disbelievers] until, when death comes to one of them, he says, \"My Lord, send me back That I might do righteousness in that which I left behind.\" No! It is only a word he is saying; and behind them is a barrier until the Day they are resurrected.",
            "highlight": "Derrière eux, cependant, il y a une barrière, jusqu’au jour où ils seront ressuscités.",
            "highlightEn": "behind them is a barrier until the Day they are resurrected.",
            "id": "barzakh-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1379",
            "url": "https://sunnah.com/bukhari:1379",
            "fr": "Rapporté par `Abdullah bin `Umar : Le Messager d’Allah (ﷺ) a dit : « Quand l’un de vous meurt, on lui montre sa place matin et soir. S’il fait partie des gens du Paradis, il voit sa place au Paradis, et s’il fait partie des gens du Feu, il voit sa place en Enfer. Puis on lui dit : “Voilà ta place jusqu’à ce qu’Allah te ressuscite le Jour de la Résurrection.” »",
            "en": "Narrated `Abdullah bin `Umar: Allah's Messenger (ﷺ) said, \"When anyone of you dies, he is shown his place both in the morning and in the evening. If he is one of the people of Paradise; he is shown his place in it, and if he is from the people of the Hell-Fire; he is shown his place there-in. Then it is said to him, 'This is your place till Allah resurrect you on the Day of Resurrection",
            "highlight": "Voilà ta place jusqu’à ce qu’Allah te ressuscite le Jour de la Résurrection.",
            "highlightEn": "This is your place till Allah resurrect you on the Day of Resurrection",
            "id": "barzakh-2"
          },
          {
            "kind": "quran",
            "ref": "Coran 40:46",
            "refEn": "Quran 40:46",
            "url": "https://quran.com/40/46",
            "arabic": "ٱلنَّارُ يُعْرَضُونَ عَلَيْهَا غُدُوًّا وَعَشِيًّا ۖ وَيَوْمَ تَقُومُ ٱلسَّاعَةُ أَدْخِلُوٓا۟ ءَالَ فِرْعَوْنَ أَشَدَّ ٱلْعَذَابِ",
            "fr": "le Feu, auquel ils sont exposés matin et soir . Et le jour où l’Heure arrivera (il sera dit) : \"Faites entrer les gens de Pharaon au plus dur du châtiment.\"",
            "en": "The Fire; they are exposed to it morning and evening. And the Day the Hour appears [it will be said], \"Make the people of Pharaoh enter the severest punishment.\"",
            "highlight": "le Feu, auquel ils sont exposés matin et soir",
            "highlightEn": "The Fire; they are exposed to it morning and evening.",
            "id": "barzakh-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 1887",
            "url": "https://sunnah.com/muslim:1887",
            "fr": "Rapporté par Masruq رضي الله عنه : Nous avons interrogé ‘Abdullah au sujet du verset coranique : « Ne pense pas que ceux qui sont tués dans la voie d’Allah sont morts. Non, ils sont vivants, recevant leur subsistance auprès de leur Seigneur… » (Coran 3 : 169). Il a dit : Nous avons demandé la signification de ce verset au Prophète ﷺ, qui a répondu : « Les âmes des martyrs vivent dans des corps d’oiseaux verts qui ont leurs nids dans des lampes suspendues au Trône du Tout-Puissant. Ils mangent les fruits du Paradis où ils veulent, puis se reposent dans ces lampes. Une fois, leur Seigneur les regarda et leur demanda : “Voulez-vous quelque chose ?” Ils répondirent : “Que pourrions-nous désirer de plus ? Nous mangeons les fruits du Paradis où nous voulons.” Leur Seigneur leur posa la question trois fois. Voyant qu’ils seraient continuellement interrogés, ils dirent : “Ô Seigneur, nous souhaitons que Tu rendes nos âmes à nos corps afin que nous soyons tués à nouveau dans Ta voie.” Quand Allah vit qu’ils n’avaient plus de besoin, Il les laissa (dans leur joie au Paradis). »",
            "en": "It has been narrated on the authority of Masruq Who said: We asked 'Abdullah about the Qur'anic verse:\" Think not of those who are slain in Allah's way as dead. Nay, they are alive, finding their sustenance in the presence of their Lord..\" (iii. 169). He said: We asked the meaning of the verse (from the Holy Prophet) who said: The souls, of the martyrs live in the bodies of green birds who have their nests in chandeliers hung from the throne of the Almighty. They eat the fruits of Paradise from wherever they like and then nestle in these chandeliers. Once their Lord cast a glance at them and said: Do ye want anything? They said: What more shall we desire? We eat the fruit of Paradise from wherever we like. Their Lord asked them the same question thrice. When they saw that they will continue to be asked and not left (without answering the question). they said: O Lord, we wish that Thou mayest return our souls to our bodies so that we may be slain in Thy way once again. When He (Allah) saw that they had no need, they were left (to their joy in heaven)",
            "highlight": "Les âmes des martyrs vivent dans des corps d’oiseaux verts",
            "highlightEn": "The souls, of the martyrs live in the bodies of green birds",
            "id": "barzakh-4"
          }
        ]
      }
    ]
  },
  {
    "id": "day",
    "title": "Le Jour de la Résurrection",
    "titleEn": "The Day of Resurrection",
    "stages": [
      {
        "id": "trompe",
        "arabic": "النفخ في الصور",
        "title": "Le souffle dans la Trompe",
        "titleEn": "The blowing of the Horn",
        "texts": [
          {
            "kind": "quran",
            "ref": "Coran 39:68",
            "refEn": "Quran 39:68",
            "url": "https://quran.com/39/68",
            "arabic": "وَنُفِخَ فِى ٱلصُّورِ فَصَعِقَ مَن فِى ٱلسَّمَـٰوَٰتِ وَمَن فِى ٱلْأَرْضِ إِلَّا مَن شَآءَ ٱللَّهُ ۖ ثُمَّ نُفِخَ فِيهِ أُخْرَىٰ فَإِذَا هُمْ قِيَامٌ يَنظُرُونَ",
            "fr": "Et on soufflera dans la Trompe, et voilà que ceux qui seront dans les cieux et ceux qui seront sur la terre seront foudroyés, sauf ceux qu’Allah voudra [épargner]. Puis on y soufflera de nouveau, et les voilà debout à regarder.",
            "en": "And the Horn will be blown, and whoever is in the heavens and whoever is on the earth will fall dead except whom Allāh wills. Then it will be blown again, and at once they will be standing, looking on.",
            "highlight": "Et on soufflera dans la Trompe",
            "highlightEn": "And the Horn will be blown",
            "id": "trompe-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 4814",
            "url": "https://sunnah.com/bukhari:4814",
            "fr": "Rapporté par Abu Huraira : Le Prophète (ﷺ) a dit : « Entre les deux souffles dans la trompe, il y aura quarante. » Les gens ont demandé : « Ô Abu Huraira ! Quarante jours ? » J’ai refusé de répondre. Ils ont dit : « Quarante ans ? » J’ai refusé de répondre et j’ai ajouté : Tout le corps humain se décomposera sauf l’os du coccyx (la base de la colonne vertébrale) et à partir de cet os, Allah reconstruira tout le corps",
            "en": "Narrated Abu Huraira: The Prophet (ﷺ) said, \"Between the two blowing of the trumpet there will be forty.\" The people said, \"O Abu Huraira! Forty days?\" I refused to reply. They said, \"Forty years?\" I refused to reply and added: Everything of the human body will decay except the coccyx bone (of the tail) and from that bone Allah will reconstruct the whole body",
            "highlight": "Entre les deux souffles dans la trompe, il y aura quarante.",
            "highlightEn": "Between the two blowing of the trumpet there will be forty.",
            "id": "trompe-2"
          },
          {
            "kind": "quran",
            "ref": "Coran 36:51",
            "refEn": "Quran 36:51",
            "url": "https://quran.com/36/51",
            "arabic": "وَنُفِخَ فِى ٱلصُّورِ فَإِذَا هُم مِّنَ ٱلْأَجْدَاثِ إِلَىٰ رَبِّهِمْ يَنسِلُونَ",
            "fr": "Et on soufflera dans la Trompe, et voilà que, des tombes, ils se précipiteront vers leur Seigneur,",
            "en": "And the Horn will be blown; and at once from the graves to their Lord they will hasten.",
            "highlight": "des tombes, ils se précipiteront vers leur Seigneur",
            "highlightEn": "from the graves to their Lord they will hasten",
            "id": "trompe-3"
          }
        ]
      },
      {
        "id": "rassemblement",
        "arabic": "الحشر",
        "title": "Le rassemblement",
        "titleEn": "The gathering",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6527",
            "url": "https://sunnah.com/bukhari:6527",
            "fr": "Rapporté par `Aisha رضي الله عنها : Le Messager d'Allah (ﷺ) a dit : « Les gens seront rassemblés pieds nus, nus et non circoncis. » J'ai demandé : « Ô Messager d'Allah (ﷺ) ! Les hommes et les femmes se regarderont-ils ? » Il a répondu : « La situation sera trop difficile pour qu'ils fassent attention à cela. »",
            "en": "Narrated `Aisha: Allah's Messenger (ﷺ) said, \"The people will be gathered barefooted, naked, and uncircumcised.\" I said, \"O Allah's Messenger (ﷺ)! Will the men and the women look at each other?\" He said, \"The situation will be too hard for them to pay attention to that",
            "highlight": "Les gens seront rassemblés pieds nus, nus et non circoncis.",
            "highlightEn": "The people will be gathered barefooted, naked, and uncircumcised.",
            "id": "rassemblement-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 2864",
            "url": "https://sunnah.com/muslim:2864",
            "fr": "Rapporté par Miqdad b. Aswad : J’ai entendu le Messager d’Allah ﷺ dire : « Le Jour de la Résurrection, le soleil s’approchera des gens jusqu’à ce qu’il ne reste qu’une distance d’un mille. » Sulaim b. Amir a dit : « Par Allah, je ne sais pas s’il voulait dire un mille terrestre ou l’instrument pour mettre du khôl. » Le Prophète ﷺ a dit : « Les gens seront plongés dans leur sueur selon leurs actes : certains jusqu’aux genoux, d’autres jusqu’à la taille, et d’autres auront la sueur jusqu’à la bouche. » Et en disant cela, il a montré sa main vers sa bouche",
            "en": "Miqdad b. Aswad reported: I heard Allah's Messenger (may peace he upon him) as saying: On the Day of Resurrection, the sun would draw so close to the people that there woum be left only a distance of one mile. Sulaim b. Amir said: By Allah, I do not know whether he meant by\" mile\" the mile of the (material) earth or dn instrument used for applying collyrium to the eye. (The Prophet is, however, reported to have said): The people would be submerged in perspiration according to their deeds, some up to their. knees, Some up to the waist and some would have the bridle of perspiration and, while saying this, Allah's Apostle (ﷺ) pointed his hand towards his mouth",
            "highlight": "le soleil s’approchera des gens jusqu’à ce qu’il ne reste qu’une distance d’un mille",
            "highlightEn": "the sun would draw so close to the people that there woum be left only a distance of one mile",
            "id": "rassemblement-2"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6532",
            "url": "https://sunnah.com/bukhari:6532",
            "fr": "Rapporté par Abu Huraira : Le Messager d’Allah (ﷺ) a dit : Les gens transpireront tellement le Jour de la Résurrection que leur sueur s’enfoncera dans la terre sur soixante-dix coudées de profondeur, et elle montera jusqu’à atteindre la bouche et les oreilles des gens",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"The people will sweat so profusely on the Day of Resurrection that their sweat will sink seventy cubits deep into the earth, and it will rise up till it reaches the people's mouths and ears",
            "highlight": "Les gens transpireront tellement le Jour de la Résurrection",
            "highlightEn": "The people will sweat so profusely on the Day of Resurrection",
            "id": "rassemblement-3"
          }
        ]
      },
      {
        "id": "jugement",
        "arabic": "الحساب والميزان",
        "title": "Le jugement",
        "titleEn": "The reckoning",
        "texts": [
          {
            "kind": "quran",
            "ref": "Coran 21:47",
            "refEn": "Quran 21:47",
            "url": "https://quran.com/21/47",
            "arabic": "وَنَضَعُ ٱلْمَوَٰزِينَ ٱلْقِسْطَ لِيَوْمِ ٱلْقِيَـٰمَةِ فَلَا تُظْلَمُ نَفْسٌ شَيْـًٔا ۖ وَإِن كَانَ مِثْقَالَ حَبَّةٍ مِّنْ خَرْدَلٍ أَتَيْنَا بِهَا ۗ وَكَفَىٰ بِنَا حَـٰسِبِينَ",
            "fr": "Au Jour de la Résurrection, Nous placerons les balances exactes. Nulle âme ne sera lésée en rien, fût-ce du poids d’un grain de moutarde que Nous ferons venir. Et Nous suffisons largement pour dresser les comptes.",
            "en": "And We place the scales of justice for the Day of Resurrection, so no soul will be treated unjustly at all. And if there is [even] the weight of a mustard seed, We will bring it forth. And sufficient are We as accountant.",
            "highlight": "Nous placerons les balances exactes.",
            "highlightEn": "We place the scales of justice for the Day of Resurrection",
            "id": "jugement-1"
          },
          {
            "kind": "quran",
            "ref": "Coran 99:7-8",
            "refEn": "Quran 99:7-8",
            "url": "https://quran.com/99/7-8",
            "arabic": "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُۥ",
            "fr": "Quiconque fait un bien fût-ce du poids d’un atome, le verra, et quiconque fait un mal fût-ce du poids d’un atome, le verra",
            "en": "So whoever does an atom's weight of good will see it, And whoever does an atom's weight of evil will see it.",
            "highlight": "Quiconque fait un bien fût-ce du poids d’un atome, le verra",
            "highlightEn": "So whoever does an atom's weight of good will see it",
            "id": "jugement-2"
          },
          {
            "kind": "quran",
            "ref": "Coran 69:19",
            "refEn": "Quran 69:19",
            "url": "https://quran.com/69/19",
            "arabic": "فَأَمَّا مَنْ أُوتِىَ كِتَـٰبَهُۥ بِيَمِينِهِۦ فَيَقُولُ هَآؤُمُ ٱقْرَءُوا۟ كِتَـٰبِيَهْ",
            "fr": "Quant à celui à qui on aura remis le Livre en sa main droite, il dira : \"Tenez ! Lisez mon livre.",
            "en": "So as for he who is given his record in his right hand, he will say, \"Here, read my record!",
            "highlight": "Quant à celui à qui on aura remis le Livre en sa main droite",
            "highlightEn": "So as for he who is given his record in his right hand",
            "id": "jugement-3"
          },
          {
            "kind": "quran",
            "ref": "Coran 69:25",
            "refEn": "Quran 69:25",
            "url": "https://quran.com/69/25",
            "arabic": "وَأَمَّا مَنْ أُوتِىَ كِتَـٰبَهُۥ بِشِمَالِهِۦ فَيَقُولُ يَـٰلَيْتَنِى لَمْ أُوتَ كِتَـٰبِيَهْ",
            "fr": "Quant à celui à qui on aura remis le Livre en sa main gauche, il dira : \"Hélas pour moi ! J’aurai souhaité qu’on ne m’ait pas remis mon livre,",
            "en": "But as for he who is given his record in his left hand, he will say, \"Oh, I wish I had not been given my record",
            "highlight": "Quant à celui à qui on aura remis le Livre en sa main gauche",
            "highlightEn": "But as for he who is given his record in his left hand",
            "id": "jugement-4"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6539",
            "url": "https://sunnah.com/bukhari:6539",
            "fr": "Rapporté par `Adi bin Hatim : Le Prophète (ﷺ) a dit : « Le Jour de la Résurrection, chacun d’entre vous sera interrogé directement par Allah, sans aucun interprète entre lui et Lui (Allah). Il regardera devant lui et ne verra rien, puis il regardera encore devant lui, et le Feu (de l'Enfer) sera face à lui. Donc, que celui d’entre vous qui peut se protéger du Feu le fasse, même en donnant la moitié d’une datte en aumône. »",
            "en": "Narrated `Adi bin Hatim: The Prophet (ﷺ) said, \"There will be none among you but will be talked to by Allah on the Day of Resurrection, without there being an interpreter between him and Him (Allah) . He will look and see nothing ahead of him, and then he will look (again for the second time) in front of him, and the (Hell) Fire will confront him. So, whoever among you can save himself from the Fire, should do so even with one half of a date (to give in charity)",
            "highlight": "sans aucun interprète entre lui et Lui (Allah)",
            "highlightEn": "without there being an interpreter between him and Him (Allah)",
            "id": "jugement-5"
          }
        ]
      },
      {
        "id": "bassin",
        "arabic": "الحوض",
        "title": "Le Bassin",
        "titleEn": "The Basin",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6579",
            "url": "https://sunnah.com/bukhari:6579",
            "fr": "Rapporté par `Abdullah bin `Amr : Le Prophète (ﷺ) a dit : « Mon Bassin est si vaste qu’il faut un mois pour le traverser. Son eau est plus blanche que le lait, son parfum est meilleur que le musc, et ses coupes sont aussi nombreuses que les étoiles du ciel. Quiconque en boira n’aura plus jamais soif. »",
            "en": "Narrated `Abdullah bin `Amr: The Prophet (ﷺ) said, \"My Lake-Fount is (so large that it takes) a month's journey to cross it. Its water is whiter than milk, and its smell is nicer than musk (a kind of Perfume), and its drinking cups are (as numerous) as the (number of) stars of the sky; and whoever drinks from it, will never be thirsty",
            "highlight": "Son eau est plus blanche que le lait",
            "highlightEn": "Its water is whiter than milk",
            "id": "bassin-1"
          }
        ]
      },
      {
        "id": "intercession",
        "arabic": "الشفاعة",
        "title": "L’intercession",
        "titleEn": "The intercession",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 99",
            "url": "https://sunnah.com/bukhari:99",
            "fr": "Rapporté par Abu Huraira : J’ai dit : « Ô Messager d’Allah (ﷺ) ! Qui sera la personne la plus chanceuse à bénéficier de ton intercession le Jour de la Résurrection ? » Le Messager d’Allah (ﷺ) a dit : Ô Abu Huraira ! « Je pensais que personne ne me poserait cette question avant toi, car je connais ton désir d’apprendre les hadiths. La personne la plus chanceuse à bénéficier de mon intercession le Jour de la Résurrection sera celle qui aura dit sincèrement du fond du cœur : “Nul n’a le droit d’être adoré sauf Allah.” »",
            "en": "Narrated Abu Huraira: I said: \"O Allah's Messenger (ﷺ)! Who will be the luckiest person, who will gain your intercession on the Day of Resurrection?\" Allah's Messenger (ﷺ) said: \"O Abu Huraira! I have thought that none will ask me about it before you as I know your longing for the (learning of) Hadiths. The luckiest person who will have my intercession on the Day of Resurrection will be the one who said sincerely from the bottom of his heart \"None has the right to be worshipped but Allah",
            "highlight": "La personne la plus chanceuse à bénéficier de mon intercession",
            "highlightEn": "The luckiest person who will have my intercession",
            "id": "intercession-1"
          }
        ]
      },
      {
        "id": "pont",
        "arabic": "الصراط",
        "title": "Le Pont",
        "titleEn": "The Bridge",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6573",
            "url": "https://sunnah.com/bukhari:6573",
            "fr": "Rapporté par Abu Huraira : […] Ensuite, un pont sera placé au-dessus du Feu. » Le Messager d’Allah (ﷺ) a ajouté : « Je serai le premier à le traverser. Et l’invocation des Prophètes ce jour-là sera : ‘Allahumma Sallim, Sallim (Ô Allah, sauve-nous, sauve-nous !)’ Sur ce pont, il y aura des crochets semblables aux épines de l’arbre As-Sa'dan (un arbre épineux). […]",
            "en": "Narrated Abu Huraira: […] Then a bridge will be laid over the (Hell) Fire.\" Allah's Messenger (ﷺ) added, \"I will be the first to cross it. And the invocation of the Apostles on that Day, will be 'Allahumma Sallim, Sallim (O Allah, save us, save us!),' and over that bridge there will be hooks Similar to the thorns of As Sa'dan (a thorny tree). […]",
            "highlight": "un pont sera placé au-dessus du Feu",
            "highlightEn": "a bridge will be laid over the (Hell) Fire",
            "id": "pont-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 2791",
            "url": "https://sunnah.com/muslim:2791",
            "fr": "Rapporté par Aïcha رضي الله عنها : J’ai demandé au Messager d’Allah ﷺ au sujet de ces paroles d’Allah, le Très-Haut et Glorieux : « Le jour où la terre sera changée en une autre terre, et les cieux aussi seront changés » (14:48). J’ai demandé : « Où seront les gens ce jour-là ? » Il a répondu : « Ils seront sur le Sirat. »",
            "en": "A'isha reported: I asked Allah's Messenger (ﷺ) about the words of Allah, the Exalted and Glorious:\" The day when the earth would be changed for another earth and Heaven would be changed for another Heaven (XiV. 48), (and inquired: ) (Allah's Messenger), where would the people be on that day? He said: They would be on the Sirat",
            "highlight": "Ils seront sur le Sirat.",
            "highlightEn": "They would be on the Sirat",
            "id": "pont-2"
          }
        ]
      }
    ]
  },
  {
    "id": "abode",
    "title": "La demeure éternelle",
    "titleEn": "The eternal abode",
    "stages": [
      {
        "id": "paradis",
        "arabic": "الجنة",
        "title": "Le Paradis",
        "titleEn": "Paradise",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 3244",
            "url": "https://sunnah.com/bukhari:3244",
            "fr": "Rapporté par Abu Huraira : Le Messager d’Allah ﷺ a dit : « Allah a dit : ‘J’ai préparé pour Mes serviteurs pieux ce qu’aucun œil n’a jamais vu, aucune oreille n’a jamais entendu et ce qu’aucun être humain n’a jamais imaginé.’ Si vous le souhaitez, vous pouvez réciter ce verset du Coran : ‘Nul ne sait ce qui leur est réservé comme joie, en récompense de ce qu’ils faisaient.’ »",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Allah said, \"I have prepared for My Pious slaves things which have never been seen by an eye, or heard by an ear, or imagined by a human being.\" If you wish, you can recite this Verse from the Holy Qur'an:--\"No soul knows what is kept hidden for them, of joy as a reward for what they used to do",
            "highlight": "ce qu’aucun œil n’a jamais vu, aucune oreille n’a jamais entendu",
            "highlightEn": "things which have never been seen by an eye, or heard by an ear",
            "id": "paradis-1"
          },
          {
            "kind": "quran",
            "ref": "Coran 47:15",
            "refEn": "Quran 47:15",
            "url": "https://quran.com/47/15",
            "arabic": "مَّثَلُ ٱلْجَنَّةِ ٱلَّتِى وُعِدَ ٱلْمُتَّقُونَ ۖ فِيهَآ أَنْهَـٰرٌ مِّن مَّآءٍ غَيْرِ ءَاسِنٍ وَأَنْهَـٰرٌ مِّن لَّبَنٍ لَّمْ يَتَغَيَّرْ طَعْمُهُۥ وَأَنْهَـٰرٌ مِّنْ خَمْرٍ لَّذَّةٍ لِّلشَّـٰرِبِينَ وَأَنْهَـٰرٌ مِّنْ عَسَلٍ مُّصَفًّى ۖ وَلَهُمْ فِيهَا مِن كُلِّ ٱلثَّمَرَٰتِ وَمَغْفِرَةٌ مِّن رَّبِّهِمْ ۖ",
            "fr": "Voici la description du Paradis qui a été promis aux pieux : il y aura là des ruisseaux d’une eau jamais malodorante, et des ruisseaux d’un lait au goût inaltérable, et des ruisseaux d’un vin délicieux à boire, ainsi que des ruisseaux d’un miel purifié. Et il y a là, pour eux, des fruits de toutes sortes, ainsi qu’un pardon de la part de leur Seigneur. […]",
            "en": "Is the description of Paradise, which the righteous are promised, wherein are rivers of water unaltered, rivers of milk the taste of which never changes, rivers of wine delicious to those who drink, and rivers of purified honey, in which they will have from all [kinds of] fruits and forgiveness from their Lord […]",
            "highlight": "des ruisseaux d’une eau jamais malodorante, et des ruisseaux d’un lait au goût inaltérable",
            "highlightEn": "rivers of water unaltered, rivers of milk the taste of which never changes",
            "id": "paradis-2"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 2790",
            "url": "https://sunnah.com/bukhari:2790",
            "fr": "Rapporté par Abu Huraira : […] Il a dit : « Le Paradis a cent degrés qu’Allah a réservés aux combattants pour Sa cause, et la distance entre chaque degré est comme celle entre le ciel et la terre. Donc, quand vous demandez quelque chose à Allah, demandez-lui Al-Firdaous, qui est la meilleure et la plus haute partie du Paradis. » (Le sous-narrateur a ajouté : « Je pense que le Prophète a aussi dit : ‘Au-dessus d’elle (c’est-à-dire Al-Firdaous) se trouve le Trône du Tout Miséricordieux (c’est-à-dire Allah), et de là coulent les rivières du Paradis.’ »",
            "en": "Narrated Abu Huraira: […] He said, \"Paradise has one-hundred grades which Allah has reserved for the Mujahidin who fight in His Cause, and the distance between each of two grades is like the distance between the Heaven and the Earth. So, when you ask Allah (for something), ask for Al-firdaus which is the best and highest part of Paradise.\" (The sub-narrator added, \"I think the Prophet also said, 'Above it (i.e. Al-Firdaus) is the Throne of Beneficent (i.e. Allah), and from it originate the rivers of Paradise",
            "highlight": "Le Paradis a cent degrés",
            "highlightEn": "Paradise has one-hundred grades",
            "id": "paradis-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 633",
            "url": "https://sunnah.com/muslim:633",
            "fr": "Rapporté par Jarir ibn Abdullah رضي الله عنه : Nous étions assis avec le Messager d’Allah ﷺ lorsqu’il a regardé la pleine lune et a dit : « Vous verrez votre Seigneur comme vous voyez cette lune, et vous ne serez pas gênés de Le voir. Donc, si vous le pouvez, ne vous laissez pas distraire au moment de la prière avant le lever du soleil et avant son coucher, c’est-à-dire la prière de l’Asr et celle du Fajr. » Jarir a ensuite récité : « Glorifie ton Seigneur avant le lever du soleil et avant son coucher » (20:)",
            "en": "Jarir b. Abdullah is reported to have said: We were sitting with the Messenger of Allah (ﷺ) that he looked at the full moon and observed: You shall see your Lord as you are seeing this moon, and you will not be harmed by seeing Him. So if you can, do not let -yourselves be overpowered in case of prayer observed before the rising of the sun and its setting, i. e. the 'Asr prayer and the morning prayer. Jarir then recited it:\" Celebrate the praise of thy Lord before the rising of the sun and before Its setting\" (xx)",
            "highlight": "Vous verrez votre Seigneur comme vous voyez cette lune",
            "highlightEn": "You shall see your Lord as you are seeing this moon",
            "id": "paradis-4"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6549",
            "url": "https://sunnah.com/bukhari:6549",
            "fr": "Rapporté par Abu Sa`id Al-Khudri : Le Messager d’Allah (ﷺ) a dit : « Allah dira aux gens du Paradis : “Ô gens du Paradis !” Ils répondront : “Nous sommes à Ton service, ô notre Seigneur, et nous sommes heureux !” Allah dira : “Êtes-vous satisfaits ?” Ils répondront : “Pourquoi ne serions-nous pas satisfaits alors que Tu nous as donné ce que Tu n’as donné à aucune autre de Tes créatures ?” Allah dira : “Je vais vous donner encore mieux que cela.” Ils diront : “Ô notre Seigneur ! Qu’est-ce qui peut être meilleur que cela ?” Allah dira : “Je vous accorde Ma satisfaction et Mon contentement, et Je ne serai plus jamais en colère contre vous.” »",
            "en": "Narrated Abu Sa`id Al-Khudri: Allah's Messenger (ﷺ) said, \"Allah will say to the people of Paradise, 'O the people of Paradise!' They will say, 'Labbaik, O our Lord, and Sa`daik!' Allah will say, 'Are you pleased?\" They will say, 'Why should we not be pleased since You have given us what You have not given to anyone of Your creation?' Allah will say, 'I will give you something better than that.' They will reply, 'O our Lord! And what is better than that?' Allah will say, 'I will bestow My pleasure and contentment upon you so that I will never be angry with you after for-ever",
            "highlight": "Je ne serai plus jamais en colère contre vous.",
            "highlightEn": "I will never be angry with you after for-ever",
            "id": "paradis-5"
          }
        ]
      },
      {
        "id": "enfer",
        "arabic": "النار",
        "title": "L’Enfer",
        "titleEn": "Hell",
        "texts": [
          {
            "kind": "quran",
            "ref": "Coran 66:6",
            "refEn": "Quran 66:6",
            "url": "https://quran.com/66/6",
            "arabic": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ قُوٓا۟ أَنفُسَكُمْ وَأَهْلِيكُمْ نَارًا وَقُودُهَا ٱلنَّاسُ وَٱلْحِجَارَةُ عَلَيْهَا مَلَـٰٓئِكَةٌ غِلَاظٌ شِدَادٌ لَّا يَعْصُونَ ٱللَّهَ مَآ أَمَرَهُمْ وَيَفْعَلُونَ مَا يُؤْمَرُونَ",
            "fr": "Ô vous qui avez cru ! Préservez vos personnes et vos familles, d’un Feu dont le combustible sera les gens et les pierres, surveillé par des Anges rudes, durs, ne désobéissant jamais à Allah en ce qu’Il leur commande, et faisant strictement ce qu’on leur ordonne.",
            "en": "O you who have believed, protect yourselves and your families from a Fire whose fuel is people and stones, over which are [appointed] angels, harsh and severe; they do not disobey Allāh in what He commands them but do what they are commanded.",
            "highlight": "Préservez vos personnes et vos familles, d’un Feu dont le combustible sera les gens et les pierres",
            "highlightEn": "protect yourselves and your families from a Fire whose fuel is people and stones",
            "id": "enfer-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 3265",
            "url": "https://sunnah.com/bukhari:3265",
            "fr": "Rapporté par Abu Huraira : Le Messager d’Allah (ﷺ) a dit : « Votre feu (ordinaire) n’est qu’une des 70 parties du Feu (de l’Enfer). » Quelqu’un a demandé : « Ô Messager d’Allah (ﷺ), ce feu (ordinaire) aurait suffi (pour punir les incroyants). » Le Messager d’Allah a dit : « Le Feu (de l’Enfer) a 69 parties de plus que le feu ordinaire, et chaque partie est aussi chaude que ce feu (d’ici-bas). »",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Your (ordinary) fire is one of 70 parts of the (Hell) Fire.\" Someone asked, \"O Allah's Messenger (ﷺ) This (ordinary) fire would have been sufficient (to torture the unbelievers),\" Allah's Apostle said, \"The (Hell) Fire has 69 parts more than the ordinary (worldly) fire, each part is as hot as this (worldly) fire",
            "highlight": "Votre feu (ordinaire) n’est qu’une des 70 parties du Feu (de l’Enfer).",
            "highlightEn": "Your (ordinary) fire is one of 70 parts of the (Hell) Fire.",
            "id": "enfer-2"
          },
          {
            "kind": "quran",
            "ref": "Coran 18:29",
            "refEn": "Quran 18:29",
            "url": "https://quran.com/18/29",
            "arabic": "وَقُلِ ٱلْحَقُّ مِن رَّبِّكُمْ ۖ فَمَن شَآءَ فَلْيُؤْمِن وَمَن شَآءَ فَلْيَكْفُرْ ۚ إِنَّآ أَعْتَدْنَا لِلظَّـٰلِمِينَ نَارًا أَحَاطَ بِهِمْ سُرَادِقُهَا ۚ وَإِن يَسْتَغِيثُوا۟ يُغَاثُوا۟ بِمَآءٍ كَٱلْمُهْلِ يَشْوِى ٱلْوُجُوهَ ۚ بِئْسَ ٱلشَّرَابُ وَسَآءَتْ مُرْتَفَقًا",
            "fr": "Et dis : \"La vérité émane de votre Seigneur !\" Quiconque le veut, qu’il croit, et quiconque le veut qu’il mécroit.\" Nous avons préparé pour les injustes un Feu dont les flammes les cernent. Et s’ils implorent à boire on les abreuvera d’une eau comme du métal fondu brûlant les visages. Quelle mauvaise boisson et quelle détestable demeure !",
            "en": "And say, \"The truth is from your Lord, so whoever wills - let him believe; and whoever wills - let him disbelieve.\" Indeed, We have prepared for the wrongdoers a fire whose walls will surround them. And if they call for relief, they will be relieved with water like murky oil, which scalds [their] faces. Wretched is the drink, and evil is the resting place.",
            "highlight": "Nous avons préparé pour les injustes un Feu dont les flammes les cernent.",
            "highlightEn": "We have prepared for the wrongdoers a fire whose walls will surround them.",
            "id": "enfer-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6561",
            "url": "https://sunnah.com/bukhari:6561",
            "fr": "Rapporté par An-Nu`man : J’ai entendu le Prophète (ﷺ) dire : « La personne qui recevra le châtiment le plus léger parmi les gens du Feu, au Jour de la Résurrection, sera un homme sous la voûte des pieds duquel on placera une braise qui fera bouillir son cerveau. »",
            "en": "Narrated An-Nu`man: I heard the Prophet (ﷺ) saying, \"The person who will have the least punishment from amongst the Hell Fire people on the Day of Resurrection, will be a man under whose arch of the feet a smoldering ember will be placed so that his brain will boil because of it",
            "highlight": "La personne qui recevra le châtiment le plus léger",
            "highlightEn": "The person who will have the least punishment",
            "id": "enfer-4"
          }
        ]
      },
      {
        "id": "eternite",
        "arabic": "الخلود",
        "title": "L’éternité",
        "titleEn": "Eternity",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 4730",
            "url": "https://sunnah.com/bukhari:4730",
            "fr": "Rapporté par Abu Sa`id Al-Khudri : Le Messager d’Allah (ﷺ) a dit : « Le Jour de la Résurrection, la Mort sera amenée sous la forme d’un bélier noir et blanc. Un crieur appellera : “Ô gens du Paradis !” Ils tendront alors le cou et regarderont attentivement. Le crieur dira : “Reconnaissez-vous ceci ?” Ils répondront : “Oui, c’est la Mort.” À ce moment, tous l’auront vue. Puis il sera annoncé de nouveau : “Ô gens de l’Enfer !” Ils tendront le cou et regarderont attentivement. Le crieur dira : “Reconnaissez-vous ceci ?” Ils répondront : “Oui, c’est la Mort.” Et tous l’auront vue. Ensuite, ce bélier sera égorgé et le crieur dira : “Ô gens du Paradis ! Vous serez éternels, plus de mort. Ô gens de l’Enfer ! Vous serez éternels, plus de mort.” » Puis le Prophète récita : « Et avertis-les du Jour du regret, quand tout sera décidé, alors qu’ils sont insouciants (c’est-à-dire les gens de ce monde) et qu’ils ne croient pas. »",
            "en": "Narrated Abu Sa`id Al-Khudri: Allah's Messenger (ﷺ) said, \"On the Day of Resurrection Death will be brought forward in the shape of a black and white ram. Then a call maker will call, 'O people of Paradise!' Thereupon they will stretch their necks and look carefully. The caller will say, 'Do you know this?' They will say, 'Yes, this is Death.' By then all of them will have seen it. Then it will be announced again, 'O people of Hell !' They will stretch their necks and look carefully. The caller will say, 'Do you know this?' They will say, 'Yes, this is Death.' And by then all of them will have seen it. Then it (that ram) will be slaughtered and the caller will say, 'O people of Paradise! Eternity for you and no death O people of Hell! Eternity for you and no death.\"' Then the Prophet, recited:-- 'And warn them of the Day of distress when the case has been decided, while (now) they are in a state of carelessness (i.e. the people of the world) and they do not believe",
            "highlight": "Vous serez éternels, plus de mort.",
            "highlightEn": "Eternity for you and no death",
            "id": "eternite-1"
          }
        ]
      }
    ]
  }
];

export const AKHIRA_STAGES: AkhiraStage[] = AKHIRA_PARTS.flatMap((part) => part.stages);
export const getAkhiraStage = (id?: string) => AKHIRA_STAGES.find((stage) => stage.id === id);
