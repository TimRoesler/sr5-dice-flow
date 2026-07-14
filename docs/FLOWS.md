# FLOWS.md — Aktionskatalog SR5-Grundregelwerk

Katalog aller Spieler-Aktionen aus dem SR5-GRW (deutsche Ausgabe), gruppiert nach Milestone.
Seitenangaben = gedruckte Seiten des deutschen GRW (PDF unter
`data/Data/assets/_pdfs/Shadow_rules/Shadowrun_5D_-_Grundregelwerk.pdf`; PDF-Seite ≈ gedruckte Seite +1).

**Status:** ✅ implementiert · 🔶 teilweise · ⬜ geplant · 👁 nur Anzeige (System mutiert selbst) · ➖ kein Würfelflow (nur Aktionsökonomie-Katalog)

Handlungstypen: **F** Frei · **E** Einfach · **K** Komplex · **U** Unterbrechung · **V** variabel

## Basisproben (Fallback-FlowSpecs `generic-simple` / `generic-opposed`, ab M0)

| Probe | GRW S. | Abdeckung | Status |
|---|---|---|---|
| Erfolgsprobe (einfach, mit Schwellenwert) | 49 | `generic-simple` + Schwellen-Verdikt | ✅ v2.3 |
| Vergleichende Probe | 50 | `generic-opposed` | ✅ Basisflow ab M0; Katalogtitel M4 |
| Ausgedehnte Probe | 50 | `extended`-FlowSpec + Fortschritts-Card | ✅ v2.3 |
| Teamworkprobe | 51 (Kampf: 190) | System-eigene Teamwork-UI (nativ) | ➖ nativ |
| Erfolge kaufen | 47 | Anzeige-Hinweis auf Karte | ⬜ M4 |
| Zweiter Versuch / Patzer ausbügeln (Edge) | 51/48 | Edge-Anzeige (Reroll systemintern) | ✅ v2.3 (Anzeige) |
| Attributsproben (Erinnern, Heben/Tragen, Menschenkenntnis, Selbstbeherrschung) | 152–153 | `AttributeOnlyTest` → `generic-simple` | 🔶 Basisflow M0; Katalog M4 |
| Wahrnehmung / Genau beobachten | 169–170 | `generic-*` + Katalog | 🔶 Basisflow M0; Katalog M4 |
| Soziale Proben (Überreden, Einschüchtern, Verhandeln …) | 152 ff. | `generic-opposed` + Katalog-Titel | 🔶 Basisflow M0; Titel M4 |

## Milestone 1 — Kampf (GRW Kap. „Kampf", S. 158–205)

### Würfelflows

| Aktion | Typ | GRW S. | System | Status |
|---|---|---|---|---|
| Fernkampfangriff EM/HM (Waffe abfeuern) | E | 167, 178 ff. | `RangedAttackTest` → `PhysicalDefenseTest` → `PhysicalResistTest` | ✅ v2.0 (Details, Ammo-Confirm, Verteidigungsoptionen) |
| Lange/Halbautomatische Salve (SM/LS) | K | 168, 179 | Feuermodus-Extraktion, `FireModeRules` | ✅ v2.0 |
| Vollautomatisch (AM) | K | 168, 179 | Feuermodus-Extraktion | ✅ v2.0 |
| Sperrfeuer | K | 179 ff. | FlowSpec `suppression` (`SuppressionDefenseTest`) | ✅ v2.0 |
| Nahkampfangriff | K | 168, 184 ff. | `MeleeAttackTest` (+ `data.reach`) | ✅ v2-Grundflow + Reach-Anzeige |
| Wurfangriff (Werfen) | E | 168, 181 ff. | `ThrownAttackTest` | ✅ v2-Grundflow |
| Pfeil abschießen | E | 167 | `RangedAttackTest` (Bogen) | ✅ v2-Grundflow |
| Mehrfachangriffe | F | 166, 196 | Advisory Pool-Split-Warnbox | ✅ v2.0 |
| Gezielte Schüsse (Called Shots) | — | 195 | **Modul-Eigenleistung** (Dialog-Injektion −4 + Fallback-Toggle) | ✅ v2.0 |
| Verteidigung: Normal / Ausweichen / Blocken / Parieren / Volle Abwehr | U | 165, 172, 189 ff. | Buttons pro Ziel, `data.activeDefense`, Ini-Kosten-Confirm | ✅ v2.0 |
| Abfangen | U | 165, 194 | Aktionsökonomie-Katalog (Interrupt) | 🔶 v2.0 (Ökonomie) |
| In Deckung gehen / Volle Deckung | E/U | 167, 190 | `data.cover` Pre-Seeding (Deckungs-Select) | ✅ v2.0 |
| Schadenswiderstand (Soak) | — | 169 ff. | `PhysicalResistTest` | ✅ v2-FlowSpec |
| Schaden anwenden (Bestätigungs-Button) | — | 169 ff. | `actor.addDamage` | ✅ v2-Confirm |
| Munitionsverbrauch bestätigen | — | 178 | libWrapper auf `consumeWeaponAmmo` | ✅ M1.2 |
| Initiative-Kosten von Unterbrechungen anwenden | — | 162 | `actor.changeCombatInitiative`, Confirm-Button | ✅ v2.0 |

