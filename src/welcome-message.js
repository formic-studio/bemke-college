import { isReducedMotion, MOTION_CHANGE_EVENT } from './motion-preference.js';
import { siteText } from './site-language.js';

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
  const openLabel = toggle.dataset.closeLabel || siteText('Zwiń', 'Show less');
  let heightAnimation;

  const setExpanded = (expanded) => {
    message.classList.toggle('welcome-message--expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.toggleAttribute('inert', !expanded);
    panel.setAttribute('aria-hidden', String(!expanded));
    label.textContent = expanded ? openLabel : closedLabel;
  };

  const keepToggleInView = (topInset) => {
    const offset = toggle.getBoundingClientRect().top - topInset;

    if (offset < -0.5 && window.scrollY > 0) {
      window.scrollBy({ top: offset, behavior: 'instant' });
    }
  };

  const followToggleOnClose = (animation, topInset) => {
    const controller = new AbortController();
    const stopFollowing = () => controller.abort();

    for (const type of ['wheel', 'touchmove']) {
      window.addEventListener(type, stopFollowing, { passive: true, signal: controller.signal });
    }

    const follow = () => {
      if (controller.signal.aborted || heightAnimation !== animation) {
        return;
      }

      keepToggleInView(topInset);
      requestAnimationFrame(follow);
    };

    animation.finished.then(() => {
      if (!controller.signal.aborted && heightAnimation === animation) {
        keepToggleInView(topInset);
      }
      stopFollowing();
    }, stopFollowing);
    requestAnimationFrame(follow);
  };

  const finishExpansion = () => {
    panel.style.removeProperty('height');
    heightAnimation?.cancel();
    heightAnimation = undefined;
  };

  const animateExpansion = (expanded) => {
    const start = panel.getBoundingClientRect().height;
    const toggleBounds = toggle.getBoundingClientRect();
    const followToggle = !expanded && toggleBounds.bottom > 0 && toggleBounds.top < window.innerHeight;
    const topInset = followToggle ? parseFloat(getComputedStyle(toggle).scrollMarginBlockStart) || 0 : 0;

    // Pin the current height before changing state, including on a rapid reversal.
    panel.style.height = `${start}px`;
    heightAnimation?.cancel();
    heightAnimation = undefined;
    setExpanded(expanded);

    const end = expanded ? panel.scrollHeight : 0;

    if (isReducedMotion() || typeof panel.animate !== 'function' || Math.abs(end - start) < 1) {
      finishExpansion();
      if (followToggle) {
        keepToggleInView(topInset);
      }
      return;
    }

    const animation = panel.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      { duration: expanded ? 600 : 500, easing: 'ease-in-out', fill: 'both' },
    );
    heightAnimation = animation;

    if (followToggle) {
      followToggleOnClose(animation, topInset);
    }

    animation.addEventListener('finish', () => {
      if (heightAnimation === animation) {
        finishExpansion();
      }
    }, { once: true });
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
    animateExpansion(expanded);

    if (expanded) {
      if (event.detail === 0) {
        // The continuation is before the button, so start keyboard reading there.
        panel.focus({ preventScroll: true });
      }

      if (panel.getBoundingClientRect().top < 0) {
        panel.scrollIntoView({ block: 'start' });
      }
    }
  });

  document.addEventListener(MOTION_CHANGE_EVENT, (event) => {
    if (event.detail?.reduced) {
      heightAnimation?.finish();
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
