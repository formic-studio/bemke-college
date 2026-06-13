const ARIA_REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby'];

const getReferenceIds = (value) => value
  .split(/\s+/)
  .map((id) => id.trim())
  .filter(Boolean);

const getFallbackReference = (element, attribute) => {
  if (attribute === 'aria-labelledby') {
    return element.querySelector('label, legend');
  }

  return element.querySelector('[role="note"], .description, .form-description, .error, .message');
};

const repairAriaReference = (element, attribute) => {
  const referenceIds = getReferenceIds(element.getAttribute(attribute) || '');

  if (referenceIds.length === 0) {
    return;
  }

  const repairedIds = referenceIds
    .map((id) => {
      if (document.getElementById(id)) {
        return id;
      }

      const fallback = getFallbackReference(element, attribute);

      if (!fallback) {
        return null;
      }

      if (!fallback.id) {
        fallback.id = id;
      }

      return fallback.id;
    })
    .filter(Boolean);

  if (repairedIds.length > 0) {
    element.setAttribute(attribute, [...new Set(repairedIds)].join(' '));
  } else {
    element.removeAttribute(attribute);
  }
};

const repairBricksFormAria = (root = document) => {
  const selector = '[aria-labelledby], [aria-describedby]';
  const elements = [
    ...(root instanceof Element && root.matches(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];

  elements.forEach((element) => {
    ARIA_REFERENCE_ATTRIBUTES.forEach((attribute) => {
      if (element.hasAttribute(attribute)) {
        repairAriaReference(element, attribute);
      }
    });
  });
};

export const initBricksFormA11y = () => {
  repairBricksFormAria();

  document.addEventListener('bricks/ajax/end', () => repairBricksFormAria());

  if (!window.MutationObserver || !document.body) {
    return;
  }

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          repairBricksFormAria(node);
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
};
