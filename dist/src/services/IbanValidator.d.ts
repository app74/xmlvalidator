import { ValidationIssue } from '../models/ValidationModels';
export declare function normalizeIban(value: string): string;
export declare function validateIbanChecksum(value: string): boolean;
export declare function validateIban(xml: string): {
    issues: ValidationIssue[];
    ibanOccurrences: number;
    uniqueIbans: number;
    invalidIbans: string[];
};
