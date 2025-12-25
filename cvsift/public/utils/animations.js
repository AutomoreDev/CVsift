/**
 * GSAP Animation Utilities for CVSift
 * Clean, simple animations following the new design system
 */

import gsap from 'gsap';

/**
 * Fade in animation with optional slide
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const fadeIn = (target, options = {}) => {
  const defaults = {
    duration: 0.6,
    opacity: 0,
    y: 20,
    ease: 'power2.out',
    ...options,
  };

  return gsap.from(target, defaults);
};

/**
 * Fade out animation
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const fadeOut = (target, options = {}) => {
  const defaults = {
    duration: 0.4,
    opacity: 0,
    ease: 'power2.in',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Stagger animation for lists/groups
 * @param {Element[]|string} targets - Elements or selector to animate
 * @param {Object} options - Animation options
 */
export const staggerIn = (targets, options = {}) => {
  const defaults = {
    duration: 0.5,
    opacity: 0,
    y: 30,
    stagger: 0.1,
    ease: 'power2.out',
    ...options,
  };

  return gsap.from(targets, defaults);
};

/**
 * Scale animation (for buttons, cards)
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const scaleIn = (target, options = {}) => {
  const defaults = {
    duration: 0.4,
    scale: 0.9,
    opacity: 0,
    ease: 'back.out(1.4)',
    ...options,
  };

  return gsap.from(target, defaults);
};

/**
 * Slide in from direction
 * @param {Element|string} target - Element or selector to animate
 * @param {string} direction - 'left', 'right', 'top', 'bottom'
 * @param {Object} options - Animation options
 */
export const slideIn = (target, direction = 'right', options = {}) => {
  const directions = {
    left: { x: -100 },
    right: { x: 100 },
    top: { y: -100 },
    bottom: { y: 100 },
  };

  const defaults = {
    duration: 0.5,
    opacity: 0,
    ...directions[direction],
    ease: 'power3.out',
    ...options,
  };

  return gsap.from(target, defaults);
};

/**
 * Slide out to direction
 * @param {Element|string} target - Element or selector to animate
 * @param {string} direction - 'left', 'right', 'top', 'bottom'
 * @param {Object} options - Animation options
 */
export const slideOut = (target, direction = 'right', options = {}) => {
  const directions = {
    left: { x: -100 },
    right: { x: 100 },
    top: { y: -100 },
    bottom: { y: 100 },
  };

  const defaults = {
    duration: 0.4,
    opacity: 0,
    ...directions[direction],
    ease: 'power2.in',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Hover scale effect (non-GSAP, returns style handlers)
 * @param {number} scale - Scale factor (default 1.05)
 */
export const hoverScale = (scale = 1.05) => ({
  onMouseEnter: (e) => gsap.to(e.currentTarget, { scale, duration: 0.3, ease: 'power2.out' }),
  onMouseLeave: (e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power2.out' }),
});

/**
 * Loading spinner animation
 * @param {Element|string} target - Element or selector to animate
 */
export const spin = (target, options = {}) => {
  const defaults = {
    duration: 1,
    rotation: 360,
    repeat: -1,
    ease: 'none',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Pulse animation (for notifications, badges)
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const pulse = (target, options = {}) => {
  const defaults = {
    duration: 0.6,
    scale: 1.1,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Entrance animation for modals/dialogs
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const modalIn = (target, options = {}) => {
  const defaults = {
    duration: 0.3,
    opacity: 0,
    scale: 0.95,
    y: 20,
    ease: 'power2.out',
    ...options,
  };

  return gsap.from(target, defaults);
};

/**
 * Exit animation for modals/dialogs
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const modalOut = (target, options = {}) => {
  const defaults = {
    duration: 0.25,
    opacity: 0,
    scale: 0.95,
    ease: 'power2.in',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Toast notification entrance
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const toastIn = (target, options = {}) => {
  const defaults = {
    duration: 0.4,
    x: 100,
    opacity: 0,
    ease: 'back.out(1.4)',
    ...options,
  };

  return gsap.from(target, defaults);
};

/**
 * Toast notification exit
 * @param {Element|string} target - Element or selector to animate
 * @param {Object} options - Animation options
 */
export const toastOut = (target, options = {}) => {
  const defaults = {
    duration: 0.3,
    x: 100,
    opacity: 0,
    ease: 'power2.in',
    ...options,
  };

  return gsap.to(target, defaults);
};

/**
 * Number counter animation
 * @param {Element|string} target - Element containing the number
 * @param {number} endValue - Final number value
 * @param {Object} options - Animation options
 */
export const countUp = (target, endValue, options = {}) => {
  const obj = { value: 0 };
  const element = typeof target === 'string' ? document.querySelector(target) : target;

  const defaults = {
    duration: 2,
    ease: 'power1.out',
    ...options,
  };

  return gsap.to(obj, {
    ...defaults,
    value: endValue,
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.value);
      }
    },
  });
};

/**
 * Simple timeline creator for complex animations
 * @returns {gsap.core.Timeline}
 */
export const createTimeline = (options = {}) => {
  return gsap.timeline(options);
};

/**
 * Kill all animations on target
 * @param {Element|string} target - Element or selector
 */
export const killAnimations = (target) => {
  return gsap.killTweensOf(target);
};
