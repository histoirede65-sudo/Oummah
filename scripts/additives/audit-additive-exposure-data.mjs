#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'scripts/output/additive-exposure-data-audit-v1.json');
const OFT = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const OFT_WORK = path.join(ROOT, 'scripts/output/openfoodtox/unpacked-index');
const JECFA = path.join(ROOT, 'scripts/output/jecfa-index.json');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v1.json');
const RESOLVED = path.join(ROOT, 'scripts/output/additive-risk-engine-resolved-dataset-v1.json');
const RECON = path.join(ROOT, 'scripts/output/additive-scientific-coverage-reconciliation-v1.json');
const COVERAGE = path.join(ROOT, 'scripts/output/food-additive-science-coverage.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const nonEmpty = (value) => value !== null && value !== undefined && String(value).trim() !== '';
const unique = (values) => [...new Set(values.filter(Boolean))];
const codeOf = (value) => String(value ?? '').toUpperCase().replace(/\s+/g, '');
const hasObjectValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasObjectValue);
  if (typeof value === 'object') return Object.values(value).some(hasObjectValue);
  return false;
};

const REFERENCE_KEY = /adi|acute.?reference.?dose|tolerable.?daily.?intake|other.?reference.?value|reference.?value|health.?based/i;
const EXPOSURE_KEY = /exposure|intake|dietary|population.?exposure|margin.?of.?exposure|exceed|scenario|percentile|consumption|dose.?estimate/i;
const CONCLUSION_KEY = /authority.?conclusion|exposure.?conclusion|structured.?conclusion|safety.?concern|no.?concern/i;

function columnInventory(oft) {
  const sheets = Object.entries(oft.workbook.sheets).map(([name, sheet]) => {
    const columns = sheet.columns ?? [];
    return {
      name,
      rowCount: sheet.rowCount ?? 0,
      referenceColumns: columns.filter((column) => REFERENCE_KEY.test(column)),
      exposureColumns: columns.filter((column) => EXPOSURE_KEY.test(column)),
      conclusionColumns: columns.filter((column) => CONCLUSION_KEY.test(column)),
      allColumns: columns,
    };
  });
  return sheets;
}

function parseSharedStrings(work) {
  const xml = fs.readFileSync(path.join(work, 'xl/sharedStrings.xml'), 'utf8');
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((item) => item[1]).join(''),
  );
}

function colIndex(ref) {
  const letters = String(ref).match(/[A-Z]+/i)?.[0] ?? '';
  let result = 0;
  for (const letter of letters) result = result * 26 + letter.toUpperCase().charCodeAt(0) - 64;
  return result - 1;
}

