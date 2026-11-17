const MOTION_DURATION = 320;
const MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const panelAnimations = new WeakMap();
const itemAnimations = new WeakMap();

const shouldReduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.dataset.bemkeReducedMotion === 'true';

const animatePanelChange = (panels, selectedIndex, startHeight) => {
  const panel = panels[selectedIndex];
  const container = panel.parentElement;

  if (!container || shouldReduceMotion() || typeof panel.animate !== 'function') {
    return;
  }

  const runningAnimations = panelAnimations.get(container) || [];
  runningAnimations.forEach((animation) => animation.cancel());

  const endHeight = panel.getBoundingClientRect().height;
  const animations = [];

  container.style.overflow = 'hidden';

  if (Math.abs(startHeight - endHeight) > 1) {
    animations.push(
      container.animate(
        [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
        { duration: MOTION_DURATION, easing: MOTION_EASING },
      ),
    );
  }

  animations.push(
    panel.animate(
      [
        { opacity: 0, transform: 'translateY(0.8rem)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: MOTION_DURATION, easing: MOTION_EASING },
    ),
  );

  panelAnimations.set(container, animations);

  Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    if (panelAnimations.get(container) !== animations) {
      return;
    }

    container.style.removeProperty('overflow');
    panelAnimations.delete(container);
  });
};

const selectTab = (tabs, panels, selectedIndex, moveFocus = false, animate = false) => {
  const container = panels[0]?.parentElement;
  const startHeight = container?.getBoundingClientRect().height || 0;
  const previousIndex = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');

  tabs.forEach((tab, index) => {
    const active = index === selectedIndex;

    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[index].hidden = !active;
  });

  if (animate && previousIndex !== selectedIndex) {
    animatePanelChange(panels, selectedIndex, startHeight);
  }

  if (moveFocus) {
    tabs[selectedIndex].focus();
  }
};

const initCategoryTabs = (section) => {
  const tabList = section.querySelector('.bemke-qa__tabs');
  const tabs = Array.from(section.querySelectorAll('[data-qa-tab]'));
  const panels = tabs
    .map((tab) => section.querySelector(tab.getAttribute('href')))
    .filter(Boolean);

  if (!tabList || tabs.length < 1 || tabs.length !== panels.length) {
    return;
  }

  tabList.setAttribute('role', 'tablist');

  tabs.forEach((tab, index) => {
    const panel = panels[index];
    const tabId = `${panel.id}-tab`;

    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);

    tab.addEventListener('click', (event) => {
      event.preventDefault();
      selectTab(tabs, panels, index, false, true);
    });

    tab.addEventListener('keydown', (event) => {
      let targetIndex = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        targetIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        targetIndex = 0;
      } else if (event.key === 'End') {
        targetIndex = tabs.length - 1;
      }

      if (targetIndex === null) {
        return;
      }

      event.preventDefault();
      selectTab(tabs, panels, targetIndex, true, true);
    });
  });

  const hashIndex = panels.findIndex((panel) => `#${panel.id}` === window.location.hash);
  selectTab(tabs, panels, hashIndex >= 0 ? hashIndex : 0);
};

const stopItemAnimation = (item) => {
  const running = itemAnimations.get(item);

  if (!running) {
    return;
  }

  const currentHeight = item.getBoundingClientRect().height;

  running.height.cancel();
  running.answer?.cancel();
  item.style.height = `${currentHeight}px`;
  itemAnimations.delete(item);
};

const finishItemAnimation = (item, heightAnimation, open) => {
  const running = itemAnimations.get(item);

  if (!running || running.height !== heightAnimation) {
    return;
  }

  item.open = open;
  item.style.removeProperty('height');
  item.classList.remove('is-animating', 'is-opening', 'is-closing');
  itemAnimations.delete(item);
};

const animateItem = (item, open) => {
  const summary = item.querySelector('.bemke-qa__summary');
  const answer = item.querySelector('.bemke-qa__answer');

  if (!summary || !answer) {
    item.open = open;
    return;
  }

  stopItemAnimation(item);

  const startHeight = item.getBoundingClientRect().height;

  item.classList.remove(open ? 'is-closing' : 'is-opening');
  item.classList.add('is-animating', open ? 'is-opening' : 'is-closing');

  if (open) {
    item.open = true;
  }

  item.style.height = `${startHeight}px`;

  const endHeight = open ? item.scrollHeight : summary.getBoundingClientRect().height;
  const heightAnimation = item.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    { duration: MOTION_DURATION, easing: MOTION_EASING },
  );
  const answerAnimation = answer.animate(
    open
      ? [
          { opacity: 0, transform: 'translateY(-0.6rem)' },
          { opacity: 1, transform: 'translateY(0)' },
        ]
      : [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-0.4rem)' },
        ],
    { duration: open ? 280 : 200, easing: MOTION_EASING },
  );

  itemAnimations.set(item, { height: heightAnimation, answer: answerAnimation });
  heightAnimation.addEventListener('finish', () => finishItemAnimation(item, heightAnimation, open));
};

const initAccordionItems = (section) => {
  section.querySelectorAll('.bemke-qa__item').forEach((item) => {
    const summary = item.querySelector('.bemke-qa__summary');
    const answer = item.querySelector('.bemke-qa__answer');

    if (!summary || !answer || item.dataset.qaAccordionReady === 'true') {
      return;
    }

    item.dataset.qaAccordionReady = 'true';
    summary.addEventListener('click', (event) => {
      if (shouldReduceMotion() || typeof item.animate !== 'function') {
        return;
      }

      event.preventDefault();
      const open = !item.open || item.classList.contains('is-closing');
      animateItem(item, open);
    });

    answer.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const isInteractive = target?.closest(
        'a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]',
      );

      if (isInteractive || !item.open) {
        return;
      }

      if (shouldReduceMotion() || typeof item.animate !== 'function') {
        item.open = false;
        return;
      }

      animateItem(item, false);
    });
  });
};

export const initQaSections = () => {
  document.querySelectorAll('[data-bemke-qa]').forEach((section) => {
    initCategoryTabs(section);
    initAccordionItems(section);
  });
};
