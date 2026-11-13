const HEADER_SELECTOR = '#brx-header';
const MENU_BLOCK_SELECTOR = '.nav-menu.brxe-block';
const NAV_LIST_SELECTOR =
  ':scope > .brxe-nav-menu > .bricks-nav-menu-wrapper > .bricks-nav-menu';
const DESKTOP_QUERY = '(min-width: 992px)';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

const getDirectChild = (element, selector) =>
  Array.from(element.children).find((child) => child.matches(selector)) ?? null;

const getToggle = (item) => getDirectChild(item, '.brx-submenu-toggle');
const getSubmenu = (item) => getDirectChild(item, 'ul.sub-menu');
const getLink = (item) =>
  getToggle(item)?.querySelector(':scope > a') ?? getDirectChild(item, 'a[href]');
const getButton = (item) =>
  getToggle(item)?.querySelector(':scope > button') ?? null;

const setSubmenuFocusable = (submenu, isOpen) => {
  submenu.querySelectorAll(FOCUSABLE_SELECTOR).forEach((element) => {
    if (!element.hasAttribute('data-college-original-tabindex')) {
      element.setAttribute(
        'data-college-original-tabindex',
        element.getAttribute('tabindex') ?? '',
      );
    }

    if (!isOpen) {
      element.setAttribute('tabindex', '-1');
      return;
    }

    const originalTabindex = element.getAttribute('data-college-original-tabindex');

    if (originalTabindex) {
      element.setAttribute('tabindex', originalTabindex);
    } else {
      element.removeAttribute('tabindex');
    }
  });
};

const setItemState = (entry, isOpen) => {
  entry.item.classList.toggle('is-college-menu-item-active', isOpen);
  entry.submenu.classList.toggle('is-college-submenu-open', isOpen);
  entry.submenu.setAttribute('aria-hidden', String(!isOpen));
  entry.submenu.toggleAttribute('inert', !isOpen);
  entry.link.setAttribute('aria-expanded', String(isOpen));
  entry.button?.setAttribute('aria-expanded', String(isOpen));
  setSubmenuFocusable(entry.submenu, isOpen);
};

const measureSubmenus = (list, entries, isDesktop) => {
  if (!isDesktop) {
    entries.forEach(({ submenu }) => {
      submenu.style.removeProperty('--college-submenu-left');
      submenu.style.removeProperty('--college-submenu-width');
      submenu.style.removeProperty('--college-submenu-max-width');
    });
    return;
  }

  const listRect = list.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;

  entries.forEach((entry) => {
    const itemRect = entry.item.getBoundingClientRect();
    const nextItem = entry.item.nextElementSibling;
    const nextRect = nextItem?.matches('li')
      ? nextItem.getBoundingClientRect()
      : null;
    const left = Math.max(0, itemRect.left - listRect.left);
    const segmentWidth = Math.max(
      1,
      (nextRect?.left ?? itemRect.right) - itemRect.left,
    );
    const maxWidth = Math.max(segmentWidth, viewportWidth - itemRect.left);

    entry.submenu.style.setProperty(
      '--college-submenu-left',
      `${Math.round(left)}px`,
    );
    entry.submenu.style.setProperty(
      '--college-submenu-width',
      `${Math.round(segmentWidth)}px`,
    );
    entry.submenu.style.setProperty(
      '--college-submenu-max-width',
      `${Math.round(maxWidth)}px`,
    );
  });
};

const initHeaderMegaMenu = (header) => {
  if (header.getAttribute('data-college-mega-menu-ready') === '1') {
    return;
  }

  const menuBlock = header.querySelector(MENU_BLOCK_SELECTOR);
  const list = menuBlock?.querySelector(NAV_LIST_SELECTOR);

  if (!menuBlock || !list) {
    return;
  }

  const navigationRow = menuBlock.closest('.padding-global') ?? menuBlock.parentElement;
  const media = window.matchMedia(DESKTOP_QUERY);
  const items = Array.from(list.children).filter((item) => item.matches('li'));
  const links = items.map(getLink).filter(Boolean);
  const entries = items
    .map((item, index) => {
      const toggle = getToggle(item);
      const submenu = getSubmenu(item);
      const link = getLink(item);
      const button = getButton(item);

      if (!toggle || !submenu || !link) {
        return null;
      }

      submenu.id ||= `college-desktop-submenu-${index + 1}`;
      link.id ||= `college-desktop-menu-link-${index + 1}`;
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      submenu.setAttribute('aria-labelledby', link.id);
      submenu.classList.add('college-mega-submenu');
      item.classList.add('college-mega-item');

      if (button) {
        button.setAttribute('aria-controls', submenu.id);
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
      }

      const entry = { button, index, item, link, submenu, toggle };
      setItemState(entry, false);
      return entry;
    })
    .filter(Boolean);

  if (!entries.length) {
    return;
  }

  let activeEntry = null;
  let closeTimer = 0;

  header.setAttribute('data-college-mega-menu-ready', '1');
  navigationRow?.classList.add('bemke-college-navigation-row');

  const close = () => {
    window.clearTimeout(closeTimer);
    activeEntry = null;
    header.classList.remove('is-college-mega-menu-open');
    entries.forEach((entry) => setItemState(entry, false));
  };

  const open = (entry) => {
    if (!media.matches) {
      return;
    }

    window.clearTimeout(closeTimer);
    activeEntry = entry;
    header.classList.add('is-college-mega-menu-open');
    measureSubmenus(list, entries, true);
    entries.forEach((candidate) => setItemState(candidate, candidate === entry));
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (
        activeEntry &&
        (activeEntry.toggle.contains(document.activeElement) ||
          activeEntry.submenu.contains(document.activeElement))
      ) {
        return;
      }

      close();
    }, 140);
  };

  entries.forEach((entry) => {
    entry.toggle.addEventListener('pointerenter', () => open(entry));
    entry.submenu.addEventListener('pointerenter', () => open(entry));
    entry.toggle.addEventListener('pointerleave', scheduleClose);
    entry.submenu.addEventListener('pointerleave', scheduleClose);
    entry.link.addEventListener('focus', () => open(entry));

    entry.button?.addEventListener(
      'click',
      (event) => {
        if (!media.matches) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (activeEntry === entry) {
          close();
        } else {
          open(entry);
        }
      },
      true,
    );
  });

  links
    .filter((link) => !entries.some((entry) => entry.link === link))
    .forEach((link) => {
      link.addEventListener('pointerenter', close);
      link.addEventListener('focus', close);
    });

  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeEntry) {
      event.preventDefault();
      const link = activeEntry.link;
      close();
      link.focus({ preventScroll: true });
      return;
    }

    if (!media.matches) {
      return;
    }

    const entry = entries.find(
      (candidate) =>
        candidate.toggle.contains(event.target) ||
        candidate.submenu.contains(event.target),
    );

    if (
      entry &&
      event.key === 'ArrowDown' &&
      entry.toggle.contains(event.target)
    ) {
      event.preventDefault();
      open(entry);
      entry.submenu.querySelector('a[href]')?.focus({ preventScroll: true });
    }
  });

  header.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!header.contains(document.activeElement)) {
        close();
      }
    }, 0);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) {
      close();
    }
  });

  const refresh = () => {
    measureSubmenus(list, entries, media.matches);

    if (!media.matches) {
      close();
    }
  };

  media.addEventListener('change', refresh);
  window.addEventListener('resize', refresh);
  document.fonts?.ready.then(refresh);
  refresh();
};

export const initMegaMenu = () => {
  document.querySelectorAll(HEADER_SELECTOR).forEach(initHeaderMegaMenu);
};
