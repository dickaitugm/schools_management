/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  webpack: (config, { isServer }) => {
    if (isServer && process.env.NODE_ENV === 'production') {
      // Handle SSL certificate issues in production
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }
    return config;
  }
}

module.exports = nextConfig
