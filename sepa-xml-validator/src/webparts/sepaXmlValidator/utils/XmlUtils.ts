function padHex(value: number): string {
  const text = value.toString(16).toUpperCase();
  return text.length < 4 ? new Array(5 - text.length).join('0') + text : text;
}

export function getPositionFromOffset(xml: string, offset: number): { line: number; column: number } {
  const before = xml.slice(0, Math.max(0, offset));
  const line = before.split(/\r?\n/).length;
  const lastNewline = before.lastIndexOf('\n');
  const lastCarriage = before.lastIndexOf('\r');
  const lastBreak = Math.max(lastNewline, lastCarriage);
  const column = lastBreak >= 0 ? before.length - lastBreak : before.length + 1;
  return { line, column: Math.max(1, column) };
}

export function getLineText(xml: string, lineNumber: number): string {
  const lines = xml.split(/\r?\n/);
  return lines[Math.max(0, lineNumber - 1)] || '';
}

export function hasDangerousXml(xml: string): boolean {
  return /<!DOCTYPE|<!ENTITY|SYSTEM\s+["']|PUBLIC\s+["']/i.test(xml);
}

export function findSuspiciousCharacters(xml: string): Array<{ line: number; column: number; character: string; codePoint: string; xmlLine: string }> {
  const results: Array<{ line: number; column: number; character: string; codePoint: string; xmlLine: string }> = [];
  const suspiciousChars = ['\u001A', '–', ' ', '´', '�', 'Æ'];

  for (let i = 0; i < xml.length; i += 1) {
    const ch = xml.charAt(i);
    const codePoint = ch.charCodeAt(0);
    const allowedWhitespace = ch === '\n' || ch === '\r' || ch === '\t' || ch === ' ';
    const allowedAscii = codePoint >= 0x20 && codePoint <= 0x7e;
    const allowedCzech = /[áäčďéěíľĺňóôŕřšťúýžÁÄČĎÉĚÍĽĹŇÓÔŔŘŠŤÚÝŽ]/.test(ch);
    const isLetterOrDigit = (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');

    const isSuspicious = suspiciousChars.indexOf(ch) >= 0
      || (codePoint < 0x20 && !allowedWhitespace)
      || (codePoint === 0x7f)
      || (codePoint > 0x7e && !allowedAscii && !allowedCzech && !isLetterOrDigit);

    if (isSuspicious) {
      const pos = getPositionFromOffset(xml, i);
      results.push({
        line: pos.line,
        column: pos.column,
        character: ch === '\n' ? '\\n' : ch,
        codePoint: 'U+' + padHex(codePoint),
        xmlLine: getLineText(xml, pos.line).replace(/\s+$/, '')
      });
    }
  }

  return results;
}
