/**
 * AudioController.js
 * Manages Background Music (BGM) and Sound Effects (SFX).
 * Prevents overlapping tracks and handles looping logic.
 */
export class AudioController {
    constructor() {
        this.bgm = null; // The Audio object for music
        this.currentUrl = null; // To track if we need to change the track
    }

    /**
     * Play a background track. 
     * If the URL is the same as the playing track, it does nothing (continues playing).
     * @param {string} url - The audio source URL.
     */
    playBGM(url) {
        if (!url) {
            this.stopBGM();
            return;
        }

        // Don't restart if it's the same track
        if (this.currentUrl === url && this.bgm && !this.bgm.paused) {
            return;
        }

        this.stopBGM();

        this.currentUrl = url;
        this.bgm = new Audio(url);
        this.bgm.loop = true;
        
        // We catch the promise to prevent "User didn't interact" errors in some contexts
        this.bgm.play().catch(e => {
            console.warn("[Audio] Autoplay blocked or failed:", e);
        });
    }

    /**
     * Stop the current background music.
     */
    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgm = null;
        }
        this.currentUrl = null;
    }

    /**
     * Play a one-shot sound effect.
     * @param {string} url 
     */
    playSFX(url) {
        if (!url) return;
        const sfx = new Audio(url);
        sfx.play().catch(e => {
            console.warn("[Audio] SFX failed:", e);
        });
    }
}