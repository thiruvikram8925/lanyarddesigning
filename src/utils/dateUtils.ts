import { format, isValid, parse } from 'date-fns';

/**
 * If the value is a JavaScript Date object (produced by XLSX cellDates:true),
 * format it as dd/MM/yyyy. Everything else passes through EXACTLY as-is.
 * We never guess data types — each Excel file has different columns and types.
 */
export function formatIfDate(value: unknown, targetFormat: string = 'dd/MM/yyyy'): string {
  if (value === null || value === undefined) return '';

  // Only format actual Date objects that XLSX created from date-formatted cells
  if (value instanceof Date) {
    return isValid(value) ? format(value, targetFormat) : String(value);
  }

  // Everything else: numbers, text, IDs, phone numbers — return exactly as-is
  return String(value);
}

export function parseAndFormatDate(value: string, targetFormat: string): string {
  if (!value) return '';
  // Try to parse standard JS date (works for YYYY-MM-DD, MM/DD/YYYY)
  let d = new Date(value);
  if (isValid(d)) return format(d, targetFormat);

  // Try common localized patterns (especially European DD/MM/YYYY)
  const patterns = ['dd/MM/yyyy', 'dd-MM-yyyy', 'dd.MM.yyyy', 'MM-dd-yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd'];
  for (const p of patterns) {
      d = parse(value, p, new Date());
      if (isValid(d)) return format(d, targetFormat);
  }
  
  // Fallback to original string if no format matched
  return value;
}
