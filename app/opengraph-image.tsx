import { ImageResponse } from 'next/og';

export const alt = 'Alan Betty — Browser Engineer & Frontend Developer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Share card. Rendered at build time by Satori, so it uses only what Satori
 * supports: flexbox, solid fills and gradients — no background-clip: text.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #0d0b12 0%, #060508 55%, #121026 100%)',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* corner brackets */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 44,
            width: 22,
            height: 22,
            borderTop: '2px solid rgba(242,238,230,0.24)',
            borderLeft: '2px solid rgba(242,238,230,0.24)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 44,
            width: 22,
            height: 22,
            borderBottom: '2px solid rgba(242,238,230,0.24)',
            borderRight: '2px solid rgba(242,238,230,0.24)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#d8fb4f',
              fontSize: 20,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 9, background: '#d8fb4f' }} />
            Available for projects
          </div>
          <div style={{ color: '#67625b', fontSize: 20, letterSpacing: 3 }}>KERALA, INDIA</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 132,
              color: '#f2eee6',
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            ALAN&nbsp;<span style={{ color: '#d8fb4f' }}>BETTY</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 34,
              color: '#c5bfb3',
              letterSpacing: -0.5,
            }}
          >
            Frontend developer · UI/UX designer · Browser engineer
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Pyraxis Browser', '4 platforms', '30+ repos'].map((t) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  padding: '10px 22px',
                  borderRadius: 999,
                  border: '1px solid rgba(242,238,230,0.14)',
                  color: '#8f8a80',
                  fontSize: 22,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              padding: '14px 30px',
              borderRadius: 999,
              background: '#d8fb4f',
              color: '#060508',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            alan-betty.vercel.app
          </div>
        </div>
      </div>
    ),
    size,
  );
}
