export enum ProcessingStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Movement {
  fecha: string;
  concepto: string;
  origenReferencia: string;
  deposito: number;
  retiro: number;
  saldo: number;
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