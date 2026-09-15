const POPUP_SELECTOR = '.popup-block';
const OPEN_EVENT = 'bemke:popup-open';
const OPEN_TRIGGER_SELECTOR = '.btn-popup-open, [data-bemke-popup-open]';
const SESSION_KEY = 'bemke_college_popup_seen';
const READY_ATTRIBUTE = 'data-bemke-popup-ready';

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

const createFormLoadingStatus = () => {
  const status = document.createElement('p');
  const isPolish = document.documentElement.lang.toLowerCase().startsWith('pl');

  status.className = 'bemke-popup-form-loading';
  status.setAttribute('role', 'status');
  status.textContent = isPolish ? 'Ładowanie formularza…' : 'Loading the form…';

  return status;
};

export function initPopupModal() {
  // Bricks uses an iframe for the builder canvas. Keep its editable block intact.
  if (window.self !== window.top) {
    return;
  }

  const popupBlock = document.querySelector(POPUP_SELECTOR);
  const content = popupBlock?.querySelector(':scope > .contact-form');

  if (!popupBlock || !content || popupBlock.hasAttribute(READY_ATTRIBUTE) ||
    !('showModal' in HTMLDialogElement.prototype)) {
    return;
  }

  popupBlock.setAttribute(READY_ATTRIBUTE, '1');

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  const dialog = document.createElement('dialog');
  const closeButton = createCloseButton();
  const originalPosition = document.createComment('Bemke popup position');
  let previousFocus = null;
  let openedCount = 0;
  let formElement = content.querySelector('getresponse-form');
  let formWasReady = false;
  let loadingTimer = null;
  let recoveryTimer = null;
  const loadingStatus = formElement ? createFormLoadingStatus() : null;

  popupBlock.after(originalPosition);
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
  formElement?.before(loadingStatus);

  const isFormRendered = () => formElement?.hasAttribute('data-ready') &&
    formElement.getBoundingClientRect().height > 0;

  const updateFormLoading = () => {
    if (!loadingStatus) {
      return;
    }

    const rendered = isFormRendered();
    loadingStatus.hidden = rendered;
    formWasReady ||= rendered;

    if (rendered && loadingTimer !== null) {
      window.clearInterval(loadingTimer);
      loadingTimer = null;
    }
  };

  const formObserver = formElement ? new MutationObserver(updateFormLoading) : null;
  formObserver?.observe(formElement, { attributes: true });

  const recoverFormIfMissing = () => {
    recoveryTimer = null;

    if (!dialog.open || !formElement || !formWasReady || isFormRendered()) {
      return;
    }

    const replacement = document.createElement('getresponse-form');

    for (const attribute of ['form-id', 'e']) {
      if (formElement.hasAttribute(attribute)) {
        replacement.setAttribute(attribute, formElement.getAttribute(attribute));
      }
    }

    formElement.replaceWith(replacement);
    formElement = replacement;
    formObserver?.disconnect();
    formObserver?.observe(formElement, { attributes: true });
    updateFormLoading();
  };

  const open = () => {
    if (dialog.open) {
      return;
    }

    previousFocus = document.activeElement;
    popupBlock.removeAttribute('aria-hidden');
    popupBlock.removeAttribute('inert');
    popupBlock.inert = false;
    dialog.append(popupBlock);
    dialog.showModal();
    document.body.classList.add('bemke-popup-open');
    closeButton.focus({ preventScroll: true });
    openedCount += 1;
    updateFormLoading();

    if (loadingStatus && !loadingStatus.hidden && loadingTimer === null) {
      loadingTimer = window.setInterval(updateFormLoading, 250);
    }

    if (recoveryTimer !== null) {
      window.clearTimeout(recoveryTimer);
      recoveryTimer = null;
    }

    if (openedCount > 1 && formWasReady) {
      recoveryTimer = window.setTimeout(recoverFormIfMissing, 800);
    }

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
    if (dialog.open) {
      return;
    }

    popupBlock.setAttribute('aria-hidden', 'true');
    popupBlock.inert = true;
    originalPosition.before(popupBlock);
    document.body.classList.remove('bemke-popup-open');
    if (formElement?.hasAttribute('data-ready')) {
      formWasReady = true;
    }

    if (loadingTimer !== null) {
      window.clearInterval(loadingTimer);
      loadingTimer = null;
    }

    if (recoveryTimer !== null) {
      window.clearTimeout(recoveryTimer);
      recoveryTimer = null;
    }

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
