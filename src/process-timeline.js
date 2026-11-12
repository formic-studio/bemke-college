import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from './motion-preference.js';

const PROCESS_SELECTOR = '.process-block';
const LINE_SELECTOR = ':scope > .proces-line';
const ITEM_SELECTOR = ':scope > .proces-item';
const READY_ATTRIBUTE = 'data-bemke-process-ready';
const COMPLETE_ATTRIBUTE = 'data-bemke-process-complete';
const MOBILE_QUERY = '(max-width: 991px)';

const setCustomProperty = (element, property, value) => {
  if (element.style.getPropertyValue(property) === value) {
    return;
  }

  element.style.setProperty(property, value);
};

const createDots = (line, count) =>
  Array.from({ length: count }, () => {
    const dot = document.createElement('span');

    dot.className = 'proces-line__dot';
    dot.setAttribute('aria-hidden', 'true');
    line.append(dot);

    return dot;
  });

const clearAnimationStyles = (state) => {
  gsap.set([state.line, ...state.items], {
    clearProps: 'clipPath,opacity,transform,visibility,willChange',
  });
};

const killAnimation = (state) => {
  state.animation?.scrollTrigger?.kill();
  state.animation?.kill();
  gsap.killTweensOf([state.line, ...state.items]);
  state.animation = null;
};

const syncMobileAxis = (state) => {
  if (!state.mobileQuery.matches || state.items.length < 2) {
    state.block.style.removeProperty('--process-mobile-axis-top');
    state.block.style.removeProperty('--process-mobile-axis-height');
    state.line.style.removeProperty('top');
    state.line.style.removeProperty('height');
    state.line.style.removeProperty('background-position');
    state.line.style.removeProperty('background-size');
    return;
  }

  const axisOffset =
    Number.parseFloat(
      window
        .getComputedStyle(state.block)
        .getPropertyValue('--process-mobile-axis-offset'),
    ) || 7;
  const dotPositions = state.items.map((item) => item.offsetTop + axisOffset);
  const firstDotPosition = dotPositions[0];
  const lastDotPosition = dotPositions[dotPositions.length - 1];
  const height = Math.max(0, lastDotPosition - firstDotPosition);
  const lineTop = firstDotPosition - 5;
  const lineHeight = height + 10;

  setCustomProperty(
    state.block,
    '--process-mobile-axis-top',
    `${firstDotPosition}px`,
  );

  setCustomProperty(
    state.block,
    '--process-mobile-axis-height',
    `${height}px`,
  );

  state.line.style.setProperty('top', `${lineTop}px`, 'important');
  state.line.style.setProperty('height', `${lineHeight}px`, 'important');
  state.line.style.setProperty('background-position', 'center 5px');
  state.line.style.setProperty('background-size', `1px ${height}px`);

  state.dots.forEach((dot, index) => {
    dot.style.top = `${5 + dotPositions[index] - firstDotPosition}px`;
  });
};

const syncDesktopLayout = (state) => {
  if (state.mobileQuery.matches) {
    return;
  }

  const step = Math.min(
    173.333,
    Math.max(140, window.innerWidth * 0.086667),
  );
  const axisHeight = step * Math.max(1, state.items.length - 1);

  setCustomProperty(
    state.block,
    '--process-axis-height',
    `${axisHeight}px`,
  );

  state.items.forEach((item, index) => {
    const position =
      state.items.length === 4 && index === 3 ? 2.5 : index;

    setCustomProperty(item, '--process-item-top', `${position * step}px`);
  });

  state.dots.forEach((dot, index) => {
    const progress =
      state.dots.length === 1 ? 0 : index / (state.dots.length - 1);

    dot.style.top = `${5 + progress * axisHeight}px`;
  });

  const minimumTail = Math.min(
    64,
    Math.max(52, window.innerWidth * 0.0325),
  );
  const contentBottom = Math.max(
    ...state.items.map((item) => {
      const top = Number.parseFloat(
        item.style.getPropertyValue('--process-item-top'),
      );

      return top + item.offsetHeight;
    }),
  );
  const blockHeight = Math.max(axisHeight + minimumTail, contentBottom);

  setCustomProperty(
    state.block,
    '--process-block-height',
    `${Math.ceil(blockHeight)}px`,
  );
};

