import { getXmlTagOccurrences, getLineText } from '../utils/XmlUtils';
export function validateCountry(xml) {
    const issues = [];
    for (const match of getXmlTagOccurrences(xml, 'Ctry')) {
        const value = match.value.trim();
        if (!/^[A-Z]{2}$/.test(value)) {
            const issue = {
                type: 'country',
                severity: 'error',
                message: 'Kód krajiny má nesprávny formát.',
                line: match.line,
                column: match.column,
                xmlLine: getLineText(xml, match.line).trimEnd(),
                recommendation: `Očakávané: <Ctry>SK</Ctry>`,
            };
            const fallback = value.toUpperCase();
            if (fallback.length === 2 && /^[A-Z]{2}$/.test(fallback)) {
                issue.recommendation = `<Ctry>${fallback}</Ctry>`;
            }
            issues.push(issue);
        }
    }
    return issues;
}
