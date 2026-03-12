// Parser utilities utilizing pdf.js and mammoth.js via CDN

class DocumentParser {
    static async parseFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            if (extension === 'pdf') {
                return await this.parsePDF(file);
            } else if (extension === 'docx') {
                return await this.parseDOCX(file);
            } else {
                throw new Error("Unsupported file format");
            }
        } catch (error) {
            console.error("Error parsing document:", error);
            throw error;
        }
    }

    static async parsePDF(file) {
        // PDF.js worker setup
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + "\n";
        }

        return fullText;
    }

    static async parseDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }
}
