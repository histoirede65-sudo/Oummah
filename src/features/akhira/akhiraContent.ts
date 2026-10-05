/**
 * Content of the « L’au-delà » module. Generated from the sources, nothing written by hand:
 * - verses: Arabic (quran.com, Uthmani), Hamidullah (quran.com 31) in French, Saheeh International (20) in English;
 * - hadiths: French and English text of the fawazahmed0 collections, word for word; references and links as on
 *   sunnah.com; Abû Dâwûd only when al-Albânî graded the hadith sahih;
 * - Ibn Bâz and Ibn ‘Uthaymîn: Arabic copied from their official websites (checked against the page), with a literal
 *   translation.
 * « […] » marks a passage left out. `highlight` is a phrase copied from the text itself, shown large on the page.
 */
export type AkhiraText = {
  id: string;
  kind: "quran" | "hadith" | "scholar";
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
export type AkhiraPart = { id: string; title: string; titleEn: string; note?: string; noteEn?: string; stages: AkhiraStage[] };

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
            "kind": "hadith",
            "ref": "Sunan Abî Dâwûd 4753 · authentifié (sahîh) par al-Albânî",
            "url": "https://sunnah.com/abudawud:4753",
            "fr": "Rapporté par Al-Bara’ ibn Azib رضي الله عنه : Nous sommes sortis avec le Messager d’Allah ﷺ pour accompagner le cercueil d’un homme des Ansar. Quand nous sommes arrivés à sa tombe, elle n’était pas encore creusée. Le Messager d’Allah ﷺ s’est assis, et nous nous sommes assis autour de lui, comme si des oiseaux étaient posés sur nos têtes. Il tenait un bâton avec lequel il grattait la terre. Il leva alors la tête et dit : « Cherchez la protection d’Allah contre le châtiment dans la tombe. » Il le dit deux ou trois fois. Dans la version de Jabir, il est ajouté : « Il entend le bruit de leurs sandales quand ils s’en vont, et à ce moment-là, on lui demande : “Ô untel ! Qui est ton Seigneur, quelle est ta religion, et qui est ton Prophète ?” » La version de Hannad dit : « Deux anges viendront à lui, le feront asseoir et lui demanderont : “Qui est ton Seigneur ?” Il répondra : “Mon Seigneur est Allah.” Ils lui demanderont : “Quelle est ta religion ?” Il répondra : “Ma religion est l’islam.” Ils lui demanderont : “Que disais-tu de l’homme qui a été envoyé parmi vous ?” Il répondra : “C’est le Messager d’Allah ﷺ.” Ils demanderont : “Comment as-tu su cela ?” Il répondra : “J’ai lu le Livre d’Allah, j’y ai cru et je l’ai reconnu comme vrai ; ce qui est confirmé par la parole d’Allah : ‘Allah affermit ceux qui croient par une parole ferme dans la vie présente et dans l’au-delà.’ ” » La version commune dit : « Alors un crieur appellera du ciel : “Mon serviteur a dit la vérité, alors étendez-lui un lit du Paradis, habillez-le d’un vêtement du Paradis et ouvrez-lui une porte vers le Paradis.” Ainsi, une brise et un parfum du Paradis lui parviendront, et son espace sera élargi à perte de vue. » Il mentionna aussi la mort du mécréant, en disant : « Son âme sera rendue à son corps, deux anges viendront à lui, le feront asseoir et lui demanderont : “Qui est ton Seigneur ?” Il répondra : “Hélas, je ne sais pas.” Ils lui demanderont : “Quelle est ta religion ?” Il répondra : “Hélas, je ne sais pas.” Ils demanderont : “Qui était l’homme envoyé parmi vous ?” Il répondra : “Hélas, je ne sais pas.” Alors un crieur appellera du ciel : “Il a menti, alors étendez-lui un lit de l’Enfer, habillez-le d’un vêtement de l’Enfer et ouvrez-lui une porte vers l’Enfer.” Alors la chaleur et un vent empoisonné de l’Enfer lui parviendront, et sa tombe sera resserrée jusqu’à ce que ses côtes se rejoignent. » La version de Jabir ajoute : « Un être aveugle et muet sera alors chargé de lui, muni d’un marteau si lourd que s’il frappait une montagne avec, elle deviendrait poussière. Il le frappera avec, et tout ce qui se trouve entre l’est et l’ouest l’entendra, sauf les hommes et les djinns, et il deviendra poussière. Ensuite, son âme lui sera rendue. »",
            "en": "Narrated Al-Bara' ibn Azib: We went out with the Messenger of Allah (ﷺ) accompanying the bier of a man of the Ansar. When we reached his grave, it was not yet dug. So the Messenger of Allah (ﷺ) sat down and we also sat down around him as if birds were over our heads. He had in his hand a stick with which he was scratching the ground. He then raised his head and said: Seek refuge with Allah from the punishment in the grave. He said it twice or thrice. The version of Jabir adds here: He hears the beat of their sandals when they go back, and at that moment he is asked: O so and so! Who is your Lord, what is your religion, and who is your Prophet? Hannad's version says: Two angels will come to him, make him sit up and ask him: Who is your Lord? He will reply: My Lord is Allah. They will ask him: What is your religion? He will reply: My religion is Islam. They will ask him: What is your opinion about the man who was sent on a mission among you? He will reply: He is the Messenger of Allah (ﷺ). They will ask: Who made you aware of this? He will reply: I read Allah's Book, believed in it, and considered it true; which is verified by Allah's words: \"Allah's Book, believed in it, and considered it true, which is verified by Allah's words: \"Allah establishes those who believe with the word that stands firm in this world and the next.\" The agreed version reads: Then a crier will call from Heaven: My servant has spoken the truth, so spread a bed for him from Paradise, clothe him from Paradise, and open a door for him into Paradise. So some of its air and perfume will come to him, and a space will be made for him as far as the eye can see. He also mentioned the death of the infidel, saying: His spirit will be restored to his body, two angels will come to him, make him sit up and ask him: Who is your Lord? He will reply: Alas, alas! I do not know. They will ask him: What is your religion? He will reply: Alas, alas! I do not know. They will ask: Who was the man who was sent on a mission among you? He will reply: Alas, alas! I do not know. Then a crier will call from Heaven: He has lied, so spread a bed for him from Hell, clothe him from Hell, and open for him a door into Hell. Then some of its heat and pestilential wind will come to him, and his grave will be compressed, so that his ribs will be crushed together. Jabir's version adds: One who is blind and dumb will then be placed in charge of him, having a sledge-hammer such that if a mountain were struck with it, it would become dust. He will give him a blow with it which will be heard by everything between the east and the west except by men and jinn, and he will become dust. Then his spirit will be restored to him",
            "highlight": "Mon serviteur a dit la vérité",
            "highlightEn": "My servant has spoken the truth",
            "refEn": "Sunan Abi Dawud 4753 · graded sahih by al-Albânî",
            "id": "tombe-2"
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
            "id": "tombe-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1369",
            "url": "https://sunnah.com/bukhari:1369",
            "fr": "Rapporté par Al-Bara' bin 'Azib : Le Prophète (ﷺ) a dit : « Quand un croyant fidèle est assis dans sa tombe, alors (les anges) viennent à lui et il atteste que nul n’a le droit d’être adoré en dehors d’Allah et que Muhammad est le Messager d’Allah. Et cela correspond à la parole d’Allah : Allah affermit ceux qui croient par la parole ferme... (14.27). » Rapporté aussi par Shu'ba : Même chose, et il a ajouté : « Allah affermit ceux qui croient... (14.27) a été révélé à propos du châtiment de la tombe. »",
            "en": "Narrated Al-Bara' bin 'Azib : The Prophet (ﷺ) said, \"When a faithful believer is made to sit in his grave, then (the angels) come to him and he testifies that none has the right to be worshipped but Allah and Muhammad is Allah's Apostle. And that corresponds to Allah's statement: Allah will keep firm those who believe with the word that stands firm . . . (14.27). Narrated Shu'ba: Same as above and added, \"Allah will keep firm those who believe . . . (14.27) was revealed concerning the punishment of the grave",
            "highlight": "a été révélé à propos du châtiment de la tombe",
            "highlightEn": "was revealed concerning the punishment of the grave",
            "id": "tombe-4"
          },
          {
            "kind": "scholar",
            "ref": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 12253",
            "refEn": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 12253",
            "url": "https://old.binothaimeen.net/content/12253",
            "arabic": "مذهب أهل السنة والجماعة في الحياة البرزخية أن الإنسان إذا دفن وتولى عنه أصحابه أتاه ملكان فأجلساه، وسألاه عن ثلاثة أشياء: من ربك؟ وما دينك؟ ومن نبيك؟ […] ثم يبقى المؤمن منعماً في قبره، والمنافق معذباً في قبره. والعذاب يكون في الأصل على الروح، ولهذا يحس بالعذاب ولو تمزق بدنه وأكلته السباع، وربما تتصل الروح بالبدن ويكون العذاب على الروح والبدن جميعاً. ومسائل الآخرة كلها أمور غيب لا نطلع على شيء منها إلا عن طريق الوحي",
            "fr": "La position des gens de la Sunna et du consensus sur la vie du barzakh est que, lorsque l’homme est enterré et que ses compagnons s’en sont allés, deux anges viennent à lui, le font asseoir et l’interrogent sur trois choses : Qui est ton Seigneur ? Quelle est ta religion ? Qui est ton prophète ? […] Puis le croyant demeure comblé de bienfaits dans sa tombe, et l’hypocrite demeure châtié dans sa tombe. Le châtiment porte à l’origine sur l’âme ; c’est pourquoi il ressent le châtiment même si son corps a été déchiqueté et dévoré par les bêtes sauvages ; et il arrive que l’âme se joigne au corps : le châtiment porte alors sur l’âme et le corps ensemble. Les questions de l’au-delà sont toutes des choses de l’invisible : nous n’en connaissons rien, sinon par la Révélation.",
            "en": "The position of Ahl as-Sunna wal-Jama‘a on the life of the barzakh is that when a person is buried and his companions have turned away from him, two angels come to him, make him sit up and ask him about three things: Who is your Lord? What is your religion? Who is your prophet? […] Then the believer remains in bliss in his grave, and the hypocrite remains punished in his grave. The punishment is in principle upon the soul; this is why he feels the punishment even if his body has been torn apart and eaten by wild beasts; and the soul may be joined to the body, and the punishment is then upon the soul and the body together. All the matters of the Hereafter are matters of the unseen: we know nothing of them except by way of revelation.",
            "highlight": "Le châtiment porte à l’origine sur l’âme",
            "highlightEn": "The punishment is in principle upon the soul",
            "id": "tombe-5"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 1377",
            "url": "https://sunnah.com/bukhari:1377",
            "fr": "Rapporté par Abou Hourayra : Le Messager d’Allah (ﷺ) invoquait Allah en disant : « Allahumma ini a`udhu bika min ‘adhabi-l-Qabr, wa min ‘adhabi-nnar, wa min fitnati-l-mahya wa-lmamat, wa min fitnati-l-masih ad-dajjal. » (Ô Allah ! Je cherche refuge auprès de Toi contre le châtiment dans la tombe, contre le châtiment du Feu, contre les épreuves de la vie et de la mort, et contre les tentations du faux Messie, Al-Masih Ad-Dajjal)",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) used to invoke (Allah): \"Allahumma ini a`udhu bika min 'adhabi-l-Qabr, wa min 'adhabi-nnar, wa min fitnati-l-mahya wa-lmamat, wa min fitnati-l-masih ad-dajjal. (O Allah! I seek refuge with you from the punishment in the grave and from the punishment in the Hell fire and from the afflictions of life and death, and the afflictions of Al-Masih Ad-Dajjal)",
            "highlight": "Je cherche refuge auprès de Toi contre le châtiment dans la tombe",
            "highlightEn": "I seek refuge with you from the punishment in the grave",
            "id": "tombe-6"
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
            "kind": "hadith",
            "ref": "Sahih Muslim 1887",
            "url": "https://sunnah.com/muslim:1887",
            "fr": "Rapporté par Masruq رضي الله عنه : Nous avons interrogé ‘Abdullah au sujet du verset coranique : « Ne pense pas que ceux qui sont tués dans la voie d’Allah sont morts. Non, ils sont vivants, recevant leur subsistance auprès de leur Seigneur… » (Coran 3 : 169). Il a dit : Nous avons demandé la signification de ce verset au Prophète ﷺ, qui a répondu : « Les âmes des martyrs vivent dans des corps d’oiseaux verts qui ont leurs nids dans des lampes suspendues au Trône du Tout-Puissant. Ils mangent les fruits du Paradis où ils veulent, puis se reposent dans ces lampes. Une fois, leur Seigneur les regarda et leur demanda : “Voulez-vous quelque chose ?” Ils répondirent : “Que pourrions-nous désirer de plus ? Nous mangeons les fruits du Paradis où nous voulons.” Leur Seigneur leur posa la question trois fois. Voyant qu’ils seraient continuellement interrogés, ils dirent : “Ô Seigneur, nous souhaitons que Tu rendes nos âmes à nos corps afin que nous soyons tués à nouveau dans Ta voie.” Quand Allah vit qu’ils n’avaient plus de besoin, Il les laissa (dans leur joie au Paradis). »",
            "en": "It has been narrated on the authority of Masruq Who said: We asked 'Abdullah about the Qur'anic verse:\" Think not of those who are slain in Allah's way as dead. Nay, they are alive, finding their sustenance in the presence of their Lord..\" (iii. 169). He said: We asked the meaning of the verse (from the Holy Prophet) who said: The souls, of the martyrs live in the bodies of green birds who have their nests in chandeliers hung from the throne of the Almighty. They eat the fruits of Paradise from wherever they like and then nestle in these chandeliers. Once their Lord cast a glance at them and said: Do ye want anything? They said: What more shall we desire? We eat the fruit of Paradise from wherever we like. Their Lord asked them the same question thrice. When they saw that they will continue to be asked and not left (without answering the question). they said: O Lord, we wish that Thou mayest return our souls to our bodies so that we may be slain in Thy way once again. When He (Allah) saw that they had no need, they were left (to their joy in heaven)",
            "highlight": "Les âmes des martyrs vivent dans des corps d’oiseaux verts",
            "highlightEn": "The souls, of the martyrs live in the bodies of green birds",
            "id": "barzakh-3"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 15778",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 15778",
            "url": "https://binbaz.org.sa/fatwas/15778",
            "arabic": "الشهداء لشرفهم، وفضل عملهم بين الله -سبحانه- أنهم أحياء عند ربهم يرزقون، حياةً خاصة، حياةً برزخية، وهم أموات، هم أموات، قد حكم فيهم بأحكام الموتى، لكن أرواحهم في نعيم الجنة، في أجواف طير خضر تسرح في الجنة حيث شاءت، ثم تأوي إلى قناديل معلقة تحت العرش، كما أخبر به النبي -عليه الصلاة والسلام- […] وهكذا أرواح المؤمنين عند الله أيضًا في الجنة، حية عند الله في الجنة، لكنهم دون الشهداء […] وهكذا أرواح الكفار حية تعذب في البرزخ، وفي النار، في البرزخ مع الجسد، الجسد في الأرض وهي تعذب في النار، والجسد والروح يوم القيامة يعذبان في النار أيضًا، نسأل الله العافية. فالمؤمنون ينعمون في البرزخ، وفي الجنة أرواحًا، وأجسادًا، والكفار يعذبون في البرزخ، وفي النار أرواحًا وأجسادًا، وللروح نصيبها، وللجسد نصيبه، ولو لم يبق منه إلا القليل.",
            "fr": "Les martyrs, en raison de leur honneur et du mérite de leur œuvre, Allah — gloire à Lui — a montré qu’ils sont vivants auprès de leur Seigneur, pourvus de subsistance, d’une vie particulière, une vie du barzakh ; et ils sont morts, ils sont morts, on leur a appliqué les règles des morts ; mais leurs âmes sont dans les délices du Paradis, dans le ventre d’oiseaux verts qui vont dans le Paradis où elles veulent, puis se retirent dans des lampes suspendues sous le Trône, comme l’a annoncé le Prophète — sur lui la prière et la paix. […] De même, les âmes des croyants sont aussi auprès d’Allah, au Paradis, vivantes auprès d’Allah au Paradis, mais en dessous des martyrs. […] De même, les âmes des mécréants sont vivantes et châtiées dans le barzakh et dans le Feu : dans le barzakh avec le corps, le corps dans la terre tandis qu’elle est châtiée dans le Feu ; et le corps et l’âme, le Jour de la Résurrection, sont châtiés dans le Feu aussi — nous demandons à Allah la préservation. Les croyants sont donc comblés dans le barzakh et au Paradis, âmes et corps, et les mécréants sont châtiés dans le barzakh et dans le Feu, âmes et corps ; l’âme a sa part et le corps a sa part, même s’il n’en reste que peu.",
            "en": "The martyrs, because of their honour and the merit of their deed, Allah — glory be to Him — has made clear that they are alive with their Lord, receiving provision, a particular life, a life of the barzakh; and they are dead, they are dead, the rulings of the dead have been applied to them; but their souls are in the bliss of Paradise, inside green birds that roam in Paradise wherever they wish, then take shelter in lamps hanging beneath the Throne, as the Prophet — upon him be prayer and peace — informed. […] Likewise, the souls of the believers are also with Allah in Paradise, alive with Allah in Paradise, but below the martyrs. […] Likewise, the souls of the disbelievers are alive and punished in the barzakh and in the Fire: in the barzakh with the body, the body in the earth while it is punished in the Fire; and the body and the soul, on the Day of Resurrection, are punished in the Fire as well — we ask Allah for well-being. So the believers are in bliss in the barzakh and in Paradise, souls and bodies, and the disbelievers are punished in the barzakh and in the Fire, souls and bodies; the soul has its share and the body has its share, even if only a little of it remains.",
            "highlight": "les âmes des croyants sont aussi auprès d’Allah, au Paradis",
            "highlightEn": "the souls of the believers are also with Allah in Paradise",
            "id": "barzakh-4"
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
            "id": "barzakh-5"
          }
        ]
      }
    ]
  },
  {
    "id": "hour",
    "title": "L’Heure",
    "titleEn": "The Hour",
    "stages": [
      {
        "id": "signes",
        "arabic": "أشراط الساعة",
        "title": "Les signes de l’Heure",
        "titleEn": "The signs of the Hour",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 2901",
            "url": "https://sunnah.com/muslim:2901",
            "fr": "Rapporté par Hudhayfa ibn Usaid al-Ghifari رضي الله عنه : Le Messager d’Allah ﷺ est venu vers nous à l’improviste alors que nous étions en train de discuter. Il a dit : « De quoi parlez-vous ? » Les compagnons ont répondu : « Nous parlons de l’Heure Dernière. » Il a alors dit : « Elle ne viendra pas avant que vous ne voyiez dix signes : la fumée, le Dajjal, la bête, le lever du soleil à l’ouest, la descente de Jésus, fils de Marie (qu’Allah l’agrée), Gog et Magog, et des affaissements de terre à trois endroits : un à l’est, un à l’ouest et un en Arabie, à la fin desquels un feu surgira du Yémen et poussera les gens vers leur lieu de rassemblement. »",
            "en": "Hudhaifa b. Usaid al-Ghifari reported: Allah's Messenger (ﷺ) came to us all of a sudden as we were (busy in a discussion). He said: What do you discuss about? They (the Companions) said. We are discussing about the Last Hour. Thereupon he said: It will not come until you see ten signs before and (in this connection) he made a mention of the smoke, Dajjal, the beast, the rising of the sun from the west, the descent of Jesus son of Mary (Allah be pleased with him), the Gog and Magog, and land-slides in three places, one in the east, one in the west and one in Arabia at the end of which fire would burn forth from the Yemen, and would drive people to the place of their assembly",
            "highlight": "Elle ne viendra pas avant que vous ne voyiez dix signes",
            "highlightEn": "It will not come until you see ten signs",
            "id": "signes-1"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 8474",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 8474",
            "url": "https://binbaz.org.sa/fatwas/8474",
            "arabic": "أما علاماتها الكبرى التي تكون بقربها هي عشر بينها العلماء: أولها: المهدي ، وهو رجل من بيت النبوة يخرج في آخر الزمان يملأ الأرض عدلاً وقسطاً بعدما ملئت جوراً […] ومنها: الدجال وهذا يقع بعد المهدي […] نزول عيسى أيضاً الشرط الثالث والعلامة الثالثة من أشراط الساعة، نزول عيسى ابن مريم وقتله الدجال […] ثم بقية علامات الساعة من الدخان، وهدم الكعبة، ونزع القرآن من الصدور والمصاحف، ثم طلوع الشمس من مغربها، وخروج الدابة، ثم آخر الآيات حشر النار، نار تخرج من المشرق تسوق الناس إلى محشرهم",
            "fr": "Quant à ses grands signes, qui seront proches d’elle, ils sont dix, que les savants ont exposés. Le premier : al-Mahdî, un homme de la maison de la prophétie qui sortira à la fin des temps et remplira la terre d’équité et de justice après qu’elle a été remplie d’oppression […] Parmi eux : le Dajjâl, et cela arrive après al-Mahdî […] La descente de ‘Îsâ est aussi la troisième condition et le troisième signe parmi les signes de l’Heure : la descente de ‘Îsâ fils de Maryam, et le fait qu’il tue le Dajjâl […] Puis le reste des signes de l’Heure : la fumée, la destruction de la Ka‘ba, le retrait du Coran des poitrines et des mushafs, puis le lever du soleil à son couchant, et la sortie de la Bête ; puis le dernier des signes, le feu du rassemblement : un feu qui sort de l’Orient et pousse les gens vers leur lieu de rassemblement.",
            "en": "As for its major signs, which will be close to it, they are ten, which the scholars have set out. The first: al-Mahdi, a man from the house of prophethood who will come out at the end of time and fill the earth with equity and justice after it had been filled with oppression […] Among them: the Dajjal, and this happens after al-Mahdi […] The descent of ‘Isa is also the third condition and the third sign among the signs of the Hour: the descent of ‘Isa son of Maryam and his killing of the Dajjal […] Then the rest of the signs of the Hour: the smoke, the destruction of the Ka‘ba, the removal of the Quran from the breasts and the copies, then the rising of the sun from where it sets, and the emergence of the Beast; then the last of the signs, the fire of the gathering: a fire that comes out of the East and drives people to their place of gathering.",
            "highlight": "ses grands signes, qui seront proches d’elle, ils sont dix",
            "highlightEn": "its major signs, which will be close to it, they are ten",
            "id": "signes-2"
          }
        ]
      },
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
      }
    ]
  },
  {
    "id": "day",
    "title": "Le Jour de la Résurrection",
    "titleEn": "The Day of Resurrection",
    "note": "La grande intercession et le Bassin avant le jugement, puis le Pont et la passerelle : selon Ibn Bâz (fatwas 6637, 21539, 3262) et Ibn ‘Uthaymîn (fatwa 8263).",
    "noteEn": "The great intercession and the Basin before the reckoning, then the Bridge and the arch: according to Ibn Bâz (fatwas 6637, 21539, 3262) and Ibn ‘Uthaymîn (fatwa 8263).",
    "stages": [
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
        "id": "intercession",
        "arabic": "الشفاعة العظمى",
        "title": "La grande intercession",
        "titleEn": "The great intercession",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 4712",
            "url": "https://sunnah.com/bukhari:4712",
            "fr": "Rapporté par Abu Huraira : On a apporté de la viande cuite au Messager d’Allah (ﷺ), et on lui a présenté l’épaule, car il l’aimait. Il en a mangé un morceau et a dit : « Je serai le chef de tous les gens au Jour de la Résurrection. Savez-vous pourquoi ? Allah rassemblera tous les êtres humains, des premiers aux derniers, sur une même plaine, de sorte que l’annonceur pourra tous se faire entendre et que le spectateur pourra tous les voir. Le soleil se rapprochera tellement que les gens seront dans une détresse et une angoisse qu’ils ne pourront supporter. Alors les gens diront : “Ne voyez-vous pas dans quelle situation nous sommes ? Cherchez quelqu’un qui intercède pour vous auprès de votre Seigneur.” Certains diront aux autres : “Allez voir Adam.” Ils iront donc voir Adam et lui diront : “Tu es le père de l’humanité ; Allah t’a créé de Sa propre main, a insufflé en toi de Son esprit (c’est-à-dire l’esprit qu’Il a créé pour toi), et a ordonné aux anges de se prosterner devant toi ; intercède pour nous auprès de ton Seigneur. Ne vois-tu pas dans quelle situation nous sommes ?” […]",
            "en": "Narrated Abu Huraira: Some (cooked) meat was brought to Allah's Apostle and the meat of a forearm was presented to him as he used to like it. He ate a morsel of it and said, \"I will be the chief of all the people on the Day of Resurrection. Do you know the reason for it? Allah will gather all the human beings of early generations as well as late generations on one plain so that the announcer will be able to make them all hear his voice and the watcher will be able to see all of them. The sun will come so close to the people that they will suffer such distress and trouble as they will not be able to bear or stand. Then the people will say, 'Don't you see to what state you have reached? Won't you look for someone who can intercede for you with your Lord?' Some people will say to some others, 'Go to Adam.' So they will go to Adam and say to him, 'You are the father of mankind; Allah created you with His Own Hand, and breathed into you of His Spirit (meaning the spirit which He created for you); and ordered the angels to prostrate before you; so (please) intercede for us with your Lord. Don't you see in what state we are? Don't you see what condition we have reached?' […]",
            "highlight": "Allah rassemblera tous les êtres humains, des premiers aux derniers, sur une même plaine",
            "highlightEn": "Allah will gather all the human beings of early generations as well as late generations on one plain",
            "id": "intercession-1"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 6637",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 6637",
            "url": "https://binbaz.org.sa/fatwas/6637",
            "arabic": "له ﷺ ثلاث شفاعات خاصة به عليه الصلاة والسلام، إحداها الشفاعة العظمى في أهل الموقف يوم القيامة، فيشفع لهم حتى يقضى بينهم، وهذا هو المقام المحمود",
            "fr": "Il ﷺ a trois intercessions qui lui sont propres — sur lui la prière et la paix. La première est la grande intercession pour les gens de la station le Jour de la Résurrection : il intercède pour eux jusqu’à ce qu’il soit jugé entre eux ; et c’est là la station louable (al-maqâm al-mahmûd).",
            "en": "He ﷺ has three intercessions that are his alone — upon him be prayer and peace. The first is the great intercession for the people of the standing on the Day of Resurrection: he intercedes for them until judgment is passed between them; and this is the praised station (al-maqam al-mahmud).",
            "highlight": "la grande intercession pour les gens de la station",
            "highlightEn": "the great intercession for the people of the standing",
            "id": "intercession-2"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 21539",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 21539",
            "url": "https://binbaz.org.sa/fatwas/21539",
            "arabic": "س: بالنسبة للشفاعة الأولى أوَّلًا يبدأ بها النبيُّ ﷺ؟ ج: نعم في أهل الموقف حتى يُقْضَى بينهم، ثم في أهل الجنة حتى يدخلوها، ثم بعد ذلك فيمَن دخل النار أن يُخرج منها –العُصاة- فيشفع شفاعات عديدة.",
            "fr": "Question : La première intercession, c’est le Prophète ﷺ qui la commence ? Réponse : Oui, pour les gens de la station, jusqu’à ce qu’il soit jugé entre eux ; puis pour les gens du Paradis, jusqu’à ce qu’ils y entrent ; puis ensuite pour ceux qui sont entrés dans le Feu, afin qu’ils en soient sortis — les pécheurs ; il intercède de nombreuses fois.",
            "en": "Question: The first intercession, is it the Prophet ﷺ who begins it? Answer: Yes, for the people of the standing until judgment is passed between them; then for the people of Paradise until they enter it; then after that for those who entered the Fire, that they be brought out of it — the sinners; he intercedes many times.",
            "highlight": "pour les gens de la station, jusqu’à ce qu’il soit jugé entre eux",
            "highlightEn": "for the people of the standing until judgment is passed between them",
            "id": "intercession-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 99",
            "url": "https://sunnah.com/bukhari:99",
            "fr": "Rapporté par Abu Huraira : J’ai dit : « Ô Messager d’Allah (ﷺ) ! Qui sera la personne la plus chanceuse à bénéficier de ton intercession le Jour de la Résurrection ? » Le Messager d’Allah (ﷺ) a dit : Ô Abu Huraira ! « Je pensais que personne ne me poserait cette question avant toi, car je connais ton désir d’apprendre les hadiths. La personne la plus chanceuse à bénéficier de mon intercession le Jour de la Résurrection sera celle qui aura dit sincèrement du fond du cœur : “Nul n’a le droit d’être adoré sauf Allah.” »",
            "en": "Narrated Abu Huraira: I said: \"O Allah's Messenger (ﷺ)! Who will be the luckiest person, who will gain your intercession on the Day of Resurrection?\" Allah's Messenger (ﷺ) said: \"O Abu Huraira! I have thought that none will ask me about it before you as I know your longing for the (learning of) Hadiths. The luckiest person who will have my intercession on the Day of Resurrection will be the one who said sincerely from the bottom of his heart \"None has the right to be worshipped but Allah",
            "highlight": "La personne la plus chanceuse à bénéficier de mon intercession",
            "highlightEn": "The luckiest person who will have my intercession",
            "id": "intercession-4"
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
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 3262",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 3262",
            "url": "https://binbaz.org.sa/fatwas/3262",
            "arabic": "الحوض قبل الصراط، الحوض حين وجود الناس في المحشر، يرده المؤمنون، ويحرمه الكافرون، يرده المؤمنون، ويشربون. ولكل نبي حوض، وحوض نبينا أكبرها وأعظمها، طوله شهر، وعرضه شهر، آنيته عدد نجوم السماء، من يشرب منه لا يظمأ بعدها أبدًا، وهو قبل الصراط، ثم يؤمر الناس بالمرور على الصراط، فمن مر على الصراط؛ نجا، وصار إلى الجنة، ومن لم يمر عليه؛ سقط في النار.",
            "fr": "Le Bassin est avant le Pont : le Bassin, c’est lorsque les gens se trouvent au lieu du rassemblement ; les croyants s’y rendent et les mécréants en sont privés ; les croyants s’y rendent et boivent. Chaque prophète a un bassin, et le bassin de notre Prophète est le plus grand et le plus imposant : sa longueur est d’un mois, sa largeur d’un mois, ses récipients sont aussi nombreux que les étoiles du ciel ; qui en boit n’a plus jamais soif ensuite. Il est avant le Pont ; puis les gens reçoivent l’ordre de passer sur le Pont : qui passe sur le Pont est sauvé et va au Paradis, et qui n’y passe pas tombe dans le Feu.",
            "en": "The Basin is before the Bridge: the Basin is when people are at the place of gathering; the believers come to it and the disbelievers are denied it; the believers come to it and drink. Every prophet has a basin, and the basin of our Prophet is the largest and the greatest: its length is a month, its width is a month, its vessels are as many as the stars of the sky; whoever drinks from it will never be thirsty after it. It is before the Bridge; then the people are ordered to pass over the Bridge: whoever passes over the Bridge is saved and goes to Paradise, and whoever does not pass over it falls into the Fire.",
            "highlight": "Le Bassin est avant le Pont",
            "highlightEn": "The Basin is before the Bridge",
            "id": "bassin-2"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 21539",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 21539",
            "url": "https://binbaz.org.sa/fatwas/21539",
            "arabic": "س: الحوض قبل الصراط؟ ج: الحوض قبل الصراط وقبل الحساب والجزاء، يرده الناسُ يوم القيامة وهم ظِمَاء.",
            "fr": "Question : Le Bassin est-il avant le Pont ? Réponse : Le Bassin est avant le Pont, et avant le jugement et la rétribution ; les gens s’y rendent le Jour de la Résurrection alors qu’ils ont soif.",
            "en": "Question: Is the Basin before the Bridge? Answer: The Basin is before the Bridge, and before the reckoning and the recompense; people come to it on the Day of Resurrection while they are thirsty.",
            "highlight": "avant le jugement et la rétribution",
            "highlightEn": "before the reckoning and the recompense",
            "id": "bassin-3"
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
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6539",
            "url": "https://sunnah.com/bukhari:6539",
            "fr": "Rapporté par `Adi bin Hatim : Le Prophète (ﷺ) a dit : « Le Jour de la Résurrection, chacun d’entre vous sera interrogé directement par Allah, sans aucun interprète entre lui et Lui (Allah). Il regardera devant lui et ne verra rien, puis il regardera encore devant lui, et le Feu (de l'Enfer) sera face à lui. Donc, que celui d’entre vous qui peut se protéger du Feu le fasse, même en donnant la moitié d’une datte en aumône. »",
            "en": "Narrated `Adi bin Hatim: The Prophet (ﷺ) said, \"There will be none among you but will be talked to by Allah on the Day of Resurrection, without there being an interpreter between him and Him (Allah) . He will look and see nothing ahead of him, and then he will look (again for the second time) in front of him, and the (Hell) Fire will confront him. So, whoever among you can save himself from the Fire, should do so even with one half of a date (to give in charity)",
            "highlight": "sans aucun interprète entre lui et Lui (Allah)",
            "highlightEn": "without there being an interpreter between him and Him (Allah)",
            "id": "jugement-1"
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
            "id": "jugement-2"
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
            "id": "jugement-3"
          },
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
            "id": "jugement-4"
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
            "id": "jugement-5"
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
            "kind": "scholar",
            "ref": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 8263",
            "refEn": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 8263",
            "url": "https://old.binothaimeen.net/content/8263",
            "arabic": "الصراط -كما ذكر السائل- حق واعتقاد وجوده واجب، وهو مما يعتقده أهل السنة والجماعة، والصراط: عبارة عن جسر ممدود على متن جهنم أدق من الشعر وأحد من السيف […] وهذا الصراط يعبر الناس عليه على قدر أعمالهم، منهم السريع ومنهم البطيء […] وأما الكافرون فإنهم لا يعبرون على هذا الصراط، وإنما يحشرون إلى جهنم ((وِرْدًا)) كما قال الله عز وجل",
            "fr": "Le Pont — comme l’a mentionné le questionneur — est une vérité, et croire en son existence est obligatoire ; c’est ce que croient les gens de la Sunna et du consensus. Le Pont est un pont tendu au-dessus de l’Enfer, plus fin que le cheveu et plus tranchant que l’épée […] Les gens traversent ce Pont selon leurs œuvres : parmi eux le rapide et parmi eux le lent […] Quant aux mécréants, ils ne traversent pas ce Pont ; ils sont seulement conduits vers l’Enfer « en troupeau », comme l’a dit Allah, à Lui la puissance et la majesté.",
            "en": "The Bridge — as the questioner mentioned — is true, and believing in its existence is obligatory; it is part of what Ahl as-Sunna wal-Jama‘a believe. The Bridge is a bridge stretched over Hell, thinner than a hair and sharper than a sword […] People cross this Bridge according to their deeds: among them the fast and among them the slow […] As for the disbelievers, they do not cross this Bridge; they are only driven to Hell “as a thirsty herd”, as Allah, the Mighty and Majestic, said.",
            "highlight": "plus fin que le cheveu et plus tranchant que l’épée",
            "highlightEn": "thinner than a hair and sharper than a sword",
            "id": "pont-2"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 2791",
            "url": "https://sunnah.com/muslim:2791",
            "fr": "Rapporté par Aïcha رضي الله عنها : J’ai demandé au Messager d’Allah ﷺ au sujet de ces paroles d’Allah, le Très-Haut et Glorieux : « Le jour où la terre sera changée en une autre terre, et les cieux aussi seront changés » (14:48). J’ai demandé : « Où seront les gens ce jour-là ? » Il a répondu : « Ils seront sur le Sirat. »",
            "en": "A'isha reported: I asked Allah's Messenger (ﷺ) about the words of Allah, the Exalted and Glorious:\" The day when the earth would be changed for another earth and Heaven would be changed for another Heaven (XiV. 48), (and inquired: ) (Allah's Messenger), where would the people be on that day? He said: They would be on the Sirat",
            "highlight": "Ils seront sur le Sirat.",
            "highlightEn": "They would be on the Sirat",
            "id": "pont-3"
          }
        ]
      },
      {
        "id": "qantara",
        "arabic": "القنطرة",
        "title": "La passerelle et l’entrée",
        "titleEn": "The arch and the entry",
        "texts": [
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6535",
            "url": "https://sunnah.com/bukhari:6535",
            "fr": "Rapporté par Abu Sa`id Al-Khudri : Le Messager d’Allah (ﷺ) a dit : « Les croyants, après avoir été sauvés du Feu (de l’Enfer), seront arrêtés sur un pont entre le Paradis et l’Enfer, et ils régleront entre eux les injustices qu’ils se sont faites dans ce monde. Une fois purifiés et débarrassés de leurs rancunes (par cette réconciliation), ils entreront au Paradis. Par Celui qui détient l’âme de Muhammad dans Sa main, chacun d’eux connaîtra sa place au Paradis mieux qu’il ne connaissait sa maison dans ce monde. »",
            "en": "Narrated Abu Sa`id Al-Khudri: Allah's Messenger (ﷺ) said, \"The believers, after being saved from the (Hell) Fire, will be stopped at a bridge between Paradise and Hell and mutual retaliation will be established among them regarding wrongs they have committed in the world against one another. After they are cleansed and purified (through the retaliation), they will be admitted into Paradise; and by Him in Whose Hand Muhammad's soul is, everyone of them will know his dwelling in Paradise better than he knew his dwelling in this world",
            "highlight": "seront arrêtés sur un pont entre le Paradis et l’Enfer",
            "highlightEn": "will be stopped at a bridge between Paradise and Hell",
            "id": "qantara-1"
          },
          {
            "kind": "scholar",
            "ref": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 8263",
            "refEn": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 8263",
            "url": "https://old.binothaimeen.net/content/8263",
            "arabic": "وأول من يجوز بأمته هو محمد صلى الله عليه وسلم ثم بعد هذا الصراط يوقفون على قنطرة بين الجنة والنار ويقتص لبعضهم من بعض ثم يدخلون الجنة بعد أن يشفع النبي عليه الصلاة والسلام إلى ربه في فتح أبواب الجنة، فيشفع إلى الله عز وجل أن تفتح أبواب الجنة فتفتح، ويكون أول من يدخلها هو محمد صلى الله عليه وسلم.",
            "fr": "Le premier à le franchir avec sa communauté est Muhammad ﷺ ; puis, après ce Pont, ils sont arrêtés sur une passerelle (qantara) entre le Paradis et le Feu, et l’on fait justice des uns envers les autres ; puis ils entrent au Paradis, après que le Prophète — sur lui la prière et la paix — a intercédé auprès de son Seigneur pour l’ouverture des portes du Paradis : il intercède auprès d’Allah, à Lui la puissance et la majesté, pour que les portes du Paradis soient ouvertes, et elles s’ouvrent ; et le premier à y entrer est Muhammad ﷺ.",
            "en": "The first to pass over it with his nation is Muhammad ﷺ; then, after this Bridge, they are stopped on an arch (qantara) between Paradise and the Fire, and retribution is taken for some of them from others; then they enter Paradise after the Prophet — upon him be prayer and peace — has interceded with his Lord for the opening of the gates of Paradise: he intercedes with Allah, the Mighty and Majestic, for the gates of Paradise to be opened, and they are opened; and the first to enter it is Muhammad ﷺ.",
            "highlight": "le premier à y entrer est Muhammad ﷺ",
            "highlightEn": "the first to enter it is Muhammad ﷺ",
            "id": "qantara-2"
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 6637",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 6637",
            "url": "https://binbaz.org.sa/fatwas/6637",
            "arabic": "الشفاعة الثانية: الشفاعة في أهل الجنة حتى يدخلوا الجنة، فإنهم لا يدخلونها إلا بشفاعته عليه الصلاة والسلام، فيشفع إلى ربه فيؤذن لهم في دخول الجنة.",
            "fr": "La deuxième intercession : l’intercession pour les gens du Paradis, afin qu’ils entrent au Paradis, car ils n’y entrent que par son intercession — sur lui la prière et la paix : il intercède auprès de son Seigneur, et il leur est permis d’entrer au Paradis.",
            "en": "The second intercession: the intercession for the people of Paradise so that they enter Paradise, for they do not enter it except by his intercession — upon him be prayer and peace: he intercedes with his Lord, and they are permitted to enter Paradise.",
            "highlight": "ils n’y entrent que par son intercession",
            "highlightEn": "they do not enter it except by his intercession",
            "id": "qantara-3"
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
            "ref": "Sahih al-Bukhari 3257",
            "url": "https://sunnah.com/bukhari:3257",
            "fr": "Rapporté par Sahl bin Sa`d : Le Prophète (ﷺ) a dit : « Le Paradis a huit portes, et l’une d’elles s’appelle Ar-Raiyan ; seuls ceux qui jeûnent y entreront. »",
            "en": "Narrated Sahl bin Sa`d: The Prophet (ﷺ) said, \"Paradise has eight gates, and one of them is called Ar-Raiyan through which none will enter but those who observe fasting",
            "highlight": "Le Paradis a huit portes",
            "highlightEn": "Paradise has eight gates",
            "id": "paradis-1"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 3244",
            "url": "https://sunnah.com/bukhari:3244",
            "fr": "Rapporté par Abu Huraira : Le Messager d’Allah ﷺ a dit : « Allah a dit : ‘J’ai préparé pour Mes serviteurs pieux ce qu’aucun œil n’a jamais vu, aucune oreille n’a jamais entendu et ce qu’aucun être humain n’a jamais imaginé.’ Si vous le souhaitez, vous pouvez réciter ce verset du Coran : ‘Nul ne sait ce qui leur est réservé comme joie, en récompense de ce qu’ils faisaient.’ »",
            "en": "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Allah said, \"I have prepared for My Pious slaves things which have never been seen by an eye, or heard by an ear, or imagined by a human being.\" If you wish, you can recite this Verse from the Holy Qur'an:--\"No soul knows what is kept hidden for them, of joy as a reward for what they used to do",
            "highlight": "ce qu’aucun œil n’a jamais vu, aucune oreille n’a jamais entendu",
            "highlightEn": "things which have never been seen by an eye, or heard by an ear",
            "id": "paradis-2"
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
            "id": "paradis-3"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 2790",
            "url": "https://sunnah.com/bukhari:2790",
            "fr": "Rapporté par Abu Huraira : […] Il a dit : « Le Paradis a cent degrés qu’Allah a réservés aux combattants pour Sa cause, et la distance entre chaque degré est comme celle entre le ciel et la terre. Donc, quand vous demandez quelque chose à Allah, demandez-lui Al-Firdaous, qui est la meilleure et la plus haute partie du Paradis. » (Le sous-narrateur a ajouté : « Je pense que le Prophète a aussi dit : ‘Au-dessus d’elle (c’est-à-dire Al-Firdaous) se trouve le Trône du Tout Miséricordieux (c’est-à-dire Allah), et de là coulent les rivières du Paradis.’ »",
            "en": "Narrated Abu Huraira: […] He said, \"Paradise has one-hundred grades which Allah has reserved for the Mujahidin who fight in His Cause, and the distance between each of two grades is like the distance between the Heaven and the Earth. So, when you ask Allah (for something), ask for Al-firdaus which is the best and highest part of Paradise.\" (The sub-narrator added, \"I think the Prophet also said, 'Above it (i.e. Al-Firdaus) is the Throne of Beneficent (i.e. Allah), and from it originate the rivers of Paradise",
            "highlight": "Le Paradis a cent degrés",
            "highlightEn": "Paradise has one-hundred grades",
            "id": "paradis-4"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6571",
            "url": "https://sunnah.com/bukhari:6571",
            "fr": "Rapporté par `Abdullah : Le Prophète (ﷺ) a dit : « Je connais la personne qui sera la dernière à sortir du Feu et la dernière à entrer au Paradis. Ce sera un homme qui sortira du Feu en rampant, et Allah lui dira : ‘Va et entre au Paradis.’ Il s’y rendra, mais pensera qu’il est déjà plein, alors il reviendra et dira : ‘Seigneur, je l’ai trouvé plein.’ Allah lui dira : ‘Va et entre au Paradis, et tu auras l’équivalent du monde et dix fois plus (ou, tu auras dix fois ce que le monde contient).’ À ce moment-là, l’homme dira : ‘Te moques-tu de moi (ou ris-tu de moi) alors que Tu es le Roi ?’ J’ai vu le Messager d’Allah (ﷺ) sourire en disant cela, au point que ses dents de devant étaient visibles. On dit que cet homme sera celui qui aura le rang le plus bas parmi les gens du Paradis. »",
            "en": "Narrated `Abdullah: The Prophet (ﷺ) said, \"I know the person who will be the last to come out of the (Hell) Fire, and the last to enter Paradise. He will be a man who will come out of the (Hell) Fire crawling, and Allah will say to him, 'Go and enter Paradise.' He will go to it, but he will imagine that it had been filled, and then he will return and say, 'O Lord, I have found it full.' Allah will say, 'Go and enter Paradise, and you will have what equals the world and ten times as much (or, you will have as much as ten times the like of the world).' On that, the man will say, 'Do you mock at me (or laugh at me) though You are the King?\" I saw Allah's Messenger (ﷺ) (while saying that) smiling that his premolar teeth became visible. It is said that will be the lowest in degree amongst the people of Paradise",
            "highlight": "la dernière à entrer au Paradis",
            "highlightEn": "the last to enter Paradise",
            "id": "paradis-5"
          },
          {
            "kind": "hadith",
            "ref": "Sahih Muslim 633",
            "url": "https://sunnah.com/muslim:633",
            "fr": "Rapporté par Jarir ibn Abdullah رضي الله عنه : Nous étions assis avec le Messager d’Allah ﷺ lorsqu’il a regardé la pleine lune et a dit : « Vous verrez votre Seigneur comme vous voyez cette lune, et vous ne serez pas gênés de Le voir. Donc, si vous le pouvez, ne vous laissez pas distraire au moment de la prière avant le lever du soleil et avant son coucher, c’est-à-dire la prière de l’Asr et celle du Fajr. » Jarir a ensuite récité : « Glorifie ton Seigneur avant le lever du soleil et avant son coucher » (20:)",
            "en": "Jarir b. Abdullah is reported to have said: We were sitting with the Messenger of Allah (ﷺ) that he looked at the full moon and observed: You shall see your Lord as you are seeing this moon, and you will not be harmed by seeing Him. So if you can, do not let -yourselves be overpowered in case of prayer observed before the rising of the sun and its setting, i. e. the 'Asr prayer and the morning prayer. Jarir then recited it:\" Celebrate the praise of thy Lord before the rising of the sun and before Its setting\" (xx)",
            "highlight": "Vous verrez votre Seigneur comme vous voyez cette lune",
            "highlightEn": "You shall see your Lord as you are seeing this moon",
            "id": "paradis-6"
          },
          {
            "kind": "scholar",
            "ref": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 11374",
            "refEn": "Ibn ‘Uthaymîn · binothaimeen.net, fatwa 11374",
            "url": "https://old.binothaimeen.net/content/11374",
            "arabic": "رؤية الله يوم القيامة فهذا صحيح، ثابت بالقرآن والسنة، وإجماع السلف. فمن أدلة ذلك في كتاب الله، قول الله تبارك وتعالى: ﴿وُجُوهٌ يَوْمَئِذٍ نَاضِرَةٌ۞إِلَى رَبِّهَا نَاظِرَةٌ﴾، فناضرة الأولى بمعنى حسنة، وناظرة الثانية من النظر بالعين",
            "fr": "La vision d’Allah le Jour de la Résurrection : cela est vrai, établi par le Coran, la Sunna et le consensus des pieux prédécesseurs. Parmi ses preuves dans le Livre d’Allah, la parole d’Allah, béni et exalté : « Ce jour-là, il y aura des visages resplendissants, qui regarderont leur Seigneur » ; « nâdira », le premier mot, signifie beaux, et « nâzira », le second, vient du regard par l’œil.",
            "en": "Seeing Allah on the Day of Resurrection: this is true, established by the Quran, the Sunnah and the consensus of the Salaf. Among its proofs in the Book of Allah is the saying of Allah, Blessed and Exalted: “[Some] faces, that Day, will be radiant, Looking at their Lord.” “Nadira”, the first word, means beautiful, and “nazira”, the second, is from looking with the eye.",
            "highlight": "établi par le Coran, la Sunna et le consensus des pieux prédécesseurs",
            "highlightEn": "established by the Quran, the Sunnah and the consensus of the Salaf",
            "id": "paradis-7"
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 6549",
            "url": "https://sunnah.com/bukhari:6549",
            "fr": "Rapporté par Abu Sa`id Al-Khudri : Le Messager d’Allah (ﷺ) a dit : « Allah dira aux gens du Paradis : “Ô gens du Paradis !” Ils répondront : “Nous sommes à Ton service, ô notre Seigneur, et nous sommes heureux !” Allah dira : “Êtes-vous satisfaits ?” Ils répondront : “Pourquoi ne serions-nous pas satisfaits alors que Tu nous as donné ce que Tu n’as donné à aucune autre de Tes créatures ?” Allah dira : “Je vais vous donner encore mieux que cela.” Ils diront : “Ô notre Seigneur ! Qu’est-ce qui peut être meilleur que cela ?” Allah dira : “Je vous accorde Ma satisfaction et Mon contentement, et Je ne serai plus jamais en colère contre vous.” »",
            "en": "Narrated Abu Sa`id Al-Khudri: Allah's Messenger (ﷺ) said, \"Allah will say to the people of Paradise, 'O the people of Paradise!' They will say, 'Labbaik, O our Lord, and Sa`daik!' Allah will say, 'Are you pleased?\" They will say, 'Why should we not be pleased since You have given us what You have not given to anyone of Your creation?' Allah will say, 'I will give you something better than that.' They will reply, 'O our Lord! And what is better than that?' Allah will say, 'I will bestow My pleasure and contentment upon you so that I will never be angry with you after for-ever",
            "highlight": "Je ne serai plus jamais en colère contre vous.",
            "highlightEn": "I will never be angry with you after for-ever",
            "id": "paradis-8"
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
          },
          {
            "kind": "hadith",
            "ref": "Sahih al-Bukhari 22",
            "url": "https://sunnah.com/bukhari:22",
            "fr": "Rapporté par Abu Said Al-Khudri : Le Prophète (ﷺ) a dit : Quand les gens du Paradis entreront au Paradis et que les gens de l'Enfer iront en Enfer, Allah ordonnera que ceux qui ont eu la foi, même du poids d'une graine de moutarde, soient sortis de l'Enfer. Ils seront alors sortis, mais ils seront noircis (brûlés). Ensuite, ils seront plongés dans la rivière de Haya' (pluie) ou Hayat (vie) (le narrateur n'est pas sûr du terme exact), et ils reprendront vie comme une graine qui pousse près du bord d'un cours d'eau. Ne vois-tu pas qu'elle sort jaune et tordue ?",
            "en": "Narrated Abu Said Al-Khudri: The Prophet (ﷺ) said, \"When the people of Paradise will enter Paradise and the people of Hell will go to Hell, Allah will order those who have had faith equal to the weight of a grain of mustard seed to be taken out from Hell. So they will be taken out but (by then) they will be blackened (charred). Then they will be put in the river of Haya' (rain) or Hayat (life) (the Narrator is in doubt as to which is the right term), and they will revive like a grain that grows near the bank of a flood channel. Don't you see that it comes out yellow and twisted?",
            "highlight": "ceux qui ont eu la foi, même du poids d'une graine de moutarde, soient sortis de l'Enfer",
            "highlightEn": "those who have had faith equal to the weight of a grain of mustard seed to be taken out from Hell",
            "id": "enfer-5"
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
          },
          {
            "kind": "scholar",
            "ref": "Ibn Bâz · binbaz.org.sa, fatwa 12862",
            "refEn": "Ibn Bâz · binbaz.org.sa, fatwa 12862",
            "url": "https://binbaz.org.sa/fatwas/12862",
            "arabic": "ابن تيمية وغيره من السلف كلهم يقولون: إنّ أهل الكفر مخلدون في النار، وأهل الإيمان مخلدون في الجنة، هذا بإجماع أهل السنة والجماعة: أن أهل الجنة مخلدون أبد الآباد، لا موت فيها ولا فناء، بل هي دائمة، وأهلها دائمون […] والذي عليه جمهور أهل السنة والجماعة أن النار باقية ومستمرة لا تفنى أبدًا، وأهلها كذلك من الكفرة معذبون فيها دائمًا […] أما العصاة فلهم أمد، عصاة الموحدين لهم أمد إذا دخلوها يخرجون منها بعدما يطهرون، العصاة منهم من يعفى عنه، ولا يدخلها، ومنهم من يدخلها، وإذا طهر أخرجه الله منها، وصار إلى الجنة، ولا يبقى في النار ويخلد فيها أبد الآباد إلا الكفار الذين ماتوا على الكفر بالله",
            "fr": "Ibn Taymiyya et d’autres parmi les pieux prédécesseurs disent tous : les gens de la mécréance demeurent éternellement dans le Feu, et les gens de la foi demeurent éternellement au Paradis ; cela fait l’unanimité des gens de la Sunna et du consensus : les gens du Paradis y demeurent pour toujours, sans mort ni anéantissement ; il est perpétuel, et ses gens sont perpétuels […] Ce sur quoi est la majorité des gens de la Sunna et du consensus, c’est que le Feu demeure et continue, sans jamais s’anéantir, et que ses gens parmi les mécréants y sont châtiés perpétuellement […] Quant aux pécheurs, ils ont un terme : les pécheurs parmi les monothéistes ont un terme ; s’ils y entrent, ils en sortent après avoir été purifiés. Parmi les pécheurs, il en est qui sont pardonnés et n’y entrent pas, et il en est qui y entrent ; lorsqu’il est purifié, Allah l’en fait sortir et il va au Paradis. Ne restent dans le Feu, pour y demeurer éternellement, que les mécréants qui sont morts dans la mécréance envers Allah.",
            "en": "Ibn Taymiyya and others among the Salaf all say: the people of disbelief abide eternally in the Fire, and the people of faith abide eternally in Paradise; this is the consensus of Ahl as-Sunna wal-Jama‘a: the people of Paradise abide in it forever, with neither death nor annihilation in it; it is everlasting, and its people are everlasting […] What the majority of Ahl as-Sunna wal-Jama‘a hold is that the Fire remains and continues, never ending, and its people among the disbelievers are likewise punished in it everlastingly […] As for the sinners, they have a term: the sinners among the monotheists have a term; if they enter it, they come out of it after being purified. Among the sinners are some who are pardoned and do not enter it, and some who enter it; when he is purified, Allah brings him out of it and he goes to Paradise. None remain in the Fire forever except the disbelievers who died in disbelief in Allah.",
            "highlight": "les gens du Paradis y demeurent pour toujours, sans mort ni anéantissement",
            "highlightEn": "the people of Paradise abide in it forever, with neither death nor annihilation in it",
            "id": "eternite-2"
          }
        ]
      }
    ]
  }
];

export const AKHIRA_STAGES: AkhiraStage[] = AKHIRA_PARTS.flatMap((part) => part.stages);
export const getAkhiraStage = (id?: string) => AKHIRA_STAGES.find((stage) => stage.id === id);
