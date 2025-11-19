import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker. 
// We use unpkg to ensure we get the correct ESM worker (.mjs) matching the version.
// We hardcode the version to 5.4.394 to match the import map and avoid runtime mismatches.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`;

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Create an array of page numbers [1, 2, ..., numPages]
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  // Render all pages in parallel
  const pageImages = await Promise.all(
    pageNumbers.map(async (pageNum) => {
      const page = await pdf.getPage(pageNum);
      // Reduced scale from 2.0 to 1.5: faster rendering, smaller payload, sufficient for text
      const viewport = page.getViewport({ scale: 1.5 }); 

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) return null;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert to base64 jpeg
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      // Remove data:image/jpeg;base64, prefix for Gemini
      return base64.split(',')[1];
    })
  );

  // Filter out any failed renders (nulls)
  return pageImages.filter((img): img is string => img !== null);
};