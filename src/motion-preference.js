export const MOTION_CHANGE_EVENT = 'bemke:motion-change';
export const MOTION_STORAGE_KEY = 'bemke_a11y_reduce_motion';

const MOTION_ATTR = 'data-bemke-reduced-motion';
const SYSTEM_QUERY = '(prefers-reduced-motion: reduce)';

let initialized = false;
let systemMotionQuery = null;
let userReducedMotion = readStoredPreference();

function readStoredPreference() {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function storePreference(reduced) {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, reduced ? 'true' : 'false');
  } catch {
    // The preference still works for the current page when storage is unavailable.
  }
}

export function isSystemReducedMotion() {
  return (
    systemMotionQuery?.matches ??
    window.matchMedia?.(SYSTEM_QUERY).matches ??
    false
  );
}

export function isReducedMotion() {
  return userReducedMotion || isSystemReducedMotion();
}

function applyMotionState(emitChange = true) {
  const previousState =
    document.documentElement.getAttribute(MOTION_ATTR) === 'true';
  const reduced = isReducedMotion();

  if (reduced) {
    document.documentElement.setAttribute(MOTION_ATTR, 'true');
  } else {
    document.documentElement.removeAttribute(MOTION_ATTR);
  }

  if (emitChange && previousState !== reduced) {
    document.dispatchEvent(
      new CustomEvent(MOTION_CHANGE_EVENT, {
        detail: {
          reduced,
          system: isSystemReducedMotion(),
          user: userReducedMotion,
        },
      }),
    );
  }

  return reduced;
}

export function setUserReducedMotion(reduced) {
  userReducedMotion = Boolean(reduced);
  storePreference(userReducedMotion);

  return applyMotionState(true);
}

export function initMotionPreference() {
  if (initialized) {
    applyMotionState(false);
    return;
  }

  initialized = true;
  systemMotionQuery = window.matchMedia?.(SYSTEM_QUERY) ?? null;

  const handleSystemPreferenceChange = () => applyMotionState(true);

  if (typeof systemMotionQuery?.addEventListener === 'function') {
    systemMotionQuery.addEventListener('change', handleSystemPreferenceChange);
  } else if (typeof systemMotionQuery?.addListener === 'function') {
    systemMotionQuery.addListener(handleSystemPreferenceChange);
  }

  applyMotionState(false);
}

