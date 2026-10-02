"use strict";

(() => {
  const root = document.documentElement;
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".footer-bottom");
  const stylesheet = document.querySelector('link[href="motion-trial.css"]');
  if (!hero || !footer || !stylesheet?.sheet || !("IntersectionObserver" in window)) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const wideScreen = matchMedia("(min-width: 768px)");
  let paused = false;
  let frame = 0;
  let running = false;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "motion-control";
  footer.append(button);
  const progress = document.createElement("div");
  progress.className = "motion-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08 });
  document.querySelectorAll(".section-heading, .process-intro, .process-list li, .service-grid article, .person, .faq-layout > div, .contact-heading, .contact-links").forEach(element => {
    element.classList.add("motion-enter");
    observer.observe(element);
  });

  function draw() {
    frame = 0;
    if (!running) return;
    const maxScroll = root.scrollHeight - window.innerHeight;
    const position = Math.max(0, window.scrollY);
    root.style.setProperty("--reading-progress", String(maxScroll > 0 ? Math.min(1, position / maxScroll) : 0));
    const rect = hero.getBoundingClientRect();
    const drift = wideScreen.matches ? Math.min(22, Math.max(0, -rect.top / Math.max(1, rect.height)) * 22) : 0;
    hero.style.setProperty("--hero-drift", `${drift.toFixed(2)}px`);
  }
  function schedule() {
    if (running && !frame) frame = requestAnimationFrame(draw);
  }
  function sync() {
    running = !paused && !reducedMotion.matches && !document.hidden;
    root.classList.toggle("motion-running", running);
    root.classList.toggle("motion-stopped", !running);
    button.hidden = reducedMotion.matches;
    button.textContent = paused ? "Włącz animacje" : "Wstrzymaj animacje";
    if (running) schedule();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
      hero.style.removeProperty("--hero-drift");
    }
  }
  button.addEventListener("click", () => { paused = !paused; sync(); });
  reducedMotion.addEventListener("change", sync);
  wideScreen.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  sync();
})();
