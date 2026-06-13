const ARIA_REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby'];

const getReferenceIds = (value) => value
  .split(/\s+/)
  .map((id) => id.trim())
  .filter(Boolean);

const repairAriaReference = (element, attribute) => {
  const referenceIds = getReferenceIds(element.getAttribute(attribute) || '');

  if (referenceIds.length === 0) {
    return;
  }

  const validIds = referenceIds.filter((id) => document.getElementById(id));

  if (validIds.length > 0) {
    element.setAttribute(attribute, [...new Set(validIds)].join(' '));
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
