/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    ...(isProd && { output: 'standalone' }),
};

export default nextConfig;
