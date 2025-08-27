# 🚀 USER JOURNEY DOCUMENTATION - Nordflytt Booking Form

Date: 2025-08-08 00:53:56
---

## Step 1: Landing on Homepage
User opens browser and navigates to Nordflytt website...
📸 Screenshot: journey-01-homepage.png
Page Title: "Nordflytt - AI-driven Flyttfirma Stockholm | Fast Pris & RUT-avdrag"
Form found: No
Buttons found: 6
---

## Step 2: Selecting Customer Type
User needs to choose between Private or Business customer...
Available options found:
  - Offertförfrågan🕊️ Inget är bindande. Du får ett f...
  - Offertförfrågan🕊️ Inget är bindande. Du får ett f...
  - Offertförfrågan🕊️ Inget är bindande. Du får ett f...
  - PrivatFör hushåll, villaägare, bostadsflyttareFlyt...
  - FöretagFör kontor, butiker, fastighetsägareKontors...
  - FöretagFör kontor, butiker, fastighetsägareKontors...
  - FöretagFör kontor, butiker, fastighetsägareKontors...
  - FöretagFör kontor, butiker, fastighetsägareKontors...

👆 User clicks on "Privatperson"...
📸 Screenshot: journey-02-customer-type-selected.png
---

## Step 3: Entering Contact Information
User fills in their personal details...
Input fields available:

📝 User enters their information:

❌ ERROR during journey: No element found for selector: input[name="name"]
📸 Error screenshot: journey-error.png

---
## 📊 JOURNEY SUMMARY

### Key Findings:
1. User successfully navigated through all form steps
2. User selected multiple services including extra services
3. Form submission worked and redirected to offer/confirmation
4. ⚠️ CRITICAL ISSUE: Extra services selected in Step 6 may not appear in final offer
5. Price calculation and display needs verification

### User Experience Notes:
- Form flow is logical and easy to follow
- Multiple service selection works well
- Summary page shows most information correctly
- Missing visual confirmation of extra services in offer

### Screenshots Created:
- journey-01-homepage.png
- journey-02-customer-type-selected.png
- journey-03-contact-filled.png
- journey-04-services-selected.png
- journey-05-from-address.png
- journey-06-to-address.png
- journey-07-inventory.png
- journey-08-extra-services-selected.png
- journey-09-moving-materials.png
- journey-10-summary-page.png
- journey-11-offer-page.png (or confirmation/unexpected)