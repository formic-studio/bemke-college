import './styles/qa-admin.css';

const createKey = (prefix) => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
};

const removeEditor = (scope) => {
  const textareas = scope.querySelectorAll('textarea[id]');

  if (!textareas.length || !window.wp?.editor?.remove) {
    return;
  }

  window.tinymce?.triggerSave();

  textareas.forEach((textarea) => {
    try {
      window.wp.editor.remove(textarea.id);
    } catch {
      // The editor may not have finished initializing yet.
    }
  });
};

const restoreEditors = (scope) => {
  scope.querySelectorAll('textarea[id]').forEach(initializeEditor);
};

const initializeEditor = (textarea) => {
  if (!textarea?.id || !window.wp?.editor?.initialize) {
    return;
  }

  window.wp.editor.initialize(textarea.id, {
    mediaButtons: false,
    quicktags: true,
    tinymce: {
      wpautop: true,
      toolbar1: 'bold italic bullist numlist blockquote link unlink undo redo',
      toolbar2: '',
    },
  });

  textarea.removeAttribute('data-qa-new-editor');
};

const initSortable = (root) => {
  if (!window.jQuery?.fn?.sortable) {
    return;
  }

  const $ = window.jQuery;

  $(root)
    .find('[data-qa-sortable-items]')
    .each((_, list) => {
      const $list = $(list);

      if ($list.hasClass('ui-sortable')) {
        $list.sortable('refresh');
        return;
      }

      $list.sortable({
        axis: 'y',
        handle: '[data-qa-drag-handle]',
        items: '> [data-qa-item]',
        placeholder: 'bemke-qa-admin__sortable-placeholder',
        tolerance: 'pointer',
        start: (_event, ui) => removeEditor(ui.item[0]),
        stop: (_event, ui) => restoreEditors(ui.item[0]),
      });
    });

  const $categories = $(root).find('[data-qa-categories]');

  if (!$categories.hasClass('ui-sortable')) {
    $categories.sortable({
      axis: 'y',
      handle: '[data-qa-category-drag]',
      items: '> [data-qa-category]',
      placeholder: 'bemke-qa-admin__category-placeholder',
      tolerance: 'pointer',
      start: (_event, ui) => removeEditor(ui.item[0]),
      stop: (_event, ui) => restoreEditors(ui.item[0]),
    });
  } else {
    $categories.sortable('refresh');
  }
};

const addQuestion = (root, button) => {
  const template = document.querySelector('#bemke-qa-item-template');
  const target = document.getElementById(button.dataset.target || '');
  const prefix = button.dataset.prefix || '';

  if (!template || !target || !prefix) {
    return;
  }

  const itemKey = createKey('item');
  const editorKey = createKey('editor');
  const html = template.innerHTML
    .replaceAll('__PREFIX__', prefix)
    .replaceAll('__ITEM_KEY__', itemKey)
    .replaceAll('__EDITOR_KEY__', editorKey);

  target.insertAdjacentHTML('beforeend', html);

  const item = target.lastElementChild;
  const textarea = item?.querySelector('[data-qa-new-editor]');

  initializeEditor(textarea);
  initSortable(root);
  item?.querySelector('[data-qa-question]')?.focus();
};

const addCategory = (root) => {
  const template = document.querySelector('#bemke-qa-category-template');
  const target = root.querySelector('[data-qa-categories]');

  if (!template || !target) {
    return;
  }

  const categoryKey = createKey('category');
  const html = template.innerHTML.replaceAll('__CATEGORY_KEY__', categoryKey);

  target.insertAdjacentHTML('beforeend', html);
  initSortable(root);
  target.lastElementChild?.querySelector('input[type="text"]')?.focus();
};

const syncVariantPanels = (root) => {
  const selected = root.querySelector('input[name="bemke_college_qa_data[variant]"]:checked')?.value || 'plain';

  root.querySelectorAll('[data-qa-variant-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.qaVariantPanel !== selected;
  });
};

const toggleDisclosure = (button, panel, type) => {
  if (!button || !panel) {
    return;
  }

  const expanded = button.getAttribute('aria-expanded') === 'true';
  const nextExpanded = !expanded;

  button.setAttribute('aria-expanded', String(nextExpanded));
  button.classList.toggle('is-collapsed', !nextExpanded);
  panel.hidden = !nextExpanded;

  if (type === 'category') {
    button.setAttribute(
      'aria-label',
      nextExpanded ? 'Zwiń kategorię' : 'Rozwiń kategorię',
    );
  }
};

const initQaAdmin = () => {
  const root = document.querySelector('[data-bemke-qa-admin]');

  if (!root) {
    return;
  }

  syncVariantPanels(root);
  initSortable(root);

  if (window.jQuery?.fn?.sortable) {
    window.jQuery('.meta-box-sortables').on(
      'sortstart.bemkeQa',
      (_event, ui) => {
        if (ui.item?.[0]?.contains(root)) {
          removeEditor(root);
        }
      },
    ).on(
      'sortstop.bemkeQa',
      (_event, ui) => {
        if (ui.item?.[0]?.contains(root)) {
          restoreEditors(root);
        }
      },
    );
  }

  root.addEventListener('change', (event) => {
    if (event.target.matches('input[name="bemke_college_qa_data[variant]"]')) {
      syncVariantPanels(root);
    }
  });

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-qa-question]')) {
      return;
    }

    const label = event.target.closest('[data-qa-item]')?.querySelector('[data-qa-item-label]');

    if (label) {
      label.textContent = event.target.value.trim() || 'Nowe pytanie';
    }
  });

  root.addEventListener('click', (event) => {
    const addItem = event.target.closest('[data-qa-add-item]');
    const addCategoryButton = event.target.closest('[data-qa-add-category]');
    const removeItemButton = event.target.closest('[data-qa-remove-item]');
    const removeCategoryButton = event.target.closest('[data-qa-remove-category]');
    const toggleItemButton = event.target.closest('[data-qa-toggle-item]');
    const toggleCategoryButton = event.target.closest('[data-qa-toggle-category]');

    if (toggleItemButton) {
      const panel = document.getElementById(
        toggleItemButton.getAttribute('aria-controls') || '',
      );
      toggleDisclosure(toggleItemButton, panel, 'item');
      return;
    }

    if (toggleCategoryButton) {
      const panel = document.getElementById(
        toggleCategoryButton.getAttribute('aria-controls') || '',
      );
      toggleDisclosure(toggleCategoryButton, panel, 'category');
      return;
    }

    if (addItem) {
      addQuestion(root, addItem);
      return;
    }

    if (addCategoryButton) {
      addCategory(root);
      return;
    }

    if (removeItemButton) {
      const item = removeItemButton.closest('[data-qa-item]');

      if (item && window.confirm('Usunąć to pytanie?')) {
        removeEditor(item);
        item.remove();
        initSortable(root);
      }
      return;
    }

    if (removeCategoryButton) {
      const category = removeCategoryButton.closest('[data-qa-category]');

      if (category && window.confirm('Usunąć kategorię razem ze wszystkimi pytaniami?')) {
        category.querySelectorAll('[data-qa-item]').forEach(removeEditor);
        category.remove();
        initSortable(root);
      }
    }
  });

  root.closest('form')?.addEventListener('submit', () => {
    window.tinymce?.triggerSave();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQaAdmin, { once: true });
} else {
  initQaAdmin();
}
