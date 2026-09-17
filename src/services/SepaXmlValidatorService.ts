import { validateSepaDocument } from '../../sepa-xml-validator/src/webparts/sepaXmlValidator/services/ValidationService';
import { SepaValidationResult } from '../models/ValidationModels';

/**
 * Backward-compatible Node entry point.
 * The validation implementation is shared with SPFx and the local harness.
 */
export function validateSepaXml(xmlText: string, fileName: string, fileSize: number): SepaValidationResult {
  return validateSepaDocument(xmlText, fileName, fileSize);
}
