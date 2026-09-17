import { SepaValidationResult } from '../models/ValidationModels';
import { parseMoneyToCents, sumCents } from './MoneyUtils';

export interface RepairProposal {
  id: string;
  title: string;
  description: string;
  warning?: string;
  start: number;
  end: number;
  before: string;
  after: string;
}

interface TextElement {
  value: string;
  start: number;
  end: number;
}

function getElements(xml: string, localName: string): TextElement[] {
  const regex = new RegExp('<(?:[A-Za-z_][^>:]*:)?' + localName + '\\b[^>]*>([\\s\\S]*?)</(?:[A-Za-z_][^>:]*:)?' + localName + '>', 'gi');
  const elements: TextElement[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const value = match[1] || '';
    const valueStart = match.index + match[0].indexOf(value);
    elements.push({ value, start: valueStart, end: valueStart + value.length });
  }

  return elements;
}

function createProposal(
  id: string,
  title: string,
  description: string,
  element: TextElement,
  after: string,
  warning?: string
): RepairProposal | undefined {
  if (element.value === after) {
    return undefined;
  }

  return { id, title, description, warning, start: element.start, end: element.end, before: element.value, after };
}

function getCalculatedAmount(xml: string): number | undefined {
  const amountElements = getElements(xml, 'InstdAmt');
  const amounts = amountElements.map(function (element) { return parseMoneyToCents(element.value); });
  return sumCents(amounts);
}

function formatXmlAmount(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  return sign + Math.floor(absolute / 100).toString() + '.' + (absolute % 100 < 10 ? '0' : '') + (absolute % 100).toString();
}

function getOffsetFromPosition(xml: string, line: number, column: number): number {
  let offset = 0;

  for (let currentLine = 1; currentLine < line; currentLine += 1) {
    const newline = xml.indexOf('\n', offset);
    if (newline < 0) {
      return xml.length;
    }
    offset = newline + 1;
  }

  return offset + Math.max(0, column - 1);
}

function getCharacterRepair(character: string): { after: string; title: string; description: string; warning?: string } | undefined {
  switch (character) {
    case '\u001A':
      return {
        after: '',
        title: 'Odstrániť riadiaci znak',
        description: 'Odstráni znak U+001A, ktorý nie je platným XML obsahom.',
        warning: 'Odstránenie je bezpečné iba vtedy, ak znak nie je súčasťou významu textu.'
      };
    case '–':
      return {
        after: '-',
        title: 'Nahradiť dlhú pomlčku',
        description: 'Nahradí typografickú pomlčku ASCII spojovníkom.',
        warning: 'Skontrolujte, či sa znak nachádza v textovom poli, kde je ASCII spojovník prípustný.'
      };
    case '\u00A0':
      return {
        after: ' ',
        title: 'Nahradiť nedeliteľnú medzeru',
        description: 'Nahradí neviditeľnú nedeliteľnú medzeru bežnou medzerou bez zmeny textového významu.'
      };
    case '´':
      return {
        after: "'",
        title: 'Nahradiť akútny prízvuk',
        description: 'Nahradí samostatný typografický akútny prízvuk ASCII apostrofom.',
        warning: 'Skontrolujte výsledný text, pretože pôvodný znak môže byť súčasťou názvu.'
      };
    case 'Æ':
      return {
        after: 'AE',
        title: 'Nahradiť znak Æ',
        description: 'Nahradí znak Æ dvojicou ASCII znakov AE.',
        warning: 'Skontrolujte výsledný názov alebo adresu; ide o textovú transliteráciu.'
      };
    default:
      return undefined;
  }
}

export function getRepairProposals(xml: string, result: SepaValidationResult): RepairProposal[] {
  const proposals: RepairProposal[] = [];
  const countries = getElements(xml, 'Ctry');
  const countryIssues = result.issues.filter(function (issue) { return issue.type === 'country'; });

  countries.forEach(function (element, index) {
    if (/^[a-z]{2}$/.test(element.value.trim()) && countryIssues.length > index) {
      const normalized = element.value.replace(/[a-z]/g, function (letter) { return letter.toUpperCase(); });
      const proposal = createProposal(
        'country-' + index,
        'Normalizovať kód krajiny',
        'Kód krajiny obsahuje dve malé písmená a možno ho jednoznačne previesť na veľké písmená.',
        element,
        normalized
      );
      if (proposal) {
        proposals.push(proposal);
      }
    }
  });

  const transactionElements = getElements(xml, 'NbOfTxs');
  if (transactionElements.length > 0 && result.declaredTransactionCount !== undefined && result.declaredTransactionCount !== result.transactionCount) {
    const proposal = createProposal(
      'transaction-count',
      'Opraviť počet platieb',
      'Nastaví hodnotu NbOfTxs na počet nájdených prvkov InstdAmt.',
      transactionElements[0],
      result.transactionCount.toString(),
      'Toto mení deklarované údaje súboru. Použite iba vtedy, ak je počet InstdAmt správny.'
    );
    if (proposal) {
      proposals.push(proposal);
    }
  }

  const bicElements = getElements(xml, 'BIC');
  bicElements.forEach(function (element, index) {
    if (/^[A-Z]{8}[a-z]$/.test(element.value)) {
      const proposal = createProposal(
        'bic-' + index,
        'Opraviť BIC',
        'Odstráni jednoznačne nadbytočný deviaty znak z BIC.',
        element,
        element.value.slice(0, 8),
        'Overte BIC voči bankovým údajom. Oprava odstráni iba koncový znak navyše.'
      );
      if (proposal) {
        proposals.push(proposal);
      }
    }
  });

  const controlSumElements = getElements(xml, 'CtrlSum');
  const calculatedAmount = getCalculatedAmount(xml);
  if (controlSumElements.length > 0 && calculatedAmount !== undefined && result.issues.some(function (issue) { return issue.type === 'control-sum'; })) {
    const proposal = createProposal(
      'control-sum',
      'Opraviť kontrolný súčet',
      'Nastaví CtrlSum na súčet hodnôt InstdAmt vypočítaný v centoch.',
      controlSumElements[0],
      formatXmlAmount(calculatedAmount),
      'Toto mení finančný údaj súboru. Pred použitím overte, že všetky InstdAmt sú správne.'
    );
    if (proposal) {
      proposals.push(proposal);
    }
  }

  result.issues.filter(function (issue) { return issue.type === 'suspicious-character' && issue.character !== undefined; }).forEach(function (issue, index) {
    const repair = getCharacterRepair(issue.character as string);
    if (repair && issue.line && issue.column) {
      const start = getOffsetFromPosition(xml, issue.line, issue.column);
      proposals.push({
        id: 'suspicious-character-' + index,
        title: repair.title,
        description: repair.description,
        warning: repair.warning,
        start,
        end: start + 1,
        before: issue.character as string,
        after: repair.after
      });
    }
  });

  return proposals;
}

export function applyRepair(xml: string, proposal: RepairProposal): string {
  return xml.slice(0, proposal.start) + proposal.after + xml.slice(proposal.end);
}
