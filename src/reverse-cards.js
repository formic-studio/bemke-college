const rootSelector = '.reverse-card';
const innerSelector = ':scope > .reverse-card__inner';
const frontSelector = ':scope > .reverse-card__front';
const backSelector = ':scope > .reverse-card__back';
const readyAttribute = 'data-bemke-reverse-card-ready';
const flippedClass = 'is-flipped';

let cardId = 0;

const normalizeText = (value) => value?.replace(/\s+/g, ' ').trim() ?? '';

const setFaceVisibility = (face, isVisible) => {
  face.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  face.toggleAttribute('inert', !isVisible);
};

const getCardTitle = (front) =>
  normalizeText(front.querySelector('h2, h3, h4, h5, h6')?.textContent) || 'Card';

const createToggle = (title, backId) => {
  const toggle = document.createElement('button');
  const label = document.createElement('span');

  toggle.type = 'button';
  toggle.className = 'reverse-card__toggle';
  toggle.setAttribute('aria-controls', backId);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('data-a11y-contrast-fixed', 'true');

  label.className = 'reverse-card__toggle-label';
  label.textContent = title + ': show details';
  toggle.append(label);

  return { label, toggle };
};

const initReverseCard = (root) => {
  if (root.getAttribute(readyAttribute) === '1') {
    return;
  }

  const inner = root.querySelector(innerSelector);
  const front = inner?.querySelector(frontSelector);
  const back = inner?.querySelector(backSelector);

  if (!inner || !front || !back) {
    return;
  }

  cardId += 1;
  back.id ||= 'bemke-reverse-card-panel-' + cardId;

  const title = getCardTitle(front);
  const { label, toggle } = createToggle(title, back.id);
  let isFlipped = false;

  const syncState = (nextState) => {
    isFlipped = Boolean(nextState);
    root.classList.toggle(flippedClass, isFlipped);
    toggle.setAttribute('aria-expanded', isFlipped ? 'true' : 'false');
    label.textContent = isFlipped
      ? title + ': show front'
      : title + ': show details';
    setFaceVisibility(front, !isFlipped);
    setFaceVisibility(back, isFlipped);
  };

  toggle.addEventListener('click', () => {
    syncState(!isFlipped);
  });

  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isFlipped) {
      return;
    }

    event.preventDefault();
    syncState(false);
  });

  root.prepend(toggle);
  root.setAttribute(readyAttribute, '1');
  syncState(false);
};

export const initReverseCards = (scope = document) => {
  scope.querySelectorAll(rootSelector).forEach(initReverseCard);
};
