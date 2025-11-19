import React from 'react';
import { ProcessedFile, ProcessingStatus } from '../types';
import { FileText, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface ProcessingListProps {
  files: ProcessedFile[];
}

export const ProcessingList: React.FC<ProcessingListProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Archivos ({files.length})
        </h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {files.map((file) => (
          <li key={file.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center min-w-0 flex-1 mr-4">
              <div className="flex-shrink-0 text-gray-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {(file.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${file.status === ProcessingStatus.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                    ${file.status === ProcessingStatus.PROCESSING ? 'bg-blue-100 text-blue-800' : ''}
                    ${file.status === ProcessingStatus.ERROR ? 'bg-red-100 text-red-800' : ''}
                    ${file.status === ProcessingStatus.PENDING ? 'bg-gray-100 text-gray-800' : ''}
                  `}
                >
                  {file.status === ProcessingStatus.PROCESSING && (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  {file.status === ProcessingStatus.COMPLETED && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  {file.status === ProcessingStatus.ERROR && (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {file.message || file.status}
                </span>
              </div>

              {file.status === ProcessingStatus.COMPLETED && file.excelBlob && (
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(file.excelBlob!);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.file.name.replace('.pdf', '.xlsx');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  title="Descargar Excel"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};