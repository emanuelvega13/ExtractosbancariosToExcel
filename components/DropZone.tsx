import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      const files = Array.from<File>(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf'
      );
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [onFilesDropped, disabled]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from<File>(e.target.files).filter(
        (file) => file.type === 'application/pdf'
      );
      onFilesDropped(files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
      }`}
    >
      <input
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        id="file-input"
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <UploadCloud className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-700">
          Arrastra tus estados de cuenta (PDF) aquí
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          o haz clic para seleccionar archivos desde tu carpeta
        </p>
      </label>
    </div>
  );
};