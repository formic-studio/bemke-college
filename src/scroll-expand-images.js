import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from "./motion-preference.js";

const IMAGE_SELECTOR = ".img-scroll-expand";
const COMPLETE_ATTR = "data-bemke-scroll-expand-complete";
const ACTIVE_ROOT_CLASS = "bemke-scroll-expand-active";
const INITIAL_IMAGE_WIDTH = 300;
const SCROLL_START = "top 95%";
const SCROLL_SCRUB = 1.4;
const VIEWPORT_SCROLL_DISTANCE = 0.9;
const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_INITIAL_WIDTH_RATIO = 0.2;
const MOBILE_MIN_INITIAL_WIDTH = 96;
const GROW_DURATION = 0.45;
const FULL_SIZE_DURATION = 0.1;
const SHRINK_DURATION = 0.45;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function restoreInlineStyle(image, originalStyle) {
  if (originalStyle === null) {
    image.removeAttribute("style");
    return;
  }

  image.setAttribute("style", originalStyle);
}

function prepareImageLayout(
  {
    container,
    containerOriginalStyle,
    image,
    imageOriginalStyle,
  },
  { transformOnly = false } = {},
) {
  restoreInlineStyle(container, containerOriginalStyle);
  restoreInlineStyle(image, imageOriginalStyle);

  const initialRect = image.getBoundingClientRect();
  const initialWidth = Math.min(INITIAL_IMAGE_WIDTH, initialRect.width);
  const initialHeight = initialRect.height;
  const initialLeft = initialRect.left;
  const initialTop = initialRect.top;
  const initialContainerHeight = container.getBoundingClientRect().height;

  gsap.set(image, {
    width: "100%",
    scale: 1,
  });

  const expandedRect = image.getBoundingClientRect();
  const expandedContainerHeight = container.getBoundingClientRect().height;
  const initialMobileWidth = Math.max(
    expandedRect.width * MOBILE_INITIAL_WIDTH_RATIO,
    MOBILE_MIN_INITIAL_WIDTH,
  );
  const startScale = expandedRect.width
    ? clamp(
        transformOnly
          ? initialMobileWidth / expandedRect.width
          : initialWidth / expandedRect.width,
        0,
        1,
      )
    : 1;
  const horizontalSpace = Math.max(expandedRect.width - initialWidth, 0);
  const verticalSpace = Math.max(expandedRect.height - initialHeight, 0);
  const originX = horizontalSpace
    ? clamp((initialLeft - expandedRect.left) / horizontalSpace, 0, 1) * 100
    : 50;
  const originY = verticalSpace
    ? clamp((initialTop - expandedRect.top) / verticalSpace, 0, 1) * 100
    : 0;

  restoreInlineStyle(container, containerOriginalStyle);
  restoreInlineStyle(image, imageOriginalStyle);
  // Mobile reserves the final layout size once and animates only the image layer.
  gsap.set(container, {
    height: transformOnly ? expandedContainerHeight : initialContainerHeight,
  });
  gsap.set(image, {
    width: "100%",
    scale: startScale,
    transformOrigin: `${originX}% ${originY}%`,
  });

  return {
    expandedContainerHeight,
    initialContainerHeight,
    startScale,
  };
}

function showImageWithoutMotion({
  container,
  containerOriginalStyle,
  image,
  imageOriginalStyle,
}) {
  image.setAttribute(COMPLETE_ATTR, "1");
  gsap.killTweensOf(image);
  gsap.killTweensOf(container);
  restoreInlineStyle(container, containerOriginalStyle);
  restoreInlineStyle(image, imageOriginalStyle);
  gsap.set(image, {
    width: "100%",
  });
}

