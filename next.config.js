/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true, // This is crucial to skip the "Waiting" phase
  disable: false,    // MUST BE FALSE FOR PRODUCTION
  importScripts: ['/custom-sw.js'], // Load your logic
});

const nextConfig = {
  images: {
    domains: ['你的supabase-project-id.supabase.co', 'images.unsplash.com', 'media.giphy.com'],
  },
};

module.exports = withPWA(nextConfig);
