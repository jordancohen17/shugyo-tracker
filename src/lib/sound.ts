// src/lib/sound.ts
// Synthesized web audio sounds for zero external asset dependencies

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a resonant Japanese temple bell / singing bowl chime
 */
export function playRestCompleteSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Fundamental frequencies for a serene, resonant bell (E4 / ~329.6Hz + harmonics)
    const partials = [
      { freq: 329.63, gain: 0.45, decay: 2.8 },
      { freq: 659.25, gain: 0.25, decay: 2.2 },
      { freq: 988.88, gain: 0.15, decay: 1.6 },
      { freq: 1318.51, gain: 0.08, decay: 1.0 },
    ];

    partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (e) {
    console.warn('Audio playback not supported or blocked:', e);
  }
}

/**
 * Play a subtle soft tick/beep (e.g. for final 3 seconds countdown)
 */
export function playCountdownTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Ignore error
  }
}

/**
 * Trigger mobile haptic vibration
 */
export function triggerHaptic(pattern: number | number[] = [200, 100, 200]) {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore unsupported vibration
  }
}
