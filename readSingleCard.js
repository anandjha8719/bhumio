const Tesseract = require("tesseract.js");
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
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

// Function to extract SrNo. and regNo. from the first row of OCR text
function extractSrNoAndRegNo(ocrText) {
  // Regular expressions to match SrNo. and regNo. patterns
  const srNoRegex = /\b\d+\b/i; // Match any number sequence
  const regNoRegex = /[a-zA-Z0-9]+/i; // Match any alphanumeric sequence

  // Match SrNo. and regNo. patterns in the OCR text
  const srNoMatch = ocrText.match(srNoRegex);
  const regNoMatch = ocrText.match(regNoRegex);

  // Extract SrNo. and regNo. numbers from the matches
  const srNo = srNoMatch ? srNoMatch[0] : "N/A";
  const regNo = regNoMatch ? regNoMatch[0] : "N/A";

  return { srNo, regNo };
}

// Function to read and log SrNo. and regNo. from the card
async function readAndLogNumbers(imagePath) {
  try {
    const ocrText = await performOCR(imagePath);
    if (ocrText) {
      const { srNo, regNo } = extractSrNoAndRegNo(ocrText);
      console.log("SrNo.:", srNo);
      console.log("regNo.:", regNo);

      // Split the rest of the OCR text into key-value pairs
      const restOfTextLines = ocrText.split("\n").slice(1); // Exclude the first row
      const keyValuePairs = restOfTextLines.map((line) => {
        const [key, ...valueParts] = line.split(":"); // Split each line into key and value parts
        const value = valueParts.join(":").trim(); // Join the value parts and trim whitespace
        return { [key.trim()]: value }; // Format as key-value pair
      });

      console.log("Rest of the text:");
      console.log(keyValuePairs);

      const jsonData = {};

      keyValuePairs.forEach((item) => {
        const key = Object.keys(item)[0];
        const value = item[key];

        if (key && key.trim() !== "" && value && value.trim() !== "") {
          let formattedKey = key.replace(/\d+/g, ""); // Remove digits
          formattedKey = formattedKey.trim().replace(/\s+/g, " "); // Remove extra whitespaces
          const formattedValue = value.replace("Photo", "").trim(); // Remove "Photo" keyword and trim

          if (formattedKey.toLowerCase().includes("age")) {
            const ageGender = formattedValue.split(" ");
            console.log("agegen:", ageGender);
            jsonData["Age"] = ageGender[0];
            jsonData["Gender"] = ageGender[1];
          } else if (formattedKey.toLowerCase().includes("gender")) {
            // In case 'Gender' is already specified separately
            jsonData["Gender"] = formattedValue;
          } else {
            jsonData[formattedKey] = formattedValue;
          }
        }
      });

      const data = {
        SrNo: srNo,
        regNo: regNo,
        ...jsonData,
      };

      console.log("final:", data);

      const csvFilePath = "output.csv";
      const header = [
        { id: "SrNo", title: "SrNo" },
        { id: "regNo", title: "regNo" },
        { id: "Name", title: "Name" },
        { id: "HusbandsName_FathersName", title: "Husbands Name/Fathers Name" },
        { id: "HouseNumber", title: "House Number" },
        { id: "Age", title: "Age" },
        { id: "Gender", title: "Gender" },
      ];

      // Check if the CSV file exists
      const fileExists = fs.existsSync(csvFilePath);

      // Create or append to the CSV file
      const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: fileExists ? false : header, // If file exists, don't write header again
      });

      if (!fileExists) {
        csvWriter
          .writeRecords([data]) // Write header and first row
          .then(() => console.log("CSV file created successfully"))
          .catch((err) => console.error("Error writing CSV:", err));
      } else {
        // Check if 'Husbands Name' or 'Fathers Name' exists in data and create the combined column
        const husbandsNameOrFathersName = data["Husbands Name"]
          ? data["Husbands Name"]
          : data["Fathers Name"];
        data["HusbandsName_FathersName"] = husbandsNameOrFathersName;

        csvWriter
          .writeRecords([data]) // Append new row
          .then(() => console.log("New row appended to CSV"))
          .catch((err) => console.error("Error appending row to CSV:", err));
      }
    } else {
      console.log("No text extracted from the image.");
    }
  } catch (error) {
    console.error("Error reading and logging numbers:", error);
  }
}

//node script.js <imagePath>
const imagePath = "WhatsApp Image 2024-05-06 at 11.37.37 AM.jpeg";
if (imagePath) {
  readAndLogNumbers(imagePath);
} else {
  console.log("Please provide the path to the image file.");
}
