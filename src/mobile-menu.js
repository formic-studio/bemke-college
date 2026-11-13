const HEADER_SELECTOR = '#brx-header';
const MENU_ELEMENT_SELECTOR = '.nav-menu.brxe-block > .brxe-nav-menu';
const MOBILE_QUERY = '(max-width: 991px)';

const LABELS = {
  pl: {
    accessibility: 'Dostępność',
    collapse: 'Zwiń dostępność',
    contrast: 'Kontrast',
    expand: 'Rozwiń dostępność',
    language: 'Język',
    textSize: 'Wielkość treści',
  },
  en: {
    accessibility: 'Accessibility',
    collapse: 'Collapse accessibility controls',
    contrast: 'Contrast',
    expand: 'Expand accessibility controls',
    language: 'Language',
    textSize: 'Font size',
  },
};

const getLabels = () =>
  LABELS[
    document.documentElement.lang.toLowerCase().startsWith('pl') ? 'pl' : 'en'
  ];

const findToolbar = (header) =>
  Array.from(header.querySelectorAll('.padding-global, .brxe-block')).find(
    (element) =>
      !element.closest('.bricks-mobile-menu-wrapper') &&
      element.querySelector('.animation-switcher') &&
      element.querySelector('[data-contrast]') &&
      element.querySelector('.lang-switcher:not(.animation-switcher)'),
  ) ?? null;

const findToolbarGroup = (toolbar, selector) =>
  Array.from(toolbar.children).find((child) => child.querySelector(selector)) ??
  null;

const labelToolbarGroup = (group, className, label) => {
  if (!group) {
    return;
  }

  group.classList.add('bemke-mobile-wcag__control', className);

  let options = group.querySelector(':scope > .bemke-mobile-wcag__options');

  if (!options) {
    options = document.createElement('div');
    options.className = 'bemke-mobile-wcag__options';
    options.append(...Array.from(group.children));
    group.appendChild(options);
  }

  if (group.querySelector(':scope > .bemke-mobile-wcag__label')) {
    return;
  }

  const labelElement = document.createElement('span');
  labelElement.className = 'bemke-mobile-wcag__label';
  labelElement.textContent = label;
  group.prepend(labelElement);
};

const prepareToolbar = (toolbar, labels) => {
  toolbar.classList.add('bemke-college-wcag-toolbar');

  labelToolbarGroup(
    findToolbarGroup(toolbar, '[data-a11y-scale]'),
    'bemke-mobile-wcag__control--font-size',
    labels.textSize,
  );
  labelToolbarGroup(
    findToolbarGroup(toolbar, '[data-contrast]'),
    'bemke-mobile-wcag__control--contrast',
    labels.contrast,
  );
  labelToolbarGroup(
    findToolbarGroup(toolbar, '.lang-switcher:not(.animation-switcher)'),
    'bemke-mobile-wcag__control--language',
    labels.language,
  );

  const motionGroup = findToolbarGroup(toolbar, '.animation-switcher');

  if (motionGroup) {
    motionGroup.classList.add(
      'bemke-mobile-wcag__control',
      'bemke-mobile-wcag__control--motion',
    );

  }
};

const createMobileContent = (wrapper, menu) => {
  const existing = wrapper.querySelector(':scope > .bemke-mobile-menu__content');

  if (existing) {
    return existing;
  }

  const content = document.createElement('div');
  content.className = 'bemke-mobile-menu__content';
  wrapper.insertBefore(content, menu);
  content.appendChild(menu);
  return content;
};

