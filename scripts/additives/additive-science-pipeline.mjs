import fs from 'node:fs';
import path from 'node:path';

export const IMPORT_ENUMS = {
  evidenceLevel: new Set(['insufficient', 'limited', 'moderate', 'strong']),
  severity: new Set(['none', 'low', 'moderate', 'serious']),
  appliesTo: new Set(['additive', 'metabolite', 'contaminant', 'degradation_product']),
};
const IMPORT_FIELDS = new Set(['code', 'names', 'aliases', 'function', 'regulatoryStatus', 'authorityEvaluations', 'referenceValues', 'authorityDisagreement', 'assessmentScope', 'coveredCodes', 'exposure', 'potentialEffects', 'restrictions', 'evidenceLevel', 'sources', 'lastReviewedAt', 'dataVersion', 'needsScientificReview', 'completeness']);

export function normalizeAdditiveCode(value) {
  if (typeof value !== 'string') throw new Error('code must be a string');
  const code = value.trim().toUpperCase().replace(/^E\s*/, 'E');
  if (!/^E\d{3,4}[A-Z]?$/.test(code)) throw new Error(`invalid additive code: ${value}`);
  return code;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isUrl(value) {
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}

function nonEmpty(value) {
  return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
}

function hasScientificConclusion(record) {
  return Boolean(record.authorityEvaluations?.length || record.potentialEffects?.length || record.exposure);
}

export function validateAndNormalizeRecord(input, knownCodes = new Set()) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['record must be an object'] };
  let code;
  for (const field of Object.keys(input)) if (!IMPORT_FIELDS.has(field)) errors.push(`unknown field: ${field}`);
  try { code = normalizeAdditiveCode(input.code); } catch (error) { errors.push(error.message); }
  if (code && knownCodes.size && !knownCodes.has(code)) errors.push(`unknown code not in central catalogue: ${code}`);
  if (!input.names || typeof input.names !== 'object' || (!input.names.fr && !input.names.en)) errors.push('names is required');
  if (!Array.isArray(input.aliases)) errors.push('aliases must be an array');
  if (!Array.isArray(input.authorityEvaluations)) errors.push('authorityEvaluations must be an array');
  if (!Array.isArray(input.potentialEffects)) errors.push('potentialEffects must be an array');
  if (!Array.isArray(input.restrictions)) errors.push('restrictions must be an array');
  if (!IMPORT_ENUMS.evidenceLevel.has(input.evidenceLevel)) errors.push('invalid evidenceLevel');
  if (!Array.isArray(input.sources) || input.sources.length < 1) errors.push('at least one source is required');
  if (!isValidDate(input.lastReviewedAt)) errors.push('invalid lastReviewedAt');
  if (!/^(?:reviewed-)?\d+\.\d+$/.test(String(input.dataVersion ?? ''))) errors.push('invalid dataVersion');
  for (const [index, source] of (input.sources ?? []).entries()) {
    if (!source || !source.sourceId || !source.organisation || !source.sourceType || !source.title || !source.url || !Array.isArray(source.fieldsSupported)) errors.push(`source[${index}] missing required fields`);
    if (source?.url && !isUrl(source.url)) errors.push(`source[${index}] invalid url`);
    if (source?.retrievedAt && !isValidDate(source.retrievedAt)) errors.push(`source[${index}] invalid retrievedAt`);
  }
  for (const [index, effect] of (input.potentialEffects ?? []).entries()) {
    if (!effect?.effect || !IMPORT_ENUMS.severity.has(effect.severity) || !IMPORT_ENUMS.evidenceLevel.has(effect.evidenceLevel) || !IMPORT_ENUMS.appliesTo.has(effect.appliesTo)) errors.push(`potentialEffects[${index}] invalid enum or missing field`);
  }
  for (const [index, evaluation] of (input.authorityEvaluations ?? []).entries()) {
    if (!evaluation?.authority || (evaluation?.conclusion !== null && typeof evaluation?.conclusion !== 'string')) errors.push(`authorityEvaluations[${index}] missing authority or invalid conclusion`);
    if (evaluation?.url && !isUrl(evaluation.url)) errors.push(`authorityEvaluations[${index}] invalid url`);
    if (evaluation?.reviewedAt && !isValidDate(evaluation.reviewedAt)) errors.push(`authorityEvaluations[${index}] invalid reviewedAt`);
  }
  if (errors.length) return { ok: false, errors };
  const normalized = { ...input, code, aliases: [...new Set(input.aliases.map((alias) => String(alias).trim()).filter(Boolean))], needsScientificReview: Boolean(input.needsScientificReview || !hasScientificConclusion(input)) };
  return { ok: true, record: normalized, incomplete: normalized.needsScientificReview };
}

export function validateImportRecords(records, knownCodes = new Set()) {
  const valid = [], rejected = [], seen = new Set();
  for (const [index, input] of records.entries()) {
    let code;
    try { code = normalizeAdditiveCode(input?.code); } catch { code = undefined; }
    if (code && seen.has(code)) { rejected.push({ index, code, reasons: ['duplicate code in import'] }); continue; }
    if (code) seen.add(code);
    const result = validateAndNormalizeRecord(input, knownCodes);
    if (!result.ok) rejected.push({ index, code, reasons: result.errors });
    else valid.push({ ...result.record, _incomplete: result.incomplete });
  }
  return { valid, rejected, incomplete: valid.filter((record) => record._incomplete).map((record) => record.code) };
}

function versionNumber(version) {
  const match = String(version ?? '').match(/(\d+)\.(\d+)$/);
  return match ? Number(match[1]) * 1000 + Number(match[2]) : 0;
}

