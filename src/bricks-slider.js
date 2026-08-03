import { gsap } from "gsap";
import { bindSliderControl, getSliderControls } from "./slider-controls.js";
import { bindTouchSwipeFallback } from "./touch-swipe-fallback.js";
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from "./motion-preference.js";

const ROOT_SELECTOR = ".slider:not(.slider-thinktank)";
const TRACK_SELECTOR = ".slider-wrapper";
const SLIDE_SELECTOR = ".slide";
const CONTROLS_SELECTOR = ".slider-paggination";

const READY_ATTR = "data-bemke-slider-ready";
const ACTIVE_ATTR = "slide-active";
const BOOT_FLAG = "__bemkeHomeSliderBooted";
const RESETTING_CLASS = "is-resetting";
const DRAGGING_CLASS = "is-dragging";
const GHOST_CLASS = "is-ghost";

const ANIMATION_DURATION = 0.9;
const SNAP_DURATION = 0.45;
const AUTOPLAY_MS = 3500;
const SWIPE_THRESHOLD = 46;
const SIDE_SLIDE_SCALE = 0.96;
const INCOMING_SLIDE_DELAY = 0.008;
const ANIMATION_EASE = "power1.inOut";
const SNAP_EASE = "power3.out";

let sliderId = 0;
const imagePreloads = new Set();
const pendingImagePreloads = new WeakSet();

export function initBricksSliders() {
  initHomeSliderRoots();
  setupHomeSliderLifecycle();
}

function initHomeSliderRoots(scope = document) {
  scope.querySelectorAll(ROOT_SELECTOR).forEach((root) => {
    if (root.getAttribute(READY_ATTR) === "1") {
      root.__bemkeHomeSliderRefresh?.();
      return;
    }

    createHomeSlider(root);
  });
}

