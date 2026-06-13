const rootSelector = '.slider:not(.slider-thinktank)';
const trackSelector = '.slider-wrapper';
const slideSelector = '.slide';
const controlsSelector = '.slider-paggination';
const arrowSelector = '.arrow';
const readyAttribute = 'data-bemke-slider-ready';
const activeAttribute = 'slide-active';
const bootedKey = '__bemkeHomeSliderBooted';
const resettingClass = 'is-resetting';
const draggingClass = 'is-dragging';
const ghostClass = 'is-ghost';
const transitionMs = 640;
const dragThreshold = 46;

let sliderId = 0;

const wrapIndex = (index, length) => (index + length) % length;

const debounce = (callback, delay) => {
  let timeout;

  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delay);
  };
};

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isFormField = (element) =>
  Boolean(element?.closest?.('input, textarea, select, button, [contenteditable="true"]'));

const focusControl = (control) => {
  if (!control || document.activeElement === control) {
    return;
  }

  control.focus({ preventScroll: true });
};

const sliderLabel = (root) => {
  const heading = root
    .closest('section')
    ?.querySelector('h1, h2, h3')
    ?.textContent?.replace(/\s+/g, ' ')
    .trim();

  return heading ? `Slider: ${heading}` : 'Slider zdjec';
};

const slideCenter = (slide) => {
  const rect = slide.getBoundingClientRect();

  return rect.left + rect.width / 2;
};

const rootCenter = (root) => {
  const rect = root.getBoundingClientRect();

  return rect.left + rect.width / 2;
};

const setTrackOffset = (track, offset) => {
  track.style.transform = `translate3d(${offset}px, 0, 0)`;
};

const prepareImages = (slide) => {
  slide.querySelectorAll('img').forEach((image) => {
    image.setAttribute('draggable', 'false');
    image.setAttribute('decoding', 'async');
    image.draggable = false;
  });
};

const removeGhostSlides = (track) => {
  track.querySelectorAll(`:scope > ${slideSelector}.${ghostClass}`).forEach((slide) => {
    slide.remove();
  });
};

const makeGhostSlide = (slide) => {
  const clone = slide.cloneNode(true);

  clone.classList.add(ghostClass);
  clone.setAttribute(activeAttribute, '0');
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('aria-current');
  clone.removeAttribute('id');
  clone.setAttribute('tabindex', '-1');

  if ('inert' in clone) {
    clone.inert = true;
  }

  clone.querySelectorAll('[id]').forEach((element) => {
    element.removeAttribute('id');
  });

  clone
    .querySelectorAll('a, button, input, select, textarea, [tabindex]')
    .forEach((element) => {
      element.setAttribute('tabindex', '-1');
    });

  prepareImages(clone);

  return clone;
};

const reorderSlides = (track, slides, activeIndex) => {
  removeGhostSlides(track);

  const orderedSlides = [];

  for (let offset = -1; offset < slides.length - 1; offset += 1) {
    orderedSlides.push(slides[wrapIndex(activeIndex + offset, slides.length)]);
  }

  track.appendChild(makeGhostSlide(slides[wrapIndex(activeIndex - 2, slides.length)]));
  orderedSlides.forEach((slide) => {
    track.appendChild(slide);
  });
  track.appendChild(makeGhostSlide(slides[wrapIndex(activeIndex - 1, slides.length)]));
};

const setActiveSlide = (slides, activeIndex) => {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;

    slide.setAttribute(activeAttribute, isActive ? '1' : '0');
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    slide.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
};

const centerSlide = (root, track, slide, currentOffset) => {
  if (!slide) {
    return currentOffset;
  }

  root.classList.add(resettingClass);

  const nextOffset = currentOffset + rootCenter(root) - slideCenter(slide);

  setTrackOffset(track, nextOffset);
  track.offsetHeight;

  window.requestAnimationFrame(() => {
    root.classList.remove(resettingClass);
  });

  return nextOffset;
};

const findInitialIndex = (slides) => {
  const activeIndex = slides.findIndex((slide) => slide.getAttribute(activeAttribute) === '1');

  return activeIndex >= 0 ? activeIndex : 0;
};

const prepareStructure = (root, track, slides) => {
  sliderId += 1;
  track.id ||= `bemke-home-slider-track-${sliderId}`;

  if (!root.hasAttribute('role')) {
    root.setAttribute('role', 'region');
  }

  if (!root.hasAttribute('aria-roledescription')) {
    root.setAttribute('aria-roledescription', 'karuzela');
  }

  if (!root.hasAttribute('aria-label') && !root.hasAttribute('aria-labelledby')) {
    root.setAttribute('aria-label', sliderLabel(root));
  }

  if (!root.hasAttribute('tabindex')) {
    root.setAttribute('tabindex', '0');
  }

  track.setAttribute('aria-live', 'polite');
  track.setAttribute('aria-atomic', 'false');

  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slajd');
    slide.setAttribute('aria-label', `Slajd ${index + 1} z ${slides.length}`);
  });
};

const getControls = (root) => {
  const controls = root.querySelector(controlsSelector);
  const arrows = controls ? Array.from(controls.querySelectorAll(arrowSelector)) : [];

  return {
    prev: arrows[0] ?? null,
    next: arrows[1] ?? null,
  };
};

