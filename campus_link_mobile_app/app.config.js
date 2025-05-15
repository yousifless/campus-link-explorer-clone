module.exports = {
  name: "Campus Link",
  slug: "campus-link-mobile",
  version: "1.0.0",
  orientation: "portrait",
  // icon: null,
  userInterfaceStyle: "light",
  splash: {
    // image: null,
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.campuslink.mobile"
  },
  android: {
    adaptiveIcon: {
      // foregroundImage: null,
      backgroundColor: "#ffffff"
    },
    package: "com.campuslink.mobile"
  },
  web: {
    // favicon: null
  },
  plugins: [
    "expo-notifications"
  ],
  extra: {
    supabaseUrl: "https://gdkvqvodqbzunzwfvcgh.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs",
    eas: {
      projectId: "your-project-id"
    }
  },
  owner: null, // Set to null to avoid Expo login requirement
  primaryColor: "#6366f1",
  updates: {
    enabled: false // Disable OTA updates to avoid login requirement
  },
  experiments: {
    typedRoutes: true
  },
  developmentClient: {
    silentLaunch: true // Avoid prompts during development
  }
}; 