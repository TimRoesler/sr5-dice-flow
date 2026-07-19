# TESTING.md — Manuelle Test-Checklisten

Automatisierte Tests (`npm run validate`) decken den puren Core ab. Alles Foundry-seitige
testet der Maintainer manuell im laufenden Foundry. **Pro Release die passende Checkliste
abarbeiten.** Agents: nach jedem Push die relevante Checkliste in der Benachrichtigung nennen;
neue Features hier mit Checkliste eintragen.

Setup-Voraussetzungen: Welt mit System `shadowrun5e` ≥ 0.36.1.1, Module `sr5-dice-flow`,
`sr5-chummer`, `lib-wrapper` aktiv; ein Spieler-Client + ein GM-Client (Socket-Pfade!);
mindestens zwei Test-Charaktere mit Fernkampfwaffe (SM/AM-fähig), Nahkampfwaffe, Zauberer
mit Kampfzauber, Decker mit Cyberdeck.

## Hotfix v1.4.1 (M0.2)

- [ ] Kampfzauber wirken (SpellCastingTest) → Entzugswurf erscheint im Chat (wird **nicht**
      mehr verschluckt), Konsole ohne `SDF.Error.MissingTarget`
- [ ] Technomancer: Komplexe Form weben → Schwundwurf erscheint
- [ ] Regression: normaler Angriff → Verteidigung → Soak → Schaden anwenden funktioniert wie in v1.4.0
- [ ] Verteidigungswurf eines Ziels wird weiterhin in die Karte eingefangen (keine doppelte Systemnachricht)

## v2.0 — Engine + Kampf (M0 + M1)

### Paritäts-Regression (nach M0.8)

- [ ] Angriff auf 1 Ziel: Karte entsteht, Verteidigen-Button, Soak, Schaden anwenden
- [ ] Angriff auf 2 Ziele gleichzeitig: getrennte Branches, unabhängige Stages
- [ ] Ziel nachträglich hinzufügen (add-target mit anvisierten Tokens)
- [ ] Spieler (Nicht-Autor) verteidigt → Socket-Weg über GM, Karte aktualisiert live
- [ ] Einen Spieler-Client absichtlich auf altem Modulstand lassen → Mutation wird mit
      Mixed-Version-Hinweis abgelehnt; nach Reload aller Clients funktioniert sie
- [ ] Blind-/GM-Roll: keine Pool-/Hit-Details für Spieler sichtbar
- [ ] Alte v1-Karte aus vorheriger Session öffnen → Migration, Buttons funktionieren
- [ ] Browser-Konsole/DOM: neue Flow-Karten nutzen `run-stage`/`confirm`; alte Karten mit
      `defend`/`resist`/`apply-damage` bleiben klickbar

### Fernkampf (M1.1/M1.2)

- [ ] EM-Schuss: Karte zeigt Feuermodus, Reichweiten-/Umgebungsmodifikatoren gruppiert
- [ ] SM-Salve: Verteidigungsmodifikator (−2) sichtbar beim Ziel
- [ ] AM: −9 bzw. reduzierter Mod bei knapper Munition
- [ ] Munition: Karte zeigt „X → Y", Waffe **unverändert** bis Bestätigen-Klick; nach Klick dekrementiert
- [ ] Mehrzielangriff erzeugt genau einen Munitions-Button auf dem Self-Branch; Doppelklick verbraucht nicht doppelt
- [ ] `deferAmmo` aus: Munition wird sofort verbraucht (Systemverhalten), Karte zeigt nur an
- [ ] Progressiver Rückstoß steigt über zwei Angriffe in derselben Runde (auch bei aufgeschobener Munition!)
- [ ] Nachladen (Systemweg) setzt Munition korrekt, Karte des nächsten Angriffs stimmt

### Verteidigung/Sperrfeuer (M1.3/M1.4)