### Aktionsökonomie-Katalog (M1.7, GRW S. 163–169; Handlungstabelle S. 165)

Nur Katalog + Budget-Tracking, kein Würfelflow (➖), sofern oben nicht gelistet:

- **Frei (F):** Gegenstand fallen lassen · Gestikulieren · Laufen · Mehrfachangriffe (Ansage) ·
  Modus eines verlinkten Geräts ändern · Satz sprechen/übermitteln · Sich hinwerfen ·
  Smartgunladestreifen auswerfen · Ziel ansagen
- **Einfach (E):** Aufstehen · Fokus aktivieren · Gegenstand aufheben/ablegen · Gegenstand
  benutzen · Geist aktivieren · Geist befehligen · Geist entlassen · Genau beobachten ·
  Gerätemodus ändern · In Deckung gehen · Ladestreifen einschieben/herausnehmen ·
  Pfeil abschießen · Schnellzaubern · Schnellziehen · Waffe abfeuern (EM/HM/SM/AM) ·
  Waffe bereitmachen · Wahrnehmung verlagern · Werfen · Zielen
- **Komplex (K):** Astrale Projektion · Fertigkeit einsetzen · Geist herbeirufen · Geist
  verbannen · In ein geriggtes Fahrzeug springen · Waffe nachladen (Lademethoden-Tabelle
  S. 165: Schnelllader/intern/Gurt/… teils E, meist K) · Lange/Halbautomatische Salve ·
  Vollautomatischer Modus · Montierte oder Fahrzeugwaffe abfeuern · Nahkampfangriff ·
  Sprinten · Zauber wirken
- **Unterbrechung (U):** Abfangen · Ausweichen · Blocken · Parieren · Volle Abwehr ·
  Volle Deckung (Ini-Kosten laut GRW S. 169 ff.; bei M1.7 gegen `ActiveDefenseRules`
  des Systems abgleichen: Ausweichen/Block/Parade −5, Volle Abwehr −10)

## Milestone 2 — Magie (GRW Kap. „Magie", S. 276–323)

| Aktion | Typ | GRW S. | System | Status |
|---|---|---|---|---|
| Zauber wirken (Kampfzauber) | K | 281 ff. | FlowSpec `spellcasting` (Soak nur bei indirekt) → self:Drain | ✅ v2.1 |
| Zauber wirken (Wahrnehmung/Gesundheit/Illusion/Manipulation) | K | 284–294 | FlowSpec `spellcasting` (opposed/simple) + Drain | ✅ v2.1 |
| Schnellzaubern | E | 167, 281 | wie Zauber wirken (`SpellCastingTest`) | ✅ v2.1 |
| Entzugswiderstand (Drain) | — | 282 | `DrainTest` (self-Branch); `apply-drain`-Confirm | ✅ v2.1 (Hotfix v1.4.1) |
| Zauberabwehr (Antimagie) | F | 294 | kein System-Flow → advisorische Pool-Zeile | ⬜ 👁 |
| Zauber bannen | K | 294 | `generic-opposed` (keine eigene Systemklasse) | ✅ v2.1 |
| Ritualzauberei | — | 294–298 | FlowSpec `ritual` (SL würfelt Ritualprobe) → Drain | ✅ v2.1 |
| Geist herbeirufen | K | 299 | FlowSpec `summoning` (SL würfelt Geist) → Dienste → Drain-Button | ✅ v2.1 |
| Geist binden | — | 300 | `generic-opposed` (keine eigene Systemklasse) | ✅ v2.1 |
| Geist verbannen | K | 300 | `generic-opposed` (keine eigene Systemklasse) | ✅ v2.1 |
| Geisterdienste | — | 301 | Anzeige (Dienste = Nettoerfolge) | 👁 |
| Alchemie (Aufbereitung) | — | 304 f. | opposed + Drain; Klasse verifizieren | ⬜ |
| Adeptenkräfte (aktivierbare: Adrenalinschub …) | V | 308 ff. | meist `generic-*` + Katalog | ⬜ |
| Astrale Wahrnehmung / Projektion | E/K | 312 f. | Katalog (➖) + `generic-*` für Askennen | ⬜ |
| Astralkampf | K | 314 | `combat-attack`-Form mit Astral-Pools | ⬜ |

## Milestone 3 — Matrix (GRW Kap. „Die Matrix", S. 212–255; Handlungen S. 234–241)

> Hinweis: ⬜-Handlungen unten haben **keinen dedizierten/getesteten Flow**; sofern sie
> systemseitig als `MatrixTest`/opposed laufen, greifen automatisch `matrix` bzw. `generic-*`
> als Fallback (Origin-Karte + Verteidigung), nur ohne spezifische Anzeige/Confirms.

