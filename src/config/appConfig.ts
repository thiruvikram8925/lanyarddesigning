export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'ID Card Cropping Tool',
  brandName: import.meta.env.VITE_BRAND_NAME || 'GOTEK',
  defaultOrganization: '',
  storageKeys: {
    token: 'gotek_token',
    user: 'gotek_user',
    order: 'gotek_current_order',
    templates: 'gotek_uploaded_templates',
  },
} as const;
