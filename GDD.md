# 🏴‍☠️ PIRATENQUEST — Game Design Document v1.0
## Herrscher der Sieben Meere

**Autor:** Andreas Sawall / Claude  
**Basis:** UltraQuest-Regelwerk (Flying Games), adaptiert auf Piratenwelt  
**Plattform:** Mobile Web App (React), 2-Spieler-Multiplayer  
**Ziel-Spielzeit:** 6–12 Stunden pro Partie (über mehrere Sessions)

---

## 1. SPIELÜBERSICHT

PiratenQuest ist ein Rollen-Brettspiel für 2 Spieler, bei dem jeder eine Crew von 4 Piraten durch die Karibik führt. Ziel: 100 Ehrensterne (⭐) sammeln ODER den legendären Schatz finden. Das Spiel wird rundenbasiert gespielt und kann jederzeit gespeichert und an einem anderen Tag fortgesetzt werden.

### 1.1 Währungen

| Symbol | Name | Funktion |
|--------|------|----------|
| ⭐ | **Ehre** (Sterne) | Siegpunkte. 100 = Sieg. Erhält man durch Ereignisse und Kämpfe. |
| 🏆 | **Ruhm** (Pokale) | Aufwertungswährung. Zum Trainieren von Stats und Erlernen von Fertigkeiten. |
| 💰 | **Gold** | Kaufwährung für Ausrüstung, Schiffe, Heilung, Rekrutierung. |
| 🍺 | **Rum** | Moral der Crew. Sinkt beim Rasten. Bei 0 = Moral-Mali. |

### 1.2 Siegbedingungen

- **Ehrensieg:** Erster Spieler mit 100 ⭐
- **Legendärer Sieg:** Fund des legendären Schatzes (nur im Piratenkönigsthron möglich, ~8% Chance pro Event dort)

---

## 2. CHARAKTERERSTELLUNG

### 2.1 Prinzip (wie UltraQuest)

Werte sind **FEST pro Rasse**. Kein Würfeln auf Attribute. Du wählst Name → Rasse → Beruf → fertig. Wiederhole 4× für die komplette Crew. Danach Startgold würfeln (einmal, kein Neuwurf) und gemeinsam Ausrüstung kaufen.

### 2.2 Die 8 Rassen

| Rasse | BW | ST | GE | IN | HP | Besonderheit |
|-------|----|----|----|----|-----|-------------|
| Freibeuter 🏴‍☠️ | 3 | 3 | 3 | 3 | 7 | Allrounder, keine Schwächen |
| Sirene 🧜 | 4 | 2 | 4 | 3 | 5 | Schnell & geschickt, schwach |
| Zwergpirat ⛏️ | 2 | 4 | 2 | 3 | 9 | Zäh, langsam |
| Äffling 🐒 | 5 | 1 | 5 | 2 | 4 | Extrem flink, Glaskanone |
| Hai-Blut 🦈 | 3 | 5 | 2 | 1 | 11 | Brutale Kampfmaschine |
| Geisterblut 👻 | 3 | 2 | 3 | 4 | 5 | Mystisch, hohe Intelligenz |
| Krakenbrut 🐙 | 2 | 4 | 2 | 3 | 8 | Starker Griff, langsam |
| Papageiling 🦜 | 3 | 1 | 3 | 5 | 4 | Genialer Stratege |

**HP = Rasse-HP + ST** (bei Start; steigt mit ST-Training)

**BW** = Bewegung, **ST** = Stärke, **GE** = Geschick, **IN** = Intelligenz

### 2.3 Die 6 Berufe

