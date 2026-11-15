/**
 * Utility phát âm thanh thông báo nhẹ nhàng, thanh lịch chuẩn Web Audio API
 * Tự động tạo 3 nốt nhạc du dương (C5 -> E5 -> G5) mà không cần file mp3 ngoài
 * Tích hợp cơ chế throttle chống phát âm thanh lặp lại 2 lần liên tiếp
 */
let lastSoundPlayTime = 0;

export const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastSoundPlayTime < 1200) {
    return; // Không phát lại âm thanh nếu vừa phát trong vòng 1.2 giây
  }
  lastSoundPlayTime = now;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.warn('Không thể phát âm thanh thông báo:', e);
  }
};

