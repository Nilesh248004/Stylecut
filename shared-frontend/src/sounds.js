export function playSuccessNoticeSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.72, audioContext.currentTime + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.92);

  [
    { frequency: 523.25, delay: 0, gain: 0.34 },
    { frequency: 659.25, delay: 0.1, gain: 0.36 },
    { frequency: 783.99, delay: 0.2, gain: 0.4 },
    { frequency: 1046.5, delay: 0.34, gain: 0.32 }
  ].forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime + note.delay;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(note.frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(note.gain, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.32);
    oscillator.connect(gain).connect(masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.36);
  });

  const sparkle = audioContext.createOscillator();
  const sparkleGain = audioContext.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(1567.98, audioContext.currentTime + 0.18);
  sparkleGain.gain.setValueAtTime(0.0001, audioContext.currentTime + 0.18);
  sparkleGain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.2);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.62);
  sparkle.connect(sparkleGain).connect(masterGain);
  sparkle.start(audioContext.currentTime + 0.18);
  sparkle.stop(audioContext.currentTime + 0.64);
}
