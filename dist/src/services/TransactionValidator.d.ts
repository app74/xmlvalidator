import { ValidationIssue } from '../models/ValidationModels';
export declare function validateTransactionCount(xml: string): {
    issues: ValidationIssue[];
    transactionCount: number;
    declaredTransactionCount?: number;
};
