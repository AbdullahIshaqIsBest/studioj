
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow Data URIs for next/image
    dangerouslyAllowSVG: true, // if you use SVGs as Data URIs
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['placehold.co'], // Keep existing domains if any
    // For Data URIs, you might not need a specific hostname pattern here
    // but ensuring the overall config supports them is key.
    // The `loader` and `path` might need adjustment if using a custom loader for Data URIs,
    // but the default loader should handle them if they are valid base64.
    // An alternative to remotePatterns for data URIs is to ensure no loader conflicts.
    // For Next.js 13+ App Router, direct src with data URI should work.
    // If issues persist, a custom loader or explicitly allowing `data:` protocol in remotePatterns might be needed.
    // However, `next/image` primarily uses `remotePatterns` for external URLs.
    // For Data URIs, the check is more about the validity of the URI itself.
    // Let's add a pattern that might help Next.js recognize data URIs, though it's not standard.
    // Actual way to support data URIs is usually by them just working or by configuring a custom loader.
    // For now, ensuring no restrictive patterns block them is the goal.
    // Next.js 14 automatically supports data URIs.
    // If an older version, one might need to specify 'data' in protocols.
    // As of Next.js 12.3.0+, data image URLs are supported by default with the default loader.
    // No specific remotePattern needed for data URIs.
  },
};

export default nextConfig;
