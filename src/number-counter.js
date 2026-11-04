import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from "./motion-preference.js";

const COUNTER_SELECTOR = ".number-counter";
const COUNTER_READY_ATTRIBUTE = "data-bemke-number-counter-ready";
const COUNTER_START = "top 98%";
const COUNTER_DURATION = 1.8;
const COUNTER_EASE = "power2.out";

function parseNumberToken(numberToken) {
  const compactNumber = numberToken.replace(/\s/g, "");
  const commaIndex = compactNumber.lastIndexOf(",");
  const dotIndex = compactNumber.lastIndexOf(".");
  const separatorIndex = Math.max(commaIndex, dotIndex);
  const fractionLength =
    separatorIndex >= 0 ? compactNumber.length - separatorIndex - 1 : 0;
  const hasBothSeparators = commaIndex >= 0 && dotIndex >= 0;
  const hasDecimalSeparator =
    separatorIndex >= 0 &&
    fractionLength > 0 &&
    (hasBothSeparators || fractionLength <= 2);
  const decimalSeparator = hasDecimalSeparator
    ? compactNumber[separatorIndex]
    : null;
  const decimalPlaces = decimalSeparator ? fractionLength : 0;
  const normalizedNumber = decimalSeparator
    ? `${compactNumber.slice(0, separatorIndex).replace(/[.,]/g, "")}.${compactNumber.slice(separatorIndex + 1).replace(/[.,]/g, "")}`
    : compactNumber.replace(/[.,]/g, "");
  const target = Number.parseFloat(normalizedNumber);

  if (!Number.isFinite(target)) return null;

  return {
    decimalPlaces,
    decimalSeparator,
    target,
  };
}

function formatCounterValue(value, decimalPlaces, decimalSeparator) {
  if (!decimalPlaces) return String(Math.round(value));

  return value.toFixed(decimalPlaces).replace(".", decimalSeparator);
}

function getCounterData(element) {
  const finalText = element.textContent.trim();
  const numberMatch = finalText.match(/-?\d(?:[\s.,]*\d)*/);

  if (!numberMatch) return null;

  const parsedNumber = parseNumberToken(numberMatch[0]);

  if (!parsedNumber) return null;

  const numberStart = numberMatch.index ?? 0;

  return {
    ...parsedNumber,
    finalText,
    prefix: finalText.slice(0, numberStart),
    suffix: finalText.slice(numberStart + numberMatch[0].length),
  };
}

function prepareAccessibleCounter(element, finalText) {
  const accessibleText = document.createElement("span");
  const visualText = document.createElement("span");

  accessibleText.className = "bemke-sr-only";
  accessibleText.textContent = finalText;
  visualText.className = "bemke-number-counter__visual";
  visualText.setAttribute("aria-hidden", "true");
  visualText.textContent = finalText;

  element.removeAttribute("aria-label");
  element.replaceChildren(accessibleText, visualText);

  return visualText;
}

export function initNumberCounters() {
  const counters = gsap.utils.toArray(
    `${COUNTER_SELECTOR}:not([${COUNTER_READY_ATTRIBUTE}="1"])`,
  );
  const counterEntries = [];

  if (!counters.length) return;

  gsap.registerPlugin(ScrollTrigger);

  counters.forEach((counter) => {
    const counterData = getCounterData(counter);

    if (!counterData) return;

    counter.setAttribute(COUNTER_READY_ATTRIBUTE, "1");

    const {
      decimalPlaces,
      decimalSeparator,
      finalText,
      prefix,
      suffix,
      target,
    } = counterData;

    const visualCounter = prepareAccessibleCounter(counter, finalText);

    const entry = {
      counter,
      finalText,
      tweenTarget: null,
      visualCounter,
    };
    counterEntries.push(entry);

    if (isReducedMotion() || target === 0) return;

    const counterValue = { value: 0 };
    entry.tweenTarget = counterValue;

    visualCounter.textContent = `${prefix}${formatCounterValue(0, decimalPlaces, decimalSeparator)}${suffix}`;

    ScrollTrigger.create({
      trigger: counter,
      start: COUNTER_START,
      once: true,
      onEnter: () => {
        if (isReducedMotion()) {
          visualCounter.textContent = finalText;
          return;
        }

        gsap.to(counterValue, {
          value: target,
          duration: COUNTER_DURATION,
          ease: COUNTER_EASE,
          snap: { value: 1 / 10 ** decimalPlaces },
          overwrite: true,
          onUpdate: () => {
            visualCounter.textContent = `${prefix}${formatCounterValue(counterValue.value, decimalPlaces, decimalSeparator)}${suffix}`;
          },
          onComplete: () => {
            visualCounter.textContent = finalText;
          },
        });
      },
    });
  });

  document.addEventListener(MOTION_CHANGE_EVENT, (event) => {
    if (!event.detail?.reduced) {
      return;
    }

    counterEntries.forEach(({ finalText, tweenTarget, visualCounter }) => {
      if (tweenTarget) {
        gsap.killTweensOf(tweenTarget);
      }

      visualCounter.textContent = finalText;
    });
  });
}
