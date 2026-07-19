# Changelog

All notable changes to SR5 Dice Flow are documented here. Versions follow the module's release schedule (see `docs/DEVELOPMENT-PLAN.md`).

## v2.4.0 — Item-Nutzung & Effekt-Anwendung (M5)

### Added

- **Aufgeschobene Item-Effekte** (`deferEffects`, Welt-Setting, Standard an): Zieleffekte von Items
  (`applyTo: targeted_actor`) werden bei Testerfolg nicht mehr automatisch vom System angewendet,
  sondern als ausstehende Effekte auf der Flow-Karte gesammelt und erst per Bestätigungs-Button
  (`Effekte anwenden`) als ActiveEffects auf dem Ziel-Actor erzeugt. libWrapper-`MIXED` auf
  `SuccessTest.afterSuccess` (unopposed) und `OpposedTest.afterFailure` (opposed); jeder Fehler
  fällt auf das Systemverhalten zurück, Teilabdeckung der Ziele wird nie still verschluckt.
- **FlowSpec `item-use`**: Nicht-vergleichende Proben, deren Item Zieleffekte trägt, bekommen einen
  eigenen Flow (`targets+self`) mit Item-Card-Section (Icon, Blast-Radius/Dropoff, aktive Effekte).
- **Items ohne Würfelprobe**: `SR5_CastItemAction`-Hook erzeugt für Items mit anwendbaren Effekten
  (z. B. Drogen, Toxine) eine eigene Modul-Karte mit Zielen aus der aktuellen Zielauswahl,
  Selbst-Branch und Effekt-Buttons; die System-Beschreibungskarte bleibt unangetastet.
- **Selbstanwendung**: `Effekte auf sich anwenden` erzeugt aktivierte Kopien der Item-Effekte auf
  dem eigenen Actor (targeted_actor-Kopien mit `appliedByTest`, deaktivierte `actor`-Effekte als
  aktivierte Kopie); Item-Effekte selbst werden nie umgeschaltet, bereits aktive nur angezeigt.
- **Blast-Anzeige im Kampf-Flow**: Granaten/Wurfwaffen mit Sprengwirkung zeigen Radius und
  Dropoff in der Kampf-Origin-Section; Flashbang-artige Zieleffekte laufen pro Verteidiger über
  die Opposed-Deferral-Schiene.
- Neue Confirmation-Art `effect` mit globalen Confirmations (`effectsApplied`/`selfEffectsApplied`),
  Core-Mutation `setPendingEffects` (Event `effects.pending`), Socket-Action `pendingEffects`
  (revisionstolerant, Author/GM/Branch-Owner), Sanitizer mit 32-KB-Size-Guard (Fallback: Name-only
  + Live-Re-Collect beim Anwenden). 20 neue Unit-Tests (insgesamt 180).

## v2.3.3 — Live-Chat-Karten und First Aid

### Added

- **Stage-Rail für Flow-Karten**: Kampf-, Magie-, Matrix-, Heilungs- und generische Flows zeigen erledigte, übersprungene, aktuelle und nächste Stufen; der aktive Schritt ist für Screenreader mit `aria-current="step"` ausgezeichnet.
- **Klare Aktionshierarchie**: reguläre Würfel-/Flow-Aktionen, bestätigungspflichtige Actor-Mutationen und GM-Korrekturen sind visuell und strukturell getrennt.
- **First Aid auf der Karte**: Heilmenge sowie Auswahl von Körperlich/Betäubung stehen direkt neben der expliziten Heilungsbestätigung.
- **Neue Renderer-Regressionstests** für Verdict-Semantik, Stage-Rail, Action-Tiers und den Heilungs-Dialog.

### Fixed

- **Verdikt-Farben**: allgemeine Erfolge und Misserfolge verwenden nun eigene semantische Klassen; sie missbrauchen nicht mehr die rot kodierte Kampf-Trefferklasse.

## v2.3.2 — Chat-Karten-Feinschliff

### Changed

- **Chat-Karten an das System-Theme gekoppelt**: hartkodierte Farben (Verdikt, Edge, Aktionsökonomie, Kampf-Hinweis, Called Shot) durch die Theme-Tokens des Character Sheets ersetzt (`--sr5-theme-failure/success/glitch-a/label`, getönt via `color-mix`). Passt sich damit automatisch an helles und dunkles Sheet-Theme an.
- **Kompaktere Darstellung**: kleinere Innen-/Außenabstände und Lücken, schmalere Ziel-/Kampf-Spalten (12→10rem bzw. 11→9,5rem), niedrigere Buttons und dezenterer Eckenradius. Rein kosmetisch, keine Funktionsänderung.

## v2.3.1 — Bugfix

### Fixed

- **Follow-up capture crash in combat** (`Cannot convert undefined or null to object`): the self-branch id embedded the actor UUID (e.g. `self-Actor.xxxx`), whose dot was expanded by Foundry's `expandObject` when persisting the transaction flag, splitting the branch into a `rolls`-less phantom entry. Self-branch ids are now dot-free, and `rollExists` tolerates malformed branches so already-corrupted chat cards no longer throw.

## v2.3.0 — Rest of the core rulebook

Milestone 4: extended tests, healing, edge display and general polish.

### Added