| Beruf | NK-Bonus | FK-Bonus | Startfertigkeit | Beschreibung |
|-------|----------|----------|-----------------|-------------|
| Enterer ⚔️ | +2 | +0 | Enterhaken-Meister | Nahkampf-Spezialist |
| Navigator 🧭 | +0 | +1 | Sternennavigation | Flucht & Erkundung |
| Schmuggler 🗝️ | +1 | +0 | Schwarzmarkt | Handel & Diebstahl |
| Kanonier 💣 | +0 | +2 | Breitseite | Fernkampf-Spezialist |
| Schiffsarzt ⚕️ | +0 | +0 | Wundversorgung | Heilung nach Kampf |
| Voodoo-Priester 🔮 | +0 | +0 | Verfluchung | Dunkle Magie, Fluchentfernung |

### 2.4 Vorgefertigte Gruppen (Alternative)

Für schnellen Einstieg können vorgefertigte 4er-Gruppen gewählt werden:

- **Die Sturmbrecher:** Freibeuter/Enterer, Zwergpirat/Kanonier, Sirene/Navigator, Geisterblut/Schiffsarzt
- **Die Schattenkrallen:** Hai-Blut/Enterer, Äffling/Schmuggler, Krakenbrut/Kanonier, Papageiling/Voodoo
- **Die Wellenreiter:** Sirene/Enterer, Freibeuter/Navigator, Zwergpirat/Schiffsarzt, Papageiling/Kanonier

### 2.5 Startgold

Nach Erstellung aller 4 Helden: **3W6 × 3 Gold** würfeln. Einmal. Kein Neuwurf. Alle 4 Helden sichtbar, Ausrüstung frei verteilbar.

---

## 3. AUSRÜSTUNGSSYSTEM

### 3.1 Slots pro Held

Jeder Held hat folgende Ausrüstungsslots:

| Slot | Max | Regeln |
|------|-----|--------|
| Nahkampfwaffe (1H) | 2 | Nur wenn KEINE Zweihandwaffe |
| Nahkampfwaffe (2H) | 1 | Keine 1H-Waffen + kein Schild möglich |
| Fernkampfwaffe | 1 | Immer nur eine |
| Rüstung | 1 | Immer nur eine |
| Schild | 1 | Nicht mit 2H-Waffe kombinierbar |

### 3.2 Kampfwert-Berechnung

- **NK (Nahkampf)** = ST + Berufs-NK-Bonus + **BESTE** ausgerüstete Nahkampfwaffe (nur der höchste NK-Wert, keine Addition!)
- **FK (Fernkampf)** = GE + Berufs-FK-Bonus + ausgerüstete Fernkampfwaffe (nur eine möglich)
- **RW (Rüstungswert)** = Rüstung-RW + Schild-RW + Amulett-RW (diese addieren sich)

### 3.3 Gewichtssystem

- Jeder Held kann **1 schweren** Gegenstand tragen
- Bei ST ≥ 4: +1 schwerer Gegenstand
- Bei ST ≥ 6: +1 schwerer Gegenstand (max 3)

### 3.4 Waffenliste

**Einhand-Nahkampf (Slot: m1)**

| Item | NK | Kosten | Tier | Schwer |
|------|----|--------|------|--------|
| Dolch 🔪 | +1 | 3G | 0 | Nein |
| Entermesser 🗡️ | +2 | 6G | 0 | Nein |
| Enterhaken 🪝 | +2 | 5G | 0 | Nein |
| Rapier ⚔️ | +3 | 14G | 1 | Nein |

**Zweihand-Nahkampf (Slot: m2)** — Kein Schild möglich!

| Item | NK | Kosten | Tier | Schwer |
|------|----|--------|------|--------|
| Enteraxt 🪓 | +4 | 20G | 1 | Ja |
| Dreizack 🔱 | +3 | 18G | 1 | Ja |
| Flamberge ⚔️ | +5 | 35G | 2 | Ja |
| Neptunklinge 🔱 | +6 | 60G | 3 | Ja |

**Fernkampf (Slot: r)** — Max 1 pro Held

| Item | FK | Kosten | Tier | Schwer |
|------|----|--------|------|--------|
| Pistole 🔫 | +2 | 8G | 0 | Nein |
| Muskete 🔫 | +3 | 16G | 1 | Ja |
| Doppellauf 🔫 | +4 | 30G | 2 | Nein |
| Donnerbüchse 💥 | +5 | 55G | 3 | Ja |

