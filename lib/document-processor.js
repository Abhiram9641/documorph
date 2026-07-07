// Document Processor - Core AI Logic
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process a document with the specified action
 */
export async function processDocument(filePath, action, options = {}) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  let content = '';
  let fileType = 'unknown';

  if (ext === '.txt' || ext === '.csv' || ext === '.md') {
    content = fs.readFileSync(filePath, 'utf-8');
    fileType = 'text';
  } else if (ext === '.xlsx' || ext === '.xls') {
    content = await processExcel(filePath);
    fileType = 'spreadsheet';
  } else if (ext === '.pdf') {
    content = await processPDF(filePath);
    fileType = 'pdf';
  } else if (ext === '.docx' || ext === '.doc') {
    content = await processWord(filePath);
    fileType = 'document';
  } else if (ext === '.pptx' || ext === '.ppt') {
    content = await processPowerPoint(filePath);
    fileType = 'presentation';
  }

  let result;
  switch (action) {
    case 'summarize': result = await summarize(content, options); break;
    case 'convert': result = await convertFormat(content, options); break;
    case 'extract': result = await extractData(content, options); break;
    case 'analyze': result = await analyzeDocument(content, fileType, options); break;
    default: result = await summarize(content, options);
  }

  return { fileName, fileType, fileSize, action, ...result };
}

/**
 * Process Excel files
 */
async function processExcel(filePath) {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheets = {};
    workbook.SheetNames.forEach(name => {
      sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
    });
    let text = '';
    for (const [name, data] of Object.entries(sheets)) {
      text += '\n=== Sheet: ' + name + ' ===\n';
      data.forEach(row => {
        text += row.filter(c => c !== undefined && c !== null).join(' | ') + '\n';
      });
    }
    return text;
  } catch (e) {
    return '[Excel processing error: ' + e.message + ']';
  }
}

/**
 * Process PDF files
 */
async function processPDF(filePath) {
  try {
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    return data.text || '[No text extracted from PDF]';
  } catch (e) {
    return '[PDF processing error: ' + e.message + ']';
  }
}

/**
 * Process Word documents
 */
async function processWord(filePath) {
  try {
    const mammoth = await import('mammoth');
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '[No text extracted from document]';
  } catch (e) {
    return '[Word processing error: ' + e.message + ']';
  }
}

/**
 * Process PowerPoint files
 */
async function processPowerPoint(filePath) {
  return '[PowerPoint file uploaded]';
}

/**
 * Summarize content
 */
async function summarize(content, options) {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  const sentences = content.match(/[^.!?\n]+[.!?\n]/g) || [content];
  const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 20);

  let summarySentences = [];
  if (cleanSentences.length <= 5) {
    summarySentences = cleanSentences;
  } else {
    summarySentences = [
      ...cleanSentences.slice(0, 2),
      ...cleanSentences.slice(Math.floor(cleanSentences.length / 2), Math.floor(cleanSentences.length / 2) + 1),
      ...cleanSentences.slice(-1)
    ];
  }

  return {
    summary: summarySentences.join(' ') || 'Document too short to summarize.',
    totalWords,
    totalChars: content.length,
    estimatedReadTime: Math.ceil(totalWords / 200),
    keyTopics: extractKeyTopics(content)
  };
}

/**
 * Extract key topics from content
 */
function extractKeyTopics(content) {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our']);

  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.forEach(w => {
    if (!commonWords.has(w)) { freq[w] = (freq[w] || 0) + 1; }
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Convert format placeholder
 */
async function convertFormat(content, options) {
  return { convertedContent: content, note: 'Content prepared for conversion.' };
}

/**
 * Extract data from content
 */
async function extractData(content, options) {
  const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const urls = content.match(/https?:\/\/[^\s,;'"<>()]+/g) || [];
  const numbers = content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];

  return {
    emails: [...new Set(emails)].slice(0, 20),
    urls: [...new Set(urls)].slice(0, 20),
    phoneNumbers: [...new Set(numbers)].slice(0, 20),
    totalExtracted: emails.length + urls.length + numbers.length
  };
}

/**
 * Analyze document
 */
async function analyzeDocument(content, fileType, options) {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const sentences = content.match(/[^.!?\n]+[.!?\n]/g) || [];
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const totalWords = words.length;
  const totalSentences = sentences.length;
  const totalParagraphs = paragraphs.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (totalWords || 1);
  const avgSentenceLength = totalWords / (totalSentences || 1);

  return {
    documentStats: {
      totalWords, totalSentences, totalParagraphs,
      avgWordLength: avgWordLength.toFixed(1),
      avgSentenceLength: avgSentenceLength.toFixed(1),
      fileType
    },
    readability: {
      score: Math.max(0, Math.min(100, 100 - (avgSentenceLength * 0.5 + avgWordLength * 5))),
      level: avgSentenceLength > 25 ? 'Advanced' : avgSentenceLength > 15 ? 'Intermediate' : 'Basic',
      estimatedReadingTimeMinutes: Math.ceil(totalWords / 200)
    }
  };
}