- **Extended tests** (`extended`): a progress card section shows the cumulative hits versus the threshold with a progress bar and a "threshold reached" marker.
- **Healing** (`heal`): first aid, medicine and biotechnology tests expose an apply-healing button per patient that heals the healer's hits of physical damage — only on explicit confirmation.
- **Edge display**: push-the-limit and second-chance are captured from the roll and shown on the card (the reroll itself stays inside the system).
- **Threshold verdict**: simple, non-opposed tests with a threshold (perception, social, knowledge, vehicle) now show a success/failure verdict on the card.

### Notes

- Teamwork keeps the system's own participant UI and is intentionally not taken over. Edge rerolls remain system-internal; the module only renders that edge was used.

## v2.2.0 — Matrix

Milestone 3: matrix actions, complex forms, sprites and overwatch.

### Added

- **Matrix flow** (`matrix`) for data spike (`MatrixTest`) and the mark-placing actions brute force and hack on the fly: each target rolls its matrix defence, then a matrix damage resist, with an explicit **apply damage** button for the matrix condition monitor. Marks are display-only — the system places them automatically — so the card shows the placed mark count.
- **Overwatch check** (`overwatch-check`): the caster's current overwatch score is shown on the card; the increase itself is handled by the system.
- **Complex forms** (`complex-form`): an optional opposed defence plus the technomancer's auto-rolled fade on a self branch, applied only through an explicit **apply fade** button.
- **Sprite compiling** (`sprite-compiling`): a GM-only "roll sprite" button rolls the opposed compilation, services are shown as net hits, and fade is then rolled and applied through buttons.
- New confirmation kind `fade` and an i18n regression test that guards against key collisions and locale drift.

### Fixed

- **i18n load crash**: the `SDF.CalledShot` label key collided with the `SDF.CalledShot.*` branch, so Foundry's localization expansion threw and aborted world load. The modifier key is now `SDF.CalledShotModifier` (latent since v2.0).

## v2.1.0 — Magic

Milestone 2: spellcasting, summoning, ritual, binding and banishing.

### Added

- **Spellcasting flow** (`spellcasting`) for combat and non-combat spells: each target rolls its opposed defence, indirect combat spells then soak, and the caster's auto-rolled drain is captured on a self branch and applied only through an explicit **apply drain** button. Direct combat spells skip the soak but still expose damage. A spell origin card section shows category, force and drain value.
- **Summoning flow** (`summoning`): a GM-only "roll spirit" button rolls the opposed spirit test on the same card (the spirit is created system-side), services are shown as net hits, and the summoner then rolls and applies drain through buttons — never automatically.
- **Ritual flow** (`ritual`): a GM-only "roll ritual" button rolls the 2×force opposing test on the card, followed by the drain button.
- **Binding and banishing** run through the generic opposed flow (the system has no dedicated test classes for them).
- Declarative stage buttons: `StageSpec.action` (custom card action per stage) and `StageSpec.gm` (GM-only stage buttons).

## v2.0.0 — Engine + full core combat

Milestone 0 (engine) and Milestone 1 (combat) of the core-rulebook coverage plan.

### Added

- **Declarative FlowSpec engine** replacing the hard-coded attack→defense→soak chain. Flows are data (`match`, branches, stages with named pure reducers, transitions, confirmations); the core is Foundry-free and unit-tested. Generic `combat-attack`, `suppression`, `generic-opposed` and `generic-simple` specs ship in-box, with runtime capability checks that disable a spec instead of failing when a system test class is missing.
- **Schema v2** transactions (`Branch` with `kind: target|self`, `flowId`, `economy`, `extended`, `documentUuid`) plus lazy v1→v2 migration.
- **Ranged combat origin details**: fire mode (rounds, defense modifier), progressive recoil before/after, distance/range band per target, and system pool changes grouped by source (range, recoil, wounds, environment).
- **Deferred ammunition** (`Confirm ammunition consumption`, on by default): progressive recoil applies immediately, but the fire-mode rounds are consumed only after an owner/GM confirms on the card. Display-only fallback if the wrap is unavailable.
- **Active-defense UX**: per-target buttons (normal, full defense, and melee-only dodge/block/parry) that pre-fill the system defense dialog, a cover selector, and an explicit "apply −N initiative" confirmation for active-defense costs.
- **Suppressive fire** flow (`SuppressionDefenseTest`), with a full-damage soak on a failed defense.
- **Multi-target attack advisory**: reminds you to split the dice pool (SR5 p. 196) and about progressive recoil; never enforced. Not shown for area suppression.
- **Called shots** (which the system lacks): a selector injected into attack dialogs applies a −4 pool modifier and tags the shot; a GM/author "announce called shot" fallback badge covers cases where injection can't run.
- **Advisory action-economy tracking**: per-combatant free/simple/complex/interrupt budget per initiative pass, shown as a card badge and a combat-tracker block that turns yellow when over budget. GM-authoritative, never blocking.

### Fixed

- **v1.4.1 hotfix (M0.2)**: Drain/Fade follow-up rolls are no longer swallowed — unmatched follow-ups are recorded instead of throwing, and the system message is suppressed only on a real capture.

## v1.4.0

Initial revisioned multi-target attack flow: attack → defense → soak in a single card with on-demand damage application.
