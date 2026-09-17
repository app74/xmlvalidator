import { getRepairProposals, applyRepair } from './RepairService';
import { validateSepaDocument } from '../services/ValidationService';

describe('RepairService', () => {
  it('creates an explicit proposal for a lowercase country code', () => {
    const xml = '<Document><Ctry>sk</Ctry></Document>';
    const result = validateSepaDocument(xml, 'input.xml', xml.length);
    const proposals = getRepairProposals(xml, result);

    expect(proposals[0].before).toBe('sk');
    expect(proposals[0].after).toBe('SK');
    expect(applyRepair(xml, proposals[0])).toContain('<Ctry>SK</Ctry>');
  });

  it('does not propose automatic repair for an invalid IBAN', () => {
    const xml = '<Document><IBAN>SK0000000000000000000000</IBAN></Document>';
    const result = validateSepaDocument(xml, 'input.xml', xml.length);
    const proposals = getRepairProposals(xml, result);

    expect(proposals.some((proposal) => proposal.id.indexOf('iban') >= 0)).toBe(false);
  });

  it('proposes a repair for a suspicious Æ character at its reported position', () => {
    const xml = '<Document>\n  <Nm>NovÆk</Nm>\n</Document>';
    const result = validateSepaDocument(xml, 'input.xml', xml.length);
    const proposals = getRepairProposals(xml, result);
    const proposal = proposals.filter((item) => item.before === 'Æ')[0];

    expect(proposal).toBeDefined();
    expect(applyRepair(xml, proposal)).toContain('NovAEk');
  });

  it('applies a control-character repair at the correct position in CRLF XML', () => {
    const xml = '<Document>\r\n  <Nm>Nov\u001Ak</Nm>\r\n</Document>';
    const result = validateSepaDocument(xml, 'input.xml', xml.length);
    const proposals = getRepairProposals(xml, result);
    const proposal = proposals.filter((item) => item.before === '\u001A')[0];

    expect(proposal).toBeDefined();
    const repaired = applyRepair(xml, proposal);
    expect(repaired).toBe('<Document>\r\n  <Nm>Novk</Nm>\r\n</Document>');
    expect(validateSepaDocument(repaired, 'input.xml', repaired.length).issues).toHaveLength(0);
  });

  it('proposes removing an extra lowercase character from a BIC', () => {
    const xml = '<Document><BIC>CEKOSKBXz</BIC></Document>';
    const result = validateSepaDocument(xml, 'input.xml', xml.length);
    const proposals = getRepairProposals(xml, result);
    const proposal = proposals.filter((item) => item.id === 'bic-0')[0];

    expect(proposal).toBeDefined();
    expect(proposal.after).toBe('CEKOSKBX');
    expect(validateSepaDocument(applyRepair(xml, proposal), 'input.xml', xml.length).checks.find((check) => check.id === 'bic')?.status).toBe('ok');
  });
});
