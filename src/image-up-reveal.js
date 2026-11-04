import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MOTION_CHANGE_EVENT,
  isReducedMotion,
} from "./motion-preference.js";

const IMAGE_SELECTOR = "[img-up]";
const READY_ATTRIBUTE = "data-bemke-image-up-ready";
const SCROLL_START = "top 95%";
const REVEAL_DURATION = 1.6;
const REVEAL_EASE = "power2.out";

export function initImageUpReveal() {
  const images = gsap.utils.toArray(
    `${IMAGE_SELECTOR}:not([${READY_ATTRIBUTE}="1"])`,
  );

  if (!images.length) return;

  images.forEach((image) => image.setAttribute(READY_ATTRIBUTE, "1"));
  gsap.registerPlugin(ScrollTrigger);

  let tweens = [];

  const stopAnimations = () => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    tweens = [];
  };

  const showImages = () => {
    gsap.set(images, {
      clearProps: "opacity,transform,willChange",
    });
  };

  const createAnimations = () => {
    stopAnimations();
    showImages();

    if (isReducedMotion()) return;

    tweens = images.map((image) =>
      gsap.fromTo(
        image,
        {
          opacity: 0,
          willChange: "transform, opacity",
          y: 50,
        },
        {
          duration: REVEAL_DURATION,
          ease: REVEAL_EASE,
          opacity: 1,
          overwrite: "auto",
          scrollTrigger: {
            trigger: image,
            start: SCROLL_START,
            once: true,
          },
          y: 0,
          onComplete: () => {
            gsap.set(image, {
              clearProps: "opacity,transform,willChange",
            });
          },
        },
      ),
    );
  };

  createAnimations();

  document.addEventListener(MOTION_CHANGE_EVENT, createAnimations);

  if (document.readyState !== "complete") {
    window.addEventListener(
      "load",
      () => {
        ScrollTrigger.refresh();
      },
      { once: true },
    );
  }
}
