import './styles/main.css';
import { initBricksFormA11y } from './bricks-form-a11y.js';
import { initBricksSliders } from './bricks-slider.js';
import { initMobileMenu } from './mobile-menu.js';
import { initOnePageLinks } from './one-page-links.js';

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initBricksFormA11y();
  initBricksSliders();
  initMobileMenu();
  initOnePageLinks();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
