import { ValidationIssue } from '../models/ValidationModels';
export declare function validateControlSum(xml: string): {
    issues: ValidationIssue[];
    calculatedControlSum?: string;
    declaredControlSum?: string;
};
