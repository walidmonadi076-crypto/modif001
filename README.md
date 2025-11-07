<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZzJIJpbFCEmYIVpVJRbvnQ95nK7PZBWa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file by copying the example: `cp .env.local.example .env.local`
3. Set the required environment variables in `.env.local`:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `ADMIN_PASSWORD`: The password for the admin panel.
   - `RECAPTCHA_SECRET_KEY`: Your Google reCAPTCHA secret key.
   - `GEMINI_API_KEY`: Your Gemini API key.
4. Run the app:
   `npm run dev`