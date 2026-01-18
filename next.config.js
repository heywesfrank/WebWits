/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // ALWAYS ENABLED
  importScripts: ['/custom-sw.js'], // LOAD YOUR PUSH LISTENER
});

const nextConfig = {
  images: {
    domains: ['你的supabase-project-id.supabase.co', 'images.unsplash.com', 'media.giphy.com'],
  },
};

module.exports = withPWA(nextConfig);
