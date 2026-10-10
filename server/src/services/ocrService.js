import Tesseract from "tesseract.js";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extract text from an image or PDF using OCR
 * @param {string} fileUrl - URL of the file to process (from S3)
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(fileUrl, fileType) {
  try {
    // Download the file
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout
    });

    const fileBuffer = Buffer.from(response.data);

    // Handle PDF files
    if (fileType === "application/pdf" || fileUrl.toLowerCase().endsWith(".pdf")) {
      try {
        const data = await pdfParse(fileBuffer);
        return data.text;
      } catch (pdfError) {
        console.log("PDF text extraction failed, falling back to OCR:", pdfError.message);
        // If PDF text extraction fails, try OCR on first page
        return await extractTextFromImageBuffer(fileBuffer);
      }
    }

    // Handle image files with Tesseract
    return await extractTextFromImageBuffer(fileBuffer);
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error("Failed to extract text from document");
  }
}

/**
 * Extract text from image buffer using Tesseract
 */
async function extractTextFromImageBuffer(buffer) {
  const result = await Tesseract.recognize(buffer, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  return result.data.text;
}

/**
 * Parse insurance information from extracted text
 * @param {string} text - Raw text from OCR
 * @returns {Object} Parsed insurance data
 */
function parseInsuranceData(text) {
  const data = {
    providerName: null,
    policyNumber: null,
    coverageType: null,
    coverageAmount: null,
    monthlyCost: null,
    startDate: null,
    expiryDate: null,
  };

  if (!text) return data;

  const lines = text.split("\n").map((line) => line.trim());
  const fullText = text.toLowerCase();

  // Extract provider name (common insurance companies)
  const providers = [
    "state farm",
    "allstate",
    "geico",
    "progressive",
    "nationwide",
    "usaa",
    "farmers",
    "liberty mutual",
    "american family",
    "travelers",
    "aaa",
    "esurance",
    "metlife",
    "chubb",
    "safeco",
    "securehome",
    "lemonade",
    "jetty",
    "sure",
    "assurant",
  ];

  for (const provider of providers) {
    const regex = new RegExp(provider, "i");
    if (regex.test(fullText)) {
      data.providerName = provider
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      break;
    }
  }

  // Extract policy number (various formats)
  // Common patterns: ABC-123456, 1234567890, POL123456, etc.
  const policyPatterns = [
    /policy\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9-]{6,20})/i,
    /policy\s*(?:id|identifier)\s*:?\s*([A-Z0-9-]{6,20})/i,
    /certificate\s*(?:number|#|no\.?)?\s*:?\s*([A-Z0-9-]{6,20})/i,
    /\b([A-Z]{2,4}[-]?[0-9]{6,12})\b/,
  ];

  for (const pattern of policyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.policyNumber = match[1].trim();
      break;
    }
  }

  // Extract coverage type
  const coverageTypes = [
    "renters insurance",
    "renter's insurance",
    "tenant insurance",
    "contents insurance",
    "personal property",
    "liability coverage",
    "standard coverage",
    "basic coverage",
    "premium coverage",
  ];

  for (const type of coverageTypes) {
    if (fullText.includes(type.toLowerCase())) {
      data.coverageType = type
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      break;
    }
  }

  if (!data.coverageType) {
    data.coverageType = "Standard Renter's Insurance";
  }

  // Extract coverage amount
  const coverageAmountPatterns = [
    /coverage\s*amount\s*:?\s*\$?\s*([\d,]+)/i,
    /limit\s*:?\s*\$?\s*([\d,]+)/i,
    /personal\s*property\s*:?\s*\$?\s*([\d,]+)/i,
  ];

  for (const pattern of coverageAmountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(amount)) {
        data.coverageAmount = amount;
        break;
      }
    }
  }

  // Extract monthly cost/premium
  const costPatterns = [
    /(?:monthly\s*)?premium\s*:?\s*\$?\s*([\d,.]+)\s*(?:\/|per)?\s*month/i,
    /monthly\s*(?:cost|payment)\s*:?\s*\$?\s*([\d,.]+)/i,
    /\$?\s*([\d,.]+)\s*\/\s*month/i,
  ];

  for (const pattern of costPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cost = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(cost) && cost > 0 && cost < 1000) {
        data.monthlyCost = cost;
        break;
      }
    }
  }

  // Extract dates (start/effective and expiry)
  const datePatterns = [
    /effective\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /start\s*date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /inception\s*date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /expir(?:y|ation)\s*(?:date)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /expires?\s*(?:on)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  let foundStartDate = false;
  let foundExpiryDate = false;

  for (const pattern of datePatterns) {
    const matches = [...text.matchAll(new RegExp(pattern, "gi"))];
    for (const match of matches) {
      if (match[1]) {
        const dateStr = match[1];
        const parsedDate = parseDate(dateStr);
        
        if (parsedDate) {
          // Determine if it's a start or expiry date based on context
          const beforeMatch = text.substring(Math.max(0, match.index - 20), match.index).toLowerCase();
          
          if ((beforeMatch.includes("expir") || beforeMatch.includes("end")) && !foundExpiryDate) {
            data.expiryDate = parsedDate;
            foundExpiryDate = true;
          } else if ((beforeMatch.includes("effective") || beforeMatch.includes("start") || beforeMatch.includes("inception")) && !foundStartDate) {
            data.startDate = parsedDate;
            foundStartDate = true;
          } else if (!foundStartDate) {
            data.startDate = parsedDate;
            foundStartDate = true;
          } else if (!foundExpiryDate) {
            data.expiryDate = parsedDate;
            foundExpiryDate = true;
          }
        }
      }
    }
  }

  return data;
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr) {
  try {
    // Handle various date formats: MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, etc.
    const parts = dateStr.split(/[\/\-]/);
    
    if (parts.length !== 3) return null;

    let month, day, year;

    // Handle 2-digit years
    if (parts[2].length === 2) {
      year = parseInt(parts[2]) + 2000;
    } else {
      year = parseInt(parts[2]);
    }

    // Assume MM/DD/YYYY format (common in US)
    month = parseInt(parts[0]);
    day = parseInt(parts[1]);

    // Validate
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      // Try DD/MM/YYYY format
      month = parseInt(parts[1]);
      day = parseInt(parts[0]);
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    
    // Validate the date is valid
    if (isNaN(date.getTime())) return null;

    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Main function to extract and parse insurance data from document
 * @param {string} fileUrl - URL of the insurance document
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<Object>} Parsed insurance data
 */
export async function extractInsuranceData(fileUrl, fileType) {
  try {
    console.log("Extracting text from insurance document...");
    const text = await extractTextFromFile(fileUrl, fileType);
    
    console.log("Parsing insurance data from extracted text...");
    const data = parseInsuranceData(text);
    
    console.log("Extracted insurance data:", data);
    return {
      success: true,
      data,
      rawText: text.substring(0, 500), // Include first 500 chars for debugging
    };
  } catch (error) {
    console.error("Error in extractInsuranceData:", error);
    return {
      success: false,
      error: error.message,
      data: {
        providerName: null,
        policyNumber: null,
        coverageType: "Standard Renter's Insurance",
        coverageAmount: null,
        monthlyCost: null,
        startDate: null,
        expiryDate: null,
      },
    };
  }
}

