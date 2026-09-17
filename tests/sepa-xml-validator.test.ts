import { describe, expect, it } from 'vitest';
import { validateSepaXml } from '../src/services/SepaXmlValidatorService';
import { validateIbanChecksum } from '../src/services/IbanValidator';
import { validateCountry } from '../src/services/CountryValidator';

const sampleValidXml = `
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <NbOfTxs>2</NbOfTxs>
      <CtrlSum>10.00</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="EUR">5.00</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>Test</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id><IBAN>SK3112000000198742637541</IBAN></Id>
        </CdtrAcct>
        <Ctry>SK</Ctry>
      </CdtTrfTxInf>
      <CdtTrfTxInf>
        <Amt>
          <InstdAmt Ccy="EUR">5.00</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>Test</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id><IBAN>SK3112000000198742637541</IBAN></Id>
        </CdtrAcct>
        <Ctry>SK</Ctry>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;

describe('SEPA XML validator core logic', () => {
  it('accepts valid XML with correct Ctry, IBAN, count and sum', () => {
    const result = validateSepaXml(sampleValidXml, 'valid.xml', 1024);
    expect(result.overallStatus).toBe('ok');
    expect(result.checks.some((check) => check.id === 'ctry' && check.status === 'ok')).toBe(true);
    expect(result.checks.some((check) => check.id === 'iban' && check.status === 'ok')).toBe(true);
  });

  it('detects invalid country values case sensitively', () => {
    const xml = sampleValidXml.replace('<Ctry>SK</Ctry>', '<Ctry>Sk</Ctry>');
    const issues = validateCountry(xml);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toContain('Kód krajiny');
  });

  it('detects suspicious XML characters', () => {
    const xml = sampleValidXml.replace('Test', 'Vana-L\u001Auna 15');
    const result = validateSepaXml(xml, 'special.xml', 1024);
    expect(result.issues.some((issue) => issue.type === 'suspicious-character')).toBe(true);
  });

  it('validates an IBAN checksum correctly', () => {
    const valid = 'SK3112000000198742637541';
    const invalid = 'SK3112000000198742637542';
    expect(validateIbanChecksum(valid)).toBe(true);
    expect(validateIbanChecksum(invalid)).toBe(false);
  });

  it('fails when declared transaction count differs from actual', () => {
    const xml = sampleValidXml.replace('<NbOfTxs>2</NbOfTxs>', '<NbOfTxs>5</NbOfTxs>');
    const result = validateSepaXml(xml, 'count.xml', 1024);
    expect(result.checks.find((check) => check.id === 'nb-of-txs')?.status).toBe('error');
  });

  it('fails when control sum differs', () => {
    const xml = sampleValidXml.replace('<CtrlSum>10.00</CtrlSum>', '<CtrlSum>9.99</CtrlSum>');
    const result = validateSepaXml(xml, 'ctrlsum.xml', 1024);
    expect(result.checks.find((check) => check.id === 'ctrl-sum')?.status).toBe('error');
  });

  it('rejects XML containing DOCTYPE or entity declarations', () => {
    const xml = `<?xml version="1.0"?>\n<!DOCTYPE test [<!ENTITY xxe SYSTEM "https://example.com">]>\n<Root/>`;
    const result = validateSepaXml(xml, 'malformed.xml', 1024);
    expect(result.checks.find((check) => check.id === 'xml-structure')?.status).toBe('error');
  });

  it('supports namespaced XML', () => {
    const xml = sampleValidXml.replace('xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"', 'xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"');
    const result = validateSepaXml(xml, 'ns.xml', 1024);
    expect(result.overallStatus).toBe('ok');
  });

  it('uses the shared XML structure validation', () => {
    const xml = '<Document><Nm>DIR - LINE s. r. o.</N></Document>';
    const result = validateSepaXml(xml, 'mismatched-tag.xml', xml.length);

    expect(result.xmlWellFormed).toBe(false);
    expect(result.checks.find((check) => check.id === 'xml-structure')?.status).toBe('error');
  });
});
