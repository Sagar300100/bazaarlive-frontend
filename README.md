<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xIbcnCmZdfPNMAVYKg8qK_K0-eLaQWn_

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Aadhaar verification API (Setu)

1. Add these to your environment (e.g. `.env.local` or shell):
   - `SETU_CLIENT_ID`, `SETU_CLIENT_SECRET` (sandbox/prod from Setu)
   - Optional: `SETU_BASE_URL` (defaults to Setu sandbox), `CORS_ORIGINS` (comma list), `PORT` (defaults to 3001)
2. Start the API: `npm run api`
3. Endpoints:
   - `POST /api/aadhaar/send-otp` → `{ idNumber, consent }`
   - `POST /api/aadhaar/verify-otp` → `{ idNumber, otp, txnId }`
