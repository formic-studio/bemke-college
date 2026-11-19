import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from './motion-preference.js';

const TRACK_SELECTOR = '.infinity-loop-block';
const ITEM_SELECTOR = ':scope > .img-wrapper';
const READY_ATTRIBUTE = 'data-bemke-infinite-loop-ready';
const CLONE_ATTRIBUTE = 'data-bemke-infinite-loop-clone';
const SPEED_PX_PER_SECOND = 36;
const DRAG_THRESHOLD_PX = 6;

function getInterfaceCopy() {
  const isPolish = document.documentElement.lang.toLowerCase().startsWith('pl');

  return isPolish
    ? {
        label: 'Posty Bemke College na Instagramie',
        instructions:
          'Karuzela postów na Instagramie. Przeciągnij myszką lub palcem albo użyj strzałek w lewo i w prawo. Każdy post jest dostępny jako osobny link.',
        pause: 'Pauza',
        resume: 'Wznów',
        motionDisabled: 'Animacja wyłączona',
        controlsLabel: 'Sterowanie karuzelą postów',
        previous: 'Pokaż poprzednie posty',
        next: 'Pokaż następne posty',
      }
    : {
        label: 'Bemke College Instagram posts',
        instructions:
          'Instagram posts carousel. Drag with a mouse or touch, or use the Left and Right Arrow keys. Every post is available as a separate link.',
        pause: 'Pause',
        resume: 'Resume',
        motionDisabled: 'Animation off',
        controlsLabel: 'Post carousel controls',
        previous: 'Show previous posts',
        next: 'Show next posts',
      };
}

