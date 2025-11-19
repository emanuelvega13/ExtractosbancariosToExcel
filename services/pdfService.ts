import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker. 
// We use unpkg to ensure we get the correct ESM worker (.mjs) matching the version.
// PDF.js v5+ requires the .mjs worker when using ESM imports.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageImages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High scale for better OCR/Vision

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert to base64 jpeg
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    // Remove data:image/jpeg;base64, prefix for Gemini
    const base64Data = base64.split(',')[1];
    pageImages.push(base64Data);
  }

  return pageImages;
};