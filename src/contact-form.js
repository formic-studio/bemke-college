const setFormState = (form, state, message = '') => {
  const submit = form.querySelector('[data-bemke-contact-submit]');
  const status = form.querySelector('[data-bemke-contact-status]');
  const isLoading = state === 'loading';

  form.setAttribute('aria-busy', String(isLoading));

  if (submit instanceof HTMLButtonElement) {
    submit.disabled = isLoading;
  }

  if (!(status instanceof HTMLElement)) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('is-success', state === 'success');
  status.classList.toggle('is-error', state === 'error');

  if (message && state !== 'loading') {
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'nearest' });
  }
};

const submitContactForm = async (form) => {
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  formData.set('bemke_contact_ajax', '1');
  setFormState(form, 'loading', 'Sending your message…');

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json();
    const message = payload?.data?.message;

    if (!response.ok || payload?.success !== true) {
      throw new Error(message || 'We could not send your message. Please try again.');
    }

    form.reset();
    setFormState(form, 'success', message || 'Thank you. Your message has been sent.');
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'We could not send your message. Please try again.';

    setFormState(form, 'error', message);
  } finally {
    form.removeAttribute('aria-busy');

    const submit = form.querySelector('[data-bemke-contact-submit]');

    if (submit instanceof HTMLButtonElement) {
      submit.disabled = false;
    }
  }
};

export const initContactForms = () => {
  if (!('fetch' in window) || !('FormData' in window)) {
    return;
  }

  document.querySelectorAll('[data-bemke-contact-form]').forEach((form) => {
    if (!(form instanceof HTMLFormElement) || form.dataset.bemkeContactReady === 'true') {
      return;
    }

    form.dataset.bemkeContactReady = 'true';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitContactForm(form);
    });
  });
};