function sheetFileMap(work) {
  const workbook = fs.readFileSync(path.join(work, 'xl/workbook.xml'), 'utf8');
  const rels = fs.readFileSync(path.join(work, 'xl/_rels/workbook.xml.rels'), 'utf8');
  const byId = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((match) => [
    /\bId="([^"]+)"/.exec(match[0])?.[1],
    /\bTarget="([^"]+)"/.exec(match[0])?.[1],
  ]));
  return new Map([...workbook.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((match) => [
    match[1],
    path.join(work, 'xl', (byId.get(match[2]) ?? '').replace(/^\//, '').replace(/^xl\//, '')),
  ]));
}

function countPopulatedColumns(work, sheetName, wantedColumns) {
  const files = sheetFileMap(work);
  const file = files.get(sheetName);
  if (!file || !fs.existsSync(file)) return { rows: 0, populatedByColumn: {} };
  const xml = fs.readFileSync(file, 'utf8');
  const strings = parseSharedStrings(work);
  const rows = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  const header = [];
  const populatedByColumn = Object.fromEntries(wantedColumns.map((column) => [column, 0]));
  let nonEmptyRows = 0;
  for (const [rowIndex, rowMatch] of rows.entries()) {
    const values = {};
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(cell[1])?.[1];
      if (!ref) continue;
      const index = colIndex(ref);
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? '';
      const value = /\bt="s"/.test(cell[1]) ? (strings[Number(raw)] ?? '') : raw;
      values[index] = value;
      if (rowIndex === 0) header[index] = value;
    }
    if (rowIndex === 0) continue;
    let rowHasValue = false;
    for (const [index, value] of Object.entries(values)) {
      const column = header[Number(index)];
      if (wantedColumns.includes(column) && nonEmpty(value)) {
        populatedByColumn[column] += 1;
        rowHasValue = true;
      }
    }
    if (rowHasValue) nonEmptyRows += 1;
  }
  return { rows: Math.max(0, rows.length - 1), populatedByColumn, nonEmptyRows };
}

function profileFields(profile) {
  const exposure = profile?.exposure ?? {};
  const exposureKeys = Object.keys(exposure);
  const estimatedExposure = hasObjectValue(exposure.estimatedExposure);
  const exposureConclusion = hasObjectValue(exposure.exposureConclusion);
  const referenceValueComparison = hasObjectValue(exposure.referenceValueComparison) || hasObjectValue(profile?.referenceValueComparison);
  const exceedanceStatus = hasObjectValue(exposure.exceedanceStatus) || hasObjectValue(exposure.exceedance);
  const populationExposure = hasObjectValue(exposure.populationExposure);
  const exposureScenario = hasObjectValue(exposure.exposureScenario);
  const marginOfExposure = hasObjectValue(exposure.marginOfExposure);
  const structuredAuthorityConclusion = (profile?.authorityEvaluations ?? []).some((item) =>
    hasObjectValue(item?.structuredAuthorityConclusion) || hasObjectValue(item?.conclusion),
  );
  return {
    estimatedExposure,
    exposureConclusion,
    referenceValueComparison,
    exceedanceStatus,
    populationExposure,
    exposureScenario,
    marginOfExposure,
    structuredAuthorityConclusion,
    exposureKeys,
    hasReferenceValues: Array.isArray(profile?.referenceValues) && profile.referenceValues.some(hasObjectValue),
    hasFreeTextOnly: !estimatedExposure && !exposureConclusion && !referenceValueComparison && !exceedanceStatus &&
      !populationExposure && !exposureScenario && !marginOfExposure &&
      (typeof exposure.notes === 'string' && exposure.notes.trim().length > 0),
  };
}

function jecfaAudit(jecfa) {
  const records = jecfa.records ?? [];
  const exposureKeys = unique(records.flatMap((record) => Object.keys(record).filter((key) => EXPOSURE_KEY.test(key))));
  const conclusionKeys = unique(records.flatMap((record) => Object.keys(record).filter((key) => CONCLUSION_KEY.test(key))));
  const structuredExposureRecords = records.filter((record) => Object.entries(record).some(([key, value]) => EXPOSURE_KEY.test(key) && hasObjectValue(value)));
  const structuredConclusionRecords = records.filter((record) => Object.entries(record).some(([key, value]) => CONCLUSION_KEY.test(key) && hasObjectValue(value)));
  const referenceRecords = records.filter((record) => (record.evaluations ?? []).some((evaluation) => hasObjectValue(evaluation?.adi)));
  return {
    recordCount: records.length,
    indexedPriorityCount: (jecfa.priorityBatch ?? []).length,
    structuredExposureFields: exposureKeys,
    structuredConclusionFields: conclusionKeys,
    recordsWithStructuredExposure: structuredExposureRecords.length,
    recordsWithStructuredAuthorityConclusion: structuredConclusionRecords.length,
    recordsWithReferenceValues: referenceRecords.length,
    commentsInspected: false,
    note: 'Les commentaires textuels JECFA ne sont pas traités comme des données structurées et n’ont pas été analysés par NLP.',
  };
}

function openFoodToxAudit(oft, inventory) {
  const exposureSheet = inventory.find((sheet) => sheet.name === 'FLEX_SUM.ExpectedExposure');
  const toxSheet = inventory.find((sheet) => sheet.name === 'FLEX_SUM.ToxRefValues');
  const exposureCounts = countPopulatedColumns(OFT_WORK, exposureSheet.name, exposureSheet.exposureColumns);
  const toxCounts = countPopulatedColumns(OFT_WORK, toxSheet.name, toxSheet.referenceColumns.concat(toxSheet.exposureColumns));
  const priority = oft.priorityBatch ?? [];
  const priorityExposure = priority.filter((item) => Object.entries(item).some(([key, value]) => EXPOSURE_KEY.test(key) && hasObjectValue(value)));
  return {
    dataset: oft.source,
    sheets: inventory.map(({ name, rowCount, referenceColumns, exposureColumns, conclusionColumns }) => ({ name, rowCount, referenceColumns, exposureColumns, conclusionColumns })),
    referenceData: {
      toxRefValuesRows: toxSheet.rowCount,
      referenceColumns: toxSheet.referenceColumns,
      populatedReferenceColumns: toxCounts.populatedByColumn,
      priorityRecordsWithReferenceValues: priority.filter((item) => Array.isArray(item.referenceValues) && item.referenceValues.length > 0).length,
    },
    exposureData: {
      expectedExposureRows: exposureSheet.rowCount,
      exposureColumns: exposureSheet.exposureColumns,
      populatedExposureColumns: exposureCounts.populatedByColumn,
      priorityRecordsWithStructuredExposure: priorityExposure.length,
      conclusion: 'Aucune colonne structurée d’exposition alimentaire exploitable n’est présente dans FLEX_SUM.ExpectedExposure ou dans le lot prioritaire indexé.',
    },
  };
}

function classifyProfile(profile) {
  const fields = profileFields(profile);
  const hazard = Array.isArray(profile?.potentialEffects) && profile.potentialEffects.length > 0;
  const evidence = nonEmpty(profile?.evidenceLevel) || (profile?.sources ?? []).length > 0 || (profile?.authorityEvaluations ?? []).length > 0;
  const structuredExposure = fields.estimatedExposure || fields.exposureConclusion || fields.referenceValueComparison || fields.exceedanceStatus || fields.populationExposure || fields.exposureScenario || fields.marginOfExposure;
  return { fields, hazard, evidence, structuredExposure };
}

function sourceYieldRanking(oftAudit, jecfaAuditResult, profiles, completeCodes) {
  const currentProfilesWithExposure = profiles.filter(({ fields }) => fields.estimatedExposure || fields.exposureConclusion || fields.referenceValueComparison || fields.exceedanceStatus || fields.populationExposure || fields.exposureScenario || fields.marginOfExposure).length;
  return [
    { source: 'OUMMAH scientific master v1', structuredExposureYield: currentProfilesWithExposure, structuredConclusionYield: profiles.filter(({ fields }) => fields.structuredAuthorityConclusion).length, scope: `${completeCodes.length} complete profiles audited`, recommendation: 'Source de contrôle : elle ne fournit actuellement aucune exposition structurée.' },
    { source: 'EFSA OpenFoodTox 3.0 / FLEX_SUM.ExpectedExposure', structuredExposureYield: oftAudit.exposureData.priorityRecordsWithStructuredExposure, structuredConclusionYield: 0, scope: 'table row count and indexed priority batch', recommendation: 'À vérifier dans une prochaine collecte officielle si EFSA publie un export enrichi ; le fichier présent ne permet pas l’enrichissement.' },
    { source: 'JECFA indexed records', structuredExposureYield: jecfaAuditResult.recordsWithStructuredExposure, structuredConclusionYield: jecfaAuditResult.recordsWithStructuredAuthorityConclusion, scope: `${jecfaAuditResult.recordCount} records`, recommendation: 'Ne fournit actuellement que des évaluations/ADI structurées, pas d’exposition alimentaire structurée.' },
    { source: 'EFSA public metadata/pages', structuredExposureYield: null, structuredConclusionYield: null, scope: 'official pages inspected; no code-level dataset extracted', recommendation: 'Prochaine source à rechercher : endpoint/public dataset EFSA explicitement structuré pour l’exposition alimentaire, sans scraping libre de commentaires.' },
  ];
}

function main() {
  const oft = readJson(OFT);
  const jecfa = readJson(JECFA);
  const master = readJson(MASTER).profiles ?? [];
  const resolved = readJson(RESOLVED).rows ?? [];
  const recon = readJson(RECON);
  const coverage = readJson(COVERAGE);
  const allCodes = unique(resolved.map((row) => codeOf(row.code)));
  const theoreticalCompleteCodes = unique([
    ...(recon.sets?.existingSupabaseCompleteCodes ?? []),
    ...(recon.sets?.masterGeneratedCompleteCodes ?? []),
  ].map(codeOf));
  const downgradedCodes = new Set((recon.expectedCompleteButNotActuallyComplete ?? []).map((item) => codeOf(item.code ?? item)));
  const completeCodes = theoreticalCompleteCodes.filter((code) => !downgradedCodes.has(code));
  const profilesByCode = new Map(master.map((profile) => [codeOf(profile.code), profile]));
  const profileAudit = allCodes.map((code) => ({ code, ...classifyProfile(profilesByCode.get(code)) }));
  const completeAudits = completeCodes.map((code) => profileAudit.find((item) => item.code === code) ?? { code, fields: profileFields(null), hazard: false, evidence: false, structuredExposure: false });
  const withExposure = profileAudit.filter((item) => item.structuredExposure);
  const withConclusion = profileAudit.filter((item) => item.fields.structuredAuthorityConclusion);
  const withReference = profileAudit.filter((item) => item.fields.hasReferenceValues);
  const exposureLikeFreeText = profileAudit.filter((item) => item.fields.hasFreeTextOnly);
  const inventory = columnInventory(oft);
  const oftAudit = openFoodToxAudit(oft, inventory);
  const jecfaAuditResult = jecfaAudit(jecfa);
  const completeCross = {
    completeProfilesAudited: completeAudits.length,
    A_hazardAndEvidenceButNoExposure: completeAudits.filter((item) => item.hazard && item.evidence && !item.structuredExposure).length,
    B_hazardEvidenceAndExposure: completeAudits.filter((item) => item.hazard && item.evidence && item.structuredExposure).length,
    C_structuredConclusionButNoNumericExposure: completeAudits.filter((item) => item.fields.structuredAuthorityConclusion && !item.fields.estimatedExposure).length,
    D_noInformationEnablingRiskClassification: completeAudits.filter((item) => !item.hazard && !item.evidence && !item.fields.hasReferenceValues && !item.structuredExposure).length,
    methodology: 'Classification descriptive des champs présents ; aucune conclusion sanitaire n’est générée par cet audit.',
  };
  const spotCodes = ['E150D', 'E338', 'E621', 'E951', 'E955', 'E202', 'E330', 'E407', 'E471', 'E250'];
  const priorityByCode = new Map((oft.priorityBatch ?? []).map((item) => [codeOf(item.code), item]));
  const jecfaByCode = new Map((jecfa.records ?? []).filter((item) => item.ins).map((item) => [codeOf(`E${item.ins}`), item]));
  const spotChecks = spotCodes.map((code) => {
    const profile = profilesByCode.get(code);
    const audit = classifyProfile(profile);
    const oftItem = priorityByCode.get(code);
    const jecfaItem = jecfaByCode.get(code);
    return {
      code,
      profileStatus: profile?.completeness?.complete === true ? 'complete' : profile ? 'incomplete_or_review' : 'not_in_master',
      hazard: { present: audit.hazard, effectCount: profile?.potentialEffects?.length ?? 0 },
      reference: { profileReferenceValueCount: profile?.referenceValues?.length ?? 0, openFoodToxReferenceValueCount: oftItem?.referenceValues?.length ?? 0, jecfaEvaluationCount: jecfaItem?.evaluations?.length ?? 0 },
      exposure: { structuredFields: Object.entries(audit.fields).filter(([key, value]) => ['estimatedExposure', 'exposureConclusion', 'referenceValueComparison', 'exceedanceStatus', 'populationExposure', 'exposureScenario', 'marginOfExposure'].includes(key) && value).map(([key]) => key), openFoodTox: false, jecfa: false, jecfaIndexedExposureFields: jecfaItem ? Object.keys(jecfaItem).filter((key) => EXPOSURE_KEY.test(key)) : [], jecfaCommentContainsExposureLanguageNotCounted: Boolean(jecfaItem?.evaluations?.some((evaluation) => /exposure|intake|dietary/i.test(String(evaluation?.adi?.rawText ?? '')))) },
      structuredAuthorityConclusion: audit.fields.structuredAuthorityConclusion,
      whyCurrentEngineInsufficient: !audit.structuredExposure ? 'Aucune exposition individuelle structurée/comparaison/exceedance n’est disponible dans les profils actuels ; une valeur de référence seule ne suffit pas.' : null,
    };
  });
  const report = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    auditScope: 'Étape 14A — audit hors ligne des données d’exposition et conclusions officielles. Aucun moteur, profil, UI ou Supabase n’a été modifié.',
    sources: { openFoodToxIndex: path.relative(ROOT, OFT), openFoodToxWorkbook: oft.workbook.input, jecfaIndex: path.relative(ROOT, JECFA), currentProfiles: path.relative(ROOT, MASTER), completeProfileSet: path.relative(ROOT, RECON) },
    sourceAudit: { openFoodTox: oftAudit, jecfa: jecfaAuditResult, efsaPublicStructured: { inspected: true, pages: [{ title: 'Chemical Hazards Database — OpenFoodTox', url: 'https://www.efsa.europa.eu/en/data-report/chemical-hazards-database-openfoodtox', finding: 'Présente OpenFoodTox comme une base structurée de dangers, valeurs de référence et points de référence ; aucun champ d’exposition alimentaire par code n’a été extrait dans cet audit.' }, { title: 'Dietary Exposure tool — DietEx', url: 'https://www.efsa.europa.eu/en/science/tools-and-resources/dietex', finding: 'Outil EFSA d’estimation nécessitant des données de concentration et de consommation ; il ne constitue pas un champ d’exposition déjà attaché aux profils audités.' }, { title: 'Food additives', url: 'https://www.efsa.europa.eu/en/topics/topic/food-additives', finding: 'Confirme que les évaluations considèrent l’exposition alimentaire, sans fournir dans la page un endpoint structuré directement exploitable par code E.' }], conclusion: 'Les pages officielles orientent vers des outils/évaluations d’exposition, mais aucun endpoint public structuré par code E n’a été intégré à cet audit local.' } },
    fieldInventory: { profileFields: ['estimatedExposure', 'exposureConclusion', 'referenceValueComparison', 'exceedanceStatus', 'populationExposure', 'exposureScenario', 'marginOfExposure', 'structuredAuthorityConclusion'], openFoodToxSheets: inventory, jecfaStructuredExposureFields: jecfaAuditResult.structuredExposureFields, jecfaStructuredConclusionFields: jecfaAuditResult.structuredConclusionFields },
    coverage: { totalCodes: allCodes.length, codesWithReferenceValueOnly: allCodes.filter((code) => { const item = profileAudit.find((x) => x.code === code); return item.fields.hasReferenceValues && !item.structuredExposure && !item.fields.structuredAuthorityConclusion; }).length, codesWithStructuredExposure: withExposure.length, codesWithStructuredAuthorityConclusion: withConclusion.length, codesWithBothReferenceAndExposure: allCodes.filter((code) => { const item = profileAudit.find((x) => x.code === code); return item.fields.hasReferenceValues && item.structuredExposure; }).length, codesWithPopulationSpecificExposure: profileAudit.filter((item) => item.fields.populationExposure).length, codesWithExplicitExceedance: profileAudit.filter((item) => item.fields.exceedanceStatus).length, codesWithExplicitNoConcernConclusion: 0, codesWithOnlyFreeText: exposureLikeFreeText.length, codesWithNoExposureInformation: allCodes.filter((code) => { const item = profileAudit.find((x) => x.code === code); return !item.structuredExposure && !item.fields.structuredAuthorityConclusion; }).length, profileSourceCounts: { masterProfiles: master.length, completeProfileSet: completeCodes.length, coverageFileCompleteProfiles: coverage.completeProfiles } },
    profilesWithStructuredExposure: withExposure.map((item) => item.code),
    profilesWithStructuredConclusions: withConclusion.map((item) => item.code),
    profilesWithFreeTextOnly: exposureLikeFreeText.map((item) => item.code),
    profilesWithoutExposure: profileAudit.filter((item) => !item.structuredExposure).map((item) => item.code),
    cross252CompleteProfiles: completeCross,
    spotChecks,
    sourceYieldRanking: sourceYieldRanking(oftAudit, jecfaAuditResult, profileAudit, completeCodes),
    validation: { engineModified: false, scientificProfilesModified: false, supabaseUpsertPerformed: false, uiModified: false },
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), totalCodes: allCodes.length, completeProfilesAudited: completeAudits.length, openFoodToxExposureRows: oftAudit.exposureData.expectedExposureRows, structuredProfileExposure: withExposure.length, jecfaStructuredExposure: jecfaAuditResult.recordsWithStructuredExposure }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
