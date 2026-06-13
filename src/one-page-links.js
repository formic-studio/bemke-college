const ONE_PAGE_LINK_SELECTOR = [
  'a.footer-link[href*="#"]',
  'a.footer_link[href*="#"]',
  'a[data-brx-anchor="true"][href*="#"]',
].join(',');

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
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest(ONE_PAGE_LINK_SELECTOR);

    if (!link || event.detail === 0 || !isSamePageHashLink(link)) {
      return;
    }

    resetLinkHoverAfterPointerClick(link);
  });
};
