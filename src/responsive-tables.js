import './styles/responsive-tables.css';
import { siteText } from './site-language.js';

const TABLE_SELECTOR = '.table-grid';
const READY_ATTR = 'data-bemke-responsive-table-ready';
const ACTIVE_ATTR = 'data-bemke-table-scroll-active';
const WRAPPER_CLASS = 'bemke-responsive-table';
const SCROLLER_CLASS = 'bemke-table-scroll';
const INSTRUCTIONS_CLASS = 'bemke-table-scroll__instructions';
const MOBILE_QUERY = '(max-width: 1199px)';
const MIN_COLUMN_WIDTH_PX = 150;
const MIN_TABLE_WIDTH_PX = 480;

let tableId = 0;

export function initResponsiveTables(scope = document) {
  scope.querySelectorAll(TABLE_SELECTOR).forEach(initResponsiveTable);
}

function initResponsiveTable(table) {
  if (table.getAttribute(READY_ATTR) === '1') {
    table.__bemkeResponsiveTableRefresh?.();
    return;
  }

  const parent = table.parentElement;

  if (!parent) {
    return;
  }

  const computedStyle = window.getComputedStyle(table);
  const parentStyle = window.getComputedStyle(parent);
  const columnCount = countGridTracks(computedStyle.gridTemplateColumns);
  const tableMinWidth = Math.max(
    MIN_TABLE_WIDTH_PX,
    columnCount * MIN_COLUMN_WIDTH_PX,
  );
  const wrapper = document.createElement('div');
  const scroller = document.createElement('div');
  const hint = document.createElement('span');
  const instructions = document.createElement('span');
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  const heading = getRegionHeading(table);

  tableId += 1;

  wrapper.className = WRAPPER_CLASS;
  wrapper.style.marginBlockStart = computedStyle.marginBlockStart;
  wrapper.style.marginBlockEnd = computedStyle.marginBlockEnd;

  if (parentStyle.display.includes('grid')) {
    wrapper.style.gridColumn = computedStyle.gridColumn;
    wrapper.style.gridRow = computedStyle.gridRow;
    wrapper.style.alignSelf = computedStyle.alignSelf;
    wrapper.style.justifySelf = computedStyle.justifySelf;

    table.style.gridColumn = 'auto';
    table.style.gridRow = 'auto';
    table.style.alignSelf = 'stretch';
    table.style.justifySelf = 'stretch';
  }

  scroller.className = SCROLLER_CLASS;

  hint.className = 'bemke-table-scroll__hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = siteText(
    'Przesuń tabelę w bok →',
    'Swipe to see all columns →',
  );

  instructions.id = `bemke-table-scroll-instructions-${tableId}`;
  instructions.className = INSTRUCTIONS_CLASS;
  instructions.textContent = siteText(
    'Tabela przewijana poziomo. Użyj klawiszy strzałek w lewo i w prawo, aby zobaczyć pozostałe kolumny.',
    'Horizontally scrollable table. Use the Left and Right Arrow keys to view the remaining columns.',
  );

  table.before(wrapper);
  wrapper.append(hint, scroller);
  scroller.append(table, instructions);

  table.style.setProperty('--bemke-table-min-width', `${tableMinWidth}px`);
  table.setAttribute(READY_ATTR, '1');

  const syncState = () => {
    const isScrollable =
      mediaQuery.matches && scroller.scrollWidth > scroller.clientWidth + 1;

    wrapper.toggleAttribute(ACTIVE_ATTR, isScrollable);
    scroller.toggleAttribute(ACTIVE_ATTR, isScrollable);

    if (!isScrollable) {
      scroller.removeAttribute('role');
      scroller.removeAttribute('tabindex');
      scroller.removeAttribute('aria-describedby');
      scroller.removeAttribute('aria-labelledby');
      scroller.removeAttribute('aria-label');
      return;
    }

    scroller.setAttribute('role', 'region');
    scroller.setAttribute('tabindex', '0');
    scroller.setAttribute('aria-describedby', instructions.id);

    if (heading) {
      heading.id ||= `bemke-table-heading-${tableId}`;
      scroller.setAttribute('aria-labelledby', heading.id);
      scroller.removeAttribute('aria-label');
    } else {
      scroller.setAttribute(
        'aria-label',
        siteText('Przewijana tabela', 'Scrollable table'),
      );
      scroller.removeAttribute('aria-labelledby');
    }
  };

  table.__bemkeResponsiveTableRefresh = syncState;

  window.requestAnimationFrame(syncState);

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(syncState);

    resizeObserver.observe(scroller);
    resizeObserver.observe(table);
    table.__bemkeResponsiveTableResizeObserver = resizeObserver;
  } else {
    window.addEventListener('resize', syncState);
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncState);
  } else {
    mediaQuery.addListener(syncState);
  }
}

function getRegionHeading(table) {
  const section = table.closest('section, article');

  if (!section) {
    return null;
  }

  const headings = Array.from(
    section.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  );

  return headings.filter(
    (heading) =>
      heading.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).at(-1) ?? null;
}

function countGridTracks(templateColumns) {
  if (!templateColumns || templateColumns === 'none') {
    return 1;
  }

  let count = 0;
  let depth = 0;
  let inTrack = false;

  for (const character of templateColumns.trim()) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (/\s/.test(character) && depth === 0) {
      if (inTrack) {
        count += 1;
        inTrack = false;
      }

      continue;
    }

    inTrack = true;
  }

  return count + Number(inTrack);
}
