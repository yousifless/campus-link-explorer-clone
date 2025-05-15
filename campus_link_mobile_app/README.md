# Campus Link Mobile App

Mobile version of the Campus Link web application with the same wood-themed design.

## Quick Start Guide

### Prerequisites
- Node.js (version 14+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App (Without Login)

To run the app without requiring an Expo login:

```bash
npm run start:easy
```

This will start Expo in offline mode and handle environment variables for you.

### Setting Supabase Keys

#### Option 1: Environment Variables

For Windows (PowerShell):
```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="your_supabase_url"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

For macOS/Linux:
```bash
export EXPO_PUBLIC_SUPABASE_URL="your_supabase_url"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

#### Option 2: Update app.config.js

You can also directly edit the `app.config.js` file:

```javascript
extra: {
  supabaseUrl: "your_supabase_url",
  supabaseAnonKey: "your_supabase_anon_key",
}
```

## Troubleshooting

### Asset Loading Issues
- If you see asset loading errors, they're expected since we're using placeholder assets.
- The app will still function correctly with default UI elements.

### Supabase Connection Issues
- If you see "Failed to fetch" errors, make sure your Supabase URL and keys are correctly set.
- The app will work in demo mode without valid Supabase credentials.

### Expo Login Prompts
- If you see Expo login prompts, try running with `npm run start:offline` or `npm run start:easy`.
- These commands bypass the need for an Expo account.

## Design Notes

This mobile app uses the same wood-themed design as the web version, featuring:

- Wood-textured UI elements with gradients
- Custom buttons and cards with wood styling
- Matching color palette
- Consistent typography and spacing 