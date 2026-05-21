/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.meelza.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:3003/api/auth/:path*' },
    ]
  }
};
  
export default nextConfig;
  
