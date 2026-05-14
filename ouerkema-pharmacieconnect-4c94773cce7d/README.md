# PharmacieConnect Mobile App

Expo / React Native mobile application for PharmacieConnect.

## Commands

```bash
npm install
npm start
npm run android
npm run ios
npm run web
npm test
npm run lint
```

## Chatbot Integration

The app uses the main backend on port `8000` and the first-aid chatbot service on port `8001`.

For local mobile testing without Cloudflare/ngrok, run the FastAPI backend on all interfaces:

```bash
cd ../backend_pharmacie
venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

If you are using an Android emulator, the app falls back to `http://10.0.2.2:8000`. If you are using a real phone, keep the phone and computer on the same Wi-Fi and set `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000` in `.env.local` only when Expo cannot auto-detect the host.

```bash
cd ../chatbot_PFE
venv/bin/uvicorn api:app --host 0.0.0.0 --port 8001
```

Override the chatbot URL for a device, emulator, or deployment with:

```bash
EXPO_PUBLIC_CHATBOT_API_URL=http://YOUR_HOST_OR_IP:8001 npm start
```

## Main Directories

- `screens/` - app screens
- `components/` - reusable UI
- `components/design-system/` - design primitives
- `config/` - runtime and API configuration
- `utils/` - helpers and data loaders
- `locales/` - translations

## More Documentation

- [../docs/mobile-app.md](../docs/mobile-app.md)
- [../docs/getting-started.md](../docs/getting-started.md)
