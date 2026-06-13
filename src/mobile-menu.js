const MOBILE_MENU_QUERY = '(max-width: 767px)';
const MOBILE_MENU_SELECTOR = '#brx-header .nav-menu';
const MOBILE_MENU_HEADER_SELECTOR = '#brx-header #brxe-lmzjvw';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let menuState;

const createToggle = (menu) => {
  const button = document.createElement('button');
  button.className = 'bemke-mobile-menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-controls', menu.id);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Open menu');
  button.innerHTML = [
    '<span class="bemke-mobile-menu-toggle__line"></span>',
    '<span class="bemke-mobile-menu-toggle__line"></span>',
    '<span class="bemke-mobile-menu-toggle__line"></span>',
  ].join('');

  return button;
};

const getFocusableItems = (menu, toggle) => [toggle, ...Array.from(menu.querySelectorAll(FOCUSABLE_SELECTOR))]
  .filter((item) => !item.hasAttribute('disabled') && item.getAttribute('aria-hidden') !== 'true');

const setMenuAccessibility = (state) => {
  if (!state.media.matches) {
    state.menu.removeAttribute('aria-hidden');
    state.menu.inert = false;
    return;
  }

  state.menu.setAttribute('aria-hidden', state.isOpen ? 'false' : 'true');
  state.menu.inert = !state.isOpen;
};

const setMenuState = (state, isOpen, shouldRestoreFocus = true) => {
  state.isOpen = isOpen;
  document.documentElement.classList.toggle('bemke-mobile-menu-open', isOpen);
  state.toggle.setAttribute('aria-expanded', String(isOpen));
  state.toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  setMenuAccessibility(state);

  if (!state.media.matches) {
    return;
  }

  if (isOpen) {
    window.requestAnimationFrame(() => {
      state.menu.querySelector('a[href]')?.focus({ preventScroll: true });
    });
  } else if (shouldRestoreFocus) {
    state.toggle.focus({ preventScroll: true });
  }
};

const handleTabTrap = (event, state) => {
  if (event.key !== 'Tab' || !state.isOpen || !state.media.matches) {
    return;
  }

  const items = getFocusableItems(state.menu, state.toggle);
  const first = items[0];
  const last = items[items.length - 1];

  if (!first || !last) {
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const syncBreakpointState = (state) => {
  if (!state.media.matches && state.isOpen) {
    setMenuState(state, false, false);
  }

  setMenuAccessibility(state);
};

export const initMobileMenu = () => {
  const menu = document.querySelector(MOBILE_MENU_SELECTOR);
  const headerInner = document.querySelector(MOBILE_MENU_HEADER_SELECTOR);

  if (!menu || !headerInner || menuState) {
    return;
  }

  if (!menu.id) {
    menu.id = 'bemke-mobile-menu';
  }

  const media = window.matchMedia(MOBILE_MENU_QUERY);
  const toggle = createToggle(menu);

  headerInner.appendChild(toggle);

  menuState = {
    isOpen: false,
    media,
    menu,
    toggle,
  };

  setMenuAccessibility(menuState);

  toggle.addEventListener('click', () => {
    setMenuState(menuState, !menuState.isOpen);
  });

  menu.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;

    if (link && menuState.media.matches) {
      setMenuState(menuState, false, false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuState.isOpen) {
      event.preventDefault();
      setMenuState(menuState, false);
      return;
    }

    handleTabTrap(event, menuState);
  });

  media.addEventListener('change', () => syncBreakpointState(menuState));
};
