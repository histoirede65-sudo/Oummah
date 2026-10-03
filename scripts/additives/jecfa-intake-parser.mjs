export const JECFA_INTAKE_PATTERNS = [
  { id: 'below-reference', pattern: /\b(?:below|under|did not exceed|does not exceed)\b[^.]{0,80}\b(?:ADI|TDI|MTDI|PMTDI|PTWI|PTMI)\b/i, comparisonStatus: 'below_reference' },
  { id: 'within-reference', pattern: /\bwithin\b[^.]{0,80}\b(?:ADI|TDI|MTDI|PMTDI|PTWI|PTMI)\b/i, comparisonStatus: 'within_reference' },
  { id: 'exceeded-reference', pattern: /\bexceeded\b[^.]{0,80}\b(?:ADI|TDI|MTDI|PMTDI|PTWI|PTMI)\b/i, comparisonStatus: 'confirmed_exceedance' },
  { id: 'may-exceed-reference', pattern: /\bmay exceed\b[^.]{0,80}\b(?:ADI|TDI|MTDI|PMTDI|PTWI|PTMI)\b/i, comparisonStatus: 'possible_exceedance' },
  { id: 'no-health-concern', pattern: /\bdoes not pose a health concern\b/i, authorityConclusion: 'no_safety_concern_at_assessed_exposure' },
  { id: 'no-safety-concern', pattern: /\bdoes not represent a safety concern\b/i, authorityConclusion: 'no_safety_concern_at_assessed_exposure' },
  { id: 'underestimated', pattern: /\bcould be underestimated\b/i, authorityConclusion: 'exposure_may_be_underestimated' },
];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeUnits = (value) => String(value).replace(/[\u00b5\u03bc]\s*g/gi, 'ug').replace(/Ã‚Âµ\s*g/gi, 'ug');
const splitSentences = (text) => clean(text).split(/(?<=[.!?])\s+|;\s+(?=[A-Z])/).map((part) => part.trim()).filter(Boolean);
const referenceToken = /\b(GROUP\s+ADI|TEMPORARY\s+ADI|PMTDI|MTDI|PTWI|PTMI|TDI|ADI)\b/gi;
const exposureToken = /\b(TMDI|estimated(?:\s+daily)?\s+intake|mean\s+(?:daily\s+)?(?:intake|exposure)|high\s+(?:consumer|exposure)|(?:\d+(?:\.\d+)?)\s*(?:st|nd|rd|th)?\s*percentile|intake|exposure|dietary\s+exposure|EDI)\b/i;

function numericValues(text) {
  const rawText = normalizeUnits(text);
  const values = [];
  const percentRange = /(-?\d+(?:[.,]\d+)?)\s*(?:-|to)\s*(-?\d+(?:[.,]\d+)?)\s*%\s*(?:of\s+(?:the\s+)?(?:upper\s+bound\s+of\s+)?(?:group\s+)?ADI|ADI)/gi;
  for (const match of rawText.matchAll(percentRange)) values.push({ lower: Number(match[1].replace(',', '.')), upper: Number(match[2].replace(',', '.')), value: null, rawValue: match[0], rawUnit: '% ADI', unit: '% ADI', percentOfReference: true, rawText: clean(match[0]) });
  const percent = /(-?\d+(?:[.,]\d+)?)\s*%\s*(?:of\s+(?:the\s+)?(?:upper\s+bound\s+of\s+)?(?:group\s+)?ADI|ADI)/gi;
  for (const match of rawText.matchAll(percent)) values.push({ value: Number(match[1].replace(',', '.')), rawValue: match[1], rawUnit: '% ADI', unit: '% ADI', percentOfReference: true, rawText: clean(match[0]) });
  const range = /(-?\d+(?:[.,]\d+)?)\s*(?:–|-|to)\s*(-?\d+(?:[.,]\d+)?)\s*(ng|ug|mg|g)\s*\/\s*([^,;.\s]*(?:\s*\/\s*[^,;.\s]*){0,3})/gi;
  for (const match of rawText.matchAll(range)) values.push({ lower: Number(match[1].replace(',', '.')), upper: Number(match[2].replace(',', '.')), value: null, rawValue: match[0], rawUnit: `${match[3]}/${clean(match[4])}`, unit: `${match[3]}/${clean(match[4])}`, rawText: clean(match[0]) });
  if (values.length) return values;
  const scalar = /(-?\d+(?:[.,]\d+)?)\s*(ng|ug|mg|g)\s*\/\s*(kg\s*(?:bw|body weight)?|p|person|day)(?:\s*(?:per\s*)?(day|d|week|month|year|person))?/gi;
  for (const match of rawText.matchAll(scalar)) values.push({ value: Number(match[1].replace(',', '.')), rawValue: match[1], rawUnit: `${match[2]}/${clean(match[3])}${match[4] ? ` per ${match[4]}` : ''}`, unit: `${match[2]}/${clean(match[3])}${match[4] ? ` per ${match[4]}` : ''}`, rawText: clean(match[0]) });
  const percentile = rawText.match(/\b(\d+(?:\.\d+)?)\s*(?:st|nd|rd|th)?\s*[- ]?percentile\b/i);
  if (percentile) for (const value of values) value.percentile = Number(percentile[1]);
  return values;
}

