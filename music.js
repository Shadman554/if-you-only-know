'use strict';
(() => {
  const audio = document.querySelector('#background-music');
  const button = document.querySelector('#music-toggle');
  let unlocked = false, enabled = true, gamePaused = false, blocked = false;

  if (audio) {
    audio.volume = 0.35;
    audio.loop = true;
    if (!audio.src) {
      audio.src = 'assets/background-music.mp3';
    }
  }

  function render() {
    // Waiting for Start is different from the player's music preference.
    const isMuted = !enabled || blocked;
    const label = isMuted ? 'Play background music' : 'Mute background music';
    if (button) {
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(!isMuted));
      button.title = label;
      button.classList.toggle('music-off', isMuted);
      const icon = button.querySelector('img');
      if (icon) {
        icon.src = isMuted ? 'assets/button-music-off.png' : 'assets/button-music-on.png';
        icon.alt = isMuted ? 'Music muted' : 'Music enabled';
      }
    }
  }

  function sync() {
    render();
    if (!audio) return;
    if (!unlocked || !enabled || gamePaused || document.hidden) {
      if (!audio.paused) audio.pause();
      return;
    }
    const attempt = audio.play();
    if (attempt) {
      attempt.then(() => {
        blocked = false;
        render();
      }).catch((err) => {
        console.warn('Audio play notice:', err);
        if (enabled && !gamePaused && !document.hidden) {
          blocked = true;
          render();
        }
      });
    }
  }

  window.backgroundMusic = {
    start() {
      unlocked = true;
      blocked = false;
      sync();
    },
    setPaused(value) {
      gamePaused = value;
      sync();
    }
  };

  if (button) {
    button.addEventListener('click', () => {
      if (blocked) { enabled = true; blocked = false; }
      else enabled = !enabled;
      unlocked = true;
      sync();
    });
  }

  document.addEventListener('visibilitychange', sync);

  if (audio) {
    audio.addEventListener('playing', () => {
      blocked = false;
      render();
    });
    audio.addEventListener('error', (e) => {
      console.warn('Background audio error:', e);
      // Try fallback to mp3 or m4a if one failed
      if (audio.src.endsWith('.m4a')) {
        audio.src = 'assets/background-music.mp3';
        if (unlocked && enabled && !gamePaused && !document.hidden) {
          audio.play().catch(() => {});
        }
      } else {
        blocked = true;
        render();
      }
    });
  }

  render();
})();
