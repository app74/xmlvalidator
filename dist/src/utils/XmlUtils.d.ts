import { ValidationIssue } from '../models/ValidationModels';
export declare function getPositionFromOffset(xml: string, offset: number): {
    line: number;
    column: number;
};
export declare function getLineText(xml: string, lineNumber: number): string;
export declare function getXmlTagMatches(xml: string, tagName: string): Array<{
    value: string;
    line: number;
    column: number;
    offset: number;
}>;
export declare function getXmlTagOccurrences(xml: string, tagName: string): {
    value: string;
    line: number;
    column: number;
}[];
export declare function hasDangerousXml(xml: string): boolean;
export declare function findSuspiciousCharacters(xml: string): ValidationIssue[];
