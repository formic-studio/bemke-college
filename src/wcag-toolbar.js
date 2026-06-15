const CONTRAST_STORAGE_KEY = 'bemke_a11y_contrast_mode';
const FONT_SCALE_STORAGE_KEY = 'bemke_a11y_font_scale';
const BOOTED_KEY = '__bemkeWcagToolbarBooted';

const CONTRAST_OPTIONS = new Map([
  ['default', 'Domyślny kontrast'],
  ['white-black', 'Biały tekst na czarnym tle'],
  ['black-yellow', 'Czarny tekst na żółtym tle'],
  ['yellow-black', 'Żółty tekst na czarnym tle'],
]);

const FONT_SCALE_OPTIONS = [
  {
    key: 'normal',
    label: 'Normalny rozmiar tekstu',
    scale: 1,
  },
  {
    key: 'large',
    label: 'Duży rozmiar tekstu',
    scale: 1.125,
  },
  {
    key: 'x-large',
    label: 'Bardzo duży rozmiar tekstu',
    scale: 1.25,
  },
];

let activeContrast = 'default';
let activeFontScale = 1;
let refreshFrame = 0;

const uniqueElements = (elements) => Array.from(new Set(elements));

const safeReadStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeWriteStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked in private browsing or strict privacy modes.
  }
};

const normalizeContrast = (contrast) =>
  CONTRAST_OPTIONS.has(contrast) ? contrast : 'default';

const normalizeScale = (scale) => {
  const numericScale = Number(scale);

  if (!Number.isFinite(numericScale)) {
    return 1;
  }

  return FONT_SCALE_OPTIONS.reduce((closest, option) =>
    Math.abs(option.scale - numericScale) < Math.abs(closest.scale - numericScale)
      ? option
      : closest,
  ).scale;
};

const getScaleOption = (scale) => {
  const normalizedScale = normalizeScale(scale);

  return FONT_SCALE_OPTIONS.find((option) => option.scale === normalizedScale) ?? FONT_SCALE_OPTIONS[0];
};

const getStoredContrast = () => {
  const storedContrast = safeReadStorage(CONTRAST_STORAGE_KEY);

  return storedContrast ? normalizeContrast(storedContrast) : null;
};

const getStoredFontScale = () => {
  const storedScale = safeReadStorage(FONT_SCALE_STORAGE_KEY);

  return storedScale ? normalizeScale(storedScale) : null;
};

const getContrastControls = () =>
  Array.from(document.querySelectorAll('[data-contrast]'));

const getFontScaleControlEntries = () => {
  const controls = [];

  FONT_SCALE_OPTIONS.forEach((option) => {
    document.querySelectorAll('a, button, [role="button"]').forEach((element) => {
      const ariaLabel = element.getAttribute('aria-label');
      const elementScale = element.getAttribute('data-a11y-scale');

      if (ariaLabel === option.label || Number(elementScale) === option.scale) {
        controls.push({ element, option });
      }
    });
  });

  if (controls.length > 0) {
    return controls.filter(({ element }, index) =>
      controls.findIndex((entry) => entry.element === element) === index,
    );
  }

  const fallbackContainers = ['#brxe-eytbpv', '#brxe-kecesp'];

  for (const selector of fallbackContainers) {
    const container = document.querySelector(selector);
    const fallbackControls = container
      ? Array.from(container.querySelectorAll('a, button')).slice(0, FONT_SCALE_OPTIONS.length)
      : [];

    if (fallbackControls.length === FONT_SCALE_OPTIONS.length) {
      return fallbackControls.map((element, index) => ({
        element,
        option: FONT_SCALE_OPTIONS[index],
      }));
    }
  }

  return [];
};

const syncContrastControls = () => {
  getContrastControls().forEach((control) => {
    const contrast = normalizeContrast(control.getAttribute('data-contrast'));

    control.setAttribute('aria-pressed', contrast === activeContrast ? 'true' : 'false');
  });
};

const syncFontScaleControls = () => {
  getFontScaleControlEntries().forEach(({ element, option }) => {
    element.setAttribute('aria-pressed', option.scale === activeFontScale ? 'true' : 'false');
  });
};

