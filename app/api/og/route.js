import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const content = searchParams.get('content')?.slice(0, 100) || '...';
    const username = searchParams.get('username') || 'Anon';
    const rank = searchParams.get('rank');
    let memeUrl = searchParams.get('memeUrl');

    // [!code ++] FIX: Optimize Giphy URL
    // The original WebP is often too big (5MB+) or animated, causing the generator to crash.
    // We replace 'giphy.webp' with '480w_still.jpg' for a lighter, static preview.
    if (memeUrl && memeUrl.includes('giphy.com')) {
      memeUrl = memeUrl.replace(/\/giphy\.webp/, '/480w_still.jpg');
    }

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
            background: 'linear-gradient(to bottom right, #facc15, #eab308)', // Yellow background
            padding: '20px',
            fontFamily: 'sans-serif',
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
            {/* Top Half: Meme Image */}
            <div style={{ display: 'flex', height: '55%', width: '100%', position: 'relative', background: '#f3f4f6', overflow: 'hidden' }}>
              {memeUrl && (
                 /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={memeUrl} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              )}
               <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 16px', borderRadius: '30px', fontSize: 20, fontWeight: 'bold' }}>
                  itswebwits.com
               </div>
            </div>

            {/* Bottom Half: Content */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '40px', justifyContent: 'space-between', height: '45%' }}>
              
              {rank && (
                <div style={{ display: 'flex', alignItems: 'center', background: '#fef9c3', color: '#a16207', padding: '8px 20px', borderRadius: '12px', alignSelf: 'flex-start', fontSize: 24, fontWeight: 'bold', marginBottom: '10px' }}>
                   🏆 RANK #{rank}
                </div>
              )}

              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#111827', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                "{content}"
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: 'auto' }}>
                <div style={{ fontSize: 28, color: '#6b7280' }}>
                  by <span style={{ color: '#000', fontWeight: 'bold' }}>@{username}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: '900', color: '#eab308', letterSpacing: '-1px' }}>
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
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
