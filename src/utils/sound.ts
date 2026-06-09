// Web Audio Synthesizer for Solo Leveling [THE SYSTEM] Sound FX

let isSoundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  isSoundEnabled = enabled;
};

export const getSoundEnabled = () => {
  return isSoundEnabled;
};

// Lazy creation of AudioContext to satisfy browser policy
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

// 1. Double Beep: [SYSTEM NOTICE OPENED]
export const playSystemNotice = () => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Double chime frequencies
    const f1 = 880; // A5
    const f2 = 1318.51; // E6

    osc1.frequency.setValueAtTime(f1, now);
    osc1.frequency.setValueAtTime(f2, now + 0.08);

    osc2.frequency.setValueAtTime(f1 * 0.5, now);
    osc2.frequency.setValueAtTime(f2 * 0.5, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// 2. High Majestic Chime: [LEVEL UP]
export const playLevelUp = () => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    gainNode.connect(ctx.destination);

    // Rising majestic arpeggio (C major pentatonic style for pure heroism!)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.1, now + idx * 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.connect(oscGain);
      oscGain.connect(gainNode);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });

    // Add a low warm drone
    const subOsc = ctx.createOscillator();
    subOsc.type = "sawtooth";
    subOsc.frequency.setValueAtTime(130.81, now); // C3
    
    // Lowpass filter for warm sub bass
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.1, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.0);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// 3. Upbeat Chime: [QUEST COMPLETED]
export const playQuestComplete = () => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    gain.connect(ctx.destination);

    // 4 notes: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      osc.connect(gain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// 4. Alarm Siren: [EMERGENCY QUEST TRIGGERED]
export const playEmergencyQuestAlert = () => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    gain.connect(ctx.destination);

    // Dynamic sweeping oscillator to simulate a red emergency siren
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(330, now); // E4
    
    // Frequency sweep up and down
    osc.frequency.linearRampToValueAtTime(550, now + 0.3);
    osc.frequency.linearRampToValueAtTime(330, now + 0.6);
    osc.frequency.linearRampToValueAtTime(550, now + 0.9);
    osc.frequency.linearRampToValueAtTime(110, now + 1.5); // plummet

    // Lowpass filter to avoid harshness
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);

    osc.connect(filter);
    filter.connect(gain);

    osc.start(now);
    osc.stop(now + 1.6);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// 5. Soft button click
export const playClick = () => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};
