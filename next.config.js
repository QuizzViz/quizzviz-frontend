// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.quizzviz.com' }],
        destination: 'https://quizzviz.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'quizzviz.com' }],
        destination: 'https://quizzviz.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
