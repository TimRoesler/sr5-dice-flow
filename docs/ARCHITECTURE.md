# Architektur

> **Stand:** Die **FlowSpec-Engine v2 ist seit v2.0.0 ausgeliefert und der aktuelle Ist-Zustand.**
> Milestones M0–M4 sind abgeschlossen (v2.0 Kampf, v2.1 Magie, v2.2 Matrix, v2.3 Rest). Der
> Abschnitt „Ziel-Architektur v2" beschreibt die **nun umgesetzte** Architektur; der Abschnitt
> „Ist-Architektur v1" ist **historisch** (Schema 1, v1.4.0). Eine Kurzübersicht aller
> ausgelieferten FlowSpecs steht unter [§Ausgelieferte FlowSpecs](#ausgelieferte-flowspecs-v20v23).

Zwei Teile: **Historie v1** (Schema 1, v1.4.0) und **aktuelle Architektur v2**
(FlowSpec-Engine — siehe [DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md)).

## Grundprinzip (v1 und v2)

Das Modul würfelt **nie selbst**. Es wrappt `game.shadowrun5e.tests.SuccessTest.prototype.toMessage`
(libWrapper, `WRAPPER`) und fängt so jeden Wurf ab, den das System produziert. Folgewürfe
(Verteidigung, Widerstand, …) startet es über die **systemeigenen Testklassen** (inkl. deren
Dialoge) und fängt deren Ergebnis wieder ein. Der gesamte Zustand eines Flows lebt als
**Transaktion** in den Flags einer einzigen ChatMessage, deren Karte bei jeder Revision
in-place neu gerendert wird. Schreibzugriffe sind **GM-authoritativ**: Nicht-Autoren senden
Mutationen über den SocketBus an den aktiven GM, der validiert und persistiert.
Optimistische Nebenläufigkeit über `revision` + `RevisionConflict`.

## Ist-Architektur v1 (Schema 1)

### Schichten

```
src/core/        pur, kein Foundry-Import → vollständig unit-testbar
src/foundry/     Foundry-/System-Adapter
src/api.ts       öffentliche Modul-API (game.modules.get('sr5-dice-flow').api)
src/main.ts      Bootstrap: Hooks, Settings, Socket-Handler, Wrapper-Installation
```

### src/core

| Datei | Inhalt |
|---|---|
| `transaction.ts` | Zustandsmaschine. `createTransaction`, `mutate` (Revision-Guard + Event-Log), `addTarget`, `setDefense`, `setResistance`, `setDamageApplied`, `invalidateEvent`, `migrate`. Stages pro Ziel: `created → defending → defended → resisting → complete`. |
| `modifiers.ts` | `ModifierRegistry` (register/resolve, Priorität, Dedupe per `fingerprint`), `activeEffectsProvider`. |
| `chummer.ts` | Modifier-Provider für SR5-Gear (Reflexrekorder, Smartlink, …): Namens-/Typ-/Quellen-Match, wireless/equipped-Bedingungen, Warnungen bei Ambiguität. |
| `damage.ts` | `calculateDamage({base, netHits, ap, armor, soakHits})` → modified/effectiveArmor/final. |
| `edge.ts` | `EDGE_USES`, `allowedEdgeUses(context)`, `spendEdge(actor, use)` (⚠ einzige Actor-Mutation im Core-Umfeld, button-getriggert). |

### src/types.ts (Schema 1)

- `Transaction {schemaVersion:1, id, revision, authorId, messageUuid?, origin: RollRecord, targets: Record<string,TargetBranch>, events: FlowEvent[], complete}`
- `TargetBranch {id, actorUuid, tokenUuid?, name, stage, defense?, resistance?, defenseData?, netHits?, baseDamage?, modifiedDamage?, soakHits?, finalDamage?, damageType?, damageApplied?}`
- `RollRecord` — alles über einen Wurf: Pool (base/value), hits/rawHits, limit, threshold, glitches, `defenseTest`/`resistanceTest` (Klassennamen aus `data.opposed`), Schaden, rollMode, sanitisiertes rollJson, `modifiers: Modifier[]`
- `Mutation` — Socket-Payload `{transactionId, expectedRevision, action, payload, requestId, userId}`

### src/foundry

| Datei | Inhalt |
|---|---|
| `integration.ts` | **Herzstück.** `installWrappers()` registriert den toMessage-Wrapper: ohne `previousMessageId` → Origin-Capture (`rollRecord`, `createTransaction`, `addSelectedTargets`, `attachTransaction`); mit → `captureFollowup` (Branch per `flowMarker.targetId` oder Actor-UUID suchen, `setDefense`/`setResistance`, redundante Systemnachricht löschen). `poolModifiers()` mappt `test.data.pool.changes` in Modifier-Zeilen. `shouldSuppressFollowupMessage` für den preCreate-Hook. `commitMutation` (direkt bei GM/Autor, sonst Socket). |
| `card.ts` | HTML-Renderer der Chat-Karte (String-Templates, escaped): Kopf, Pool-Formel, Metriken, Modifier-Aufklapper, Ziel-Sektionen mit Stage/Verdikt/Schaden, Action-Buttons, Event-Historie. Blind-/GM-Rolls → Platzhalter. |
| `store.ts` | `getTransaction` (Flag `sr5-dice-flow.transaction` + `migrate`), `saveTransaction`/`attachTransaction` (Karte re-rendern + Flag schreiben), `postCard`. |
| `security.ts` | `validateRequest` (Revision, Identität, GM-only-Aktionen, Ownership für defend/resist/edge/damageApplied), `isSecretRollMode`/`sanitizeRoll`. |
| `socket.ts` | `SocketBus` über Kanal `module.sr5-dice-flow`: request/response per `requestId`, GM validiert + führt Handler aus. |
| `actions.ts` | Klick-Dispatch `[data-sdf-action]`: `add-target`, `defend`, `resist`, `apply-damage`, Edge. Folgewürfe via `_getOpposedActionTestData`/`_getResistActionTestData` der Systemtests, getaggt mit `sr5DiceFlow`-Marker (`flowMarker`). Schaden via `actor.addDamage`. |

### Bekannte Schwachstelle v1 (→ Hotfix M0.2)

`captureFollowup` wirft `SDF.Error.MissingTarget`, wenn kein Ziel-Branch zum Würfelnden passt.
Bei **Drain/Fade** würfelt aber der Verursacher selbst (System-Followup mit
`previousMessageId`) → Exception; gleichzeitig blockt `shouldSuppressFollowupMessage` die
Systemnachricht, weil die Origin-Message eine Transaktion trägt. Ergebnis: der Wurf
verschwindet vollständig aus dem Chat.

## Ziel-Architektur v2 (FlowSpec-Engine)

Motivation: v1 kennt genau einen Flow (Angriff→Verteidigung→Widerstand). Für GRW-weite
Abdeckung (Magie, Matrix, extended, Teamwork, …) werden Flows **deklarativ** definiert und
von einer generischen Engine abgearbeitet.

### Schema v2 (`src/types.ts`, `SCHEMA_VERSION = 2`)

```ts
type BranchKind = 'target' | 'self';   // self = Verursacher-Branch: Drain, Fade, OS, Munition
interface Branch {
  id: string; kind: BranchKind;
  actorUuid: string; tokenUuid?: string; documentUuid?: string; // documentUuid: Matrix-Ziele (Host/Gerät/IC)
  name: string;
  stageId: string;                                  // aktuelle Stage laut FlowSpec
  rolls: Record<string, RollRecord>;                // key = stageId
  stageData: Record<string, unknown>;               // per-Stage System-Rohdaten (v1: defenseData)
  derived: Record<string, number|string|undefined>; // netHits, modifiedDamage, finalDamage, drainValue, …
  confirmations: Record<string, {at:number; by:string; payload:unknown}>; // damageApplied, ammoConfirmed, …
}
interface Transaction {
  schemaVersion: 2; flowId: string;                 // welche FlowSpec regiert
  origin: RollRecord;
  branches: Record<string, Branch>;
  economy?: {combatId?:string; combatantId?:string; actionType?:string; initiativeMod?:number};
  extended?: {iterations: RollRecord[]; totalHits: number; threshold?: number; complete: boolean};
  // id, revision, authorId, messageUuid, events, complete: unverändert aus v1
}
```

### FlowSpec (`src/core/flows/spec.ts`)

```ts
interface StageSpec {
  id: string;                                  // 'defense' | 'soak' | 'drain' | …
  branch: 'perTarget' | 'self';
  testClasses: string[];                       // Systemklassen, die die Stage erfüllen
  trigger: 'button' | 'systemFollowup' | 'systemOpposed';
  reduce: string;                              // benannter purer Reducer (src/core/reducers.ts)
  next: {onSuccess?: string; onFailure?: string; always?: string};  // Stage-IDs; terminal: 'done'
  confirm?: {id:string; kind:'damage'|'drain'|'ammo'|'marks'|'initiative'|'fade'|'heal'; when:string}[];
  defenseOptions?: boolean;   // rendert Aktive-Abwehr-Buttons + Deckungs-Select (M1.3)
  action?: string;           // dedizierter Card-Action-Name statt run-stage (z.B. conjure-opposed)
  gm?: boolean;              // Stage-Button nur für die Spielleitung sichtbar
}
interface FlowSpec {
  id: string;
  match: (origin: {testClass:string; data:any}) => boolean;  // Registry: erste Übereinstimmung gewinnt
  branches: 'targets' | 'single' | 'targets+self';
  initialStage: (branch: Branch) => string;
  stages: StageSpec[];
  originExtract?: string[];                    // benannte Extraktoren: fireMode, force, drain, marks, ammo
  cardSections?: string[];                     // benannte Karten-Sektionen (Feuermodus/Munition, Kraftstufe/Entzug, Marken/OS, extended-Fortschritt)
}
```

Reducer, Extraktoren und Karten-Sektionen sind **benannte Funktionen in Registries** —
die Transaktion bleibt reines JSON, der Core bleibt ohne Foundry testbar.
Foundry-abhängige Extraktoren leben in `src/foundry/extract.ts` und geben plain data zurück.

### Engine (`src/core/flows/engine.ts`, pur)

`advance(tx, branchId, stageId, roll, reduced) → Transaction` ersetzt `setDefense`/
`setResistance`: validiert Stage, schreibt Roll + derived-Werte, ermittelt Folge-Stage über
`next`, setzt `complete`, wenn alle Branches `done` sind. (Das ursprünglich für M4 geplante
`reroll(tx, …)` für Edge wurde **nicht umgesetzt** — siehe Hinweis unten; Edge wird nur angezeigt.)

Implementiert seit M0.4: `advance` arbeitet unveränderlich, prüft Flow, Stage, Branch-Art und
Doppelauflösung, übernimmt `stageData`/`derived`, erhöht Revision und Event-Historie und setzt
den Gesamtabschluss erst bei ausschließlich terminalen Branches. `ReducerRegistry` enthält
die benannten puren Basis-Reducer `merge`, `opposedHits` und `soakDamage`; weitere Flow-Reducer
werden bei ihren jeweiligen Specs registriert. **`reroll()` für Edge wurde bewusst nicht
gebaut** (riskantester M4-Teil; das System handhabt Second-Chance/Push-the-Limit ohnehin
testintern — das Modul zeigt Edge-Einsatz nur an). Die `ExtractorRegistry` stellt dasselbe
Namens-/Lifecycle-Modell für die ab M0.5 angebundenen Foundry-Extraktoren bereit. Die `FlowRegistry` behält die
Registrierungsreihenfolge (spezifische Specs vor Fallbacks) und deaktiviert beim `init` nur
die Specs, denen System-Testklassen oder Reducer fehlen.

### Capture-Router (`src/foundry/integration.ts`, Rewrite in M0.5)

1. **Origin** (kein `previousMessageId`/`flowMarker`): FlowSpec-Registry matchen
   (`generic-opposed`/`generic-simple` als letzte Fallbacks) → Transaktion + Branches anlegen
   (targets aus `test.targets`/`targetUuids`, self-Branch laut Spec).
2. **Follow-up**: Transaktion laden → FlowSpec per `tx.flowId` → Stage finden, deren
   `testClasses` die eingehende Testklasse enthält **und** deren Branch passt
   (perTarget: Würfelnder = Ziel-Actor bzw. `flowMarker.targetId`; self: Würfelnder =
   Origin-Actor, Drain/Fade via `test.data.following`) → Reducer → `advance` → `commitMutation`.
3. **Nicht zuordenbar**: nie werfen, nie unterdrücken — Info-Event an die Transaktion,
   Systemnachricht bleibt stehen.
4. Suppression (`preCreateChatMessage`) nur, wenn der Router den Wurf erfolgreich in eine
   Stage eingefangen hat, die die Modul-Karte rendert.
5. Sicherheitsnetz: `Hooks.on('sr5_afterTestComplete')` für Tests ohne Message
   (`showMessage:false`), idempotent per Roll-ID.

Implementiert seit M0.5: Die pure Routing-Entscheidung liegt in `src/core/flows/router.ts`;
`integration.ts` übernimmt nur Foundry-Persistenz. Seit M0.8 laufen auch bestehende
Kampfwürfe ausschließlich über den Router; der hartkodierte Capture-Pfad ist entfernt. `src/foundry/extract.ts`
erzeugt stabile Roll-IDs, sanitisiert geheime Würfe, extrahiert System-Pooländerungen und
führt benannte Origin-Extraktoren aus. Marker haben bei der Branch-Zuordnung Vorrang;
ansonsten wird per Actor-UUID zwischen Ziel- und Self-Branch unterschieden. Nicht passende
Folgewürfe erzeugen genau ein `followup.unmatched`-Info-Event und ihre Systemnachricht bleibt
stehen. Wrapper und `sr5_afterTestComplete` verwenden denselben idempotenten Router.

### Capability-Checks

Beim `init`: alle in FlowSpecs referenzierten Testklassen gegen `game.shadowrun5e.tests`
prüfen. Fehlende Klasse → betroffene FlowSpec deaktivieren + `console.warn`. So degradiert
das Modul bei System-Updates flowweise statt total.

### Generische Karte und Aktionen (M0.6)

Für registrierte FlowSpecs rendert `foundry/card.ts` alle Target- und Self-Branches direkt
aus `stageId`, `rolls`, `derived`, Stage-Triggern und Bestätigungsdefinitionen. Benannte
`cardSections` werden über `CardSectionRegistry` ergänzt; fehlende optionale Sektionen
brechen die Karte nicht. Der alte Renderer bleibt ausschließlich für unbekannte oder noch
nicht migrierte Fremd-Flows als defensive Kompatibilitätsdarstellung vorhanden.

Manuelle Stages verwenden einheitlich `run-stage`; die Action löst ausschließlich die
aktuelle, im FlowSpec als `button` deklarierte Stage mit einer registrierten Systemklasse aus.
`confirm` akzeptiert nur im FlowSpec deklarierte Kombinationen aus ID und Art und dispatcht
über `ConfirmationActionRegistry`. Der erste Handler ist `damage`; weitere Handler für
Entzug, Munition, Marken und Initiative folgen in ihren Milestones. Die alten DOM-Aktionen
`defend`, `resist` und `apply-damage` werden weiterhin als Aliase verarbeitet.

### Socket-Protokoll v2 (M0.7)

Jedes Request-/Response-Paket trägt `protocolVersion: 2`. Antworten ohne passende Version
werden verworfen und der Benutzer erhält eine lokalisierte Aufforderung, alle Clients neu zu
laden; damit schreiben gemischte Modulversionen nicht still in dasselbe Transaktionsschema.
Für eine Übergangsperiode akzeptiert der aktive GM unversionierte/v1-Requests ausschließlich
für `addTarget`, `defend`, `resist` und `damageApplied`. Generische `advance`- und `confirm`-
Mutationen erfordern v2, Revision-Guard und Actor-Ownership. Der GM berechnet Reducer erneut
und prüft Confirmation-ID/-Art gegen den FlowSpec, statt Client-Ergebnisse zu übernehmen.
`setConfirmation` persistiert danach den einheitlichen Bestätigungsdatensatz und ein
`confirmation.applied`-Event.

### Core-FlowSpecs und Parität (M0.8)

Die Registry wird in dieser Reihenfolge aufgebaut: `combat-attack`, `generic-opposed`,
`generic-simple`. Dadurch gewinnen Fern-, Nah- und Wurfangriffe vor den Fallbacks; der
Simple-Flow matcht bewusst zuletzt. `combatDefense` übernimmt Nettoerfolge, Systemschaden,
Schadensart und die Entscheidung über Soak, `combatSoak` bevorzugt den vom System berechneten
Endschaden. Kein Treffer, kein Verteidigungstest oder kein nötiger Widerstand endet wie in v1
direkt in `done`. Generische opposed Stages referenzieren die Testklasse dynamisch über
`$origin.defenseTest`; solche Laufzeitreferenzen werden nicht als fehlende Capability gewertet.
Der alte `setDefense`/`setResistance`-Pfad bleibt nur als Socket-Kompatibilität für v1-Clients
eine Release-Periode erhalten, wird von neuen Captures aber nicht mehr verwendet.

### Kampf-Origin-Extraktion (M1.1)

`combat-attack` verwendet den benannten Extraktor und die Kartensektion `combatOrigin`.
Ein Wrapper auf `RangedAttackTest.execute` liest Munition und progressiven Rückstoß vor dem
Systemverbrauch; beim späteren `toMessage`-Capture werden die Nachher-Werte ergänzt.
Extrahiert werden außerdem Feuermodus (Label, Schüsse, Verteidigungsmodifikator), gesamte
Rückstoßkompensation, Target-Distanzen/-Reichweitenbänder, Nahkampf-Reach und gruppierte
`pool.changes` für Reichweite, Rückstoß, Wunden, Umgebung und sonstige Quellen. Die Karte
zeigt diese Daten bilingual in einer registrierten Sektion. M1.1 greift nicht in den
Ressourcenverbrauch ein: Munition wird bis zum Defer-Wrapper M1.2 weiterhin sofort durch das
System verbraucht.

### Aufgeschobener Munitionsverbrauch (M1.2)

Das World-Setting `deferAmmo` ist standardmäßig aktiv. Ein libWrapper-`MIXED` auf
`RangedAttackTest.consumeWeaponAmmo` überspringt ausschließlich `item.useAmmo()` und ruft
`actor.addProgressiveRecoil(fireMode)` weiterhin sofort auf. Der Extraktor legt den geplanten
Verbrauch als `ammoPending` auf einem einzelnen Self-Branch ab, sodass Mehrzielangriffe nur
einen Confirm-Button erzeugen. Der `ammo`-Confirmation-Handler prüft Actor-Ownership und
Waffen-UUID, führt `item.useAmmo(rounds)` erst nach Klick aus und speichert Vorher-/Nachherwert
in `ammoConfirmed`. Bei deaktiviertem Setting oder Wrapper-/Laufzeitfehler bleibt der
Systemverbrauch aktiv und die Karte degradiert auf reine Anzeige.

### Migration & Kompatibilität

- `migrate()` v1→v2 lazy in `store.getTransaction`: v1-`targets` → `target`-Branches
  (defense→`rolls.defense`, resistance→`rolls.soak`; Stage-Mapping created→'defense',
  defended→'soak', complete→'done'), `flowId:'combat-attack'`.
- Alte Karten-Action-Namen (`defend`, `resist`, `apply-damage`) bleiben als Aliase der
  generischen `run-stage`/`confirm`-Actions.
- Socket-Protokoll bekommt ein Versionsfeld; Mixed-Version-Guard verweigert mit Meldung.

## Ausgelieferte FlowSpecs (v2.0–v2.3)

Registrierungsreihenfolge (`src/core/flows/specs/index.ts`) — spezifische Specs vor Fallbacks;
`match` nimmt den ersten Treffer:

| FlowSpec | Datei | Match | Kernstages / Besonderheit | Release |
|---|---|---|---|---|
| `suppression` | `specs/combat.ts` | RangedAttackTest mit `fireMode.suppression` | teilt `combatStages`, Defense = `SuppressionDefenseTest` | v2.0 |
| `combat-attack` | `specs/combat.ts` | Melee/Ranged/Thrown (nicht Sperrfeuer) | defense (Aktive-Abwehr-Buttons, Ini-Confirm) → soak → done; self-Branch Munition | v2.0 |
| `spellcasting` | `specs/magic.ts` | SpellCastingTest | Ziel-defense (`spellDefense`, Soak nur indirekt) → soak; self:drain (auto) → `apply-drain` | v2.1 |
| `summoning` | `specs/magic.ts` | SummonSpiritTest | self: `conjure-opposed` (SL, Geist via Marker-Routing) → drain-Button | v2.1 |
| `ritual` | `specs/magic.ts` | RitualSpellcastingTest | self: `conjure-opposed` (2×Force) → drain-Button | v2.1 |
| `matrix` | `specs/matrix.ts` | MatrixTest / BruteForce / HackOnTheFly | defense (`matrixDefense`, `marksPlaced`) → soak (`MatrixResistTest`) → `apply-damage` | v2.2 |
| `complex-form` | `specs/matrix.ts` | ComplexFormTest | Ziel-defense (`opposedHits`); self:fade (auto) → `apply-fade` | v2.2 |
| `sprite-compiling` | `specs/matrix.ts` | CompileSpriteTest | self: `conjure-opposed` (Sprite) → fade-Button | v2.2 |
| `overwatch-check` | `specs/matrix.ts` | CheckOverwatchScoreTest | Anzeige OS (👁), keine Stages | v2.2 |
| `heal` | `specs/general.ts` | `action.skill` ∈ {first_aid, biotechnology, medicine} | Patienten-Branch(es), `apply-heal`-Confirm | v2.3 |
| `extended` | `specs/general.ts` | `data.extended===true` (nicht opposed) | Fortschritts-Card (kumulative Hits vs. Schwelle) | v2.3 |
| `generic-opposed` | `specs/generic.ts` | `data.opposed.test` vorhanden | Ziel-Stage `$origin.defenseTest`, `opposedHits` | v2.0 |
| `generic-simple` | `specs/generic.ts` | Catch-all | keine Stages; Schwellen-Verdikt auf der Karte (v2.3) | v2.0 |

**Reducer** (`reducers.ts` + Spec-Dateien): `merge`, `opposedHits`, `soakDamage`, `combatDefense`,
`combatSoak`, `suppressionDamage`, `spellDefense`, `drainResist`, `summonServices`, `matrixDefense`,
`fadeResist`. **Confirmation-Kinds:** `damage`, `ammo`, `drain`, `fade`, `heal`, `initiative`
(je Handler in `foundry/actions.ts`). **Card-Sections/Extraktoren:** `combatOrigin`, `spellOrigin`,
`matrixOrigin`, `overwatchOrigin`, `extendedProgress`.

**Weitere Foundry-Features:** Called-Shot-Dialog-Injektion (`foundry/calledshot.ts`,
`renderTestDialog`-Hook, −4 Pool-Change + Tag), Aktionsökonomie-Tracking (`foundry/economy.ts` +
`tracker-ui.ts`, Combatant-Flag `economy`, `renderCombatTracker`), Edge-Anzeige (RollRecord `edge`),
i18n-Regressionstest (`tests/i18n.test.ts`, verhindert Blatt/Zweig-Kollisionen wie den
`SDF.CalledShot`-Ladecrash).

**Bewusst nativ / nicht integriert:** Teamwork (System-eigene UI), Edge-`reroll()`,
BiofeedbackResistTest als eigene Stufe, Merge mehrerer Extended-Iterationen in eine Karte.

## System-API-Referenz (shadowrun5e 0.36.x)

Quellen extrahierbar aus `dist/bundle.js.map` (siehe AGENTS.md). Die für das Modul relevanten
Punkte:

- `game.shadowrun5e.tests` — Registry aller ~40 Testklassen (Klassenname → Klasse). Wichtig:
  `SuccessTest`, `OpposedTest`, `MeleeAttackTest`, `RangedAttackTest`, `ThrownAttackTest`,
  `PhysicalDefenseTest`, `SuppressionDefenseTest`, `PhysicalResistTest`, `SpellCastingTest`,
  `CombatSpellDefenseTest`, `DrainTest`, `FadeTest`, `ComplexFormTest`, `SummonSpiritTest`,
  `OpposedSummonSpiritTest`, `CompileSpriteTest`, Matrix-Suite (`BruteForceTest`,
  `HackOnTheFlyTest`, `OpposedMatrixTest`, `MatrixDefenseTest`, `MatrixResistTest`,
  `BiofeedbackResistTest`, `CheckOverwatchScoreTest`), Fahrzeug-/Recovery-Tests.
- `game.shadowrun5e.test` = `TestCreator`: `fromItem/fromAction/fromPool/fromPackAction/
  fromMessage/fromMessageAction/fromFollowupTest/fromOpposedTestResistTest`.
- Test-Lifecycle: `execute() → showDialog → evaluate → processResults → toMessage →
  afterTestComplete → executeFollowUpTest` (auto, wenn `autoExecuteFollowupTest` true).
- Follow-up-Verkettung: `data.previousMessageId` + `data.following`; Opposed-Buttons der
  Systemkarten laufen über `TestCreator.fromMessageAction(messageId, testClsName)`.
- `SR5Actor`: `rollSkill/rollAttribute/rollItem/rollGeneralAction/rollMatrixAction`,
  `addDamage(damageData)`, `getOverwatchScore/setOverwatchScore`, `setMarks/getMarksPlaced`,
  `addProgressiveRecoil/clearProgressiveRecoil`.
- `SR5Combat`/`SR5Combatant`: `pass`, `nextPass()`, `nextRound()`, `system.acted`,
  `attackedLastTurn`, `adjustInitiative`.
- System-Hooks: `sr5_beforePrepareTestDataWithAction`, `sr5_afterPrepareTestDataWithAction`,
  `sr5_testPrepareBaseValues`, `sr5_testProcessResults`, `sr5_afterTestComplete`,
  `sr5_afterDamageAppliedToActor`, `SR5_CastItemAction` (vetobar), `combatRound`, `combatTurn`.
- Compendium-Packs: `sr5e-general-actions`, `sr5e-matrix-actions`, `sr5e-ic-actions`.
- Action-Datenmodell an Items: `action.test/opposed.test/opposed.resist.test/followed.test`
  (datengetriebene Klassennamen), `action.type` (free/simple/complex/interrupt/varies),
  `action.initiative_mod`, `action.categories`.
