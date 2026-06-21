import React from 'react';

interface GoLivePanelProps {
  onChooseOBS: () => void;
  onChooseAI: () => void;
}

const GoLivePanel: React.FC<GoLivePanelProps> = ({ onChooseOBS, onChooseAI }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1B3A6B', margin: '0 0 8px' }}>
          Go Live
        </h1>
        <p style={{ color: '#4A7AB5', fontSize: 15 }}>
          Choose how you want to stream today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* OBS Option */}
        <button
          onClick={onChooseOBS}
          style={{
            background: 'white',
            border: '2px solid rgba(43,108,184,0.18)',
            borderRadius: 24,
            padding: '36px 32px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            boxShadow: '0 4px 20px rgba(43,108,184,0.08)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#2B6CB8';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(43,108,184,0.18)';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(43,108,184,0.18)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(43,108,184,0.08)';
            e.currentTarget.style.transform = '';
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 18 }}>🎥</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1B3A6B', margin: '0 0 10px' }}>
            Stream with OBS
          </h2>
          <p style={{ color: '#4A7AB5', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
            Stream live from your camera using OBS or any RTMP-compatible software. You present, engage, and sell — full control in your hands.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '📡 Get your RTMP URL + Stream Key',
              '🎙️ Use your own camera & mic',
              '💬 Live chat with your audience',
              '⚡ Ultra-low latency stream',
            ].map(f => (
              <span key={f} style={{ fontSize: 13, color: '#1B3A6B', opacity: 0.75 }}>{f}</span>
            ))}
          </div>
          <div style={{
            marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 22px', borderRadius: 100,
            background: 'linear-gradient(135deg,#2B6CB8,#1A4B8C)',
            color: 'white', fontWeight: 700, fontSize: 13,
          }}>
            Set Up OBS Stream →
          </div>
        </button>

        {/* AI Avatar Option */}
        <button
          onClick={onChooseAI}
          style={{
            background: 'linear-gradient(135deg, #0A1220 0%, #0D1828 100%)',
            border: '2px solid rgba(43,108,184,0.35)',
            borderRadius: 24,
            padding: '36px 32px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            boxShadow: '0 4px 20px rgba(43,108,184,0.18)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#5B9BD5';
            e.currentTarget.style.boxShadow = '0 8px 36px rgba(43,108,184,0.32)';
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(43,108,184,0.35)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(43,108,184,0.18)';
            e.currentTarget.style.transform = '';
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,108,184,0.25), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 48 }}>🤖</span>
            <span style={{
              padding: '3px 10px', borderRadius: 100,
              background: 'rgba(43,108,184,0.3)', border: '1px solid rgba(91,155,213,0.5)',
              color: '#7BB8FF', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>New</span>
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', margin: '0 0 10px' }}>
            Stream with AI Avatar
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
            Your AI twin sells for you — 24/7. Upload your products, generate a script, and let your digital avatar run the show.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '🧠 AI generates your sales script',
              '🎭 Your face & voice — cloned once',
              '💬 Avatar answers viewer questions live',
              '🌙 Streams while you sleep',
            ].map(f => (
              <span key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
            ))}
          </div>
          <div style={{
            marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 22px', borderRadius: 100,
            background: 'linear-gradient(135deg,#2B6CB8,#5B9BD5)',
            color: 'white', fontWeight: 700, fontSize: 13,
            boxShadow: '0 4px 18px rgba(43,108,184,0.45)',
          }}>
            Set Up AI Stream →
          </div>
        </button>
      </div>

      {/* Info strip */}
      <div style={{
        marginTop: 28, padding: '16px 24px', borderRadius: 16,
        background: 'rgba(43,108,184,0.06)', border: '1px solid rgba(43,108,184,0.14)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>💡</span>
        <p style={{ color: '#4A7AB5', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#1B3A6B' }}>New to live selling?</strong> Start with OBS to get comfortable with your audience, then graduate to AI Avatar streaming when you're ready to scale.
        </p>
      </div>
    </div>
  );
};

export default GoLivePanel;
