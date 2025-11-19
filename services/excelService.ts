import * as XLSX from 'xlsx';
import { Movement } from '../types';

export const generateExcel = (movements: Movement[], filename: string): Blob => {
  // 1. Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(movements);

  // 2. Customize Header Names (Optional, but mapping matches strictly)
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["Fecha", "Concepto", "Origen / Referencia", "Depósito", "Retiro", "Saldo"]
  ], { origin: "A1" });

  // 3. Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");

  // 4. Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 5. Create Blob
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};