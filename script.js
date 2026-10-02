"use strict";

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
