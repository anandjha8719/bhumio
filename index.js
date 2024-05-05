const Tesseract = require("tesseract.js");
const fs = require("fs");
const { parse } = require("json2csv");

// Function to perform OCR on the image and extract text
async function performOCR(imagePath) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(
      imagePath,
      "eng", // English language
      { logger: (m) => console.log(m) } // Log progress
    );
    return text;
  } catch (error) {
    console.error("Error performing OCR:", error);
    return null;
  }
}

// Function to extract selective text and output as key-value pairs
function extractInfo(ocrText) {
  const lines = ocrText.split("\n");
  const info = {
    Name: lines[0],
    "Husband Name/Fathers Name": lines[1],
    "House Number": lines[2],
    Age: lines[3],
    Gender: lines[4],
  };
  return info;
}

// Function to convert extracted information to CSV format
function convertToCSV(info) {
  const fields = Object.keys(info);
  const opts = { fields };
  try {
    const csv = parse(info, opts);
    return csv;
  } catch (error) {
    console.error("Error converting to CSV:", error);
    return null;
  }
}

// Main function to process image and output CSV
async function processImage(imagePath) {
  try {
    const ocrText = await performOCR(imagePath);
    if (ocrText) {
      const info = extractInfo(ocrText);
      const csv = convertToCSV(info);
      if (csv) {
        fs.writeFileSync("output.csv", csv);
        console.log("CSV file generated successfully.");
      }
    } else {
      console.log("No text extracted from the image.");
    }
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

// Run: node index.js <imagePath>
const imagePath = "Sample_Text_Extract_pages-to-jpg-0001.jpg";
if (imagePath) {
  processImage(imagePath);
} else {
  console.log("Please provide the path to the image file.");
}
