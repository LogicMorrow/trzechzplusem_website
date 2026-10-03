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

  // One continuous route, clipped into each section to stay behind its content.
  const guideSections = [...document.querySelectorAll(".site-header, .hero, main > .section, .site-footer")];
  const ns = "http://www.w3.org/2000/svg";
  const guides = guideSections.map(section => {
    const svg = document.createElementNS(ns, "svg");
    svg.classList.add("scroll-route");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const rail = document.createElementNS(ns, "path");
    rail.classList.add("scroll-route-rail");
    const marker = document.createElementNS(ns, "path");
    marker.classList.add("scroll-route-marker");
    svg.append(rail, marker);
    section.append(svg);
    return { section, svg, rail, marker };
  });
  let routeLength = 0;
  let routeHeight = 0;
  let routeStops = [];
  let routePosition = 0;
  let geometryDirty = true;

  function buildRoute() {
    const width = root.clientWidth;
    const inset = wideScreen.matches ? Math.max(10, (width - 1340) / 2) : 10;
    const left = inset;
    const right = width - inset;
    const radius = wideScreen.matches ? 24 : 10;
    const boxes = guides.map(({ section }) => {
      const rect = section.getBoundingClientRect();
      const style = getComputedStyle(section);
      return {
        top: rect.top + window.scrollY,
        height: rect.height,
        left: rect.left,
        borderLeft: parseFloat(style.borderLeftWidth) || 0,
        borderTop: parseFloat(style.borderTopWidth) || 0
      };
    });
    routeHeight = boxes.at(-1).top + boxes.at(-1).height;
    let x = right;
    let d = `M ${x} 0`;
    const measure = guides[0].rail;
    routeStops = [{ y: 0, distance: 0 }];
    boxes.forEach((box, index) => {
      if (index === 0 || index === boxes.length - 1) return;
      // Cross inside the empty bottom padding, away from headings and controls.
      const y = box.top + box.height - (wideScreen.matches ? 48 : 32);
      const nextX = x === right ? left : right;
      const direction = nextX > x ? 1 : -1;
      d += ` V ${y - radius}`;
      measure.setAttribute("d", d);
      routeStops.push({ y: y - 100, distance: measure.getTotalLength() });
      d += ` Q ${x} ${y} ${x + direction * radius} ${y}`;
      d += ` H ${nextX - direction * radius}`;
      d += ` Q ${nextX} ${y} ${nextX} ${y + radius}`;
      measure.setAttribute("d", d);
      routeStops.push({ y: y + 32, distance: measure.getTotalLength() });
      x = nextX;
    });
    d += ` V ${routeHeight}`;
    measure.setAttribute("d", d);
    routeLength = measure.getTotalLength();
    routeStops.push({ y: routeHeight, distance: routeLength });
    guides.forEach(({ svg, rail, marker }, index) => {
      const box = boxes[index];
      // Every slice uses document coordinates at 1:1 scale, including the
      // narrower hero container and sections with borders. No SVG letterboxing.
      svg.style.left = `${-box.left - box.borderLeft}px`;
      svg.style.top = `${-box.borderTop}px`;
      svg.style.width = `${width}px`;
      svg.style.height = `${box.height}px`;
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("viewBox", `0 ${box.top} ${width} ${box.height}`);
      rail.setAttribute("d", d);
      marker.setAttribute("d", d);
      marker.setAttribute("stroke-dasharray", `${wideScreen.matches ? 64 : 42} ${routeLength + 100}`);
    });
    geometryDirty = false;
  }

  function paintRoute() {
    const y = routePosition * routeHeight;
    const end = routeStops.findIndex(stop => stop.y >= y);
    const next = routeStops[Math.max(1, end)];
    const prev = routeStops[Math.max(0, end - 1)];
    const fraction = Math.max(0, Math.min(1, (y - prev.y) / (next.y - prev.y)));
    const distance = prev.distance + (next.distance - prev.distance) * fraction;
    const markerLength = wideScreen.matches ? 64 : 42;
    const offset = -Math.min(routeLength - markerLength, distance);
    guides.forEach(({ marker }) => marker.setAttribute("stroke-dashoffset", offset.toFixed(2)));
  }

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
    if (geometryDirty) buildRoute();
    if (!running) { paintRoute(); return; }
    const maxScroll = root.scrollHeight - window.innerHeight;
    const position = Math.max(0, window.scrollY);
    root.style.setProperty("--reading-progress", String(maxScroll > 0 ? Math.min(1, position / maxScroll) : 0));
    const rect = hero.getBoundingClientRect();
    const drift = wideScreen.matches ? Math.min(22, Math.max(0, -rect.top / Math.max(1, rect.height)) * 22) : 0;
    hero.style.setProperty("--hero-drift", `${drift.toFixed(2)}px`);
    routePosition = maxScroll > 0 ? Math.min(1, position / maxScroll) : 0;
    paintRoute();
  }
  function schedule() {
    if ((running || geometryDirty) && !frame) frame = requestAnimationFrame(draw);
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
  function resizeRoute() { geometryDirty = true; schedule(); }
  window.addEventListener("resize", resizeRoute, { passive: true });
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resizeRoute);
    guides.forEach(({ section }) => resizeObserver.observe(section));
  }
  buildRoute();
  paintRoute();
  sync();
})();
