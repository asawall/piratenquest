import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// 🏴‍☠️  P I R A T E N Q U E S T  –  Herrscher der Sieben Meere
//    Regelwerk angelehnt an UltraQuest (Gold, Ruhm! und Ehre!)
// ══════════════════════════════════════════════════════════════

const pick = a => a[Math.floor(Math.random()*a.length)];
const roll = s => Math.floor(Math.random()*s)+1;
const d6 = () => roll(6);
const d100 = () => roll(100);
const uid = () => Math.random().toString(36).slice(2,8);

// ── API (Express backend + localStorage fallback) ──
const api = {
  save: async g => { try { const r=await fetch(`/api/games/${g.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)}); if(r.ok) return; } catch{} try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{} },
  load: async id => { try { const r=await fetch(`/api/games/${id}`); if(r.ok) return await r.json(); } catch{} try{const d=localStorage.getItem(`pq:${id}`); return d?JSON.parse(d):null;}catch{return null;} },
  create: async g => { try { await fetch('/api/games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)}); } catch{} try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{} },
};

// ═══════════════════════════════════════════════════════════
//  WORLD DATA
// ═══════════════════════════════════════════════════════════
const RACES = {
  Freibeuter:  {bw:3,st:3,ge:3,in_:3,hp:7, label:"Freibeuter",  emoji:"🏴‍☠️",desc:"Allrounder, keine Schwächen"},
  Sirene:      {bw:4,st:2,ge:4,in_:3,hp:5, label:"Sirene",      emoji:"🧜",desc:"Schnell & geschickt, betörend"},
  Zwergpirat:  {bw:2,st:4,ge:2,in_:3,hp:9, label:"Zwergpirat",  emoji:"⛏️",desc:"Kanonenspezialist, zäh"},
  Aeffling:    {bw:5,st:1,ge:5,in_:2,hp:4, label:"Äffling",     emoji:"🐒",desc:"Takelage-Akrobat, flink"},
  HaiBlut:     {bw:3,st:5,ge:2,in_:1,hp:11,label:"Hai-Blut",    emoji:"🦈",desc:"Kampfmaschine, simpel"},
  Geisterblut: {bw:3,st:2,ge:3,in_:4,hp:5, label:"Geisterblut", emoji:"👻",desc:"Mystisch, zwischen den Welten"},
  Krakenbrut:  {bw:2,st:4,ge:2,in_:3,hp:8, label:"Krakenbrut",  emoji:"🐙",desc:"Tentakel, enormer Griff"},
  Papageiling: {bw:3,st:1,ge:3,in_:5,hp:4, label:"Papageiling", emoji:"🦜",desc:"Genialer Stratege"},
};
const PROFS = {
  Enterer:       {label:"Enterer",      nk:2,fk:0,emoji:"⚔️",desc:"Nahkampf beim Entern",skills:["Enterhaken-Meister","Doppelschlag","Kampfrausch","Schildbrecher","Todeswirbel"]},
  Navigator:     {label:"Navigator",    nk:0,fk:1,emoji:"🧭",desc:"Findet jeden Weg",skills:["Sternennavigation","Windleser","Geheimrouten","Sturmreiter","Fluchtexperte"]},
  Schmuggler:    {label:"Schmuggler",   nk:1,fk:0,emoji:"🗝️",desc:"Handel & flinke Finger",skills:["Schwarzmarkt","Feilschen","Taschendieb","Falsche Flagge","Meisterschmuggler"]},
  Kanonier:      {label:"Kanonier",     nk:0,fk:2,emoji:"💣",desc:"Fernkampf, Breitseite",skills:["Breitseite","Kettenschuss","Feuerkanone","Praezisionsschuss","Inferno"]},
  Schiffsarzt:   {label:"Schiffsarzt",  nk:0,fk:0,emoji:"⚕️",desc:"Heilt die Crew",skills:["Wundversorgung","Kraeuterkunde","Feldchirurg","Giftkunde","Wiederbelebung"]},
  VoodooPriester:{label:"Voodoo-Priester",nk:0,fk:0,emoji:"🔮",desc:"Dunkle Magie & Flueche",skills:["Verfluchung","Geisterruf","Schutzamulett","Seelenraub","Totenbeschwuerung"]},
};
const SHIPS = [
  {id:"jolle",     name:"Jolle",      cost:0,    kan:0, rumpf:3,  spd:1,emoji:"🚣"},
  {id:"schaluppe", name:"Schaluppe",   cost:30,   kan:2, rumpf:6,  spd:2,emoji:"⛵"},
  {id:"brigg",     name:"Brigg",       cost:80,   kan:6, rumpf:10, spd:2,emoji:"🚢"},
  {id:"fregatte",  name:"Fregatte",    cost:200,  kan:12,rumpf:16, spd:3,emoji:"⚓"},
  {id:"galeone",   name:"Galeone",     cost:500,  kan:20,rumpf:24, spd:2,emoji:"🏴‍☠️"},
  {id:"flaggschiff",name:"Flaggschiff",cost:1200, kan:30,rumpf:32, spd:3,emoji:"👑"},
];

// ── ITEMS with tiers & categories ──
const ALL_ITEMS = [
  {id:"dolch",cat:"waffe",name:"Dolch",nk:1,fk:1,rw:0,cost:3,emoji:"🔪",tier:0,heavy:0},
  {id:"saebel",cat:"waffe",name:"Entermesser",nk:2,fk:0,rw:0,cost:6,emoji:"🗡️",tier:0,heavy:0},
  {id:"rapier",cat:"waffe",name:"Rapier",nk:3,fk:0,rw:0,cost:14,emoji:"⚔️",tier:1,heavy:0},
  {id:"axt",cat:"waffe",name:"Enteraxt",nk:4,fk:0,rw:0,cost:20,emoji:"🪓",tier:1,heavy:1},
  {id:"flamberg",cat:"waffe",name:"Flamberge",nk:5,fk:0,rw:0,cost:35,emoji:"⚔️",tier:2,heavy:1},
  {id:"pistole",cat:"waffe",name:"Steinschlosspistole",nk:0,fk:2,rw:0,cost:8,emoji:"🔫",tier:0,heavy:0},
  {id:"muskete",cat:"waffe",name:"Muskete",nk:0,fk:3,rw:0,cost:16,emoji:"🔫",tier:1,heavy:1},
  {id:"doppellauf",cat:"waffe",name:"Doppellauf-Pistole",nk:0,fk:4,rw:0,cost:30,emoji:"🔫",tier:2,heavy:0},
  {id:"enterhaken",cat:"waffe",name:"Enterhaken",nk:2,fk:0,rw:0,cost:5,emoji:"🪝",tier:0,heavy:0},
  {id:"dreizack",cat:"waffe",name:"Dreizack",nk:3,fk:1,rw:0,cost:18,emoji:"🔱",tier:1,heavy:1},
  {id:"lederwams",cat:"ruestung",name:"Lederwams",nk:0,fk:0,rw:1,cost:6,emoji:"🧥",tier:0,heavy:0},
  {id:"kette",cat:"ruestung",name:"Kettenhemd",nk:0,fk:0,rw:2,cost:15,emoji:"🛡️",tier:1,heavy:1},
  {id:"brust",cat:"ruestung",name:"Brustpanzer",nk:0,fk:0,rw:3,cost:28,emoji:"🛡️",tier:2,heavy:1},
  {id:"buckler",cat:"ruestung",name:"Buckler",nk:0,fk:0,rw:1,cost:7,emoji:"🛡️",tier:0,heavy:0},
  {id:"rum",cat:"konsum",name:"Fass Rum",cost:4,emoji:"🍺",tier:0,rum:5},
  {id:"proviant",cat:"konsum",name:"Proviant",cost:3,emoji:"🍖",tier:0,heal:3},
  {id:"heiltrank",cat:"konsum",name:"Kraeutertinktur",cost:10,emoji:"🧪",tier:1,heal:5},
  {id:"elixier",cat:"konsum",name:"Voodoo-Elixier",cost:25,emoji:"🧪",tier:2,heal:10},
  {id:"kugeln",cat:"konsum",name:"Kanonenkugeln",cost:5,emoji:"💣",tier:0,ammo:10},
  {id:"dynamit",cat:"konsum",name:"Dynamit",cost:12,emoji:"🧨",tier:1},
  {id:"fernrohr",cat:"werkzeug",name:"Fernrohr",cost:10,emoji:"🔭",tier:0},
  {id:"kompass",cat:"werkzeug",name:"Magischer Kompass",cost:22,emoji:"🧭",tier:1},
  {id:"seil",cat:"werkzeug",name:"Enterhaken-Seil",cost:4,emoji:"🪢",tier:0},
  {id:"fackel",cat:"werkzeug",name:"Laterne",cost:3,emoji:"🏮",tier:0},
  {id:"voodoo",cat:"magie",name:"Voodoo-Puppe",cost:18,emoji:"🪆",tier:1},
  {id:"amulett",cat:"magie",name:"Schutzamulett",cost:25,emoji:"🧿",tier:2,rw:1},
  {id:"seekarte",cat:"magie",name:"Mystische Seekarte",cost:30,emoji:"🗺️",tier:2},
  {id:"geisterflasche",cat:"magie",name:"Geisterflasche",cost:40,emoji:"🫧",tier:3},
];

const SHOP_INV = {
  hafen:{name:"Tortuga Piratenladen",emoji:"🏴‍☠️",items:["dolch","saebel","rapier","pistole","muskete","enterhaken","lederwams","kette","buckler","rum","proviant","heiltrank","kugeln","dynamit","fernrohr","seil","fackel","voodoo"],pm:1.0,ships:true},
  dorf:{name:"Fischerdorf-Haendler",emoji:"🏘️",items:["dolch","enterhaken","lederwams","proviant","rum","seil","fackel","heiltrank"],pm:1.15,ships:false},
  stadt:{name:"Goldkuesten-Basar",emoji:"🏰",items:["rapier","axt","flamberg","doppellauf","dreizack","kette","brust","buckler","rum","heiltrank","elixier","kugeln","dynamit","fernrohr","kompass","voodoo","amulett","seekarte","geisterflasche"],pm:0.9,ships:true},
  festung:{name:"Erbeutete Militaervorraete",emoji:"⚔️",items:["rapier","axt","flamberg","muskete","doppellauf","kette","brust","buckler","kugeln","dynamit"],pm:0.75,ships:false},
};

// ── CURSES ──
const CURSES = [
  {id:"seekrank",name:"Seekrankheit",desc:"BW -1 fuer alle Helden",effect:{stat:"bw",mod:-1}},
  {id:"pech",name:"Pech des Meeres",desc:"Gold-Belohnungen halbiert",effect:{type:"halfGold"}},
  {id:"fluch_jones",name:"Davy Jones Fluch",desc:"ST -1 fuer alle Helden",effect:{stat:"st",mod:-1}},
  {id:"geisterblick",name:"Geisterblick",desc:"IN -1 fuer alle Helden",effect:{stat:"in_",mod:-1}},
  {id:"klumpfuss",name:"Klumpfuss",desc:"GE -1 fuer alle Helden",effect:{stat:"ge",mod:-1}},
  {id:"mueterei_fluch",name:"Meuterei-Fluch",desc:"Crew-Moral sinkt, -2 Rum pro Rast",effect:{type:"extraRumCost"}},
];

const REGIONS = [
  {id:"tortuga",name:"Tortuga",type:"hafen",x:50,y:90,minF:0,conn:["flache_see","handelsweg"],shop:"hafen",tavern:true},
  {id:"puerto",name:"Puerto Seguro",type:"dorf",x:22,y:85,minF:0,conn:["flache_see","mangroven"],shop:"dorf"},
  {id:"flache_see",name:"Flache See",type:"flach",x:38,y:75,minF:0,conn:["tortuga","puerto","handelsweg","korallenriff","mangroven"]},
  {id:"handelsweg",name:"Handelsstrasse",type:"handel",x:62,y:72,minF:0,conn:["tortuga","flache_see","korallenriff","goldkueste"]},
  {id:"mangroven",name:"Mangrovenlabyrinth",type:"sumpf",x:15,y:65,minF:5,conn:["puerto","flache_see","geisterinsel","schlangennest"]},
  {id:"korallenriff",name:"Korallenriff",type:"riff",x:50,y:60,minF:8,conn:["flache_see","handelsweg","nebelbank","haifischbucht"]},
  {id:"goldkueste",name:"Goldkueste",type:"stadt",x:78,y:58,minF:10,conn:["handelsweg","festung","haifischbucht"],shop:"stadt",tavern:true},
  {id:"nebelbank",name:"Ewige Nebelbank",type:"nebel",x:35,y:48,minF:12,conn:["korallenriff","geisterinsel","bermuda"]},
  {id:"haifischbucht",name:"Haifischbucht",type:"hai",x:65,y:45,minF:15,conn:["korallenriff","goldkueste","vulkaninsel","krakentiefen"]},
  {id:"geisterinsel",name:"Geisterinsel",type:"geister",x:18,y:42,minF:18,conn:["mangroven","nebelbank","davyjones"]},
  {id:"schlangennest",name:"Schlangennest",type:"verlies",x:8,y:55,minF:15,conn:["mangroven"]},
  {id:"festung",name:"Festung San Carlos",type:"festung",x:85,y:48,minF:20,conn:["goldkueste","vulkaninsel"],shop:"festung"},
  {id:"vulkaninsel",name:"Vulkaninsel",type:"vulkan",x:70,y:32,minF:25,conn:["haifischbucht","festung","schatzinsel"]},
  {id:"bermuda",name:"Bermuda-Dreieck",type:"bermuda",x:38,y:32,minF:25,conn:["nebelbank","krakentiefen","schatzinsel"]},
  {id:"krakentiefen",name:"Kraken-Tiefen",type:"tiefsee",x:55,y:25,minF:30,conn:["haifischbucht","bermuda","davyjones"]},
  {id:"davyjones",name:"Davy Jones Riff",type:"unterwasser",x:25,y:22,minF:35,conn:["geisterinsel","krakentiefen"]},
  {id:"schatzinsel",name:"Schatzinsel",type:"schatz",x:58,y:12,minF:40,conn:["vulkaninsel","bermuda","thron"]},
  {id:"thron",name:"Piratenkoenigsthron",type:"thron",x:50,y:3,minF:50,conn:["schatzinsel"]},
];
const RCOL={hafen:"#D4A843",dorf:"#8B9E6B",flach:"#4FC3F7",handel:"#FFB74D",sumpf:"#5D4037",riff:"#26C6DA",stadt:"#FFD700",nebel:"#90A4AE",hai:"#EF5350",geister:"#7E57C2",verlies:"#4A148C",festung:"#B71C1C",vulkan:"#FF5722",bermuda:"#6A1B9A",tiefsee:"#0D47A1",unterwasser:"#00695C",schatz:"#FFC107",thron:"#FFD700"};
const REMO={hafen:"🏴‍☠️",dorf:"🏘️",flach:"🌊",handel:"⛵",sumpf:"🌿",riff:"🐠",stadt:"🏰",nebel:"🌫️",hai:"🦈",geister:"👻",verlies:"🐍",festung:"🏰",vulkan:"🌋",bermuda:"🔮",tiefsee:"🐙",unterwasser:"🫧",schatz:"💎",thron:"👑"};
const FAME_PERKS=[{f:5,l:"Bekannter Pirat",d:"+1 Gold pro Ereignis"},{f:15,l:"Gefuerchteter Pirat",d:"Bessere Schiffe"},{f:25,l:"Beruechtigter Pirat",d:"Schwarzmarkt ueberall"},{f:50,l:"Piratenlord",d:"Zugang zum Thron"},{f:75,l:"Schrecken der Meere",d:"Doppelte Belohnungen"},{f:100,l:"PIRATENKOENIG!",d:"SIEG!"}];

// ═══════════════════════════════════════════════════════════
//  EVENT ENGINE (3000+ via combinatorial templates)
// ═══════════════════════════════════════════════════════════
const PN=["Einauge","Rotbart","Schwarzzahn","La Muerte","Knochenbrecher","Silberfinger","Sturmwind","Bluthund","Donnerschlag","Goldkralle","Schlangenauge","Nebelfaust","Totenkopf-Tom","Haifisch-Henri","Eisenbart","Krakenjager","Dunkle Dolores","Fluster-Finn","Teufelszunge","Galgenvogel","Rum-Rosita","Feuerfaust","Seeschlange-Sven","Giftzahn","Todeslacheln","Wirbelwind-Wanda","Voodoo-Vic","Krumsabel-Karl","Blitz-Boris","Narbengesicht","Sturmbraut","Eisenhaken","Goldzahn-Gustav","Mondauge","Piranhamaul","Taifun-Tessa","Messerhans","Kanonen-Klaus","Pesthauch","Irrlichter-Ida","Korallen-Koenig","Seemine-Sam","Ankerfaust","Schwarze Witwe","Geisterflusterer","Schaedelbrecher","Vulkan-Vera","Knochenhand","Dreizack-Dimitri","Seeteufel","Quecksilber-Quinn","Nebelkraehe","Donnergroll","Hakenhex","Kielholer","Seemowen-Sid","Muschelkoenig","Nordwind-Nils","Totenwache","Salzblut","Riffbrecher","Sturmfalke","Tiefenangst","Kompassnadel-Katja","Leuchtturm-Lars","Gruenbart","Silberkette","Krakenauge","Wirbelsturm","Breitseite-Bernd","Kugelregen","Flaschenteufel","Brandungshexe","Wellenbrecher","Sturzflut","Nebelhorn","Schatzgraber","Ebbe-Edgar","Flutwelle-Flora","Korallenherz","Seekobold","Meuterer-Moritz","Barrakuda-Bella","Perlensammlerin","Tintenfass","Leuchtqualle","Meeresauge","Salzfinger","Wellentanzerin","Ankerwerfer","Bugspriet-Bruno","Seemannsgarn","Flaute-Friedrich","Kielbrand","Reling-Rosa","Kombusen-Kai"];
const SN=["Sturmkraehe","Schwarze Perle","Blutige Mary","Seewolf","Nebeltanzerin","Todesschwinge","Goldener Hai","Donnerschlag","Meerjungfrau","Krakenzorn","Geisterschiff","Feuersbrunst","Sturmbrecher","Gezeitenreiter","Mondschatten","Wellenreiter","Korallendolch","Phantomklinge","Teufelsklaue","Fliegende Hollaenderin","Piranhabiss","Leuchtfeuer","Ankerschreck","Schwarzer Blitz","Gruene Mamba","Voodoo-Queen","Knochenbrecher","Salzwind","Brandungsjager","Neptuns Zorn","Wirbelwind","Galgenhumor","Rumlady","Muschelhorn","Schattensegel","Meeresglut","Hoellenfeuer","Eisenkiel","Sturmvogel","Kanonendonner","Nachtfalke","Blutrausch","Mantastrahl","Nebelschleier","Silberpfeil","Haifischzahn","Donnerkeil","Nordwind","Totenstille","Meeresauge","Sturmglocke","Barrakuda","Perlentaucher","Kielbrecher","Bugwelle","Seemannsbraut"];
const CN=["Riesenkrake","Seeschlange","Geisterpiraten","Untote Matrosen","Riffhaie","Meereswachter","Sumpfkrokodil","Giftige Quallen","Sirenen","Wasserelementar","Skelettcrew","Seehexe","Seeteufel","Tiefseeangler","Piranha-Schwarm","Zombiepiraten","Voodoo-Golem","Sturmgeist","Nebeldamon","Korallenwachter","Lava-Krabbe","Vulkandrache","Bermuda-Phantom","Krakentier","Geisterschiff-Crew","Riffwachter","Tentakelhorror","Schattentaucher","Flutwurm","Muschelgolem","Gezeitenbestie","Feuerfisch","Hai-Koenig","Algen-Ungeheuer","Todesrochen","Muraenen-Pack","Kugelfisch-Riese","Barrakuda-Rudel","Hammerhai","Eiskralle","Tiefseekrake","Leviathan-Junges"];
const ADJ=["verfluchte","goldene","vergessene","gespenstische","uralte","verrostete","leuchtende","mysterioese","finstere","verborgene","heilige","verdammte","zerbrochene","legendaere","verschollene","geheime","stuermische","tosende","neblige","dunkle","brennende","eisige","giftige","schimmernde","donnernde","blutige","silberne","knoecherne","kristallene","schwarze","korallenrote","smaragdgruene","verfallene","pechschwarze","glutrote","mondbeleuchtete","sturmgepeitschte","toedliche","betoerende","truegerische","verzauberte","verwunschene"];
const TN=["Aztekengold","Rubinkrone","Smaragdkelch","Neptuns Dreizack","Sirenenharfe","Goldener Kompass","Krakens Herz","Davy Jones Schluessel","Poseidons Guertel","Geisterkette","Schwarzer Opal","Blutrubin","Mondperle","Sonnenstein","Vulkanjuwel","Korallendiadem","Gezeitenring","Sturmbrecher-Amulett","Meerjungfrauen-Traene","Piratenkoenigssiegel","Goldanker","Kristallschadel","Flammenherz","Sternensaphir","Windrose des Schicksals","Leuchtstein","Schattenkristall","Diamantsabel","Platinmedaillon","Jadeschlange","Obsidianmaske","Elfenbeinkrone","Phoenixfeder","Leviathans Schuppe","Titanenhelm","Weltenkompass","Zeitmuschel","Schicksalswuerfel"];
const CARGO=["Rum","Gewuerze","Seide","Elfenbein","Tabak","Zucker","Tee","Kanonenpulver","Silberbarren","Goldmuenzen","Edelsteine","Waffen","Medizin","Holz","Salz"];
const LOC=["in einer Felshoehle","am Strand","in einem Wrack","unter Wasser","auf einer Klippe","in einem Dschungel","in einer Ruine","in einem Vulkankrater","auf einem Riff","in einer Grotte","auf einer Sandbank","zwischen Mangroven"];

function ft(t){return t.replace(/\{pn\}/g,()=>pick(PN)).replace(/\{sn\}/g,()=>pick(SN)).replace(/\{cn\}/g,()=>pick(CN)).replace(/\{adj\}/g,()=>pick(ADJ)).replace(/\{tn\}/g,()=>pick(TN)).replace(/\{cargo\}/g,()=>pick(CARGO)).replace(/\{loc\}/g,()=>pick(LOC));}
function mkE(n,d){const b=3+d*2;return{name:n,nk:b+roll(3),hp:b+roll(4),rw:Math.floor(d/2)};}

// Event types: combat, choice, loot, heal, nothing, legendary, skilltest, curse, trade
// skilltest: {stat:"st"|"ge"|"in_", diff:N, pass:{...rewards}, fail:{...rewards}}
const EVT={
flach:[
d=>({text:ft("Ein {adj} Handelsschiff der {sn} kreuzt euren Kurs."),type:"choice",opts:["Handel treiben","Ueberfallen","Vorbeifahren"],rews:[{gold:3+roll(5),ruhm:1},{combat:mkE("Handelsschiff-Wachen",d),reward:{gold:10+roll(8),ruhm:2,fame:1}},{}]}),
d=>({text:ft("Treibgut der gesunkenen {sn}! Faesser mit {cargo}!"),type:"loot",gold:3+roll(6),ruhm:1}),
d=>({text:ft("{cn} tauchen aus der Tiefe auf!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:roll(5),ruhm:2,fame:1}}),
d=>({text:ft("Fischer bieten frischen Fang an."),type:"heal",amount:2+roll(2)}),
d=>({text:ft("Flaschenpost! Eine {adj} Schatzkarte von {pn}!"),type:"loot",ruhm:3,fame:1}),
d=>({text:ft("Ein {adj} Kauffahrteischiff mit {cargo} in Seenot!"),type:"choice",opts:["Retten","Pluendern","Ignorieren"],rews:[{ruhm:4,fame:2,gold:roll(5)},{gold:10+roll(8),ruhm:-1},{}]}),
d=>({text:ft("Delfine begleiten euer Schiff! Moral steigt!"),type:"loot",ruhm:1,rum:2}),
d=>({text:ft("Marine-Kutter patrouilliert! Schnell reagieren!"),type:"skilltest",stat:"ge",diff:4+d,pass:{ruhm:3,fame:1},fail:{combat:mkE("Marine-Soldaten",d+1),reward:{gold:12,ruhm:3,fame:2}}}),
d=>({text:ft("Piratenkapitaen {pn} fordert zum Wuerfelduell!"),type:"choice",opts:["Annehmen (Glueck!)","Ablehnen"],rews:[Math.random()>.5?{gold:8,ruhm:2,fame:1}:{gold:-5,ruhm:-1},{}]}),
d=>({text:ft("Euer Ausguck entdeckt eine {adj} Insel!"),type:"skilltest",stat:"in_",diff:3+d,pass:{gold:6+roll(8),ruhm:3,fame:2},fail:{ruhm:1}}),
d=>({text:ft("Sturm zieht auf! Euer Navigator muss das Schiff steuern!"),type:"skilltest",stat:"ge",diff:5+d,pass:{ruhm:3,fame:1},fail:{gold:-3}}),
d=>({text:ft("Schwimmende Leichen — Ueberreste einer Schlacht."),type:"choice",opts:["Durchsuchen","Weiterfahren"],rews:[{gold:3+roll(4),ruhm:1},{}]}),
d=>({text:ft("Ein alter Matrose treibt auf einem Fass. Er kennt {tn}!"),type:"loot",ruhm:4,fame:2}),
d=>({text:ft("Ruhige See. Ein guter Tag zum Segeln."),type:"nothing"}),
d=>({text:ft("Ein {adj} Handelsposten auf einer kleinen Insel."),type:"trade",gold:roll(5)}),
],handel:[
d=>({text:ft("Schwer beladene Galeone {sn} mit {cargo}! Kapitaen {pn} wirkt nervoes."),type:"choice",opts:["Ueberfallen","Handeln","Lassen"],rews:[{combat:mkE("Galeonen-Wachen",d+1),reward:{gold:15+roll(15),ruhm:3,fame:2}},{gold:5+roll(5)},{}]}),
d=>({text:ft("Konvoi mit {cargo}! Starke Eskorte. Nachts angreifen?"),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:20+roll(10),ruhm:4,fame:2},fail:{combat:mkE("Konvoi-Eskorte",d+2),reward:{gold:25+roll(15),ruhm:5,fame:3}}}),
d=>({text:ft("Schmuggler {pn} bietet {cargo} billig an."),type:"skilltest",stat:"in_",diff:4+d,pass:{gold:5,ruhm:2},fail:{gold:-8,ruhm:-1}}),
d=>({text:ft("Sinkender Frachter! {cargo} treibt herum!"),type:"loot",gold:6+roll(10),ruhm:2}),
d=>({text:ft("Marine-Fregatte {sn}! Kampfflagge!"),type:"combat",enemy:mkE("Marine-Fregatte",d+2),reward:{gold:15+roll(10),ruhm:4,fame:3}}),
d=>({text:ft("{pn} bietet Allianz gegen die Marine an."),type:"choice",opts:["Allianz","Ablehnen"],rews:[{ruhm:5,fame:2},{}]}),
d=>({text:ft("Passagierschiff mit reichen Kaufleuten!"),type:"choice",opts:["Ueberfallen","In Ruhe lassen"],rews:[{combat:mkE("Leibwaechter",d),reward:{gold:20+roll(10),ruhm:2,fame:2}},{ruhm:1}]}),
d=>({text:ft("Haendler will {cargo} gegen Gold tauschen."),type:"trade",gold:3+roll(4)}),
],sumpf:[
d=>({text:ft("Ein {adj} Krokodil lauert im trueben Wasser!"),type:"combat",enemy:mkE("Sumpfkrokodil",d),reward:{gold:roll(4),ruhm:2,fame:1}}),
d=>({text:ft("Giftnebel steigt auf! Durchfahren erfordert Staerke!"),type:"skilltest",stat:"st",diff:4+d,pass:{ruhm:3,fame:1},fail:{heal:-2}}),
d=>({text:ft("Voodoo-Priesterin {pn} in einer Stelzenhuette."),type:"choice",opts:["Besuchen","Meiden"],rews:[Math.random()>.4?{ruhm:4,fame:2,heal:3,removeCurse:true}:{curse:true,ruhm:-1},{}]}),
d=>({text:ft("Mangroven verklemmen den Kiel!"),type:"skilltest",stat:"st",diff:3+d,pass:{ruhm:2},fail:{gold:-2}}),
d=>({text:ft("Versunkenes Piratenlager mit Goldkisten!"),type:"loot",gold:6+roll(8),ruhm:2,fame:1}),
d=>({text:ft("{cn} erheben sich aus dem Morast!"),type:"combat",enemy:mkE(ft("{cn}"),d+1),reward:{gold:roll(6),ruhm:3,fame:2}}),
d=>({text:ft("Alligatoren bewachen ein {adj} Nest voller Edelsteine."),type:"choice",opts:["Pluendern","Zu gefaehrlich"],rews:[{combat:mkE("Alligator-Pack",d),reward:{gold:12+roll(8),ruhm:3,fame:2}},{}]}),
d=>({text:ft("Geheimer Wasserweg! Navigator-Geschick gefragt!"),type:"skilltest",stat:"in_",diff:4+d,pass:{ruhm:4,fame:2},fail:{ruhm:0}}),
],riff:[
d=>({text:ft("Schiff laeuft auf ein {adj} Riff!"),type:"skilltest",stat:"ge",diff:4+d,pass:{ruhm:2},fail:{gold:-5}}),
d=>({text:ft("Etwas Goldenes glitzert unter Wasser!"),type:"skilltest",stat:"ge",diff:3+d,pass:{gold:8+roll(10),ruhm:2,fame:1},fail:{heal:-1}}),
d=>({text:ft("{cn} verteidigen das Riff!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:roll(6),ruhm:3,fame:1}}),
d=>({text:ft("Schiffswrack der {sn} auf dem Riffgrund!"),type:"choice",opts:["Erkunden","Weiter"],rews:[{gold:10+roll(8),ruhm:4,fame:2},{}]}),
d=>({text:ft("Perlenmuscheln! Euer Taucher jubelt."),type:"loot",gold:5+roll(8),ruhm:2}),
d=>({text:ft("Ein {adj} Strudel zwischen den Korallen!"),type:"skilltest",stat:"ge",diff:5+d,pass:{ruhm:4,fame:2},fail:{gold:-3}}),
d=>({text:ft("{adj} Unterwasserhoehle — darin glitzert es!"),type:"choice",opts:["Reintauchen","Zu gefaehrlich"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:5,fame:3}:{combat:mkE("Hoehlenwachter",d+2),reward:{gold:20,ruhm:4,fame:3}},{}]}),
],hai:[
d=>({text:ft("HAAAIIII! Ein {adj} Weisser Hai!"),type:"combat",enemy:mkE("Weisser Hai",d+1),reward:{gold:roll(4),ruhm:4,fame:2}}),
d=>({text:ft("Haifisch-Arena! {pn} laed zum Wetten ein!"),type:"choice",opts:["Wetten (5G)","Selbst kaempfen","Meiden"],rews:[Math.random()>.5?{gold:10,ruhm:2}:{gold:-5},{combat:mkE("Arena-Hai",d+1),reward:{gold:15,ruhm:5,fame:3}},{}]}),
d=>({text:ft("Hai-Blut-Krieger von {pn}s Clan!"),type:"choice",opts:["Verhandeln","Angreifen"],rews:[{ruhm:2,fame:1},{combat:mkE("Hai-Krieger",d+1),reward:{gold:10,ruhm:4,fame:2}}]}),
d=>({text:ft("Im Magen eines erlegten Hais: ein {adj} Schwert!"),type:"loot",gold:8+roll(6),ruhm:3,fame:1}),
d=>({text:ft("Hammerhaie blockieren die Durchfahrt! Mut gefragt!"),type:"skilltest",stat:"st",diff:5+d,pass:{ruhm:4,fame:2},fail:{heal:-2}}),
],geister:[
d=>({text:ft("Geisterschiff aus dem Nebel! Die {sn}!"),type:"combat",enemy:mkE("Geisterpiraten",d+2),reward:{gold:12+roll(10),ruhm:5,fame:3}}),
d=>({text:ft("Geist von Kapitaen {pn} sucht Rache!"),type:"choice",opts:["Befragen","Fliehen","Voodoo-Ritual"],rews:[{ruhm:5,fame:3},{ruhm:-1},{ruhm:6,fame:4,gold:roll(8)}]}),
d=>({text:ft("{adj} Friedhof — Graeber von Piratenlegenden."),type:"choice",opts:["Graeber oeffnen","Respekt zollen"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:3,fame:2}:{combat:mkE("Untote Piraten",d+2),reward:{gold:10,ruhm:4,fame:3}},{ruhm:3,fame:2}]}),
d=>({text:ft("Irrlichter im Nebel! Intelligenz gefragt!"),type:"skilltest",stat:"in_",diff:5+d,pass:{gold:10+roll(8),ruhm:5,fame:3},fail:{curse:true}}),
d=>({text:ft("Skelettkrieger erheben sich aus dem Sand!"),type:"combat",enemy:mkE("Skelettarmee",d+2),reward:{gold:8+roll(8),ruhm:5,fame:3}}),
d=>({text:ft("Eine {adj} Truhe — offensichtlich Falle."),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:20+roll(10),ruhm:3},fail:{combat:mkE("Geisterwachter",d+2),reward:{gold:15,ruhm:5,fame:3}}}),
],nebel:[
d=>({text:ft("Schreie im Nebel! Schiff wird von {cn} angegriffen!"),type:"choice",opts:["Zu Hilfe eilen","Weiterfahren"],rews:[{combat:mkE(ft("{cn}"),d+1),reward:{gold:10,ruhm:6,fame:3}},{}]}),
d=>({text:ft("Nebel lichtet sich — {adj} Insel!"),type:"loot",gold:5+roll(8),ruhm:3,fame:2}),
d=>({text:ft("Kompass dreht sich wild! Navigator-Test!"),type:"skilltest",stat:"in_",diff:5+d,pass:{ruhm:4,fame:2},fail:{ruhm:-2}}),
d=>({text:ft("Stimmen singen — Sirenen!"),type:"skilltest",stat:"in_",diff:4+d,pass:{ruhm:3},fail:{combat:mkE("Sirenen",d+1),reward:{gold:8,ruhm:4,fame:2}}}),
d=>({text:ft("{adj} Leuchtturm — wer betreibt ihn?"),type:"choice",opts:["Anlegen","Vorbeifahren"],rews:[Math.random()>.5?{gold:6,ruhm:4,fame:2,heal:2}:{combat:mkE("Leuchtturm-Falle",d+1),reward:{gold:12,ruhm:3,fame:2}},{}]}),
],festung:[
d=>({text:ft("Kanonenbeschuss! Entdeckt!"),type:"combat",enemy:mkE("Festungskanonen",d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}}),
d=>({text:ft("Ein {adj} Geheimgang unter die Mauern!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:25+roll(15),ruhm:7,fame:5},fail:{combat:mkE("Festungswachen",d+2),reward:{gold:20,ruhm:6,fame:4}}}),
d=>({text:ft("Gefangene Piraten! Befreiungsaktion?"),type:"choice",opts:["Befreien","Unmoeglich"],rews:[{combat:mkE("Garnison",d+2),reward:{ruhm:8,fame:5,gold:5}},{}]}),
d=>({text:ft("Die Schatzkammer! Aber schwer bewacht."),type:"choice",opts:["Ueberfall!","Schleichen"],rews:[{combat:mkE("Elitegarde",d+3),reward:{gold:30+roll(20),ruhm:8,fame:5}},{gold:15+roll(10),ruhm:5,fame:3}]}),
],vulkan:[
d=>({text:ft("Lavastrme! Dampfwolken!"),type:"skilltest",stat:"ge",diff:5+d,pass:{ruhm:5,fame:3},fail:{gold:-5}}),
d=>({text:ft("In einer Lavahoehle: {adj} Drache bewacht {tn}!"),type:"combat",enemy:mkE("Vulkandrache",d+3),reward:{gold:20+roll(15),ruhm:8,fame:5}}),
d=>({text:ft("Heisse Quellen! Die Crew badet."),type:"heal",amount:4}),
d=>({text:ft("Ausbruch! Feuerbomben!"),type:"skilltest",stat:"ge",diff:6+d,pass:{ruhm:5,fame:2},fail:{heal:-3}}),
d=>({text:ft("{adj} Obsidianwaffen — schaerfer als Stahl!"),type:"loot",gold:10+roll(8),ruhm:4,fame:2}),
d=>({text:ft("Feuerelementar erhebt sich aus der Lava!"),type:"combat",enemy:mkE("Feuerelementar",d+3),reward:{gold:12+roll(10),ruhm:6,fame:4}}),
],bermuda:[
d=>({text:ft("Die Zeit verzerrt sich!"),type:"skilltest",stat:"in_",diff:6+d,pass:{ruhm:6,fame:4},fail:{curse:true}}),
d=>({text:ft("Dimensionsriss! Dahinter: {adj} Welt!"),type:"choice",opts:["Hindurch!","Nein danke"],rews:[Math.random()>.4?{gold:30+roll(20),ruhm:8,fame:5}:{combat:mkE("Dimensionswachter",d+3),reward:{gold:20,ruhm:6,fame:4}},{ruhm:2}]}),
d=>({text:ft("Strudel! Schiff wird erfasst!"),type:"skilltest",stat:"st",diff:6+d,pass:{ruhm:5,fame:3},fail:{gold:-10,ruhm:-2}}),
d=>({text:ft("{cn} aus anderer Dimension!"),type:"combat",enemy:mkE("Dimensionsbestie",d+3),reward:{gold:15+roll(10),ruhm:7,fame:4}}),
],tiefsee:[
d=>({text:ft("DER KRAKEN! Riesige Tentakel!!!"),type:"combat",enemy:mkE("Maechtiger Kraken",d+4),reward:{gold:20+roll(15),ruhm:10,fame:6}}),
d=>({text:ft("Versunkene Stadt in der Tiefe!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:15+roll(15),ruhm:7,fame:4},fail:{heal:-2}}),
d=>({text:ft("{adj} Riesenquallen — wunderschoen und toedlich."),type:"skilltest",stat:"in_",diff:5+d,pass:{ruhm:5,fame:3},fail:{combat:mkE("Riesenquallen",d+2),reward:{gold:8,ruhm:4,fame:2}}}),
d=>({text:ft("Leviathan! Uralte Bestie!"),type:"combat",enemy:mkE("Leviathan",d+5),reward:{gold:25+roll(20),ruhm:12,fame:8}}),
],unterwasser:[
d=>({text:ft("Davy Jones persoenlich!"),type:"choice",opts:["Verhandeln","Kaempfen"],rews:[{ruhm:8,fame:5},{combat:mkE("Davy Jones",d+5),reward:{gold:30,ruhm:15,fame:10}}]}),
d=>({text:ft("Davy Jones Schatzkammer!"),type:"loot",gold:20+roll(20),ruhm:8,fame:5}),
d=>({text:ft("{cn} in Jones Diensten!"),type:"combat",enemy:mkE("Jones Waechter",d+4),reward:{gold:15+roll(10),ruhm:8,fame:5}}),
d=>({text:ft("Untote bieten Pakt: Gold gegen Gefallen."),type:"choice",opts:["Annehmen","Ablehnen"],rews:[{gold:15+roll(10),ruhm:-2,curse:true},{ruhm:3,fame:2}]}),
d=>({text:ft("{adj} Perle gigantischer Groesse — {tn}!"),type:"loot",gold:25+roll(15),ruhm:10,fame:6}),
],schatz:[
d=>({text:ft("X markiert die Stelle!"),type:"skilltest",stat:"in_",diff:5+d,pass:{gold:25+roll(20),ruhm:8,fame:5},fail:{combat:mkE("Schatzhueter",d+3),reward:{gold:30,ruhm:10,fame:6}}}),
d=>({text:ft("{adj} Schatzkammer von {pn}!"),type:"loot",gold:20+roll(15),ruhm:8,fame:5}),
d=>({text:ft("Pirat {pn} ist schon da! Wettlauf!"),type:"combat",enemy:mkE(ft("Kapitaen {pn}s Crew"),d+3),reward:{gold:20+roll(15),ruhm:6,fame:4}}),
d=>({text:ft("DER LEGENDAERE SCHATZ! {tn}!"),type:"legendary"}),
d=>({text:ft("Fallen ueberall! Geschick gefragt!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:15+roll(10),ruhm:5,fame:3},fail:{heal:-3}}),
],thron:[
d=>({text:ft("Rat der Piratenkapitaene! Nur der Wuerdigste wird Koenig!"),type:"combat",enemy:mkE("Rivalen-Kapitaene",d+4),reward:{ruhm:15,fame:10,gold:20}}),
d=>({text:ft("Die {adj} Krone der Sieben Meere!"),type:"legendary"}),
d=>({text:ft("Kapitaen {pn} fordert zum Duell!"),type:"combat",enemy:mkE("Piratenkoenig",d+5),reward:{ruhm:20,fame:15,gold:30}}),
],verlies:[
d=>({text:ft("Giftschlangen! Geschick!"),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:10+roll(8),ruhm:4,fame:3},fail:{combat:mkE("Riesenschlangen",d+2),reward:{gold:10,ruhm:4,fame:3}}}),
d=>({text:ft("{adj} Schatztruhe — Fallen!"),type:"skilltest",stat:"ge",diff:4+d,pass:{gold:12+roll(10),ruhm:4,fame:2},fail:{heal:-2}}),
d=>({text:ft("Skelette ehemaliger Abenteurer. Bei einem: {tn}!"),type:"loot",gold:8+roll(8),ruhm:5,fame:3}),
d=>({text:ft("{cn} bewacht den tiefsten Raum!"),type:"combat",enemy:mkE(ft("{cn}"),d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}}),
d=>({text:ft("Inschrift: Kehrt um oder sterbt! Mut gefragt!"),type:"skilltest",stat:"st",diff:5+d,pass:{gold:20+roll(10),ruhm:6,fame:4},fail:{combat:mkE("Verlieshueter",d+3),reward:{gold:15,ruhm:5,fame:3}}}),
],hafen:[
d=>({text:ft("Tavernenprugelei! {pn} beleidigt eure Crew!"),type:"skilltest",stat:"st",diff:3+d,pass:{ruhm:2,fame:1,gold:3},fail:{gold:-2}}),
d=>({text:ft("Geruechte: {tn} soll {loc} versteckt sein!"),type:"loot",ruhm:3,fame:2}),
d=>({text:ft("Die Crew feiert! Rum fliesst!"),type:"loot",ruhm:1,rum:3}),
d=>({text:ft("Taschendieb!"),type:"skilltest",stat:"ge",diff:3+d,pass:{gold:5,ruhm:2},fail:{gold:-4}}),
d=>({text:ft("{pn} bietet Geheimwissen ueber die {sn} fuer 8 Gold."),type:"choice",opts:["Kaufen (8G)","Ablehnen"],rews:[{gold:-8,ruhm:4,fame:2},{}]}),
d=>({text:ft("Bordell & Spielhoelle — die Crew will an Land!"),type:"choice",opts:["Erlauben (-5G)","Verbieten"],rews:[{gold:-5,rum:5,ruhm:1},{ruhm:-1}]}),
],dorf:[
d=>({text:ft("Fischer bitten um Hilfe: {cn}!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:5+roll(5),ruhm:3,fame:2}}),
d=>({text:ft("Dorfaeltester kennt den Weg zu {adj} Schatz {loc}."),type:"loot",ruhm:3,fame:2}),
d=>({text:ft("Frische Vorraete! Crew ist dankbar."),type:"heal",amount:3}),
d=>({text:ft("Kinder bewundern eure Crew! Moral steigt."),type:"loot",ruhm:2,rum:1}),
d=>({text:ft("Schmied verbessert Waffen gratis!"),type:"loot",ruhm:2}),
],
};

function genEvent(rType,fame){const d=Math.floor(fame/10);const pool=EVT[rType]||EVT.flach;return{...pick(pool)(d),w100:d100()};}

// ═══════════════════════════════════════════════════════════
//  GAME HELPERS (UltraQuest-style)
// ═══════════════════════════════════════════════════════════
function roll4d6Drop(){const d=[roll(6),roll(6),roll(6),roll(6)];d.sort((a,b)=>a-b);return{dice:d,total:d[1]+d[2]+d[3],dropped:d[0]};}
function createHero(name,rK,pK,bonus){
  const r=RACES[rK],p=PROFS[pK];
  const h={id:uid(),name,race:rK,profession:pK,bw:r.bw+(bonus?.bw||0),st:r.st+(bonus?.st||0),ge:r.ge+(bonus?.ge||0),in_:r.in_+(bonus?.in_||0),equipment:[],skills:[p.skills[0]],unlockedSkills:1,emoji:r.emoji};
  h.maxHp=r.hp+h.st; h.hp=h.maxHp;
  return h;
}
// NK = sum of (ST + profNK + weapon NK) for living heroes. UltraQuest: per hero W6 + NK
function heroNK(h){return h.st+(PROFS[h.profession]?.nk||0)+(h.equipment||[]).reduce((s,e)=>s+(e.nk||0),0);}
function heroFK(h){return h.ge+(PROFS[h.profession]?.fk||0)+(h.equipment||[]).reduce((s,e)=>s+(e.fk||0),0);}
function heroRW(h){return(h.equipment||[]).reduce((s,e)=>s+(e.rw||0),0);}
// Skill test: W6 + relevant stat >= difficulty
function skillTest(heroes,stat,diff){
  const best=heroes.filter(h=>h.hp>0).reduce((b,h)=>(!b||h[stat]>b[stat])?h:b,null);
  if(!best)return{success:false,hero:null,rolled:0,total:0,diff};
  const rolled=d6();
  const total=rolled+best[stat];
  return{success:total>=diff,hero:best,rolled,total,diff};
}

// ═══════════════════════════════════════════════════════════
//  THEME & UI PRIMITIVES (outside App for stable refs!)
// ═══════════════════════════════════════════════════════════
const T={bg:"#0a0e14",card:"#141c26",cardL:"#1e2a38",gold:"#D4A843",goldL:"#F0D78C",goldD:"#8B6914",sea:"#0C3547",seaL:"#1a5276",red:"#C62828",green:"#1B5E20",blue:"#0D47A1",txt:"#E8DCC8",txtD:"#7A6E5A",border:"#2a3a4a",parch:"#F5E6C8"};
const fonts=`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');`;

const Btn=({children,onClick,primary,danger,disabled,small,style:s})=>(<button onClick={onClick} disabled={disabled} style={{padding:small?"8px 12px":"14px 20px",border:`1px solid ${danger?T.red:T.gold}`,borderRadius:10,background:primary?`linear-gradient(135deg,${T.gold},${T.goldD})`:danger?T.red+"22":T.card,color:primary?T.bg:danger?"#ff8a80":T.gold,fontFamily:"'Cinzel',serif",fontSize:small?12:14,fontWeight:700,cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,width:"100%",textAlign:"center",transition:"all .15s",...s}}>{children}</button>);
const Card=({children,style:s})=>(<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:10,...s}}>{children}</div>);
const Badge=({children,color})=>(<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,background:(color||T.gold)+"28",color:color||T.gold,fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",marginRight:4}}>{children}</span>);
const SB=({label,value,color})=>(<div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:T.txtD,fontFamily:"'Cinzel',serif"}}>{label}</div><div style={{fontSize:17,fontWeight:900,color:color||T.gold,fontFamily:"'Cinzel',serif"}}>{value}</div></div>);
const DiceFace=({val,dropped})=>(<div style={{width:40,height:40,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:dropped?"#44444444":T.goldD+"44",border:`2px solid ${dropped?T.red+"66":T.gold}`,color:dropped?T.red:T.goldL,fontSize:20,fontWeight:900,fontFamily:"'Cinzel',serif",opacity:dropped?0.4:1,textDecoration:dropped?"line-through":"none"}}>{val}</div>);

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App(){
  const[phase,setPhase]=useState("menu");
  const[gameId,setGameId]=useState("");const[playerId,setPlayerId]=useState("");const[playerName,setPlayerName]=useState("");
  const[game,setGame]=useState(null);const[joinCode,setJoinCode]=useState("");
  const[ev,setEv]=useState(null);const[combat,setCombat]=useState(null);const[cLog,setCLog]=useState([]);
  const[msg,setMsg]=useState("");const[testResult,setTestResult]=useState(null);
  const[setupIdx,setSetupIdx]=useState(0);const[heroes,setHeroes]=useState([null,null,null,null]);
  const[cStep,setCStep]=useState("name");
  const[tName,setTName]=useState("");const[tRace,setTRace]=useState(null);const[tProf,setTProf]=useState(null);
  const[diceRolls,setDiceRolls]=useState([]);const[statAssign,setStatAssign]=useState({bw:0,st:0,ge:0,in_:0});
  const[startGold,setStartGold]=useState(0);
  const pollRef=useRef(null);

  useEffect(()=>{if(phase==="playing"||phase==="lobby"){pollRef.current=setInterval(async()=>{if(gameId){const g=await api.load(gameId);if(g)setGame(g);}},3000);}return()=>{if(pollRef.current)clearInterval(pollRef.current);};},[phase,gameId]);

  const me=game?.players?.find(p=>p.id===playerId);
  const isMyTurn=game?.players?.[game?.currentPlayerIndex]?.id===playerId;
  const curReg=me?REGIONS.find(r=>r.id===me.position):null;
  const myShip=SHIPS.find(s=>s.id===(me?.ship||"jolle"))||SHIPS[0];

  const Toast=()=>msg?(<div onClick={()=>setMsg("")} style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:T.goldD,color:T.parch,padding:"8px 20px",borderRadius:12,zIndex:999,fontFamily:"'Crimson Text',serif",fontSize:14,boxShadow:"0 4px 24px #000a",cursor:"pointer",maxWidth:"88vw"}}>{msg}</div>):null;

  // ── GAME ACTIONS ──
  const createGame=async()=>{if(!playerName.trim()){setMsg("Name!");return;}const gid=uid(),pid=uid();
    const g={id:gid,turn:1,currentPlayerIndex:0,log:[],players:[{id:pid,name:playerName.trim(),position:"tortuga",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false}],phase:"lobby",winner:null};
    await api.create(g);setGameId(gid);setPlayerId(pid);setGame(g);setPhase("lobby");};
  const joinGame=async()=>{if(!playerName.trim()||!joinCode.trim()){setMsg("Name & Code!");return;}const g=await api.load(joinCode.trim());if(!g){setMsg("Nicht gefunden!");return;}if(g.players.length>=2){setMsg("Voll!");return;}
    const pid=uid();g.players.push({id:pid,name:playerName.trim(),position:"puerto",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false});
    await api.save(g);setGameId(g.id);setPlayerId(pid);setGame(g);setPhase("lobby");};

  // Setup
  const startSetup=()=>{setSetupIdx(0);setHeroes([null,null,null,null]);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);setStatAssign({bw:0,st:0,ge:0,in_:0});setStartGold(0);setPhase("setup");};
  const rollStats=()=>{const r=[roll4d6Drop(),roll4d6Drop(),roll4d6Drop(),roll4d6Drop()];setDiceRolls(r);setStatAssign({bw:r[0].total,st:r[1].total,ge:r[2].total,in_:r[3].total});};
  const swapA=(a,b)=>{const n={...statAssign};const t=n[a];n[a]=n[b];n[b]=t;setStatAssign(n);};
  const confirmHero=()=>{
    const hero=createHero(tName.trim(),tRace,tProf,statAssign);
    const nh=[...heroes];nh[setupIdx]=hero;setHeroes(nh);setCStep("gold");
  };
  const rollGold=()=>{setStartGold((d6()+d6()+d6())*3);};
  const buyStartItem=(item)=>{if(startGold<item.cost){setMsg("Kein Gold!");return;}setStartGold(startGold-item.cost);
    const hero=heroes[setupIdx];if(hero&&!item.rum&&!item.heal){hero.equipment=[...(hero.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji}];setMsg(`${hero.name}: ${item.name}!`);setHeroes([...heroes]);}else{setMsg("Gekauft!");}};
  const nextHero=()=>{if(setupIdx<3){setSetupIdx(setupIdx+1);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);}else setCStep("done");};
  const finishSetup=async()=>{if(heroes.some(h=>!h)){setMsg("Alle 4!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    g.players[pi]={...g.players[pi],heroes,gold:startGold,ready:true};if(g.players.every(p=>p.ready))g.phase="playing";
    await api.save(g);setGame(g);setPhase(g.players.every(p=>p.ready)?"playing":"lobby");};

  // Game actions
  const endTurn=async(g)=>{g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);};
  const moveTo=async rid=>{if(!isMyTurn)return;const r=REGIONS.find(x=>x.id===rid);if(me.fame<r.minF){setMsg(`${r.minF}⭐ noetig!`);return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi]={...g.players[pi],position:rid};await api.save(g);setGame(g);triggerEvent(r);};
  const triggerEvent=r=>{setEv(genEvent(r.type,me.fame));setTestResult(null);setPhase("event");};
  const explore=()=>{if(!isMyTurn)return;triggerEvent(curReg);};

  const applyReward=async(rw)=>{
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    const bonus=me.fame>=75?2:1;
    g.players[pi].gold=Math.max(0,(g.players[pi].gold||0)+((rw.gold||0)*bonus));
    g.players[pi].ruhm=Math.max(0,(g.players[pi].ruhm||0)+((rw.ruhm||0)*bonus));
    g.players[pi].fame=Math.max(0,(g.players[pi].fame||0)+((rw.fame||0)*bonus));
    if(rw.rum)g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)+rw.rum);
    if(rw.heal)g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+rw.heal);});
    if(rw.curse){const c=pick(CURSES);g.players[pi].curses=[...(g.players[pi].curses||[]),c];setMsg(`VERFLUCHT: ${c.name}!`);}
    if(rw.removeCurse&&(g.players[pi].curses||[]).length>0){g.players[pi].curses.pop();setMsg("Fluch entfernt!");}
    if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return true;}
    return false;
  };

  const resolveEvent=async ci=>{
    if(ev.type==="legendary"){const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.winner={id:playerId,name:g.players[pi].name,type:"legendary"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
    if(ev.type==="combat"){startCombat(ev.enemy,ev.reward);return;}
    if(ev.type==="skilltest"){
      const res=skillTest(me.heroes,ev.stat,ev.diff);setTestResult(res);
      return; // User sees result, then clicks resolve
    }
    let rw={};
    if(ev.type==="choice"&&ci!==undefined){const r=ev.rews[ci];if(r?.combat){startCombat(r.combat,r.reward||r);return;}rw=r||{};}
    else if(ev.type==="heal"){rw={heal:ev.amount||2};}
    else{rw={gold:ev.gold||0,ruhm:ev.ruhm||0,fame:ev.fame||0,rum:ev.rum||0};}
    const won=await applyReward(rw);if(won)return;
    const g={...game};g.log.push(`${me.name}: ${(ev.text||"").slice(0,40)}...`);await endTurn(g);setEv(null);setPhase("playing");
  };

  const resolveSkillTest=async(passed)=>{
    const rw=passed?ev.pass:ev.fail;
    if(rw?.combat){startCombat(rw.combat,rw.reward||rw);return;}
    if(rw?.heal){const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
      // Negative heal = damage to random hero
      if(rw.heal<0){const alive=g.players[pi].heroes.filter(h=>h.hp>0);if(alive.length){const t=pick(alive);t.hp=Math.max(0,t.hp+rw.heal);}}
    }
    const won=await applyReward(rw||{});if(won)return;
    const g={...game};g.log.push(`${me.name}: ${(ev.text||"").slice(0,40)}...`);await endTurn(g);setEv(null);setTestResult(null);setPhase("playing");
  };

  // Combat (UltraQuest-style: per hero W6 + NK vs enemy W6s + NK)
  const startCombat=(enemy,reward)=>{setCombat({enemy:{...enemy,curHp:enemy.hp},reward,round:1});setCLog([`Kampf: ${enemy.name}!`]);setPhase("combat");};
  const doCombatRound=()=>{
    const alive=me.heroes.filter(h=>h.hp>0);if(!alive.length)return;
    // Player side: each hero rolls W6 + their NK
    let pTotal=0;const heroRolls=[];
    alive.forEach(h=>{const r=d6();const nk=heroNK(h);pTotal+=r+nk;heroRolls.push({name:h.name,roll:r,nk,total:r+nk});});
    // Ship bonus (cannons add to total in sea regions)
    const seaRegion=["flach","handel","riff","hai","tiefsee","nebel"].includes(curReg?.type);
    const shipBonus=seaRegion?myShip.kan:0;
    pTotal+=shipBonus;
    // Enemy side: 2 dice + NK (like UltraQuest)
    const eR1=d6(),eR2=d6();const eTotal=eR1+eR2+combat.enemy.nk;
    const logs=[...cLog];
    logs.push(`── Runde ${combat.round} ──`);
    heroRolls.forEach(h=>logs.push(`  ${h.name}: W6(${h.roll})+${h.nk}NK = ${h.total}`));
    if(shipBonus>0)logs.push(`  Schiffskanonen: +${shipBonus}`);
    logs.push(`  CREW GESAMT: ${pTotal}`);
    logs.push(`  ${combat.enemy.name}: W6(${eR1}+${eR2})+${combat.enemy.nk}NK = ${eTotal}`);
    const ne={...combat.enemy};
    if(pTotal>eTotal){
      // Damage to enemy: difference - enemy RW (min 1)
      const dmg=Math.max(1,pTotal-eTotal-(ne.rw||0));
      ne.curHp=Math.max(0,ne.curHp-dmg);
      logs.push(`  => Treffer! ${dmg} Schaden => HP:${ne.curHp}`);
    } else if(eTotal>pTotal){
      // Damage to heroes: distributed to weakest (UltraQuest-style)
      const rawDmg=eTotal-pTotal;
      // Apply to hero with lowest HP (frontline gets hit)
      const target=[...alive].sort((a,b)=>a.hp-b.hp)[0];
      const absorbed=heroRW(target);
      const finalDmg=Math.max(0,rawDmg-absorbed);
      if(finalDmg>0){target.hp=Math.max(0,target.hp-finalDmg);logs.push(`  => ${target.name}: ${finalDmg} Schaden (RW:${absorbed}) => HP:${target.hp}`);}
      else logs.push(`  => Ruestung haelt! (RW:${absorbed})`);
    } else {logs.push(`  => Unentschieden!`);}
    setCombat({...combat,enemy:ne,round:combat.round+1});setCLog(logs);
  };
  const endCombat=async won=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    if(won&&combat.reward){await applyReward(combat.reward);}
    g.players[pi].heroes=me.heroes.map(h=>({...h}));
    if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
    await endTurn(g);setCombat(null);setCLog([]);setEv(null);setPhase("playing");
  };
  const rest=async()=>{if(!isMyTurn)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    const healAmt=curReg?.tavern?5:3; // Taverns heal more (UltraQuest: resting in cities)
    g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+healAmt);});
    const rumCost=(g.players[pi].curses||[]).find(c=>c.id==="mueterei_fluch")?3:1;
    g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)-rumCost);
    g.log.push(`${g.players[pi].name}: Rastet (+${healAmt}HP, -${rumCost}Rum)`);
    await endTurn(g);};
  const buyItem=async item=>{const price=Math.round(item.cost*(SHOP_INV[curReg?.shop]?.pm||1));
    if(me.gold<price){setMsg("Kein Gold!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].gold-=price;
    if(item.rum){g.players[pi].rum=(g.players[pi].rum||0)+item.rum;setMsg(`+${item.rum} Rum`);}
    else if(item.heal){g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+item.heal);});setMsg("Geheilt!");}
    else if(item.ammo){setMsg(`+${item.ammo} Munition`);}
    else{const hero=g.players[pi].heroes.find(h=>h.hp>0&&!(h.equipment||[]).find(e=>e.id===item.id));
      if(hero){hero.equipment=[...(hero.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji}];setMsg(`${hero.name}: ${item.name}!`);}
      else{setMsg("Niemand kann das tragen!");g.players[pi].gold+=price;}}
    await api.save(g);setGame(g);};
  const buyShip=async ship=>{if(me.gold<ship.cost){setMsg("Kein Gold!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    g.players[pi].gold-=ship.cost;g.players[pi].ship=ship.id;setMsg(`Neues Schiff: ${ship.name}!`);await api.save(g);setGame(g);};
  const learnSkill=async(hid,skill)=>{if(me.ruhm<10){setMsg("10 Ruhm!");return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=10;
    const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h.skills=[...(h.skills||[]),skill];h.unlockedSkills=(h.unlockedSkills||1)+1;
      // Skill stat bonuses
      if(["Doppelschlag","Kampfrausch","Schildbrecher"].includes(skill))h.st+=1;
      if(["Windleser","Fluchtexperte","Sturmreiter"].includes(skill))h.bw+=1;
      if(["Feilschen","Kraeuterkunde","Giftkunde","Geisterruf"].includes(skill))h.in_+=1;
      if(["Breitseite","Kettenschuss","Praezisionsschuss"].includes(skill))h.ge+=1;
      if(["Feldchirurg","Wiederbelebung"].includes(skill)){h.in_+=1;}
      setMsg(`${h.name}: ${skill}!`);}
    await endTurn(g);};
  const trainStat=async(hid,stat)=>{if(me.ruhm<8){setMsg("8 Ruhm!");return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=8;
    const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h[stat]=(h[stat]||0)+1;if(stat==="st"){h.maxHp+=1;h.hp+=1;}setMsg(`${h.name}: ${stat.toUpperCase()}+1!`);}
    await endTurn(g);};

  // ═══════════════════════════════════════════════════════════
  //  SCREENS (called as functions, not components!)
  // ═══════════════════════════════════════════════════════════

  const MenuScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 80%,${T.seaL},${T.bg} 70%)`}}>
    <div style={{fontSize:52,marginBottom:8}}>🏴‍☠️</div>
    <div style={{fontSize:11,letterSpacing:8,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRATEN</div>
    <div style={{fontSize:36,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",textShadow:`0 0 40px ${T.gold}44`}}>QUEST</div>
    <div style={{fontSize:12,color:T.txtD,fontFamily:"'Crimson Text',serif",marginBottom:4}}>Herrscher der Sieben Meere</div>
    <div style={{fontSize:9,color:T.txtD+"88",marginBottom:28,textAlign:"center",maxWidth:260}}>Wuerfelt eure Crew • Segelt die Meere • Kaempft & handelt • Werdet Piratenkoenig!</div>
    <div style={{width:"100%",maxWidth:310}}>
      <input placeholder="Euer Piratenname" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
      <Btn primary onClick={createGame}>Neues Spiel</Btn><div style={{height:16}}/>
      <input placeholder="Spielcode" value={joinCode} onChange={e=>setJoinCode(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
      <Btn onClick={joinGame}>Beitreten</Btn>
    </div>
  </div>);

  const LobbyScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:12,color:T.txtD,fontFamily:"'Cinzel',serif"}}>SPIELCODE</div>
      <div style={{fontSize:26,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",letterSpacing:4,background:T.card,padding:"10px 18px",borderRadius:12,display:"inline-block",border:`2px dashed ${T.gold}`,marginTop:6}}>{gameId}</div>
    </div>
    <Card>{game?.players?.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
      <span style={{fontSize:20}}>{i===0?"🏴‍☠️":"⚓"}</span><span style={{color:T.parch,flex:1,fontSize:16}}>{p.name}</span>
      {p.id===playerId&&<Badge>DU</Badge>}{p.ready&&<Badge color={T.green}>BEREIT</Badge>}</div>))}</Card>
    {!me?.ready?<Btn primary onClick={startSetup}>Crew erstellen</Btn>
    :<Card style={{textAlign:"center"}}><div style={{color:T.txtD}}>{game?.players?.every(p=>p.ready)?"Alle bereit!":"Warte auf Mitspieler..."}</div>
      {game?.players?.every(p=>p.ready)&&<div style={{marginTop:10}}><Btn primary onClick={()=>setPhase("playing")}>Auslaufen!</Btn></div>}</Card>}
  </div>);

  // ── CHARACTER CREATION (UltraQuest-style with dice) ──
  const SetupScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:12}}>
      <div style={{fontSize:12,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRAT {setupIdx+1}/4</div>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>{[0,1,2,3].map(i=>(<div key={i} style={{width:32,height:4,borderRadius:2,background:heroes[i]?T.green:i===setupIdx?T.gold:T.border}}/>))}</div>
    </div>
    {cStep==="name"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>Name deines Piraten</div>
      <input placeholder="Name" value={tName} onChange={e=>setTName(e.target.value)} style={{width:"100%",padding:12,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:16,boxSizing:"border-box",marginBottom:10}}/>
      <Btn primary onClick={()=>{if(!tName.trim()){setMsg("Name!");return;}setCStep("race");}}>Weiter</Btn>
    </Card>}
    {cStep==="race"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>RASSE</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setTRace(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tRace===k?T.gold+"28":T.card,border:`1px solid ${tRace===k?T.gold:T.border}`}}>
          <div>{r.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{r.label}</span></div>
          <div style={{fontSize:9,color:T.txtD}}>{r.desc}</div>
          <div style={{fontSize:8,color:T.txtD,marginTop:2}}>BW:{r.bw} ST:{r.st} GE:{r.ge} IN:{r.in_} HP:{r.hp}</div>
        </div>))}</div>
      <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tRace){setMsg("Waehlen!");return;}setCStep("prof");}} disabled={!tRace}>Weiter</Btn></div></>}
    {cStep==="prof"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>BERUF</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setTProf(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tProf===k?T.gold+"28":T.card,border:`1px solid ${tProf===k?T.gold:T.border}`}}>
          <div>{p.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{p.label}</span></div>
          <div style={{fontSize:9,color:T.txtD}}>{p.desc}</div>
          <div style={{fontSize:8,color:T.gold+"88",marginTop:2}}>NK+{p.nk} FK+{p.fk} | {p.skills[0]}</div>
        </div>))}</div>
      <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tProf){setMsg("Waehlen!");return;}setCStep("roll");}} disabled={!tProf}>Wuerfeln!</Btn></div></>}
    {cStep==="roll"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>STATS AUSWUERFELN</div>
      <div style={{fontSize:10,color:T.txtD,marginBottom:10}}>4W6, niedrigster faellt weg = Bonus auf Rassenwerte</div>
      {diceRolls.length===0?<Btn primary onClick={rollStats}>WUERFELN!</Btn>
      :<div>
        {["BW","ST","GE","IN"].map((l,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <div style={{width:28,fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",fontWeight:700}}>{l}</div>
          <div style={{display:"flex",gap:4}}>{diceRolls[i].dice.map((v,j)=>(<DiceFace key={j} val={v} dropped={j===0}/>))}</div>
          <div style={{fontSize:16,fontWeight:900,color:T.goldL,fontFamily:"'Cinzel',serif"}}>+{diceRolls[i].total}</div>
        </div>))}
        <div style={{fontSize:10,color:T.txtD,marginBottom:6}}>Tausche Zuweisungen:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
          {[["bw","st"],["ge","in_"],["bw","ge"],["st","in_"],["bw","in_"],["st","ge"]].map(([a,b])=>(<Btn key={a+b} small onClick={()=>swapA(a,b)}>{a.toUpperCase()}↔{b.toUpperCase()}</Btn>))}
        </div>
        <Card style={{background:T.bg}}>
          <div style={{fontSize:10,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>ENDWERTE (Rasse+Wuerfel)</div>
          <div style={{display:"flex",gap:4}}>
            {[["BW","bw"],["ST","st"],["GE","ge"],["IN","in_"]].map(([l,k])=>(<SB key={k} label={l} value={`${RACES[tRace][k]}+${statAssign[k]}`}/>))}
          </div>
        </Card>
        <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <Btn onClick={()=>{setDiceRolls([]);}}>Neu wuerfeln</Btn>
          <Btn primary onClick={confirmHero}>Uebernehmen</Btn>
        </div>
      </div>}
    </Card>}
    {cStep==="gold"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>STARTGOLD</div>
      {startGold===0?<div><div style={{fontSize:10,color:T.txtD,marginBottom:8}}>3W6 x 3 = Startkapital</div>
        <Btn primary onClick={rollGold}>Gold wuerfeln!</Btn></div>
      :<div>
        <div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:28,fontWeight:900,color:"#FFC107",fontFamily:"'Cinzel',serif"}}>{startGold} Gold</div></div>
        <div style={{fontSize:10,color:T.txtD,marginBottom:6}}>Startausruestung kaufen:</div>
        <div style={{maxHeight:180,overflow:"auto"}}>{ALL_ITEMS.filter(i=>i.tier<=0&&(i.nk||i.fk||i.rw||i.heal||i.rum)).map(item=>(<div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${T.border}22`}}>
          <span style={{fontSize:14}}>{item.emoji}</span>
          <div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{item.name}</div>
            <div style={{fontSize:9,color:T.txtD}}>{item.nk>0?`NK+${item.nk} `:""}{item.fk>0?`FK+${item.fk} `:""}{item.rw>0?`RW+${item.rw} `:""}{item.heal?`Heilt+${item.heal}`:""}{item.rum?`+${item.rum}Rum`:""}</div></div>
          <Btn small primary onClick={()=>buyStartItem(item)} disabled={startGold<item.cost} style={{width:"auto",minWidth:55}}>{item.cost}G</Btn>
        </div>))}</div>
        <div style={{textAlign:"center",marginTop:8}}><Badge color="#FFC107">Uebrig: {startGold}G</Badge></div>
        <div style={{marginTop:8}}><Btn primary onClick={nextHero}>{setupIdx<3?`Pirat ${setupIdx+2}`:"Crew fertig!"}</Btn></div>
      </div>}
    </Card>}
    {cStep==="done"&&<div>
      <Card><div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>EURE CREW</div>
        {heroes.filter(Boolean).map((h,i)=>(<div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"5px 0"}}>
          <span style={{fontSize:16}}>{h.emoji}</span>
          <div style={{flex:1}}><div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</div>
            <div style={{fontSize:9,color:T.txtD}}>BW:{h.bw} ST:{h.st} GE:{h.ge} IN:{h.in_} HP:{h.hp} NK:{heroNK(h)} RW:{heroRW(h)}</div></div>
          <Badge>{PROFS[h.profession]?.label}</Badge>
        </div>))}</Card>
      <Btn primary onClick={finishSetup}>Bereit!</Btn></div>}
  </div>);

  // ── MAP ──
  const MapView=()=>{const conns=curReg?curReg.conn:[];
    return <Card style={{padding:0,overflow:"hidden"}}><div style={{position:"relative",width:"100%",paddingBottom:"110%",background:`linear-gradient(180deg,${T.sea},${T.bg} 50%,#1a120a)`}}>
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        {REGIONS.flatMap(r=>r.conn.map(c=>{const t=REGIONS.find(x=>x.id===c);if(!t||r.id>c)return null;
          return <line key={r.id+c} x1={`${r.x}%`} y1={`${r.y}%`} x2={`${t.x}%`} y2={`${t.y}%`} stroke={conns.includes(r.id)||conns.includes(c)?T.gold+"44":T.border+"22"} strokeWidth={1}/>;}))}
      </svg>
      {REGIONS.map(r=>{const here=me?.position===r.id,canGo=conns.includes(r.id),locked=canGo&&r.minF>me?.fame,other=game?.players?.find(p=>p.id!==playerId&&p.position===r.id);
        return <div key={r.id} onClick={()=>canGo&&!locked&&isMyTurn?moveTo(r.id):null}
          style={{position:"absolute",left:`${r.x}%`,top:`${r.y}%`,transform:"translate(-50%,-50%)",cursor:canGo&&!locked&&isMyTurn?"pointer":"default",zIndex:here?10:canGo?5:1,textAlign:"center"}}>
          <div style={{width:here?44:canGo?38:28,height:here?44:canGo?38:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
            background:here?T.gold:canGo?RCOL[r.type]+"cc":RCOL[r.type]+"44",border:here?`3px solid ${T.goldL}`:canGo?`2px solid ${T.gold}88`:`1px solid ${T.border}33`,
            boxShadow:here?`0 0 18px ${T.gold}55`:"none",fontSize:here?18:canGo?15:12}}>{REMO[r.type]}</div>
          {other&&<div style={{position:"absolute",top:-6,right:-6,fontSize:11}}>🏴‍☠️</div>}
          <div style={{fontSize:here?8:7,color:here?T.goldL:canGo?T.parch:T.txtD+"66",fontFamily:"'Cinzel',serif",whiteSpace:"nowrap",marginTop:1}}>{r.name}</div>
          {locked&&<div style={{fontSize:7,color:T.red}}>🔒{r.minF}</div>}
        </div>;})}
    </div></Card>;};

  const HeroCards=()=>(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
    {me?.heroes?.map(h=>(<Card key={h.id} style={{padding:8,opacity:h.hp<=0?0.3:1}}>
      <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
        <span style={{fontSize:14}}>{h.emoji}</span><span style={{fontSize:11,fontWeight:700,color:T.parch,fontFamily:"'Cinzel',serif",flex:1}}>{h.name}</span></div>
      <Badge>{PROFS[h.profession]?.label}</Badge>{h.hp<=0&&<Badge color={T.red}>K.O.</Badge>}
      <div style={{display:"flex",marginTop:5,gap:1}}>
        <SB label="HP" value={`${h.hp}/${h.maxHp}`} color={h.hp<=2?T.red:T.green}/>
        <SB label="NK" value={heroNK(h)}/><SB label="RW" value={heroRW(h)}/></div>
      <div style={{display:"flex",marginTop:3,gap:1}}>
        <SB label="ST" value={h.st}/><SB label="GE" value={h.ge}/><SB label="IN" value={h.in_}/><SB label="BW" value={h.bw}/></div>
      {(h.equipment||[]).length>0&&<div style={{marginTop:3,fontSize:9,color:T.txtD}}>{h.equipment.map(e=>e.emoji).join("")}</div>}
    </Card>))}</div>);

  // ── PLAY SCREEN ──
  const PlayScreen=()=>{const other=game?.players?.find(p=>p.id!==playerId);
    return <div style={{padding:14,paddingBottom:90}}>
      <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
        <Badge color={T.gold}>⭐{me?.fame||0}</Badge><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge><Badge color="#FFC107">💰{me?.gold||0}</Badge><Badge color="#FF8F00">🍺{me?.rum||0}</Badge>
        <Badge color={T.seaL}>{myShip.emoji}{myShip.name}</Badge><Badge color={isMyTurn?T.green:T.red}>{isMyTurn?"DEIN ZUG":"WARTE"}</Badge>
      </div>
      {(me?.curses||[]).length>0&&<div style={{fontSize:9,color:T.red,marginBottom:4}}>Flueche: {me.curses.map(c=>c.name).join(", ")}</div>}
      {other&&<div style={{fontSize:10,color:T.txtD,marginBottom:6}}>{other.name}: ⭐{other.fame} 💰{other.gold}</div>}
      <div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif",marginBottom:6}}>📍 {curReg?.name} {REMO[curReg?.type]}</div>
      {MapView()}{HeroCards()}
      {isMyTurn&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <Btn primary onClick={explore}>Erkunden (W100)</Btn>
        <Btn onClick={rest}>{curReg?.tavern?"Taverne (+5HP)":"Rasten (+3HP)"}</Btn>
        {curReg?.shop&&<Btn onClick={()=>setPhase("shop")}>Laden</Btn>}
        <Btn onClick={()=>setPhase("levelup")}>Aufwerten</Btn>
      </div>}
      {game?.log?.length>0&&<Card style={{marginTop:10}}><div style={{fontSize:10,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>LOGBUCH</div>
        <div style={{maxHeight:60,overflow:"auto"}}>{game.log.slice(-5).reverse().map((l,i)=><div key={i} style={{fontSize:10,color:T.txtD,padding:"1px 0"}}>{l}</div>)}</div></Card>}
    </div>;};

  // ── EVENT with SKILL TESTS ──
  const EventScreen=()=>(<div style={{minHeight:"100vh",padding:20,display:"flex",flexDirection:"column",justifyContent:"center",background:`radial-gradient(ellipse at 50% 30%,${T.seaL}44,${T.bg} 70%)`}}>
    <Card style={{borderColor:T.gold+"44"}}>
      <div style={{textAlign:"center",marginBottom:8}}><Badge>W100:{ev?.w100}</Badge><Badge color={RCOL[curReg?.type]}>{curReg?.name}</Badge></div>
      <div style={{fontSize:16,color:T.parch,fontFamily:"'Crimson Text',serif",lineHeight:1.5,textAlign:"center",marginBottom:16,fontStyle:"italic"}}>{ev?.text}</div>
      {ev?.type==="skilltest"&&!testResult&&(
        <div><div style={{textAlign:"center",fontSize:13,color:T.gold,marginBottom:8}}>{ev.stat==="st"?"Staerke":"ge"===ev.stat?"Geschick":"Intelligenz"}-Test (Schwierigkeit: {ev.diff})</div>
          <Btn primary onClick={()=>resolveEvent()}>Wuerfeln! (W6 + {ev.stat.toUpperCase()})</Btn></div>
      )}
      {ev?.type==="skilltest"&&testResult&&(
        <div>
          <Card style={{background:T.bg,textAlign:"center"}}>
            <div style={{fontSize:13,color:T.gold,marginBottom:4}}>{testResult.hero?.name} wuerfelt:</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",marginBottom:8}}>
              <DiceFace val={testResult.rolled}/><span style={{color:T.parch,fontSize:16}}>+</span>
              <div style={{fontSize:20,color:T.gold,fontWeight:900}}>{testResult.hero?.[ev.stat]}</div>
              <span style={{color:T.parch,fontSize:16}}>=</span>
              <div style={{fontSize:24,fontWeight:900,color:testResult.success?T.green:T.red}}>{testResult.total}</div>
              <span style={{color:T.txtD,fontSize:14}}>vs {testResult.diff}</span>
            </div>
            <div style={{fontSize:18,fontWeight:900,color:testResult.success?T.green:T.red}}>{testResult.success?"GESCHAFFT!":"MISSLUNGEN!"}</div>
          </Card>
          <div style={{marginTop:8}}><Btn primary onClick={()=>resolveSkillTest(testResult.success)}>{testResult.success?"Belohnung einsammeln":"Weiter..."}</Btn></div>
        </div>
      )}
      {ev?.type==="choice"&&<div style={{display:"grid",gap:6}}>{ev.opts.map((o,i)=><Btn key={i} primary={i===0} onClick={()=>resolveEvent(i)}>{o}</Btn>)}</div>}
      {ev?.type==="combat"&&<Btn primary onClick={()=>resolveEvent()}>Kampf!</Btn>}
      {ev?.type==="legendary"&&<div><div style={{textAlign:"center",fontSize:28,marginBottom:10}}>👑💎</div><Btn primary onClick={()=>resolveEvent()}>PIRATENKOENIG!!!</Btn></div>}
      {["loot","heal","nothing","trade"].includes(ev?.type)&&<div>
        {((ev?.gold||0)>0||(ev?.ruhm||0)>0||(ev?.fame||0)>0)&&<div style={{textAlign:"center",marginBottom:10,fontSize:14,color:T.green}}>
          {ev?.gold>0&&`💰+${ev.gold} `}{ev?.ruhm>0&&`🏆+${ev.ruhm} `}{ev?.fame>0&&`⭐+${ev.fame}`}</div>}
        {ev?.type==="heal"&&<div style={{textAlign:"center",marginBottom:10,color:T.green}}>Crew geheilt!</div>}
        <Btn primary onClick={()=>resolveEvent()}>Weiter</Btn></div>}
    </Card>
  </div>);

  // ── COMBAT (UltraQuest-style) ──
  const CombatScreen=()=>{const alive=me?.heroes?.filter(h=>h.hp>0).length||0;const eDead=combat?.enemy?.curHp<=0;const pDead=alive===0;
    return <div style={{minHeight:"100vh",padding:20,background:`radial-gradient(ellipse at 50% 20%,${T.red}22,${T.bg} 60%)`}}>
      <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:11,color:T.txtD,fontFamily:"'Cinzel',serif"}}>RUNDE {combat?.round||1}</div></div>
      <Card style={{textAlign:"center",borderColor:T.red+"44"}}>
        <div style={{fontSize:24,marginBottom:2}}>👹</div>
        <div style={{fontSize:16,color:T.red,fontFamily:"'Cinzel',serif"}}>{combat?.enemy?.name}</div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6}}>
          <SB label="HP" value={`${Math.max(0,combat?.enemy?.curHp)}/${combat?.enemy?.hp}`} color={T.red}/><SB label="NK" value={combat?.enemy?.nk}/><SB label="RW" value={combat?.enemy?.rw}/></div></Card>
      {HeroCards()}
      <Card style={{maxHeight:100,overflow:"auto",background:T.bg}}>{cLog.map((l,i)=><div key={i} style={{fontSize:11,color:l.includes("Treffer")||l.includes("=>")?(l.includes("Schaden")?T.red:T.green):T.parch,padding:"1px 0"}}>{l}</div>)}</Card>
      {eDead?<div style={{marginTop:10}}><div style={{textAlign:"center",color:T.green,fontSize:15,fontFamily:"'Cinzel',serif",marginBottom:8}}>
        SIEG! {combat.reward&&`+${combat.reward.ruhm||0}🏆 +${combat.reward.fame||0}⭐ +${combat.reward.gold||0}💰`}</div>
        <Btn primary onClick={()=>endCombat(true)}>Beute!</Btn></div>
      :pDead?<div style={{marginTop:10}}><div style={{textAlign:"center",color:T.red,fontSize:15,marginBottom:8}}>Niederlage!</div><Btn danger onClick={()=>endCombat(false)}>Weiter</Btn></div>
      :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}><Btn primary onClick={doCombatRound}>Angriff!</Btn><Btn danger onClick={()=>endCombat(false)}>Fliehen</Btn></div>}
    </div>;};

  // ── SHOP ──
  const ShopScreen=()=>{const sd=SHOP_INV[curReg?.shop]||SHOP_INV.hafen;const items=ALL_ITEMS.filter(i=>sd.items.includes(i.id));
    return <div style={{minHeight:"100vh",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif"}}>{sd.emoji} {sd.name}</div><Badge color="#FFC107">💰{me?.gold||0}</Badge></div>
      {sd.ships&&<><div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>SCHIFFE</div>
        <div style={{display:"grid",gap:5,marginBottom:12}}>{SHIPS.filter(s=>s.cost>0).map(s=>(<Card key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:me?.ship===s.id?0.4:1}}>
          <div style={{fontSize:20}}>{s.emoji}</div>
          <div style={{flex:1}}><div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{s.name}</div>
            <div style={{fontSize:9,color:T.txtD}}>Kanonen:{s.kan} Rumpf:{s.rumpf} Tempo:{s.spd}</div></div>
          <Btn small primary onClick={()=>buyShip(s)} disabled={me?.gold<s.cost||me?.ship===s.id} style={{width:"auto",minWidth:60}}>{me?.ship===s.id?"✓":s.cost+"G"}</Btn></Card>))}</div></>}
      <div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>WAREN</div>
      <div style={{display:"grid",gap:5}}>{items.map(it=>{const pr=Math.round(it.cost*sd.pm);return(<Card key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:8}}>
        <div style={{fontSize:16}}>{it.emoji}</div>
        <div style={{flex:1}}><div style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{it.name}</div>
          <div style={{fontSize:9,color:T.txtD}}>{it.nk>0&&`NK+${it.nk} `}{it.fk>0&&`FK+${it.fk} `}{it.rw>0&&`RW+${it.rw} `}{it.heal&&`Heilt+${it.heal} `}{it.rum&&`+${it.rum}Rum`}</div></div>
        <Btn small primary onClick={()=>buyItem(it)} disabled={me?.gold<pr} style={{width:"auto",minWidth:55}}>{pr}G</Btn></Card>);})}</div>
      <div style={{marginTop:12}}><Btn onClick={()=>setPhase("playing")}>Zurueck</Btn></div></div>;};

  // ── LEVEL UP ──
  const LevelUpScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif"}}>Aufwerten</div><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge></div>
    <div style={{fontSize:10,color:T.txtD,marginBottom:8}}>Stats: 8 Ruhm | Fertigkeiten: 10 Ruhm | Beendet Zug</div>
    {me?.heroes?.filter(h=>h.hp>0).map(h=>{const prof=PROFS[h.profession];const next=prof.skills.filter(s=>!(h.skills||[]).includes(s));
      return <Card key={h.id}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:16}}>{h.emoji}</span>
          <span style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</span><Badge>{prof.label}</Badge></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
          {[["st","ST"],["ge","GE"],["in_","IN"],["bw","BW"]].map(([k,l])=>
            <Btn key={k} small onClick={()=>trainStat(h.id,k)} disabled={me.ruhm<8||!isMyTurn}>{l} {h[k]}→{h[k]+1} (8R)</Btn>)}
        </div>
        {next.length>0&&<>{next.map(s=><Btn key={s} small onClick={()=>learnSkill(h.id,s)} disabled={me.ruhm<10||!isMyTurn} style={{marginBottom:4}}>{s} (10R)</Btn>)}</>}
      </Card>;})}
    <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurueck</Btn></div></div>);

  const FinishedScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:`radial-gradient(ellipse at 50% 40%,${T.gold}22,${T.bg} 70%)`}}>
    <div style={{fontSize:52,marginBottom:10}}>👑🏴‍☠️</div>
    <div style={{fontSize:26,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>{game?.winner?.type==="legendary"?"LEGENDAERER SIEG!":"PIRATENKOENIG!"}</div>
    <div style={{fontSize:16,color:T.parch,textAlign:"center",marginBottom:20}}>Kapitaen {game?.winner?.name} herrscht!</div>
    {game?.players?.map(p=>(<Card key={p.id} style={{width:"100%",maxWidth:300}}>
      <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif"}}>{p.name}</div>
      <div style={{display:"flex",gap:6,marginTop:6}}><SB label="Ruhm" value={p.fame}/><SB label="Beute" value={p.ruhm}/><SB label="Gold" value={p.gold}/></div></Card>))}
    <div style={{marginTop:20,width:"100%",maxWidth:300}}><Btn primary onClick={()=>{setPhase("menu");setGame(null);setGameId("");}}>Neues Spiel</Btn></div></div>);

  return(<div style={{background:T.bg,minHeight:"100vh",color:T.txt,fontFamily:"'Crimson Text',serif",maxWidth:600,margin:"0 auto"}}>
    <style>{fonts}{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}button:active{transform:scale(0.97);}`}</style>
    {Toast()}
    {phase==="menu"&&MenuScreen()}
    {phase==="lobby"&&LobbyScreen()}
    {phase==="setup"&&SetupScreen()}
    {phase==="playing"&&PlayScreen()}
    {phase==="event"&&EventScreen()}
    {phase==="combat"&&CombatScreen()}
    {phase==="shop"&&ShopScreen()}
    {phase==="levelup"&&LevelUpScreen()}
    {phase==="finished"&&FinishedScreen()}
  </div>);
}
