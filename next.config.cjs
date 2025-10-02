/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      // Force www to non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.quizzviz.com' }],
        destination: 'https://quizzviz.com/:path*',
        permanent: true,
      },
      // Force http to https (non-www)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'quizzviz.com' }],
        destination: 'https://quizzviz.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
