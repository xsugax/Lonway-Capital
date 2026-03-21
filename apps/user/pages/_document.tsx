import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="description" content="Londway Capital — Premium private banking, wealth management, investments, and secure digital banking. Manage your accounts, transfers, cards, vaults, and portfolio." />
        <meta name="keywords" content="Londway Capital, private banking, wealth management, online banking, investments, secure banking, digital banking, vaults, portfolio, transfers" />
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
        <link rel="canonical" href="https://londwaycapital.com" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Londway Capital — Premium Private Banking" />
        <meta property="og:description" content="Secure wealth management, investments, and digital banking. Manage your finances with confidence." />
        <meta property="og:site_name" content="Londway Capital" />
        <meta property="og:url" content="https://londwaycapital.com" />
        <meta property="og:locale" content="en_US" />

        {/* OG Image for social sharing */}
        <meta property="og:image" content="https://londwaycapital.com/og-image.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://londwaycapital.com/og-image.svg" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Londway Capital — Premium Private Banking" />
        <meta name="twitter:description" content="Secure wealth management, investments, and digital banking." />
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
                "url": "https://londwaycapital.com",
                "description": "Premium private banking, wealth management, and secure digital banking.",
                "foundingDate": "2024",
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
                "url": "https://londwaycapital.com",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://londwaycapital.com/?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                "name": "Londway Capital — Premium Private Banking",
                "description": "Secure private banking, wealth management, investments, and digital banking platform. Manage accounts, transfers, cards, vaults, and portfolio.",
                "url": "https://londwaycapital.com",
                "brand": {
                  "@type": "Brand",
                  "name": "Londway Capital"
                },
                "provider": {
                  "@type": "FinancialService",
                  "name": "Londway Capital",
                  "url": "https://londwaycapital.com"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "bestRating": "5",
                  "worstRating": "1",
                  "ratingCount": "250"
                }
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