const syncLayout = (state) => {
  syncDesktopLayout(state);
  syncMobileAxis(state);
};

const showWithoutMotion = (state) => {
  killAnimation(state);
  clearAnimationStyles(state);
  state.block.setAttribute(COMPLETE_ATTRIBUTE, '1');
};

const completeAnimation = (state) => {
  state.block.setAttribute(COMPLETE_ATTRIBUTE, '1');
  clearAnimationStyles(state);
};

const createAnimation = (state) => {
  killAnimation(state);

  if (state.block.getAttribute(COMPLETE_ATTRIBUTE) === '1') {
    clearAnimationStyles(state);
    return;
  }

  gsap.set(state.line, {
    clipPath: 'inset(0 0 100% 0)',
    willChange: 'clip-path',
  });
  gsap.set(state.items, {
    opacity: 0,
    visibility: 'visible',
    y: 18,
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: 'power2.out',
    },
    scrollTrigger: {
      invalidateOnRefresh: true,
      once: true,
      start: 'top 78%',
      trigger: state.block,
    },
    onComplete: () => completeAnimation(state),
    onStart: () => {
      gsap.set(state.items, { willChange: 'transform, opacity' });
    },
  });

  timeline.to(state.line, {
    clipPath: 'inset(0 0 0% 0)',
    duration: 1.8,
    ease: 'power1.inOut',
  });

  state.items.forEach((item, index) => {
    const progress =
      state.items.length === 1 ? 0 : index / (state.items.length - 1);

    timeline.to(
      item,
      {
        duration: 0.72,
        opacity: 1,
        y: 0,
      },
      0.12 + progress * 1.38,
    );
  });

  state.animation = timeline;
};

const prepareBlock = (block) => {
  if (block.getAttribute(READY_ATTRIBUTE) === '1') {
    return null;
  }

  const line = block.querySelector(LINE_SELECTOR);
  const items = Array.from(block.querySelectorAll(ITEM_SELECTOR));

  if (!line || !items.length) {
    return null;
  }

  block.setAttribute('role', 'list');
  line.setAttribute('aria-hidden', 'true');

  items.forEach((item, index) => {
    item.setAttribute('role', 'listitem');
    item.dataset.processSide = index % 2 === 0 ? 'right' : 'left';
  });

  const dots = createDots(line, items.length);

  block.setAttribute(READY_ATTRIBUTE, '1');

  const state = {
    animation: null,
    block,
    dots,
    items,
    line,
    mobileQuery: window.matchMedia(MOBILE_QUERY),
    resizeObserver: null,
  };

  syncLayout(state);

  if ('ResizeObserver' in window) {
    state.resizeObserver = new ResizeObserver(() => {
      syncLayout(state);
      ScrollTrigger.refresh();
    });
    state.resizeObserver.observe(block);
    state.items.forEach((item) => state.resizeObserver.observe(item));
  } else {
    window.addEventListener('resize', () => syncLayout(state), {
      passive: true,
    });
  }

  return state;
};

export const initProcessTimelines = (scope = document) => {
  const blocks = gsap.utils.toArray(PROCESS_SELECTOR, scope);

  if (!blocks.length) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const states = blocks.map(prepareBlock).filter(Boolean);

  if (!states.length) {
    return;
  }

  const syncAnimations = () => {
    states.forEach((state) => {
      syncLayout(state);

      if (isReducedMotion()) {
        showWithoutMotion(state);
      } else {
        createAnimation(state);
      }
    });

    ScrollTrigger.refresh();
  };

  syncAnimations();
  document.addEventListener(MOTION_CHANGE_EVENT, syncAnimations);

  document.fonts?.ready.then(() => {
    states.forEach(syncLayout);
    ScrollTrigger.refresh();
  });

  if (document.readyState !== 'complete') {
    window.addEventListener(
      'load',
      () => {
        states.forEach(syncLayout);
        ScrollTrigger.refresh();
      },
      { once: true },
    );
  }
};
