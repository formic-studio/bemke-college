/**
 * Convert a Bricks link/block used only as a control into a native button.
 * The classes, IDs, data attributes and visual children remain unchanged.
 */
export function ensureButtonElement(element) {
  if (!element) {
    return null;
  }

  if (element.tagName === 'BUTTON') {
    element.type = 'button';
    element.removeAttribute('href');
    element.removeAttribute('role');
    return element;
  }

  const button = document.createElement('button');

  Array.from(element.attributes).forEach(({ name, value }) => {
    if (['href', 'target', 'rel', 'role', 'tabindex', 'type'].includes(name)) {
      return;
    }

    button.setAttribute(name, value);
  });

  button.type = 'button';
  button.append(...Array.from(element.childNodes));
  element.replaceWith(button);

  return button;
}