**Rüstung (Slot: a)** — Max 1

| Item | RW | Kosten | Tier | Schwer |
|------|----|--------|------|--------|
| Lederwams 🧥 | +1 | 6G | 0 | Nein |
| Kettenhemd 🛡️ | +2 | 15G | 1 | Ja |
| Brustpanzer 🛡️ | +3 | 28G | 2 | Ja |
| Drachenschuppe 🐉 | +4 | 50G | 3 | Ja |

**Schild (Slot: s)** — Max 1, nicht mit 2H

| Item | RW | Kosten | Tier |
|------|----|--------|------|
| Buckler 🛡️ | +1 | 7G | 0 |
| Schutzamulett 🧿 | +1 | 25G | 2 |

**Verbrauchsgüter & Werkzeuge**

| Item | Effekt | Kosten | Tier |
|------|--------|--------|------|
| Fass Rum 🍺 | +5 Rum | 4G | 0 |
| Proviant 🍖 | Heilt +3 HP alle | 3G | 0 |
| Kräutertinktur 🧪 | Heilt +5 HP alle | 10G | 1 |
| Voodoo-Elixier 🧪 | Heilt +10 HP alle | 25G | 2 |
| Kanonenkugeln 💣 | Munition | 5G | 0 |
| Dynamit 🧨 | Spezial | 12G | 1 |
| Fernrohr 🔭 | Erkundungsbonus | 10G | 0 |
| Mag. Kompass 🧭 | Navigationsbonus | 22G | 1 |
| Voodoo-Puppe 🪆 | Kampfmagie | 18G | 1 |

### 3.5 Tier-System (Stufenfreischaltung)

| Tier | Benötigte Ehre (⭐) |
|------|---------------------|
| 0 | 0 (Startausrüstung) |
| 1 | 10 ⭐ |
| 2 | 25 ⭐ |
| 3 | 40 ⭐ |

Gesperrte Items im Shop sichtbar mit 🔒 und benötigter Ehre.

### 3.6 Verkaufen

Jedes ausgerüstete Item kann im Shop für **halben Einkaufspreis** verkauft werden. Tippe ✕ neben dem Item.

### 3.7 Standort-Shops

Verschiedene Standorte haben unterschiedliche Sortimente und Preismodifikatoren:

| Standort | Sortiment | Preismod. | Schiffe |
|----------|-----------|-----------|---------|
| Tortuga (Hafen) | Standard + Magie | ×1.0 | Ja |
| Puerto Seguro (Dorf) | Nur Basis | ×1.15 | Nein |
| Goldküste (Stadt) | Premium + Legendär | ×0.9 | Ja |
| Festung (Militär) | Waffen + Rüstung | ×0.75 | Nein |

---

## 4. KAMPFSYSTEM

### 4.1 Kampfablauf (wie UltraQuest)

**Runde 1 — FERNKAMPF:**
- Spieler: **W6 + Gruppen-FK** (Summe aller lebenden Helden-FK) + Schiffskanonen (nur auf See)
- Gegner: **W6 + Gegner-NK**
- Höherer Wert trifft, Schaden = Differenz − RW des Getroffenen (min. 1)

**Ab Runde 2 — NAHKAMPF:**
- Spieler: **W6 + Gruppen-NK** (Summe aller lebenden Helden-NK)
- Gegner: **W6 + Gegner-NK**
- Schaden wie oben

### 4.2 Schadenverteilung

Schaden am Spieler trifft immer den **Helden mit niedrigstem HP** (Frontlinie). Bei Gleichstand zufällig.

### 4.3 Schiffsbonus (nur auf See-Regionen)

- **Kanonen** addieren sich zur FK im Fernkampf (Runde 1)
- **Rumpf** addiert sich zum RW aller Helden (Schadenreduktion)

### 4.4 Aktive Fertigkeiten im Kampf

