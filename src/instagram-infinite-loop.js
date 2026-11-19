import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from './motion-preference.js';

const TRACK_SELECTOR = '.infinity-loop-block';
const ITEM_SELECTOR = ':scope > .img-wrapper';
const READY_ATTRIBUTE = 'data-bemke-infinite-loop-ready';
const CLONE_ATTRIBUTE = 'data-bemke-infinite-loop-clone';
const SPEED_PX_PER_SECOND = 36;

function disableCloneInteraction(clone) {
  clone.setAttribute(CLONE_ATTRIBUTE, '');
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('id');
  clone.classList.remove('bricks-lazy-hidden');

  if (clone.matches('a, button, input, select, textarea, [tabindex]')) {
    clone.setAttribute('tabindex', '-1');
  }

  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  clone.querySelectorAll('.bricks-lazy-hidden').forEach((element) => {
    element.classList.remove('bricks-lazy-hidden');
  });
  clone
    .querySelectorAll('a, button, input, select, textarea, [tabindex]')
    .forEach((element) => element.setAttribute('tabindex', '-1'));

  clone.querySelectorAll('img').forEach((image) => {
    if (image.dataset.src) {
      image.src = image.dataset.src;
    }

    if (image.dataset.srcset) {
      image.srcset = image.dataset.srcset;
    }

    if (image.dataset.sizes) {
      image.sizes = image.dataset.sizes;
    }
  });
}

function createInfiniteLoop(track) {
  if (track.hasAttribute(READY_ATTRIBUTE)) {
    return;
  }

  const items = Array.from(track.querySelectorAll(ITEM_SELECTOR));

  if (items.length < 2) {
    return;
  }

  track.setAttribute(READY_ATTRIBUTE, '');
  track.classList.add('bemke-infinity-loop-track');

  const clones = items.map((item) => {
    const clone = item.cloneNode(true);
    disableCloneInteraction(clone);
    return clone;
  });
  const queryTrail = track.querySelector(':scope > .brx-query-trail');

  clones.forEach((clone) => track.insertBefore(clone, queryTrail));

  let offset = 0;
  let loopDistance = 0;
  let previousTime = null;
  let animationFrame = null;
  let pointerPaused = false;
  let focusPaused = false;
  let visible = true;

  const shouldAnimate = () =>
    !isReducedMotion() &&
    !pointerPaused &&
    !focusPaused &&
    visible &&
    !document.hidden &&
    loopDistance > 0;

  const tick = (time) => {
    animationFrame = null;

    if (!shouldAnimate()) {
      previousTime = null;
      return;
    }

    if (previousTime === null) {
      previousTime = time;
    }

    const elapsed = Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;

    offset = (offset + SPEED_PX_PER_SECOND * elapsed) % loopDistance;
    track.style.setProperty('--bemke-infinity-loop-offset', `${-offset}px`);

    animationFrame = window.requestAnimationFrame(tick);
  };

  const syncAnimation = () => {
    if (shouldAnimate()) {
      if (animationFrame === null) {
        previousTime = null;
        animationFrame = window.requestAnimationFrame(tick);
      }

      return;
    }

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    previousTime = null;
  };

  const measure = () => {
    const firstItem = items[0];
    const firstClone = clones[0];
    const previousDistance = loopDistance;

    loopDistance = Math.max(0, firstClone.offsetLeft - firstItem.offsetLeft);

    if (previousDistance > 0 && loopDistance > 0) {
      offset = (offset / previousDistance) * loopDistance;
    }

    if (loopDistance > 0) {
      offset %= loopDistance;
    } else {
      offset = 0;
    }

    track.style.setProperty('--bemke-infinity-loop-offset', `${-offset}px`);
    syncAnimation();
  };

  const syncMotionPreference = () => {
    track.classList.toggle('is-motion-reduced', isReducedMotion());
    syncAnimation();
  };

  const handlePointerEnter = () => {
    pointerPaused = true;
    track.classList.add('is-paused');
    syncAnimation();
  };

  const handlePointerLeave = () => {
    pointerPaused = false;
    track.classList.toggle('is-paused', focusPaused);
    syncAnimation();
  };

  const handleFocusIn = () => {
    focusPaused = true;
    track.classList.add('is-paused');
    syncAnimation();
  };

  const handleFocusOut = (event) => {
    if (event.relatedTarget instanceof Node && track.contains(event.relatedTarget)) {
      return;
    }

    focusPaused = false;
    track.classList.toggle('is-paused', pointerPaused);
    syncAnimation();
  };

  track.addEventListener('pointerenter', handlePointerEnter);
  track.addEventListener('pointerleave', handlePointerLeave);
  track.addEventListener('focusin', handleFocusIn);
  track.addEventListener('focusout', handleFocusOut);
  document.addEventListener(MOTION_CHANGE_EVENT, syncMotionPreference);
  document.addEventListener('visibilitychange', syncAnimation);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    items.forEach((item) => resizeObserver.observe(item));
  } else {
    window.addEventListener('resize', measure, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      syncAnimation();
    });
    visibilityObserver.observe(track);
  }

  track.querySelectorAll('img').forEach((image) => {
    if (!image.complete) {
      image.addEventListener('load', measure, { once: true });
    }
  });

  measure();
  syncMotionPreference();

  window.addEventListener('pagehide', () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
    }
  }, { once: true });
}

export function initInstagramInfiniteLoops() {
  document.querySelectorAll(TRACK_SELECTOR).forEach(createInfiniteLoop);
}
