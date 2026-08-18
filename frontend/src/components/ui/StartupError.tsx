// Deliberately self-contained with inline styles, no CSS file import and
// no dependency on design tokens -- this is the screen shown when app
// startup itself is broken (missing config), so it must render correctly
// even if something else about the build is in a bad state.
export function StartupError({ missingVars }: { missingVars: string[] }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#0a0b0a',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
          StreamPay can't start: missing configuration
        </h1>
        <p style={{ color: '#9ca39c', lineHeight: 1.6 }}>
          The following required environment variable
          {missingVars.length > 1 ? 's are' : ' is'} not set:
        </p>
        <ul style={{ lineHeight: 1.8 }}>
          {missingVars.map((name) => (
            <li key={name}>
              <code
                style={{
                  background: '#1b1e1b',
                  padding: '0.15em 0.5em',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                }}
              >
                {name}
              </code>
            </li>
          ))}
        </ul>
        <p style={{ color: '#9ca39c', lineHeight: 1.6 }}>
          Set these in a local <code>.env</code> file (see{' '}
          <code>frontend/.env.example</code> for the required values) for
          development, or in your hosting platform's environment variable
          settings (e.g. Vercel Project Settings → Environment Variables)
          for a deployed build. Then reload this page.
        </p>
      </div>
    </div>
  );
}
