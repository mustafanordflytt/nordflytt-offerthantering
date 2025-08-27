# 📱 HTTPS Camera Testing Guide for Staff App

## 🚀 Quick Start

### Step 1: Start Next.js Development Server
```bash
npm run dev
```
Wait for: `ready - started server on 0.0.0.0:3000`

### Step 2: Start ngrok HTTPS Tunnel
In a new terminal:
```bash
./ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       XX.XXms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 3: Access Staff App via HTTPS
1. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
2. Open it in your mobile browser or desktop Chrome
3. Click "Visit Site" if you see ngrok warning page

### Step 4: Test Camera Functionality

#### Login to Staff App:
1. Navigate to `/staff`
2. Use test credentials or click "Logga in som testanvändare"

#### Test Camera:
1. Go to Dashboard
2. Find a job and click "Ta foto" 
3. You should see either:
   - **On Mobile**: Camera choice modal (Camera / Gallery)
   - **On Desktop with HTTPS**: Direct camera stream
   - **On Desktop without HTTPS**: Fallback to file upload

## 🧪 Test Scenarios

### ✅ Scenario 1: Mobile Device
1. Access via HTTPS ngrok URL on phone
2. Click "Ta foto"
3. Choose "Använd kamera" - should open device camera
4. Take photo and confirm it saves

### ✅ Scenario 2: Desktop with HTTPS
1. Access via HTTPS ngrok URL on desktop Chrome
2. Click "Ta foto"
3. Browser should request camera permission
4. Grant permission and see live camera stream
5. Click green capture button to take photo

### ✅ Scenario 3: File Upload Fallback
1. Click "Ta foto"
2. Choose "Välj från galleri"
3. Select an image file
4. Confirm it uploads and saves

## 🔍 What to Check

### Camera Permissions:
- [ ] Browser asks for camera permission (HTTPS only)
- [ ] Permission can be granted/denied
- [ ] App handles denial gracefully

### Photo Capture:
- [ ] Live preview shows correctly
- [ ] Capture button works
- [ ] Photo confirmation shows thumbnail
- [ ] GPS location captured (if permitted)
- [ ] Timestamp recorded

### Mobile Experience:
- [ ] Touch targets are large enough (44px)
- [ ] Camera choice modal appears
- [ ] Both camera and gallery options work
- [ ] No layout issues on small screens

### Error Handling:
- [ ] Non-HTTPS shows appropriate fallback
- [ ] Camera errors show user-friendly messages
- [ ] File upload works as backup option

## 📊 Expected Results

### With HTTPS (ngrok):
- ✅ Full camera access on all devices
- ✅ Live camera preview
- ✅ Direct photo capture
- ✅ GPS location capture

### Without HTTPS (localhost):
- ⚠️ Camera blocked by browser
- ✅ File upload fallback available
- ✅ Gallery selection works
- ✅ Photos still saved correctly

## 🐛 Troubleshooting

### "Camera not working"
1. Check you're using HTTPS (ngrok URL)
2. Check browser camera permissions
3. Try incognito/private mode
4. Check console for errors

### "Ngrok tunnel expired"
- Free ngrok tunnels expire after 2 hours
- Restart ngrok: `./ngrok http 3000`
- Get new HTTPS URL

### "Permission denied"
1. Check browser settings
2. Clear site permissions
3. Try different browser
4. Check if camera in use by other app

## 📱 Mobile Testing Tips

1. **iPhone Safari**:
   - Settings > Safari > Camera > Allow
   - Clear website data if issues persist

2. **Android Chrome**:
   - Site Settings > Camera > Allow
   - Check app permissions in Android settings

3. **Test on Multiple Devices**:
   - Different OS versions
   - Different screen sizes
   - Different browsers

## 🎯 Success Criteria

A successful test means:
1. ✅ Camera works with HTTPS on all devices
2. ✅ Fallback options available when needed  
3. ✅ Photos save with correct metadata
4. ✅ User experience is smooth and intuitive
5. ✅ Error messages are helpful
6. ✅ Mobile layout is responsive

---

**Note**: Remember to stop ngrok (`Ctrl+C`) when done testing to free up the tunnel.