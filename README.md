# Aven website

The download page for [Aven](https://github.com/capi-git/aven), a desktop workspace for your coding agents.

It is a static site with no build step: `index.html`, two stylesheets and a small script. The download buttons find the newest macOS release through the GitHub API, so the site doesn't change when Aven ships a new version. The app window on the page is an interactive recreation with made-up demo content; it doesn't run agents or send anything anywhere.

## Preview locally

```sh
python3 -m http.server 4827 --bind 127.0.0.1
```

Then open http://127.0.0.1:4827/.
