/**
 * EOS CLUB - Email Collection Web App
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Spreadsheet
 * 2. In the spreadsheet, go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the project (name it "EOS Email Collection")
 * 5. Click Deploy > New deployment
 * 6. Choose "Web app" as deployment type
 * 7. Set "Execute as" to "Me"
 * 8. Set "Who has access" to "Anyone"
 * 9. Click "Deploy" and authorize the script
 * 10. Copy the Web App URL and use it in your index.html
 */

function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // If this is the first entry, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Email', 'User Agent', 'IP Address (if available)']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }

    // Parse the incoming data
    let email = '';

    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      email = data.email || '';
    } else if (e.parameter && e.parameter.email) {
      email = e.parameter.email;
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Invalid email address'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get additional information
    const timestamp = new Date();
    const userAgent = e.parameter.userAgent || 'Unknown';
    const ipAddress = ''; // Note: Google Apps Script cannot access client IP directly

    // Add the data to the spreadsheet
    sheet.appendRow([timestamp, email, userAgent, ipAddress]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Email successfully recorded'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (for testing)
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'EOS CLUB Email Collection API is running',
      message: 'Use POST method to submit emails'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(email) {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Optional: Function to get all collected emails
 * Run this from the script editor to see collected data
 */
function getAllEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  Logger.log('Total entries: ' + (data.length - 1)); // Subtract header row
  Logger.log(data);

  return data;
}

/**
 * Optional: Function to export emails to CSV format
 * Run this from the script editor and check the logs
 */
function exportEmailsAsCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  let csv = '';
  data.forEach(function(row) {
    csv += row.join(',') + '\n';
  });

  Logger.log(csv);
  return csv;
}