function setupHomeSliderLifecycle() {
  if (window[BOOT_FLAG]) {
    return;
  }

  window[BOOT_FLAG] = true;

  const rerunInit = debounce(() => {
    initHomeSliderRoots();
  }, 90);

  window.addEventListener("load", rerunInit);
  document.addEventListener("bricks/ajax/end", rerunInit);
  window.setTimeout(rerunInit, 200);
  window.setTimeout(rerunInit, 800);

  if (!window.MutationObserver || !document.body) {
    return;
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        if (node.matches(ROOT_SELECTOR) || node.querySelector(ROOT_SELECTOR)) {
          rerunInit();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function createHomeSlider(root) {
  const track = root.querySelector(TRACK_SELECTOR);
  const slides = track
    ? Array.from(track.querySelectorAll(`:scope > ${SLIDE_SELECTOR}`))
    : [];

  if (!track || slides.length < 2) {
    return;
  }

  const controls = getControls(root);
  let activeIndex = getInitialActiveIndex(slides);
  let currentOffset = 0;
  let isAnimating = false;
  let queuedDirection = 0;
  let isPlaying = false;
  let autoplayTimerId = null;
  let movementTween = null;
  let pointerState = null;

  root.setAttribute(READY_ATTR, "1");
  prepareSlideMedia(slides, activeIndex);
  decorateSlider(root, track, slides);
  bindControls(controls, track, {
    onPause: () => disableAutoplay(),
    onPlay: () => enableAutoplay(true),
    onPrev: () => queueMove(-1, true),
    onNext: () => queueMove(1, true),
  });

  const touchSwipeFallback = bindTouchSwipeFallback(track, {
    canStart: () => !isAnimating,
    onStart: () => {
      gsap.killTweensOf(track);

      return {
        offset: getRenderedOffset(track, currentOffset),
      };
    },
    onMove: ({ context, dx }) => {
      track.classList.add(DRAGGING_CLASS);
      applyOffset(track, (context?.offset ?? currentOffset) + dx * 0.36);
    },
    onSwipe: ({ direction }) => {
      track.classList.remove(DRAGGING_CLASS);
      queueMove(direction, true);
    },
    onCancel: () => {
      track.classList.remove(DRAGGING_CLASS);
      snapToOffset(track, currentOffset);
    },
    threshold: SWIPE_THRESHOLD,
  });

  root.addEventListener("keydown", (event) => {
    if (isFormControl(event.target)) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusControl(controls.prev);
      queueMove(-1, true);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusControl(controls.next);
      queueMove(1, true);
    }
  });

  track.addEventListener("pointerdown", (event) => {
    if (isAnimating || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    gsap.killTweensOf(track);

    pointerState = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: getRenderedOffset(track, currentOffset),
      lockedAxis: null,
      dragged: false,
    };

    try {
      track.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture can fail when the pointer is already released.
    }
  });

  track.addEventListener("pointermove", (event) => {
    if (!pointerState || pointerState.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - pointerState.startX;
    const dy = event.clientY - pointerState.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!pointerState.lockedAxis && (absX > 8 || absY > 8)) {
      pointerState.lockedAxis = absX > absY ? "x" : "y";
    }

    if (pointerState.lockedAxis !== "x") {
      return;
    }

    pointerState.dragged = true;
    track.classList.add(DRAGGING_CLASS);
    applyOffset(track, pointerState.offset + dx * 0.36);
  });

  track.addEventListener("pointerup", (event) => {
    if (!pointerState || pointerState.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - pointerState.startX;
    const dy = event.clientY - pointerState.startY;
    const shouldMove =
      pointerState.dragged &&
      Math.abs(dx) > SWIPE_THRESHOLD &&
      Math.abs(dx) > Math.abs(dy);
    const wasDragged = pointerState.dragged;

    pointerState = null;
    track.classList.remove(DRAGGING_CLASS);

    if (wasDragged) {
      touchSwipeFallback.markPointerHandled();
    }

    if (shouldMove) {
      queueMove(dx < 0 ? 1 : -1, true);
      return;
    }

    snapToOffset(track, currentOffset);
  });

  track.addEventListener("pointercancel", () => {
    pointerState = null;
    track.classList.remove(DRAGGING_CLASS);
    snapToOffset(track, currentOffset);
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      cancelMovement();
      arrangeSlides(track, slides, activeIndex);
      syncSlides(slides, activeIndex);
      updateSlideDepth(slides, activeIndex, false);
      currentOffset = recenterActive(
        root,
        track,
        slides[activeIndex],
        currentOffset,
      );
    }, 120),
  );

  root.__bemkeHomeSliderRefresh = () => {
    cancelMovement();
    arrangeSlides(track, slides, activeIndex);
    syncSlides(slides, activeIndex);
    updateSlideDepth(slides, activeIndex, false);
    currentOffset = recenterActive(
      root,
      track,
      slides[activeIndex],
      currentOffset,
    );
  };

  arrangeSlides(track, slides, activeIndex);
  syncSlides(slides, activeIndex);
  updateSlideDepth(slides, activeIndex, false);
  currentOffset = recenterActive(
    root,
    track,
    slides[activeIndex],
    currentOffset,
  );
  updateControlsState(controls, isPlaying);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }

    startAutoplay();
  });

  document.addEventListener(MOTION_CHANGE_EVENT, (event) => {
    if (!event.detail?.reduced) {
      return;
    }

    cancelMovement();
    activeIndex = getInitialActiveIndex(slides);
    arrangeSlides(track, slides, activeIndex);
    syncSlides(slides, activeIndex);
    updateSlideDepth(slides, activeIndex, false);
    currentOffset = recenterActive(
      root,
      track,
      slides[activeIndex],
      currentOffset,
    );
  });

  function queueMove(direction, restartTimer = false) {
    const normalizedDirection = direction < 0 ? -1 : 1;

    if (restartTimer && isPlaying) {
      startAutoplay();
    }

    if (isAnimating) {
      queuedDirection = normalizedDirection;
      return;
    }

    move(normalizedDirection);
  }

  function move(direction) {
    const nextIndex = wrapIndex(activeIndex + direction, slides.length);
    const activeSlide = slides[activeIndex];
    const nextSlide = slides[nextIndex];
    const distance = getSlideCenter(nextSlide) - getSlideCenter(activeSlide);
    const shouldReduceMotion = isReducedMotion();

    preloadSlideWindow(slides, nextIndex);
    syncSlides(slides, nextIndex);
    updateSlideDepth(slides, nextIndex, !shouldReduceMotion && distance !== 0);

    if (shouldReduceMotion || distance === 0) {
      activeIndex = nextIndex;
      arrangeSlides(track, slides, activeIndex);
      currentOffset = recenterActive(
        root,
        track,
        slides[activeIndex],
        currentOffset,
      );
      flushQueuedMove();
      return;
    }

    isAnimating = true;
    const startOffset = getRenderedOffset(track, currentOffset);
    currentOffset -= distance;
    movementTween = animateSliderMove(
      track,
      nextSlide,
      startOffset,
      currentOffset,
      INCOMING_SLIDE_DELAY,
      () => {
        movementTween = null;
        isAnimating = false;
        activeIndex = nextIndex;
        arrangeSlides(track, slides, activeIndex);
        currentOffset = recenterActive(
          root,
          track,
          slides[activeIndex],
          currentOffset,
        );
        flushQueuedMove();
      },
    );
  }

  function cancelMovement() {
    movementTween?.kill();
    movementTween = null;
    gsap.killTweensOf(track);
    gsap.set(slides, { x: 0, force3D: true });
    isAnimating = false;
    queuedDirection = 0;
  }

  function flushQueuedMove() {
    if (!queuedDirection) {
      return;
    }

    const direction = queuedDirection;
    queuedDirection = 0;
    move(direction);
  }

  function enableAutoplay(shouldAdvance = false) {
    isPlaying = true;

    if (shouldAdvance) {
      queueMove(1);
    }

    startAutoplay();
    updateControlsState(controls, isPlaying);
  }

  function disableAutoplay() {
    isPlaying = false;
    stopAutoplay();
    updateControlsState(controls, isPlaying);
  }

  function startAutoplay() {
    if (!isPlaying) {
      return;
    }

    stopAutoplay();
    autoplayTimerId = window.setInterval(() => {
      queueMove(1);
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (!autoplayTimerId) {
      return;
    }

    window.clearInterval(autoplayTimerId);
    autoplayTimerId = null;
  }
}

function decorateSlider(root, track, slides) {
  sliderId += 1;

  if (!track.id) {
    track.id = `bemke-home-slider-track-${sliderId}`;
  }

  if (!root.hasAttribute("role")) {
    root.setAttribute("role", "region");
  }

  if (!root.hasAttribute("aria-roledescription")) {
    root.setAttribute("aria-roledescription", "karuzela");
  }

  if (
    !root.hasAttribute("aria-label") &&
    !root.hasAttribute("aria-labelledby")
  ) {
    root.setAttribute("aria-label", getSliderLabel(root));
  }

  if (!root.hasAttribute("tabindex")) {
    root.setAttribute("tabindex", "0");
  }

  track.setAttribute("aria-live", "polite");
  track.setAttribute("aria-atomic", "false");

  slides.forEach((slide, index) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slajd");
    slide.setAttribute("aria-label", `Slajd ${index + 1} z ${slides.length}`);
  });
}

