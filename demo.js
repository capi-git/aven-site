// Interactive preview of the Aven window. Everything here is scripted demo
// content; nothing runs an agent or leaves the page.
(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const $ = (selector, root = app) => root.querySelector(selector);
  const $$ = (selector, root = app) => [...root.querySelectorAll(selector)];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const welcome = $("#welcome");
  const transcript = $("#transcript");
  const tabs = $("#center-tabs");
  const input = $("#composer-input");
  const composer = $("#composer");
  const sendButton = $(".send");
  const downloadHref = () =>
    document.querySelector("[data-download]")?.href ?? "https://github.com/capi-git/aven/releases/latest";

  const sessions = {
    // The description and downloads live in the page markup; this entry only gives it a tab.
    welcome: { title: "Welcome to Aven", provider: null, items: [] },
    landing: {
      title: "Build landing page",
      provider: "claude",
      items: [
        { type: "user", text: "Build a landing page for Skycast with a hero and a 3-hour forecast." },
        { type: "worked", text: "Opus 5.5 worked for 38s" },
        { type: "tool", label: "Read", code: "src/App.tsx" },
        { type: "tool", label: "Edited", code: "src/Hero.tsx", add: 14, del: 3 },
        { type: "tool", label: "Created", code: "src/Forecast.tsx", add: 42 },
        { type: "tool", label: "Ran", code: "npm run dev" },
        {
          type: "agent",
          html:
            "<p>The landing page is running and open in the browser beside this chat.</p>" +
            "<p><strong>What changed:</strong> a new hero with your headline and a download button, " +
            "plus a forecast strip for the next three hours.</p>" +
            "<p>Try <strong>Edit page</strong> in the browser to point at anything you want changed.</p>",
        },
      ],
    },
    tests: {
      title: "Fix flaky tests",
      provider: "codex",
      items: [
        { type: "user", text: "The checkout tests fail about 1 in 5 runs. Can you find out why?" },
        { type: "worked", text: "GPT-6 worked for 1m 12s" },
        { type: "tool", label: "Ran", code: "npm test -- checkout  ×20" },
        { type: "tool", label: "Edited", code: "tests/checkout.test.ts", add: 6, del: 4 },
        {
          type: "agent",
          html:
            "<p>The test waited a fixed 100 ms for the cart to save. On a slow run the save took longer, " +
            "so the next step read an empty cart.</p>" +
            "<p>It now waits for the save to finish instead. <strong>20 of 20 runs passed.</strong></p>",
        },
      ],
    },
    race: {
      title: "Race · Dark mode",
      provider: "cursor",
      items: [
        { type: "user", text: "Race three agents on adding a dark mode toggle." },
        { type: "worked", text: "3 agents finished in 2m 40s" },
        { type: "tool", label: "Claude Code", code: "race/dark-mode-0", add: 58, del: 6 },
        { type: "tool", label: "Codex", code: "race/dark-mode-1", add: 71, del: 12 },
        { type: "tool", label: "Cursor", code: "race/dark-mode-2", add: 44, del: 3 },
        {
          type: "agent",
          html:
            "<p>All three attempts work. <strong>Cursor's</strong> is the smallest change and remembers the " +
            "choice between visits. Codex's also follows the system setting.</p>" +
            "<p>Pick one to keep and Aven cleans up the others.</p>",
        },
      ],
    },
    api: {
      title: "Add rate limiting",
      provider: "claude",
      items: [
        { type: "user", text: "Add rate limiting to the public API, 100 requests a minute per key." },
        { type: "worked", text: "Opus 5.5 worked for 54s" },
        { type: "tool", label: "Created", code: "src/middleware/rateLimit.ts", add: 36 },
        { type: "tool", label: "Ran", code: "npm test", add: undefined },
        {
          type: "agent",
          html:
            "<p>Each API key now gets 100 requests a minute. Extra requests get a clear “try again in N seconds” " +
            "reply instead of an error page. All 48 tests pass.</p>",
        },
      ],
    },
    portfolio: {
      title: "Update project cards",
      provider: "codex",
      items: [
        { type: "user", text: "Make the project cards show a screenshot and the tech used." },
        { type: "worked", text: "GPT-6 worked for 41s" },
        { type: "tool", label: "Edited", code: "components/ProjectCard.tsx", add: 22, del: 9 },
        {
          type: "agent",
          html: "<p>Each card now shows its screenshot on top and small tags for the tech underneath.</p>",
        },
      ],
    },
  };

  let current = "welcome";
  let openTabs = ["welcome", "landing"];
  let busy = false;
  let newCount = 0;

  // ---------- Rendering ----------

  function renderItem(item) {
    const el = document.createElement("div");
    if (item.type === "user") {
      el.className = "msg user";
      const p = document.createElement("p");
      p.textContent = item.text;
      el.append(p);
    } else if (item.type === "worked") {
      el.className = "worked";
      el.textContent = item.text;
    } else if (item.type === "tool") {
      el.className = "msg";
      el.innerHTML =
        `<div class="tool"><span>${item.label}</span><code></code>` +
        (item.add != null ? `<span class="add">+${item.add}</span>` : "") +
        (item.del != null ? `<span class="del">−${item.del}</span>` : "") +
        `</div>`;
      $("code", el).textContent = item.code;
    } else if (item.type === "agent") {
      el.className = "msg agent";
      el.innerHTML = item.html;
    } else if (item.type === "empty") {
      el.className = "msg agent";
      el.innerHTML = `<p style="color:var(--app-faint);text-align:center;padding-top:80px">What should we work on?</p>`;
    }
    return el;
  }

  function showWelcome(show) {
    welcome.hidden = !show;
    transcript.hidden = show;
    $('[data-action="welcome"]').classList.toggle("active", show);
  }

  function renderSession() {
    const session = sessions[current];
    showWelcome(current === "welcome");
    transcript.replaceChildren(...session.items.map(renderItem));
    transcript.scrollTop = transcript.scrollHeight;
    composer.hidden = false;
    renderTabs();
    $$(".session").forEach((button) => button.classList.toggle("active", button.dataset.session === current));
    $$(".side-row[data-view]").forEach((row) => row.classList.remove("active"));
  }

  function renderTabs() {
    tabs.replaceChildren(
      ...openTabs.map((id) => {
        const tab = document.createElement("button");
        tab.className = "center-tab" + (id === current ? " active" : "");
        tab.innerHTML = sessions[id].provider
          ? `<span class="provider-dot" data-provider="${sessions[id].provider}"></span><span></span>`
          : `<svg class="aven-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg><span></span>`;
        tab.lastChild.textContent = sessions[id].title;
        tab.addEventListener("click", () => openSession(id));
        return tab;
      }),
    );
  }

  function openSession(id) {
    if (busy) return;
    current = id;
    if (!openTabs.includes(id)) openTabs = [...openTabs.slice(-2), id];
    renderSession();
  }

  function append(item) {
    sessions[current].items.push(item);
    const el = renderItem(item);
    transcript.append(el);
    transcript.scrollTop = transcript.scrollHeight;
    return el;
  }

  async function typeAgent(html) {
    const item = { type: "agent", html };
    sessions[current].items.push(item);
    const el = document.createElement("div");
    el.className = "msg agent";
    const p = document.createElement("p");
    p.className = "typing";
    el.append(p);
    transcript.append(el);

    const words = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ");
    if (!reducedMotion) {
      for (const word of words) {
        p.textContent += (p.textContent ? " " : "") + word;
        transcript.scrollTop = transcript.scrollHeight;
        await wait(28);
      }
    }
    el.innerHTML = html;
    transcript.scrollTop = transcript.scrollHeight;
  }

  // ---------- Sending ----------

  async function send(text, reply) {
    if (busy || !text.trim()) return;
    busy = true;
    sendButton.disabled = true;
    input.value = "";
    if (sessions[current].items[0]?.type === "empty") {
      sessions[current].items = [];
      transcript.replaceChildren();
      sessions[current].title = text.slice(0, 28) + (text.length > 28 ? "…" : "");
      $(`.session[data-session="${current}"] .label`)?.replaceChildren(sessions[current].title);
      renderTabs();
    }
    append({ type: "user", text });

    const status = document.createElement("div");
    status.className = "status";
    status.innerHTML = `<span class="spinner"></span>Working…`;
    transcript.append(status);
    transcript.scrollTop = transcript.scrollHeight;
    await wait(reducedMotion ? 200 : 1100);
    status.remove();

    const plan = reply ?? {
      tools: [{ type: "tool", label: "Read", code: "README.md" }],
      html:
        "<p>This is a preview on a website, so there's no real agent here and nothing I can change.</p>" +
        "<p>In Aven, your own Claude Code, Codex or Cursor would pick this up and work in your project, " +
        `with the browser, files and changes right beside the chat. <a href="${downloadHref()}" ` +
        `style="color:var(--app-accent)">Download for Mac</a> to try it for real.</p>`,
    };
    for (const tool of plan.tools) {
      append(tool);
      await wait(reducedMotion ? 0 : 450);
    }
    await typeAgent(plan.html);
    plan.after?.();
    busy = false;
    sendButton.disabled = false;
  }

  function submit() {
    if (busy || !input.value.trim()) return;
    if (current === "welcome") newSession();
    send(input.value);
  }

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  });

  // ---------- Browser: comment on the page ----------

  const site = $("#site");
  const cta = $("#site-cta");
  const pop = $("#comment-pop");
  const commentButton = $('[data-action="comment"]');

  commentButton.addEventListener("click", () => {
    const on = !site.classList.contains("picking");
    site.classList.toggle("picking", on);
    commentButton.classList.toggle("on", on);
    commentButton.textContent = on ? "Click the button" : "Edit page";
    if (!on) pop.hidden = true;
  });

  cta.addEventListener("click", () => {
    if (!site.classList.contains("picking")) return;
    pop.hidden = false;
  });

  $('[data-action="add-comment"]').addEventListener("click", () => {
    pop.hidden = true;
    site.classList.remove("picking");
    commentButton.classList.remove("on");
    commentButton.textContent = "Edit page";
    if (current !== "landing") openSession("landing");
    send("About the “Get the app” button: make it bigger and use our brand blue.", {
      tools: [{ type: "tool", label: "Edited", code: "src/Hero.tsx", add: 3, del: 1 }],
      html: "<p>Done. The button is larger and uses your brand blue. It's updated in the browser.</p>",
      after: () => {
        cta.classList.add("upgraded");
        let count = $(".pane-tab .count");
        if (!count) {
          count = document.createElement("span");
          count.className = "count";
          $('.pane-tab[data-pane="changes"]').append(" ", count);
        }
        count.textContent ||= "1";
      },
    });
  });

  // ---------- Changes: commit ----------

  $('[data-action="commit"]').addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Committed";
    $(".changes").innerHTML =
      `<div class="change" style="color:var(--app-muted)">Working tree clean · 1 commit ahead</div>`;
    $(".diffview").remove();
    $(".pane-tab .count").remove();
  });

  // ---------- Side pane tabs ----------

  $$(".pane-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".pane-tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".pane-view").forEach((view) =>
        view.classList.toggle("active", view.dataset.paneView === tab.dataset.pane),
      );
    }),
  );

  // ---------- Sidebar ----------

  $$(".session").forEach((button) => {
    const title = button.childNodes[1];
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = title.textContent;
    title.replaceWith(label);
    button.addEventListener("click", () => openSession(button.dataset.session));
  });

  $$('[data-action="toggle-project"]').forEach((row) =>
    row.addEventListener("click", () => row.parentElement.classList.toggle("open")),
  );

  function newSession() {
    newCount += 1;
    const id = `new-${newCount}`;
    sessions[id] = { title: "New session", provider: currentProvider, items: [{ type: "empty" }] };
    const button = document.createElement("button");
    button.className = "session";
    button.dataset.session = id;
    button.innerHTML = `<span class="provider-dot" data-provider="${currentProvider}"></span><span class="label">New session</span><time>now</time>`;
    button.addEventListener("click", () => openSession(id));
    const first = $(".project .sessions");
    first.parentElement.classList.add("open");
    first.prepend(button);
    openSession(id);
  }

  $('[data-action="new-session"]').addEventListener("click", () => {
    if (busy) return;
    newSession();
    input.focus();
  });

  $('[data-action="welcome"]').addEventListener("click", () => openSession("welcome"));

  // Feature cards on the welcome view jump to the part of the preview they describe.
  $$(".feature[data-open-session]").forEach((card) =>
    card.addEventListener("click", () => {
      app.classList.remove("no-pane");
      openSession(card.dataset.openSession);
      if (card.dataset.openPane) $(`.pane-tab[data-pane="${card.dataset.openPane}"]`).click();
    }),
  );

  const views = {
    notes: {
      title: "Notes",
      items: [
        ["Launch checklist", "Screenshots, changelog, tweet draft", "Today"],
        ["API ideas", "Webhooks for severe weather alerts", "Mon"],
        ["Design feedback", "Hero feels crowded on mobile", "Sep 20"],
      ],
    },
    inbox: {
      title: "Inbox",
      items: [
        ["Rain alerts arrive late on Android", "GitHub issue #118 · weather-app", "Issue"],
        ["Add hourly chart", "Pull request #42 · weather-app", "PR"],
        ["Localize units for UK users", "Linear SKY-31", "Task"],
      ],
    },
  };

  $$(".side-row[data-view]").forEach((row) =>
    row.addEventListener("click", () => {
      if (busy) return;
      const view = views[row.dataset.view];
      $$(".side-row[data-view]").forEach((r) => r.classList.toggle("active", r === row));
      $$(".session").forEach((s) => s.classList.remove("active"));
      tabs.innerHTML = `<span class="center-tab active"></span>`;
      tabs.firstChild.textContent = view.title;
      const panel = document.createElement("div");
      panel.className = "panel-view";
      panel.innerHTML = `<h3></h3>`;
      panel.firstChild.textContent = view.title;
      for (const [title, detail, tag] of view.items) {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `<div style="flex:1"><b></b><span></span></div><span class="tag"></span>`;
        $("b", item).textContent = title;
        $("span", item).textContent = detail;
        $(".tag", item).textContent = tag;
        panel.append(item);
      }
      showWelcome(false);
      transcript.replaceChildren(panel);
      composer.hidden = true;
    }),
  );

  // ---------- Title bar ----------

  $('[data-action="toggle-sidebar"]').addEventListener("click", () => app.classList.toggle("no-sidebar"));
  $('[data-action="toggle-pane"]').addEventListener("click", () => app.classList.toggle("no-pane"));

  const menu = $("#model-menu");
  let currentProvider = "claude";

  $$('[data-action="toggle-models"]').forEach((button) =>
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
    }),
  );

  $$("#model-menu button").forEach((option) =>
    option.addEventListener("click", () => {
      currentProvider = option.dataset.provider;
      $("#model-label").textContent = option.dataset.model;
      $("#composer-model").textContent = option.dataset.model;
      $(".model-pill .provider-dot").dataset.provider = currentProvider;
      $$("#model-menu button").forEach((b) => b.classList.toggle("selected", b === option));
      menu.hidden = true;
    }),
  );

  document.addEventListener("click", (event) => {
    if (!menu.hidden && !event.target.closest(".model-picker")) menu.hidden = true;
  });

  renderSession();
})();
