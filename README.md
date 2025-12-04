<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Festive Wonderland: Holiday Holodeck

An interactive 3D Christmas experience featuring hand-tracking controls, multiple themes including a Coca-Cola inspired mode, and particle-based shape morphing.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## Deploy to Vercel

This project is configured for easy deployment on Vercel.

### Option 1: Deploy via GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the Vite configuration
6. Click "Deploy"

The project will be automatically deployed and you'll get a live URL!

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to complete deployment

### Important Notes

- **Camera Access**: This app requires camera permissions for hand tracking. Make sure to allow camera access when prompted.
- **HTTPS Required**: Camera access requires HTTPS, which Vercel provides automatically.
- **Build Configuration**: The project uses Vite and is configured in `vercel.json` for optimal deployment.

## Features

- 🎄 Interactive 3D Christmas tree
- ✋ Hand gesture controls via MediaPipe
- 🎨 Multiple festive themes
- ✨ Particle-based shape morphing
- 🎁 Real-time ornament placement
