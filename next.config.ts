import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "codethreads.s3.us-east-2.amazonaws.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "d22ircbunvt96b.cloudfront.net",
        port: "",
      },
    ],
  },
}

export default nextConfig;