function bindControls(controls, track, handlers) {
  bindControl(controls.pause, "Pauza autoplay", track.id, handlers.onPause);
  bindControl(controls.play, "Start autoplay", track.id, handlers.onPlay);
  bindControl(controls.prev, "Poprzedni slajd", track.id, handlers.onPrev);
  bindControl(controls.next, "Następny slajd", track.id, handlers.onNext);
}

function bindControl(control, label, controlsId, handler) {
  bindSliderControl(control, { label, controlsId, handler });
}

function focusControl(control) {
  if (!control || document.activeElement === control) {
    return;
  }

  control.focus({ preventScroll: true });
}

function getControls(root) {
  return getSliderControls(root, CONTROLS_SELECTOR);
}

function updateControlsState(controls, isPlaying) {
  if (controls.play) {
    controls.play.classList.toggle("is-disabled", isPlaying);
    controls.play.setAttribute("aria-disabled", isPlaying ? "true" : "false");
  }

  if (controls.pause) {
    controls.pause.classList.toggle("is-disabled", !isPlaying);
    controls.pause.setAttribute("aria-disabled", !isPlaying ? "true" : "false");
  }
}

function getInitialActiveIndex(slides) {
  const activeIndex = slides.findIndex(
    (slide) => slide.getAttribute(ACTIVE_ATTR) === "1",
  );
  return activeIndex >= 0 ? activeIndex : 0;
}