const setupContrastControls = () => {
  getContrastControls().forEach((control) => {
    const contrast = normalizeContrast(control.getAttribute('data-contrast'));

    if (control.tagName === 'A' && !control.getAttribute('href')) {
      control.setAttribute('href', '#');
    }

    control.setAttribute('role', 'button');
    control.setAttribute('aria-label', CONTRAST_OPTIONS.get(contrast) ?? 'Tryb kontrastu');
    control.setAttribute('data-a11y-contrast-fixed', 'true');

    if (!control.hasAttribute('tabindex')) {
      control.setAttribute('tabindex', '0');
    }
  });
};

const setupFontScaleControls = () => {
  getFontScaleControlEntries().forEach(({ element, option }) => {
    if (element.tagName === 'A' && !element.getAttribute('href')) {
      element.setAttribute('href', '#');
    }

    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', option.label);
    element.setAttribute('data-a11y-scale', String(option.scale));

    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  });
};

const setContrast = (contrast, shouldPersist = true) => {
  activeContrast = normalizeContrast(contrast);
  document.documentElement.setAttribute('data-contrast', activeContrast);

  if (shouldPersist) {
    safeWriteStorage(CONTRAST_STORAGE_KEY, activeContrast);
  }

  syncContrastControls();
};

const setFontScale = (scale, shouldPersist = true) => {
  const option = getScaleOption(scale);

  activeFontScale = option.scale;
  document.documentElement.setAttribute('data-a11y-font-scale', option.key);
  document.documentElement.style.setProperty('--a11y-font-scale', String(activeFontScale));

  if (shouldPersist) {
    safeWriteStorage(FONT_SCALE_STORAGE_KEY, String(activeFontScale));
  }

  syncFontScaleControls();
};

const getClosestContrastControl = (target) => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('[data-contrast]');
};

const getClosestFontScaleControl = (target) => {
  if (!(target instanceof Element)) {
    return null;
  }

  const control = target.closest('a, button, [role="button"]');

  if (!control) {
    return null;
  }

  const scale = control.getAttribute('data-a11y-scale');
  const label = control.getAttribute('aria-label');
  const hasScale = scale !== null && FONT_SCALE_OPTIONS.some((option) => option.scale === Number(scale));
  const hasLabel = FONT_SCALE_OPTIONS.some((option) => option.label === label);

  return hasScale || hasLabel ? control : null;
};

const getScaleFromControl = (control) => {
  const scale = control.getAttribute('data-a11y-scale');

  if (scale !== null) {
    return normalizeScale(scale);
  }

  const label = control.getAttribute('aria-label');
  const option = FONT_SCALE_OPTIONS.find((entry) => entry.label === label);

  return option?.scale ?? null;
};

const refreshControls = () => {
  setupContrastControls();
  setupFontScaleControls();
  setContrast(getStoredContrast() ?? activeContrast, false);
  setFontScale(getStoredFontScale() ?? activeFontScale, false);
};

const queueRefreshControls = () => {
  if (refreshFrame) {
    return;
  }

  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = 0;
    refreshControls();
  });
};

const handlePointerClick = (event) => {
  const contrastControl = getClosestContrastControl(event.target);

  if (contrastControl) {
    event.preventDefault();
    setContrast(contrastControl.getAttribute('data-contrast'));
    return;
  }

  const fontScaleControl = getClosestFontScaleControl(event.target);
  const scale = fontScaleControl ? getScaleFromControl(fontScaleControl) : null;

  if (scale !== null) {
    event.preventDefault();
    setFontScale(scale);
  }
};

const handleKeyboardActivation = (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') {
    return;
  }

  const controls = uniqueElements([
    getClosestContrastControl(event.target),
    getClosestFontScaleControl(event.target),
  ].filter(Boolean));

  if (!controls.length) {
    return;
  }

  event.preventDefault();

  const [control] = controls;

  if (control.hasAttribute('data-contrast')) {
    setContrast(control.getAttribute('data-contrast'));
    return;
  }

  const scale = getScaleFromControl(control);

  if (scale !== null) {
    setFontScale(scale);
  }
};

export const initWcagToolbar = () => {
  refreshControls();

  if (window[BOOTED_KEY]) {
    return;
  }

  window[BOOTED_KEY] = true;
  document.addEventListener('click', handlePointerClick, true);
  document.addEventListener('keydown', handleKeyboardActivation, true);
  document.addEventListener('bricks/ajax/end', queueRefreshControls);

  if (!window.MutationObserver || !document.body) {
    return;
  }

  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
      queueRefreshControls();
    }
  }).observe(document.body, { childList: true, subtree: true });
};
