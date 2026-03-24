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

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><circle cx='18' cy='18' r='15.5' stroke='%23C4A052' stroke-width='1.3' fill='%23060913'/><path d='M11,27 V15 C11,6.5 25,6.5 25,15 V27' stroke='%23C4A052' stroke-width='2' fill='none'/><line x1='7.5' y1='27' x2='28.5' y2='27' stroke='%23C4A052' stroke-width='1'/></svg>" />

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
                "logo": "https://londwaycapital.com/icons/icon-512.svg",
                "description": "Londway Capital is a premium private banking and wealth management platform for founders, executives, and families. Institutional-grade security, AI-driven investments, and high-yield savings vaults.",
                "foundingDate": "2020",
                "slogan": "Wealth that works as hard as you do",
                "areaServed": "Worldwide",
                "knowsLanguage": ["en", "fr", "es", "de", "pt", "zh", "ja", "ar"],
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
                "logo": "https://londwaycapital.com/icons/icon-512.svg",
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
                  "ratingCount": "2400"
                }
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

        {/* Smartsupp Live Chat — Gold themed */}
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID||'G-XXXXXXXXXX'}');`
          }}
        />

        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var _smartsupp = _smartsupp || {};
              _smartsupp.key = '0f05a7950227b39655dc10ec78004dd2f661d277';
              _smartsupp.color = '#C4A052';
              _smartsupp.widgetColor = '#C4A052';
              window.smartsupp||(function(d) {
                var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
                s=d.getElementsByTagName('script')[0];c=d.createElement('script');
                c.type='text/javascript';c.charset='utf-8';c.async=true;
                c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
              })(document);
              smartsupp('theme:colors', {
                widget: '#C4A052',
                primary: '#C4A052'
              });
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        <noscript>
          <a href="https://www.smartsupp.com" rel="nofollow" target="_blank">Chat with us</a>
        </noscript>
      </body>
    </Html>
  );
}
