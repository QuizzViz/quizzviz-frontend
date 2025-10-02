// next.config.cjs
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.quizzviz.com' }],
        destination: 'https://quizzviz.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
