// Script to remove Next.js development indicators
(function() {
  function removeDevIndicators() {
    // Common selectors for Next.js dev indicators
    const selectors = [
      '#__next-build-watcher',
      '[data-nextjs-toast]',
      '[data-nextjs-dialog-overlay]',
      '.__next-dev-overlay',
      '.__nextjs_original-stack-frame',
      '[data-nextjs-scroll-focus-boundary]',
      'nextjs-portal',
      'div[data-nextjs-dialog]',
      'div[data-nextjs-dialog-overlay]'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    });

    // Remove fixed positioned elements that might be indicators
    const fixedElements = document.querySelectorAll('body > div[style*="position: fixed"]');
    fixedElements.forEach(el => {
      if (!el.id && !el.className && el.style.position === 'fixed') {
        const rect = el.getBoundingClientRect();
        // Check if it's in the bottom-left corner (likely dev indicator)
        if (rect.bottom > window.innerHeight - 100 && rect.left < 100) {
          el.style.display = 'none';
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }
      }
    });
  }

  // Run immediately
  removeDevIndicators();

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeDevIndicators);
  }

  // Run periodically to catch dynamically added indicators
  setInterval(removeDevIndicators, 1000);

  // Watch for mutations
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(removeDevIndicators);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
