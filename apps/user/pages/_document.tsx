import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />



        <meta name="description" content="Londway Capital — Premium private banking and wealth management for founders, executives, and families. Secure digital banking, high-yield savings vaults, AI-driven investments, and institutional-grade security. Trusted by 2.4M+ members in 195 countries." />
        <meta name="keywords" content="Londway Capital, Londway, private banking, wealth management, online banking, investments, secure banking, digital banking, savings vaults, portfolio management, premium bank, private bank, capital management, financial services, fintech" />
        <meta name="author" content="Londway Capital" />
        <meta name="theme-color" content="#060913" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Londway Capital" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Londway Capital" />
        <meta name="msapplication-TileColor" content="#060913" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />


        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Londway Capital — Premium Private Banking & Wealth Management" />
        <meta property="og:description" content="The private bank for founders, executives, and families. Secure wealth management, AI-driven investments, high-yield savings vaults, and institutional-grade security. Trusted by 2.4M+ members worldwide." />
        <meta property="og:site_name" content="Londway Capital" />
        <meta property="og:url" content="https://londwaycapital.com" />
        <meta property="og:locale" content="en_US" />

        {/* OG Image for social sharing */}
        <meta property="og:image" content="https://londwaycapital.com/og-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Londway Capital — Premium Private Banking" />
        <meta name="twitter:image" content="https://londwaycapital.com/og-image.png" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Londway Capital — Premium Private Banking & Wealth Management" />
        <meta name="twitter:description" content="The private bank for founders, executives, and families. Secure wealth management and AI-driven investments." />
        <meta name="twitter:site" content="@LondwayCapital" />

        {/* Favicon & Logo */}
        <link rel="icon" type="image/svg+xml" href="/images/londway-capital-logo.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.svg" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        {/* Structured Data — Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Londway Capital",
                "alternateName": "Londway",
                "url": "https://londwaycapital.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://londwaycapital.com/images/londway-capital-logo.svg",
                  "width": 512,
                  "height": 512,
                  "caption": "Londway Capital logo"
                },
                "image": [
                  "https://londwaycapital.com/images/londway-capital-logo-full.svg",
                  "https://londwaycapital.com/images/londway-capital-headquarters.svg",
                  "https://londwaycapital.com/images/londway-capital-private-banking-office.svg",
                  "https://londwaycapital.com/og-image.png"
                ],
                "description": "Londway Capital is a premium private banking and wealth management platform for founders, executives, and families. Institutional-grade security, AI-driven investments, and high-yield savings vaults.",
                "foundingDate": "2020",
                "slogan": "Wealth that works as hard as you do",
                "areaServed": "Worldwide",
                "numberOfEmployees": {
                  "@type": "QuantitativeValue",
                  "minValue": 500,
                  "maxValue": 1000
                },
                "knowsLanguage": ["en", "fr", "es", "de", "pt", "zh", "ja", "ar"],
                "sameAs": [
                  "https://www.linkedin.com/company/londwaycapital",
                  "https://twitter.com/LondwayCapital",
                  "https://www.facebook.com/LondwayCapital",
                  "https://www.instagram.com/londwaycapital"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "email": "support@londwaycapital.com",
                  "contactType": "customer service",
                  "availableLanguage": ["English", "French", "Spanish", "German", "Portuguese", "Chinese", "Japanese", "Arabic"]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Londway Capital",
                "alternateName": "Londway Capital — Premium Private Banking",
                "url": "https://londwaycapital.com",
                "description": "Londway Capital private banking platform — manage accounts, transfers, investments, savings vaults, and wealth.",
                "publisher": {
                  "@type": "Organization",
                  "name": "Londway Capital",
                  "url": "https://londwaycapital.com"
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://londwaycapital.com/?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialService",
                "name": "Londway Capital",
                "description": "Premium private banking, wealth management, AI-driven investments, high-yield savings vaults, and secure digital banking. Trusted by 2.4 million members across 195 countries.",
                "url": "https://londwaycapital.com",
                "logo": "https://londwaycapital.com/images/londway-capital-logo.svg",
                "image": "https://londwaycapital.com/images/londway-capital-headquarters.svg",
                "priceRange": "$$$",
                "currenciesAccepted": "USD, EUR, GBP, CHF",
                "areaServed": {
                  "@type": "Place",
                  "name": "Worldwide"
                },
                "brand": {
                  "@type": "Brand",
                  "name": "Londway Capital",
                  "slogan": "Wealth that works as hard as you do"
                },
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Banking Products",
                  "itemListElement": [
                    { "@type": "Offer", "itemOffered": { "@type": "FinancialProduct", "name": "Private Banking Accounts" } },
                    { "@type": "Offer", "itemOffered": { "@type": "FinancialProduct", "name": "High-Yield Savings Vaults" } },
                    { "@type": "Offer", "itemOffered": { "@type": "FinancialProduct", "name": "AI-Driven Investment Portfolio" } },
                    { "@type": "Offer", "itemOffered": { "@type": "FinancialProduct", "name": "Premium Debit & Credit Cards" } }
                  ]
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "bestRating": "5",
                  "worstRating": "1",
                  "ratingCount": "2847",
                  "reviewCount": "1264"
                },
                "review": [
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "James Wellington" },
                    "datePublished": "2025-01-15",
                    "reviewBody": "Londway Capital has completely transformed how I manage my wealth. The AI-driven investment tools are exceptional, and my portfolio has outperformed the S&P 500 by 12% this year. The dedicated relationship manager understands my goals perfectly.",
                    "name": "Exceptional wealth management platform",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Alexandra Chen-Morrison" },
                    "datePublished": "2025-02-08",
                    "reviewBody": "As a tech founder, I need banking that moves at the speed of business. Londway Capital delivers — instant global transfers, multi-currency accounts, and the Black World Elite card has been invaluable for international travel. Five stars across the board.",
                    "name": "Perfect for founders and executives",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Richard Blackstone III" },
                    "datePublished": "2024-11-22",
                    "reviewBody": "I've banked with major institutions for decades, but Londway Capital offers a level of sophistication and technology that traditional banks simply cannot match. The high-yield vaults offer genuinely competitive rates, and the security infrastructure gives me complete peace of mind.",
                    "name": "Superior to traditional private banks",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Sarah Mitchell-Okonkwo" },
                    "datePublished": "2025-03-02",
                    "reviewBody": "The mobile banking experience is absolutely world-class. Every detail has been carefully considered — from the intuitive dashboard to the real-time investment analytics. Customer support responded within minutes when I had a question about cross-border transfers.",
                    "name": "World-class mobile banking experience",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Marcus Thornton" },
                    "datePublished": "2024-12-10",
                    "reviewBody": "Londway Capital's Gold Elite account has been a game-changer for our family office. The portfolio analytics are institutional-grade, the concierge service is responsive, and the 4.8% APY on savings vaults is unmatched. Highly recommended for high-net-worth individuals.",
                    "name": "Outstanding for family wealth management",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Elena Vasquez" },
                    "datePublished": "2025-01-28",
                    "reviewBody": "The security features at Londway Capital set the standard for digital banking. Biometric authentication, real-time fraud monitoring, and AES-256 encryption — I feel entirely confident entrusting my assets to this platform. The global transfer speed is also remarkable.",
                    "name": "Unmatched security and trust",
                    "reviewRating": { "@type": "Rating", "ratingValue": "4", "bestRating": "5" }
                  }
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Londway Capital — Premium Private Banking & Wealth Management",
                "description": "Londway Capital is the private bank for founders, executives, and families who demand more.",
                "url": "https://londwaycapital.com",
                "isPartOf": { "@type": "WebSite", "name": "Londway Capital", "url": "https://londwaycapital.com" },
                "about": { "@type": "FinancialService", "name": "Londway Capital" },
                "mainEntity": { "@type": "FinancialService", "name": "Londway Capital" }
              }
            ])
          }}
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID||'G-XXXXXXXXXX'}');`
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
