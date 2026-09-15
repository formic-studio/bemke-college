const POPUP_SELECTOR = '.popup-block';
const OPEN_EVENT = 'bemke:popup-open';
const OPEN_TRIGGER_SELECTOR = '.btn-popup-open, [data-bemke-popup-open]';
const SESSION_KEY = 'bemke_college_popup_seen';

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

const createCloseButton = () => {
  const button = document.createElement('button');
  const isPolish = document.documentElement.lang.toLowerCase().startsWith('pl');

  button.type = 'button';
  button.className = 'bemke-popup-close';
  button.setAttribute('aria-label', isPolish ? 'Zamknij okno' : 'Close popup');
  button.setAttribute('autofocus', '');
  button.innerHTML = '<span aria-hidden="true">&times;</span>';

  return button;
};

export function initPopupModal() {
  // Bricks uses an iframe for the builder canvas. Keep its editable block intact.
  if (window.self !== window.top) {
    return;
  }

  const popupBlock = document.querySelector(POPUP_SELECTOR);
  const content = popupBlock?.querySelector(':scope > .contact-form');

  if (!popupBlock || !content || !('showModal' in HTMLDialogElement.prototype)) {
    return;
  }

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  const dialog = document.createElement('dialog');
  const closeButton = createCloseButton();
  let previousFocus = null;

  dialog.className = 'bemke-popup-dialog';

  if (heading) {
    heading.id ||= 'bemke-popup-title';
    dialog.setAttribute('aria-labelledby', heading.id);
  } else {
    dialog.setAttribute('aria-label', 'Bemke College Open Day');
  }

  popupBlock.setAttribute('aria-hidden', 'true');
  popupBlock.inert = true;
  document.body.append(dialog);
  content.prepend(closeButton);

  const open = () => {
    if (dialog.open) {
      return;
    }

    previousFocus = document.activeElement;
    popupBlock.removeAttribute('aria-hidden');
    popupBlock.inert = false;
    dialog.append(popupBlock);
    dialog.showModal();
    document.body.classList.add('bemke-popup-open');
    closeButton.focus({ preventScroll: true });
    safeMarkSeen();
  };

  const close = () => {
    if (dialog.open) {
      dialog.close();
    }
  };

  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) {
      return;
    }

    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;

    if (outside) {
      close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('bemke-popup-open');

    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
  });

  document.addEventListener(OPEN_EVENT, open);
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest(OPEN_TRIGGER_SELECTOR);

    if (!trigger) {
      return;
    }

    event.preventDefault();
    open();
  });

  if (!safeReadSeen()) {
    open();
  }
}
