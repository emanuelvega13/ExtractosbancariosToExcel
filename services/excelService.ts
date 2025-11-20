import * as XLSX from 'xlsx';
import { Movement } from '../types';

export const generateExcel = (movements: Movement[], filename: string): Blob => {
  // 1. Create a worksheet
  // We specify the header order explicitly to match the user request
  const headers = [
    "num", "fecha", "descripcion", "suc", 
    "refNumerica", "refAlfanumerica", "autorizacion", 
    "ordenante", "bancoEmisor", "depositos", "retiros", "saldoMxn"
  ];

  const worksheet = XLSX.utils.json_to_sheet(movements, { header: headers });

  // 2. Customize Header Names (Translate keys to Display Names)
  XLSX.utils.sheet_add_aoa(worksheet, [
    [
      "Num", "Fecha", "Descripción", "Suc", 
      "Ref Numérica", "Ref Alfanumérica", "Autorización", 
      "Ordenante", "Banco Emisor", "Depósitos", "Retiros", "Saldo MXN"
    ]
  ], { origin: "A1" });

  // 3. Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");

  // 4. Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 5. Create Blob
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};