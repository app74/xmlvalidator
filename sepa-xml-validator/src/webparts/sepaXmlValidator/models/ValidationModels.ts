export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationStatus = 'ok' | 'error' | 'warning' | 'not-checked';

export type ValidationIssueType =
  | 'xml-structure'
  | 'suspicious-character'
  | 'country'
  | 'bic'
  | 'iban'
  | 'transaction-count'
  | 'control-sum'
  | 'security'
  | 'file-size'
  | 'general';

export interface ValidationIssue {
  type: ValidationIssueType;
  severity: ValidationSeverity;
  message: string;
  line?: number;
  column?: number;
  character?: string;
  codePoint?: string;
  xmlLine?: string;
  recommendation?: string;
}

export interface ValidationCheck {
  id: string;
  name: string;
  status: ValidationStatus;
  issues: ValidationIssue[];
}

export interface SepaValidationResult {
  fileName: string;
  fileSize: number;
  encoding: string;
  hasBom: boolean;
  xmlWellFormed: boolean;
  transactionCount: number;
  declaredTransactionCount?: number;
  calculatedControlSum?: string;
  declaredControlSum?: string;
  ibanOccurrences: number;
  uniqueIbans: number;
  invalidIbans: string[];
  issues: ValidationIssue[];
  checks: ValidationCheck[];
  overallStatus: ValidationStatus;
  overallSummary: string;
}
