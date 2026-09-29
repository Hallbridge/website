# Site versions

Every design is saved as a git tag, so any version can be restored.

| Tag | What it is |
| --- | --- |
| `v1-original` | Original cream, text-only design (live until the v2 redesign) |
| `v2-redesign` | Construction photography redesign: full-bleed hero, markets, testimonials |

## Revert the live site to an older version

Fastest (no code): Netlify > Deploys > pick an older deploy > "Publish deploy".

From the repo:

    git checkout main
    git checkout v1-original -- .
    git commit -m "Revert site to v1-original"
    git push

Photos in assets/img are from Unsplash (free for commercial use, no attribution required).