- [ ] Fernkampf/Wurf: nur Buttons „Normale Abwehr" + „Volle Abwehr" pro Ziel
- [ ] Nahkampf: zusätzlich „Ausweichen/Abblocken/Parieren" (nur bei `MeleeAttackTest`)
- [ ] Klick auf einen Modus-Button öffnet den vorbefüllten Systemdialog (Aktive Abwehr vorgewählt)
- [ ] Volle Abwehr: „−10 Initiative anwenden"-Button erscheint am Ziel und ändert die Initiative erst nach Klick (Doppelklick verbraucht nicht doppelt)
- [ ] Ausweichen/Block/Parade: „−5 Initiative anwenden"-Button erscheint
- [ ] Normale Abwehr: kein Initiative-Button
- [ ] Deckungs-Dropdown (Keine/+2/+4) fließt vorbefüllt in den Verteidigungspool
- [ ] Kein aktiver Kampf: Initiative-Button warnt statt zu crashen
- [ ] Sperrfeuer-Angriff (Feuermodus Sperrfeuer) erzeugt eigene Karte; Verteidigung würfelt `SuppressionDefenseTest` (Reaktion + Edge), nicht die normale Verteidigung
- [ ] Sperrfeuer-Verteidigung bietet nur Normal/Volle Abwehr + Deckung (Fernkampf), inkl. Ini-Button bei Voller Abwehr
- [ ] Misslungene Sperrfeuer-Abwehr → Soak-Schritt (`PhysicalResistTest`) mit vollem eingehendem Schaden; erfolgreiche Abwehr → abgeschlossen, kein Schaden
- [ ] Munitions-Bestätigung (viele Schüsse) erscheint auch beim Sperrfeuer auf dem Self-Branch

### Mehrfachangriffe (M1.5)

- [ ] Angriff auf 2+ Ziele zeigt Warnbox „Mehrfachangriff" mit Pool-Split-Hinweis (GRW S. 196) und Rückstoß-Hinweis
- [ ] Vorgeschlagener gleichmäßiger Split (~Pool/Zielzahl) wird angezeigt; nichts wird erzwungen
- [ ] Angriff auf genau 1 Ziel zeigt **keine** Warnbox
- [ ] Sperrfeuer auf mehrere Ziele zeigt **keine** Pool-Split-Warnbox (Flächenwirkung, kein Split)

### Nahkampf/Wurf/Called Shots (M1.1/M1.6)

