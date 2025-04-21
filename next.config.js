/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ['he', 'en'],     // support Hebrew and English
        defaultLocale: 'he',       // Hebrew as the default
        localeDetection: true,     // optional: auto‑detect browser locale
      },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com"
            },
            {
                protocol: "https",
                hostname: "platform-lookaside.fbsbx.com"
            },
            {
                protocol: "https",
                hostname: "eivaqgimkbuzxxqxnzcc.supabase.co"
            }


            
        ]
    }
    
};

module.exports = nextConfig
