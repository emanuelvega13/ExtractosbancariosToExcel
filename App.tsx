import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { ProcessedFile, ProcessingStatus } from './types';
import { DropZone } from './components/DropZone';
import { ProcessingList } from './components/ProcessingList';
import { convertPdfToImages } from './services/pdfService';
import { extractMovementsFromImages } from './services/geminiService';
import { generateExcel } from './services/excelService';
import { Bot, FileSpreadsheet, FolderInput, Download } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesDropped = useCallback((newFiles: File[]) => {
    const newProcessedFiles: ProcessedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: ProcessingStatus.PENDING,
      message: 'En cola',
      progress: 0,
      movements: [],
    }));

    setFiles((prev) => [...prev, ...newProcessedFiles]);
  }, []);

  const processQueue = async () => {
    setIsProcessing(true);
    
    // Create a working copy of the files to iterate
    // In a real app with concurrency, we might use a queue manager.
    // Here we process sequentially to avoid hitting API rate limits too hard.
    
    const fileIds = files.map(f => f.id);

    for (const id of fileIds) {
      // Get fresh state
      const currentFile = files.find(f => f.id === id);
      if (!currentFile || currentFile.status === ProcessingStatus.COMPLETED) continue;

      // Update status to PROCESSING
      updateFileStatus(id, ProcessingStatus.PROCESSING, 'Analizando PDF...');

      try {
        // 1. PDF -> Images
        const images = await convertPdfToImages(currentFile.file);
        updateFileStatus(id, ProcessingStatus.PROCESSING, `Extrayendo datos con IA (${images.length} páginas)...`);

        // 2. Images -> Gemini Data
        const movements = await extractMovementsFromImages(images);
        
        if (movements.length === 0) {
          throw new Error("No se encontraron movimientos.");
        }

        updateFileStatus(id, ProcessingStatus.PROCESSING, `Generando Excel (${movements.length} filas)...`);

        // 3. Data -> Excel Blob
        const excelFileName = currentFile.file.name.replace(/\.pdf$/i, '.xlsx');
        const excelBlob = generateExcel(movements, excelFileName);

        // 4. Complete
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: ProcessingStatus.COMPLETED,
                  message: `Completado (${movements.length} movs)`,
                  movements,
                  excelBlob,
                }
              : f
          )
        );

      } catch (error: any) {
        console.error(error);
        updateFileStatus(id, ProcessingStatus.ERROR, error.message || 'Error desconocido');
      }
    }

    setIsProcessing(false);
  };

  const updateFileStatus = (id: string, status: ProcessingStatus, message: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, message } : f))
    );
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    let count = 0;

    files.forEach((f) => {
      if (f.status === ProcessingStatus.COMPLETED && f.excelBlob) {
        const name = f.file.name.replace(/\.pdf$/i, '.xlsx');
        zip.file(name, f.excelBlob);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: 'blob' });
    
    // Use native DOM method instead of file-saver to avoid import errors
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Estados_Cuenta_Procesados.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCount = files.filter(f => f.status === ProcessingStatus.COMPLETED).length;
  const pendingCount = files.filter(f => f.status === ProcessingStatus.PENDING).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              BancoExtracto <span className="text-blue-600">AI</span>
            </h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Potenciado por Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Hero / Instructions */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900">Automatización de Estados de Cuenta</h2>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Sube una carpeta con tus PDFs de Scotiabank (u otros). El sistema extraerá automáticamente la tabla "Detalle de tus movimientos" y generará un Excel limpio para cada archivo.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center"><FolderInput className="w-4 h-4 mr-1" /> 1. Sube PDFs</div>
            <div className="h-px w-8 bg-gray-300"></div>
            <div className="flex items-center"><Bot className="w-4 h-4 mr-1" /> 2. IA Procesa</div>
            <div className="h-px w-8 bg-gray-300"></div>
            <div className="flex items-center"><FileSpreadsheet className="w-4 h-4 mr-1" /> 3. Descarga Excel</div>
          </div>
        </div>

        {/* Upload Area */}
        <DropZone onFilesDropped={handleFilesDropped} disabled={isProcessing} />

        {/* Actions */}
        {files.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{files.length}</span> archivos cargados.
              {pendingCount > 0 && <span className="ml-2 text-orange-600">{pendingCount} pendientes.</span>}
            </div>
            
            <div className="flex space-x-3">
              {!isProcessing && pendingCount > 0 && (
                <button
                  onClick={processQueue}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Procesar Todo
                </button>
              )}
              
              {isProcessing && (
                <button disabled className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 cursor-wait">
                  <Bot className="w-4 h-4 mr-2 animate-pulse" />
                  Procesando...
                </button>
              )}

              {completedCount > 0 && (
                <button
                  onClick={downloadAllAsZip}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Todo (ZIP)
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        <ProcessingList files={files} />

      </main>
    </div>
  );
};

export default App;