export const EXPLICIT_EXPOSURE_PATTERNS = [
  {
    id: 'exposure-below-reference',
    pattern: /\b(?:exposure|intake|exposure estimates?|dietary exposure)\b[^.]{0,180}\b(?:did not exceed|does not exceed|were below|was below|remained below|below)\b[^.]{0,100}\b(?:ADI|TDI|reference value|health-based guidance value)\b|\b(?:exposition|estimations? de l['’]exposition)\b[^.]{0,180}\b(?:inférieure?|en dessous|ne dépassait? pas|n['’]a pas dépassé)\b[^.]{0,100}\b(?:ADI|DJA|TDI|valeur de référence)\b/i,
    normalizedMeaning: 'below_reference',
    requiresReferenceValue: true,
    examples: ['exposure did not exceed the ADI', 'exposure estimates were below the ADI'],
  },
  {
    id: 'exposure-confirmed-exceedance',
    pattern: /\b(?:exposure|intake|exposure estimates?|dietary exposure)\b[^.]{0,180}\b(?:exceeded|exceeds|above|higher than)\b[^.]{0,100}\b(?:ADI|TDI|reference value|health-based guidance value)\b|\b(?:exposition|estimations? de l['’]exposition)\b[^.]{0,180}\b(?:dépassait?|dépasse|supérieure?|au-dessus)\b[^.]{0,100}\b(?:ADI|DJA|TDI|valeur de référence)\b/i,
    normalizedMeaning: 'confirmed_exceedance',
    requiresReferenceValue: true,
    examples: ['exposure exceeded the ADI'],
  },
  {
    id: 'exposure-possible-exceedance',
    pattern: /\b(?:may|might|could)\s+(?:exceed|be above|surpass)\b[^.]{0,120}\b(?:ADI|TDI|reference value|health-based guidance value)\b|\b(?:peut|pourrait|pourraient)\s+(?:dépasser|être supérieure?|excéder)\b[^.]{0,120}\b(?:ADI|DJA|TDI|valeur de référence)\b/i,
    normalizedMeaning: 'possible_exceedance',
    requiresReferenceValue: true,
    requiresPopulation: false,
    examples: ['high consumers may exceed the ADI', 'may exceed the ADI in children'],
  },
  {
    id: 'no-safety-concern-at-exposure',
    pattern: /\b(?:does not|do not|did not|doesn't)\s+(?:raise|pose|present)\b[^.]{0,100}\b(?:safety concern|health concern)\b[^.]{0,160}\b(?:exposure|intake|uses?|use levels?)\b|\bne (?:présente|suscite|soulève) pas de préoccupation pour la santé[^.]{0,160}\b(?:exposition|utilisation|niveaux d['’]utilisation)\b|\babsence de préoccupation pour la santé/i,
    normalizedMeaning: 'no_safety_concern_at_assessed_exposure',
    examples: ['does not raise a safety concern at current exposure levels'],
  },
  {
    id: 'additional-data-required',
    pattern: /\b(?:additional|further)\s+(?:data|information|studies)\s+(?:are|is|may be)\s+(?:required|needed|necessary)\b/i,
    normalizedMeaning: 'additional_data_required',
    examples: ['additional data are required'],
  },
  {
    id: 'unable-to-conclude',
    pattern: /\b(?:could not|cannot|unable to)\s+(?:conclude|reach a conclusion)\b[^.]{0,120}\b(?:safety|risk|exposure)\b/i,
    normalizedMeaning: 'unable_to_conclude',
    examples: ['could not conclude on safety'],
  },
];

export function splitSentences(text) {
  return String(text ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).map((sentence) => sentence.trim()).filter(Boolean);
}

export function extractExplicitExposureStatements(text) {
  const sentences = splitSentences(text);
  const recognized = [];
  const unmatched = [];
  for (const sourceSentence of sentences) {
    if (!/\b(?:exposure|intake|dietary|ADI|TDI|safety concern|additional data|could not conclude|exposition|DJA|préoccupation pour la santé|données supplémentaires)\b/i.test(sourceSentence)) continue;
    const matches = EXPLICIT_EXPOSURE_PATTERNS.filter((rule) => rule.pattern.test(sourceSentence));
    if (!matches.length) {
      unmatched.push(sourceSentence);
      continue;
    }
    for (const rule of matches) recognized.push({ ruleId: rule.id, normalizedMeaning: rule.normalizedMeaning, sourceSentence });
  }
  return { recognized, unmatched };
}
