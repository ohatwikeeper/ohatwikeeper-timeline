import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})',
        destination: '/?date=:year-:month-:day',
      },
    ];
  },
};

export default nextConfig;
