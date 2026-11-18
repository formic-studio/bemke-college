import { SplitText } from 'gsap/SplitText';
import { MOTION_CHANGE_EVENT, isReducedMotion } from './motion-preference.js';

const PENDING_ATTRIBUTE = 'data-bemke-hero-pending';
const FONT_WAIT_MS = 250;
const LINE_STAGGER_MS = 125;
const ENTRY_DURATION_MS = 850;

function splitHeroText(element, splits) {
  // Keep rich text and interactive descendants in their original structure.
  if (element.querySelector('a, button, div, p, ul, ol, img, svg, input')) {
    return [element];
  }

  const originalHeight = element.offsetHeight;
  const split = SplitText.create(element, {
    aria: 'none',
    linesClass: 'bemke-hero-intro-line',
    tag: 'span',
    type: 'lines',
  });

  const lines = split.lines.filter((line) => line.textContent.trim());
  if (!lines.length || Math.abs(element.offsetHeight - originalHeight) > 1) {
    split.revert();
    return [element];
  }

  splits.push(split);
  return lines;
}

export async function revealHeroText(groups) {
  const root = document.documentElement;
  const animations = [];
  const splits = [];
  const showText = () => root.removeAttribute(PENDING_ATTRIBUTE);
  const finish = () => {
    splits.forEach((split) => split.revert());
    animations.forEach((animation) => animation.cancel());
    document.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
    showText();
  };
  const onMotionChange = (event) => {
    if (event.detail?.reduced) finish();
  };

  try {
    if (document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS)),
      ]);
    }

    if (isReducedMotion() || !root.hasAttribute(PENDING_ATTRIBUTE)) return;

    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const keyframes = [
      {
        clipPath: 'inset(100% -5% 0)',
        filter: mobile ? 'none' : 'blur(5px)',
        translate: mobile ? '0 6px' : '0 10px',
      },
      {
        clipPath: 'inset(-40% -5%)',
        filter: 'none',
        translate: '0 0',
      },
    ];

    for (const elements of groups) {
      const visible = elements.filter((element) => element.getClientRects().length);
      const lines = visible.flatMap((element) => splitHeroText(element, splits));

      lines.forEach((line, index) => {
        animations.push(line.animate(keyframes, {
          delay: index * LINE_STAGGER_MS,
          duration: ENTRY_DURATION_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        }));
      });
    }

    document.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);
    showText();
    await Promise.allSettled(animations.map((animation) => animation.finished));
  } finally {
    finish();
  }
}
