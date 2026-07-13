# SR5 Dice Flow

Foundry VTT 14 module for Shadowrun 5e `0.36.1.1+`. It records SR5 tests as revisioned, multi-target transactions and renders a live bilingual chat card. Damage is resolved step by step (attack, defense, soak) in a single card and is only applied to an actor through the explicit **apply damage** button, restricted to the GM and actor owners.

Since **v2.0** the card flow runs on a declarative FlowSpec engine and covers the full core-rulebook combat sequence: fire modes with grouped modifiers, deferred ammunition, per-target active-defense buttons (dodge/block/parry/full defense) with a cover selector and an initiative-cost confirmation, suppressive fire, a multi-target pool-split advisory, called shots injected into the attack dialog, and advisory action-economy tracking in the combat tracker. **v2.1** adds magic: spellcasting (with drain), summoning, ritual, binding and banishing. **v2.2** adds the Matrix: data spike, brute force and hack on the fly (with automatic mark display and matrix damage), an overwatch-score readout, complex forms with fade, and sprite compiling. **v2.3** rounds out the core rulebook: extended-test progress cards, first aid / medicine with an apply-healing button, edge-use display, and a success/failure verdict for simple threshold tests (perception, social, vehicle). Everything still mutates actor data only through explicit confirmation buttons — drain, fade, damage and healing are never applied automatically.

## Installation in Foundry VTT

**Manifest URL:**

```text
https://raw.githubusercontent.com/TimRoesler/sr5-dice-flow/main/module.json
```

1. In Foundry VTT, open **Add-on Modules → Install Module**.
2. Paste the manifest URL above into **Manifest URL**.
3. Select **Install** and activate **SR5 Dice Flow** in your world.

Direct links: [open manifest](https://raw.githubusercontent.com/TimRoesler/sr5-dice-flow/main/module.json) · [download release ZIP](https://github.com/TimRoesler/sr5-dice-flow/releases/download/v2.3.0/sr5-dice-flow.zip)

Required: `shadowrun5e` 0.36.1.1+, `sr5-chummer` 0.6.0+ and `libWrapper`.

For local development run `npm install && npm run validate`; the distributable is written to `release/sr5-dice-flow.zip`.

## Development documentation

The module is being expanded to cover every player action of the SR5 core rulebook. Start with [AGENTS.md](AGENTS.md) (contributor/agent onboarding), then:

- [docs/DEVELOPMENT-PLAN.md](docs/DEVELOPMENT-PLAN.md) — roadmap, milestones M0–M4, work packages, guardrails
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — current v1 architecture and the target v2 FlowSpec engine
- [docs/FLOWS.md](docs/FLOWS.md) — catalog of all core-rulebook actions with page references and status
- [docs/TESTING.md](docs/TESTING.md) — manual in-Foundry test checklists per release

## Use and API

System test messages are observed through documented chat hooks; compatible registered test classes are wrapped through libWrapper. The public API is `game.modules.get("sr5-dice-flow").api` and exposes `create`, `get`, `addTarget`, `registerModifierProvider`, `recalculate`, and `migrate`. Calls which change target reactions must be validated by the active GM. Optimistic revision checks prevent double clicks and stale clients from overwriting state.

The world setting **Confirm ammunition consumption** is enabled by default. Ranged attacks
apply progressive recoil immediately but consume the selected fire-mode rounds only after an
owner or GM confirms the ammunition change on the flow card. Disabling the setting restores
the Shadowrun system's immediate ammunition consumption.

Modifier providers receive `{ actor, item, testType, categories, wireless, equipped }`. Return entries with `label`, numeric `value`, `source`, and preferably a stable `fingerprint`. Higher-priority entries win fingerprint collisions. Personal spontaneous modifiers can be stored in the hidden user-scoped `modifierPresets` setting.

## Privacy and diagnostics

Blind/GM roll JSON is never copied into transaction flags. Foundry roll modes remain authoritative. Each visible modifier contains its source and condition; ambiguous mappings return a warning instead of silently changing the pool. The bundled map intentionally covers only mechanically identifiable SR5 core-book entries and is designed to be extended by providers.

## Edge

The core supports Push the Limit, Second Chance, Blitz, Seize the Initiative, Close Call, and Dead Man's Trigger. Edge is deducted atomically by the active GM workflow and logged as an event. Refunding invalidated Edge is a separate, explicitly confirmed GM operation.

## Compatibility limits

The module does not reproduce rule text, parse arbitrary item prose, change condition monitors, or retrofit old non-module chat messages. Supplement books are outside v1.0.0. Automated Foundry/Quench and Playwright suites require a licensed local Foundry installation and are therefore separate from the deterministic unit suite.
