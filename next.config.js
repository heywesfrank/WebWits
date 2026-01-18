/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: false, // Ensure this is FALSE to generate sw.js
  importScripts: ['/custom-sw.js'],
});

const nextConfig = {
  images: {
    domains: ['你的supabase-project-id.supabase.co', 'images.unsplash.com', 'media.giphy.com'],
  },
};

module.exports = withPWA(nextConfig);
