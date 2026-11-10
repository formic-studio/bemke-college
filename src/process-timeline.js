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
    state.block.style.removeProperty('--process-mobile-axis-height');
    return;
  }

  const firstItem = state.items[0];
  const lastItem = state.items[state.items.length - 1];
  const height = Math.max(0, lastItem.offsetTop - firstItem.offsetTop);

  state.block.style.setProperty('--process-mobile-axis-height', `${height}px`);
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

  block.setAttribute(READY_ATTRIBUTE, '1');

  const state = {
    animation: null,
    block,
    items,
    line,
    mobileQuery: window.matchMedia(MOBILE_QUERY),
    resizeObserver: null,
  };

  syncMobileAxis(state);

  if ('ResizeObserver' in window) {
    state.resizeObserver = new ResizeObserver(() => {
      syncMobileAxis(state);
      ScrollTrigger.refresh();
    });
    state.resizeObserver.observe(block);
  } else {
    window.addEventListener('resize', () => syncMobileAxis(state), {
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
      syncMobileAxis(state);

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

  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => ScrollTrigger.refresh(), {
      once: true,
    });
  }
};
