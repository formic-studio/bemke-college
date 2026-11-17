const ONE_PAGE_LINK_SELECTOR = [
  'a.footer-link[href*="#"]',
  'a.footer_link[href*="#"]',
  'a[data-brx-anchor="true"][href*="#"]',
].join(',');

const HISTORY_SECTION_HASH = '#section_history';
const HISTORY_FOOTER_LINK_SELECTOR = [
  '#brxe-qnltnn',
  `#brx-footer a[href$="${HISTORY_SECTION_HASH}"]`,
].join(',');

const getDecodedHash = () => {
  try {
    return decodeURIComponent(window.location.hash);
  } catch {
    return window.location.hash;
  }
};

const getStickyHeaderOffset = () => {
  const header = document.querySelector('#brx-header');

  if (!header) {
    return 0;
  }

  return [header, ...header.querySelectorAll('*')].reduce((offset, element) => {
    const position = window.getComputedStyle(element).position;

    if (position !== 'fixed' && position !== 'sticky') {
      return offset;
    }

    const bounds = element.getBoundingClientRect();
    const coversViewportTop = bounds.top <= 2 && bounds.bottom > 0;
    const isFullWidthBar = bounds.width >= window.innerWidth * 0.5;

    return coversViewportTop && isFullWidthBar
      ? Math.max(offset, bounds.bottom)
      : offset;
  }, 0);
};

const alignHistorySection = () => {
  const section = document.querySelector(HISTORY_SECTION_HASH);

  if (!section) {
    return;
  }

  const targetTop = Math.max(
    0,
    section.getBoundingClientRect().top
      + window.scrollY
      - getStickyHeaderOffset(),
  );

  if (Math.abs(window.scrollY - targetTop) <= 2) {
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });
  root.style.scrollBehavior = previousScrollBehavior;
};

const initHistorySectionLanding = () => {
  if (getDecodedHash() !== HISTORY_SECTION_HASH) {
    return;
  }

  let stopped = false;
  let resizeFrame = 0;
  const timers = [];
  const userEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

  const stopRealignment = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    timers.forEach((timer) => window.clearTimeout(timer));
    window.cancelAnimationFrame(resizeFrame);
    resizeObserver?.disconnect();
    userEvents.forEach((eventName) => {
      window.removeEventListener(eventName, stopRealignment, true);
    });
  };

  const realign = () => {
    if (!stopped) {
      alignHistorySection();
    }
  };

  const resizeObserver = 'ResizeObserver' in window
    ? new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(realign);
    })
    : null;

  userEvents.forEach((eventName) => {
    window.addEventListener(eventName, stopRealignment, {
      capture: true,
      passive: true,
    });
  });

  resizeObserver?.observe(document.body);

  [0, 120, 400, 900, 1800, 3000].forEach((delay) => {
    timers.push(window.setTimeout(realign, delay));
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(realign);
  }

  if (document.readyState !== 'complete') {
    window.addEventListener('load', realign, { once: true });
  }

  timers.push(window.setTimeout(stopRealignment, 3500));
};

const prepareHistoryFooterLink = () => {
  document.querySelectorAll(HISTORY_FOOTER_LINK_SELECTOR).forEach((link) => {
    let url;

    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (
      url.hash === HISTORY_SECTION_HASH
      && url.pathname !== window.location.pathname
    ) {
      link.removeAttribute('data-brx-anchor');
    }
  });
};

const isSamePageHashLink = (link) => {
  if (!link.hash || link.hash === '#') {
    return false;
  }

  return link.origin === window.location.origin && link.pathname === window.location.pathname;
};

const resetLinkHoverAfterPointerClick = (link) => {
  link.classList.add('bemke-link-hover-reset');
  link.blur();

  const clearReset = () => {
    link.classList.remove('bemke-link-hover-reset');
    link.removeEventListener('pointerleave', clearReset);
  };

  link.addEventListener('pointerleave', clearReset, { once: true });

  window.setTimeout(() => {
    if (!link.matches(':hover')) {
      clearReset();
    }
  }, 800);
};

export const initOnePageLinks = () => {
  prepareHistoryFooterLink();
  initHistorySectionLanding();

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest(ONE_PAGE_LINK_SELECTOR);

    if (!link || event.detail === 0 || !isSamePageHashLink(link)) {
      return;
    }

    resetLinkHoverAfterPointerClick(link);
  });
};
