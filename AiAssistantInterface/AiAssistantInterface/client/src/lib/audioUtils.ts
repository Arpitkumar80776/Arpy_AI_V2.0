export class AudioUtils {
  private static audioContext: AudioContext | null = null;

  static async playSound(frequency: number, duration: number, volume: number = 0.1) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  static playStartRecordingSound() {
    this.playSound(800, 0.2, 0.1);
  }

  static playStopRecordingSound() {
    this.playSound(400, 0.2, 0.1);
  }

  static playMessageSentSound() {
    this.playSound(600, 0.1, 0.05);
  }

  static playMessageReceivedSound() {
    this.playSound(500, 0.15, 0.05);
  }
}
