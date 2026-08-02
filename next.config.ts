import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function hostnameFromEnvUrl(value?: string) {
  if (!value) return null;
  try {
    return new URL(value.trim()).hostname;
  } catch {
    return null;
  }
}

const apiHostnames = Array.from(
  new Set(
    [
      hostnameFromEnvUrl(process.env.NEXT_PUBLIC_PAYOH_API_BASE_URL),
      hostnameFromEnvUrl(process.env.PAYOH_API_BASE_URL),
      "localhost",
      "127.0.0.1",
    ].filter(Boolean) as string[]
  )
);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      ...apiHostnames.map((hostname) => ({
        protocol: "http" as const,
        hostname,
        pathname: "/uploads/content/**",
      })),
      ...apiHostnames.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/uploads/content/**",
      })),
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.private.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
