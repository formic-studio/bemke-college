import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
  isSystemReducedMotion,
  setUserReducedMotion,
} from './motion-preference.js';

const SELECTOR = '.lang-switcher-block';
const READY_ATTRIBUTE = 'data-bemke-motion-switch-ready';

export function initAccessibilityMotionSwitch() {
  const switches = Array.from(document.querySelectorAll(SELECTOR)).filter((control) =>
    control.querySelector('.animation-switcher'),
  );

  switches.forEach((control) => {
    if (control.hasAttribute(READY_ATTRIBUTE)) {
      return;
    }

    const track = control.querySelector('.animation-switcher');
    const label = control.querySelector('.brxe-text-basic');

    if (!track || !label) {
      return;
    }

    label.id ||= `${control.id || 'bemke-motion-switch'}-label`;
    control.setAttribute('role', 'switch');
    control.setAttribute('tabindex', '0');
    control.setAttribute('aria-labelledby', label.id);
    control.setAttribute(READY_ATTRIBUTE, '1');
    track.setAttribute('aria-hidden', 'true');

    const sync = () => {
      const reduced = isReducedMotion();
      control.setAttribute('aria-checked', String(reduced));
      control.classList.toggle('is-active', reduced);
      control.setAttribute('aria-disabled', String(isSystemReducedMotion()));
    };

    const toggle = () => {
      if (!isSystemReducedMotion()) {
        setUserReducedMotion(!isReducedMotion());
      }
    };

    control.addEventListener('click', toggle);
    control.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      toggle();
    });
    document.addEventListener(MOTION_CHANGE_EVENT, sync);
    sync();
  });
}
