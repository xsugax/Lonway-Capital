import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Londway Capital — Premium private banking, wealth management, investments, and secure digital banking. Manage your accounts, transfers, cards, vaults, and portfolio." />
        <meta name="keywords" content="Londway Capital, private banking, wealth management, online banking, investments, secure banking, digital banking, vaults, portfolio, transfers" />
        <meta name="author" content="Londway Capital" />
        <meta name="theme-color" content="#060913" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Londway Capital — Premium Private Banking" />
        <meta property="og:description" content="Secure wealth management, investments, and digital banking. Manage your finances with confidence." />
        <meta property="og:site_name" content="Londway Capital" />

        {/* Twitter card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Londway Capital — Premium Private Banking" />
        <meta name="twitter:description" content="Secure wealth management, investments, and digital banking." />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><circle cx='18' cy='18' r='15.5' stroke='%23C4A052' stroke-width='1.3' fill='%23060913'/><path d='M11,27 V15 C11,6.5 25,6.5 25,15 V27' stroke='%23C4A052' stroke-width='2' fill='none'/><line x1='7.5' y1='27' x2='28.5' y2='27' stroke='%23C4A052' stroke-width='1'/></svg>" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        {/* Smartsupp Live Chat — Gold themed */}
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
