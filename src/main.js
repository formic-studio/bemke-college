import './styles/main.css';
import { initBricksSliders } from './bricks-slider.js';

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
  initBricksSliders();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
