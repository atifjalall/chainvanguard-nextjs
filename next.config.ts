/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove blockchain dependencies for now to get the app running
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/ipfs/**',
      }
    ]
  }
}

module.exports = nextConfig