"use strict";

// All package descriptions are readable when JavaScript is unavailable.
document.querySelectorAll("[data-packages]").forEach(card => {
  const tablist = card.querySelector("[data-package-tabs]");
  const tabs = [...card.querySelectorAll("[data-package]")];
  const panels = [...card.querySelectorAll("[data-package-panel]")];
  if (!tablist || tabs.length !== panels.length) return;
  function selectPackage(index, moveFocus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (moveFocus) tabs[index].focus();
  }
  tablist.setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener("click", () => selectPackage(index));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectPackage(next, true); }
    });
  });
  card.setAttribute("data-enhanced", "");
  selectPackage(0);
  tablist.hidden = false;
});

// Native controls remain available without JS. Enhance with a large play button.
const portfolioVideos = document.querySelectorAll(".portfolio-video");
portfolioVideos.forEach(video => {
  const wrapper = document.createElement("div");
  wrapper.className = "video-player";
  video.before(wrapper);
  wrapper.append(video);
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "video-play-button";
  playButton.setAttribute("aria-label", `Odtwórz: ${video.getAttribute("aria-label") || "nagranie"}`);
  wrapper.append(playButton);
  playButton.addEventListener("click", async () => {
    playButton.disabled = true;
    try {
      await video.play();
    } catch {
      playButton.hidden = false;
      video.focus({ preventScroll: true });
    } finally {
      playButton.disabled = false;
    }
  });
  video.addEventListener("play", () => {
    if (document.activeElement === playButton) video.focus({ preventScroll: true });
    playButton.hidden = true;
    portfolioVideos.forEach(other => {
      if (other !== video) other.pause();
    });
  });
  video.addEventListener("pause", () => { playButton.hidden = false; });
  video.addEventListener("ended", () => { playButton.hidden = false; });
});

// Navigation remains visible if JavaScript is unavailable.
const menuButton = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
const desktopLayout = window.matchMedia("(min-width: 960px)");

if (menuButton && navigation) {
  function closeMenu(returnFocus = false) {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.hidden = !desktopLayout.matches;
    if (returnFocus) menuButton.focus();
  }

  function syncNavigation() {
    const focusWillHide = !desktopLayout.matches && navigation.contains(document.activeElement);
    menuButton.hidden = desktopLayout.matches;
    closeMenu(focusWillHide);
  }

  menuButton.addEventListener("click", () => {
    const opening = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(opening));
    navigation.hidden = !opening;
  });

  navigation.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || desktopLayout.matches) return;
    closeMenu();
    const destination = document.querySelector(link.getAttribute("href"));
    if (destination) {
      destination.setAttribute("tabindex", "-1");
      destination.focus({ preventScroll: true });
      destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !desktopLayout.matches && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });

  desktopLayout.addEventListener("change", syncNavigation);
  syncNavigation();
}
