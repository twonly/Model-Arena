# Model and provider icons

Source: [Lobe Icons](https://github.com/lobehub/lobe-icons), MIT license
([included here](./LICENSE)). Brand names and logos belong to their respective owners.

Downloaded on 2026-09-26 from the pinned
[@lobehub/icons-static-svg@1.95.1 package](https://registry.npmjs.org/@lobehub/icons-static-svg/-/icons-static-svg-1.95.1.tgz).
The package SHA-512 was verified against npm registry metadata:
Hw7EPPgVnC4NZLXBfTNJG6hyQgqECfUPC11VVXodPSr1aebKcFxDZlSpxhWwYNdCc6bhxps/x5TtXoPmfKH2ag==

SVG filenames are unchanged from the package's icons/ directory.
Only the 32 marks used in lib/provider-icons.ts are included. No runtime CDN or icon dependency is needed.
Model-specific marks (such as Claude, Gemini, Kimi, MiMo, Qwen and Hunyuan) are preferred;
the company mark is used for other recognized families. Unknown models retain readable initials.

Matching order: model ID → display name → provider → API hostname.
Protocol paths such as /openai and /anthropic are not treated as model identity.
