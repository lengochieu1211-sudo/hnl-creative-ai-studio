import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { DocumentParser } from '../../documents/parser';

describe('spreadsheet parser', () => {
  it('preserves SKU and price exactly', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['SKU','Price'],['HNL-001','850000']]), 'Products');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const file = new File([bytes], 'products.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const parsed = await DocumentParser.parseSpreadsheet(file);
    expect(parsed.tables?.[0].rows[0][0]).toBe('HNL-001');
    expect(String(parsed.tables?.[0].rows[0][1])).toBe('850000');
  });
});
