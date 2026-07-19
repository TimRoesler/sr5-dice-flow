# SR5 Dice Flow

Versionierte, mehrzielfähige Probentransaktionen mit Live-Chat-Karten für das
Shadowrun-5e-System in Foundry VTT. Das Modul fängt Würfelproben des Systems ab und
führt sie als revisionierte Transaktion durch komplette Regel-Flows.

## Funktionen

- Fängt SR5-Proben ab und führt sie durch den vollständigen Regel-Flow
  (Angriff → Verteidigung → Schadenswiderstand → Schaden anwenden)
- Mehrzielfähig: mehrere Ziele je Angriff in einer Transaktion
- Live-Chat-Karten mit Bestätigungs-Buttons; Aktor-/Weltdaten werden nie still verändert
- Deckt Nahkampf, Fernkampf, Magie und Matrix sowie weitere Kernregel-Aktionen ab
- Item-Nutzung mit Effekt-Anwendung: Zieleffekte von Items (Granaten, Toxine, Medkits, Drogen)
  landen als ausstehende Effekte auf der Karte und werden erst per Bestätigungs-Button auf
  Ziel- oder eigene Tokens angewendet — auch für Items ohne Würfelprobe

## Installation

Manifest-URL in Foundry unter *Add-on-Module → Modul installieren* eintragen:

```text
https://github.com/TimRoesler/sr5-dice-flow/releases/latest/download/module.json
```

Voraussetzungen: das System **Shadowrun 5th Edition** sowie die Module **sr5-chummer**
(ab 0.6.0) und **lib-wrapper**.

## Kompatibilität

| Komponente | Anforderung |
|---|---|
| Foundry VTT | v14 (verifiziert: 14.364) |
| Spielsystem | shadowrun5e |
| Modulversion | 2.4.0 |

## Entwicklung

```bash
npm ci             # Abhängigkeiten
npm run validate   # Typecheck + Tests + Build
npm run build      # Build nach dist/
```

## Herkunft & Credits

Entwickelt von TRO für den Eigenbetrieb.

## Lizenz & Markenhinweis

MIT-Lizenz, siehe [LICENSE](LICENSE). **Shadowrun** ist eine eingetragene Marke von
The Topps Company, Inc. Dieses nichtkommerzielle Fanprojekt steht in keiner Verbindung zu
The Topps Company, Inc. oder Catalyst Game Labs.
