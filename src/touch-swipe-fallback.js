const AXIS_LOCK_THRESHOLD = 8;
const POINTER_COMPLETION_WINDOW = 500;

/**
 * Provide a native touch-event fallback for iOS browsers that can cancel a
 * PointerEvent gesture before pointerup. Pointer Events remain the primary
 * input path; markPointerHandled prevents both paths from changing a slide.
 */
export function bindTouchSwipeFallback(
  surface,
  {
    canStart,
    onCancel,
    onMove,
    onStart,
    onSwipe,
    threshold = 46,
  } = {},
) {
  if (!surface) {
    return { markPointerHandled() {} };
  }

  let pointerHandledAt = Number.NEGATIVE_INFINITY;
  let touchState = null;

  const markPointerHandled = () => {
    pointerHandledAt = performance.now();
  };

  surface.addEventListener(
    'touchstart',
    (event) => {
      if (touchState || event.touches.length !== 1 || canStart?.() === false) {
        return;
      }

      const touch = event.touches[0];

      touchState = {
        context: onStart?.(event) ?? null,
        identifier: touch.identifier,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lockedAxis: null,
        moved: false,
        startX: touch.clientX,
        startY: touch.clientY,
      };
    },
    { passive: true },
  );

  surface.addEventListener(
    'touchmove',
    (event) => {
      if (!touchState) {
        return;
      }

      const touch = findTouch(event.touches, touchState.identifier);
      if (!touch) {
        return;
      }

      touchState.lastX = touch.clientX;
      touchState.lastY = touch.clientY;

      const dx = touch.clientX - touchState.startX;
      const dy = touch.clientY - touchState.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (
        !touchState.lockedAxis &&
        (absX > AXIS_LOCK_THRESHOLD || absY > AXIS_LOCK_THRESHOLD)
      ) {
        touchState.lockedAxis = absX > absY ? 'x' : 'y';
      }

      if (touchState.lockedAxis !== 'x') {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      touchState.moved = true;
      onMove?.({
        context: touchState.context,
        dx,
        dy,
        event,
      });
    },
    { passive: false },
  );

  surface.addEventListener(
    'touchend',
    (event) => {
      if (!touchState) {
        return;
      }

      const touch =
        findTouch(event.changedTouches, touchState.identifier) ?? {
          clientX: touchState.lastX,
          clientY: touchState.lastY,
        };
      const state = touchState;
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const wasHandledByPointer =
        performance.now() - pointerHandledAt < POINTER_COMPLETION_WINDOW;

      touchState = null;

      if (wasHandledByPointer) {
        return;
      }

      const shouldMove =
        state.moved &&
        Math.abs(dx) > threshold &&
        Math.abs(dx) > Math.abs(dy);

      if (shouldMove) {
        onSwipe?.({
          context: state.context,
          direction: dx < 0 ? 1 : -1,
          dx,
          dy,
          event,
        });
        return;
      }

      onCancel?.({ context: state.context, dx, dy, event });
    },
    { passive: true },
  );

  surface.addEventListener(
    'touchcancel',
    (event) => {
      if (!touchState) {
        return;
      }

      const state = touchState;
      touchState = null;

      if (
        performance.now() - pointerHandledAt >=
        POINTER_COMPLETION_WINDOW
      ) {
        onCancel?.({ context: state.context, dx: 0, dy: 0, event });
      }
    },
    { passive: true },
  );

  return { markPointerHandled };
}

function findTouch(touchList, identifier) {
  return Array.from(touchList ?? []).find(
    (touch) => touch.identifier === identifier,
  );
}

