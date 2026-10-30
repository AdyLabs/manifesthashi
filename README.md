# manifesthashi

Shop and commission site for Sal's original paintings. Late-2000s scene look, built with React and Vite.

Every change saved to the `main` branch rebuilds the site and publishes it to GitHub Pages
(about a minute). You can follow each run under the **Actions** tab.

## Add a painting (no installs needed)

Everything happens on github.com, on a computer or a phone.

1. **Upload the photo.** Open the `art` folder, click **Add file → Upload files**, drop the photo in,
   and click **Commit changes**.
   - Use a simple name with no spaces, like `night-swim.jpg`.
   - About 1600px on the long side and under 300 KB keeps the site fast.
   - Shoot it flat, front-on, in daylight.
2. **Add its details.** Open `paintings.json`, click the pencil icon, and paste a new block.
   Order matters: the list order is the order on the site, and the **first two** show in the big
   header at the top.

   ```json
   {
     "id": "night-swim",
     "title": "Night Swim",
     "category": "figure",
     "medium": "Acrylic on canvas",
     "tag": "just in",
     "status": "available",
     "price": "Inquire",
     "image": "night-swim.jpg",
     "alt": "One sentence describing what is in the painting."
   },
   ```

   Every block except the last one ends with a comma after its `}`.
3. Click **Commit changes**. The site updates by itself about a minute later.

What each field means:

| Field | What to put |
|---|---|
| `id` | Short, unique, lowercase letters, numbers and dashes. Never change it after publishing, or people who saved the piece lose it. |
| `title` | The painting's name. |
| `category` | `figure` or `abstract`. Picks which filter tab it shows under. |
| `medium` | For example `Acrylic on canvas`. |
| `tag` | Small label above the title, like `just in`, `original` or `sold`. |
| `status` | `available`, or `wip` for unfinished work. |
| `price` | `Inquire`, or a price like `$450`. |
| `image` | The photo's file name in `art`, exactly as uploaded (capitals matter). |
| `alt` | One sentence describing the painting for people using screen readers. |

To remove a painting, delete its block from `paintings.json` (and its photo from `art` if you like).

### If something goes wrong

If `paintings.json` has a mistake, the update stops and the live site stays exactly as it was.
Open the **Actions** tab, click the run with the red mark, then **Check paintings.json**. It says
which painting and what is wrong, for example a missing comma or a photo name that does not match.
Fix it and commit again.

## For developers

```bash
npm install
npm run dev               # local dev server
npm run check:paintings   # the same check the deploy runs
npm run build             # dist/ for GitHub Pages
npm run build:single      # one self-contained dist/index.html
```

See `CLAUDE.md` for the brief, design rules and open items.