function addAccessibleControls(track, items) {
  const viewport = track.parentElement;

  if (!viewport) {
    return null;
  }

  const copy = getInterfaceCopy();
  const baseId = track.id || `bemke-instagram-loop-${Date.now()}`;
  const instructions = document.createElement('span');
  const controls = document.createElement('div');
  const previous = document.createElement('button');
  const toggle = document.createElement('button');
  const next = document.createElement('button');

  viewport.classList.add('bemke-infinity-loop-viewport');
  instructions.id = `${baseId}-instructions`;
  instructions.className = 'bemke-infinity-loop-instructions';
  instructions.textContent = copy.instructions;

  toggle.type = 'button';
  toggle.className = 'bemke-infinity-loop-toggle';
  previous.type = 'button';
  previous.className = 'bemke-infinity-loop-step';
  previous.textContent = '←';
  previous.setAttribute('aria-label', copy.previous);
  next.type = 'button';
  next.className = 'bemke-infinity-loop-step';
  next.textContent = '→';
  next.setAttribute('aria-label', copy.next);

  controls.className = 'bemke-infinity-loop-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', copy.controlsLabel);
  controls.append(previous, toggle, next);

  track.id = baseId;
  previous.setAttribute('aria-controls', track.id);
  toggle.setAttribute('aria-controls', track.id);
  next.setAttribute('aria-controls', track.id);
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', copy.label);
  track.setAttribute('aria-describedby', instructions.id);
  track.setAttribute('tabindex', '0');

  items.forEach((item, index) => {
    const hasAccessibleContent =
      item.textContent.trim() || item.querySelector('img[alt]:not([alt=""])');

    if (!item.hasAttribute('aria-label') && !hasAccessibleContent) {
      item.setAttribute(
        'aria-label',
        document.documentElement.lang.toLowerCase().startsWith('pl')
          ? `Otwórz post na Instagramie ${index + 1} z ${items.length}`
          : `Open Instagram post ${index + 1} of ${items.length}`,
      );
    }
  });

  viewport.insertBefore(instructions, track);
  viewport.insertBefore(controls, track);

  return { copy, next, previous, toggle };
}

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

  const controls = addAccessibleControls(track, items);

  const clones = items.map((item) => {
    const clone = item.cloneNode(true);
    disableCloneInteraction(clone);
    return clone;
  });
  const queryTrail = track.querySelector(':scope > .brx-query-trail');

  if (queryTrail) {
    queryTrail.setAttribute('aria-hidden', 'true');
    queryTrail.setAttribute('tabindex', '-1');
  }

  clones.forEach((clone) => track.insertBefore(clone, queryTrail));

  let offset = 0;
  let loopDistance = 0;
  let previousTime = null;
  let animationFrame = null;
  let pointerPaused = false;
  let focusPaused = false;
  let userPaused = false;
  let visible = true;
  let dragging = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let dragMoved = false;
  let suppressClickUntil = 0;

  const normalizeOffset = (value) => {
    if (loopDistance <= 0) {
      return 0;
    }

    return ((value % loopDistance) + loopDistance) % loopDistance;
  };

  const applyOffset = (value) => {
    offset = normalizeOffset(value);
    track.style.setProperty('--bemke-infinity-loop-offset', `${-offset}px`);
  };

  const shouldAnimate = () =>
    !isReducedMotion() &&
    !userPaused &&
    !pointerPaused &&
    !focusPaused &&
    !dragging &&
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

    applyOffset(offset + SPEED_PX_PER_SECOND * elapsed);

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
      offset = normalizeOffset(offset);
    } else {
      offset = 0;
    }

    track.style.setProperty('--bemke-infinity-loop-offset', `${-offset}px`);
    syncAnimation();
  };

  const syncPausedState = () => {
    const reducedMotion = isReducedMotion();
    const paused =
      reducedMotion || userPaused || pointerPaused || focusPaused || dragging;

    track.classList.toggle('is-paused', paused);
    track.classList.toggle('is-dragging', dragging);

    if (!controls) {
      return;
    }

    controls.toggle.setAttribute(
      'aria-pressed',
      String(reducedMotion || userPaused),
    );
    controls.toggle.setAttribute('aria-disabled', String(reducedMotion));
    controls.toggle.textContent = reducedMotion
      ? controls.copy.motionDisabled
      : userPaused
        ? controls.copy.resume
        : controls.copy.pause;
  };

  const syncMotionPreference = () => {
    track.classList.toggle('is-motion-reduced', isReducedMotion());
    syncPausedState();
    syncAnimation();
  };

  const handlePointerEnter = () => {
    pointerPaused = true;
    syncPausedState();
    syncAnimation();
  };

  const handlePointerLeave = () => {
    pointerPaused = false;
    syncPausedState();
    syncAnimation();
  };

  const revealFocusedItem = (item) => {
    const viewport = track.parentElement;

    if (!viewport || loopDistance <= 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const inset = 16;

      if (itemRect.left < viewportRect.left + inset) {
        applyOffset(offset + itemRect.left - viewportRect.left - inset);
      } else if (itemRect.right > viewportRect.right - inset) {
        applyOffset(offset + itemRect.right - viewportRect.right + inset);
      }
    });
  };

  const handleFocusIn = (event) => {
    focusPaused = true;
    const item =
      event.target instanceof Element
        ? event.target.closest('.img-wrapper:not([data-bemke-infinite-loop-clone])')
        : null;

    if (item && track.contains(item)) {
      revealFocusedItem(item);
    }

    syncPausedState();
    syncAnimation();
  };

  const handleFocusOut = (event) => {
    if (event.relatedTarget instanceof Node && track.contains(event.relatedTarget)) {
      return;
    }

    focusPaused = false;
    syncPausedState();
    syncAnimation();
  };

  const finishDrag = (event) => {
    if (!dragging || event.pointerId !== dragPointerId) {
      return;
    }

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    dragging = false;
    dragPointerId = null;
    suppressClickUntil = dragMoved ? window.performance.now() + 500 : 0;
    pointerPaused = false;

    if (dragMoved) {
      focusPaused = false;

      if (
        document.activeElement instanceof HTMLElement &&
        track.contains(document.activeElement)
      ) {
        document.activeElement.blur();
      }
    }

    syncPausedState();
    syncAnimation();
  };

  const handlePointerDown = (event) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || loopDistance <= 0) {
      return;
    }

    dragging = true;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    dragMoved = false;
    track.setPointerCapture(event.pointerId);
    syncPausedState();
    syncAnimation();
  };

  const handlePointerMove = (event) => {
    if (!dragging || event.pointerId !== dragPointerId) {
      return;
    }

    const distance = event.clientX - dragStartX;

    if (Math.abs(distance) >= DRAG_THRESHOLD_PX) {
      dragMoved = true;
    }

    if (!dragMoved) {
      return;
    }

    event.preventDefault();
    applyOffset(dragStartOffset - distance);
  };

  const getManualStep = (large = false) => {
    const viewportWidth = track.parentElement?.clientWidth || window.innerWidth;
    const baseStep = Math.max(80, Math.min(240, viewportWidth * 0.2));

    return large ? baseStep * 2 : baseStep;
  };

  const moveManually = (direction, large = false) => {
    applyOffset(offset + direction * getManualStep(large));
    syncAnimation();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    moveManually(event.key === 'ArrowRight' ? 1 : -1, event.shiftKey);
  };

  const handleToggle = () => {
    if (isReducedMotion()) {
      return;
    }

    userPaused = !userPaused;
    syncPausedState();
    syncAnimation();
  };

  track.addEventListener('pointerenter', handlePointerEnter);
  track.addEventListener('pointerleave', handlePointerLeave);
  track.addEventListener('pointerdown', handlePointerDown);
  track.addEventListener('pointermove', handlePointerMove);
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('keydown', handleKeyDown);
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('click', (event) => {
    if (window.performance.now() >= suppressClickUntil) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }, true);
  track.addEventListener('focusin', handleFocusIn);
  track.addEventListener('focusout', handleFocusOut);
  controls?.toggle.addEventListener('click', handleToggle);
  controls?.previous.addEventListener('click', () => moveManually(-1));
  controls?.next.addEventListener('click', () => moveManually(1));
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
    image.draggable = false;
    image.setAttribute('draggable', 'false');

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