Pro Kampfrunde kann EIN Held eine aktive Fertigkeit einsetzen (sofern erlernt). Auswahl über UI vor dem Würfeln.

| Fertigkeit | Effekt | Cooldown |
|------------|--------|----------|
| Kampfrausch | NK ×1.5 diese Runde | 3 Runden |
| Breitseite | FK ×2 diese Runde (nur Runde 1) | 3 Runden |
| Doppelschlag | Bei Treffer: Schaden ×2 | 4 Runden |
| Schildbrecher | Ignoriert Gegner-RW diese Runde | 3 Runden |
| Todeswirbel | Schaden an alle Gegner (wenn Gruppenkampf) | 5 Runden |
| Verfluchung | Gegner NK −3 für 2 Runden | 4 Runden |
| Wundversorgung | Heilt 1 Helden um ST HP nach Kampf | Jeder Kampf |
| Geisterruf | +5 auf NK/FK diese Runde | 5 Runden |
| Fluchtexperte | Flucht gelingt automatisch | 1x pro Gebiet |

### 4.5 Erzwungener vs. Freiwilliger Kampf

Events markieren Kämpfe als:
- **❗ Erzwungener Kampf** — Keine Wahl, muss gekämpft werden
- **❓ Freiwilliger Kampf** — Spieler kann wählen: kämpfen oder ausweichen

### 4.6 Gegner-Balancing

Gegner-NK skaliert mit Region-Schwierigkeit und sollte ~70–90% des Gruppen-NK betragen, damit Kämpfe herausfordernd aber nicht unmöglich sind.

**Formel:** Gegner-NK = Basis (regional) + W6 Varianz  
**Gegner-HP** = 5 + Schwierigkeit × 3 + W4 (mehrere Runden Kampf nötig)

---

## 5. KARTE & REGIONEN

### 5.1 Regionen mit Level-System

Jede Region hat:
- **Mindest-Ehre** zum Betreten
- **Max-Ehre** für Belohnungen (darüber: keine ⭐ mehr, Event-Texte ändern sich)
- **Schwierigkeitsstufe** (bestimmt Gegner-Stärke und Belohnungen)
- Sichtbar auf der Karte als Zahl

| Region | Min ⭐ | Max ⭐ | Stufe | Typ |
|--------|--------|--------|-------|-----|
| Tortuga | 0 | 15 | 1 | Hafen 🏴‍☠️ |
| Puerto Seguro | 0 | 15 | 1 | Dorf 🏘️ |
| Flache See | 0 | 15 | 1 | See 🌊 |
| Handelsstraße | 0 | 20 | 2 | Handel ⛵ |
| Mangroven | 5 | 25 | 2 | Sumpf 🌿 |
| Korallenriff | 8 | 30 | 3 | Riff 🐠 |
| Goldküste | 10 | 35 | 3 | Stadt 🏰 |
| Nebelbank | 12 | 40 | 4 | Nebel 🌫️ |
| Haifischbucht | 15 | 45 | 4 | Hai 🦈 |
| Geisterinsel | 18 | 50 | 5 | Geister 👻 |
| Schlangennest | 15 | 50 | 5 | Dungeon 🐍 |
| Festung | 20 | 60 | 5 | Festung 🏰 |
| Vulkaninsel | 25 | 70 | 6 | Vulkan 🌋 |
| Bermuda-Dreieck | 25 | 70 | 6 | Bermuda 🔮 |
| Kraken-Tiefen | 30 | 80 | 7 | Tiefsee 🐙 |
| Davy Jones' Riff | 35 | 90 | 8 | Unterwasser 🫧 |
| Schatzinsel | 40 | — | 9 | Schatz 💎 |
| Piratenkönigsthron | 50 | — | 10 | Thron 👑 |

### 5.2 Über-Level-Mechanik

