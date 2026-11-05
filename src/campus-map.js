import { siteText as mapText } from './site-language.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const MAP_IMAGE_SELECTOR = '.map-desktop, .map-mobile';

const MAP_AREAS = [
  {
    label: 'Wioska Edukacyjna',
    labelEn: 'Educational Village',
    points:
      '3228,1673 3340,1694 3398,1727 3499,1767 3607,1799 3654,1828 3636,1908 3579,2002 3463,2139 3387,2099 3340,2078 3286,2052 3242,2042 3195,2020 3098,1984 3036,1958 3112,1837 3148,1787',
  },
  {
    label: 'Przedszkole',
    labelEn: 'Preschool',
    points:
      '3101,2065 3047,2105 2996,2148 2986,2188 3000,2213 3072,2249 3123,2217 3174,2159 3195,2108',
  },
  {
    label: 'Collegium Marianum',
    labelEn: 'Collegium Marianum',
    points:
      '2049,1262 2234,1306 2346,1327 2360,1363 2328,1483 2273,1544 2219,1649 2158,1714 2071,1751 1973,1743 1894,1711 1847,1649 1908,1476 1973,1384',
  },
  {
    label: 'FarmLab',
    labelEn: 'FarmLab',
    points:
      '2422,2334 2364,2446 2331,2511 2375,2551 2494,2606 2566,2645 2664,2595 2841,2396 2852,2356 2772,2291 2667,2251 2606,2240 2476,2215',
  },
  {
    label: 'Hala sportowa',
    labelEn: 'Sports hall',
    points:
      '2982,1601 2899,1717 2921,1749 2996,1778 3072,1807 3105,1782 3152,1731 3166,1680 3170,1655 3130,1619 3069,1604',
  },
  {
    label: 'Parking',
    labelEn: 'Parking',
    points:
      '2595,1459 2552,1556 2671,1589 2754,1625 2805,1647 2895,1672 2978,1567',
  },
  {
    label: 'Park',
    labelEn: 'Park',
    points:
      '2089,1807 2259,1706 2339,1648 2469,1677 2584,1739 2642,1786 2696,1865 2754,1902 2830,1952 2899,2035 2863,2162 2783,2195 2602,2216 2433,2187 2263,2173 2165,2122 2057,2072 2035,1902',
  },
  {
    label: 'Gospodarstwo',
    labelEn: 'Farm',
    points:
      '2107,1236 2169,1250 2288,1279 2451,1312 2512,1225 2577,1116 2592,1087 2490,1051 2523,939 2259,881 2179,1008 2151,1059 2129,1116',
  },
];

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, name);

  Object.entries(attributes).forEach(([attribute, value]) => {
    element.setAttribute(attribute, value);
  });

  return element;
}

