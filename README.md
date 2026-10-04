# Aven website

The download page for [Aven](https://github.com/capi-git/aven), a desktop workspace for your coding agents.

It is a static site with no build step: `index.html`, two stylesheets and two small scripts. The first screen is an interactive recreation of the Aven window (`demo.css`, `demo.js`) with made-up demo content; it doesn't run agents or send anything anywhere. Below it, the page (`style.css`, `site.js`) has the feature sections, a live theme picker, FAQ and downloads. The download buttons find the newest macOS release through the GitHub API, so the site doesn't change when Aven ships a new version.

After changing a stylesheet or script, bump the `?v=` number on its link in `index.html` so returning visitors get the new file.

## Preview locally

```sh
python3 -m http.server 4827 --bind 127.0.0.1
```

Then open http://127.0.0.1:4827/.