function populationFromText(text) {
  const matches = String(text).match(/\b(?:young children|children|toddlers|infants|adolescents|adults|elderly|general population|high consumers|pregnant women|nursing women)\b/gi) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))].join(', ') || null;
}

function scenarioFromText(text) {
  const matches = String(text).match(/\b(?:mean|median|average|high consumers?|upper bound|lower bound|95th[- ]percentile|90th[- ]percentile|97\.5th[- ]percentile|brand[- ]loyal|non[- ]brand[- ]loyal|refined exposure)\b/gi) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))].join(', ') || null;
}

function valueRecord(value, { type, sourceSentence, sourceUrl, evaluationYear }) {
  return { type, ...value, sourceSentence, sourceUrl, evaluationYear };
}

function explicitReferenceValues(sentence, { sourceUrl, evaluationYear }) {
  const values = [];
  for (const match of sentence.matchAll(referenceToken)) {
    const token = match[1].replace(/\s+/g, '_').toUpperCase();
    const after = sentence.slice(match.index + match[0].length);
    const numeric = numericValues(after)[0];
    const type = token === 'GROUP_ADI' ? 'GROUP_ADI' : token === 'TEMPORARY_ADI' ? 'TEMPORARY_ADI' : token;
    if (numeric) values.push(valueRecord(numeric, { type, sourceSentence: sentence, sourceUrl, evaluationYear }));
    else values.push({ type, rawText: match[0], sourceSentence: sentence, sourceUrl, evaluationYear });
  }
  return values;
}

function exposureType(sentence) {
  if (/\bTMDI\b/i.test(sentence)) return 'TMDI';
  if (/estimated(?:\s+daily)?\s+intake/i.test(sentence)) return 'estimated_intake';
  if (/mean\s+(?:daily\s+)?(?:intake|exposure)/i.test(sentence)) return 'mean_exposure';
  if (/high\s+(?:consumer|exposure)|upper\s+bound/i.test(sentence)) return 'high_exposure';
  if (/\b\d+(?:\.\d+)?\s*(?:st|nd|rd|th)?\s*[- ]?percentile\b/i.test(sentence)) return 'percentile_exposure';
  if (populationFromText(sentence)) return 'population_exposure';
  if (/\b(?:intake|exposure|dietary|EDI)\b/i.test(sentence)) return 'other_exposure';
  return null;
}