const bindControl = (control, label, trackId, callback) => {
  if (!control || typeof callback !== 'function') {
    return;
  }

  control.setAttribute('role', 'button');
  control.setAttribute('tabindex', '0');
  control.setAttribute('aria-label', label);
  control.setAttribute('aria-controls', trackId);

  control.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  });

  control.addEventListener('click', callback);
  control.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    callback();
  });
};

const bindControls = (controls, track, callbacks) => {
  bindControl(controls.prev, 'Poprzedni slajd', track.id, callbacks.onPrev);
  bindControl(controls.next, 'Nastepny slajd', track.id, callbacks.onNext);
};

const initSlider = (root) => {
  const track = root.querySelector(trackSelector);
  const slides = track ? Array.from(track.querySelectorAll(`:scope > ${slideSelector}`)) : [];

  if (!track || slides.length < 2) {
    return;
  }

  const controls = getControls(root);
  let activeIndex = findInitialIndex(slides);
  let trackOffset = 0;
  let isAnimating = false;
  let queuedDirection = 0;
  let transitionTimeout = null;
  let dragState = null;

  root.setAttribute(readyAttribute, '1');
  slides.forEach((slide) => prepareImages(slide));
  prepareStructure(root, track, slides);
  bindControls(controls, track, {
    onPrev: () => goToDirection(-1),
    onNext: () => goToDirection(1),
  });

  root.addEventListener('keydown', (event) => {
    if (isFormField(event.target)) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusControl(controls.prev);
      goToDirection(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusControl(controls.next);
      goToDirection(1);
    }
  });

  track.addEventListener('pointerdown', (event) => {
    if (isAnimating || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    dragState = {
      dragged: false,
      id: event.pointerId,
      lockedAxis: null,
      offset: trackOffset,
      startX: event.clientX,
      startY: event.clientY,
    };

    try {
      track.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded browsers do not support pointer capture on this node.
    }
  });

  track.addEventListener('pointermove', (event) => {
    if (!dragState || dragState.id !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!dragState.lockedAxis && (absX > 8 || absY > 8)) {
      dragState.lockedAxis = absX > absY ? 'x' : 'y';
    }

    if (dragState.lockedAxis === 'x') {
      event.preventDefault();
      dragState.dragged = true;
      track.classList.add(draggingClass);
      setTrackOffset(track, dragState.offset + deltaX * 0.36);
    }
  });

  track.addEventListener('pointerup', (event) => {
    if (!dragState || dragState.id !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const shouldChangeSlide =
      dragState.dragged && Math.abs(deltaX) > dragThreshold && Math.abs(deltaX) > Math.abs(deltaY);

    dragState = null;
    track.classList.remove(draggingClass);

    if (shouldChangeSlide) {
      goToDirection(deltaX < 0 ? 1 : -1);
      return;
    }

    setTrackOffset(track, trackOffset);
  });

  track.addEventListener('pointercancel', () => {
    dragState = null;
    track.classList.remove(draggingClass);
    setTrackOffset(track, trackOffset);
  });

  const refresh = () => {
    reorderSlides(track, slides, activeIndex);
    setActiveSlide(slides, activeIndex);
    trackOffset = centerSlide(root, track, slides[activeIndex], trackOffset);
  };

  window.addEventListener(
    'resize',
    debounce(() => {
      refresh();
    }, 120),
  );

  root.__bemkeHomeSliderRefresh = refresh;
  refresh();

  function goToDirection(direction) {
    const normalizedDirection = direction < 0 ? -1 : 1;

    if (isAnimating) {
      queuedDirection = normalizedDirection;
      return;
    }

    changeSlide(normalizedDirection);
  }

  function changeSlide(direction) {
    const nextIndex = wrapIndex(activeIndex + direction, slides.length);
    const currentSlide = slides[activeIndex];
    const nextSlide = slides[nextIndex];
    const slideDelta = slideCenter(nextSlide) - slideCenter(currentSlide);

    setActiveSlide(slides, nextIndex);

    if (prefersReducedMotion() || slideDelta === 0) {
      activeIndex = nextIndex;
      refresh();
      flushQueue();
      return;
    }

    isAnimating = true;
    trackOffset -= slideDelta;
    setTrackOffset(track, trackOffset);

    window.clearTimeout(transitionTimeout);
    transitionTimeout = window.setTimeout(() => {
      transitionTimeout = null;
      isAnimating = false;
      activeIndex = nextIndex;
      refresh();
      flushQueue();
    }, transitionMs + 40);
  }

  function flushQueue() {
    if (!queuedDirection) {
      return;
    }

    const direction = queuedDirection;

    queuedDirection = 0;
    changeSlide(direction);
  }
};

const initSliders = (context = document) => {
  context.querySelectorAll(rootSelector).forEach((root) => {
    if (root.getAttribute(readyAttribute) === '1') {
      root.__bemkeHomeSliderRefresh?.();
      return;
    }

    initSlider(root);
  });
};

const bindSliderBootEvents = () => {
  if (window[bootedKey]) {
    return;
  }

  window[bootedKey] = true;

  const refresh = debounce(() => {
    initSliders();
  }, 90);

  window.addEventListener('load', refresh);
  document.addEventListener('bricks/ajax/end', refresh);
  window.setTimeout(refresh, 200);
  window.setTimeout(refresh, 800);

  if (window.MutationObserver && document.body) {
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (node.matches(rootSelector) || node.querySelector(rootSelector)) {
            refresh();
            return;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
};

export const initBricksSliders = () => {
  initSliders();
  bindSliderBootEvents();
};