Wenn **Spieler-Ehre > Max-Ehre der Region**:
- ⭐-Belohnungen = 0 (keine Ehrensterne mehr in dieser Region)
- Events geben nur noch Gold und Ruhm
- Event-Text ändert sich: „Diese Gewässer sind unter eurer Würde, Kapitän."
- Region kann trotzdem betreten werden (für Shops, Durchreise)

### 5.3 Bewegung

- **Bewegen kostet den Zug** (wie UltraQuest)
- Spieler zieht zu einer verbundenen Region → Zug endet
- Nächste Runde: Erkunden oder andere Aktionen
- BW-Wert: zukünftige Erweiterung (Mehrfachbewegung bei hohem BW)

### 5.4 Dungeons

Bestimmte Regionen sind Dungeons mit mehreren Räumen/Stufen:

| Dungeon | Region | Räume | Schwierigkeit |
|---------|--------|-------|---------------|
| Schlangennest | Mangroven | 3 | ⚔️⚔️⚔️ |
| Festung San Carlos | Goldküste | 4 | ⚔️⚔️⚔️⚔️ |
| Vulkankrater | Vulkaninsel | 3 | ⚔️⚔️⚔️⚔️⚔️ |
| Davy Jones' Grab | Unterwasser | 5 | ⚔️⚔️⚔️⚔️⚔️⚔️ |

Dungeon-Ablauf: Spieler entscheidet „Dungeon betreten". Danach Raum für Raum — jeder Raum ist ein Event (Kampf, Falle, Schatz). Kann nach jedem Raum abbrechen. Tiefer = bessere Belohnungen. Letzter Raum = Boss + großer Schatz.

---

## 6. EREIGNISSYSTEM

### 6.1 Prinzip

Pro Zug „Erkunden": W100 würfeln → Ereignis aus der Regionstabelle. Jedes Ereignis hat eine **spürbare Auswirkung** — kein „nichts passiert".

### 6.2 Textqualität

Alle Event-Texte müssen:
- **Authentische Piratensprache** verwenden (Arrr, Landratte, Klabautermann, Kielholenlassen)
- **Atmosphärisch** sein (Wetter, Gerüche, Geräusche beschreiben)
- **Bezug zum Spielgeschehen** haben (nicht nur Flavor-Text)
- **Spannend und fesselnd** sein
- Mindestens 2-3 Sätze lang

**Beispiel schlecht:** „Gerüchte: Neptuns Dreizack in einer Höhle."  
**Beispiel gut:** „In der verrauchten Taverne von Tortuga flüstert ein einäugiger Matrose euch zu: ‚Neptuns Dreizack, sag ich euch! Vergraben in einer Höhle nahe dem Korallenriff. Ich hab die Karte — aber sie hat ihren Preis, Kapitän.' Er grinst zahnlos und streckt die Hand auf. Was tut ihr?"

### 6.3 Event-Typen

| Typ | Beschreibung | Auswirkung |
|-----|-------------|------------|
| ❗ Kampf (erzwungen) | Monster/Piraten greifen an | Muss kämpfen |
| ❓ Kampf (freiwillig) | Begegnung, Kampf optional | Wahl: Kampf oder Ausweichen |
| 🎲 Fertigkeitstest | W6 + Stat vs. Schwierigkeit | Erfolg/Misserfolg mit Konsequenzen |
| 💬 Entscheidung | 2-3 Optionen zur Wahl | Verschiedene Belohnungen/Risiken |
| 💰 Beute | Fund von Schätzen | Gold + Ruhm + evtl. Ehre |
| 🏪 Handel | Handelsangebot | Kaufen/Verkaufen/Tauschen |
| 💀 Fluch | Verfluchung der Crew | Stat-Mali bis entfernt |
| ❤️ Heilung | Hilfe/Proviant gefunden | HP-Heilung |
| 🎰 Würfelduell | Glücksspiel mit NPC | Sichtbarer Würfelablauf, Gewinn/Verlust |

### 6.4 Würfelduell (detaillierter Ablauf)