export function parseJecfaIntakeAssessment(rawText, { year = null, sourceUrl = null, adiRawText = null } = {}) {
  if (!clean(rawText)) return { status: 'NO_INTAKE_FIELD', assessment: null };
  const sourceText = clean(rawText);
  const knownNonExposure = /^(?:see\s+[^.]+|not calculated|none calculated|none established(?:,.*)?|not established(?:,.*)?|ptwi withdrawn|trace amount only present in food, since .* used externally)$/i.test(sourceText);
  if (knownNonExposure) {
    const assessment = { authority: 'JECFA', year, sourceUrl, scope: 'unknown', population: null, scenario: null, exposureValues: [], exposureScenarios: [], referenceValue: { type: 'NOT_SPECIFIED', rawText: adiRawText ?? null }, referenceValues: [], comparisonStatus: 'not_quantified', authorityConclusion: 'no_explicit_conclusion', exposureUncertainty: [], sourceText, sourceSentence: sourceText };
    return { status: 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON', assessments: [assessment], scenarios: [assessment], sourceText };
  }
  const assessments = [];
  for (const sentence of splitSentences(sourceText)) {
    const rules = JECFA_INTAKE_PATTERNS.filter((rule) => rule.pattern.test(sentence));
    const allNumeric = numericValues(sentence);
    const references = explicitReferenceValues(sentence, { sourceUrl, evaluationYear: year });
    const type = exposureType(sentence);
    const explicitTmdiComparison = /\bTMDI\b[^.]{0,100}\b(?:below|under|within|exceed|PMTDI|MTDI|ADI|TDI)\b/i.test(sentence);
    const hasExposure = Boolean(type) && !/^\s*(?:MTDI|PMTDI|ADI|TDI|PTWI|PTMI)\b/i.test(sentence);
    const exposureValues = hasExposure ? allNumeric.map((value) => valueRecord(value, { type, sourceSentence: sentence, sourceUrl, evaluationYear: year })) : [];
    const exposureScenarios = hasExposure || explicitTmdiComparison ? [{ type: type ?? 'TMDI', values: exposureValues, rawText: sentence, sourceSentence: sentence, sourceUrl, evaluationYear: year }] : [];
    if (!exposureScenarios.length && !references.length && !rules.length && !allNumeric.length) continue;
    const comparisonStatus = rules.find((rule) => rule.comparisonStatus)?.comparisonStatus ?? 'not_quantified';
    const authorityConclusion = rules.find((rule) => rule.authorityConclusion)?.authorityConclusion ?? 'no_explicit_conclusion';
    const unknownValues = !exposureScenarios.length && !references.length && allNumeric.length ? allNumeric.map((value) => valueRecord(value, { type: 'unknown', sourceSentence: sentence, sourceUrl, evaluationYear: year })) : [];
    const assessment = { authority: 'JECFA', year, sourceUrl, scope: /\bgroup ADI\b/i.test(sentence) ? 'group' : 'unknown', population: populationFromText(sentence), scenario: scenarioFromText(sentence), classification: unknownValues.length ? 'unknown' : undefined, unknownValues, exposureValues, exposureScenarios, referenceValue: references[0] ?? null, referenceValues: references, comparisonStatus, authorityConclusion, exposureUncertainty: rules.some((rule) => rule.id === 'underestimated') ? [sentence] : [], sourceText, sourceSentence: sentence };
    assessments.push(assessment);
  }
  if (!assessments.length) return { status: 'PARSE_FAILED', assessment: null, sourceText };
  const hasExposure = assessments.some((item) => item.exposureScenarios.length > 0);
  const hasReference = assessments.some((item) => item.referenceValues.length > 0);
  const status = hasExposure ? 'PARSED_EXPOSURE' : hasReference ? 'INTAKE_PRESENT_REFERENCE_ONLY' : 'INTAKE_PRESENT_NO_EXPLICIT_COMPARISON';
  return { status, assessments, scenarios: assessments, exposureScenarios: assessments.flatMap((item) => item.exposureScenarios), referenceValues: assessments.flatMap((item) => item.referenceValues), sourceText };
}
