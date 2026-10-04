// The scrolling page around the app preview: reveals, the theme picker and
// download links.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  // ---------- Sections fade in as they arrive ----------

  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        reveal.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el, index) => {
    // Stagger items that share a row.
    el.style.transitionDelay = `${(index % 4) * 70}ms`;
    reveal.observe(el);
  });

  // ---------- Make it yours: the app's theme presets and glass ----------

  // Dark-mode colours from the app's presets.
  const themes = {
    aven: { accent: "#57b5ff", background: "#000000" },
    mono: { accent: "#f5f5f5", background: "#0a0a0a" },
    sky: { accent: "#6cabdd", background: "#0b121a" },
    cove: { accent: "#5ed9d0", background: "#101416" },
  };
  const rgb = (hex) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

  document.querySelectorAll("[data-theme]").forEach((chip) =>
    chip.addEventListener("click", () => {
      const theme = themes[chip.dataset.theme];
      root.style.setProperty("--accent", theme.accent);
      root.style.setProperty("--accent-rgb", rgb(theme.accent));
      root.style.setProperty("--glass-rgb", rgb(theme.background));
      document
        .querySelectorAll("[data-theme]")
        .forEach((c) => c.setAttribute("aria-checked", String(c === chip)));
    }),
  );

  const opacity = document.getElementById("glass-opacity");
  const blur = document.getElementById("glass-blur");
  opacity.addEventListener("input", () => {
    root.style.setProperty("--glass-alpha", String(opacity.value / 100));
    document.getElementById("opacity-out").textContent = `${opacity.value}%`;
  });
  blur.addEventListener("input", () => {
    root.style.setProperty("--glass-blur", `${blur.value}px`);
    document.getElementById("blur-out").textContent = blur.value;
  });

  // ---------- Downloads ----------

  // Visitors on Windows see the Windows download first. Everything else keeps
  // the Mac first, since that is the primary platform.
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  const onWindows = /win/i.test(platform) || /Windows NT/.test(navigator.userAgent);
  if (onWindows) {
    const navMac = document.querySelector("[data-nav-mac]");
    const navWindows = document.querySelector("[data-nav-windows]");
    if (navMac && navWindows) {
      navMac.hidden = true;
      navWindows.hidden = false;
    }
    document.querySelectorAll("[data-download-windows]:not([data-nav-windows])").forEach((windows) => {
      const mac = windows.parentElement && windows.parentElement.querySelector("[data-download]");
      if (!mac) return;
      windows.classList.add("primary");
      mac.classList.remove("primary");
      windows.parentElement.insertBefore(windows, mac);
    });
  }

  // Download buttons use the release's permanent "latest" file names, so they
  // work without this request. It only fills in the current version number.
  fetch("https://api.github.com/repos/capi-git/aven/releases/latest")
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .then((release) => {
      const version = release.tag_name.replace(/^v/, "");
      document.querySelectorAll("[data-release-meta]").forEach((meta) => {
        meta.textContent = `Version ${version} · Apple Silicon Macs on macOS 13+ · Windows 10 and 11 · Free and open source`;
      });
    })
    .catch(() => {});
})();
