const rootSelector = '.mobile-scroll';
const cardSelector = ':scope > .card';
const readyAttribute = 'data-bemke-mobile-scroll-ready';
const activeAttribute = 'data-bemke-mobile-scroll-active';
const mobileScrollQuery = '(min-width: 321px) and (max-width: 767px)';

let mobileScrollId = 0;

const getRegionHeading = (root) => {
  const section = root.closest('section, article');

  return section?.querySelector('h1, h2, h3, h4, h5, h6') ?? null;
};

const ensureElementId = (element, prefix) => {
  if (!element.id) {
    mobileScrollId += 1;
    element.id = prefix + '-' + mobileScrollId;
  }

  return element.id;
};

const initMobileScroll = (root) => {
  if (root.getAttribute(readyAttribute) === '1') {
    return;
  }

  const cards = Array.from(root.querySelectorAll(cardSelector));

  if (cards.length < 2) {
    return;
  }

  const track = document.createElement('div');
  const instructions = document.createElement('span');
  const heading = getRegionHeading(root);
  const mediaQuery = window.matchMedia(mobileScrollQuery);

  track.className = 'mobile-scroll__track';
  instructions.className = 'mobile-scroll__instructions';
  instructions.hidden = true;
  instructions.textContent =
    'Scrollable card list. Use the Left and Right Arrow keys to browse.';

  const instructionsId = ensureElementId(
    instructions,
    'bemke-mobile-scroll-instructions',
  );

  root.insertBefore(track, cards[0]);
  cards.forEach((card) => track.append(card));
  track.append(instructions);

  const activate = () => {
    track.setAttribute('role', 'region');
    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-describedby', instructionsId);

    if (heading) {
      track.setAttribute(
        'aria-labelledby',
        ensureElementId(heading, 'bemke-mobile-scroll-heading'),
      );
    } else {
      track.setAttribute('aria-label', 'Scrollable card list');
    }

    instructions.hidden = false;
    root.setAttribute(activeAttribute, '1');
  };

  const deactivate = () => {
    track.removeAttribute('role');
    track.removeAttribute('tabindex');
    track.removeAttribute('aria-describedby');
    track.removeAttribute('aria-labelledby');
    track.removeAttribute('aria-label');
    instructions.hidden = true;
    root.removeAttribute(activeAttribute);
  };

  const syncState = () => {
    if (mediaQuery.matches) {
      activate();
    } else {
      deactivate();
    }
  };

  root.setAttribute(readyAttribute, '1');
  syncState();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncState);
  } else {
    mediaQuery.addListener(syncState);
  }
};

export const initMobileScrolls = (scope = document) => {
  scope.querySelectorAll(rootSelector).forEach(initMobileScroll);
};
