import './styles/main.css';
import { initBricksSliders } from './bricks-slider.js';
import { initOnePageLinks } from './one-page-links.js';

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initBricksSliders();
  initOnePageLinks();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
