import { getXmlTagOccurrences, getLineText } from '../utils/XmlUtils';
import { parseMoneyToCents, formatCentsAsCurrency, sumCents } from '../utils/MoneyUtils';
export function validateControlSum(xml) {
    const declared = getXmlTagOccurrences(xml, 'CtrlSum');
    const declaredValue = declared.length > 0 ? declared[0]?.value.trim() : undefined;
    const amounts = getXmlTagOccurrences(xml, 'InstdAmt').map((entry) => parseMoneyToCents(entry.value));
    const calculatedCents = sumCents(amounts);
    const calculatedControlSum = formatCentsAsCurrency(calculatedCents);
    const issues = [];
    if (declaredValue) {
        const parsedDeclaredCents = parseMoneyToCents(declaredValue);
        if (parsedDeclaredCents === null) {
            issues.push({
                type: 'control-sum',
                severity: 'error',
                message: 'Kontrolný súčet má neplatný formát.',
                line: declared[0]?.line ?? 1,
                xmlLine: getLineText(xml, declared[0]?.line ?? 1).trimEnd(),
                recommendation: 'Zadajte kontrolný súčet vo formáte EUR, napr. 1234.56.',
            });
        }
        else if (calculatedCents !== parsedDeclaredCents) {
            issues.push({
                type: 'control-sum',
                severity: 'error',
                message: `Kontrolný súčet sa nezhoduje: ${calculatedControlSum} vs ${declaredValue}.`,
                line: declared[0]?.line ?? 1,
                xmlLine: getLineText(xml, declared[0]?.line ?? 1).trimEnd(),
                recommendation: 'Upravte hodnotu GrpHdr/CtrlSum tak, aby zodpovedala súčtu InstdAmt.',
            });
        }
    }
    return {
        issues,
        calculatedControlSum,
        declaredControlSum: declaredValue,
    };
}
