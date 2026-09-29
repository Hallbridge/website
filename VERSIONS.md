# Site versions

Every design is saved as a git tag, so any version can be restored.

| Tag | What it is |
| --- | --- |
| `v1-original` | Original cream, text-only design |
| `v2-redesign` | Construction photography redesign: full-bleed hero, markets, testimonials |
| `v2.1-clean-hero` | Centered HALLBRIDGE wordmark in hero, smaller headline, monogram-only nav; hero stats, eyebrow and scrolling banner removed |
| `v2.2-seo-photos` | Centered nav, new section photos, faster loading, FAQ, structured data, robots.txt, sitemap, llms.txt, new share image |
| `v2.3-moody-graded` | Moody photo set (dark executive handshake, rooftop executive, ironworkers at dusk) and one warm color grade across every photo |
| `v2.4-relationships` | About: two executives walking together (main) + jobsite handshake (inset) |
| `v2.5-roles-split` | Roles: split image, site at dusk over executives at a high-rise window |
| `v2.6-subline` | Original logo kept; TALENT PARTNERS brighter and slightly larger on dark backgrounds |
| `v2.7-crew-deck` | About main photo: project team on a new concrete deck; mobile roles text before photos |
| `v2.8-crops` | About collage rearranged, 100% badge removed, crew photo recropped; phone crops fixed for hero and welding band |

## Revert the live site to an older version

Fastest (no code): Netlify > Deploys > pick an older deploy > "Publish deploy".

From the repo:

    git checkout main
    git checkout v1-original -- .
    git commit -m "Revert site to v1-original"
    git push

Photos in assets/img are from Unsplash (free for commercial use, no attribution required).
