/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:3003/api/auth/:path*' },
    ]
  }
  };
  
  export default nextConfig;
  