function arrangeSlides(track, slides, activeIndex) {
  removeGhostSlides(track);

  const orderedSlides = [];

  for (let offset = -1; offset < slides.length - 1; offset += 1) {
    orderedSlides.push(slides[wrapIndex(activeIndex + offset, slides.length)]);
  }

  track.appendChild(
    createGhostSlide(slides[wrapIndex(activeIndex - 2, slides.length)]),
  );

  orderedSlides.forEach((slide) => {
    track.appendChild(slide);
  });

  track.appendChild(
    createGhostSlide(slides[wrapIndex(activeIndex - 1, slides.length)]),
  );
}

function syncSlides(slides, activeIndex) {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.setAttribute(ACTIVE_ATTR, isActive ? "1" : "0");
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    slide.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function updateSlideDepth(slides, activeIndex, shouldAnimate) {
  const activeSlide = slides[activeIndex];
  const sideSlides = slides.filter((_, index) => index !== activeIndex);

  gsap.killTweensOf(slides, "scale");

  slides.forEach((slide, index) => {
    slide.style.zIndex = index === activeIndex ? "2" : "1";
  });

  if (!shouldAnimate) {
    gsap.set(sideSlides, { scale: SIDE_SLIDE_SCALE });
    gsap.set(activeSlide, { scale: 1 });
    return;
  }

  gsap.to(sideSlides, {
    scale: SIDE_SLIDE_SCALE,
    duration: ANIMATION_DURATION,
    ease: ANIMATION_EASE,
    overwrite: "auto",
  });

  gsap.to(activeSlide, {
    scale: 1,
    duration: ANIMATION_DURATION,
    delay: INCOMING_SLIDE_DELAY,
    ease: ANIMATION_EASE,
    overwrite: "auto",
  });
}

function createGhostSlide(sourceSlide) {
  const ghost = sourceSlide.cloneNode(true);

  ghost.classList.add(GHOST_CLASS);
  ghost.setAttribute(ACTIVE_ATTR, "0");
  ghost.setAttribute("aria-hidden", "true");
  ghost.removeAttribute("aria-current");
  ghost.removeAttribute("id");
  ghost.setAttribute("tabindex", "-1");
  ghost.style.zIndex = "1";
  gsap.set(ghost, { scale: SIDE_SLIDE_SCALE });

  if ("inert" in ghost) {
    ghost.inert = true;
  }

  ghost.querySelectorAll("[id]").forEach((node) => {
    node.removeAttribute("id");
  });

  ghost
    .querySelectorAll("a, button, input, select, textarea, [tabindex]")
    .forEach((node) => {
      node.setAttribute("tabindex", "-1");
    });

  prepareSlideImages(ghost);

  return ghost;
}

function removeGhostSlides(track) {
  track
    .querySelectorAll(`:scope > ${SLIDE_SELECTOR}.${GHOST_CLASS}`)
    .forEach((slide) => {
      slide.remove();
    });
}

function prepareSlideMedia(slides, activeIndex) {
  slides.forEach((slide) => {
    prepareSlideImages(slide);
  });

  preloadSlideWindow(slides, activeIndex);
}

function prepareSlideImages(scope, shouldPreload = false, isActive = false) {
  scope.querySelectorAll("img").forEach((image) => {
    image.setAttribute("draggable", "false");
    image.setAttribute("loading", shouldPreload ? "eager" : "lazy");
    image.setAttribute("decoding", "async");
    image.setAttribute("fetchpriority", isActive ? "auto" : "low");
    image.draggable = false;

    if (shouldPreload) {
      preloadImage(image, isActive ? "auto" : "low");
    }
  });
}

function preloadSlideWindow(slides, activeIndex) {
  [-1, 0, 1].forEach((offset) => {
    const slide = slides[wrapIndex(activeIndex + offset, slides.length)];

    if (slide) {
      prepareSlideImages(slide, true, offset === 0);
    }
  });
}

function preloadImage(image, fetchPriority = "low") {
  const src = image.currentSrc || image.getAttribute("src") || image.src;

  if (
    !src ||
    pendingImagePreloads.has(image) ||
    (image.complete && image.naturalWidth > 0)
  ) {
    return;
  }

  const preload = new Image();
  const srcset = image.getAttribute("srcset");
  const sizes = image.getAttribute("sizes");

  if (srcset) {
    preload.srcset = srcset;
  }

  if (sizes) {
    preload.sizes = sizes;
  }

  preload.decoding = "async";
  preload.fetchPriority = fetchPriority;

  const releasePreload = () => {
    imagePreloads.delete(preload);
    pendingImagePreloads.delete(image);
  };

  preload.onload = () => {
    releasePreload();
    image.decode?.().catch(() => {});
  };
  preload.onerror = releasePreload;
  pendingImagePreloads.add(image);
  imagePreloads.add(preload);
  preload.src = src;
}

function recenterActive(root, track, activeSlide, currentOffset) {
  if (!activeSlide) {
    return currentOffset;
  }

  root.classList.add(RESETTING_CLASS);

  const nextOffset =
    currentOffset + getRootCenter(root) - getSlideCenter(activeSlide);
  applyOffset(track, nextOffset);
  track.offsetHeight;

  window.requestAnimationFrame(() => {
    root.classList.remove(RESETTING_CLASS);
  });

  return nextOffset;
}

function getRootCenter(root) {
  const rect = root.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

function getSlideCenter(slide) {
  const rect = slide.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

function applyOffset(track, offset) {
  gsap.set(track, { x: offset, force3D: true });
}

function animateOffset(track, offset, duration, ease, onComplete) {
  return gsap.to(track, {
    x: offset,
    duration,
    ease,
    force3D: true,
    overwrite: "auto",
    onComplete,
  });
}

function animateSliderMove(
  track,
  incomingSlide,
  startOffset,
  targetOffset,
  incomingDelay,
  onComplete,
) {
  const motion = {
    trackProgress: 0,
    incomingProgress: 0,
  };
  const distance = targetOffset - startOffset;

  gsap.killTweensOf(track);
  gsap.killTweensOf(incomingSlide, "x");
  gsap.set(incomingSlide, { x: 0, force3D: true });

  const timeline = gsap.timeline({
    onUpdate: () => {
      applyOffset(track, startOffset + distance * motion.trackProgress);
      gsap.set(incomingSlide, {
        x: distance * (motion.incomingProgress - motion.trackProgress),
        force3D: true,
      });
    },
    onComplete: () => {
      applyOffset(track, targetOffset);
      gsap.set(incomingSlide, { x: 0, force3D: true });
      onComplete?.();
    },
    onInterrupt: () => {
      gsap.set(incomingSlide, { x: 0, force3D: true });
    },
  });

  timeline.to(
    motion,
    {
      trackProgress: 1,
      duration: ANIMATION_DURATION,
      ease: ANIMATION_EASE,
    },
    0,
  );

  timeline.to(
    motion,
    {
      incomingProgress: 1,
      duration: ANIMATION_DURATION,
      ease: ANIMATION_EASE,
    },
    incomingDelay,
  );

  return timeline;
}

function snapToOffset(track, offset) {
  if (isReducedMotion()) {
    applyOffset(track, offset);
    return;
  }

  animateOffset(track, offset, SNAP_DURATION, SNAP_EASE);
}

function getRenderedOffset(track, fallback) {
  const offset = Number(gsap.getProperty(track, "x"));
  return Number.isFinite(offset) ? offset : fallback;
}

function getSliderLabel(root) {
  const heading = root.closest("section")?.querySelector("h1, h2, h3");
  const label = heading?.textContent?.replace(/\s+/g, " ").trim();

  return label ? `Slider: ${label}` : "Slider zdjęć";
}

function isFormControl(target) {
  return Boolean(
    target?.closest?.(
      'input, textarea, select, button, [contenteditable="true"]',
    ),
  );
}

function wrapIndex(index, total) {
  return (index + total) % total;
}

function debounce(fn, delay) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