function setTooltipPosition(wrapper, tooltip, clientX, clientY) {
  const wrapperRect = wrapper.getBoundingClientRect();
  const viewportRect =
    wrapper.closest('.map-block')?.getBoundingClientRect() || wrapperRect;
  const localY = clientY - wrapperRect.top;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const horizontalMargin = 8;
  const verticalOffset = 12;
  const minClientX = viewportRect.left + tooltipWidth / 2 + horizontalMargin;
  const maxClientX = viewportRect.right - tooltipWidth / 2 - horizontalMargin;
  const tooltipClientX =
    minClientX > maxClientX
      ? viewportRect.left + viewportRect.width / 2
      : Math.min(Math.max(clientX, minClientX), maxClientX);
  const x = tooltipClientX - wrapperRect.left;
  const placeBelow =
    clientY <
    viewportRect.top + tooltipHeight + verticalOffset + horizontalMargin;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${localY}px`;
  tooltip.dataset.placement = placeBelow ? 'below' : 'above';
}

function setTooltipAtArea(wrapper, tooltip, area) {
  const areaRect = area.getBoundingClientRect();

  setTooltipPosition(
    wrapper,
    tooltip,
    areaRect.left + areaRect.width / 2,
    areaRect.top + areaRect.height / 2,
  );
}

function createMapControls() {
  const controls = document.createElement('div');
  controls.className = 'campus-map__controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', mapText('Sterowanie mapą', 'Map controls'));

  const directions = [
    {
      direction: 'up',
      label: mapText('Przesuń widok mapy w górę', 'Move map view up'),
    },
    {
      direction: 'left',
      label: mapText('Przesuń widok mapy w lewo', 'Move map view left'),
    },
    {
      direction: 'right',
      label: mapText('Przesuń widok mapy w prawo', 'Move map view right'),
    },
    {
      direction: 'down',
      label: mapText('Przesuń widok mapy w dół', 'Move map view down'),
    },
  ];

  directions.forEach(({ direction, label }) => {
    const button = document.createElement('button');
    button.className = 'campus-map__control';
    button.type = 'button';
    button.dataset.direction = direction;
    button.setAttribute('aria-label', label);

    const icon = createSvgElement('svg', {
      width: '22',
      height: '22',
      viewBox: '0 0 22 22',
      fill: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
    });
    const background = createSvgElement('rect', {
      x: '0.340427',
      y: '0.340427',
      width: '21.1065',
      height: '21.1065',
      rx: '3.7447',
      fill: '#F6BA62',
      'fill-opacity': '0.7',
    });
    const border = createSvgElement('rect', {
      x: '0.340427',
      y: '0.340427',
      width: '21.1065',
      height: '21.1065',
      rx: '3.7447',
      stroke: '#E0A545',
      'stroke-width': '0.680855',
    });
    const arrow = createSvgElement('path', {
      d: 'M6.88976 12.5554L10.8941 8.55108L14.8984 12.5554',
      stroke: '#1B0508',
      'stroke-width': '1.36171',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });

    icon.append(background, border, arrow);
    button.append(icon);
    controls.append(button);
  });

  return controls;
}

function initCampusMapPan(viewport, map, images, hideTooltip) {
  let position = { x: 0, y: 0 };
  let pointerId = null;
  let pointerStart = { x: 0, y: 0 };
  let positionStart = { x: 0, y: 0 };
  let hasDragged = false;
  let isInitialPosition = true;

  const getBounds = () => ({
    minX: Math.min(0, viewport.clientWidth - map.offsetWidth),
    minY: Math.min(0, viewport.clientHeight - map.offsetHeight),
  });

  const clampPosition = (nextPosition) => {
    const { minX, minY } = getBounds();

    return {
      x: Math.min(0, Math.max(minX, nextPosition.x)),
      y: Math.min(0, Math.max(minY, nextPosition.y)),
    };
  };

  const renderPosition = () => {
    map.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  };

  const setPosition = (nextPosition) => {
    position = clampPosition(nextPosition);
    renderPosition();
  };

  const moveInDirection = (direction, step = 48) => {
    const directions = {
      left: { x: step, y: 0 },
      right: { x: -step, y: 0 },
      up: { x: 0, y: step },
      down: { x: 0, y: -step },
    };
    const delta = directions[direction];

    if (!delta) return;

    hideTooltip();
    setPosition({
      x: position.x + delta.x,
      y: position.y + delta.y,
    });
  };

  const updateDimensions = () => {
    if (isInitialPosition) {
      position = clampPosition({
        x: viewport.clientWidth / 2 - map.offsetWidth * 0.64,
        y: viewport.clientHeight / 2 - map.offsetHeight * 0.44,
      });
      isInitialPosition = false;
    } else {
      position = clampPosition(position);
    }

    renderPosition();
  };

  const finishDrag = (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;

    if (viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }

    if (hasDragged) {
      map.dataset.dragged = '1';
      window.setTimeout(() => {
        delete map.dataset.dragged;
      }, 100);
    }

    pointerId = null;
    viewport.classList.remove('is-dragging');
  };

  const imageAlt = mapText(
    'Plan Campusu Bemke z zaznaczonymi najważniejszymi obiektami',
    'Campus Bemke plan showing the key facilities',
  );

  images.forEach((image) => {
    image.draggable = false;

    if (!image.alt.trim()) {
      image.alt = imageAlt;
    }
  });

  viewport.dataset.bemkeCampusMapPan = '1';
  viewport.setAttribute('role', 'region');
  viewport.setAttribute(
    'aria-label',
    mapText(
      'Interaktywna mapa Campus Bemke. Przeciągnij mapę lub użyj przycisków sterowania.',
      'Interactive Campus Bemke map. Drag the map or use the map controls.',
    ),
  );

  const controls = createMapControls();
  viewport.append(controls);

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('.campus-map__control');

    if (!button) return;

    event.preventDefault();
    moveInDirection(button.dataset.direction);
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (
      event.target.closest('.campus-map__controls') ||
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    pointerId = event.pointerId;
    pointerStart = { x: event.clientX, y: event.clientY };
    positionStart = { ...position };
    hasDragged = false;
    viewport.setPointerCapture(pointerId);
    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (event) => {
    if (pointerId === null || event.pointerId !== pointerId) return;

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;

    if (!hasDragged && Math.hypot(deltaX, deltaY) > 4) {
      hasDragged = true;
      hideTooltip();
    }

    if (hasDragged) {
      event.preventDefault();
      setPosition({
        x: positionStart.x + deltaX,
        y: positionStart.y + deltaY,
      });
    }
  });

  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  viewport.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 120 : 48;
    const directions = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    };
    const direction = directions[event.key];

    if (!direction) return;

    event.preventDefault();
    moveInDirection(direction, step);
  });

  const resizeObserver = new ResizeObserver(updateDimensions);
  resizeObserver.observe(viewport);
  resizeObserver.observe(map);

  if (images.every((image) => image.complete)) {
    requestAnimationFrame(updateDimensions);
  } else {
    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener('load', updateDimensions, { once: true });
      }
    });
  }
}

export function initCampusMap() {
  const firstImage = document.querySelector(MAP_IMAGE_SELECTOR);

  if (!firstImage) return;

  const viewport = firstImage.closest('.map-block') || firstImage.parentElement;

  if (viewport.querySelector('[data-bemke-campus-map-ready="1"]')) return;

  const images = Array.from(viewport.querySelectorAll(MAP_IMAGE_SELECTOR));

  if (!images.length) return;

  viewport.classList.add('map-block');

  const wrapper = document.createElement('div');
  wrapper.className = 'campus-map';
  wrapper.dataset.bemkeCampusMapReady = '1';

  firstImage.before(wrapper);
  images.forEach((image) => wrapper.append(image));

  const overlay = createSvgElement('svg', {
    class: 'campus-map__areas',
    viewBox: '0 0 4096 4092',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-label': mapText(
      'Interaktywna mapa Campus Bemke',
      'Interactive Campus Bemke map',
    ),
  });

  const tooltip = document.createElement('div');
  tooltip.className = 'campus-map__tooltip';
  tooltip.id = 'bemke-campus-map-status';
  tooltip.setAttribute('role', 'status');
  tooltip.setAttribute('aria-live', 'polite');

  let touchArea = null;

  const hideTooltip = () => {
    tooltip.removeAttribute('data-visible');
    touchArea?.classList.remove('is-active');
    touchArea = null;
  };

  const showTooltip = (area, label) => {
    tooltip.textContent = label;
    tooltip.dataset.visible = 'true';
    setTooltipAtArea(wrapper, tooltip, area);
  };

  MAP_AREAS.forEach(({ label: labelPl, labelEn, points }) => {
    const label = mapText(labelPl, labelEn);
    const area = createSvgElement('polygon', {
      class: 'campus-map__area',
      points,
      role: 'button',
      tabindex: '0',
      'aria-label': label,
      'aria-describedby': tooltip.id,
    });
    const title = createSvgElement('title');
    title.textContent = label;
    area.append(title);

    area.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;

      tooltip.textContent = label;
      tooltip.dataset.visible = 'true';
      setTooltipPosition(wrapper, tooltip, event.clientX, event.clientY);
    });

    area.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch') {
        setTooltipPosition(wrapper, tooltip, event.clientX, event.clientY);
      }
    });

    area.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch' && document.activeElement !== area) {
        hideTooltip();
      }
    });

    area.addEventListener('focus', () => showTooltip(area, label));
    area.addEventListener('blur', hideTooltip);

    area.addEventListener('click', (event) => {
      if (wrapper.dataset.dragged === '1') {
        event.preventDefault();
        return;
      }

      if (!window.matchMedia('(hover: none)').matches) return;

      event.preventDefault();

      if (touchArea === area) {
        hideTooltip();
        return;
      }

      hideTooltip();
      touchArea = area;
      area.classList.add('is-active');
      showTooltip(area, label);
      touchArea = area;
    });

    area.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();

      if (touchArea === area && tooltip.dataset.visible === 'true') {
        hideTooltip();
        return;
      }

      hideTooltip();
      touchArea = area;
      area.classList.add('is-active');
      showTooltip(area, label);
      touchArea = area;
    });

    overlay.append(area);
  });

  wrapper.append(overlay, tooltip);
  initCampusMapPan(viewport, wrapper, images, hideTooltip);

  document.addEventListener('pointerdown', (event) => {
    if (touchArea && !wrapper.contains(event.target)) {
      hideTooltip();
    }
  });
}