function createScrollAnimation(imageState, { transformOnly = false } = {}) {
  const { container, image } = imageState;
  const metrics = {
    expandedContainerHeight: 0,
    initialContainerHeight: 0,
    startScale: 1,
  };

  const prepare = () => {
    if (
      isReducedMotion() ||
      image.getAttribute(COMPLETE_ATTR) === "1"
    ) {
      return;
    }

    Object.assign(metrics, prepareImageLayout(imageState, { transformOnly }));
  };

  const enableTransformRendering = () => {
    gsap.set(image, { willChange: "transform" });
  };

  const disableTransformRendering = () => {
    gsap.set(image, { clearProps: "willChange" });
  };

  prepare();

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "none" },
  });

  timeline.fromTo(
    image,
    {
      scale: () => metrics.startScale,
    },
    {
      scale: 1,
      duration: GROW_DURATION,
      force3D: true,
      immediateRender: true,
    },
    0,
  );

  if (!transformOnly) {
    timeline.fromTo(
      container,
      {
        height: () => metrics.initialContainerHeight,
      },
      {
        height: () => metrics.expandedContainerHeight,
        duration: GROW_DURATION,
        immediateRender: true,
      },
      0,
    );
  }

  timeline.to(image, {
    scale: 1,
    duration: FULL_SIZE_DURATION,
  });

  if (!transformOnly) {
    timeline.to(
      container,
      {
        height: () => metrics.expandedContainerHeight,
        duration: FULL_SIZE_DURATION,
      },
      "<",
    );
  }

  timeline.to(image, {
    scale: () => metrics.startScale,
    duration: SHRINK_DURATION,
    force3D: true,
  });

  if (!transformOnly) {
    timeline.to(
      container,
      {
        height: () => metrics.initialContainerHeight,
        duration: SHRINK_DURATION,
      },
      "<",
    );
  }

  const trigger = ScrollTrigger.create({
    trigger: container,
    animation: timeline,
    start: SCROLL_START,
    end: () =>
      `+=${
        window.innerHeight * VIEWPORT_SCROLL_DISTANCE +
        metrics.expandedContainerHeight
      }`,
    scrub: SCROLL_SCRUB,
    invalidateOnRefresh: true,
    onRefreshInit: prepare,
    onEnter: enableTransformRendering,
    onEnterBack: enableTransformRendering,
    onLeave: disableTransformRendering,
    onLeaveBack: disableTransformRendering,
  });

  return { image, timeline, trigger };
}

export function initScrollExpandImages() {
  const images = gsap.utils.toArray(IMAGE_SELECTOR);

  if (!images.length) return;

  gsap.registerPlugin(ScrollTrigger);

  const imageStates = images.map((image) => {
    const container = image.parentElement ?? image;

    return {
      container,
      containerOriginalStyle: container.getAttribute("style"),
      image,
      imageOriginalStyle: image.getAttribute("style"),
    };
  });
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let imageAnimations = [];
  let transformOnlyMode = null;

  const stopAnimations = () => {
    imageAnimations.forEach(({ timeline, trigger }) => {
      trigger.kill();
      timeline.kill();
    });
    imageAnimations = [];
    transformOnlyMode = null;
    imageStates.forEach(showImageWithoutMotion);
    document.documentElement.classList.remove(ACTIVE_ROOT_CLASS);
  };

  const startAnimations = (transformOnly) => {
    if (imageAnimations.length && transformOnlyMode === transformOnly) return;

    if (imageAnimations.length) {
      stopAnimations();
    }

    imageStates.forEach(
      ({
        container,
        containerOriginalStyle,
        image,
        imageOriginalStyle,
      }) => {
        image.removeAttribute(COMPLETE_ATTR);
        restoreInlineStyle(container, containerOriginalStyle);
        restoreInlineStyle(image, imageOriginalStyle);
      },
    );

    document.documentElement.classList.add(ACTIVE_ROOT_CLASS);
    transformOnlyMode = transformOnly;
    imageAnimations = imageStates.map((imageState) =>
      createScrollAnimation(imageState, { transformOnly }),
    );
    ScrollTrigger.refresh();
  };

  const syncAnimations = () => {
    if (isReducedMotion()) {
      stopAnimations();
      return;
    }

    startAnimations(mobileQuery.matches);
  };

  syncAnimations();

  if (document.readyState !== "complete") {
    window.addEventListener(
      "load",
      () => {
        if (imageAnimations.length) {
          ScrollTrigger.refresh();
        }
      },
      { once: true },
    );
  }

  document.addEventListener(MOTION_CHANGE_EVENT, syncAnimations);

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncAnimations);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(syncAnimations);
  }
}
