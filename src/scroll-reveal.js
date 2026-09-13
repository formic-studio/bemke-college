import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from './motion-preference.js';

const REVEAL_SELECTOR = '[data-scroll-reveal]';
const READY_ATTRIBUTE = 'data-bemke-scroll-reveal-ready';
const COMPLETE_ATTRIBUTE = 'data-bemke-scroll-reveal-complete';

const REVEAL_VARIANTS = {
  heading: {
    delay: 0,
    duration: 0.9,
    scale: 0.985,
    start: 'top 88%',
    y: 24,
  },
  text: {
    delay: 0.08,
    duration: 0.8,
    scale: 1,
    start: 'top 90%',
    y: 16,
  },
};

const getVariant = (element) =>
  REVEAL_VARIANTS[element.getAttribute('data-scroll-reveal')] ??
  REVEAL_VARIANTS.text;

const killAnimation = (state) => {
  state.animation?.scrollTrigger?.kill();
  state.animation?.kill();
  gsap.killTweensOf(state.element);
  state.animation = null;
};

const clearAnimationStyles = (element) => {
  gsap.set(element, {
    clearProps: 'opacity,transform,willChange',
  });
};

const showWithoutMotion = (state) => {
  killAnimation(state);
  clearAnimationStyles(state.element);
  state.element.setAttribute(READY_ATTRIBUTE, '1');
  state.element.setAttribute(COMPLETE_ATTRIBUTE, '1');
};

const completeAnimation = (state) => {
  state.element.setAttribute(COMPLETE_ATTRIBUTE, '1');
  clearAnimationStyles(state.element);
};

const createAnimation = (state) => {
  killAnimation(state);

  if (state.element.getAttribute(COMPLETE_ATTRIBUTE) === '1') {
    clearAnimationStyles(state.element);
    return;
  }

  const variant = getVariant(state.element);

  state.animation = gsap.fromTo(
    state.element,
    {
      opacity: 0,
      scale: variant.scale,
      y: variant.y,
    },
    {
      delay: variant.delay,
      duration: variant.duration,
      ease: 'power2.out',
      opacity: 1,
      onComplete: () => completeAnimation(state),
      onStart: () => gsap.set(state.element, { willChange: 'transform, opacity' }),
      scale: 1,
      scrollTrigger: {
        invalidateOnRefresh: true,
        once: true,
        start: variant.start,
        trigger: state.element,
      },
      y: 0,
    },
  );

  state.element.setAttribute(READY_ATTRIBUTE, '1');
};

export const initScrollReveals = (scope = document) => {
  const elements = gsap.utils.toArray(REVEAL_SELECTOR, scope);

  if (!elements.length) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const states = elements.map((element) => ({
    animation: null,
    element,
  }));

  const syncAnimations = () => {
    if (isReducedMotion()) {
      states.forEach(showWithoutMotion);
    } else {
      states.forEach(createAnimation);
    }

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
