export function getPositionFromOffset(xml, offset) {
    const before = xml.slice(0, Math.max(0, offset));
    const line = before.split(/\r?\n/).length;
    const lastNewline = before.lastIndexOf('\n');
    const lastCarriage = before.lastIndexOf('\r');
    const lastLineBreak = Math.max(lastNewline, lastCarriage);
    const column = lastLineBreak >= 0 ? before.length - lastLineBreak : before.length + 1;
    return { line, column: Math.max(1, column) };
}
export function getLineText(xml, lineNumber) {
    const lines = xml.split(/\r?\n/);
    return lines[Math.max(0, lineNumber - 1)] ?? '';
}
export function getXmlTagMatches(xml, tagName) {
    const regex = new RegExp(`<(?:[A-Za-z_][A-Za-z0-9_.-]*:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z_][A-Za-z0-9_.-]*:)?${tagName}>`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        const value = match[1] ?? '';
        const offset = match.index;
        const position = getPositionFromOffset(xml, offset);
        matches.push({ value: value.trim(), line: position.line, column: position.column, offset });
    }
    return matches;
}
export function getXmlTagOccurrences(xml, tagName) {
    return getXmlTagMatches(xml, tagName).map((match) => ({
        value: match.value,
        line: match.line,
        column: match.column,
    }));
}
export function hasDangerousXml(xml) {
    const dangerPatterns = [
        /<!DOCTYPE/i,
        /<!ENTITY/i,
        /<!ELEMENT/i,
        /SYSTEM\s+["']/i,
        /PUBLIC\s+["']/i,
        /\bENTITY\b/i,
    ];
    return dangerPatterns.some((pattern) => pattern.test(xml));
}
export function findSuspiciousCharacters(xml) {
    const issues = [];
    const suspiciousSet = new Set(['\u001A', '–', ' ', '´', '�', 'Æ']);
    for (let index = 0; index < xml.length; index += 1) {
        const char = xml[index];
        const codePoint = char.codePointAt(0) ?? 0;
        const isAllowedWhitespace = char === '\n' || char === '\r' || char === '\t' || char === ' ';
        const isAllowedAscii = codePoint >= 0x20 && codePoint <= 0x7e;
        const isAllowedSlovakCzech = /[áäčďéěíľĺňóôŕřšťúýžÁÄČĎÉĚÍĽĹŇÓÔŔŘŠŤÚÝŽ]/u.test(char);
        const suspicious = suspiciousSet.has(char) || (codePoint < 0x20 && !isAllowedWhitespace) || (codePoint === 0x7f) ||
            (codePoint > 0x7e && !isAllowedSlovakCzech && !/^[\p{L}\p{N}]$/u.test(char));
        if (suspicious) {
            const position = getPositionFromOffset(xml, index);
            const lineText = getLineText(xml, position.line);
            issues.push({
                type: 'suspicious-character',
                severity: 'error',
                message: 'Nájdený nebezpečný alebo neviditeľný znak.',
                line: position.line,
                column: position.column,
                character: char === '\n' ? '\\n' : char,
                codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
                xmlLine: lineText.trimEnd(),
                recommendation: 'Odstráňte neviditeľný alebo neplatný znak z XML textu.',
            });
        }
    }
    return issues;
}