1. NPC stellt sich vor (Name, Einsatz)
2. Beide Seiten würfeln W6 — sichtbar animiert
3. Höherer Wert gewinnt
4. Bei Gleichstand: erneut würfeln (bis zu 3×)
5. Gewinn: Gold des Einsatzes × 2
6. Verlust: Einsatz weg
7. Abschließender Flavor-Text je nach Ergebnis

### 6.5 Belohnungsskalierung

- **Basis-Ehre pro Event** = Region-Stufe × 0.3 (gerundet, 0 oder 1 bei niedrigen Regionen)
- **Bonus-Ehre bei harten Kämpfen** = +1-2 wenn Gegner-NK > Gruppen-NK
- **Über-Level-Region** = 0 Ehre
- **Ruhm** = großzügiger als Ehre (2-5 pro Event), damit Aufwertung möglich bleibt
- **Gold** = skaliert mit Schwierigkeit (Stufe × 3 + W6)

---

## 7. AUFWERTUNGSSYSTEM

### 7.1 Ort

Training und Fertigkeiten nur in **Häfen und Städten** (Tortuga, Puerto Seguro, Goldküste).

### 7.2 Stat-Training

| Aktion | Kosten | Effekt |
|--------|--------|--------|
| ST +1 | 8 🏆 | Stärke steigt, HP +1, NK steigt |
| GE +1 | 8 🏆 | Geschick steigt, FK steigt |
| IN +1 | 8 🏆 | Intelligenz steigt, bessere Tests |
| BW +1 | 8 🏆 | Bewegung steigt |

**Beendet den Zug.**

### 7.3 Fertigkeiten erlernen

Kosten: **10 🏆** pro Fertigkeit. Jeder Beruf hat 5 Fertigkeiten, stufenweise freischaltbar.

**Enterer-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Enterhaken-Meister | Automatischer Erfolg bei Enter-Events | — |
| 2 | Doppelschlag | Aktiv: Schaden ×2 bei Treffer (CD: 4 Runden) | ST +1 |
| 3 | Kampfrausch | Aktiv: NK ×1.5 diese Runde (CD: 3) | ST +1 |
| 4 | Schildbrecher | Aktiv: Ignoriert Gegner-RW (CD: 3) | ST +1 |
| 5 | Todeswirbel | Aktiv: Flächenschaden (CD: 5) | ST +1 |

**Navigator-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Sternennavigation | +2 auf IN-Tests in See-Regionen | — |
| 2 | Windleser | Flucht aus Kampf gelingt leichter | BW +1 |
| 3 | Geheimrouten | Kann Regionen überspringen | IN +1 |
| 4 | Sturmreiter | Kein Schaden durch Sturm-Events | BW +1 |
| 5 | Fluchtexperte | Aktiv: Automatische Flucht (1× pro Gebiet) | BW +1 |

**Schmuggler-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Schwarzmarkt | Zugang zu Tier+1 Items überall | — |
| 2 | Feilschen | Shop-Preise −20% | IN +1 |
| 3 | Taschendieb | Bei Entscheidungs-Events: Extra-Gold-Option | GE +1 |
| 4 | Falsche Flagge | Marine-Begegnungen werden zu Handel | IN +1 |
| 5 | Meisterschmuggler | Doppelter Gold-Ertrag aus Handels-Events | IN +1 |

**Kanonier-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Breitseite | Aktiv: FK ×2 Runde 1 (CD: 3) | — |
| 2 | Kettenschuss | Aktiv: Gegner-BW −2 (verhindert Flucht) | GE +1 |
| 3 | Feuerkanone | +3 FK auf See permanent | GE +1 |
| 4 | Präzisionsschuss | Aktiv: Ignoriert RW im Fernkampf (CD: 3) | GE +1 |
| 5 | Inferno | Aktiv: Runde 1 Schaden ×3 (CD: 5) | GE +1 |

