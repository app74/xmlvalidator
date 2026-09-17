import { getXmlTagOccurrences, getLineText } from '../utils/XmlUtils';
export function validateTransactionCount(xml) {
    const declared = getXmlTagOccurrences(xml, 'NbOfTxs');
    const declaredValue = declared.length > 0 ? Number.parseInt((declared[0]?.value ?? '').trim(), 10) : undefined;
    const actualCount = getXmlTagOccurrences(xml, 'InstdAmt').length;
    const issues = [];
    if (declaredValue !== undefined) {
        if (actualCount !== declaredValue) {
            const line = declared[0]?.line ?? 1;
            issues.push({
                type: 'transaction-count',
                severity: 'error',
                message: `Počet platieb nezhoduje sa: ${actualCount} vs ${declaredValue}.`,
                line,
                xmlLine: getLineText(xml, line).trimEnd(),
                recommendation: 'Upravte hodnotu GrpHdr/NbOfTxs tak, aby zodpovedala počtu InstdAmt.',
            });
        }
    }
    return {
        issues,
        transactionCount: actualCount,
        declaredTransactionCount: declaredValue,
    };
}
