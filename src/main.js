import './styles/main.css';
import { initBricksFormA11y } from './bricks-form-a11y.js';
import { initMotionPreference } from './motion-preference.js';
import { initMobileMenu } from './mobile-menu.js';
import { initOnePageLinks } from './one-page-links.js';
import { initWcagToolbar } from './wcag-toolbar.js';

const initSliderFeature = () => {
  const sliderSelector = '.slider:not(.slider-thinktank) > .slider-wrapper > .slide';

  if (!document.querySelector(sliderSelector)) {
    return;
  }

  import('./bricks-slider.js').then(({ initBricksSliders }) => {
    initBricksSliders();
  });
};

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initMotionPreference();
  initBricksFormA11y();
  initSliderFeature();
  initMobileMenu();
  initOnePageLinks();
  initWcagToolbar();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
