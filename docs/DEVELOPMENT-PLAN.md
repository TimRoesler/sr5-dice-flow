# Entwicklungsplan: sr5-dice-flow → vollständige Abdeckung des SR5-Grundregelwerks

Stand: 2026-07-12 · Basis: Modul v1.4.0, System `shadowrun5e` 0.36.1.5, Foundry v14

## Kontext & Ziel

Das Modul deckt heute nur den Kampf-Grundflow ab (Angriff → Verteidigung → Schadenswiderstand
→ Schaden anwenden) als revisionierte Transaktion mit Live-Chat-Karte. Ziel: **alle würfelbaren
Spieler-Aktionen des SR5-Grundregelwerks** vereinfachen — Kampf komplett, Magie, Matrix,
Fahrzeuge, Heilung, Soziales, ausgedehnte/Teamwork-Proben, Edge — plus Aktionsökonomie-Tracking.
Der vollständige Aktionskatalog mit GRW-Seitenreferenzen steht in [FLOWS.md](FLOWS.md).

## Leitplanken (bindende Entscheidungen des Maintainers)

1. **Milestone-Reihenfolge: Kampf → Magie → Matrix → Rest**
2. **Einstieg bleibt der System-Charakterbogen.** Das Modul fängt Würfe ab (libWrapper auf
   `SuccessTest.prototype.toMessage`) und führt den Rest des Flows über seine Chat-Karten.
   Kein eigener Action-Browser, keine eigenen Würfeldialoge (System-Dialoge dürfen vorbefüllt werden).
