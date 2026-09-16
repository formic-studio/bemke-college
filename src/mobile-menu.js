const MOBILE_MENU_QUERY = '(max-width: 767px)';
const MOBILE_MENU_SELECTOR = '.nav-menu.brxe-block';
const MOBILE_MENU_TOGGLE_SELECTOR = '.bemke-mobile-menu-toggle';
const MOBILE_MENU_TOGGLE_READY_ATTRIBUTE = 'data-bemke-mobile-menu-ready';
const ACCESSIBILITY_SELECTOR = '#brxe-dtelpy';
const MENU_LABELS = {
  pl: {
    open: 'Otwórz menu',
    close: 'Zamknij menu',
    accessibility: 'Dostępność',
    textSize: 'Wielkość treści',
    contrast: 'Kontrast',
    language: 'Język',
    expandAccessibility: 'Rozwiń dostępność',
    collapseAccessibility: 'Zwiń dostępność',
  },
  en: {
    open: 'Open menu',
    close: 'Close menu',
    accessibility: 'Accessibility',
    textSize: 'Text size',
    contrast: 'Contrast',
    language: 'Language',
    expandAccessibility: 'Expand accessibility',
    collapseAccessibility: 'Collapse accessibility',
  },
};
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let menuState;

const getMenuLabels = () =>
  MENU_LABELS[document.documentElement.lang.toLowerCase().startsWith('pl') ? 'pl' : 'en'];

const labelToolbarControls = (toolbar, labels) => {
  const groups = [
    ['#brxe-ojgsiy', labels.textSize],
    ['#brxe-ioczzo', labels.contrast],
    ['#brxe-wxmjhs', labels.language],
  ];

  groups.forEach(([selector, labelText]) => {
    const group = toolbar.querySelector(selector);

    if (!group) {
      return;
    }

    const label = document.createElement('span');
    label.className = 'bemke-mobile-accessibility__label';
    label.id = `bemke-mobile-accessibility-label-${group.id}`;
    label.textContent = labelText;
    group.prepend(label);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', label.id);
  });
};

const createAccessibilityPanel = (header, menu, media) => {
  const toolbar = header.querySelector(ACCESSIBILITY_SELECTOR);

  if (!toolbar || menu.contains(toolbar) || !toolbar.parentNode) {
    return null;
  }

  const labels = getMenuLabels();
  const originalPosition = document.createComment('Bemke accessibility toolbar');
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  const button = document.createElement('button');
  const panel = document.createElement('div');
  const panelId = 'bemke-mobile-accessibility-panel';

  labelToolbarControls(toolbar, labels);
  toolbar.before(originalPosition);
  section.className = 'bemke-mobile-accessibility';
  section.setAttribute('aria-labelledby', 'bemke-mobile-accessibility-heading');
  heading.className = 'bemke-mobile-accessibility__heading';
  heading.id = 'bemke-mobile-accessibility-heading';
  heading.textContent = labels.accessibility;
  button.className = 'bemke-mobile-accessibility__toggle';
  button.type = 'button';
  button.setAttribute('aria-controls', panelId);
  panel.className = 'bemke-mobile-accessibility__panel';
  panel.id = panelId;
  section.append(heading, button, panel);
  menu.appendChild(section);

  const setExpanded = (expanded) => {
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute(
      'aria-label',
      expanded ? labels.collapseAccessibility : labels.expandAccessibility,
    );
    panel.hidden = !expanded;
  };

  setExpanded(true);
  button.addEventListener('click', () => {
    setExpanded(button.getAttribute('aria-expanded') !== 'true');
  });

  const sync = () => {
    if (media.matches) {
      panel.appendChild(toolbar);
    } else {
      originalPosition.after(toolbar);
    }
  };

  media.addEventListener('change', sync);
  sync();

  return section;
};

const createToggle = (menu) => {
  const button = document.createElement('button');
  button.id = 'bemke-mobile-menu-toggle';
  button.className = 'bemke-mobile-menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-controls', menu.id);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', getMenuLabels().open);
  button.innerHTML = [
    '<span class="bemke-mobile-menu-toggle__line"></span>',
    '<span class="bemke-mobile-menu-toggle__line"></span>',
    '<span class="bemke-mobile-menu-toggle__line"></span>',
  ].join('');

  return button;
};

const getSingleToggle = (headerInner) => {
  const toggles = Array.from(
    headerInner.querySelectorAll(MOBILE_MENU_TOGGLE_SELECTOR),
  );
  const toggle = toggles.shift() ?? null;

  toggles.forEach((duplicate) => duplicate.remove());

  return toggle;
};

const getFocusableItems = (menu, toggle) => [toggle, ...Array.from(menu.querySelectorAll(FOCUSABLE_SELECTOR))]
  .filter((item) =>
    !item.hasAttribute('disabled') &&
    item.getAttribute('aria-hidden') !== 'true' &&
    !item.closest('[hidden], [inert]') &&
    item.getClientRects().length > 0,
  );

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
  state.toggle.setAttribute('aria-label', isOpen ? state.labels.close : state.labels.open);
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
  const header = document.querySelector('#brx-header');
  const menu = header?.querySelector(MOBILE_MENU_SELECTOR);
  const headerInner = header?.querySelector('#brxe-lmzjvw') ?? menu?.parentElement;

  if (!menu || !headerInner || menuState) {
    return;
  }

  if (!menu.id) {
    menu.id = 'bemke-mobile-menu';
  }

  const existingToggle = getSingleToggle(headerInner);

  if (
    existingToggle?.getAttribute(MOBILE_MENU_TOGGLE_READY_ATTRIBUTE) === '1'
  ) {
    return;
  }

  const media = window.matchMedia(MOBILE_MENU_QUERY);
  const toggle = existingToggle ?? createToggle(menu);
  const labels = getMenuLabels();

  if (!existingToggle) {
    headerInner.appendChild(toggle);
  }

  headerInner.classList.add('bemke-mobile-menu-header');
  toggle.setAttribute('aria-controls', menu.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', labels.open);
  toggle.setAttribute(MOBILE_MENU_TOGGLE_READY_ATTRIBUTE, '1');

  menuState = {
    isOpen: false,
    labels,
    media,
    menu,
    toggle,
  };

  createAccessibilityPanel(header, menu, media);
  setMenuAccessibility(menuState);

  toggle.addEventListener('click', () => {
    setMenuState(menuState, !menuState.isOpen);
  });

  menu.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;

    if (link && menuState.media.matches && !link.closest('.bemke-mobile-accessibility')) {
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
