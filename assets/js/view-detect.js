// Set initial view synchronously to avoid layout flash (auto-detect device)
(function () {
  try {
    var mq = window.matchMedia('(max-width: 860px)').matches;
    var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    document.documentElement.setAttribute('data-view', (mq || touch) ? 'mobile' : 'desktop');
    window.__yoriDetected = (mq || touch) ? 'mobile' : 'desktop';
  } catch (e) {
    document.documentElement.setAttribute('data-view', 'desktop');
    window.__yoriDetected = 'desktop';
  }
})();
