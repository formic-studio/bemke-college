import { MOTION_CHANGE_EVENT, isReducedMotion } from './motion-preference.js';

const SELECTOR = '.video video';
const BOOTED_KEY = '__bemkeDecorativeVideoMotionBooted';
const states = new WeakMap();

const shouldPauseVideo = () =>
  isReducedMotion() ||
  (document.documentElement.getAttribute('data-contrast') ?? 'default') !== 'default';

const syncVideo = (video) => {
  let state = states.get(video);

  if (!state) {
    state = {
      autoplay: video.hasAttribute('autoplay'),
      loop: video.hasAttribute('loop'),
    };
    states.set(video, state);
    video.removeAttribute('onclick');
    video.onclick = null;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.addEventListener('play', () => {
      if (shouldPauseVideo()) {
        video.pause();
      }
    });
  }

  if (shouldPauseVideo()) {
    video.pause();
    video.removeAttribute('autoplay');
    video.removeAttribute('loop');
    video.autoplay = false;
    video.loop = false;
    return;
  }

  video.autoplay = state.autoplay;
  video.loop = state.loop;

  if (state.autoplay) {
    video.setAttribute('autoplay', '');
  }

  if (state.loop) {
    video.setAttribute('loop', '');
  }

  if (state.autoplay && video.currentSrc) {
    video.play()?.catch?.(() => {});
  }
};

const syncAllVideos = () => {
  document.querySelectorAll(SELECTOR).forEach((video) => {
    if (states.has(video) || video.hasAttribute('autoplay')) {
      syncVideo(video);
    }
  });
};

export function initDecorativeVideoMotion() {
  syncAllVideos();

  if (window[BOOTED_KEY]) {
    return;
  }

  window[BOOTED_KEY] = true;
  document.addEventListener(MOTION_CHANGE_EVENT, syncAllVideos);
  document.addEventListener('bricks/ajax/end', syncAllVideos);
  new MutationObserver(syncAllVideos).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-contrast'],
  });
}
