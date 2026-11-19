import { siteText } from './site-language.js';

const rootSelector = '.reverse-card';
const innerSelector = ':scope > .reverse-card__inner';
const frontSelector = ':scope > .reverse-card__front';
const backSelector = ':scope > .reverse-card__back';
const headingSelector = 'h2, h3, h4, h5, h6';
const readyAttribute = 'data-bemke-reverse-card-ready';
const flippedClass = 'is-flipped';

let cardId = 0;

const normalizeText = (value) => value?.replace(/\s+/g, ' ').trim() ?? '';

const setFaceVisibility = (face, isVisible) => {
  face.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  face.toggleAttribute('inert', !isVisible);
};

const getCardTitle = (front, back) =>
  normalizeText(front.querySelector(headingSelector)?.textContent) ||
  normalizeText(back.querySelector(headingSelector)?.textContent) ||
  siteText('Karta', 'Card');

const createToggle = (backId) => {
  const toggle = document.createElement('button');
  const label = document.createElement('span');

  toggle.type = 'button';
  toggle.className = 'reverse-card__toggle';
  toggle.setAttribute('aria-controls', backId);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('data-a11y-contrast-fixed', 'true');

  label.className = 'reverse-card__toggle-label';
  toggle.append(label);

  return { label, toggle };
};

const initReverseCard = (root) => {
  if (root.getAttribute(readyAttribute) === '1') {
    return;
  }

  const inner = root.querySelector(innerSelector);
  const faces = inner ?? root;
  const front = faces.querySelector(frontSelector);
  const back = faces.querySelector(backSelector);

  if (!front || !back) {
    return;
  }

  if (!inner) {
    // Leave directly authored faces in place while editing in the Bricks iframe.
    if (window.self !== window.top) {
      return;
    }

    const rotatingInner = document.createElement('div');
    rotatingInner.className = 'reverse-card__inner';
    front.before(rotatingInner);
    rotatingInner.append(front, back);
  }

  cardId += 1;
  back.id ||= 'bemke-reverse-card-panel-' + cardId;

  const title = getCardTitle(front, back);
  const detailsLabel = siteText('pokaż szczegóły', 'show details');
  const frontLabel = siteText('pokaż przód karty', 'show front');
  const { label, toggle } = createToggle(back.id);
  let isHoverSuppressed = false;
  let isPointerInside = false;
  let isPinned = false;
  let isFlipped = false;

  const syncState = () => {
    isFlipped = isPinned || (isPointerInside && !isHoverSuppressed);
    root.classList.toggle(flippedClass, isFlipped);
    toggle.setAttribute('aria-expanded', isFlipped ? 'true' : 'false');
    label.textContent = title + ': ' + (isFlipped ? frontLabel : detailsLabel);
    setFaceVisibility(front, !isFlipped);
    setFaceVisibility(back, isFlipped);
  };

  toggle.addEventListener('click', () => {
    if (isPinned) {
      isPinned = false;
      isHoverSuppressed = isPointerInside;
    } else {
      isPinned = true;
    }

    syncState();
  });

  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isFlipped) {
      return;
    }

    event.preventDefault();
    isPinned = false;
    isHoverSuppressed = isPointerInside;
    syncState();
  });

  root.addEventListener('pointerenter', (event) => {
    if (
      event.pointerType !== 'mouse' ||
      !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }

    isPointerInside = true;
    syncState();
  });

  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    isPointerInside = false;
    isHoverSuppressed = false;
    syncState();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isPointerInside || !isFlipped) {
      return;
    }

    event.preventDefault();
    isPinned = false;
    isHoverSuppressed = true;
    syncState();
  });

  root.prepend(toggle);
  root.setAttribute(readyAttribute, '1');
  syncState();
};

export const initReverseCards = (scope = document) => {
  scope.querySelectorAll(rootSelector).forEach(initReverseCard);
};
