import { validateSepaDocument } from './ValidationService';

const validXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<Document>',
  '  <Ctry>SK</Ctry>',
  '  <NbOfTxs>1</NbOfTxs>',
  '  <CtrlSum>10.00</CtrlSum>',
  '  <InstdAmt>10.00</InstdAmt>',
  '</Document>'
].join('\n');

describe('validateSepaDocument', () => {
  it('accepts a document with matching country, count and control sum', () => {
    const result = validateSepaDocument(validXml, 'valid.xml', validXml.length);

    expect(result.overallStatus).toBe('ok');
    expect(result.transactionCount).toBe(1);
    expect(result.declaredTransactionCount).toBe(1);
    expect(result.calculatedControlSum).toBe('10,00 EUR');
    expect(result.issues).toHaveLength(0);
  });

  it('rejects dangerous XML declarations', () => {
    const xml = '<!DOCTYPE Document [<!ENTITY test "value">]><Document />';
    const result = validateSepaDocument(xml, 'unsafe.xml', xml.length);

    expect(result.overallStatus).toBe('error');
    expect(result.checks[0].id).toBe('xml-structure');
    expect(result.checks[0].status).toBe('error');
  });

  it('reports transaction count and control sum mismatches', () => {
    const xml = [
      '<Document>',
      '  <NbOfTxs>2</NbOfTxs>',
      '  <CtrlSum>12.00</CtrlSum>',
      '  <InstdAmt>10.00</InstdAmt>',
      '</Document>'
    ].join('\n');
    const result = validateSepaDocument(xml, 'mismatch.xml', xml.length);

    expect(result.issues.some((issue) => issue.type === 'transaction-count')).toBe(true);
    expect(result.issues.some((issue) => issue.type === 'control-sum')).toBe(true);
  });
});
