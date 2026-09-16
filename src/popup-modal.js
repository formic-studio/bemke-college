const POPUP_SELECTOR = '.popup-block';
const OPEN_EVENT = 'bemke:popup-open';
const OPEN_TRIGGER_SELECTOR = '.btn-popup-open, [data-bemke-popup-open]';
const SESSION_KEY = 'bemke_college_popup_seen';
const READY_ATTRIBUTE = 'data-bemke-popup-ready';
const OPEN_ATTRIBUTE = 'data-bemke-popup-active';

const safeReadSeen = () => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
};

const safeMarkSeen = () => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    // The popup still works if session storage is unavailable.
  }
};

const isPolishPage = () => document.documentElement.lang.toLowerCase().startsWith('pl');

const createCloseButton = () => {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'bemke-popup-close';
  button.setAttribute('aria-label', isPolishPage() ? 'Zamknij okno' : 'Close popup');
  button.innerHTML = '<span aria-hidden="true">&times;</span>';

  return button;
};

export function initPopupModal() {
  // Keep the Bricks builder canvas editable.
  if (window.self !== window.top ||
    !document.body.classList.contains('bemke-popup-public')) {
    return;
  }

  const popupBlock = document.querySelector(POPUP_SELECTOR);
  const content = popupBlock?.querySelector(':scope > .contact-form');

  if (!popupBlock || !content || popupBlock.hasAttribute(READY_ATTRIBUTE)) {
    return;
  }

  popupBlock.setAttribute(READY_ATTRIBUTE, '1');
  popupBlock.setAttribute('role', 'dialog');
  popupBlock.setAttribute('aria-modal', 'true');
  popupBlock.setAttribute('aria-hidden', 'true');
  popupBlock.inert = true;

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');

  if (heading) {
    heading.id ||= 'bemke-popup-title';
    popupBlock.setAttribute('aria-labelledby', heading.id);
  } else {
    popupBlock.setAttribute('aria-label', 'Bemke College Open Day');
  }

  const closeButton = createCloseButton();
  const formElement = content.querySelector('getresponse-form');
  const backgroundInertState = new Map();
  let previousFocus = null;
  let loadingStatus = null;
  let loadingTimer = null;
  let slowTimer = null;

  content.prepend(closeButton);

  if (formElement) {
    loadingStatus = document.createElement('p');
    loadingStatus.className = 'bemke-popup-form-loading';
    loadingStatus.setAttribute('role', 'status');
    formElement.before(loadingStatus);
  }

  const isOpen = () => popupBlock.hasAttribute(OPEN_ATTRIBUTE);
  const isFormRendered = () => formElement?.hasAttribute('data-ready') &&
    formElement.getBoundingClientRect().height > 0;

  const updateFormLoading = () => {
    if (!loadingStatus) {
      return;
    }

    loadingStatus.hidden = isFormRendered();

    if (loadingStatus.hidden && loadingTimer !== null) {
      window.clearInterval(loadingTimer);
      loadingTimer = null;
    }

    if (loadingStatus.hidden && slowTimer !== null) {
      window.clearTimeout(slowTimer);
      slowTimer = null;
    }
  };

  if (formElement) {
    new MutationObserver(updateFormLoading).observe(formElement, { attributes: true });
  }

  const lockBackground = () => {
    let current = popupBlock;

    while (current.parentElement) {
      const parent = current.parentElement;

      for (const sibling of parent.children) {
        if (sibling !== current && sibling instanceof HTMLElement &&
          !backgroundInertState.has(sibling)) {
          backgroundInertState.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }

      if (parent === document.body) {
        break;
      }

      current = parent;
    }
  };

  const unlockBackground = () => {
    for (const [element, wasInert] of backgroundInertState) {
      if (element.isConnected) {
        element.inert = wasInert;
      }
    }

    backgroundInertState.clear();
  };

  const open = () => {
    if (isOpen()) {
      return;
    }

    previousFocus = document.activeElement;
    popupBlock.removeAttribute('aria-hidden');
    popupBlock.inert = false;
    popupBlock.setAttribute(OPEN_ATTRIBUTE, 'true');
    lockBackground();
    document.body.classList.add('bemke-popup-open');
    closeButton.focus({ preventScroll: true });
    safeMarkSeen();

    if (loadingStatus) {
      loadingStatus.textContent = isPolishPage() ?
        'Ładowanie formularza…' : 'Loading the form…';
      updateFormLoading();

      if (!loadingStatus.hidden) {
        loadingTimer = window.setInterval(updateFormLoading, 250);
        slowTimer = window.setTimeout(() => {
          if (isOpen() && !loadingStatus.hidden) {
            loadingStatus.textContent = isPolishPage() ?
              'Formularz ładuje się dłużej niż zwykle. Odśwież stronę.' :
              'The form is taking longer than usual. Please refresh the page.';
          }
        }, 8000);
      }
    }
  };

  const close = () => {
    if (!isOpen()) {
      return;
    }

    popupBlock.removeAttribute(OPEN_ATTRIBUTE);
    popupBlock.setAttribute('aria-hidden', 'true');
    popupBlock.inert = true;
    unlockBackground();
    document.body.classList.remove('bemke-popup-open');
    document.dispatchEvent(new CustomEvent('bemke:popup-close'));

    if (loadingTimer !== null) {
      window.clearInterval(loadingTimer);
      loadingTimer = null;
    }

    if (slowTimer !== null) {
      window.clearTimeout(slowTimer);
      slowTimer = null;
    }

    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
  };

  document.querySelectorAll(OPEN_TRIGGER_SELECTOR).forEach((trigger) => {
    trigger.setAttribute('aria-haspopup', 'dialog');

    if (popupBlock.id) {
      trigger.setAttribute('aria-controls', popupBlock.id);
    }

    if (!trigger.matches('button, a[href]')) {
      if (!trigger.hasAttribute('role')) {
        trigger.setAttribute('role', 'button');
      }

      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
    }
  });

  closeButton.addEventListener('click', close);
  popupBlock.addEventListener('click', (event) => {
    if (event.target === popupBlock) {
      close();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (isOpen() && event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest(OPEN_TRIGGER_SELECTOR);

    if (!isOpen() && trigger && !trigger.matches('button, a[href]') &&
      (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      open();
    }
  });
  document.addEventListener(OPEN_EVENT, open);
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest(OPEN_TRIGGER_SELECTOR);

    if (trigger) {
      event.preventDefault();
      open();
    }
  });

  if (!safeReadSeen()) {
    open();
  }
}
