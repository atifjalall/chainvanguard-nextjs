/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";
import fs from "fs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove blockchain dependencies for now to get the app running
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Add a webpack alias to ensure server bundles always resolve `mime-db`.
  webpack: (config: any, { dev, isServer }: any) => {
    // Ensure resolve objects exist
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Try to resolve the real mime-db package; if it's not installed, use the local shim
    let mimeDbPath: string;
    try {
      // Prefer the actual package if present
      mimeDbPath = require.resolve("mime-db");
    } catch (e) {
      // Fallback to a simple shim that exports an empty object
      mimeDbPath = path.join(__dirname, "vendor-shims", "mime-db.js");
    }

    // Map common request strings used inside the compiled Next bundles to the resolved path
    const aliasKeys = [
      "mime-db",
      "mime-db/index.js",
      "./vendor-chunks/mime-db.js",
      "./vendor-chunks/mime-db",
    ];
    aliasKeys.forEach((key) => {
      config.resolve.alias[key] = mimeDbPath;
    });

    return config;
  },
};

module.exports = nextConfig;
