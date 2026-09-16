export type ReligiousSourceMetadata = {
  sourceKind: "quran" | "hadith" | "companion" | "scholar" | "institution";
  scholar?: string;
  aliases?: readonly string[];
  specialty?: readonly string[];
  work?: string;
  provenance: "official_site" | "institutional_archive" | "published_work" | "traceable_archive";
  verificationLevel: "exact" | "traceable";
};

export const religiousScholarCorpus: readonly ReligiousSourceMetadata[] = [
  { sourceKind: "scholar", scholar: "Ibn Taymiyya", specialty: ["croyance", "uṣūl", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Ibn al-Qayyim", specialty: ["fiqh", "uṣūl", "spiritualité"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Ibn Kathīr", specialty: ["tafsīr", "hadith", "histoire"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "al-Nawawī", specialty: ["hadith", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Ibn Ḥajar al-ʿAsqalānī", specialty: ["hadith"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Aḥmad ibn Ḥanbal", specialty: ["hadith", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "al-Shāfiʿī", specialty: ["uṣūl", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Mālik ibn Anas", specialty: ["hadith", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "ʿAbd al-Raḥmān al-Saʿdī", specialty: ["tafsīr", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Muḥammad al-Amīn al-Shanqīṭī", specialty: ["tafsīr", "uṣūl", "fiqh"], provenance: "published_work", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "ʿAbd al-ʿAzīz ibn Bāz", aliases: ["Ibn Baz", "Ibn Bâz"], specialty: ["croyance", "fiqh", "fatwa"], provenance: "official_site", verificationLevel: "exact" },
  { sourceKind: "scholar", scholar: "Muḥammad Nāṣir al-Dīn al-Albānī", aliases: ["Al Albani", "Al-Albani", "Albani"], specialty: ["hadith", "fiqh"], provenance: "traceable_archive", verificationLevel: "traceable" },
  { sourceKind: "scholar", scholar: "Muḥammad ibn Ṣāliḥ al-ʿUthaymīn", aliases: ["Ibn Uthaymin", "Ibn ‘Uthaymin", "Ibn Utheimin"], specialty: ["croyance", "fiqh", "uṣūl"], provenance: "official_site", verificationLevel: "exact" },
  { sourceKind: "scholar", scholar: "Ṣāliḥ al-Fawzān", aliases: ["Al Fawzan", "Al-Fawzan", "Fawzan"], specialty: ["croyance", "fiqh", "fatwa"], provenance: "official_site", verificationLevel: "exact" },
];

export const religiousSourcePolicy = `
POLITIQUE DE SOURCES RELIGIEUSES : Pour toute question de croyance, fiqh, halal/haram, pratique, fatwa ou explication religieuse, hiérarchise strictement : 1) Coran, 2) Sunnah authentique — privilégie Sahih al-Bukhari et Sahih Muslim, puis les autres recueils avec le degré lorsque nécessaire —, 3) compréhension documentée des Compagnons et premières générations, 4) ouvrages ou avis de savants reconnus, 5) institutions fiables. Un savant ne passe jamais devant une preuve primaire pertinente simplement parce qu’il figure au corpus. Une attribution exige le nom, l’avis réellement retrouvé et une œuvre, fatwa ou référence identifiable. Ne fabrique ni citation, ni volume, ni page, ni numéro. Une paraphrase doit être présentée comme telle, sans guillemets. Sans provenance suffisante, dis : « Je n’ai pas trouvé de référence suffisamment sûre pour attribuer précisément cet avis. » Ne présente jamais comme consensus l’accord de quelques savants ; lorsqu’une divergence documentée existe, dis-le et sépare les positions des quatre madhhabs et des savants cités. Pour les cas personnels à conséquences importantes, distingue la règle générale de son application et recommande un savant qualifié connaissant la situation.
CORPUS EXTENSIBLE : les noms ci-dessous sont des pistes documentaires, jamais une whitelist doctrinale : Ibn Taymiyya, Ibn al-Qayyim, Ibn Kathir, al-Nawawi, Ibn Hajar, Ahmad ibn Hanbal, al-Shafi‘i, Malik ibn Anas, al-Sa‘di, al-Shanqiti, Ibn Baz, al-Albani, Ibn ‘Uthaymin et al-Fawzan. Pour les anciens, exige savant → ouvrage → chapitre ou passage identifiable. Pour les contemporains, privilégie site officiel/fondation, puis archive institutionnelle, ouvrage publié identifiable et archive traçable. Une page secondaire ne valide jamais seule une attribution.
`;

// The scholar corpus is metadata, not evidence of a particular fatwa.
export const wasilVerifiedFiqhPolicy = `
AVIS DE SAVANTS ET JUGEMENTS : Pour une question de fiqh, de croyance ou de pratique qui appelle un avis savant, recherche si pertinent les avis d'Ibn Baz, d'al-Albani, d'Ibn 'Uthaymin et de Salih al-Fawzan. N'attribue un avis précis qu'après avoir retrouvé une fatwa ou une œuvre identifiable, de préférence sur leur site officiel ou celui de leur fondation ; donne son nom et sa référence consultée dans web_references. Cite seulement les avis réellement pertinents et vérifiés, jamais automatiquement les quatre. Distingue la preuve du Coran ou de la Sunna de l'interprétation du savant. Quand une interdiction est étayée par la preuve et par les avis vérifiés, expose-la clairement : évite les formules vagues du type « ce n'est pas forcément interdit » qui gomment cette position. Ne transforme pas une opinion de plusieurs savants en consensus et signale brièvement toute divergence reconnue et documentée sans rendre la réponse indécise.
MUSIQUE : Si la question porte sur la musique ou les instruments, distingue les instruments (ma'azif), le chant sans instrument, les paroles et les exceptions liées au contexte. Recherche la formulation exacte du hadith de Sahih al-Bukhari 5590 sur les personnes qui rendront licites les instruments ; ne le paraphrase pas comme « la musique n'est pas bonne » et n'attribue pas au Prophète un jugement plus large que son texte. Présente clairement la position d'interdiction des instruments défendue par les savants ci-dessus lorsque leurs avis précis sont vérifiés, et les divergences réellement sourcées lorsque pertinentes. Ne condamne ni ne juge personnellement l'utilisateur.
`;
