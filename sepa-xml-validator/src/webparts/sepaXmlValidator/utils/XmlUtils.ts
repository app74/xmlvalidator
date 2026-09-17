import { ValidationIssue } from '../models/ValidationModels';

function padHex(value: number): string {
  const text = value.toString(16).toUpperCase();
  return text.length < 4 ? new Array(5 - text.length).join('0') + text : text;
}

function getTagEnd(xml: string, start: number): number {
  let quote = '';

  for (let index = start; index < xml.length; index += 1) {
    const character = xml.charAt(index);
    if ((character === '"' || character === "'") && (quote === '' || quote === character)) {
      quote = quote === '' ? character : '';
    } else if (character === '>' && quote === '') {
      return index;
    }
  }

  return -1;
}

function getTagPosition(xml: string, offset: number): { line: number; column: number } {
  return getPositionFromOffset(xml, offset);
}

export function findXmlStructureIssues(xml: string): ValidationIssue[] {
  const stack: Array<{ name: string; offset: number }> = [];
  const issues: ValidationIssue[] = [];
  let cursor = 0;

  while (cursor < xml.length) {
    const start = xml.indexOf('<', cursor);
    if (start < 0) {
      break;
    }

    if (xml.substr(start, 4) === '<!--') {
      const commentEnd = xml.indexOf('-->', start + 4);
      cursor = commentEnd < 0 ? xml.length : commentEnd + 3;
      continue;
    }
    if (xml.substr(start, 9) === '<![CDATA[') {
      const cdataEnd = xml.indexOf(']]>', start + 9);
      cursor = cdataEnd < 0 ? xml.length : cdataEnd + 3;
      continue;
    }

    const end = getTagEnd(xml, start + 1);
    if (end < 0) {
      const position = getTagPosition(xml, start);
      issues.push({
        type: 'xml-structure',
        severity: 'error',
        message: 'XML obsahuje neukončený tag.',
        line: position.line,
        column: position.column,
        xmlLine: getLineText(xml, position.line),
        recommendation: 'Skontrolujte znak > na konci tagu.'
      });
      break;
    }

    const rawTag = xml.slice(start + 1, end).replace(/^\s+|\s+$/g, '');
    cursor = end + 1;
    if (!rawTag || rawTag.charAt(0) === '?' || rawTag.charAt(0) === '!') {
      continue;
    }

    const closing = rawTag.charAt(0) === '/';
    const selfClosing = /\/\s*$/.test(rawTag);
    const tagBody = rawTag.replace(/^\//, '').replace(/\/\s*$/, '').replace(/^\s+|\s+$/g, '');
    const nameMatch = /^([A-Za-z_][A-Za-z0-9_.:-]*)/.exec(tagBody);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];
    const position = getTagPosition(xml, start);
    if (closing) {
      const expected = stack.length > 0 ? stack[stack.length - 1] : undefined;
      if (!expected || expected.name !== name) {
        issues.push({
          type: 'xml-structure',
          severity: 'error',
          message: expected ? 'Nesprávne uzatváranie tagu: očakáva sa </' + expected.name + '>, nájdené </' + name + '>.' : 'Uzatvárací tag </' + name + '> nemá zodpovedajúci otvorený tag.',
          line: position.line,
          column: position.column,
          xmlLine: getLineText(xml, position.line),
          recommendation: 'Zjednoťte názov otváracieho a uzatváracieho tagu.'
        });
      } else {
        stack.pop();
      }
    } else if (!selfClosing) {
      stack.push({ name, offset: start });
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    if (!unclosed) {
      break;
    }
    const position = getTagPosition(xml, unclosed.offset);
    issues.push({
      type: 'xml-structure',
      severity: 'error',
      message: 'Tag <' + unclosed.name + '> nie je uzatvorený.',
      line: position.line,
      column: position.column,
      xmlLine: getLineText(xml, position.line),
      recommendation: 'Doplňte zodpovedajúci uzatvárací tag </' + unclosed.name + '>.'
    });
  }

  return issues;
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