- [ ] Nahkampf: Reichweiten-Modifikator sichtbar
- [ ] Wurfwaffe: kompletter Flow
- [ ] Angriffs-Testdialog (Fern-/Nah-/Wurf) zeigt oben einen Called-Shot-Select mit Optionen aus dem Katalog
- [ ] Auswahl eines Called Shots reduziert den angezeigten Würfelpool um 4 (Modifikator „Gezielter Schuss −4"); zurück auf „Kein gezielter Schuss" entfernt ihn
- [ ] Nach dem Wurf zeigt die Karte den Modifikator −4 und in der Kampfsektion die gewählte Called-Shot-Art
- [ ] Called-Shot-Fallback: author/GM-Button „Gezielten Schuss ansagen" setzt/entfernt die Badge „Gezielter Schuss angesagt" (auch für Spieler-Karten via Socket)

### Aktionsökonomie (M1.7)

- [ ] Kampf starten: Tracker-Block je Combatant sichtbar (Frei/Einfach×2/Komplex)
- [ ] Komplexe Handlung (Angriff) verbraucht Budget, Badge auf Karte
- [ ] Zwei Einfache Handlungen im selben Durchgang okay, dritte → gelbe Warnung (kein Block)
- [ ] Volle Abwehr/aktive Abwehr mit Ini-Kosten wird beim Verteidiger als Unterbrechung gezählt (Tracker „U+1")
- [ ] Budget-Reset bei neuem Initiativedurchgang und neuer Kampfrunde
- [ ] Spieler-Client: Budget-Änderungen laufen GM-authoritativ (kein Permission-Fehler)

## v2.1 — Magie (M2)

- [ ] Indirekter Kampfzauber auf 2 Ziele: Verteidigung je Ziel → Soak → self-Branch Entzug; „Entzug anwenden"-Button (nicht automatisch)
- [ ] Direkter Kampfzauber: Verteidigung, **kein** Soak-Schritt, Schaden + „Schaden anwenden"-Button; Entzug separat
- [ ] Zauber-Karte zeigt Kategorie/Kraftstufe/Entzugswert (Spell-Origin-Sektion)
- [ ] Manipulations-/Illusions-/Wahrnehmungszauber: opposed Flow (Nettoerfolge) + Entzug, kein Schaden
- [ ] Selbst-/Berührungszauber ohne Ziel: nur self-Branch Entzug
- [ ] Geist herbeirufen: „Geist würfeln (SL)"-Button (nur SL) würfelt die Gegenprobe auf derselben Karte (Geist wird systemseitig erstellt), Dienste = Nettoerfolge werden angezeigt
- [ ] Danach „Entzug würfeln"-Button (Beschwörer) → Entzug auf der Karte, „Entzug anwenden" separat (nie automatisch)
- [ ] ⚠ Fragil (bitte genau prüfen): Marker-Routing des Geist-Wurfs auf den self-Branch; Entzug-Auslösung via `executeFollowUpTest`; keine doppelte Systemnachricht
- [ ] Geist verbannen / binden: läuft über generischen opposed-Flow (Verteidigung des Geistes je Ziel)
- [ ] Zauberabwehr: advisorische Zeile auf der Verteidigung sichtbar
- [ ] Ritual: „Ritual würfeln (SL)"-Button würfelt die Ritualprobe (2×Kraftstufe) auf der Karte → Nettoerfolge → „Entzug würfeln" → „Entzug anwenden"; ⚠ Marker-Routing/Source-Actor prüfen
- [ ] Entzug wird nie automatisch angewendet

## v2.2 — Matrix (M3)

- [ ] Brute Force gegen Persona: Verteidigung auf der Karte → Marken werden **automatisch vom System** platziert; die Karte zeigt „Platzierte Marken: N" (kein eigener Button)
- [ ] Eiliges Hacken analog (Marken-Anzeige)
- [ ] Datenspike: Verteidigung → Matrix-Widerstand → „Matrixschaden anwenden"-Button (Typ matrix, nur nach Bestätigung)
- [ ] Overwatch-Probe: aktueller Overwatch-Wert wird auf der Karte angezeigt (Erhöhung macht das System)
- [ ] Ziel = Gerät/Host (kein Actor): Branch funktioniert, Karte benennt das Ziel korrekt
- [ ] Komplexe Form: optionale Verteidigung + self-Branch **Überhitzung** (auto gewürfelt) → „Überhitzung anwenden"-Button (nie automatisch)
- [ ] Sprite kompilieren: „Sprite würfeln (SL)"-Button → Dienste → „Überhitzung würfeln" → „Überhitzung anwenden"; ⚠ Marker-Routing/Fade-Trigger prüfen (fragil, wie Beschwören)
- [ ] Volle Matrixabwehr als Interrupt im Ökonomie-Tracker
- [ ] ⚠ Bekannte Lücke: Biofeedback-Folge (Heiß-Sim) ist noch nicht als eigene Stufe integriert; läuft nativ als Systemnachricht

## v2.4 — Items & Effekte (M5)

Voraussetzung: Setting **„Item-Effekte aufschieben"** aktiv (Standard); Test-Items mit
ActiveEffects `applyTo: Zielakteur` (z. B. Flashbang-Granate) bzw. deaktivierten
`applyTo: Akteur`-Effekten (z. B. Kampfdroge).

- [ ] **Granate/Wurfwaffe auf 2 Ziele**: Wurfangriff mit Zieleffekten auf zwei markierte Ziele;
      Kampf-Card zeigt Blast (Radius/Dropoff). Ziel A verteidigt erfolgreich → keine Effekte,
      kein Button. Ziel B scheitert → „Ausstehende Effekte: …" + Button „Effekte anwenden";
      Klick erzeugt die ActiveEffects auf Ziel B (Actor-Sheet prüfen), Karte zeigt
      „Effekte angewendet", Button verschwindet, zweiter Klick unmöglich.
- [ ] **Unopposed Item-Probe** (Item mit Zieleffekten, Aktion ohne Gegenprobe, Ziel markiert):
      `item-use`-Karte mit Item-Section; Effekte ausstehend → Button → angewendet.
- [ ] **Item ohne Wurf** (Droge, nur Beschreibung): Item-Karte des Systems erscheint normal,
      zusätzlich Modul-Karte mit Selbst-Branch; „Effekte auf sich anwenden" erzeugt aktivierte
      Kopien auf dem eigenen Actor; bereits aktive Effekte nur als Hinweis.
- [ ] **Medkit/Erste Hilfe mit Zieleffekten**: läuft weiter über den `heal`-Flow; Effekt-Button
      erscheint zusätzlich (globale Confirmation), Heilung + Effekte unabhängig bestätigbar.
- [ ] **Fremdes Ziel als Spieler**: Spieler ohne Ownership sieht den Button, Anwendung verweigert
      mit Hinweis; GM oder Besitzer kann anwenden.
- [ ] **Setting aus**: Systemverhalten unverändert (Effekte sofort angewendet, System-Chat-Karte
      der Effekte erscheint), kein Modul-Button.
- [ ] **Reload**: ausstehende Effekte überleben F5 (stehen im Message-Flag) und bleiben anwendbar.

## v2.3.3 — Karten-UX und First Aid

- [ ] Generische Schwellenprobe: Erfolg erscheint grün/positiv, Fehlschlag nicht als Kampf-Treffer.
- [ ] Kampf, Magie und Matrix: Stage-Rail zeigt die richtige Reihenfolge sowie den aktiven und nächsten Schritt; übersprungene Stufen sind sichtbar.
- [ ] Actor-Mutationen (Schaden, Entzug, Schwund, Heilung) sind optisch abgesetzt und werden erst nach dem jeweiligen Confirm-Klick angewendet.
- [ ] First Aid: Heilmenge ist sichtbar; ohne Auswahl Körperlich/Betäubung darf „Heilung anwenden" keinen Schadensmonitor ändern.
- [ ] GM-Korrektur bleibt für GM sichtbar, ist aber gegenüber normalen Flow-Aktionen dezent gewichtet.

## v2.3 — Rest (M4)

- [ ] Fahrzeugprobe / Verfolgungsjagd: läuft über generischen Flow, Kontroll-Rig-Mods sichtbar
- [ ] Erste Hilfe: Probe zeigt Patienten-Branch, Monitor-Auswahl (Körperlich/Geistig) und „Heilung anwenden"-Button; heilt nur Nettoerfolge über Schwelle 2 nach Klick (Owner/SL)
- [ ] Medizin / Biotechnologie: bleiben generische Proben; bieten keinen Button zum direkten Entfernen von Schadenskästchen
- [ ] Ausgedehnte Probe: Karte zeigt kumulative Erfolge / Schwelle + Fortschrittsbalken; „Schwelle erreicht" bei Abschluss (jede Iteration eigene Karte mit laufendem Stand)
- [ ] Einfache Probe (Wahrnehmung/Sozial/Wissen) mit Schwelle: Erfolg/Misserfolg-Verdikt auf der Karte
- [ ] Edge (Grenzen überschreiten / Zweiter Versuch): „Edge eingesetzt"-Zeile auf der Karte (Anzeige; Re-Roll macht das System testintern)
- [ ] Soziale opposed Probe (Überreden vs. Willenskraft) über generischen Flow (Nettoerfolge)
- [ ] ➖ Nicht integriert (bewusst nativ): Teamwork nutzt die System-eigene Teamwork-UI