| Aktion | Typ | GRW S. | Status | | Aktion | Typ | GRW S. | Status |
|---|---|---|---|---|---|---|---|---|
| Ausstöpseln | E | 234 | ⬜ | | Marke einladen | E | 238 | 👁 v2.2 (System platziert) |
| Befehl vortäuschen | K | 234 | ⬜ | | Marke löschen | K | 238 | ⬜ |
| Brute Force | K | 234 | ✅ v2.2 (`matrix`) | | Matrixsignatur löschen | K | 238 | ⬜ |
| Datei cracken | K | 235 | ⬜ | | Matrixsuche | V | 238 | ✅ v2.3 (`extended`) |
| Datei editieren | K | 235 | ⬜ | | Matrixwahrnehmung | K | 239 | ⬜ |
| Datenbombe entschärfen | K | 235 | ⬜ | | Nachricht übermitteln | E | 239 | ➖ |
| Datenbombe legen | K | 236 | ⬜ | | Overwatch-Wert bestimmen | E | 239 | ✅ v2.2 👁 |
| Datenspike | K | 236 | ✅ v2.2 (`matrix`) | | Programm abstürzen lassen | K | 239 | ⬜ |
| Eiliges Hacken | K | 236 | ✅ v2.2 (`matrix`) | | Signal stören | K | 239 | ⬜ |
| Gerät formatieren | K | 236 | ⬜ | | Übertragung abfangen | K | 241 | ⬜ |
| Gerät neu starten | K | 236 | ⬜ | | Verstecken | K | 241 | ⬜ |
| Gerät steuern | V | 237 | ⬜ | | Volle Matrixabwehr | U | 241 | 🔶 v2.2 (`MatrixDefenseTest`) |
| Gitterwechsel | K | 237 | ⬜ | | Icon aufspüren | K | 237 | ⬜ |
| Host betreten/verlassen | K | 237 | ⬜ | | Icon verändern | E | 237 | ➖ |
| In ein Gerät springen | K | 238 | ⬜ | | Interfacemodus wechseln | E | 237 | ➖ |

Technomancer (S. 249–255): Komplexe Form weben (`complex-form` → self:Fade) ✅ v2.2 ·
Schwundwiderstand (Fading, `apply-fade`-Confirm) ✅ v2.2 · Sprite kompilieren
(`sprite-compiling`, `CompileSpriteTest`/Opposed) ✅ v2.2 · Sprite befehligen/aktivieren (E) ➖

Querschnitt Matrix: Overwatch-Wert-Anzeige ✅ v2.2 (👁, `matrix.ow`) · Marken =
nur Anzeige ✅ v2.2 (System platziert automatisch, `setMarks`) · Matrixschaden ✅ v2.2
(`MatrixDefenseTest`/`MatrixResistTest`, `apply-damage` auf Matrix-Monitor); Biofeedback
noch nicht als eigene Stufe (läuft nativ) · Matrix-Ziele = Hosts/Geräte/IC (`Branch.documentUuid`).

## Milestone 4 — Rest

| Bereich | GRW S. | Abdeckung | Status |
|---|---|---|---|
| Fahrzeugproben, Fahrzeugkampf | 199–205 | über `generic-*` (Rig-Mods aus pool.changes) | ✅ v2.3 |
| Verfolgungsjagden | 203 f. | opposed + Advisory-Reichweitenband | ⬜ |
| Erste Hilfe | 205–208 | `heal`-FlowSpec: Nettoerfolge über Schwelle 2, Monitor-Auswahl, dann Confirm-Button | ✅ v2.3.2 |
| Medizin / Biotechnologie | 205–208 | kein direkter Heal-Flow (Medizin unterstützt nur Genesungsproben) | ➖ nativ |
| Natürliche Heilung | 207 | Recovery-Tests über generic/extended | ✅ v2.3 |
| Magische Heilung (Heilzauber) | 288 | über FlowSpec `spellcasting` abgedeckt | ✅ v2.1 |
| Ausgedehnte Proben (Karte mit Fortschritt) | 50 | `extended`-FlowSpec | ✅ v2.3 |
| Teamwork | 51 | System-eigene UI (nativ) | ➖ nativ |
| Edge-Aktionen (Push the Limit, Second Chance, Blitz, Seize the Initiative, Close Call, Dead Man's Trigger) | 58 f. | System testintern; Modul: Rendering + `reroll()`-Invalidation; `src/core/edge.ts` existiert | 🔶 |
| Abhängigkeits-/Entzugsproben (Drogen) | 416 f. | `generic-simple` + Katalog | ⬜ |
| Ausrüstung verbergen/bemerken | 421 f. | `generic-opposed` | ⬜ |

## Ausdrücklich außerhalb des Umfangs

- Regeln aus Erweiterungsbänden (Kreuzfeuer, Straßengrimoire, Data Trails, Rigger 5.0 …) —
  erst nach GRW-Vollabdeckung, separate Planung.
- Charaktererschaffung/-steigerung (Karma, Nuyen, Einkauf) — kein Aktions-Flow.
- Reproduktion von Regeltexten auf Karten (Lizenz; nur Werte/Verweise mit Seitenangabe).
