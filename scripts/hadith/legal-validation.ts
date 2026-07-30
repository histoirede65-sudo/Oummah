export type LegalDecision = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface LegalSourceVersionInput {
  sourceName?: string;
  sourceStatus?: string;
  sourceVersion?: string;
  languageCode?: string | null;
  license?: string | null;
  attribution?: string | null;
  termsUrl?: string | null;
  sourceUrl?: string | null;
}

export interface LegalReviewInput {
  decision?: LegalDecision;
  redistributionAllowed?: boolean | null;
  commercialUseAllowed?: boolean | null;
  modificationAllowed?: boolean | null;
  licenseIdentifier?: string | null;
  licenseEvidenceReference?: string | null;
  attributionSnapshot?: string | null;
  termsUrlSnapshot?: string | null;
  sourceUrlSnapshot?: string | null;
  reviewedBy?: string | null;
  justification?: string | null;
}

export interface LegalValidationIssue {
  level: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  path: string;
  message: string;
}

export interface LegalValidationReport {
  version: '1.0.0';
  generatedAt: string;
  errors: number;
  warnings: number;
  issues: LegalValidationIssue[];
  canApprove: boolean;
  canPublish: boolean;
}

const present = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const issue = (
  level: LegalValidationIssue['level'],
  code: string,
  path: string,
  message: string,
): LegalValidationIssue => ({ level, code, path, message });

export function validateLegalPublication(
  source: LegalSourceVersionInput,
  review?: LegalReviewInput,
): LegalValidationReport {
  const issues: LegalValidationIssue[] = [];

  if (source.sourceStatus !== 'Validée') {
    issues.push(issue('ERROR', 'SOURCE_NOT_VALIDATED', 'sourceStatus', 'La source doit avoir le statut « Validée ».'));
  }
  if (!present(source.sourceVersion)) {
    issues.push(issue('ERROR', 'SOURCE_VERSION_MISSING', 'sourceVersion', 'La version du corpus est obligatoire.'));
  }
  if (!present(source.license)) {
    issues.push(issue('ERROR', 'LICENSE_MISSING', 'license', 'La licence est obligatoire avant publication.'));
  }
  if (!present(source.attribution)) {
    issues.push(issue('ERROR', 'ATTRIBUTION_MISSING', 'attribution', 'L’attribution est obligatoire avant publication.'));
  }
  if (!present(source.sourceUrl)) {
    issues.push(issue('ERROR', 'SOURCE_URL_MISSING', 'sourceUrl', 'L’URL de provenance est obligatoire avant publication.'));
  }
  if (!present(source.termsUrl)) {
    issues.push(issue('WARNING', 'TERMS_URL_MISSING', 'termsUrl', 'Aucune URL de conditions ou de licence n’est documentée.'));
  }

  if (!review) {
    issues.push(issue('ERROR', 'LEGAL_REVIEW_MISSING', 'review', 'Une revue juridique est obligatoire.'));
  } else {
    if (review.decision !== 'approved') {
      issues.push(issue('ERROR', 'LEGAL_REVIEW_NOT_APPROVED', 'review.decision', 'La revue juridique n’est pas approuvée.'));
    }
    if (review.redistributionAllowed !== true) {
      issues.push(issue('ERROR', 'REDISTRIBUTION_NOT_ALLOWED', 'review.redistributionAllowed', 'Le droit de redistribution doit être explicitement confirmé.'));
    }
    if (!present(review.licenseIdentifier)) {
      issues.push(issue('ERROR', 'LICENSE_IDENTIFIER_MISSING', 'review.licenseIdentifier', 'L’identifiant de licence est obligatoire.'));
    } else if (present(source.license) && review.licenseIdentifier.trim() !== source.license.trim()) {
      issues.push(issue('ERROR', 'LICENSE_SNAPSHOT_MISMATCH', 'review.licenseIdentifier', 'La licence approuvée ne correspond plus à la version source.'));
    }
    if (!present(review.licenseEvidenceReference)) {
      issues.push(issue('ERROR', 'LICENSE_EVIDENCE_MISSING', 'review.licenseEvidenceReference', 'La preuve de licence est obligatoire.'));
    }
    if (!present(review.attributionSnapshot)) {
      issues.push(issue('ERROR', 'ATTRIBUTION_SNAPSHOT_MISSING', 'review.attributionSnapshot', 'L’attribution approuvée doit être conservée.'));
    } else if (present(source.attribution) && review.attributionSnapshot.trim() !== source.attribution.trim()) {
      issues.push(issue('ERROR', 'ATTRIBUTION_SNAPSHOT_MISMATCH', 'review.attributionSnapshot', 'L’attribution approuvée ne correspond plus à la version source.'));
    }
    if (!present(review.sourceUrlSnapshot)) {
      issues.push(issue('ERROR', 'SOURCE_URL_SNAPSHOT_MISSING', 'review.sourceUrlSnapshot', 'L’URL source approuvée doit être conservée.'));
    } else if (present(source.sourceUrl) && review.sourceUrlSnapshot.trim() !== source.sourceUrl.trim()) {
      issues.push(issue('ERROR', 'SOURCE_URL_SNAPSHOT_MISMATCH', 'review.sourceUrlSnapshot', 'L’URL approuvée ne correspond plus à la version source.'));
    }
    if ((review.termsUrlSnapshot ?? null) !== (source.termsUrl ?? null)) {
      issues.push(issue('ERROR', 'TERMS_URL_SNAPSHOT_MISMATCH', 'review.termsUrlSnapshot', 'Les conditions approuvées ne correspondent plus à la version source.'));
    }
    if (!present(review.reviewedBy)) {
      issues.push(issue('ERROR', 'REVIEWER_MISSING', 'review.reviewedBy', 'L’auteur de la décision est obligatoire.'));
    }
    if (!present(review.justification)) {
      issues.push(issue('ERROR', 'JUSTIFICATION_MISSING', 'review.justification', 'La justification juridique est obligatoire.'));
    }
  }

  const errors = issues.filter((item) => item.level === 'ERROR').length;
  const warnings = issues.filter((item) => item.level === 'WARNING').length;
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    errors,
    warnings,
    issues,
    canApprove: errors === 0,
    canPublish: errors === 0 && review?.decision === 'approved' && review.redistributionAllowed === true,
  };
}
