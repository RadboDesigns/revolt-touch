// config/DjangoConfig.js
export const BACKEND_URL = 'http://radbodesigns.com/revotouch'; // Use your local IP address

export const API_CONFIG = {
  ENDPOINTS: {
    LOGIN: 'api/sign_in/',
    REGISTER: '/api/register/', // Update this to match your Django URL pattern
    PROFILE: '/api/profile/',
    ORDER_SHOW: '/api/order/show/',
    SCHEMESS_UPDATE: '/api/order/submit-update/',
    PREVIEW_IMAGE: '/api/order/preview_image/',
    REVO_SOCIAL: '/api/revo/social/',
    DAIRY: '/api/revo/dairy/',
    FLYER: '/api/revo/flyer/',
    INVITATION: '/api/revo/invitation/',
    LOGO: '/api/revo/logo/',
    PACKING: '/api/revo/packing/',
    SOCIAL: '/api/revo/social/',
  },
  REFRESH_INTERVAL: 3600000, // Refresh every minute (adjust as needed)
};