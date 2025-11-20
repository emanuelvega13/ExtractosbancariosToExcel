export enum ProcessingStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Movement {
  num: string;
  fecha: string;
  descripcion: string;
  suc: string;
  refNumerica: string;
  refAlfanumerica: string;
  autorizacion: string;
  ordenante: string;
  bancoEmisor: string;
  depositos: number;
  retiros: number;
  saldoMxn: number;
}

export interface ProcessedFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  message: string;
  progress: number; // 0 to 100
  movements: Movement[];
  excelBlob?: Blob;
}

export interface ExtractionResult {
  movements: Movement[];
}