import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get details from URL
    const content = searchParams.get('content')?.slice(0, 100) || '...';
    const username = searchParams.get('username') || 'Anon';
    const rank = searchParams.get('rank');
    const memeUrl = searchParams.get('memeUrl');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #facc15, #eab308)', // yellow-400 to yellow-500
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              width: '100%',
              height: '100%',
            }}
          >
            {/* Meme Image Area */}
            <div style={{ display: 'flex', height: '50%', width: '100%', position: 'relative', background: '#f3f4f6' }}>
              {memeUrl && (
                 /* eslint-disable-next-line @next/next/no-img-element */
                <img src={memeUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
               <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: 14, fontWeight: 'bold' }}>
                  itswebwits.com
               </div>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '40px', justifyContent: 'space-between', height: '50%' }}>
              
              {/* Rank Badge */}
              {rank && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef9c3', color: '#a16207', padding: '8px 16px', borderRadius: '8px', alignSelf: 'flex-start', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>
                   🏆 Rank #{rank}
                </div>
              )}

              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#111827', lineHeight: 1.1 }}>
                "{content}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', borderTop: '2px solid #f3f4f6', paddingTop: '20px' }}>
                <div style={{ fontSize: 24, color: '#6b7280' }}>
                  by <span style={{ color: '#000', fontWeight: 'bold' }}>@{username}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: '900', color: '#eab308' }}>
                  WEBWITS
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
