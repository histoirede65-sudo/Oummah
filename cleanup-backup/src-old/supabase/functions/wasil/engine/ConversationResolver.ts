export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationResolution = {
  originalQuestion: string;
  resolvedQuestion: string;
  usedConversationContext: boolean;
  resolvedEntity?: string;
};

const islamicEntityAliases: Array<{
  canonical: string;
  aliases: RegExp;
}> = [
  { canonical: "Dâwûd (David), prophète mentionné dans le Coran", aliases: /\b(david|dawud|daoud|dâwûd)\b/i },
  { canonical: "Sulaymân (Souleymane/Salomon), prophète mentionné dans le Coran", aliases: /\b(souleymane|sulayman|soulayman|salomon)\b/i },
  { canonical: "Mûsâ (Moïse), prophète mentionné dans le Coran", aliases: /\b(moise|moïse|moussa|musa|mûsâ)\b/i },
  { canonical: "Ibrâhîm (Abraham), prophète mentionné dans le Coran", aliases: /\b(ibrahim|ibrâhîm|abraham)\b/i },
  { canonical: "Yûsuf (Joseph), prophète mentionné dans le Coran", aliases: /\b(yusuf|youssouf|joseph)\b/i },
  { canonical: "ʿÎsâ (Jésus), prophète mentionné dans le Coran", aliases: /\b(issa|ʿisa|isa|jesus|jésus)\b/i },
  { canonical: "Nûh (Noé), prophète mentionné dans le Coran", aliases: /\b(nouh|nuh|noe|noé)\b/i },
  { canonical: "Ayyûb (Job), prophète mentionné dans le Coran", aliases: /\b(ayyoub|ayyub|job)\b/i },
  { canonical: "Yûnus (Jonas), prophète mentionné dans le Coran", aliases: /\b(yunus|younous|jonas)\b/i },
  { canonical: "Zakariyyâ (Zacharie), prophète mentionné dans le Coran", aliases: /\b(zakariya|zakariyya|zacharie)\b/i },
  { canonical: "Yahyâ (Jean), prophète mentionné dans le Coran", aliases: /\b(yahya|yahyâ|jean)\b/i },
  { canonical: "Maryam (Marie), mère de ʿÎsâ mentionnée dans le Coran", aliases: /\b(maryam|marie)\b/i },
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveIslamicEntity(text: string) {
  return islamicEntityAliases.find((entry) => entry.aliases.test(text))?.canonical;
}

function isAffirmativeReply(question: string) {
  return /^(oui|oui c'est ca|oui c’est ca|oui exactement|exactement|c'est ca|c’est ca|le prophete|le prophète|celui du coran|celui mentionne dans le coran|celui mentionné dans le coran)$/i.test(
    normalize(question),
  );
}

function isNegativeReply(question: string) {
  return /^(non|non pas lui|pas lui|une autre personne|quelqu'un d'autre|quelqu’un d’autre)$/i.test(
    normalize(question),
  );
}

function isContinuationReply(question: string) {
  return /^(continue|continuer|developpe|développe|explique davantage|plus de details|plus de détails|et ensuite|pourquoi|comment|et lui|et elle|et son frere|et son frère|et son pere|et son père)$/i.test(
    normalize(question),
  );
}

function lastMessage(
  history: ConversationMessage[],
  role: ConversationMessage["role"],
  fromEnd = 0,
) {
  let seen = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].role !== role) continue;
    if (seen === fromEnd) return history[index];
    seen += 1;
  }
  return undefined;
}

function clarificationEntity(assistantText: string, priorUserText: string) {
  return resolveIslamicEntity(assistantText) ?? resolveIslamicEntity(priorUserText);
}

export function resolveConversationQuestion(
  question: string,
  history: ConversationMessage[],
  clarificationOf = "",
): ConversationResolution {
  const originalQuestion = question.trim();
  const explicitEntity = resolveIslamicEntity(originalQuestion);

  if (explicitEntity) {
    return {
      originalQuestion,
      resolvedQuestion: `${originalQuestion}\n\nINTERPRÉTATION ISLAMIQUE PRIORITAIRE: ${explicitEntity}. Réponds directement dans ce sens sans demander si l'utilisateur parle d'une personne contemporaine portant le même prénom, sauf indication explicite contraire.`,
      usedConversationContext: false,
      resolvedEntity: explicitEntity,
    };
  }

  const lastAssistant = lastMessage(history, "assistant");
  const lastUser = lastMessage(history, "user");
  const priorUser = lastUser?.content || clarificationOf;
  const assistantText = lastAssistant?.content ?? "";
  const entity = clarificationEntity(assistantText, priorUser);

  if (isAffirmativeReply(originalQuestion) && entity) {
    return {
      originalQuestion,
      resolvedQuestion: `L'utilisateur confirme qu'il parle de ${entity}. Réponds maintenant directement à la question précédente: « ${priorUser || assistantText} ». Ne redemande pas de précision.`,
      usedConversationContext: true,
      resolvedEntity: entity,
    };
  }

  if (isNegativeReply(originalQuestion) && assistantText) {
    return {
      originalQuestion,
      resolvedQuestion: `L'utilisateur refuse l'interprétation proposée dans la question précédente. Demande une seule précision courte et nouvelle, sans répéter mot pour mot la clarification précédente. Contexte: ${assistantText}`,
      usedConversationContext: true,
    };
  }

  if (isContinuationReply(originalQuestion) && priorUser) {
    return {
      originalQuestion,
      resolvedQuestion: `Question de suivi: « ${originalQuestion} ». Elle porte sur le sujet religieux précédent: « ${priorUser} ». Réponds dans ce contexte sans demander à l'utilisateur de répéter le sujet.`,
      usedConversationContext: true,
      resolvedEntity: resolveIslamicEntity(priorUser),
    };
  }

  return {
    originalQuestion,
    resolvedQuestion: originalQuestion,
    usedConversationContext: false,
  };
}
