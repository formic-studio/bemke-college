export const SLIDER_CONTROL_SELECTOR = '.arrow, .yellow-arrow, .play-btn, .arrow-right';

export function getSliderControls(
  root,
  controlsSelector,
  controlSelector = SLIDER_CONTROL_SELECTOR,
) {
  const controlsWrap = root.querySelector(controlsSelector);
  const controls = controlsWrap ? Array.from(controlsWrap.querySelectorAll(controlSelector)) : [];
  const hasAutoplayControls =
    controls.length >= 4 || controls.some(isPlayControl) || controls.some(isPauseControl);

  if (!hasAutoplayControls) {
    return {
      pause: null,
      play: null,
      prev: controls.find(isPrevControl) ?? controls[0] ?? null,
      next: controls.find(isNextControl) ?? controls[1] ?? null,
    };
  }

  const explicitPause = controls.find(isPauseControl);
  const explicitPlay = controls.find(isPlayControl);
  const pause =
    explicitPause ??
    (controls.length >= 4
      ? controls.find((control, index) => index === 0 && control !== explicitPlay) ?? null
      : null);
  const play =
    explicitPlay ??
    (controls.length >= 4
      ? controls.find((control, index) => index === 1 && control !== pause) ?? null
      : null);
  const next =
    controls.find((control) => control !== pause && control !== play && isNextControl(control)) ??
    controls[3] ??
    null;
  const prev =
    controls.find(
      (control) =>
        control !== pause && control !== play && control !== next && isPrevControl(control),
    ) ??
    controls.find(
      (control, index) =>
        index >= 2 && control !== pause && control !== play && control !== next,
    ) ??
    null;

  return {
    pause,
    play,
    prev,
    next,
  };
}

export function bindSliderControl(control, { label, controlsId, handler }) {
  if (!control || typeof handler !== 'function') {
    return;
  }

  control.classList.remove('bricks-lazy-hidden');
  control.setAttribute('role', 'button');
  control.setAttribute('tabindex', '0');
  control.setAttribute('aria-label', label);

  if (controlsId) {
    control.setAttribute('aria-controls', controlsId);
  }

  control.querySelectorAll('svg').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  });

  control.addEventListener('click', (event) => {
    event.preventDefault();
    handler();
  });
  control.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handler();
  });
}

function isPauseControl(control) {
  return (
    control.classList.contains('pause-btn') ||
    control.classList.contains('stop-btn') ||
    controlDescriptorIncludes(control, ['pause', 'pauza', 'stop', 'zatrzymaj'])
  );
}

function isPlayControl(control) {
  return (
    control.classList.contains('play-btn') ||
    controlDescriptorIncludes(control, ['play', 'start', 'uruchom', 'wznów', 'wznow'])
  );
}

function isPrevControl(control) {
  return (
    control.classList.contains('arrow-left') ||
    controlDescriptorIncludes(control, ['prev', 'previous', 'poprzedni', 'lewo', 'left'])
  );
}

function isNextControl(control) {
  return (
    control.classList.contains('arrow-right') ||
    controlDescriptorIncludes(control, ['next', 'nastepny', 'następny', 'prawo', 'right'])
  );
}

function controlDescriptorIncludes(control, tokens) {
  const descriptor = getControlDescriptor(control);

  return tokens.some((token) => descriptor.includes(token));
}

function getControlDescriptor(control) {
  const className = typeof control.className === 'string' ? control.className : '';

  return [
    className,
    control.getAttribute('aria-label'),
    control.getAttribute('title'),
    control.getAttribute('data-bemke-control'),
    control.textContent,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

