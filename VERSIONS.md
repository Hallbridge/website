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
| `v2.9-field-suite` | Roles: field-to-executive-suite reveal slider (hard hat superintendent / office executive); crew photo retouched and centered; handshake recentered |
| `v2.10-align` | Slider heads aligned across field and executive photos; Field Operations Manager added to roles |
| `v2.11-slider-zoom` | Slider zoomed out: smaller faces, full hard hat, heads still aligned |
| `v2.12-client-services` | Client Services section (Hire / Look / Grow) and Websites for Builders section with laptop + phone mockup; Websites in nav, FAQ and schema |
| `v2.13-hero-client-services` | Hero line: construction client services company, in person and online |
| `v3-hallbridge-company` | Rebrand to The Hallbridge Company: stacked THE / HALLBRIDGE / COMPANY hero, new wording, schema, link preview, centered footer, signature wordmark asset |
| `v3.1-mockup-photos` | Websites mockup uses new photos (glass towers, brick multifamily, glass midrise, residential tower, crew on rebar) so none repeat sections above |
| `v3.2-phone-headline` | Phone mockup: "Join a team that builds" centered near the top, clear of the crew |
| `v3.3-apply-align` | Phone mockup: Apply buttons aligned in one right column, full job titles fit |
| `v3.4-intro-3d` | 3D intro on the home page: copper wireframe bridge assembles beam by beam, camera flies across it to a crane skyline at dawn, THE HALLBRIDGE COMPANY lands; opt-in generated sound; once per session, skippable, off for reduced motion. Hero line adds recruiting |

## Revert the live site to an older version

Fastest (no code): Netlify > Deploys > pick an older deploy > "Publish deploy".

From the repo:

    git checkout main
    git checkout v1-original -- .
    git commit -m "Revert site to v1-original"
    git push

Photos in assets/img are from Unsplash (free for commercial use, no attribution required).
| v3.5-intro-options (preview only) | 2026-10-26 | Sunrise rebuilt to match the hero photo (sky/sun/cloud ride with the camera so towers can't hide it); five intro variants behind ?v=1..5, options page /intro-options.html; deployed to lambent-toffee-c7d0ac only, live site unchanged (v3.4 backed up to ~/Developer/_backups/hallbridge-site/hallbridge-site-live-v3.4-intro-20261026.zip and assets/intro-v34-current.js) |
| v3.5b-intro-smooth (preview only) | 2026-10-26 | Options 1, 2, 3, 5: smoothed the camera rise at the end of the deck (no bump). All options: towers in the sun's column are capped so the sun is at least half visible at the end. Preview lambent-toffee-c7d0ac only; live unchanged. |
| v3.5c-intro-city (preview only) | 2026-10-26 | Option 3 starts centered on the deck (no opening pan). City laid out in staggered rows with jitter instead of random placement, so the skyline has no open gaps. Preview only; live unchanged. |
| v3.6-intro-bridge | 2026-10-26 | LIVE. Intro option 3 is the default: starts centered on the finished bridge, towers rise around the cranes as the sun comes up (always at least half visible over a rooftop), smooth camera rise at the end of the deck, staggered city layout. Other options still reachable with ?intro=1&v=1..5. Previous intro: git 2458e3c / assets/intro-v34-current.js (untracked) / _backups zip. |
| v3.6.1-founder-title | 2026-10-29 | Alex's title in Google structured data (index.html jobTitle) and llms.txt changed from "Founder & Managing Partner" to "Founder & Head of Recruiting" to match his email signature. No visible page change. |
