/**
 * Every ruling shown in the Prénoms module comes from one of these texts: hadiths (French text of the fawazahmed0
 * collections, grades as given there) and fatwas of Ibn Bâz and Ibn ‘Uthaymîn from their official websites.
 * `arabic` is copied word for word from the page; `french` is a literal translation of that excerpt.
 */
export type NameTextSource = {
  /** Short label shown on chips: « Ibn Bâz », « Muslim 2132 »… */
  short: string;
  author: string;
  title: string;
  reference: string;
  url: string;
  arabic?: string;
  french: string;
  /** Hadiths: English text of the fawazahmed0 collections. Fatwas: literal translation of the Arabic excerpt. */
  english: string;
  /** Reference line when the English one differs from the French one. */
  referenceEn?: string;
};

export const NAME_SOURCES = {
  muslim2132: {
    short: 'Muslim 2132',
    author: 'Sahih Muslim',
    title: 'Les noms les plus aimés d’Allah',
    reference: 'Sahih Muslim 2132',
    url: 'https://sunnah.com/muslim:2132',
    french: 'Rapporté par Ibn Umar : Le Messager d’Allah ﷺ a dit : « Les noms les plus aimés d’Allah sont ‘Abdullah et ‘Abd al-Rahman. »',
    english: "Ibn Umar reported that Allah's Messenger (ﷺ) said: The names dearest to Allah are 'Abdullah and 'Abd al-Rahman",
  },
  abuDawud4950: {
    short: 'Abû Dâwûd 4950',
    author: 'Sunan Abî Dâwûd',
    title: 'Les noms des prophètes ; Harb et Murra',
    reference: 'Sunan Abî Dâwûd 4950 · authentifié (sahîh) par al-Albânî',
    url: 'https://sunnah.com/abudawud:4950',
    french: 'Rapporté par Abu Wahb al-Jushami رضي الله عنه : Le Prophète ﷺ a dit : « Appelez-vous par les noms des Prophètes. Les noms les plus aimés d’Allah sont Abdullah et AbdurRahman, les plus véridiques sont Harith et Hammam, et les pires sont Harb et Murrah. »',
    english: "Narrated AbuWahb al-Jushami: The Prophet (ﷺ) said: Call yourselves by the names of the Prophets. The names dearest to Allah are Abdullah and AbdurRahman, the truest are Harith and Hammam, and the worst are Harb and Murrah",
    referenceEn: "Sunan Abî Dâwûd 4950 · graded sahih by al-Albânî",
  },
  abuDawud4955: {
    short: 'Abû Dâwûd 4955',
    author: 'Sunan Abî Dâwûd',
    title: 'La kunya Abû al-Hakam changée',
    reference: 'Sunan Abî Dâwûd 4955 · authentifié (sahîh) par al-Albânî',
    url: 'https://sunnah.com/abudawud:4955',
    french: 'Rapporté par Hani ibn Yazid : Quand Hani est venu avec son peuple en délégation auprès du Messager d’Allah ﷺ, il l’a entendu l’appeler par sa kunyah, AbulHakam. Le Messager d’Allah ﷺ l’a alors appelé et a dit : « Allah est le Juge (al-Hakam), et c’est à Lui qu’appartient le jugement. Pourquoi portes-tu la kunyah AbulHakam ? » […] Il a dit : « Alors tu es AbuShurayh. »',
    english: "Narrated Hani ibn Yazid: When Hani went with his people in a deputation to the Messenger of Allah (ﷺ), he heard them calling him by his kunyah (surname), AbulHakam. So the Messenger of Allah (ﷺ) called him and said: Allah is the judge (al-Hakam), and to Him judgment belongs. Why are you given the kunyah AbulHakam? […] He said: Then you are AbuShurayh.",
    referenceEn: "Sunan Abî Dâwûd 4955 · graded sahih by al-Albânî",
  },
  muslim2139: {
    short: 'Muslim 2139',
    author: 'Sahih Muslim',
    title: '‘Âsiya devient Jamîla',
    reference: 'Sahih Muslim 2139',
    url: 'https://sunnah.com/muslim:2139a',
    french: 'Rapporté par Ibn \'Umar : Le Messager d’Allah ﷺ a changé le prénom de ‘Asiya (Désobéissante) et a dit : « Tu es Jamila (belle et bonne). »',
    english: "Ibn 'Umar reported that Allah's Messenger (ﷺ) changed the name of 'Asiya (Disobedient) and said: You are Jamila (i. e. good and handsome).",
  },
  muslim2142: {
    short: 'Muslim 2142',
    author: 'Sahih Muslim',
    title: 'Barra devient Zaynab',
    reference: 'Sahih Muslim 2142',
    url: 'https://sunnah.com/muslim:2142b',
    french: 'Rapporté par Muhammad b. ‘Amr b. ‘Ata’ : J’avais donné à ma fille le prénom de Barra. Zainab, fille d’Abu Salama, m’a dit que le Messager d’Allah ﷺ lui avait interdit de donner ce prénom. (Elle a dit) : « On m’appelait aussi Barra, mais le Messager d’Allah ﷺ a dit : “Ne vous considérez pas comme vertueuse. C’est Allah seul qui connaît les gens pieux parmi vous.” » Les compagnons ont demandé : « Quel prénom devons-nous lui donner ? » Il a répondu : « Appelez-la Zainab. »',
    english: "Muhammad b. 'Amr b. 'Ata' reported: I had given the name Barra to my daughter. Zainab, daughter of Abu Salama, told me that Allah's Messenger (ﷺ) had forbidden me to give this name. (She said): I was also called Barra, but Allah's Messenger (ﷺ) said: Don't hold yourself to be pious. It is God alone who knows the people of piety among you. They (the Companions) said: Then, what name should we give to her? He said: Name her as Zainab",
  },
  bukhari6192: {
    short: 'Bukhârî 6192',
    author: 'Sahih al-Bukhârî',
    title: 'Barra devient Zaynab',
    reference: 'Sahih al-Bukhârî 6192',
    url: 'https://sunnah.com/bukhari:6192',
    french: 'Rapporté par Abu Huraira : Le nom d’origine de Zainab était « Barrah », mais on disait : « Par ce nom, elle se donne une réputation de piété. » Alors le Prophète (ﷺ) a changé son nom en Zainab',
    english: "Narrated Abu Huraira: Zainab's original name was \"Barrah,\" but it was said' \"By that she is giving herself the prestige of piety.\" So the Prophet (ﷺ) changed her name to Zainab",
  },
  muslim2143: {
    short: 'Muslim 2143',
    author: 'Sahih Muslim',
    title: 'Malik al-Amlâk, « Roi des rois »',
    reference: 'Sahih Muslim 2143',
    url: 'https://sunnah.com/muslim:2143b',
    french: 'Rapporté par Abu Huraira : […] Le plus misérable auprès d’Allah au Jour de la Résurrection, la pire personne et la cible de Sa colère sera celui qu’on appelle Malik al-Amlak (Roi des rois), car il n’y a de roi qu’Allah',
    english: "Abu Huraira reported from Allah's Messenger (ﷺ) so many ahadith and one of them was this that Allah's Messenger (ﷺ) said: The most wretched person in the sight of Allah on the Day of Resurrection and the worst person and target of His wrath would of the person who is called Malik al-Amlak (the King of Kings) for there is no king but Allah",
  },

  bazTaabid: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم التعبيد لغير الله في الأسماء',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 8890',
    url: 'https://binbaz.org.sa/fatwas/8890/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B9%D8%A8%D9%8A%D8%AF-%D9%84%D8%BA%D9%8A%D8%B1-%D8%A7%D9%84%D9%84%D9%87-%D9%81%D9%8A-%D8%A7%D9%84%D8%A7%D8%B3%D9%85%D8%A7%D8%A1',
    arabic: 'هذه التسمية حرام لا يجوز التسمية بعبد الرسول، ولا عبد النبي، ولا عبد عمر، ولا عبد الحسين، ولا عبد الحسن، ولا عبد علي، كل هذا منكر، التعبيد يكون لله وحده […] قال أبو محمد ابن حزم رحمه الله: أجمع العلماء على تحريم كل اسم معبد لغير الله، ما عدا عبد المطلب.',
    french: 'Cette manière de nommer est illicite : il n’est pas permis de nommer ‘Abd ar-Rasûl, ni ‘Abd an-Nabî, ni ‘Abd ‘Umar, ni ‘Abd al-Husayn, ni ‘Abd al-Hasan, ni ‘Abd ‘Alî ; tout cela est blâmable. La servitude [dans le nom] est pour Allah seul […] Abû Muhammad Ibn Hazm a dit : les savants sont unanimes sur l’interdiction de tout nom faisant de quelqu’un le serviteur d’un autre qu’Allah, à l’exception de ‘Abd al-Muttalib.',
    english: "This naming is unlawful: it is not permitted to name ‘Abd ar-Rasûl, nor ‘Abd an-Nabî, nor ‘Abd ‘Umar, nor ‘Abd al-Husayn, nor ‘Abd al-Hasan, nor ‘Abd ‘Alî; all of this is reprehensible. Servitude [in a name] is for Allah alone […] Abû Muhammad Ibn Hazm said: the scholars are unanimous that every name making someone the servant of other than Allah is forbidden, except ‘Abd al-Muttalib.",
  },
  bazTaabidChange: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم تغيير الأسماء المعبدة لغير الله',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 7415',
    url: 'https://binbaz.org.sa/fatwas/7415/%D8%AD%D9%83%D9%85-%D8%AA%D8%BA%D9%8A%D9%8A%D8%B1-%D8%A7%D9%84%D8%A7%D8%B3%D9%85%D8%A7%D8%A1-%D8%A7%D9%84%D9%85%D8%B9%D8%A8%D8%AF%D8%A9-%D9%84%D8%BA%D9%8A%D8%B1-%D8%A7%D9%84%D9%84%D9%87',
    arabic: 'ما دام اسم أبيك وقد توفي لا يغير، أما إن كان والدك حياً فالواجب تغييره؛ لأنه ما يجوز أن يقال: عبد النبي ولا عبد الرسول، ولا عبد الحسين، التعبيد يكون لله',
    french: 'Tant qu’il s’agit du nom de ton père et qu’il est décédé, on ne le change pas ; mais si ton père est vivant, il est obligatoire de le changer, car il n’est pas permis de dire ‘Abd an-Nabî, ni ‘Abd ar-Rasûl, ni ‘Abd al-Husayn : la servitude est pour Allah.',
    english: "As long as it is your father’s name and he has died, it is not changed; but if your father is alive, it must be changed, because it is not permitted to say ‘Abd an-Nabî, nor ‘Abd ar-Rasûl, nor ‘Abd al-Husayn: servitude is for Allah.",
  },
  bazBestNames: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'أفضل الأسماء هي المعبدة لله',
    reference: 'Majmû‘ Fatâwâ Ibn Bâz 18/53 · binbaz.org.sa, fatwa 16943',
    url: 'https://binbaz.org.sa/fatwas/16943/%D8%A7%D9%81%D8%B6%D9%84-%D8%A7%D9%84%D8%A7%D8%B3%D9%85%D8%A7%D8%A1-%D9%87%D9%8A-%D8%A7%D9%84%D9%85%D8%B9%D8%A8%D8%AF%D8%A9-%D9%84%D9%84%D9%87',
    arabic: 'يجوز التسمي بهذه الأسماء لعدم الدليل على ما يمنع منها، لكن الأفضل للمؤمن أن يختار أحسن الأسماء المعبدة لله مثل عبدالله وعبدالرحمن وعبدالملك ونحوها، والأسماء المشهورة، كصالح ومحمد ونحو ذلك، بدلًا من قارون وأشباهه […] ولا يجوز التعبيد لغير الله كائنًا من كان، كعبدالنبي، وعبدالحسين، وعبدالكعبة ونحو ذلك، وقد حكى أبو محمد ابن حزم إجماع أهل العلم على تحريم ذلك. وليس طه وياسين من أسماء النبي ﷺ في أصح قولي العلماء، بل هما من الحروف المقطعة في أوائل السور',
    french: '[Question : Tâhâ, Yâsîn, Khabbâb, ‘Abd al-Muttalib, al-Hubâb, Qârûn, al-Walîd.] Il est permis de porter ces noms faute de preuve qui les interdise, mais le mieux pour le croyant est de choisir les meilleurs noms de servitude envers Allah, comme ‘Abdullah, ‘Abd ar-Rahmân, ‘Abd al-Malik et semblables, et les noms connus comme Sâlih, Muhammad et semblables, au lieu de Qârûn et ce qui lui ressemble […] Il n’est pas permis de faire de quelqu’un le serviteur d’un autre qu’Allah, quel qu’il soit, comme ‘Abd an-Nabî, ‘Abd al-Husayn, ‘Abd al-Ka‘ba et semblables ; Abû Muhammad Ibn Hazm a rapporté l’unanimité des savants sur son interdiction. Tâhâ et Yâsîn ne sont pas des noms du Prophète ﷺ selon l’avis le plus juste des savants ; ce sont des lettres isolées au début des sourates.',
    english: "[Question: Tâhâ, Yâsîn, Khabbâb, ‘Abd al-Muttalib, al-Hubâb, Qârûn, al-Walîd.] It is permitted to take these names, as there is no evidence forbidding them, but it is better for the believer to choose the best names of servitude to Allah, such as ‘Abdullah, ‘Abd ar-Rahmân, ‘Abd al-Malik and the like, and well-known names such as Sâlih, Muhammad and the like, instead of Qârûn and what resembles it […] It is not permitted to make anyone the servant of other than Allah, whoever it may be, such as ‘Abd an-Nabî, ‘Abd al-Husayn, ‘Abd al-Ka‘ba and the like; Abû Muhammad Ibn Hazm reported the consensus of the people of knowledge that this is forbidden. Tâhâ and Yâsîn are not names of the Prophet ﷺ according to the more correct of the two views of the scholars; they are among the separate letters at the beginning of the surahs.",
  },
  bazWhenWho: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'الوقت المناسب لتسمية المولود والأحق بتسميته',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 17669',
    url: 'https://binbaz.org.sa/fatwas/17669/%D8%A7%D9%84%D9%88%D9%82%D8%AA-%D8%A7%D9%84%D9%85%D9%86%D8%A7%D8%B3%D8%A8-%D9%84%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A7%D9%84%D9%85%D9%88%D9%84%D9%88%D8%AF-%D9%88%D8%A7%D9%84%D8%A7%D8%AD%D9%82-%D8%A8%D8%AA%D8%B3%D9%85%D9%8A%D8%AA%D9%87',
    arabic: 'فالأحق بالتسمية هو الأب […] ويستحب التعاون في ذلك والتشاور بين الوالد والوالدة، حتى يختار الجميع الاسم الحسن، وأفضل الأسماء ما عبد لله في حق الرجال: كعبدالله وعبدالرحمن وعبدالملك وعبدالكريم، ونحو ذلك. وفي حق النساء ما كان متعارفًا بين نساء الصحابة، ومن بعدهم من المؤمنات الأسماء المعروفة التي ليس فيها بشاعة […] فالأفضل التسمية يوم السابع، وإن سمي يوم الولادة فلا بأس',
    french: 'Celui qui a le plus droit de nommer est le père […] Il est recommandé de s’entraider et de se concerter entre le père et la mère afin que tous choisissent un beau nom. Les meilleurs noms pour les hommes sont ceux de servitude envers Allah : ‘Abdullah, ‘Abd ar-Rahmân, ‘Abd al-Malik, ‘Abd al-Karîm et semblables. Pour les femmes, ce qui était en usage parmi les femmes des Compagnons et les croyantes après elles : des noms connus, sans laideur […] Le mieux est de nommer le septième jour ; si l’on nomme le jour de la naissance, il n’y a pas de mal.',
    english: "The one with the most right to name is the father […] It is recommended to help one another in this and for the father and the mother to consult each other, so that all choose a good name. The best names for men are those of servitude to Allah, such as ‘Abdullah, ‘Abd ar-Rahmân, ‘Abd al-Malik, ‘Abd al-Karîm and the like. For women, what was customary among the women of the Companions and the believing women after them: well-known names with nothing ugly in them […] It is best to name on the seventh day; if one names on the day of birth, there is no harm.",
  },
  bazGodNames: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم تسمية الشخص بالبصير والعزيز وغيرهما',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 13424',
    url: 'https://binbaz.org.sa/fatwas/13424/%D8%AD%D9%83%D9%85-%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A7%D9%84%D8%B4%D8%AE%D8%B5-%D8%A8%D8%A7%D9%84%D8%A8%D8%B5%D9%8A%D8%B1-%D9%88%D8%A7%D9%84%D8%B9%D8%B2%D9%8A%D8%B2-%D9%88%D8%BA%D9%8A%D8%B1%D9%87%D9%85%D8%A7',
    arabic: 'أسماء الرب قسمان: قسم منها يجوز، وقسم لا يجوز، ما يقال: الخلاق، ولا الرزاق، ولا رب العالمين، ولا، لكن مثل عزيز وبصير لا بأس […] لكن الأسماء المختصة بالله لا تطلق على غير الله، لا يقال: الله لابن آدم، ولا الرحمن، ولا الخلاق، ولا الرزاق، ولا خالق الخلق',
    french: 'Les noms du Seigneur sont de deux sortes : une partie est permise, une autre non. On ne dit pas al-Khallâq, ni ar-Razzâq, ni Rabb al-‘Âlamîn ; mais des noms comme ‘Azîz et Basîr, il n’y a pas de mal […] Les noms propres à Allah ne sont pas donnés à un autre qu’Allah : on ne dit pas « Allah » pour un fils d’Adam, ni ar-Rahmân, ni al-Khallâq, ni ar-Razzâq, ni Khâliq al-Khalq.',
    english: "The names of the Lord are of two kinds: some are permitted and some are not. One does not say al-Khallâq, nor ar-Razzâq, nor Rabb al-‘Âlamîn; but names like ‘Azîz and Basîr, there is no harm […] The names that belong to Allah alone are not given to other than Allah: one does not say “Allah” of a son of Adam, nor ar-Rahmân, nor al-Khallâq, nor ar-Razzâq, nor Khâliq al-Khalq.",
  },
  bazImanAbrar: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم تسمية البنت بـ (إيمان .. أبرار)',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 12134',
    url: 'https://binbaz.org.sa/fatwas/12134/%D8%AD%D9%83%D9%85-%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A7%D9%84%D8%A8%D9%86%D8%AA-%D8%A8%D9%80-%D8%A7%D9%8A%D9%85%D8%A7%D9%86-%D8%A7%D8%A8%D8%B1%D8%A7%D8%B1',
    arabic: 'لا أعلم فيها شيئًا؛ لكن إذا ترك ذلك يكون أحسن، إذا سمى بالأسماء المعروفة السائدة، وترك (إيمان) و(أبرار) كان هذا أحسن',
    french: 'Je n’y connais rien [d’interdit] ; mais s’il les laisse, c’est mieux : s’il donne les noms connus et répandus et laisse « Îmân » et « Abrâr », c’est mieux.',
    english: "I know of nothing [forbidden] in them; but if he leaves that, it is better: if he gives the known, common names and leaves “Îmân” and “Abrâr”, that is better.",
  },
  bazHuda: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم التسمية بـ (هدى وإيمان ودعاء وأفنان) للبنات',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 15362',
    url: 'https://binbaz.org.sa/fatwas/15362/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A8%D9%80-%D9%87%D8%AF%D9%89-%D9%88%D8%A7%D9%8A%D9%85%D8%A7%D9%86-%D9%88%D8%AF%D8%B9%D8%A7%D8%A1-%D9%88%D8%A7%D9%81%D9%86%D8%A7%D9%86-%D9%84%D9%84%D8%A8%D9%86%D8%A7%D8%AA',
    arabic: '[هدى، ونور، وإيمان، ودعاء، وأفنان] ما أعلم فيها بأسًا، لا أعلم فيها بأسًا.',
    french: '[Hudâ, Nûr, Îmân, Du‘â’, Afnân] Je n’y connais pas de mal, je n’y connais pas de mal.',
    english: "[Hudâ, Nûr, Îmân, Du‘â’, Afnân] I know of no harm in them, I know of no harm in them.",
  },
  bazQuranWords: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم التسمية بأسماء من الآيات',
    reference: 'Majmû‘ Fatâwâ Ibn Bâz 9/417 · binbaz.org.sa, fatwa 3322',
    url: 'https://binbaz.org.sa/fatwas/3322/%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A8%D8%A7%D8%B3%D9%85%D8%A7%D8%A1-%D9%85%D9%86-%D8%A7%D9%84%D8%A7%D9%8A%D8%A7%D8%AA',
    arabic: 'ليس في ذلك بأس وهذه مخلوقات، الآلاء هي النعم، والأفنان هي الأغصان',
    french: '[Afnân, Âlâ’…] Il n’y a pas de mal à cela, ce sont des choses créées : al-âlâ’ ce sont les bienfaits, al-afnân ce sont les branches.',
    english: "[Afnân, Âlâ’…] There is no harm in that; these are created things: al-âlâ’ are the blessings, al-afnân are the branches.",
  },
  bazBayan: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'حكم من يسمي بأسماء من القرآن كـ: (آلاء، وآية..)',
    reference: 'Nûr ‘alâ ad-Darb · binbaz.org.sa, fatwa 8723',
    url: 'https://binbaz.org.sa/fatwas/8723/%D8%AD%D9%83%D9%85-%D9%85%D9%86-%D9%8A%D8%B3%D9%85%D9%8A-%D8%A8%D8%A7%D8%B3%D9%85%D8%A7%D8%A1-%D9%85%D9%86-%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D9%86-%D9%83%D9%80-%D8%A7%D9%84%D8%A7%D8%A1-%D9%88%D8%A7%D9%8A%D8%A9',
    arabic: 'ما أعلم فيه شيء إذا سمى بيان أو آلاء، أو أشباهها أو أفنان أو ما أشبهه كل هذا لا بأس به، كله لا حرج فيه',
    french: 'Je n’y connais rien [d’interdit] : s’il nomme Bayân ou Âlâ’, ou ce qui leur ressemble, ou Afnân ou semblable, il n’y a aucun mal à tout cela, aucune gêne.',
    english: "I know of nothing [forbidden] in it: if he names Bayân or Âlâ’, or what resembles them, or Afnân or the like, there is no harm in any of this, no blame in any of it.",
  },
  bazMalak: {
    short: 'Ibn Bâz',
    author: 'Ibn Bâz',
    title: 'ما حكم التسمية باسم "مَلَاك"؟',
    reference: 'binbaz.org.sa, fatwa 22708',
    url: 'https://binbaz.org.sa/fatwas/22708/%D9%85%D8%A7-%D8%AD%D9%83%D9%85-%D8%A7%D9%84%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A8%D8%A7%D8%B3%D9%85-%D9%85%D9%84%D8%A7%D9%83',
    arabic: 'ما تُسمّى به المرأة، يُسمّى به الرجل، مثل ما يسمى جبريل وميكائيل.',
    french: 'Ce par quoi on nomme la femme, on en nomme l’homme, comme on nomme Jibrîl et Mîkâ’îl.',
    english: "What a woman is named by, a man is named by, just as one is named Jibrîl and Mîkâ’îl.",
  },

  uthNaming: {
    short: 'Ibn ‘Uthaymîn',
    author: 'Ibn ‘Uthaymîn',
    title: 'من هو الأحق في تسمية المولود الزوج أم الزوجة ؟',
    reference: 'binothaimeen.net, fatwa 653',
    url: 'https://old.binothaimeen.net/content/653',
    arabic: 'حق التسمية للأب […] ينبغي للأب أن يكون مع زوجته ليناً ويتشاور معها […] «أحب الأسماء إلى الله: عبد الله وعبد الرحمن». وكل ما أضيف إلى الله فهو أفضل من غيره […] ويحرم أن يتسمى بأسماء الفراعنة، مثل: فرعون، أو بأسماء الشياطين، مثل: إبليس، قال العلماء: أو بأسماء القرآن فإنه لا يجوز أن يسمي ابنه: فرقاناً […] حتى بعض العلماء قال: يكره أيضاً أن يتسمى بأسماء الملائكة، مثل: جبريل، ميكائيل، إسرافيل. […] وأسماء الرسل أفضل من أسماء غيرهم إلا ما كان أحب إلى الله فهو أفضل.',
    french: 'Le droit de nommer appartient au père […] le père doit être doux avec son épouse et se concerter avec elle […] « Les noms les plus aimés d’Allah sont ‘Abdullah et ‘Abd ar-Rahmân. » Tout [nom] rattaché à Allah est meilleur que les autres […] Il est interdit de porter les noms des pharaons, comme Fir‘awn, ou les noms des démons, comme Iblîs. Les savants ont dit : ou les noms du Coran ; il n’est pas permis de nommer son fils Furqân […] Certains savants ont même dit qu’il est réprouvé de porter les noms des anges, comme Jibrîl, Mîkâ’îl, Isrâfîl. […] Les noms des messagers sont meilleurs que les autres, sauf ce qui est plus aimé d’Allah, qui est meilleur.',
    english: "The right to name belongs to the father […] the father should be gentle with his wife and consult her […] “The names dearest to Allah are ‘Abdullah and ‘Abd ar-Rahmân.” Every [name] attached to Allah is better than the others […] It is forbidden to take the names of the pharaohs, such as Fir‘awn, or the names of the devils, such as Iblîs. The scholars said: or the names of the Quran; it is not permitted to name one’s son Furqân […] Some scholars even said that it is also disliked to take the names of the angels, such as Jibrîl, Mîkâ’îl, Isrâfîl. […] The names of the messengers are better than the names of others, except what is dearer to Allah, which is better.",
  },
  uthMalak: {
    short: 'Ibn ‘Uthaymîn',
    author: 'Ibn ‘Uthaymîn',
    title: 'حكم التسمي باسم ملاك وأبرار',
    reference: 'binothaimeen.net, fatwa 265',
    url: 'https://old.binothaimeen.net/content/265',
    arabic: 'أنا أكره أن يسمى الإنسان ابنته مِلاك أو مَلاك […] فالأسماء كثيرة يأخذ من أسماء نساء الصحابة -رضي الله عنهن-، من أسماء نساء بلده […] فدع ما يريبك إلى ما لا يريبك […] ومثل ذلك أبرار لا يُسمى بها؛ لأن أبرار جمع بر',
    french: 'Je réprouve qu’on nomme sa fille Milâk ou Malâk […] Les noms sont nombreux : qu’il prenne parmi les noms des femmes des Compagnons — qu’Allah les agrée —, parmi les noms des femmes de son pays […] Laisse ce qui te fait douter pour ce qui ne te fait pas douter […] De même, on ne nomme pas Abrâr, car Abrâr est le pluriel de barr.',
    english: "I dislike that a person names his daughter Milâk or Malâk […] Names are many: let him take from the names of the women of the Companions — may Allah be pleased with them —, from the names of the women of his country […] Leave what makes you doubt for what does not make you doubt […] Likewise, one does not name Abrâr, because Abrâr is the plural of barr.",
  },
  uthQuranNames: {
    short: 'Ibn ‘Uthaymîn',
    author: 'Ibn ‘Uthaymîn',
    title: 'حكم تسمية البنات بأسماء من القرآن',
    reference: 'binothaimeen.net, fatwa 2410',
    url: 'https://old.binothaimeen.net/content/2410',
    arabic: 'الأصل في التسمية الإباحة، إلا ما دل الدليل على كراهته بعينه، أو بمثله -فمثلاً- اسم (برة) واسم (أبرار)، واسم (إيمان)، كل هذا ينهى عنه، يعني: يُغيَّر […] وأما ما لا يشبه ذلك، فلا بأس به -فمثلاً- (أفنان) ما فيه بأس، (أغصان) ما فيه بأس، (جنا) ما فيه بأس. أما (بيان) فلا أرى أن يسمى به، وكذلك (إيمان) لأن فيه شيئاً من التزكية، و(أبرار) كذلك.',
    french: 'La règle de base en matière de noms est la permission, sauf ce dont une preuve montre qu’il est réprouvé, en lui-même ou par un nom semblable. Par exemple les noms Barra, Abrâr et Îmân : tout cela est interdit, c’est-à-dire qu’on le change […] Ce qui ne leur ressemble pas, il n’y a pas de mal : Afnân, pas de mal ; Aghsân, pas de mal ; Janâ, pas de mal. Quant à Bayân, je ne suis pas d’avis qu’on le donne, de même qu’Îmân, car il comporte une part d’auto-éloge, et Abrâr de même.',
    english: "The basic rule in naming is permissibility, except what evidence shows to be disliked, in itself or through a similar name. For example, the names Barra, Abrâr and Îmân: all of this is forbidden, that is, it is changed […] What does not resemble these, there is no harm in it: Afnân, no harm; Aghsân, no harm; Janâ, no harm. As for Bayân, I do not think it should be given, nor Îmân, because there is some self-praise in it, and Abrâr likewise.",
  },
  uthGodNames: {
    short: 'Ibn ‘Uthaymîn',
    author: 'Ibn ‘Uthaymîn',
    title: 'حكم التسمي بـ " رؤوف وعزيز وجبار "',
    reference: 'Nûr ‘alâ ad-Darb · binothaimeen.net, fatwa 7855',
    url: 'https://old.binothaimeen.net/content/7855',
    arabic: 'التسمي بأسماء الله عز وجل يكون على وجهين: الوجه الأول أن يحلى بـ(ال)، أو يقصد بالاسم ما دل عليه من صفة، ففي هذه الحال لا يسمى به غير الله كما لو سميت أحداً بالعزيز والسيد والحكيم […] أما الوجه الثاني فهو أن يتسمى باسم غير محلى بـ(ال) ولا مقصود به معنى الصفة فهذا لا بأس به مثل الحكم وحكيم […] لكن في مثل جبار لا ينبغي أن يتسمى به وإن كان لم يلاحظ الصفة',
    french: 'Porter les noms d’Allah se fait de deux manières. La première : le nom est précédé de « al- », ou l’on vise par le nom l’attribut qu’il indique ; dans ce cas, on n’en nomme pas un autre qu’Allah, comme si tu nommais quelqu’un al-‘Azîz, as-Sayyid, al-Hakîm […] La seconde : on porte le nom sans « al- » et sans viser le sens de l’attribut ; il n’y a pas de mal, comme al-Hakam et Hakîm […] Mais un nom comme Jabbâr, il ne convient pas de le porter, même sans viser l’attribut.',
    english: "Taking the names of Allah, the Mighty and Majestic, is of two kinds. The first: the name has “al-”, or the name is meant for the attribute it indicates; in this case no one other than Allah is named by it, as if you named someone al-‘Azîz, as-Sayyid, al-Hakîm […] The second: one takes the name without “al-” and without meaning the attribute; there is no harm in this, such as al-Hakam and Hakîm […] But a name like Jabbâr, one should not take it, even if the attribute is not intended.",
  },
  uthDinTitles: {
    short: 'Ibn ‘Uthaymîn',
    author: 'Ibn ‘Uthaymîn',
    title: 'حكم التسمي ب " شمس الدين ، قمر الدين..."',
    reference: 'binothaimeen.net, fatwa 12535',
    url: 'https://old.binothaimeen.net/content/12535',
    arabic: 'هذه الأسماء كلها حادثة لم تكن معروفة في عهد النبي صلى الله عليه وعلى آله وسلم ولا في عهد أصحابه، والذي وجد سيف الله أو أسد الله […] فالذي أرى العدول عن هذه الألقاب، كما أن فيها مفسدة أخرى وهي أن الملقب بها قد يزهو بنفسه ويعجب بها ويترفع بهذا اللقب على غيره.',
    french: '[Shams ad-Dîn, Muhyî ad-Dîn, Qamar ad-Dîn…] Tous ces noms sont apparus après coup ; ils n’étaient pas connus à l’époque du Prophète ﷺ ni de ses Compagnons ; ce qui existait, c’est Sayf Allâh ou Asad Allâh […] Mon avis est de délaisser ces titres ; ils comportent aussi un autre mal : celui qui les porte peut s’en enorgueillir, s’en émerveiller et s’élever par ce titre au-dessus des autres.',
    english: "[Shams ad-Dîn, Muhyî ad-Dîn, Qamar ad-Dîn…] All these names appeared later; they were not known in the time of the Prophet ﷺ nor of his Companions; what existed was Sayf Allâh or Asad Allâh […] My view is to turn away from these titles; they also carry another harm: the one who bears them may become vain, admire himself and raise himself above others by this title.",
  },
} satisfies Record<string, NameTextSource>;

export type NameSourceId = keyof typeof NAME_SOURCES;
