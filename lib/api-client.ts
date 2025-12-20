export function getBaseURL() {
  // Server-side only
  if (typeof window === "undefined") {
    // Production/Preview on Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Local development
    return "http://localhost:3000";
  }

  // Client-side: use relative URLs
  return "";
}
