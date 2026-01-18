/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // Ensure this is false so sw.js is generated!
  // We remove the importScripts for now to reduce complexity. 
  // The standard sw.js is enough to start.
});

const nextConfig = {
  images: {
    domains: ['your-project.supabase.co', 'images.unsplash.com', 'media.giphy.com'],
  },
};

module.exports = withPWA(nextConfig);
