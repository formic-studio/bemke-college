import { isReducedMotion } from './motion-preference.js';

const initWelcomeMessage = (message) => {
  const toggle = message.querySelector('.welcome-message__toggle[href]');
  const panel = message.querySelector('.welcome-message__more[id]');

  if (!toggle || !panel || toggle.hash !== `#${panel.id}` || message.dataset.welcomeMessageReady) {
    return;
  }

  const label = [...toggle.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  ) ?? toggle;
  const closedLabel = label.textContent.trim();
  const openLabel = toggle.dataset.closeLabel || 'Show less';

  const setExpanded = (expanded) => {
    message.classList.toggle('welcome-message--expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.toggleAttribute('inert', !expanded);
    panel.setAttribute('aria-hidden', String(!expanded));
    label.textContent = expanded ? openLabel : closedLabel;
  };

  const keepToggleInView = () => {
    if (document.activeElement !== toggle || toggle.getAttribute('aria-expanded') === 'true') {
      return;
    }

    const bounds = toggle.getBoundingClientRect();

    if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      toggle.scrollIntoView({ block: 'nearest' });
    }
  };

  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-controls', panel.id);
  toggle.removeAttribute('data-brx-anchor');
  panel.tabIndex = -1;

  toggle.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();

      if (!event.repeat) {
        toggle.click();
      }
    }
  });

  toggle.addEventListener('click', (event) => {
    event.preventDefault();

    const expanded = toggle.getAttribute('aria-expanded') === 'false';
    setExpanded(expanded);

    if (expanded) {
      // The continuation is before the button, so start keyboard reading there.
      panel.focus({ preventScroll: true });

      if (panel.getBoundingClientRect().top < 0) {
        panel.scrollIntoView({ block: 'start' });
      }
    } else if (isReducedMotion()) {
      keepToggleInView();
    }
  });

  panel.addEventListener('transitionend', (event) => {
    if (event.target === panel && event.propertyName === 'grid-template-rows') {
      keepToggleInView();
    }
  });

  setExpanded(window.location.hash === toggle.hash);
  message.dataset.welcomeMessageReady = 'true';
};

export const initWelcomeMessages = () => {
  if (window.self === window.top && document.body.classList.contains('bricks-is-frontend')) {
    document.querySelectorAll('.welcome-message').forEach(initWelcomeMessage);
  }
};
