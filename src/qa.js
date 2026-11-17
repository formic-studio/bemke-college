const selectTab = (tabs, panels, selectedIndex, moveFocus = false) => {
  tabs.forEach((tab, index) => {
    const active = index === selectedIndex;

    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[index].hidden = !active;
  });

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
      selectTab(tabs, panels, index);
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
      selectTab(tabs, panels, targetIndex, true);
    });
  });

  const hashIndex = panels.findIndex((panel) => `#${panel.id}` === window.location.hash);
  selectTab(tabs, panels, hashIndex >= 0 ? hashIndex : 0);
};

export const initQaSections = () => {
  document.querySelectorAll('[data-bemke-qa]').forEach(initCategoryTabs);
};
