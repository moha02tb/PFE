# Mobile App

## Stack

- Expo
- React Native
- React Navigation
- i18next

## Commands

```bash
cd ouerkema-pharmacieconnect-4c94773cce7d
npm install
npm start
npm run android
npm run ios
npm run web
npm test
npm run lint
```

## Structure

- `screens/` - app screens
- `components/` - reusable mobile components
- `components/design-system/` - shared design primitives
- `config/api.js` - backend configuration
- `utils/` - data helpers
- `locales/` - translation files

## Purpose

The mobile app provides the public pharmacy experience, including search, nearby pharmacies, maps, medicine data, user flows, and localized interfaces.

## Backend And Chatbot Integration

The app uses the main FastAPI backend on port `8000` and the first-aid chatbot service on port `8001`.

For local mobile testing without a tunnel, run the backend on all network interfaces:

```bash
cd backend_pharmacie
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

If you are using an Android emulator, the app can reach the host machine through `http://10.0.2.2:8000`. If you are using a physical phone, keep the phone and computer on the same Wi-Fi and set `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000` only when Expo cannot auto-detect the host.

Run the chatbot API separately when testing the first-aid assistant:

```bash
cd chatbot_PFE
uvicorn api:app --host 0.0.0.0 --port 8001
```

Override the chatbot URL with:

```bash
EXPO_PUBLIC_CHATBOT_API_URL=http://YOUR_HOST_OR_IP:8001 npm start
```

## Related Docs

- [Getting started](./getting-started.md)
- [Troubleshooting](./troubleshooting.md)
- [Performance and connectivity](../performance/api-timeout-and-connectivity.md)
