// Configuration for Ankimize application
window.ANKIMIZE_CONFIG = {
  // API endpoint (leave empty for static deployment)
  apiUrl: '',
  
  // Default settings
  defaultSettings: {
    theme: 'light',
    questionCount: 5,
    autoSave: true
  },
  
  // Feature flags
  features: {
    offlineMode: true,
    localStorageOnly: true
  }
};