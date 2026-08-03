import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from './motion-preference.js';

const HIGHLIGHT_SELECTOR = '.scroll-highlight';
const READY_ATTRIBUTE = 'data-bemke-scroll-highlight-ready';
const WORD_CLASS = 'bemke-scroll-highlight-word';
const START_OPACITY = 0.4;
const SCROLL_SCRUB = 0.8;

const killAnimation = (state) => {
  state.animation?.scrollTrigger?.kill();
  state.animation?.kill();
  state.animation = null;

  if (state.split) {
    state.split.revert();
    state.split = null;
  }
};

const showWithoutMotion = (state) => {
  killAnimation(state);
  state.element.setAttribute(READY_ATTRIBUTE, '1');
};

const createAnimation = (state) => {
  killAnimation(state);

  state.element.removeAttribute(READY_ATTRIBUTE);
  state.split = SplitText.create(state.element, {
    aria: 'auto',
    type: 'words',
    wordsClass: WORD_CLASS,
  });

  const words = state.split.words;

  gsap.set(words, { opacity: START_OPACITY });

  state.animation = gsap.to(words, {
    ease: 'none',
    opacity: 1,
    stagger: 0.1,
    scrollTrigger: {
      end: 'bottom 45%',
      invalidateOnRefresh: true,
      onEnter: () => gsap.set(words, { willChange: 'opacity' }),
      onEnterBack: () => gsap.set(words, { willChange: 'opacity' }),
      onLeave: () => gsap.set(words, { clearProps: 'willChange' }),
      onLeaveBack: () => gsap.set(words, { clearProps: 'willChange' }),
      scrub: SCROLL_SCRUB,
      start: 'top 80%',
      trigger: state.element,
    },
  });

  state.element.setAttribute(READY_ATTRIBUTE, '1');
};

export const initScrollHighlights = (scope = document) => {
  const elements = gsap.utils.toArray(HIGHLIGHT_SELECTOR, scope);

  if (!elements.length) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const states = elements.map((element) => ({
    animation: null,
    element,
    split: null,
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
