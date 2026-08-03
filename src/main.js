import './styles/main.css';
import { initBricksFormA11y } from './bricks-form-a11y.js';
import { initMotionPreference } from './motion-preference.js';
import { initMobileMenu } from './mobile-menu.js';
import { initOnePageLinks } from './one-page-links.js';
import { initWcagToolbar } from './wcag-toolbar.js';

const scrollExpandImageSelector = '#brxe-zoveny .grid-2x1 > img';

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

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initMotionPreference();
  initBricksFormA11y();
  initSliderFeature();
  initScrollExpandFeature();
  initMobileMenu();
  initOnePageLinks();
  initWcagToolbar();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