function rowCompleteness(row) {
  return [
    ['canonical_name', 'names'],
    ['function_classes', 'function'],
    ['sources', 'sources'],
    ['scientific_summary', 'authorityEvaluations'],
    ['exposure_assessment', 'exposure'],
    ['assessment_history', 'authorityEvaluations'],
  ].filter(([primary, alternate]) => nonEmpty(row?.[primary]) || nonEmpty(row?.[alternate])).length;
}

export function decideUpsert(existing, incoming) {
  if (!existing) return { action: 'insert', reason: 'code absent' };
  const oldDate = String(existing.scientific_reviewed_at ?? existing.lastReviewedAt ?? '');
  const newDate = String(incoming.lastReviewedAt ?? incoming.scientific_reviewed_at ?? '');
  if (oldDate && newDate && newDate < oldDate) return { action: 'skip', reason: 'existing record is newer' };
  if (rowCompleteness(existing) > rowCompleteness(incoming)) return { action: 'skip', reason: 'incoming record is less complete' };
  if (newDate === oldDate && versionNumber(existing.data_version) > versionNumber(incoming.dataVersion)) return { action: 'conflict', reason: 'existing version is newer' };
  if (newDate === oldDate && rowCompleteness(existing) === rowCompleteness(incoming)) return { action: 'conflict', reason: 'same date and completeness; manual review required' };
  return { action: 'update', reason: 'incoming record is newer or more complete' };
}

export function toSupabaseRow(record) {
  return {
    code: record.code,
    canonical_name: record.names?.fr || record.names?.en || record.code,
    function_classes: record.function ? [record.function] : [],
    regulatory_status: record.regulatoryStatus?.eu ?? null,
    eu_authorized: null,
    eu_conditions: { notes: record.regulatoryStatus?.notes ?? [] },
    adi_value: record.exposure?.adi ?? record.exposure?.tdi ?? null,
    adi_unit: record.exposure?.unit ?? null,
    adi_display: null,
    adi_authority: null,
    severity: record.potentialEffects?.length ? record.potentialEffects.reduce((max, item) => ['none', 'low', 'moderate', 'serious'].indexOf(item.severity) > ['none', 'low', 'moderate', 'serious'].indexOf(max) ? item.severity : max, 'none') : 'none',
    evidence_strength: record.evidenceLevel,
    exposure_concern: record.exposure ? 'unknown' : 'unknown',
    scientific_classification: record.needsScientificReview ? 'insufficient_data' : 'no_particular_signal',
    scientific_summary: record.authorityEvaluations?.map((item) => item.conclusion).join(' ') || null,
    health_effects: record.potentialEffects ?? [],
    sensitive_populations: record.exposure?.populationsAtRisk ?? [],
    exposure_assessment: record.exposure ?? {},
    assessment_history: record.authorityEvaluations ?? [],
    sources: record.sources,
    regulatory_source_updated_at: null,
    scientific_reviewed_at: record.lastReviewedAt,
    needs_scientific_review: Boolean(record.needsScientificReview),
    data_version: record.dataVersion,
  };
}

export function buildCoverageReport(rows, knownCodes = []) {
  const normalized = rows.map((row) => ({ ...row, code: String(row.code ?? '').toUpperCase() }));
  const grouped = new Map();
  for (const row of normalized) grouped.set(row.code, [...(grouped.get(row.code) ?? []), row]);
  const incomplete = normalized.filter((row) => row.needs_scientific_review || !nonEmpty(row.sources) || !nonEmpty(row.scientific_summary)).map((row) => row.code);
  const known = knownCodes.map((code) => normalizeAdditiveCode(code));
  return {
    totalProfiles: normalized.length,
    completeProfiles: normalized.length - incomplete.length,
    incompleteProfiles: incomplete.length,
    withSources: normalized.filter((row) => Array.isArray(row.sources) && row.sources.length > 0).length,
    withoutSources: normalized.filter((row) => !Array.isArray(row.sources) || row.sources.length === 0).length,
    withExposure: normalized.filter((row) => nonEmpty(row.exposure_assessment)).length,
    withAuthorityEvaluations: normalized.filter((row) => Array.isArray(row.authority_evaluations) ? row.authority_evaluations.length : Array.isArray(row.assessment_history) && row.assessment_history.length).length,
    withPotentialEffects: normalized.filter((row) => Array.isArray(row.health_effects) && row.health_effects.length).length,
    needsReview: normalized.filter((row) => row.needs_scientific_review).length,
    duplicateCodes: [...grouped.entries()].filter(([, values]) => values.length > 1).map(([code]) => code),
    missingKnownCodes: known.filter((code) => !grouped.has(code)),
    incompleteCodes: [...new Set(incomplete)],
    incompatibleRows: normalized.filter((row) => !/^E\d{3,4}[A-Z]?$/.test(row.code) || !Array.isArray(row.sources)).map((row) => row.code),
  };
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const parseLine = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((value) => value.trim().replace(/^\"|\"$/g, ''));
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value])));
}

export function parseImportFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (filePath.toLowerCase().endsWith('.csv')) return parseCsv(text);
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.records;
}

export function buildImportPlan(records, existingRows = [], knownCodes = new Set()) {
  const validation = validateImportRecords(records, knownCodes);
  const existingByCode = new Map(existingRows.map((row) => [String(row.code).toUpperCase(), row]));
  const decisions = validation.valid.map((record) => {
    const existing = existingByCode.get(record.code);
    return { code: record.code, incomplete: Boolean(record._incomplete), ...decideUpsert(existing, record), row: toSupabaseRow(record) };
  });
  return { validation, decisions, dryRun: true, writes: [] };
}
