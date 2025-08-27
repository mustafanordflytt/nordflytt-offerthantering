# Google Autocomplete Test Guide

## Manual Test Steps:

1. **Navigate to the form:**
   - Go to `http://localhost:3002/form`
   - Or go to `http://localhost:3002/` and follow the steps

2. **Get to Step 4 (Address Input):**
   - Step 1: Click any customer type (e.g., "Privatperson")
   - Step 2: Click any service type (e.g., "Flyttstädning") then click "Nästa"
   - Step 3: Click "Nästa" (skip additional services)
   - You should now be at Step 4 with address inputs

3. **Test the Autocomplete:**
   - Look for the address input field labeled "Från adress"
   - Check the icon next to the input:
     - 🔄 Spinning = Google Maps is loading
     - ✅ Green checkmark = Google Maps is ready
     - 📍 Gray icon = Google Maps failed to load
   
4. **Type an Address:**
   - Click in the "Från adress" field
   - Start typing: "Kungsgatan"
   - Wait 1-2 seconds
   - You should see a dropdown with Swedish address suggestions

## What to Check:

- **Console Logs (F12):**
  - Look for "✅ Google Maps API is ready"
  - Check for any red error messages

- **If Autocomplete Works:**
  - You'll see a white dropdown below the input
  - Addresses will be from Sweden only
  - Click an address to select it

- **If Autocomplete Doesn't Work:**
  - Check if you see "Google Maps är inte tillgängligt" message
  - You can still type addresses manually
  - Check console for specific error messages

## Common Issues:

1. **API Key Issues:**
   - Check console for "This API project is not authorized"
   - Ensure Places API is enabled in Google Cloud Console

2. **No Dropdown Appears:**
   - Check if the green checkmark icon is showing
   - Try refreshing the page
   - Check browser console for errors

3. **Wrong Port:**
   - Make sure you're on port 3002 (not 3000 or 3001)