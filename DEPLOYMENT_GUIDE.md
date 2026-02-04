# EOS CLUB - Email Collection Setup Guide

## Problem Identified

Your [`index.html`](index.html:773) was attempting to submit directly to Google Forms, but this approach has limitations:
- Google Forms blocks external submissions due to CORS policies
- Missing hidden validation fields required by Google Forms
- No reliable way to confirm if submissions are successful

## Solution: Google Apps Script Web App

We've implemented a Google Apps Script that writes directly to a Google Spreadsheet, bypassing all CORS issues and providing reliable data capture.

---

## Step-by-Step Deployment Instructions

### 1. Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it **"EOS CLUB - Email List"** (or any name you prefer)
4. This spreadsheet will automatically collect all email submissions

### 2. Set Up the Google Apps Script

1. In your spreadsheet, click **Extensions** > **Apps Script**
2. You'll see a code editor with some default code
3. **Delete all the existing code** in the editor
4. Open the [`google-apps-script.js`](google-apps-script.js:1) file from this project
5. **Copy all the code** from that file
6. **Paste it** into the Google Apps Script editor
7. Click the **Save** icon (💾) or press `Ctrl+S` / `Cmd+S`
8. Name your project **"EOS Email Collection"**

### 3. Deploy the Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **"Web app"**
4. Configure the deployment:
   - **Description**: `EOS Email Collection v1`
   - **Execute as**: Select **"Me (your email)"**
   - **Who has access**: Select **"Anyone"**
5. Click **Deploy**
6. You may need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** > **Go to EOS Email Collection (unsafe)**
   - Click **Allow**
7. **IMPORTANT**: Copy the **Web App URL** that appears
   - It will look like: `https://script.google.com/macros/s/ABC123.../exec`
   - ID: AKfycbyG2JAWvplQX6JgHlCD0VybEAYzzTJmoldiV8qYwjf8kJY4La9CKkspgpnMjyX7sMvq
   - https://script.google.com/macros/s/AKfycbyG2JAWvplQX6JgHlCD0VybEAYzzTJmoldiV8qYwjf8kJY4La9CKkspgpnMjyX7sMvq/exec
   - Save this URL - you'll need it in the next step!

### 4. Update Your Website

1. Open [`index.html`](index.html:748)
2. Find line 748 (search for `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE`)
3. Replace this text with your Web App URL from step 3:

```javascript
// BEFORE:
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// AFTER (use your actual URL):
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/ABC123.../exec';
```

4. Save the file
5. Upload or deploy your updated [`index.html`](index.html:1) to your website

### 5. Test the Integration

1. Open your website in a browser
2. Enter a test email address (e.g., `test@example.com`)
3. Click the **"I'm in!"** button
4. You should see the success message
5. **Check your Google Spreadsheet** - you should see a new row with:
   - Timestamp
   - Email address
   - User Agent (browser info)

---

## What the Script Does

The Google Apps Script web app:
- ✅ Receives email submissions from your website
- ✅ Validates email addresses
- ✅ Stores them in your Google Spreadsheet with timestamps
- ✅ Returns success/error responses
- ✅ Works reliably without CORS issues
- ✅ Provides a GET endpoint for testing

### Spreadsheet Columns

Your spreadsheet will automatically have these columns:
1. **Timestamp** - When the email was submitted
2. **Email** - The subscriber's email address
3. **User Agent** - Browser and device information
4. **IP Address** - Currently empty (Google Apps Script limitation)

---

## Testing the Script

### Test via Browser
Visit your Web App URL directly in a browser:
```
https://script.google.com/macros/s/YOUR_ID/exec
```
You should see:
```json
{
  "status": "EOS CLUB Email Collection API is running",
  "message": "Use POST method to submit emails"
}
```

### Test with curl (Command Line)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  "https://script.google.com/macros/s/YOUR_ID/exec"
```

---

## Troubleshooting

### Issue: "Authorization required"
**Solution**: Make sure you completed step 3.6 and authorized the script.

### Issue: Emails not appearing in spreadsheet
**Solutions**:
1. Check that you copied the correct Web App URL
2. Verify the URL is updated in [`index.html`](index.html:748) line 748
3. Make sure you're checking the correct spreadsheet
4. Check the Apps Script execution logs: Apps Script Editor > **Executions**

### Issue: "Script function not found"
**Solution**: Make sure you copied the ENTIRE script from [`google-apps-script.js`](google-apps-script.js:1)

### Issue: Can't see submissions
**Solution**: Open your Google Spreadsheet and check if:
- Headers are present in row 1
- Data appears in subsequent rows
- You may need to refresh the spreadsheet

---

## Viewing Your Email List

### In Google Sheets
Simply open your spreadsheet to see all collected emails with timestamps.

### Export to CSV
1. In your spreadsheet: **File** > **Download** > **Comma Separated Values (.csv)**
2. Or run the `exportEmailsAsCSV()` function in Apps Script and check the logs

### Using Apps Script Functions
In the Apps Script editor, you can run these utility functions:
- **`getAllEmails()`** - View all collected emails in the logs
- **`exportEmailsAsCSV()`** - Export as CSV in the logs

---

## Security Notes

- ✅ Your script runs under your Google account
- ✅ Only you have access to the spreadsheet (unless you share it)
- ✅ The Web App URL is public but only accepts email submissions
- ✅ Email validation is performed server-side
- ✅ Submissions are also stored in browser localStorage as backup

---

## Updating the Script Later

If you need to modify the script:
1. Edit the code in the Apps Script editor
2. Save your changes
3. Click **Deploy** > **Manage deployments**
4. Click the edit icon (✏️) next to your deployment
5. Change **Version** to **"New version"**
6. Click **Deploy**
7. **Your Web App URL stays the same** - no need to update [`index.html`](index.html:1)

---

## Backup Solution

The updated [`index.html`](index.html:1) also stores submissions in the browser's localStorage as a backup. To view these:

1. Open your website in Chrome/Firefox
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Type: `localStorage.getItem('eos_submissions')`
5. Press Enter to see stored submissions

---

## Questions or Issues?

If you encounter any problems:
1. Check the **Executions** tab in Apps Script for error logs
2. Verify your Web App URL is correct in [`index.html`](index.html:748)
3. Test the endpoint directly in your browser
4. Check browser console for JavaScript errors

---

## Summary of Changes Made

### Files Created:
- ✅ [`google-apps-script.js`](google-apps-script.js:1) - The server-side code for Google Apps Script
- ✅ `DEPLOYMENT_GUIDE.md` - This comprehensive setup guide

### Files Modified:
- ✅ [`index.html`](index.html:741) - Updated form submission script (lines 741-837)
  - Changed from Google Forms to Google Apps Script endpoint
  - Added loading state during submission
  - Added localStorage backup
  - Improved error handling

---

Good luck with your EOS CLUB launch! 🎉
