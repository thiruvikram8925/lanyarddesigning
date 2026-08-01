import { format, isValid } from 'date-fns';

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

