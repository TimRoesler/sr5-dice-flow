# AGENTS.md — Onboarding für AI-Agents

Dieses Dokument ist der Einstiegspunkt für jeden (AI-)Entwickler, der an `sr5-dice-flow` arbeitet.
**Lies zuerst dieses Dokument, dann `docs/DEVELOPMENT-PLAN.md`.**

## Was ist dieses Projekt?

Ein Foundry-VTT-Modul (Foundry v14) für das Spielsystem `shadowrun5e` (v0.36.x). Es fängt
Würfelproben des Systems ab und führt sie als **revisionierte Transaktionen mit Live-Chat-Karten**
durch komplette Regel-Flows (Angriff → Verteidigung → Schadenswiderstand → Schaden anwenden).
Ziel des laufenden Ausbaus: **alle** Spieler-Aktionen des SR5-Grundregelwerks (siehe `docs/FLOWS.md`).

## Arbeitsworkflow (verbindlich)

1. Implementieren im geklonten Repo (`/home/foundryvtt/sr5-dice-flow` auf dem Server)
2. `npm run validate` muss grün sein (Typecheck + Vitest + Build)
3. Committen und pushen (`main`)
4. Build nach `/home/foundryvtt/data/Data/modules/sr5-dice-flow/` deployen (dist/, lang/, styles/, module.json, docs/)
5. **Kein Self-Testing in Foundry** — der Maintainer testet selbst im laufenden Foundry.
   Nach dem Push Bescheid geben und die passende Checkliste aus `docs/TESTING.md` nennen.
6. Actor-/Welt-Daten werden vom Modul **nie still mutiert** — nur über explizite
   Bestätigungs-Buttons auf der Chat-Karte (Grundsatzentscheidung, siehe DEVELOPMENT-PLAN §Leitplanken).

## Build & Test

```bash
npm ci                 # einmalig
npm run typecheck      # tsc --noEmit
npm test               # vitest run (tests/)
npm run lint           # eslint, 0 Warnungen erlaubt
npm run validate       # alles zusammen + Build (scripts/build.mjs, esbuild)
```

Der Build bündelt `src/main.ts` nach `dist/sr5-dice-flow.js`. ZIP-Erstellung schlägt ohne
`zip`-Binary fehl — das ist okay, nur das Release-Artefakt fehlt dann.

## Code-Stil

Der Bestandscode ist **extrem dicht** (mehrere Statements pro Zeile, kaum Leerzeilen,
Kurzbezeichner in lokalem Scope, exportierte Namen sprechend). Neuer Code folgt diesem Stil.
Keine Kommentare außer für nicht offensichtliche Regel-/API-Constraints. Alle UI-Strings
über i18n (`lang/de.json` + `lang/en.json`, Schlüssel-Schema `SDF.*`) — niemals hartkodiert.

## Wichtige Pfade auf dem Server

| Pfad | Inhalt |
|---|---|
| `/home/foundryvtt/sr5-dice-flow` | dieses Repo (Quelle der Wahrheit) |
| `/home/foundryvtt/data/Data/modules/sr5-dice-flow` | installiertes Modul (nur Build-Output; wird überschrieben) |
| `/home/foundryvtt/data/Data/systems/shadowrun5e` | Spielsystem (nur `dist/`-Bundle) |
| `/home/foundryvtt/data/Data/systems/shadowrun5e/dist/bundle.js.map` | **enthält die kompletten TS-Quellen des Systems** in `sourcesContent` |
| `/home/foundryvtt/data/Data/assets/_pdfs/Shadow_rules/Shadowrun_5D_-_Grundregelwerk.pdf` | deutsches GRW (495 Seiten), Regelreferenz |

### System-Quellcode lesen

Das System liefert keinen Quellcode, aber die Sourcemap enthält alles. Extraktion:

```bash
node -e '
const m=require("/home/foundryvtt/data/Data/systems/shadowrun5e/dist/bundle.js.map");
const i=m.sources.findIndex(s=>s.includes("SuccessTest.ts"));
console.log(m.sourcesContent[i]);'
```

Wichtigste Systemdateien: `src/module/tests/SuccessTest.ts` (Test-Lifecycle, `toMessage`),
`tests/TestCreator.ts` (Factory, `fromFollowupTest`), `tests/RangedAttackTest.ts`
(`consumeWeaponAmmo`), `actor/SR5Actor.ts`, `item/SR5Item.ts`, `hooks.ts` (API-Registrierung),
`combat/SR5Combat.ts`. Details in `docs/ARCHITECTURE.md` §System-API.

### GRW-PDF lesen (Regeln nachschlagen)

`pypdf` per pip installieren (z. B. `pip install --target /tmp/pylibs pypdf`), dann:

```bash
PYTHONPATH=/tmp/pylibs python3 -c '
from pypdf import PdfReader
r=PdfReader("/home/foundryvtt/data/Data/assets/_pdfs/Shadow_rules/Shadowrun_5D_-_Grundregelwerk.pdf")
print(r.pages[164].extract_text())'   # 0-indexiert; GRW-Seite 165
```

Seitenreferenzen zu allen Aktionen stehen in `docs/FLOWS.md`.

## Dokumentation (Pflichtlektüre nach Aufgabe)

| Datei | Wann lesen |
|---|---|
| `docs/DEVELOPMENT-PLAN.md` | immer — Roadmap, Milestones, Arbeitspakete, Leitplanken |
| `docs/ARCHITECTURE.md` | vor jeder Code-Änderung — Ist-Architektur v1 + Ziel-Architektur v2 (FlowSpec-Engine) |
| `docs/FLOWS.md` | bei Arbeit an einem Regel-Flow — Aktionskatalog mit GRW-Seiten + Status |
| `docs/TESTING.md` | vor jedem Release — manuelle Checklisten für den Maintainer |

**Doku-Pflege ist Teil jeder Aufgabe:** Status in `docs/FLOWS.md` aktualisieren,
neue Flows in `docs/TESTING.md` mit Checkliste versehen, Architekturänderungen in
`docs/ARCHITECTURE.md` nachziehen, erledigte Arbeitspakete im DEVELOPMENT-PLAN abhaken.
