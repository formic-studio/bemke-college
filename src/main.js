import './styles/main.css';
import { initBricksFormA11y } from './bricks-form-a11y.js';
import { initMotionPreference } from './motion-preference.js';
import { initAccessibilityMotionSwitch } from './accessibility-motion-switch.js';
import { initDecorativeVideoMotion } from './decorative-video-motion.js';
import { initMobileMenu } from './mobile-menu.js';
import { initOnePageLinks } from './one-page-links.js';
import { initWcagToolbar } from './wcag-toolbar.js';

const scrollExpandImageSelector = '#brxe-zoveny .grid-2x1 > img';
const scrollHighlightSelector = '.scroll-highlight';
const scrollRevealSelector = '[data-scroll-reveal]';
const mobileScrollSelector = '.mobile-scroll > .card';
const reverseCardSelector =
  '.reverse-card > .reverse-card__inner > .reverse-card__front';

const initSliderFeature = () => {
  const sliderSelector = '.slider:not(.slider-thinktank) > .slider-wrapper > .slide';

  if (!document.querySelector(sliderSelector)) {
    return;
  }

  import('./bricks-slider.js').then(({ initBricksSliders }) => {
    initBricksSliders();
  });
};

const initScrollExpandFeature = () => {
  const images = Array.from(document.querySelectorAll(scrollExpandImageSelector));

  if (!images.length) {
    return;
  }

  images.forEach((image) => {
    image.classList.add('img-scroll-expand');

    const frame = document.createElement('div');

    frame.classList.add('brxe-block', 'bemke-scroll-expand-frame');
    image.before(frame);
    frame.append(image);
  });

  import('./scroll-expand-images.js').then(({ initScrollExpandImages }) => {
    initScrollExpandImages();
  });
};

const initScrollHighlightFeature = () => {
  if (!document.querySelector(scrollHighlightSelector)) {
    return;
  }

  import('./scroll-highlight.js').then(({ initScrollHighlights }) => {
    initScrollHighlights();
  });
};

const initScrollRevealFeature = () => {
  if (!document.querySelector(scrollRevealSelector)) {
    return;
  }

  import('./scroll-reveal.js').then(({ initScrollReveals }) => {
    initScrollReveals();
  });
};

const initReverseCardFeature = () => {
  if (!document.querySelector(reverseCardSelector)) {
    return;
  }

  import('./reverse-cards.js').then(({ initReverseCards }) => {
    initReverseCards();
  });
};

const initMobileScrollFeature = () => {
  if (!document.querySelector(mobileScrollSelector)) {
    return;
  }

  import('./mobile-scroll.js').then(({ initMobileScrolls }) => {
    initMobileScrolls();
  });
};

const initPopupFeature = () => {
  if (!document.querySelector('.popup-block')) {
    return;
  }

  import('./popup-modal.js').then(({ initPopupModal }) => {
    initPopupModal();
  });
};

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initMotionPreference();
  initAccessibilityMotionSwitch();
  initDecorativeVideoMotion();
  initBricksFormA11y();
  initSliderFeature();
  initScrollExpandFeature();
  initScrollHighlightFeature();
  initScrollRevealFeature();
  initReverseCardFeature();
  initMobileScrollFeature();
  initPopupFeature();
  initMobileMenu();
  initOnePageLinks();
  initWcagToolbar();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
