import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, toggleMute, sfx } from '@/lib/sound';

export function SoundToggle() {
  const [muted, setMuted] = useState(isMuted());

  const handleToggle = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
    if (!newMuted) sfx.click();
  };

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => !isMuted() && sfx.hover()}
      className="pixel-btn-teal"
      style={{ padding: '8px 10px', fontSize: '10px' }}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}

export function CRTToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crt') === 'true';
    setOn(stored);
  }, []);

  const handleToggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem('crt', String(next));
    if (!isMuted()) sfx.click();
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`pixel-btn ${on ? 'pixel-btn-gold' : ''}`}
        style={{ padding: '8px 10px', fontSize: '10px' }}
        title="Toggle CRT scanlines"
      >
        CRT {on ? 'ON' : 'OFF'}
      </button>
      {on && <div className="crt-overlay" />}
    </>
  );
}