const createAccessibilityPanel = (toolbar, content, media) => {
  const labels = getLabels();
  const originalPosition = document.createComment(
    'Bemke College accessibility toolbar',
  );
  const section = document.createElement('section');
  const headingRow = document.createElement('div');
  const heading = document.createElement('h2');
  const toggle = document.createElement('button');
  const panel = document.createElement('div');
  const panelId = 'bemke-college-mobile-accessibility-panel';

  prepareToolbar(toolbar, labels);
  toolbar.before(originalPosition);

  section.className = 'bemke-mobile-accessibility';
  section.setAttribute(
    'aria-labelledby',
    'bemke-college-mobile-accessibility-heading',
  );
  headingRow.className = 'bemke-mobile-accessibility__heading-row';
  heading.className = 'bemke-mobile-accessibility__heading';
  heading.id = 'bemke-college-mobile-accessibility-heading';
  heading.textContent = labels.accessibility;
  toggle.className = 'bemke-mobile-accessibility__toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', panelId);
  panel.className = 'bemke-mobile-accessibility__panel';
  panel.id = panelId;
  headingRow.append(heading, toggle);
  section.append(headingRow, panel);
  content.appendChild(section);

  const setExpanded = (isExpanded) => {
    toggle.setAttribute('aria-expanded', String(isExpanded));
    toggle.setAttribute(
      'aria-label',
      isExpanded ? labels.collapse : labels.expand,
    );
    panel.hidden = !isExpanded;
  };

  setExpanded(true);
  toggle.addEventListener('click', () => {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
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
};

const prepareSubmenus = (menu) => {
  menu.querySelectorAll(':scope > li > .sub-menu').forEach((submenu, index) => {
    const item = submenu.parentElement;
    const button = item?.querySelector(':scope > .brx-submenu-toggle > button');

    submenu.id ||= `bemke-college-mobile-submenu-${index + 1}`;
    submenu.setAttribute(
      'aria-hidden',
      item?.classList.contains('open') ? 'false' : 'true',
    );
    button?.setAttribute('aria-controls', submenu.id);

    if (!item) {
      return;
    }

    new MutationObserver(() => {
      const isOpen = item.classList.contains('open');
      submenu.setAttribute('aria-hidden', String(!isOpen));
      menu.classList.toggle(
        'bemke-mobile-menu--has-open-submenu',
        Boolean(menu.querySelector(':scope > li.open')),
      );
    }).observe(item, { attributes: true, attributeFilter: ['class'] });
  });
};

const initHeaderMobileMenu = (header) => {
  if (header.getAttribute('data-college-mobile-menu-ready') === '1') {
    return;
  }

  const menuElement = header.querySelector(MENU_ELEMENT_SELECTOR);
  const wrapper = menuElement?.querySelector(':scope > .bricks-mobile-menu-wrapper');
  const menu = wrapper?.querySelector(':scope > .bricks-mobile-menu');
  const toggle = menuElement?.querySelector(':scope > .bricks-mobile-menu-toggle');
  const toolbar = findToolbar(header);
  const navigationRow = menuElement?.closest('.padding-global') ?? menuElement?.parentElement;

  if (
    !menuElement ||
    !wrapper ||
    !menu ||
    !toggle ||
    !toolbar ||
    !navigationRow
  ) {
    return;
  }

  const media = window.matchMedia(MOBILE_QUERY);
  const content = createMobileContent(wrapper, menu);

  header.setAttribute('data-college-mobile-menu-ready', '1');
  header.setAttribute('data-college-mobile-navigation', '1');
  navigationRow.classList.add('bemke-college-navigation-row');
  prepareSubmenus(menu);
  createAccessibilityPanel(toolbar, content, media);

  const updateHeaderHeight = () => {
    const height = navigationRow.getBoundingClientRect().height;

    if (height > 0) {
      header.style.setProperty(
        '--bemke-mobile-header-height',
        `${Math.round(height)}px`,
      );
    }
  };

  const syncOpenState = () => {
    const isOpen = menuElement.classList.contains('show-mobile-menu');
    document.documentElement.classList.toggle(
      'bemke-mobile-menu-open',
      media.matches && isOpen,
    );

    if (media.matches && isOpen) {
      window.requestAnimationFrame(() => {
        content.scrollTop = 0;
      });
    }
  };

  new MutationObserver(syncOpenState).observe(menuElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  media.addEventListener('change', () => {
    updateHeaderHeight();
    syncOpenState();
  });
  window.addEventListener('resize', updateHeaderHeight);

  if ('ResizeObserver' in window) {
    new ResizeObserver(updateHeaderHeight).observe(navigationRow);
  }

  updateHeaderHeight();
  syncOpenState();
};

export const initMobileMenu = () => {
  document.querySelectorAll(HEADER_SELECTOR).forEach(initHeaderMobileMenu);
};