3. **Nur Würfelflows.** Das Modul mutiert nie Actor-/Welt-Daten außer per explizitem
   Bestätigungs-Button (wie heute „Schaden anwenden"). Gilt auch für Munition, Entzug,
   Initiative-Kosten, Marken. Dokumentierte Ausnahmen (nur Anzeige, System mutiert selbst):
   Overwatch-Wert, systemseitige Markenplatzierung, Geistererschaffung.
4. **Aktionsökonomie-Tracking: ja, advisory.** Das Modul kennt alle GRW-Handlungen
   (Frei/Einfach/Komplex/Unterbrechung) und trackt pro Combatant/Durchgang das Budget —
   Warnung bei Überschreitung, **niemals blockieren** (SR5 hat zu viele legale Ausnahmen).

## Verifizierte Systemfakten (Grundlage der Architektur)

Quelle: TS-Quellen aus `shadowrun5e/dist/bundle.js.map` (Extraktion siehe AGENTS.md).

- **Followed-Tests (DrainTest/FadeTest)** laufen durch den bereits gewrappten
  `SuccessTest.prototype.toMessage` (`TestCreator.fromFollowupTest` setzt
  `data.previousMessageId` + `testData.following`). Das Modul v1.4.0 routet sie aber falsch:
  `captureFollowup` sucht ein Ziel-Branch per Actor-UUID des Würfelnden — beim Entzug würfelt
  der **Zauberer**, kein Branch matcht, es wirft `SDF.Error.MissingTarget`, während die
  `preCreateChatMessage`-Suppression die Systemnachricht trotzdem blockt.
  → **Live-Bug: Drain/Fade-Würfe werden verschluckt.** Hotfix ist Arbeitspaket M0.2.
- `SpellCastingTest` führt Drain automatisch aus (`afterTestComplete → executeFollowUpTest`);
  `SummonSpiritTest`/`OpposedSummonSpiritTest` setzen `autoExecuteFollowupTest = false`
  (Button auf der Systemnachricht, `ActionFollowupFlow`).
- **Feuermodi/Rückstoß/Reichweite/Umgebung rechnet das System** (`FireModeRules`,
  `RecoilModifier` mit progressivem Rückstoß am Actor, `WeaponRangeTestBehavior`,
  `DocumentSituationModifiers`); alles landet in `test.data.pool.changes` → Modul zeigt an,
  rechnet nicht nach.
- **Munition verbraucht das System automatisch**: `RangedAttackTest.consumeDocumentRessources
  → consumeWeaponAmmo → item.useAmmo(fireMode.value)` läuft in `execute()` **vor** `toMessage`;
  dieselbe Methode ruft `actor.addProgressiveRecoil(fireMode)`.
- **Verteidigungsoptionen sind nativ**: `PhysicalDefenseTest` hat `data.cover`,
  `data.activeDefense`, `data.activeDefenses` aus `ActiveDefenseRules.availableActiveDefenses`
  (Ausweichen/Block/Parade/Volle Abwehr inkl. Ini-Kosten `defense.init`).
- Sperrfeuer: `fireMode.suppression` → Opposed-Klasse `SuppressionDefenseTest`.
- **Called Shots existieren im System nicht** (keine Fundstelle) → Modul-Eigenleistung.
- **Aktionsökonomie existiert nicht feingranular**: `SR5Combatant` kennt nur `system.acted` /
  `attackedLastTurn`; jede Action trägt aber `action.type` (`free|simple|complex|interrupt|varies`)
  und `initiative_mod`. `SR5Combat` hat `pass`, `nextPass()`, `nextRound()`.
- **Overwatch-Wert**: World-`DataStorage` Key `matrix.ow`
  (`actor.getOverwatchScore()/setOverwatchScore()`); wird von einem System-Hook-Listener
  (`MatrixHooks.onTestProcessResults_AddOverwatchScore` auf `sr5_testProcessResults`)
  automatisch erhöht — nicht sauber abfangbar → nur Anzeige.
- **Marken** sind Actor-Daten (`actor.setMarks/getMarksPlaced`, `MarkPlacementFlow`);
  manche System-Flows platzieren selbst (`MatrixNetworkFlow`).
- **Ausgedehnte Proben**: `SuccessTest.executeAsExtended` re-instanziiert dieselbe Testklasse
  mit `extendedRoll=true`, akkumuliert `values.extendedHits`, erzeugt **pro Iteration eine
  neue Chat-Message**.
- **Teamwork**: System liefert `actor/flows/TeamworkFlow.ts` (`TeamworkTest`).
- **Zauberabwehr/Counterspelling hat keinen System-Flow** (nur Skill-/Config-Daten)
  → advisorische Pool-Zeile durch das Modul.
- Nützliche System-Hooks: `sr5_beforePrepareTestDataWithAction`, `sr5_testPrepareBaseValues`,
  `sr5_testProcessResults`, `sr5_afterTestComplete`, `sr5_afterDamageAppliedToActor`,
  `SR5_CastItemAction` (vetobar).

## Architektur v2: deklarative Flow-Engine

Kern des Ausbaus: die hartkodierte Kette `created→defending→defended→resisting→complete`
wird durch **FlowSpecs** ersetzt — deklarative Flow-Definitionen, die eine generische Engine
abarbeitet. Details und Typdefinitionen in [ARCHITECTURE.md](ARCHITECTURE.md) §Ziel-Architektur.
Kurzfassung:

- **Schema v2**: `TargetBranch` → generisches `Branch` mit `kind: 'target'|'self'`
  (self = Zauberer/Hacker für Drain, Fade, OS, Munition), `stageId`,
  `rolls: Record<stageId, RollRecord>`, `derived`, `confirmations`, optional `documentUuid`
  (Matrix-Ziele sind auch Hosts/Geräte — Feld ab v2 definieren, verhindert v3-Migration).
  Transaktion bekommt `flowId`, optional `economy` und `extended`.
- **FlowSpec** (`src/core/flows/`): `match(origin)`, Branch-Erzeugung
  (`targets|single|targets+self`), Stages mit `testClasses`, `trigger`
  (`button|systemFollowup|systemOpposed`), benanntem purem `reduce`, `next`-Übergängen und
  `confirm`-Buttons. Reducer/Extraktoren sind benannte pure Funktionen → Transaktion bleibt
  JSON-serialisierbar, Core ohne Foundry testbar.
- **Capture-Router** (`src/foundry/integration.ts`, Rewrite): Origin → FlowSpec-Registry
  (Fallbacks `generic-opposed`/`generic-simple` matchen zuletzt); Follow-up → Stage per
  Testklasse + Branch-Zuordnung (perTarget: Würfelnder = Ziel; self: Würfelnder = Origin-Actor,
  Drain via `data.following`). **Nicht zuordenbare Follow-ups: nie werfen, nie unterdrücken** —
  als Info-Event anhängen. Suppression nur bei erfolgreichem Capture. Sicherheitsnetz:
  `sr5_afterTestComplete`-Hook, idempotent per Roll-ID.
- **Runtime-Capability-Checks** beim Init: jede von FlowSpecs referenzierte Testklasse gegen
  `game.shadowrun5e.tests` prüfen; fehlt eine → FlowSpec deaktivieren + Konsolen-Warnung
  (Schutz gegen Systemversions-Drift).

---

## Milestone 0 — Bootstrap, Hotfix, Engine (Voraussetzung für alles)

| # | Arbeitspaket | Dateien | Status |
|---|---|---|---|
| M0.1 | Repo-Setup, `npm ci`, `npm run validate` grün | — | ✅ erledigt (2026-07-12) |
| M0.2 | **Hotfix v1.4.1**: `captureFollowup` gibt bei fehlendem Branch-Match `undefined` zurück statt zu werfen; `shouldSuppressFollowupMessage` unterdrückt nur bei Match (Marker mit `targetId`, der noch in der Transaktion existiert). Regressionstest. **Separat releasen, vor dem Engine-Umbau.** | `src/foundry/integration.ts`, `tests/followup-message.test.ts` | ✅ erledigt (2026-07-12) |
| M0.3 | Schema-v2-Typen (Branch, flowId, economy, extended, documentUuid) + `migrate()` v1→v2 (lazy beim Laden; v1-Targets → target-Branches, Stage-Mapping created→defense, defended→soak, complete→done) | `src/types.ts`, `src/core/transaction.ts`, `tests/transaction.test.ts` | ✅ erledigt (2026-07-12) |
| M0.4 | Flow-Engine: `advance(tx, branchId, stageId, roll, reduced)`, Reducer-/Extraktor-Registries, FlowSpec-Registry mit Capability-Checks | `src/core/flows/spec.ts`, `src/core/flows/engine.ts`, `src/core/flows/registry.ts`, `src/core/reducers.ts` | ✅ erledigt (2026-07-12) |
| M0.5 | Capture-Router-Rewrite (Origin/Follow-up/unmatched), Foundry-Extraktoren | `src/foundry/integration.ts`, `src/foundry/extract.ts` | ✅ erledigt (2026-07-12) |
| M0.6 | Generische Card-Renderer (stage-getrieben, per-FlowSpec `cardSections`) und generische `run-stage`/`confirm`-Actions (alte Action-Namen als Aliase für v1-Karten) | `src/foundry/card.ts`, `src/foundry/actions.ts` | ✅ erledigt (2026-07-12) |
| M0.7 | Socket: generische `advance`/`confirm`-Mutationen, Protokollversion + Mixed-Version-Guard (v1-Handler eine Release-Periode behalten) | `src/main.ts`, `src/foundry/socket.ts`, `src/foundry/security.ts` | ✅ erledigt (2026-07-12) |
| M0.8 | Bestehendes Verhalten als FlowSpecs `combat-attack` + `generic-opposed`/`generic-simple` portieren. **Paritäts-Checkpoint: alle bestehenden Tests grün.** | `src/core/flows/specs/*.ts` | ✅ erledigt (2026-07-12) |

## Milestone 1 — Kampf komplett → Release v2.0

| # | Arbeitspaket | Dateien | Status |
|---|---|---|---|
| M1.1 | Origin-Extraktion Fernkampf: Feuermodus (Label, Schuss, Verteidigungsmod), Rückstoß vor/nach, **Munition vor/nach** (vor `wrapped()` lesen — Verbrauch passiert in `execute()` vor `toMessage`), Distanz/Reichweite pro Ziel, `pool.changes` nach Quelle gruppieren (Umgebung/Reichweite/Rückstoß/Wunden). Nahkampf: `data.reach`. Wurfwaffen: gleiche FlowSpec. | `src/foundry/extract.ts`, `src/core/flows/specs/combat.ts` | ✅ erledigt (2026-07-12) |
| M1.2 | **Munitions-Bestätigung**: libWrapper MIXED auf `RangedAttackTest.prototype.consumeWeaponAmmo`; Setting `deferAmmo` (default an): `item.useAmmo()` überspringen, **`addProgressiveRecoil` weiterhin ausführen** (Regeleffekt, keine Ressource); Karte „Munition: 24 → 21 (Salve)" + Bestätigen-Button. Guard + Display-only-Fallback. | `src/foundry/ammo.ts`, `src/main.ts` | ✅ erledigt (2026-07-12) |
| M1.3 | Verteidigungs-UX: Buttons pro Ziel — Normal/Ausweichen/Block/Parade/Volle Abwehr + Deckung; Pre-Seeding `data.activeDefense`/`data.cover` **nach** Test-Konstruktion vor `test.execute()` (Systemdialog öffnet vorbefüllt); Ini-Kosten → „−N Initiative anwenden"-Bestätigungs-Button (`actor.changeCombatInitiative`, entspricht System-Handler `modifyCombatantInit`). Nahkampf-Modi (Ausweichen/Block/Parade) nur bei `MeleeAttackTest`. | `src/foundry/card.ts`, `src/foundry/actions.ts`, `src/core/flows/specs/combat.ts` | ✅ erledigt (2026-07-12) |
| M1.4 | Sperrfeuer: FlowSpec `suppression` (`fireMode.suppression` → `SuppressionDefenseTest`, Schaden bei misslungener Abwehr, Reducer `suppressionDamage`). Struktur identisch zu `combat-attack` (geteilte `combatStages`), matcht **vor** `combat-attack`; `defend()` löst die Defense-Testklasse aus der FlowSpec-Stage statt aus `opposed.test`. | `src/core/flows/specs/combat.ts`, `src/core/flows/specs/index.ts`, `src/foundry/actions.ts` | ✅ erledigt (2026-07-12) |
| M1.5 | Mehrfachangriffe: Advisory-Pool-Split-Hinweis bei >1 Ziel (GRW S. 196), Hinweis progressiver Rückstoß. Keine Erzwingung. Als Warnbox in der `combatOrigin`-Card-Section (nur `combat-attack`, nicht Sperrfeuer); zeigt gleichmäßigen Pool-Split-Vorschlag. | `src/foundry/combat.ts` | ✅ erledigt (2026-07-12) |
| M1.6 | **Called Shots** (System hat sie nicht): `renderTestDialog`-Hook injiziert einen Called-Shot-Select in Angriffs-Dialoge; Auswahl setzt einen `SDF.CalledShot`-Pool-Modifikator (−4, direkt in `pool.changes` mit `mode:2/ADD`, dann `prepareBaseValues/calculateBaseValues/validateBaseValues`) + Tag `test.data.calledShot`. Der Pool-Modifikator überlebt garantiert (Serialisierung), der Typ-Tag ist Best-Effort; Extraktion liest beides. Anzeige in der `combatOrigin`-Section (persistent = „durch alle Stages"). Fallback: author/GM-Toggle „Gezielten Schuss ansagen" (`calledShotAnnounced` + Badge). Katalog in `src/core/calledshots.ts`. | `src/core/calledshots.ts`, `src/foundry/calledshot.ts`, `src/foundry/extract.ts`, `src/foundry/combat.ts` | ✅ erledigt (2026-07-12) |
| M1.7 | **Aktionsökonomie** (advisory): Budget pro Combatant/Runde/Durchgang `{free, simpleUsed, complexUsed, interrupts[], varies}` als Combatant-Flag `sr5-dice-flow.economy`. Erfassung beim Origin-Capture aus `test.data.action.type`; GM-authoritativ (GM schreibt direkt, Spieler via generalisiertem `economy`-Socket, per Actor-Ownership validiert). Dedupe per rollId, Reset lazy bei Runden-/Pass-Wechsel + `updateCombat`-Cleanup (GM). Pass aus `combat.pass`. UI: Handlungstyp-Badge auf der Karte (`tx.economy.actionType`) + kompakter Budget-Block je Combatant im Tracker (`renderCombatTracker`), gelbe Warnung bei Über-Budget. Nie blockierend. Katalog/Labels in `actions-catalog.ts`. | `src/core/actions-catalog.ts`, `src/core/economy.ts`, `src/foundry/economy.ts`, `src/foundry/tracker-ui.ts` | ✅ erledigt (2026-07-12) |
| M1.8 | Unit-Tests: Engine-Übergänge combat/suppression, Economy-Reducer + Foundry-Layer (gemocktes `game`), Feuermodus-Fixtures (`tests/fixtures/firemodes.json`), Migration. 100 Tests grün. | `tests/` | ✅ erledigt (2026-07-12) |

## Milestone 2 — Magie → v2.1

Fortschritt:
- ✅ **`spellcasting`** (2026-07-12) — ein vereinheitlichter Spec deckt spellcasting-combat **und** -other ab: SpellCastingTest → `$origin.defenseTest` (CombatSpellDefenseTest o.ä.) → Soak nur bei indirekten Kampfzaubern (`spellDefense`-Reducer liest `spell.combatType` aus der Origin-Extraktion) → self:Drain (`DrainTest`, systemFollowup) mit `apply-drain`-Button. Direkte Kampfzauber überspringen Soak, zeigen aber Schaden. Reducer `spellDefense`/`drainResist`, Extraktor/Card-Section `spellOrigin`.
- ✅ **`summoning`** (2026-07-12) — SummonSpiritTest (self-Branch) → „Geist würfeln (SL)"-Button repliziert `OpposedSummonSpiritTest.executeMessageAction` **mit sr5DiceFlow-Marker** (Geist würfelt, aber Routing per targetId auf den self-Branch; Geist-Erschaffung passiert systemseitig in `processFailure`) → Dienste = Nettoerfolge (`summonServices`-Reducer) → „Entzug würfeln"-Button (`game.shadowrun5e.test.fromMessage().executeFollowUpTest()`, routet per Actor) → `apply-drain`. `StageSpec.action`/`gm` neu für dedizierte, GM-gegatete Stage-Buttons.
- ✅ **`binding`/`banishing`** — laufen über `generic-opposed` (opposed gegen Geist; keine dedizierten Testklassen im System).
- ✅ **`ritual`** (2026-07-12) — RitualSpellcastingTest (self-Branch) → „Ritual würfeln (SL)"-Button (generalisiertes `conjureOpposed`: OpposedRitualTest ohne Bootstrap, self-Branch-Actor als Source, Pool = 2×Force systemseitig; Marker-Routing) → Nettoerfolge (`opposedHits`) → „Entzug würfeln"-Button → `apply-drain`. Teilt die Drain-Stage mit summoning.

**M2 damit funktional komplett** (Zauber, Beschwören, Ritual, Binden/Verbannen via generic-opposed). Als v2.1 releasen nach In-Foundry-Test.

FlowSpecs: `spellcasting-combat`/`spellcasting-other` (erledigt via `spellcasting`),
`summoning` (SummonSpiritTest → OpposedSummonSpiritTest [GM würfelt Geist] → Drain per Button),
`binding`/`banishing`, `ritual` (RitualSpellcastingTest).

- Entzug nie auto-anwenden → Bestätigungs-Button `apply-drain` (`actor.addDamage`).
- Geisterdienste/Bindung = Actor-Daten → nur Anzeige (Dienste = Nettoerfolge des Beschwörens).
- Zauberabwehr: advisorische Modifier-Zeile auf der Zauberabwehr-Stage (Provider liest
  Antimagie-Skill des Verteidigers + Szenen-Flag „geschützte Ziele").
- `security.ts`: GM muss self-/opposed-Stages auf Spieler-Transaktionen vorantreiben dürfen.
- ⚠ Bei M2-Start verifizieren: Testklassen für Binden/Verbannen in `game.shadowrun5e.tests`
  (call_in_action-Items).

## Milestone 3 — Matrix → v2.2

**KOMPLETT (2026-07-12).** Getestet: 119 Unit-Tests grün.

- ✅ **`matrix`** — ein Spec für Datenspike (`MatrixTest`) **und** Brute Force/Eiliges Hacken (`BruteForceTest`/`HackOnTheFlyTest`): Ziel → `$origin.defenseTest` (`MatrixDefenseTest`/`OpposedBruteForceTest`/`OpposedHackOnTheFlyTest`) → Soak (`$origin.resistanceTest`/`MatrixResistTest`) → done. Reducer `matrixDefense` (netHits, Matrix-Schaden Typ `matrix`, `marksPlaced`), Soak reuse `combatSoak`, Matrix-Schaden-Button (kind `damage`, `actor.addDamage`).
- ✅ **Marken = nur Anzeige** — das System platziert sie **automatisch** (`OpposedBruteForceTest.processFailure` → `actor.setMarks(icon, marks)`), daher kein „Marken platzieren"-Button (verhinderte Doppelplatzierung); `marksPlaced` wird angezeigt. (Abweichung von der ursprünglichen Plan-Idee, weil das System bereits selbst platziert.)
- ✅ **`overwatch-check`** (`CheckOverwatchScoreTest`) — Anzeige des aktuellen OS (`actor.getOverwatchScore()`, World-DataStorage `matrix.ow`); Erhöhung macht der System-Hook → nur Anzeige.
- ✅ **`complex-form`** (`ComplexFormTest`) — analog spellcasting: optionale Ziel-Verteidigung (`opposedHits`) → self:**Fade** (`FadeTest`, systemFollowup, auto) → `apply-fade`-Button (neue Confirmation-Kind `fade`, Reducer `fadeResist`).
- ✅ **`sprite-compiling`** (`CompileSpriteTest`) — analog summoning: „Sprite würfeln (SL)" (`OpposedCompileSpriteTest` via `conjureOpposed`) → Dienste (`summonServices`) → „Überhitzung würfeln" (`conjureDrain`, prüft jetzt `fadeReady||drainReady`) → `apply-fade`.
- Matrix-Ziele (Hosts/Geräte/IC): Branch-`documentUuid` steht bereit (ab v2), Ziel-Erfassung über `addSelectedTargets`.
- ⚠ BiofeedbackResistTest ist noch nicht als eigene Stage integriert (seltener Sonderfall; System-Followup läuft nativ). Kann bei Bedarf als weitere Soak-Stufe ergänzt werden.

## Milestone 4 — Rest → v2.3

**KOMPLETT (2026-07-12), 124 Unit-Tests grün.** Kernfeatures umgesetzt; native/riskante Teile bewusst dem System überlassen (siehe unten).

- ✅ **Ausgedehnte Proben** (`extended`-FlowSpec): matcht `data.extended===true` (nicht opposed). `values.extendedHits` ist bereits kumulativ → keine eigene Akkumulation nötig; jede Iteration zeigt Fortschritt. Card-Section `extendedProgress` (Extractor `extendedProgressExtractor`): kumulative Erfolge / Schwelle + Fortschrittsbalken + „Schwelle erreicht". Iterations-Unterdrückung bewusst nicht umgesetzt (fragil, da Iterationen unabhängige Nachrichten ohne `previousMessageId` sind).
- ✅ **Erste Hilfe** (`heal`-FlowSpec): matcht ausschließlich `action.skill === 'first_aid'`; Ziel-Branch(es) = Patient(en); Monitor-Auswahl (Körperlich/Geistig) und „Heilung anwenden"-Button für Nettoerfolge über der Schwelle — nur per Bestätigung. Medizin/Biotechnologie bleiben generische Proben, da Medizin nur Genesungsproben unterstützt.
- ✅ **Edge-Anzeige**: `data.pushTheLimit`/`data.secondChance` → RollRecord-Feld `edge`; Karte zeigt „Edge eingesetzt: Grenzen überschreiten / Zweiter Versuch". Reroll (`reroll()`-Engine) **bewusst nicht** umgesetzt (riskantester Teil; System handhabt Push-the-Limit/Second-Chance ohnehin testintern → nur Anzeige, wie im Plan als Option vorgesehen).
- ✅ **Soziales/Wahrnehmung/Allgemein/Fahrzeuge**: laufen über `generic-simple`/`generic-opposed`; neu: **Schwellen-Verdikt** auf der Karte (Erfolg/Misserfolg bei `hits>=threshold`, nur für Nicht-Ziel-Flows). PilotVehicleTest/Drohnen-Tests → generic (Kontroll-Rig-Mods kommen aus `pool.changes`, werden angezeigt).
- ➖ **Teamwork**: Das System nutzt eine **eigene TeamworkTest-UI** (`sr5-teamwork-*`-Buttons, kein `SuccessTest.toMessage`-Durchlauf) → nativ belassen, keine Modul-Integration (würde die native UI verdrängen). Advisory-Provider-Idee verworfen als zu fragil.
- ➖ **Natürliche Heilung** (NaturalRecovery-Tests): laufen als ausgedehnte/einfache Proben über die generic/extended-Anzeige.

## Milestone 5 — Item-Nutzung & Effekt-Anwendung → v2.4

**KOMPLETT (2026-07-19), 180 Unit-Tests grün.** Zieleffekte von Items (`applyTo:'targeted_actor'`)
laufen als aufgeschobene, bestätigungspflichtige Anwendung durch alle Flows.

| # | Arbeitspaket | Dateien | Status |
|---|---|---|---|
| M5.1 | Core: ConfirmationKind `effect`, globale Confirmations (`effectsApplied`/`selfEffectsApplied`), `setPendingEffects`, Sanitizer + 32-KB-Size-Guard | `src/core/flows/spec.ts`, `src/core/flows/confirmation.ts`, `src/core/transaction.ts`, `src/core/effects.ts` | ✅ erledigt (2026-07-19) |
| M5.2 | Deferral-Wraps (MIXED auf `SuccessTest.afterSuccess` + `OpposedTest.afterFailure`), Setting `deferEffects` (default an), Fallback auf Systemverhalten bei Fehlern/Teilabdeckung | `src/foundry/effects.ts`, `src/main.ts`, `src/foundry/integration.ts` | ✅ erledigt (2026-07-19) |
| M5.3 | FlowSpec `item-use` (`targets+self`, Item mit Zieleffekten, nicht-opposed) + `itemUse`-Extraktor/Card-Section (Blast, aktive Effekte) | `src/core/flows/specs/items.ts`, `src/foundry/itemuse.ts` | ✅ erledigt (2026-07-19) |
| M5.4 | No-Roll-Pfad: `SR5_CastItemAction`-Hook → Modul-Karte mit Ziel-/Selbst-Branches und Pending-Effekten (Drogen/Toxine); System-Beschreibungskarte bleibt | `src/foundry/itemuse.ts` | ✅ erledigt (2026-07-19) |
| M5.5 | `applyEffects`-Handler (Kind `effect`): Kopien via `createEmbeddedDocuments` mit `appliedByTest`, Selbstanwendung aktiviert deaktivierte `actor`-Effekte als Kopie; Socket-Action `pendingEffects` (revisionstolerant, Author/GM/Branch-Owner) | `src/foundry/actions.ts`, `src/foundry/security.ts`, `src/main.ts` | ✅ erledigt (2026-07-19) |
| M5.6 | Blast-Anzeige im Kampf-Flow, Effekt-Zeilen/Buttons auf der generischen Karte, i18n de+en, Unit-Tests (effects-flow/effects-wrap/item-use + Erweiterungen) | `src/foundry/card.ts`, `src/foundry/combat.ts`, `lang/*`, `tests/` | ✅ erledigt (2026-07-19) |

Abweichungen/Notizen: `deferEffects` aus → reines Systemverhalten (keine Anzeige-Zeile);
Effekt-Anwendung erweitert die Leitplanke 3 (Mutation nur per Bestätigungs-Button) auf
ActiveEffects; dynamische Change-Werte werden beim Deferral aufgelöst gesnapshottet, bei
No-Roll-Items/oversized erst beim Anwenden roh vom Item gelesen.

## Querschnitt (gilt für jeden Milestone)

- **i18n**: alle neuen Strings de+en (`SDF.*`); Katalog-Labels referenzieren `SR5.*` wo vorhanden.
- **Doku-Pflege**: FLOWS.md-Status, TESTING.md-Checklisten, ARCHITECTURE.md, dieser Plan
  (Status-Spalten abhaken), README, CHANGELOG.
- **Kompatibilität**: v1-Karten funktionieren weiter (Action-Aliase), Socket-Protokollversion
  mit Mixed-Version-Guard, lazy Schema-Migration.
- **Releases**: v1.4.1 (Hotfix) → v2.0 (M0+M1) → v2.1 (Magie) → v2.2 (Matrix) → v2.3 (Rest) → v2.4 (Items & Effekte).
  Pro Release: implementieren → `npm run validate` → committen → pushen → deployen →
  Maintainer benachrichtigen mit TESTING.md-Checkliste.

## Verifikation

- Lokal pro Änderung: `npm run validate`. Der pure Core (Engine, Reducer, Economy, Migration)
  bekommt volle Unit-Abdeckung; Fixtures = `test.data`-JSON-Snapshots echter Systemtests
  (in `tests/fixtures/` sammeln, aus Live-Sessions des Maintainers).
- In-Foundry-Tests macht der Maintainer selbst — pro Milestone liefert
  [TESTING.md](TESTING.md) die Checkliste.

## Risiken

| Risiko | Mitigation |
|---|---|
| Abhängigkeit von gebündelten System-Interna (0.36.x: Klassennamen, `pool.changes`, `previousMessageId`) | Runtime-Capability-Checks ab M0; FlowSpec-weise Deaktivierung statt Totalausfall |
| `consumeWeaponAmmo`-Wrap (M1.2) und TestDialog-Injektion (M1.6) fragil | beide mit Display-only-Fallback; try/catch-Guards |
| Overwatch/Marken/Geistererschaffung mutiert das System selbst | Modul dort nur Anzeige; als Abweichung dokumentiert |
| Binden/Verbannen-Testklassen, Heil-API unverifiziert | bei M2-/M4-Start gegen `game.shadowrun5e.tests` / `SR5Actor` prüfen |
| Edge-Re-Roll invalidiert nachgelagerte Stages | eigene Engine-Funktion `reroll()` mit Invalidation-Events, ausführliche Unit-Tests |
| `afterSuccess`/`afterFailure` bekommen künftig mehr Logik → MIXED-Skip verlöre sie | Skip nur bei erfolgreichem Defer; try/catch → `wrapped()`; in 0.36.x verifiziert single-purpose |
| Mixed-Version-Tische (Modul alt/neu) | Socket-Protokollversion, Guard verweigert + benachrichtigt |
