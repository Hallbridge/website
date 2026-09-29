# Site versions

Every design is saved as a git tag, so any version can be restored.

| Tag | What it is |
| --- | --- |
| `v1-original` | Original cream, text-only design |
| `v2-redesign` | Construction photography redesign: full-bleed hero, markets, testimonials |
| `v2.1-clean-hero` | Centered HALLBRIDGE wordmark in hero, smaller headline, monogram-only nav; hero stats, eyebrow and scrolling banner removed |
| `v2.2-seo-photos` | Centered nav, new section photos, faster loading, FAQ, structured data, robots.txt, sitemap, llms.txt, new share image |
| `v2.3-moody-graded` | Moody photo set (dark executive handshake, rooftop executive, ironworkers at dusk) and one warm color grade across every photo |

## Revert the live site to an older version

Fastest (no code): Netlify > Deploys > pick an older deploy > "Publish deploy".

From the repo:

    git checkout main
    git checkout v1-original -- .
    git commit -m "Revert site to v1-original"
    git push

Photos in assets/img are from Unsplash (free for commercial use, no attribution required).
