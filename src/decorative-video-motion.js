import { MOTION_CHANGE_EVENT, isReducedMotion } from './motion-preference.js';

const SELECTOR = '.video video';
const BOOTED_KEY = '__bemkeDecorativeVideoMotionBooted';
const MOBILE_QUERY = window.matchMedia('(max-width: 767px)');
const ANDROID_QUERY = /Android/i;
const ACTIVATION_EVENTS = ['pointerdown', 'touchstart', 'keydown'];
const states = new WeakMap();
const videos = new Set();
let mobileActivationArmed = false;
let desktopActivationHandle = null;
let activateAfterPopupClose = false;

const shouldPauseVideo = () =>
  isReducedMotion() ||
  (document.documentElement.getAttribute('data-contrast') ?? 'default') !== 'default';

const hydrateVideo = (video) => {
  const useMobileSource = MOBILE_QUERY.matches || ANDROID_QUERY.test(navigator.userAgent);
  const source = useMobileSource && video.dataset.bemkeMobileSrc
    ? video.dataset.bemkeMobileSrc
    : video.dataset.bemkeSrc;

  if (!source || shouldPauseVideo()) {
    return;
  }

  const state = states.get(video);
  video.preload = 'metadata';
  video.src = source;
  delete video.dataset.bemkeSrc;
  delete video.dataset.bemkeMobileSrc;
  video.muted = true;
  video.playsInline = true;
  video.loop = state.loop;
  video.autoplay = state.autoplay;
  video.load();

  if (state.autoplay) {
    video.play()?.catch?.(() => {});
  }
};

const activateDeferredVideos = () => {
  if (shouldPauseVideo()) {
    return;
  }

  if (document.body.classList.contains('bemke-popup-open')) {
    activateAfterPopupClose = true;
    return;
  }

  activateAfterPopupClose = false;
  videos.forEach(hydrateVideo);
};

const removeMobileActivation = () => {
  if (!mobileActivationArmed) {
    return;
  }

  mobileActivationArmed = false;
  ACTIVATION_EVENTS.forEach((name) => {
    window.removeEventListener(name, onMobileInteraction);
  });
};

const onMobileInteraction = () => {
  removeMobileActivation();
  activateDeferredVideos();
};

const cancelDesktopActivation = () => {
  if (desktopActivationHandle === null) {
    return;
  }

  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(desktopActivationHandle);
  } else {
    window.clearTimeout(desktopActivationHandle);
  }

  desktopActivationHandle = null;
};

const scheduleDeferredVideos = () => {
  cancelDesktopActivation();
  removeMobileActivation();

  if (shouldPauseVideo() || !Array.from(videos).some((video) => video.dataset.bemkeSrc)) {
    return;
  }

  if (document.body.classList.contains('bemke-popup-public') &&
    document.querySelector('.popup-block:not([data-bemke-popup-ready])')) {
    return;
  }

  if (MOBILE_QUERY.matches) {
    mobileActivationArmed = true;
    ACTIVATION_EVENTS.forEach((name) => {
      window.addEventListener(name, onMobileInteraction, { once: true, passive: true });
    });
    return;
  }

  if (typeof window.requestIdleCallback === 'function') {
    desktopActivationHandle = window.requestIdleCallback(() => {
      desktopActivationHandle = null;
      activateDeferredVideos();
    }, { timeout: 1200 });
  } else {
    desktopActivationHandle = window.setTimeout(() => {
      desktopActivationHandle = null;
      activateDeferredVideos();
    }, 700);
  }
};

const syncVideo = (video) => {
  let state = states.get(video);

  if (!state) {
    state = {
      autoplay: video.dataset.bemkeAutoplay === 'true' || video.hasAttribute('autoplay'),
      loop: video.hasAttribute('loop'),
    };
    states.set(video, state);
    videos.add(video);
    video.closest('.video')?.setAttribute('aria-hidden', 'true');
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

  if (video.dataset.bemkeSrc) {
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

  if (state.autoplay && video.currentSrc && video.paused) {
    video.play()?.catch?.(() => {});
  }
};

const syncAllVideos = () => {
  document.querySelectorAll(SELECTOR).forEach(syncVideo);
  scheduleDeferredVideos();
};

export function initDecorativeVideoMotion() {
  syncAllVideos();

  if (window[BOOTED_KEY]) {
    return;
  }

  window[BOOTED_KEY] = true;
  document.addEventListener(MOTION_CHANGE_EVENT, syncAllVideos);
  document.addEventListener('bricks/ajax/end', syncAllVideos);
  document.addEventListener('bemke:popup-ready', scheduleDeferredVideos);
  document.addEventListener('bemke:popup-close', () => {
    if (activateAfterPopupClose) {
      activateDeferredVideos();
    } else {
      scheduleDeferredVideos();
    }
  });
  MOBILE_QUERY.addEventListener('change', scheduleDeferredVideos);
  new MutationObserver(syncAllVideos).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-contrast'],
  });
}
