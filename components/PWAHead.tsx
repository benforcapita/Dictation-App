export function PWAHead() {
  return (
    <>
      <meta name='application-name' content='Voice Notes' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='apple-mobile-web-app-title' content='Voice Notes' />
      <meta name='description' content='Voice recording and transcription app' />
      <meta name='format-detection' content='telephone=no' />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='theme-color' content='#ef4444' />

      <link rel='apple-touch-icon' href='/icons/icon-192x192.png' />
      <link rel='manifest' href='/manifest.json' />
      <link rel='shortcut icon' href='/favicon.ico' />
    </>
  );
}
