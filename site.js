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

  // Point every download button straight at the newest ZIP. If GitHub
  // can't be reached, the buttons still open the latest release page.
  fetch("https://api.github.com/repos/capi-git/aven/releases/latest")
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .then((release) => {
      const zip = release.assets.find((asset) => /macos-arm64\.zip$/.test(asset.name));
      if (zip) {
        document.querySelectorAll("[data-download]").forEach((link) => {
          link.href = zip.browser_download_url;
        });
      }
      const version = release.tag_name.replace(/^v/, "");
      document.querySelectorAll("[data-release-meta]").forEach((meta) => {
        meta.textContent = `Version ${version} · Apple Silicon · macOS 13 or later · Free and open source`;
      });
    })
    .catch(() => {});
})();
