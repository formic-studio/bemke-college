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

const clearCustomSelectError = (wrapper) => {
  const button = wrapper.querySelector('.bemke-contact-form__select-button');
  const error = wrapper.querySelector('.bemke-contact-form__select-error');

  wrapper.classList.remove('is-invalid');
  button?.setAttribute('aria-invalid', 'false');

  if (error instanceof HTMLElement) {
    error.hidden = true;
    error.textContent = '';
  }
};

const closeCustomSelect = (wrapper, restoreFocus = false) => {
  const button = wrapper.querySelector('.bemke-contact-form__select-button');
  const listbox = wrapper.querySelector('.bemke-contact-form__select-list');

  if (!(button instanceof HTMLButtonElement) || !(listbox instanceof HTMLElement)) {
    return;
  }

  wrapper.classList.remove('is-open');
  button.setAttribute('aria-expanded', 'false');
  listbox.hidden = true;

  if (restoreFocus) {
    button.focus();
  }
};

const focusCustomOption = (options, index) => {
  const target = options[index];

  if (!(target instanceof HTMLElement)) {
    return;
  }

  options.forEach((option) => {
    option.tabIndex = option === target ? 0 : -1;
  });
  target.focus();
};

const initCustomSelect = (select) => {
  const wrapper = select.closest('.bemke-contact-form__select-wrap');

  if (!(wrapper instanceof HTMLElement) || wrapper.classList.contains('is-enhanced')) {
    return;
  }

  const label = select.id
    ? select.form?.querySelector(`label[for="${CSS.escape(select.id)}"]`)
    : null;
  const listboxId = `${select.id || 'bemke-contact-select'}-listbox`;
  const buttonId = `${select.id || 'bemke-contact-select'}-button`;
  const valueId = `${buttonId}-value`;
  const errorId = `${buttonId}-error`;
  const button = document.createElement('button');
  const value = document.createElement('span');
  const listbox = document.createElement('ul');
  const error = document.createElement('span');
  const nativeOptions = Array.from(select.options).filter((option) => option.value);

  button.type = 'button';
  button.id = buttonId;
  button.className = 'bemke-contact-form__select-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', listboxId);
  button.setAttribute('aria-invalid', 'false');
  button.setAttribute('aria-describedby', errorId);

  value.id = valueId;
  value.className = 'bemke-contact-form__select-value';
  button.append(value);

  listbox.id = listboxId;
  listbox.className = 'bemke-contact-form__select-list';
  listbox.setAttribute('role', 'listbox');
  listbox.hidden = true;

  error.id = errorId;
  error.className = 'bemke-contact-form__select-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  if (label instanceof HTMLLabelElement) {
    if (!label.id) {
      label.id = `${buttonId}-label`;
    }

    label.htmlFor = buttonId;
    button.setAttribute('aria-labelledby', `${label.id} ${valueId}`);
    listbox.setAttribute('aria-labelledby', label.id);
  }

  const customOptions = nativeOptions.map((nativeOption, index) => {
    const option = document.createElement('li');

    option.id = `${listboxId}-option-${index + 1}`;
    option.className = 'bemke-contact-form__select-option';
    option.dataset.value = nativeOption.value;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(nativeOption.selected));
    option.tabIndex = -1;
    option.textContent = nativeOption.textContent;
    listbox.append(option);

    return option;
  });

  const syncValue = () => {
    const selectedOption = nativeOptions.find((option) => option.value === select.value);

    value.textContent = selectedOption?.textContent || select.options[0]?.textContent || 'Please select';
    value.classList.toggle('is-placeholder', !selectedOption);
    customOptions.forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.value === select.value));
    });
  };

  const chooseOption = (option) => {
    select.value = option.dataset.value || '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    clearCustomSelectError(wrapper);
    syncValue();
    closeCustomSelect(wrapper, true);
  };

  const openSelect = (direction = 'selected') => {
    document.querySelectorAll('.bemke-contact-form__select-wrap.is-open').forEach((openWrapper) => {
      if (openWrapper !== wrapper) {
        closeCustomSelect(openWrapper);
      }
    });

    wrapper.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    listbox.hidden = false;

    const selectedIndex = customOptions.findIndex(
      (option) => option.dataset.value === select.value,
    );
    const targetIndex =
      direction === 'last'
        ? customOptions.length - 1
        : direction === 'first'
          ? 0
          : Math.max(selectedIndex, 0);

    focusCustomOption(customOptions, targetIndex);
  };

  customOptions.forEach((option) => {
    option.addEventListener('click', () => chooseOption(option));
  });

  button.addEventListener('click', () => {
    if (wrapper.classList.contains('is-open')) {
      closeCustomSelect(wrapper, true);
      return;
    }

    openSelect();
  });

  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openSelect(event.key === 'ArrowUp' ? 'last' : 'first');
    } else if (event.key === 'Escape' && wrapper.classList.contains('is-open')) {
      event.preventDefault();
      closeCustomSelect(wrapper, true);
    }
  });

  listbox.addEventListener('keydown', (event) => {
    const currentIndex = customOptions.indexOf(document.activeElement);
    let targetIndex = null;

    if (event.key === 'ArrowDown') {
      targetIndex = (currentIndex + 1) % customOptions.length;
    } else if (event.key === 'ArrowUp') {
      targetIndex = (currentIndex - 1 + customOptions.length) % customOptions.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = customOptions.length - 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (currentIndex >= 0) {
        chooseOption(customOptions[currentIndex]);
      }

      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeCustomSelect(wrapper, true);
      return;
    } else if (event.key === 'Tab') {
      closeCustomSelect(wrapper);
      return;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      focusCustomOption(customOptions, targetIndex);
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!wrapper.contains(event.target)) {
      closeCustomSelect(wrapper);
    }
  });

  select.dataset.bemkeWasRequired = String(select.required);
  select.required = false;
  select.addEventListener('change', () => {
    clearCustomSelectError(wrapper);
    syncValue();
  });
  select.form?.addEventListener('reset', () => {
    window.setTimeout(() => {
      clearCustomSelectError(wrapper);
      syncValue();
    }, 0);
  });

  wrapper.append(button, listbox, error);
  wrapper.classList.add('is-enhanced');
  syncValue();
};

const validateCustomSelects = (form) => {
  const wrappers = Array.from(
    form.querySelectorAll('.bemke-contact-form__select-wrap.is-enhanced'),
  );

  for (const wrapper of wrappers) {
    const select = wrapper.querySelector('select');
    const button = wrapper.querySelector('.bemke-contact-form__select-button');
    const error = wrapper.querySelector('.bemke-contact-form__select-error');

    if (
      !(select instanceof HTMLSelectElement) ||
      select.dataset.bemkeWasRequired !== 'true' ||
      select.value
    ) {
      continue;
    }

    wrapper.classList.add('is-invalid');
    button?.setAttribute('aria-invalid', 'true');

    if (error instanceof HTMLElement) {
      error.textContent = 'Please select who you wish to contact.';
      error.hidden = false;
    }

    if (button instanceof HTMLButtonElement) {
      button.focus();
    }

    return false;
  }

  return true;
};

const submitContactForm = async (form) => {
  if (!validateCustomSelects(form) || !form.checkValidity()) {
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
    form.querySelectorAll('.bemke-contact-form__select-wrap select').forEach((select) => {
      if (select instanceof HTMLSelectElement) {
        initCustomSelect(select);
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitContactForm(form);
    });
  });
};
