import Phaser from 'phaser';

/**
 * Centralized sound manager that ensures all sounds respect the global volume setting.
 * All sound effects should be played through this manager to maintain consistent volume behavior.
 */
export class SoundManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Play a sound effect with a relative volume (0-1).
   * The actual volume will be: relativeVolume * scene.sound.volume
   * 
   * @param key Sound key to play
   * @param relativeVolume Relative volume (0-1) - this is the desired volume if global volume is at max
   * @param config Optional additional sound configuration
   * @returns The sound instance that was played
   */
  playSound(
    key: string, 
    relativeVolume: number = 1.0,
    config?: Phaser.Types.Sound.SoundConfig
  ): Phaser.Sound.BaseSound {
    // Get the global volume from the scene's sound manager
    const globalVolume = this.scene.sound.volume;
    
    // Calculate the actual volume: multiply relative volume by global volume
    const actualVolume = Math.max(0, Math.min(1, relativeVolume * globalVolume));
    
    // Merge config with calculated volume
    const soundConfig: Phaser.Types.Sound.SoundConfig = {
      ...config,
      volume: actualVolume
    };
    
    return this.scene.sound.play(key, soundConfig);
  }

  /**
   * Get the current global volume setting
   */
  getGlobalVolume(): number {
    return this.scene.sound.volume;
  }

  /**
   * Set the global volume (this should be called from the scene's volume setting)
   * Note: This should typically be set through the scene's setMusicVolume method
   * to ensure music also gets updated.
   */
  setGlobalVolume(volume: number): void {
    this.scene.sound.volume = Math.max(0, Math.min(1, volume));
  }
}

