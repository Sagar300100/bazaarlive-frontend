import { useState } from 'react';

export function DebugShowsPing() {
  const [out, setOut] = useState<any>(null);

  async function ping() {
    const url = `${import.meta.env.VITE_API_URL}/api/shows`;
    const res = await fetch(url);
    const json = await res.json();
    setOut({ url, count: json.length, ids: json.map((x: any) => x.id), sample: json.slice(0, 2) });
  }

  return (
    <div style={{ padding: 8, border: '1px dashed', margin: '12px 0' }}>
      <button onClick={ping}>Debug: fetch /api/shows</button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {out ? JSON.stringify(out, null, 2) : 'Click to test'}
      </pre>
    </div>
  );
}
