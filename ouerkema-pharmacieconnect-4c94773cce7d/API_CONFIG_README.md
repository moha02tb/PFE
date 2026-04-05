# Mobile App Fix - API Configuration

## Problem
The mobile app was trying to connect to `http://localhost:8000` which doesn't work for React Native/Expo. It needs your development machine's IP address instead.

## Solution Applied
1. Created a centralized API configuration file: `config/api.js`
2. Set the API URL to use your development machine IP: `192.168.1.6`

## How to Rebuild and Test

### Step 1: Clear Cache and Rebuild
```bash
cd /home/mohamed/PFE/ouerkema-pharmacieconnect-4c94773cce7d

# Option A: Clear cache and restart (recommended)
npm start -- --clear

# OR Option B: Kill the process and clear manually
# Press Ctrl+C to stop expo
rm -rf node_modules/.cache
npm start
```

### Step 2: Watch the Logs
You should see these logs appear:
```
[API Config] Configured for 192.168.1.6:8000
[API Config] Base URL: http://192.168.1.6:8000
[Pharmacy Loader] Initialized with API URL: http://192.168.1.6:8000
[Pharmacy] Attempting to load from API...
[API] Fetching pharmacies from: http://192.168.1.6:8000/api/pharmacies
[API] Successfully fetched 545 pharmacies
[Pharmacy] ✓ Loaded 545 pharmacies from API
```

### Step 3: Verify Backend is Running
Make sure your backend is still running:
```bash
# In another terminal
cd /home/mohamed/PFE/backend_pharmacie
source venv/bin/activate
uvicorn main:app --reload
```

### Step 4: Test the Connection
If you're using a physical device or emulator, you can verify the backend is reachable:
- Open a browser on the phone/emulator and visit: `http://192.168.1.6:8000/health`
- You should see: `{"status":"ok","version":"2.0.0"}`

## If Your IP Address Changes

If your development machine's IP changes (e.g., after reboot), update it in:
- File: `config/api.js`
- Find this line: `const DEVELOPMENT_IP = '192.168.1.6';`
- Update `192.168.1.6` to your new IP address
- Clear cache and restart the app

To find your new IP, run:
```bash
hostname -I
```

## Configuration File Location
- Web admin: Uses `localhost:5173` (web browsers handle localhost)
- Mobile app: Uses `192.168.1.6:8000` (configured in `config/api.js`)

All API endpoints are now centralized in `config/api.js` for easy management.
