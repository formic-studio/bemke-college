import './styles/main.css';

const initBemkeCollege = () => {
  document.documentElement.classList.add('bemke-college-js');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBemkeCollege, { once: true });
} else {
  initBemkeCollege();
}