**Schiffsarzt-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Wundversorgung | Heilt 1 Helden um 3 HP nach jedem Kampf | — |
| 2 | Kräuterkunde | Heiltränke wirken doppelt | IN +1 |
| 3 | Feldchirurg | Kann K.O.-Helden im Kampf mit 1 HP wiederbeleben (1×) | IN +1 |
| 4 | Giftkunde | Immunität gegen Gift-Events | IN +1 |
| 5 | Wiederbelebung | K.O.-Helden kehren nach Kampf mit 50% HP zurück | IN +1, HP +2 |

**Voodoo-Priester-Fertigkeiten:**

| # | Fertigkeit | Effekt | Stat-Bonus |
|---|-----------|--------|------------|
| 1 | Verfluchung | Aktiv: Gegner NK −3 für 2 Runden (CD: 4) | — |
| 2 | Geisterruf | Aktiv: +5 NK/FK diese Runde (CD: 5) | IN +1 |
| 3 | Schutzamulett | Passive: +1 RW für gesamte Gruppe | IN +1 |
| 4 | Seelenraub | Bei Tötung eines Gegners: Heilt Gruppe um 3 HP | IN +1 |
| 5 | Totenbeschwörung | Aktiv: Beschwört Geister-Helfer (+8 NK eine Runde, CD: 5) | IN +1 |

---

## 8. K.O. / TOD / HEILUNG

### 8.1 K.O.-System

- Held bei **0 HP = K.O.** (nicht tot)
- K.O.-Held kann nicht kämpfen, nicht an Tests teilnehmen
- **Bleibt K.O.** bis geheilt oder ersetzt

### 8.2 Heilung im Hafen

- **K.O.-Held heilen:** Kosten = 8 + Spieler-Ehre Gold. Held kehrt mit 50% HP zurück.
- **Neuen Söldner anheuern:** Kosten = 15 + Spieler-Ehre × 2 Gold. Ersetzt einen K.O.-Helden. Söldner hat Basis-Werte + kleinen Zufallsbonus (W2 pro Stat).

### 8.3 Party Wipe (alle 4 K.O.)

