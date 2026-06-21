import React, { useState } from 'react';

const RTMP_URL  = 'rtmp://live.anyandall.live/stream';
const copy = (text: string, setCopied: (k: string) => void, key: string) => {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  });
};

const OBSStreamPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [streamKey] = useState(() => 'sk_live_' + Math.random().toString(36).slice(2, 18));
  const [copied, setCopied]   = useState('');
  const [revealed, setRevealed] = useState(false);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, color:'#4A7AB5', fontSize:13, fontWeight:600, background:'none', border:'none', cursor:'pointer', marginBottom:28 }}>
        ← Back to Go Live
      </button>

      <h1 style={{ fontSize:'1.8rem', fontWeight:700, color:'#1B3A6B', margin:'0 0 6px' }}>OBS Stream Setup</h1>
      <p style={{ color:'#4A7AB5', fontSize:14, marginBottom:36 }}>Copy these into OBS → Settings → Stream.</p>

      {/* RTMP URL */}
      <div style={{ background:'white', border:'1.5px solid rgba(43,108,184,0.18)', borderRadius:18, padding:'22px 24px', marginBottom:16, boxShadow:'0 2px 12px rgba(43,108,184,0.06)' }}>
        <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#4A7AB5', display:'block', marginBottom:8 }}>
          RTMP Server URL
        </label>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <code style={{ flex:1, fontSize:14, color:'#1B3A6B', background:'rgba(43,108,184,0.05)', padding:'10px 14px', borderRadius:10, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {RTMP_URL}
          </code>
          <button
            onClick={() => copy(RTMP_URL, setCopied, 'rtmp')}
            style={{ padding:'9px 18px', borderRadius:10, background: copied==='rtmp' ? '#16a34a' : 'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'background 200ms' }}
          >
            {copied === 'rtmp' ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stream Key */}
      <div style={{ background:'white', border:'1.5px solid rgba(43,108,184,0.18)', borderRadius:18, padding:'22px 24px', marginBottom:28, boxShadow:'0 2px 12px rgba(43,108,184,0.06)' }}>
        <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#4A7AB5', display:'block', marginBottom:8 }}>
          Stream Key <span style={{ color:'#e53e3e', fontSize:10 }}>• Keep this private</span>
        </label>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <code style={{ flex:1, fontSize:14, color:'#1B3A6B', background:'rgba(43,108,184,0.05)', padding:'10px 14px', borderRadius:10, fontFamily:'monospace', letterSpacing: revealed ? 0 : '0.2em' }}>
            {revealed ? streamKey : '•'.repeat(streamKey.length)}
          </code>
          <button onClick={() => setRevealed(r => !r)} style={{ padding:'9px 14px', borderRadius:10, background:'rgba(43,108,184,0.08)', color:'#2B6CB8', fontWeight:700, fontSize:12, border:'1.5px solid rgba(43,108,184,0.2)', cursor:'pointer' }}>
            {revealed ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => copy(streamKey, setCopied, 'key')}
            style={{ padding:'9px 18px', borderRadius:10, background: copied==='key' ? '#16a34a' : 'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:700, fontSize:12, border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'background 200ms' }}
          >
            {copied === 'key' ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* OBS Setup steps */}
      <div style={{ background:'rgba(43,108,184,0.04)', border:'1.5px solid rgba(43,108,184,0.12)', borderRadius:18, padding:'24px' }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:'#1B3A6B', margin:'0 0 16px' }}>How to set up in OBS</h3>
        <ol style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:10 }}>
          {[
            'Open OBS → click Settings (bottom right)',
            'Go to the Stream tab',
            'Set Service to "Custom..."',
            'Paste the RTMP Server URL above into "Server"',
            'Paste your Stream Key into "Stream Key"',
            'Click Apply → OK',
            'Press Start Streaming in OBS',
            'Come back here and click Go Live below 👇',
          ].map((step, i) => (
            <li key={i} style={{ color:'#1B3A6B', fontSize:14, opacity:0.8 }}>{step}</li>
          ))}
        </ol>
      </div>

      <button
        style={{ marginTop:28, width:'100%', padding:'16px', borderRadius:14, background:'linear-gradient(135deg,#2B6CB8,#1A4B8C)', color:'white', fontWeight:800, fontSize:16, border:'none', cursor:'pointer', boxShadow:'0 6px 24px rgba(43,108,184,0.38)', letterSpacing:'0.01em' }}
        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform=''}
      >
        🔴 Go Live
      </button>
    </div>
  );
};

export default OBSStreamPanel;