Wenn alle 4 Helden im Kampf fallen:
1. **Automatischer Rückzug** zum nächsten Hafen
2. **25% Gold verloren** (exakt angezeigt: „Rückzug! −X Gold")
3. **NUR die Helden die in DIESEM Kampf gefallen sind** werden auf 1 HP gesetzt
4. Helden die VORHER schon K.O. waren bleiben K.O.

---

## 9. FLUCH-SYSTEM

### 9.1 Flüche

| Fluch | Effekt | Beschreibung |
|-------|--------|-------------|
| Seekrankheit | BW −1 alle Helden | Grüne Gesichter an Deck |
| Pech des Meeres | Gold-Belohnungen halbiert | Alles was glänzt rostet |
| Davy Jones' Fluch | ST −1 alle Helden | Kalte Hände, schwache Arme |
| Geisterblick | IN −1 alle Helden | Stimmen im Kopf |
| Klumpfuß | GE −1 alle Helden | Schwere Beine |
| Meuterei-Fluch | −3 Rum pro Rast | Die Crew murrt |

### 9.2 Entfernung

- Bei Voodoo-Priesterin im Sumpf (bestimmte Events)
- Voodoo-Priester-Fertigkeit „Schutzamulett" (passiv: verhindert neuen Fluch)
- Spezielle Items (Geisterflasche)

---

## 10. PSYCHOLOGISCHES BELOHNUNGSSYSTEM

### 10.1 Meilenstein-Meldungen

Bei bestimmten Ehre-Schwellen erscheinen besondere Vollbild-Meldungen:

| Ehre | Titel | Meldung |
|------|-------|---------|
| 10 | Bekannter Pirat | „Euer Name wird in den Tavernen geflüstert!" |
| 25 | Gefürchteter Pirat | „Handelsschiffe hissen die weiße Flagge wenn sie eure Segel sehen!" |
| 50 | Piratenlord | „Der Rat der Kapitäne erkennt euch als einen der Ihren an!" |
| 75 | Schrecken der Meere | „Selbst die Marine meidet euer Revier. Legenden werden über euch erzählt!" |
| 100 | PIRATENKÖNIG! | „IHR HERRSCHT ÜBER DIE SIEBEN MEERE!" |

### 10.2 Kampfsieg-Feedback

- **Knapper Sieg** (Differenz ≤ 2): „Gerade noch! Euer Hemd ist zerrissen aber ihr steht noch!"
- **Klarer Sieg** (Differenz 3-5): „Ein sauberer Sieg! Die Crew jubelt!"  
- **Vernichtender Sieg** (Differenz > 5): „VERNICHTEND! Euer Ruf eilt euch voraus! 🔥" + Bonus-Ruhm
- **Gegen stärkeren Gegner gewonnen**: „HELDENTAT! Gegen alle Widrigkeiten! 💪" + Bonus-Ehre

### 10.3 Suchtmechaniken

- **Fast-Gewinn:** „Noch 5 Ehre bis zum nächsten Rang!"
- **Täglicher Bonus:** Erster Event des Tages gibt +2 Gold
- **Streak-Bonus:** 3 Kämpfe gewonnen → +1 Ruhm Bonus
- **Zufalls-Jackpot:** 5% Chance auf doppelte Belohnung (goldener Rahmen)

---

## 11. MULTIPLAYER & SPEICHERN

### 11.1 Spielstart

- Spieler 1 erstellt Spiel → erhält 6-stelligen Code
- Spieler 2 gibt Code ein → tritt bei
- Beide erstellen Crew, dann Start

### 11.2 Zugfolge

Abwechselnd. Der Spieler mit weniger Ehre beginnt (bei Gleichstand: zufällig).

### 11.3 Speichern

- Automatisch nach jedem Zug (API + localStorage)
- Menü zeigt „Gespeicherte Spiele" mit Gegner, Ehre, Position, Datum
- Mehrere Spiele parallel möglich (bis zu 20)
- Session wird erst gespeichert wenn Setup abgeschlossen ist

### 11.4 Sync

- Polling alle 3 Sekunden
- Server-State ist autoritativ (API), localStorage als Fallback

---

## 12. UI/UX-ANFORDERUNGEN

### 12.1 Mobile-First

- Max 600px Breite
- Große Touch-Targets (min 44px)
- Keine Keyboard-Bugs (alle UI-Primitives außerhalb App-Komponente)
- Scrollbare Bereiche für lange Listen

### 12.2 Karten-Anzeige

- Regionen als farbige Kreise mit Emoji
- **Level-Zahl sichtbar** neben jeder Region
- Verbindungslinien zwischen erreichbaren Regionen
- Goldene Hervorhebung für aktuelle Position
- 🔒 für gesperrte Regionen (Min-Ehre)
- Legende unter der Karte

### 12.3 Hilfe-Overlay

- ❓-Button oben rechts im Spielbildschirm
- Alle Regeln kompakt erklärt
- Scrollbar

### 12.4 Gegner-Info

- Klappbar: Gegner-Crew einsehbar (Helden, Stats, Ausrüstung)

---

## 13. TECHNISCHE ARCHITEKTUR

- **Frontend:** React (Vite Build), Single Page App
- **Backend:** Express.js, In-Memory Game Store
- **Deploy:** Docker → GHCR → Server (Nginx Reverse Proxy)
- **Domain:** pq.vertriebsarchitekt.eu
- **CI/CD:** GitHub Actions Build + Deploy-Workflow

---

## 14. OFFENE PUNKTE / ZUKUNFT

- [ ] In-App-Käufe (Premium-Skins, XP-Booster)
- [ ] Mehr als 2 Spieler
- [ ] Solo-Modus mit KI-Gegner
- [ ] Saisonale Events (Weihnachtsmarkt wie bei UltraQuest)
- [ ] Ranglisten / Highscores
- [ ] Sound-Effekte
