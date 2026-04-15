import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// 🏴‍☠️  P I R A T E N Q U E S T  –  Herrscher der Sieben Meere
// ══════════════════════════════════════════════════════════════

const pick = a => a[Math.floor(Math.random()*a.length)];
const roll = s => Math.floor(Math.random()*s)+1;
const d6 = () => roll(6);
const d100 = () => roll(100);
const uid = () => Math.random().toString(36).slice(2,8);
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

// ── API layer (works with Express backend OR localStorage fallback) ──
const api = {
  save: async g => { try { const r=await fetch(`/api/games/${g.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)}); if(r.ok) return; } catch{} localStorage.setItem(`pq:${g.id}`,JSON.stringify(g)); },
  load: async id => { try { const r=await fetch(`/api/games/${id}`); if(r.ok) return await r.json(); } catch{} const d=localStorage.getItem(`pq:${id}`); return d?JSON.parse(d):null; },
  create: async g => { try { await fetch('/api/games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)}); } catch{} localStorage.setItem(`pq:${g.id}`,JSON.stringify(g)); },
};

// ═══════════════════════════════════════════════════════════
//  WORLD DATA
// ═══════════════════════════════════════════════════════════

const RACES = {
  Freibeuter:  {bw:3,st:3,ge:3,in_:3,hp:7, label:"Freibeuter",  emoji:"🏴‍☠️",desc:"Allrounder — solide in allem"},
  Sirene:      {bw:4,st:2,ge:4,in_:3,hp:5, label:"Sirene",      emoji:"🧜",desc:"Schnell & geschickt, betörend"},
  Zwergpirat:  {bw:2,st:4,ge:2,in_:3,hp:9, label:"Zwergpirat",  emoji:"⛏️",desc:"Kanonenspezialist, zäh"},
  Aeffling:    {bw:5,st:1,ge:5,in_:2,hp:4, label:"Äffling",     emoji:"🐒",desc:"Takelage-Akrobat, flink"},
  HaiBlut:     {bw:3,st:5,ge:2,in_:1,hp:11,label:"Hai-Blut",    emoji:"🦈",desc:"Kampfmaschine, simpel"},
  Geisterblut: {bw:3,st:2,ge:3,in_:4,hp:5, label:"Geisterblut", emoji:"👻",desc:"Mystisch, zwischen den Welten"},
  Krakenbrut:  {bw:2,st:4,ge:2,in_:3,hp:8, label:"Krakenbrut",  emoji:"🐙",desc:"Tentakel, enormer Griff"},
  Papageiling: {bw:3,st:1,ge:3,in_:5,hp:4, label:"Papageiling", emoji:"🦜",desc:"Genialer Stratege"},
};

const PROFS = {
  Enterer:       {label:"Enterer",      nk:2,fk:0,emoji:"⚔️", desc:"Nahkampf-Spezialist beim Entern",
    skills:["Enterhaken-Meister","Doppelschlag","Kampfrausch","Schildbrecher","Todeswirbel"]},
  Navigator:     {label:"Navigator",    nk:0,fk:1,emoji:"🧭", desc:"Findet jeden Weg, meidet Gefahren",
    skills:["Sternennavigation","Windleser","Geheimrouten","Sturmreiter","Fluchtexperte"]},
  Schmuggler:    {label:"Schmuggler",   nk:1,fk:0,emoji:"🗝️", desc:"Handelsmeister, flinke Finger",
    skills:["Schwarzmarkt","Feilschen","Taschendieb","Falsche Flagge","Meisterschmuggler"]},
  Kanonier:      {label:"Kanonier",     nk:0,fk:2,emoji:"💣", desc:"Fernkampf-Spezialist, Breitseite",
    skills:["Breitseite","Kettenschuss","Feuerkanone","Präzisionsschuss","Inferno"]},
  Schiffsarzt:   {label:"Schiffsarzt",  nk:0,fk:0,emoji:"⚕️", desc:"Heilt Crew, rettet Leben",
    skills:["Wundversorgung","Kräuterkunde","Feldchirurg","Giftkunde","Wiederbelebung"]},
  VoodooPriester:{label:"Voodoo-Priester",nk:0,fk:0,emoji:"🔮",desc:"Dunkle Magie, Geister, Flüche",
    skills:["Verfluchung","Geisterruf","Schutzamulett","Seelenraub","Totenbeschwörung"]},
};

const SHIPS = [
  {id:"jolle",     name:"Jolle",      cost:0,    kan:0, lade:4,  rumpf:3,  spd:1,emoji:"🚣"},
  {id:"schaluppe", name:"Schaluppe",   cost:30,   kan:2, lade:8,  rumpf:6,  spd:2,emoji:"⛵"},
  {id:"brigg",     name:"Brigg",       cost:80,   kan:6, lade:14, rumpf:10, spd:2,emoji:"🚢"},
  {id:"fregatte",  name:"Fregatte",    cost:200,  kan:12,lade:20, rumpf:16, spd:3,emoji:"⚓"},
  {id:"galeone",   name:"Galeone",     cost:500,  kan:20,lade:30, rumpf:24, spd:2,emoji:"🏴‍☠️"},
  {id:"flaggschiff",name:"Flaggschiff",cost:1200, kan:30,lade:40, rumpf:32, spd:3,emoji:"👑"},
];

// ── SHOP INVENTORIES per location type ──
const ALL_ITEMS = [
  // WEAPONS
  {id:"dolch",     cat:"waffe", name:"Dolch",            nk:1,fk:1,rw:0,cost:3,  emoji:"🔪",tier:0},
  {id:"saebel",    cat:"waffe", name:"Entermesser",      nk:2,fk:0,rw:0,cost:6,  emoji:"🗡️",tier:0},
  {id:"rapier",    cat:"waffe", name:"Rapier",           nk:3,fk:0,rw:0,cost:14, emoji:"⚔️",tier:1},
  {id:"axt",       cat:"waffe", name:"Enteraxt",         nk:4,fk:0,rw:0,cost:20, emoji:"🪓",tier:1},
  {id:"flamberg",  cat:"waffe", name:"Flamberge",        nk:5,fk:0,rw:0,cost:35, emoji:"⚔️",tier:2},
  {id:"pistole",   cat:"waffe", name:"Steinschlosspistole",nk:0,fk:2,rw:0,cost:8, emoji:"🔫",tier:0},
  {id:"muskete",   cat:"waffe", name:"Muskete",          nk:0,fk:3,rw:0,cost:16, emoji:"🔫",tier:1},
  {id:"doppellauf",cat:"waffe", name:"Doppellauf-Pistole",nk:0,fk:4,rw:0,cost:30,emoji:"🔫",tier:2},
  {id:"enterhaken",cat:"waffe", name:"Enterhaken",       nk:2,fk:0,rw:0,cost:5,  emoji:"🪝",tier:0},
  {id:"dreizack",  cat:"waffe", name:"Dreizack",         nk:3,fk:1,rw:0,cost:18, emoji:"🔱",tier:1},
  // ARMOR
  {id:"lederwams", cat:"rüstung",name:"Lederwams",       nk:0,fk:0,rw:1,cost:6,  emoji:"🧥",tier:0},
  {id:"kette",     cat:"rüstung",name:"Kettenhemd",      nk:0,fk:0,rw:2,cost:15, emoji:"🛡️",tier:1},
  {id:"brust",     cat:"rüstung",name:"Brustpanzer",     nk:0,fk:0,rw:3,cost:28, emoji:"🛡️",tier:2},
  {id:"schildkroete",cat:"rüstung",name:"Schildkröten-Panzer",nk:0,fk:0,rw:4,cost:50,emoji:"🐢",tier:3},
  {id:"buckler",   cat:"rüstung",name:"Buckler",         nk:0,fk:0,rw:1,cost:7,  emoji:"🛡️",tier:0},
  // CONSUMABLES
  {id:"rum",       cat:"konsum", name:"Fass Rum",        cost:4,  emoji:"🍺",rum:5,tier:0},
  {id:"proviant",  cat:"konsum", name:"Proviant",        cost:3,  emoji:"🍖",heal:3,tier:0},
  {id:"heiltrank", cat:"konsum", name:"Kräutertinktur",  cost:10, emoji:"🧪",heal:5,tier:1},
  {id:"elixier",   cat:"konsum", name:"Voodoo-Elixier",  cost:25, emoji:"🧪",heal:10,tier:2},
  {id:"kugeln",    cat:"konsum", name:"Kanonenkugeln",   cost:5,  emoji:"💣",ammo:10,tier:0},
  {id:"dynamit",   cat:"konsum", name:"Dynamit",         cost:12, emoji:"🧨",tier:1},
  // TOOLS & MAGIC
  {id:"fernrohr",  cat:"werkzeug",name:"Fernrohr",       cost:10, emoji:"🔭",tier:0,bonus:"scout"},
  {id:"kompass",   cat:"werkzeug",name:"Magischer Kompass",cost:22,emoji:"🧭",tier:1,bonus:"navigate"},
  {id:"seil",      cat:"werkzeug",name:"Enterhaken-Seil",cost:4,  emoji:"🪢",tier:0},
  {id:"fackel",    cat:"werkzeug",name:"Laterne",        cost:3,  emoji:"🏮",tier:0,bonus:"dungeon"},
  {id:"voodoo",    cat:"magie",  name:"Voodoo-Puppe",    cost:18, emoji:"🪆",tier:1,bonus:"curse"},
  {id:"amulett",   cat:"magie",  name:"Schutzamulett",   cost:25, emoji:"🧿",tier:2,bonus:"protect",rw:1},
  {id:"seekarte",  cat:"magie",  name:"Mystische Seekarte",cost:30,emoji:"🗺️",tier:2,bonus:"treasure"},
  {id:"geisterflasche",cat:"magie",name:"Geisterflasche",cost:40, emoji:"🫧",tier:3,bonus:"ghost"},
];

// Shop inventories per region type
const SHOP_INVENTORY = {
  hafen: { // Tortuga — pirate haven, everything available
    name:"Tortuga Piratenladen",emoji:"🏴‍☠️",
    items:["dolch","saebel","rapier","pistole","muskete","enterhaken","lederwams","kette","buckler","rum","proviant","heiltrank","kugeln","dynamit","fernrohr","seil","fackel","voodoo"],
    priceMod:1.0, shipSale:true },
  dorf: { // Small village — basics only
    name:"Fischerdorf-Händler",emoji:"🏘️",
    items:["dolch","enterhaken","lederwams","proviant","rum","seil","fackel","heiltrank"],
    priceMod:1.15, shipSale:false },
  stadt: { // Rich port — premium selection
    name:"Goldküsten-Basar",emoji:"🏰",
    items:["rapier","axt","flamberg","doppellauf","dreizack","kette","brust","schildkroete","buckler","rum","heiltrank","elixier","kugeln","dynamit","fernrohr","kompass","voodoo","amulett","seekarte","geisterflasche"],
    priceMod:0.9, shipSale:true },
  festung: { // Military surplus
    name:"Erbeutete Militärvorräte",emoji:"⚔️",
    items:["rapier","axt","flamberg","muskete","doppellauf","kette","brust","buckler","kugeln","dynamit"],
    priceMod:0.75, shipSale:false },
};

// ── FAME THRESHOLDS ──
const FAME_PERKS = [
  {fame:5,  label:"Bekannter Pirat",     desc:"+1 Startgold pro Ereignis",perk:"extraGold"},
  {fame:15, label:"Gefürchteter Pirat",  desc:"Bessere Schiffe verfügbar",perk:"betterShips"},
  {fame:25, label:"Berüchtigter Pirat",  desc:"Schwarzmarkt überall",perk:"blackMarket"},
  {fame:35, label:"Legendärer Pirat",    desc:"Legendäre Items in Events",perk:"legendary"},
  {fame:50, label:"Piratenlord",         desc:"Zugang zum Thron",perk:"throneAccess"},
  {fame:75, label:"Schrecken der Meere", desc:"Doppelte Event-Belohnungen",perk:"doubleRewards"},
  {fame:100,label:"PIRATENKÖNIG!",       desc:"SIEG!",perk:"victory"},
];

const REGIONS = [
  {id:"tortuga",     name:"Tortuga",          type:"hafen",  x:50,y:90,minF:0,  conn:["flache_see","handelsweg"],shop:"hafen",tavern:true},
  {id:"puerto",      name:"Puerto Seguro",    type:"dorf",   x:22,y:85,minF:0,  conn:["flache_see","mangroven"],shop:"dorf"},
  {id:"flache_see",  name:"Flache See",       type:"flach",  x:38,y:75,minF:0,  conn:["tortuga","puerto","handelsweg","korallenriff","mangroven"]},
  {id:"handelsweg",  name:"Handelsstraße",    type:"handel",x:62,y:72,minF:0,  conn:["tortuga","flache_see","korallenriff","goldkueste"]},
  {id:"mangroven",   name:"Mangrovenlabyrinth",type:"sumpf", x:15,y:65,minF:5,  conn:["puerto","flache_see","geisterinsel","schlangennest"]},
  {id:"korallenriff",name:"Korallenriff",     type:"riff",   x:50,y:60,minF:8,  conn:["flache_see","handelsweg","nebelbank","haifischbucht"]},
  {id:"goldkueste",  name:"Goldküste",        type:"stadt",  x:78,y:58,minF:10, conn:["handelsweg","festung","haifischbucht"],shop:"stadt",tavern:true},
  {id:"nebelbank",   name:"Ewige Nebelbank",  type:"nebel",  x:35,y:48,minF:12, conn:["korallenriff","geisterinsel","bermuda"]},
  {id:"haifischbucht",name:"Haifischbucht",   type:"hai",    x:65,y:45,minF:15, conn:["korallenriff","goldkueste","vulkaninsel","krakentiefen"]},
  {id:"geisterinsel",name:"Geisterinsel",     type:"geister",x:18,y:42,minF:18, conn:["mangroven","nebelbank","davyjones"]},
  {id:"schlangennest",name:"Schlangennest",   type:"verlies",x:8, y:55,minF:15, conn:["mangroven"]},
  {id:"festung",     name:"Festung San Carlos",type:"festung",x:85,y:48,minF:20,conn:["goldkueste","vulkaninsel"],shop:"festung"},
  {id:"vulkaninsel", name:"Vulkaninsel",      type:"vulkan", x:70,y:32,minF:25, conn:["haifischbucht","festung","schatzinsel"]},
  {id:"bermuda",     name:"Bermuda-Dreieck",  type:"bermuda",x:38,y:32,minF:25, conn:["nebelbank","krakentiefen","schatzinsel"]},
  {id:"krakentiefen",name:"Kraken-Tiefen",    type:"tiefsee",x:55,y:25,minF:30, conn:["haifischbucht","bermuda","davyjones"]},
  {id:"davyjones",   name:"Davy Jones' Riff", type:"unterwasser",x:25,y:22,minF:35,conn:["geisterinsel","krakentiefen"]},
  {id:"schatzinsel", name:"Schatzinsel",      type:"schatz", x:58,y:12,minF:40, conn:["vulkaninsel","bermuda","thron"]},
  {id:"thron",       name:"Piratenkönigsthron",type:"thron", x:50,y:3, minF:50, conn:["schatzinsel"]},
];
const RCOL={hafen:"#D4A843",dorf:"#8B9E6B",flach:"#4FC3F7",handel:"#FFB74D",sumpf:"#5D4037",riff:"#26C6DA",stadt:"#FFD700",nebel:"#90A4AE",hai:"#EF5350",geister:"#7E57C2",verlies:"#4A148C",festung:"#B71C1C",vulkan:"#FF5722",bermuda:"#6A1B9A",tiefsee:"#0D47A1",unterwasser:"#00695C",schatz:"#FFC107",thron:"#FFD700"};
const REMO={hafen:"🏴‍☠️",dorf:"🏘️",flach:"🌊",handel:"⛵",sumpf:"🌿",riff:"🐠",stadt:"🏰",nebel:"🌫️",hai:"🦈",geister:"👻",verlies:"🐍",festung:"🏰",vulkan:"🌋",bermuda:"🔮",tiefsee:"🐙",unterwasser:"🫧",schatz:"💎",thron:"👑"};

// ═══════════════════════════════════════════════════════════
//  EVENT ENGINE
// ═══════════════════════════════════════════════════════════
const PN=["Einauge","Rotbart","Schwarzzahn","La Muerte","Knochenbrecher","Silberfinger","Sturmwind","Bluthund","Donnerschlag","Goldkralle","Schlangenauge","Nebelfaust","Totenkopf-Tom","Haifisch-Henri","Eisenbart","Krakenjäger","Dunkle Dolores","Flüster-Finn","Teufelszunge","Galgenvogel","Rum-Rosita","Feuerfaust","Seeschlange-Sven","Giftzahn","Todeslächeln","Wirbelwind-Wanda","Voodoo-Vic","Krummsäbel-Karl","Blitz-Boris","Narbengesicht","Sturmbraut","Eisenhaken","Goldzahn-Gustav","Mondauge","Piranhamaul","Taifun-Tessa","Messerhans","Kanonen-Klaus","Pesthauch","Irrlichter-Ida","Korallen-König","Seemine-Sam","Ankerfaust","Schwarze Witwe","Geisterflüsterer","Schädelbrecher","Vulkan-Vera","Knochenhand","Dreizack-Dimitri","Seeteufel","Quecksilber-Quinn","Nebelkrähe","Donnergroll","Hakenhex","Kielholer","Seemöwen-Sid","Muschelkönig","Nordwind-Nils","Totenwache","Salzblut","Riffbrecher","Sturmfalke","Tiefenangst","Kompassnadel-Katja","Leuchtturm-Lars","Grünbart","Silberkette","Krakenauge","Wirbelsturm","Breitseite-Bernd","Kugelregen","Flaschenteufel","Brandungshexe","Wellenbrecher","Sturzflut","Nebelhorn","Schatzgräber","Ebbe-Edgar","Flutwelle-Flora","Korallenherz","Seekobold","Meuterer-Moritz","Barrakuda-Bella","Perlensammlerin","Tintenfass","Leuchtqualle","Meeresauge","Salzfinger","Wellentänzerin","Ankerwerfer","Bugspriet-Bruno","Seemannsgarn","Flaute-Friedrich","Kielbrand","Reling-Rosa","Kombüsen-Kai"];
const SN=["Sturmkrähe","Schwarze Perle","Blutige Mary","Seewolf","Nebeltänzerin","Todesschwinge","Goldener Hai","Donnerschlag","Meerjungfrau","Krakenzorn","Geisterschiff","Feuersbrunst","Sturmbrecher","Gezeitenreiter","Mondschatten","Wellenreiter","Korallendolch","Phantomklinge","Teufelsklaue","Fliegende Holländerin","Piranhabiss","Leuchtfeuer","Ankerschreck","Schwarzer Blitz","Grüne Mamba","Voodoo-Queen","Knochenbrecher","Salzwind","Brandungsjäger","Neptuns Zorn","Wirbelwind","Galgenhumor","Rumlady","Muschelhorn","Schattensegel","Meeresglut","Höllenfeuer","Eisenkiel","Sturmvogel","Kanonendonner","Nachtfalke","Blutrausch","Mantastrahl","Nebelschleier","Silberpfeil","Haifischzahn","Kreuzer","Donnerkeil","Nordwind","Totenstille","Meeresauge","Sturmglocke","Barrakuda","Perlentaucher","Kielbrecher","Bugwelle","Seemannsbraut"];
const CN=["Riesenkrake","Seeschlange","Geisterpiraten","Untote Matrosen","Riffhaie","Meereswächter","Sumpfkrokodil","Giftige Quallen","Sirenen","Wasserelementar","Skelettcrew","Seehexe","Seeteufel","Tiefseeangler","Piranha-Schwarm","Zombiepiraten","Voodoo-Golem","Sturmgeist","Nebeldämon","Korallenwächter","Lava-Krabbe","Vulkandrache","Bermuda-Phantom","Krakentier","Geisterschiff-Crew","Riffwächter","Tentakelhorror","Schattentaucher","Flutwurm","Muschelgolem","Gezeitenbestie","Feuerfisch","Hai-König","Algen-Ungeheuer","Todesrochen","Muränen-Pack","Kugelfisch-Riese","Barrakuda-Rudel","Hammerhai","Eiskralle","Tiefseekrake","Leviathan-Junges"];
const ADJ=["verfluchte","goldene","vergessene","gespenstische","uralte","verrostete","leuchtende","mysteriöse","finstere","verborgene","heilige","verdammte","zerbrochene","legendäre","verschollene","geheime","stürmische","tosende","neblige","dunkle","brennende","eisige","giftige","schimmernde","donnernde","blutige","silberne","knöcherne","kristallene","schwarze","korallenrote","smaragdgrüne","verfallene","pechschwarze","glutrote","mondbeleuchtete","sturmgepeitschte","tödliche","betörende","trügerische","verzauberte","verwunschene"];
const TN=["Aztekengold","Rubinkrone","Smaragdkelch","Neptuns Dreizack","Sirenenharfe","Goldener Kompass","Krakens Herz","Davy Jones' Schlüssel","Poseidons Gürtel","Geisterkette","Schwarzer Opal","Blutrubin","Mondperle","Sonnenstein","Vulkanjuwel","Korallendiadem","Gezeitenring","Sturmbrecher-Amulett","Meerjungfrauen-Träne","Piratenkönigssiegel","Goldanker","Kristallschädel","Flammenherz","Sternensaphir","Windrose des Schicksals","Leuchtstein","Schattenkristall","Diamantsäbel","Platinmedaillon","Jadeschlange","Obsidianmaske","Elfenbeinkrone","Phönixfeder","Leviathans Schuppe","Titanenhelm","Weltenkompass","Zeitmuschel","Schicksalswürfel"];
const CARGO=["Rum","Gewürze","Seide","Elfenbein","Tabak","Zucker","Tee","Kanonenpulver","Silberbarren","Goldmünzen","Edelsteine","Waffen","Medizin","Holz","Salz"];
const LOC=["in einer Felshöhle","am Strand","in einem Wrack","unter Wasser","auf einer Klippe","in einem Dschungel","in einer Ruine","in einem Vulkankrater","auf einem Riff","in einer Grotte","auf einer Sandbank","zwischen Mangroven"];

function ft(t){return t.replace(/\{pn\}/g,()=>pick(PN)).replace(/\{sn\}/g,()=>pick(SN)).replace(/\{cn\}/g,()=>pick(CN)).replace(/\{adj\}/g,()=>pick(ADJ)).replace(/\{tn\}/g,()=>pick(TN)).replace(/\{cargo\}/g,()=>pick(CARGO)).replace(/\{loc\}/g,()=>pick(LOC));}
function mkEnemy(n,d){const b=3+d*2;return{name:n,nk:b+roll(3),hp:b+roll(4),rw:Math.floor(d/2)};}
function scR(r,d,f){const m=1+(d*0.3)+(f>=75?1:0);return{gold:Math.round((r.gold||0)*m+roll(3)),ruhm:Math.round((r.ruhm||0)*m),fame:Math.round((r.fame||0)*m)};}

// Event pools per region type — each a function(difficulty) returning event obj
const EVT={
flach:[
d=>({text:ft("Ein {adj} Handelsschiff kreuzt euren Kurs. Kapitän {pn} der {sn} wirkt {adj}."),type:"choice",opts:["Handel treiben","Überfallen","Vorbeifahren"],rews:[{gold:3+roll(5),ruhm:1},{combat:mkEnemy("Handelsschiff-Wachen",d),reward:{gold:10+roll(8),ruhm:2,fame:1}},{}]}),
d=>({text:ft("Treibgut der gesunkenen {sn}! Fässer mit {cargo} schaukeln in den Wellen."),type:"loot",gold:3+roll(6),ruhm:1}),
d=>({text:ft("{cn} tauchen aus der Tiefe auf!"),type:"combat",enemy:mkEnemy(ft("{cn}"),d),reward:{gold:roll(5),ruhm:2,fame:1}}),
d=>({text:ft("Fischer bieten frischen Fang an. Eure Crew jubelt!"),type:"heal",amount:2+roll(2)}),
d=>({text:ft("Flaschenpost! Eine {adj} Schatzkarte von {pn}!"),type:"loot",ruhm:3,fame:1}),
d=>({text:ft("Ein {adj} Kauffahrteischiff mit {cargo} gerät in Seenot!"),type:"choice",opts:["Retten (+Ruhm)","Plündern (+Gold)","Ignorieren"],rews:[{ruhm:4,fame:2,gold:roll(5)},{gold:10+roll(8),ruhm:-1},{}]}),
d=>({text:ft("Delfine begleiten euer Schiff! Die Crew jubelt."),type:"loot",ruhm:1,rum:2}),
d=>({text:ft("Marine-Kutter patrouilliert! Flagge wechseln?"),type:"choice",opts:["Falsche Flagge","Kampf!","Fliehen"],rews:[{ruhm:1},{combat:mkEnemy("Marine-Soldaten",d+1),reward:{gold:12,ruhm:3,fame:2}},{}]}),
d=>({text:ft("Piratenkapitän {pn} auf der {sn} fordert zum Würfelduell!"),type:"choice",opts:["Annehmen","Ablehnen"],rews:[Math.random()>.5?{gold:8,ruhm:2,fame:1}:{gold:-5,ruhm:-1},{ruhm:0}]}),
d=>({text:ft("Euer Ausguck entdeckt eine {adj} Insel — auf keiner Karte!"),type:"choice",opts:["Anlegen & erkunden","Vorbeifahren"],rews:[{gold:4+roll(8),ruhm:3,fame:2},{}]}),
d=>({text:ft("Fliegende Fische landen auf Deck! Kostenloses Abendessen."),type:"heal",amount:1}),
d=>({text:ft("Ein Wal taucht neben dem Schiff auf! Eindrucksvoll."),type:"nothing"}),
d=>({text:ft("Schwimmende Leichen — Überreste einer Schlacht zwischen {pn} und der Marine."),type:"choice",opts:["Durchsuchen","Weiterfahren"],rews:[{gold:3+roll(4),ruhm:1},{}]}),
d=>({text:ft("Ein alter Matrose treibt auf einem Fass. Er kennt die Route zu {tn}!"),type:"loot",ruhm:4,fame:2}),
d=>({text:ft("Haifischflosse! Aber er zieht friedlich vorbei."),type:"nothing"}),
d=>({text:ft("Eine {adj} Seekarte von {pn} zeigt unbekannte Gewässer."),type:"choice",opts:["Folgen","Kurs halten"],rews:[{gold:5+roll(8),ruhm:3,fame:1},{ruhm:1}]}),
],handel:[
d=>({text:ft("Schwer beladene Galeone {sn} mit {cargo}! Kapitän {pn} sieht nervös aus."),type:"choice",opts:["Überfallen","Handeln","Lassen"],rews:[{combat:mkEnemy("Galeonen-Wachen",d+1),reward:{gold:15+roll(15),ruhm:3,fame:2}},{gold:5+roll(5)},{}]}),
d=>({text:ft("Konvoi mit {cargo}! Starke Eskorte."),type:"choice",opts:["Frontalangriff!","Nachtangriff","Meiden"],rews:[{combat:mkEnemy("Konvoi-Eskorte",d+2),reward:{gold:25+roll(15),ruhm:5,fame:3}},{combat:mkEnemy("Nachtwache",d),reward:{gold:20+roll(10),ruhm:4,fame:2}},{}]}),
d=>({text:ft("Schmuggler {pn} bietet {cargo} billig an. Seriös?"),type:"choice",opts:["Kaufen (−8G)","Ablehnen","Bestehlen"],rews:[Math.random()>.3?{gold:-8,ruhm:2}:{gold:-8,ruhm:-1},{},{combat:mkEnemy("Schmugglergang",d),reward:{gold:12,ruhm:2,fame:1}}]}),
d=>({text:ft("Sinkender Frachter! {cargo} treibt herum!"),type:"loot",gold:6+roll(10),ruhm:2}),
d=>({text:ft("Marine-Fregatte {sn}! Kampfflagge gehisst!"),type:"combat",enemy:mkEnemy("Marine-Fregatte",d+2),reward:{gold:15+roll(10),ruhm:4,fame:3}}),
d=>({text:ft("{pn} bietet eine Allianz gegen die Marine an."),type:"choice",opts:["Allianz","Ablehnen","Hintergehen"],rews:[{ruhm:5,fame:2},{},{gold:8+roll(5),fame:-1}]}),
d=>({text:ft("Passagierschiff mit reichen Kaufleuten!"),type:"choice",opts:["Überfallen","In Ruhe lassen"],rews:[{combat:mkEnemy("Leibwächter",d),reward:{gold:20+roll(10),ruhm:2,fame:2}},{ruhm:1}]}),
d=>({text:ft("Treibende Fässer mit {cargo} — herrenlos!"),type:"loot",gold:4+roll(6),ruhm:1}),
d=>({text:ft("Ein Händler will {cargo} gegen eure {cargo} tauschen. Fair?"),type:"choice",opts:["Tauschen","Ablehnen"],rews:[{gold:roll(8),ruhm:1},{ruhm:0}]}),
],sumpf:[
d=>({text:ft("Ein {adj} Krokodil lauert im trüben Wasser!"),type:"combat",enemy:mkEnemy("Sumpfkrokodil",d),reward:{gold:roll(4),ruhm:2,fame:1}}),
d=>({text:ft("Giftnebel steigt auf. Eurer Crew wird übel."),type:"choice",opts:["Durchfahren","Umkehren"],rews:[{ruhm:3,fame:1},{}]}),
d=>({text:ft("Voodoo-Priesterin {pn} lebt hier in einer Stelzenhütte."),type:"choice",opts:["Besuchen","Meiden"],rews:[Math.random()>.4?{ruhm:4,fame:2,heal:3}:{ruhm:-1,gold:-3},{}]}),
d=>({text:ft("Mangroven verklemmen den Kiel!"),type:"choice",opts:["Freihacken","Dynamit"],rews:[{ruhm:1},{ruhm:2,gold:-3}]}),
d=>({text:ft("Versunkenes Piratenlager mit Goldkisten im Schlamm!"),type:"loot",gold:6+roll(8),ruhm:2,fame:1}),
d=>({text:ft("{cn} erheben sich aus dem Morast!"),type:"combat",enemy:mkEnemy(ft("{cn}"),d+1),reward:{gold:roll(6),ruhm:3,fame:2}}),
d=>({text:ft("Alligatoren bewachen ein {adj} Nest voller Edelsteine."),type:"choice",opts:["Plündern","Zu gefährlich"],rews:[{combat:mkEnemy("Alligator-Pack",d),reward:{gold:12+roll(8),ruhm:3,fame:2}},{}]}),
d=>({text:ft("Geheimer Wasserweg! Abkürzung oder Falle?"),type:"choice",opts:["Folgen","Ignorieren"],rews:[Math.random()>.4?{ruhm:4,fame:2}:{combat:mkEnemy("Sumpf-Banditen",d),reward:{gold:5,ruhm:2,fame:1}},{}]}),
],riff:[
d=>({text:ft("Schiff läuft auf ein {adj} Riff! Rumpfschaden!"),type:"choice",opts:["Reparieren (−5G)","Ignorieren"],rews:[{gold:-5,ruhm:1},{ruhm:0}]}),
d=>({text:ft("Etwas Goldenes glitzert unter Wasser!"),type:"choice",opts:["Tauchen!","Zu riskant"],rews:[{gold:8+roll(10),ruhm:2,fame:1},{}]}),
d=>({text:ft("{cn} verteidigen das Riff!"),type:"combat",enemy:mkEnemy(ft("{cn}"),d),reward:{gold:roll(6),ruhm:3,fame:1}}),
d=>({text:ft("Schiffswrack der {sn} auf dem Riffgrund!"),type:"choice",opts:["Erkunden","Weiter"],rews:[{gold:10+roll(8),ruhm:4,fame:2},{}]}),
d=>({text:ft("Perlenmuscheln! Massenhaft! Euer Taucher jubelt."),type:"loot",gold:5+roll(8),ruhm:2}),
d=>({text:ft("Ein {adj} Strudel zwischen den Korallen!"),type:"choice",opts:["Durchfahren","Umfahren"],rews:[{ruhm:4,fame:2},{ruhm:1}]}),
d=>({text:ft("Giftige Quallen! Ein Matrose wird gestochen!"),type:"choice",opts:["Arzt behandeln lassen","Hausmittel"],rews:[{heal:1,ruhm:1},{ruhm:0}]}),
d=>({text:ft("{adj} Unterwasserhöhle — darin glitzert es!"),type:"choice",opts:["Reintauchen","Zu gefährlich"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:5,fame:3}:{combat:mkEnemy("Höhlenwächter",d+2),reward:{gold:20,ruhm:4,fame:3}},{}]}),
],hai:[
d=>({text:ft("HAAAIIII! Ein {adj} Weißer Hai umkreist das Schiff!"),type:"combat",enemy:mkEnemy("Weißer Hai",d+1),reward:{gold:roll(4),ruhm:4,fame:2}}),
d=>({text:ft("Haifisch-Arena! {pn} lädt zum Wetten ein!"),type:"choice",opts:["Wetten (5G)","Selbst kämpfen","Meiden"],rews:[Math.random()>.5?{gold:10,ruhm:2}:{gold:-5},{combat:mkEnemy("Arena-Hai",d+1),reward:{gold:15,ruhm:5,fame:3}},{}]}),
d=>({text:ft("Hai-Blut-Krieger von {pn}s Clan patrouillieren!"),type:"choice",opts:["Verhandeln","Angreifen"],rews:[{ruhm:2,fame:1},{combat:mkEnemy("Hai-Krieger",d+1),reward:{gold:10,ruhm:4,fame:2}}]}),
d=>({text:ft("Im Magen eines erlegten Hais: ein {adj} Schwert und Gold!"),type:"loot",gold:8+roll(6),ruhm:3,fame:1}),
d=>({text:ft("Hammerhaie blockieren die Durchfahrt!"),type:"choice",opts:["Durchbrechen","Warten"],rews:[{ruhm:4,fame:2},{ruhm:1}]}),
],geister:[
d=>({text:ft("Geisterschiff materialisiert aus dem Nebel! Die {sn}!"),type:"combat",enemy:mkEnemy("Geisterpiraten",d+2),reward:{gold:12+roll(10),ruhm:5,fame:3}}),
d=>({text:ft("Geist von Kapitän {pn} sucht Rache!"),type:"choice",opts:["Befragen","Fliehen","Voodoo-Ritual"],rews:[{ruhm:5,fame:3},{ruhm:-1},{ruhm:6,fame:4,gold:roll(8)}]}),
d=>({text:ft("{adj} Friedhof — Gräber von Piratenlegenden."),type:"choice",opts:["Gräber öffnen","Respekt zollen"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:3,fame:2}:{combat:mkEnemy("Untote Piraten",d+2),reward:{gold:10,ruhm:4,fame:3}},{ruhm:3,fame:2}]}),
d=>({text:ft("Irrlichter locken tiefer in den Nebel. Crew weigert sich."),type:"choice",opts:["Überzeugen","Umkehren"],rews:[Math.random()>.5?{gold:10+roll(8),ruhm:5,fame:3}:{ruhm:-2},{ruhm:1}]}),
d=>({text:ft("Skelettkrieger erheben sich aus dem Sand!"),type:"combat",enemy:mkEnemy("Skelettarmee",d+2),reward:{gold:8+roll(8),ruhm:5,fame:3}}),
d=>({text:ft("Geist einer Meerjungfrau bittet um Hilfe. Schatz liegt {loc}."),type:"choice",opts:["Helfen","Ignorieren"],rews:[{gold:12+roll(8),ruhm:6,fame:4},{}]}),
d=>({text:ft("Eine {adj} Truhe — offensichtlich Falle."),type:"choice",opts:["Trotzdem öffnen","Umgehen"],rews:[Math.random()>.5?{gold:20+roll(10),ruhm:3}:{combat:mkEnemy("Geisterwächter",d+2),reward:{gold:15,ruhm:5,fame:3}},{ruhm:1}]}),
],nebel:[
d=>({text:ft("Schreie im Nebel! Schiff wird von {cn} angegriffen!"),type:"choice",opts:["Zu Hilfe eilen","Weiterfahren"],rews:[{combat:mkEnemy(ft("{cn}"),d+1),reward:{gold:10,ruhm:6,fame:3}},{}]}),
d=>({text:ft("Nebel lichtet sich — {adj} Insel!"),type:"loot",gold:5+roll(8),ruhm:3,fame:2}),
d=>({text:ft("Kompass dreht sich wild! Magnetische Anomalie!"),type:"choice",opts:["Navigator vertrauen","Treiben"],rews:[{ruhm:3,fame:1},{gold:roll(8),ruhm:Math.random()>.5?4:-2,fame:Math.random()>.5?2:0}]}),
d=>({text:ft("Stimmen singen ein {adj} Lied. Sirenen!"),type:"choice",opts:["Ohren verstopfen","Zuhören"],rews:[{ruhm:2},Math.random()>.6?{ruhm:6,fame:4}:{combat:mkEnemy("Sirenen",d+1),reward:{gold:8,ruhm:4,fame:2}}]}),
d=>({text:ft("{adj} Leuchtturm — wer betreibt ihn?"),type:"choice",opts:["Anlegen","Vorbeifahren"],rews:[Math.random()>.5?{gold:6,ruhm:4,fame:2,heal:2}:{combat:mkEnemy("Leuchtturm-Falle",d+1),reward:{gold:12,ruhm:3,fame:2}},{}]}),
],festung:[
d=>({text:ft("Kanonenbeschuss! Sie haben euch entdeckt!"),type:"combat",enemy:mkEnemy("Festungskanonen",d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}}),
d=>({text:ft("Ein {adj} Geheimgang unter die Mauern!"),type:"choice",opts:["Eindringen","Zu riskant"],rews:[{combat:mkEnemy("Festungswachen",d+2),reward:{gold:25+roll(15),ruhm:7,fame:5}},{}]}),
d=>({text:ft("Gefangene Piraten! Befreiungsaktion?"),type:"choice",opts:["Befreien","Unmöglich"],rews:[{combat:mkEnemy("Garnison",d+2),reward:{ruhm:8,fame:5,gold:5}},{}]}),
d=>({text:ft("Die Schatzkammer! Schwer bewacht."),type:"choice",opts:["Überfall!","Schleichen"],rews:[{combat:mkEnemy("Elitegarde",d+3),reward:{gold:30+roll(20),ruhm:8,fame:5}},{gold:15+roll(10),ruhm:5,fame:3}]}),
],vulkan:[
d=>({text:ft("Lavaströme! Dampfwolken!"),type:"choice",opts:["Durch den Dampf","Umfahren"],rews:[Math.random()>.5?{ruhm:5,fame:3}:{gold:-5},{ruhm:2}]}),
d=>({text:ft("In einer Lavahöhle: {adj} Drache bewacht {tn}!"),type:"combat",enemy:mkEnemy("Vulkandrache",d+3),reward:{gold:20+roll(15),ruhm:8,fame:5}}),
d=>({text:ft("Heiße Quellen! Die Crew badet und heilt."),type:"heal",amount:4}),
d=>({text:ft("Ausbruch! Feuerbomben vom Himmel!"),type:"choice",opts:["Volle Kraft!","Deckung!"],rews:[Math.random()>.4?{ruhm:5,fame:2}:{gold:-10},{ruhm:2}]}),
d=>({text:ft("{adj} Obsidianwaffen — schärfer als Stahl!"),type:"loot",gold:10+roll(8),ruhm:4,fame:2}),
d=>({text:ft("Feuerelementar erhebt sich aus der Lava!"),type:"combat",enemy:mkEnemy("Feuerelementar",d+3),reward:{gold:12+roll(10),ruhm:6,fame:4}}),
],bermuda:[
d=>({text:ft("Die Zeit verzerrt sich! Alles rückwärts!"),type:"choice",opts:["Weitermachen","Kurs ändern"],rews:[Math.random()>.5?{ruhm:6,fame:4}:{ruhm:-3},{ruhm:2}]}),
d=>({text:ft("Dimensionsriss! Dahinter: {adj} Welt voller Schätze!"),type:"choice",opts:["Hindurch!","Nein danke"],rews:[Math.random()>.4?{gold:30+roll(20),ruhm:8,fame:5}:{combat:mkEnemy("Dimensionswächter",d+3),reward:{gold:20,ruhm:6,fame:4}},{ruhm:2}]}),
d=>({text:ft("Strudel! Euer Schiff wird erfasst!"),type:"choice",opts:["Gegensteuern!","Treiben"],rews:[{ruhm:4,fame:2},Math.random()>.5?{gold:10,ruhm:5,fame:3}:{gold:-10,ruhm:-2}]}),
d=>({text:ft("{cn} aus anderer Dimension!"),type:"combat",enemy:mkEnemy("Dimensionsbestie",d+3),reward:{gold:15+roll(10),ruhm:7,fame:4}}),
d=>({text:ft("{adj} Portal zeigt die Zukunft..."),type:"loot",ruhm:6,fame:4}),
],tiefsee:[
d=>({text:ft("DER KRAKEN! Riesige Tentakel!!!"),type:"combat",enemy:mkEnemy("Mächtiger Kraken",d+4),reward:{gold:20+roll(15),ruhm:10,fame:6}}),
d=>({text:ft("Versunkene Stadt glitzert in der Tiefe!"),type:"choice",opts:["Tauchen!","Zu tief"],rews:[{gold:15+roll(15),ruhm:7,fame:4},{}]}),
d=>({text:ft("{adj} Riesenquallen leuchten — wunderschön und tödlich."),type:"choice",opts:["Durchfahren","Umfahren"],rews:[Math.random()>.5?{ruhm:5,fame:3}:{combat:mkEnemy("Riesenquallen",d+2),reward:{gold:8,ruhm:4,fame:2}},{ruhm:2}]}),
d=>({text:ft("Leviathan! Uralte Bestie aus den Tiefen der Zeit!"),type:"combat",enemy:mkEnemy("Leviathan",d+5),reward:{gold:25+roll(20),ruhm:12,fame:8}}),
d=>({text:ft("Biolumineszenz! Die Tiefsee leuchtet in {adj} Farben."),type:"loot",ruhm:4,fame:3}),
],unterwasser:[
d=>({text:ft("Davy Jones persönlich! Seine {adj} Augen mustern euch."),type:"choice",opts:["Verhandeln","Kämpfen","Seele anbieten"],rews:[{ruhm:8,fame:5},{combat:mkEnemy("Davy Jones",d+5),reward:{gold:30,ruhm:15,fame:10}},{gold:20,ruhm:-5,fame:5}]}),
d=>({text:ft("Davy Jones' Schatzkammer! Unvorstellbar!"),type:"loot",gold:20+roll(20),ruhm:8,fame:5}),
d=>({text:ft("{cn} in Jones' Diensten!"),type:"combat",enemy:mkEnemy("Jones' Wächter",d+4),reward:{gold:15+roll(10),ruhm:8,fame:5}}),
d=>({text:ft("Untote bieten Pakt: Gold gegen Gefallen."),type:"choice",opts:["Annehmen","Ablehnen"],rews:[{gold:15+roll(10),ruhm:-2},{ruhm:3,fame:2}]}),
d=>({text:ft("{adj} Perle gigantischer Größe — {tn}!"),type:"loot",gold:25+roll(15),ruhm:10,fame:6}),
],schatz:[
d=>({text:ft("X markiert die Stelle! Graben!"),type:"choice",opts:["Graben!","Falle?"],rews:[Math.random()>.4?{gold:25+roll(20),ruhm:8,fame:5}:{combat:mkEnemy("Schatzhüter",d+3),reward:{gold:30,ruhm:10,fame:6}},{ruhm:2}]}),
d=>({text:ft("{adj} Schatzkammer von {pn}! Voller {tn}!"),type:"loot",gold:20+roll(15),ruhm:8,fame:5}),
d=>({text:ft("Pirat {pn} ist schon da! Wettlauf!"),type:"combat",enemy:mkEnemy(ft("Kapitän {pn}s Crew"),d+3),reward:{gold:20+roll(15),ruhm:6,fame:4}}),
d=>({text:ft("DER LEGENDÄRE SCHATZ! {tn}!"),type:"legendary"}),
d=>({text:ft("Fallen überall! Pfeile, Gruben, Giftnadeln!"),type:"choice",opts:["Vorsichtig","Drauflos"],rews:[{gold:15+roll(10),ruhm:5,fame:3},Math.random()>.4?{gold:15,ruhm:3}:{ruhm:-3}]}),
d=>({text:ft("Fluch auf dem Gold! Trotzdem nehmen?"),type:"choice",opts:["Alles!","Nur etwas","Nein"],rews:[{gold:30+roll(20),ruhm:5,fame:4},{gold:10,ruhm:3,fame:2},{ruhm:4,fame:3}]}),
],thron:[
d=>({text:ft("Rat der Piratenkapitäne! Nur der Würdigste wird König!"),type:"choice",opts:["Anspruch erheben!","Zuhören"],rews:[{combat:mkEnemy("Rivalen-Kapitäne",d+4),reward:{ruhm:15,fame:10,gold:20}},{ruhm:5,fame:3}]}),
d=>({text:ft("Die {adj} Krone der Sieben Meere liegt auf dem Thron!"),type:"legendary"}),
d=>({text:ft("Kapitän {pn} fordert zum finalen Duell!"),type:"combat",enemy:mkEnemy("Piratenkönig",d+5),reward:{ruhm:20,fame:15,gold:30}}),
d=>({text:ft("Geister aller Piratenlegenden prüfen euch!"),type:"combat",enemy:mkEnemy("Geister-Armada",d+5),reward:{ruhm:15,fame:12,gold:20}}),
],verlies:[
d=>({text:ft("Giftschlangen! Der Boden bewegt sich!"),type:"combat",enemy:mkEnemy("Riesenschlangen",d+2),reward:{gold:10+roll(8),ruhm:4,fame:3}}),
d=>({text:ft("{adj} Schatztruhe, bewacht von Fallen!"),type:"choice",opts:["Vorsichtig öffnen","Aufbrechen"],rews:[{gold:12+roll(10),ruhm:4,fame:2},Math.random()>.5?{gold:15,ruhm:3}:{ruhm:-2}]}),
d=>({text:ft("Skelette ehemaliger Abenteurer. Bei einem: {tn}!"),type:"loot",gold:8+roll(8),ruhm:5,fame:3}),
d=>({text:ft("{cn} bewacht den tiefsten Raum!"),type:"combat",enemy:mkEnemy(ft("{cn}"),d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}}),
d=>({text:ft("Inschrift: Kehrt um oder sterbt! Weiter?"),type:"choice",opts:["Weiter","Umkehren"],rews:[Math.random()>.5?{gold:20+roll(10),ruhm:6,fame:4}:{combat:mkEnemy("Verlieshüter",d+3),reward:{gold:15,ruhm:5,fame:3}},{ruhm:1}]}),
],hafen:[
d=>({text:ft("Tavernenprügelei! {pn} beleidigt eure Crew!"),type:"choice",opts:["Draufhauen!","Mittrinken","Ignorieren"],rews:[{combat:mkEnemy("Raufbolde",d),reward:{ruhm:2,fame:1,gold:3}},{ruhm:1,gold:-2,rum:2},{}]}),
d=>({text:ft("Gerüchte: {tn} soll {loc} versteckt sein!"),type:"loot",ruhm:3,fame:2}),
d=>({text:ft("Die Crew feiert! Rum fließt!"),type:"loot",ruhm:1,rum:3}),
d=>({text:ft("Taschendieb! Gold weg!"),type:"choice",opts:["Verfolgen","Hinnehmen"],rews:[Math.random()>.4?{gold:5,ruhm:2}:{ruhm:-1},{gold:-4}]}),
d=>({text:ft("{pn} bietet Geheimwissen über die {sn} für 8 Gold."),type:"choice",opts:["Kaufen","Ablehnen"],rews:[{gold:-8,ruhm:4,fame:2},{}]}),
d=>({text:ft("Bordell & Spielhölle — die Crew will an Land!"),type:"choice",opts:["Erlauben (−5G, +Moral)","Verbieten"],rews:[{gold:-5,rum:5,ruhm:1},{ruhm:-1}]}),
],dorf:[
d=>({text:ft("Fischer bitten um Hilfe: {cn} terrorisieren die Bucht!"),type:"combat",enemy:mkEnemy(ft("{cn}"),d),reward:{gold:5+roll(5),ruhm:3,fame:2}}),
d=>({text:ft("Dorfältester kennt den Weg zu {adj} Schatz {loc}."),type:"loot",ruhm:3,fame:2}),
d=>({text:ft("Frische Vorräte! Crew ist dankbar."),type:"heal",amount:3}),
d=>({text:ft("Kinder bewundern eure Crew! Moral steigt."),type:"loot",ruhm:2,rum:1}),
d=>({text:ft("Schmied verbessert Waffen gratis!"),type:"loot",ruhm:2}),
],
};

function genEvent(rType,fame){const d=Math.floor(fame/10);const pool=EVT[rType]||EVT.flach;const ev=pick(pool)(d);if(ev.reward)ev.reward=scR(ev.reward,d,fame);return{...ev,w100:d100()};}

// ═══════════════════════════════════════════════════════════
//  DICE SYSTEM
// ═══════════════════════════════════════════════════════════
function roll4d6DropLowest(){const dice=[d6(),d6(),d6(),d6()]; dice.sort((a,b)=>a-b); return{dice,total:dice[1]+dice[2]+dice[3],dropped:dice[0]};}

// ═══════════════════════════════════════════════════════════
//  GAME HELPERS
// ═══════════════════════════════════════════════════════════
function createHero(name,raceK,profK,bonusStats){
  const r=RACES[raceK],p=PROFS[profK];
  const st=r.st+(bonusStats?.st||0), ge=r.ge+(bonusStats?.ge||0), in_=r.in_+(bonusStats?.in_||0), bw=r.bw+(bonusStats?.bw||0);
  const hp=r.hp+st;
  return{id:uid(),name,race:raceK,profession:profK,bw,st,ge,in_,hp,maxHp:hp,equipment:[],skills:[p.skills[0]],unlockedSkills:1,emoji:r.emoji};
}
function gNK(heroes){return heroes.filter(h=>h.hp>0).reduce((s,h)=>s+h.st+(PROFS[h.profession]?.nk||0)+(h.equipment||[]).reduce((a,e)=>a+(e.nk||0),0),0);}
function gRW(heroes){return heroes.filter(h=>h.hp>0).reduce((s,h)=>(h.equipment||[]).reduce((a,e)=>a+(e.rw||0),0)+s,0);}

// ═══════════════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════════════
const T={bg:"#0a0e14",card:"#141c26",cardL:"#1e2a38",gold:"#D4A843",goldL:"#F0D78C",goldD:"#8B6914",sea:"#0C3547",seaL:"#1a5276",red:"#C62828",green:"#1B5E20",blue:"#0D47A1",txt:"#E8DCC8",txtD:"#7A6E5A",border:"#2a3a4a",parch:"#F5E6C8"};
const fonts=`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');`;

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════
export default function App(){
  const[phase,setPhase]=useState("menu");
  const[gameId,setGameId]=useState("");const[playerId,setPlayerId]=useState("");const[playerName,setPlayerName]=useState("");
  const[game,setGame]=useState(null);const[joinCode,setJoinCode]=useState("");
  const[ev,setEv]=useState(null);const[combat,setCombat]=useState(null);const[cLog,setCLog]=useState([]);
  const[msg,setMsg]=useState("");
  // Setup state
  const[setupIdx,setSetupIdx]=useState(0);const[heroes,setHeroes]=useState([null,null,null,null]);
  const[cStep,setCStep]=useState("name"); // name,race,prof,roll,assign,buy,done
  const[tName,setTName]=useState("");const[tRace,setTRace]=useState(null);const[tProf,setTProf]=useState(null);
  const[diceRolls,setDiceRolls]=useState([]);const[statAssign,setStatAssign]=useState({bw:0,st:0,ge:0,in_:0});
  const[startGold,setStartGold]=useState(0);
  const pollRef=useRef(null);

  useEffect(()=>{if(phase==="playing"||phase==="lobby"){pollRef.current=setInterval(async()=>{if(gameId){const g=await api.load(gameId);if(g)setGame(g);}},3000);}return()=>{if(pollRef.current)clearInterval(pollRef.current);};},[phase,gameId]);

  const me=game?.players?.find(p=>p.id===playerId);
  const isMyTurn=game?.players?.[game?.currentPlayerIndex]?.id===playerId;
  const curReg=me?REGIONS.find(r=>r.id===me.position):null;
  const myShip=SHIPS.find(s=>s.id===(me?.ship||"jolle"))||SHIPS[0];
  const myPerks=FAME_PERKS.filter(p=>p.fame<=(me?.fame||0));

  // ── UI Components ──
  const Btn=({children,onClick,primary,danger,disabled,small,style:s})=>(<button onClick={onClick} disabled={disabled} style={{padding:small?"8px 12px":"14px 20px",border:`1px solid ${danger?T.red:T.gold}`,borderRadius:10,background:primary?`linear-gradient(135deg,${T.gold},${T.goldD})`:danger?T.red+"22":T.card,color:primary?T.bg:danger?"#ff8a80":T.gold,fontFamily:"'Cinzel',serif",fontSize:small?12:14,fontWeight:700,cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,width:"100%",textAlign:"center",transition:"all .15s",...s}}>{children}</button>);
  const Card=({children,style:s})=>(<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:10,...s}}>{children}</div>);
  const Badge=({children,color})=>(<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,background:(color||T.gold)+"28",color:color||T.gold,fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",marginRight:4}}>{children}</span>);
  const Stat=({label,value,color})=>(<div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:T.txtD,fontFamily:"'Cinzel',serif"}}>{label}</div><div style={{fontSize:17,fontWeight:900,color:color||T.gold,fontFamily:"'Cinzel',serif"}}>{value}</div></div>);
  const Toast=()=>msg?(<div onClick={()=>setMsg("")} style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:T.goldD,color:T.parch,padding:"8px 20px",borderRadius:12,zIndex:999,fontFamily:"'Crimson Text',serif",fontSize:14,boxShadow:"0 4px 24px #000a",cursor:"pointer",maxWidth:"88vw"}}>{msg}</div>):null;

  // ── DICE VISUAL ──
  const DiceFace=({val,dropped})=>(<div style={{width:40,height:40,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:dropped?"#44444444":T.goldD+"44",border:`2px solid ${dropped?T.red+"66":T.gold}`,color:dropped?T.red:T.goldL,fontSize:20,fontWeight:900,fontFamily:"'Cinzel',serif",opacity:dropped?0.4:1,textDecoration:dropped?"line-through":"none"}}>{val}</div>);

  // ── ACTIONS ──
  const createGame=async()=>{if(!playerName.trim()){setMsg("Name!");return;}const gid=uid(),pid=uid();
    const g={id:gid,turn:1,currentPlayerIndex:0,log:[],players:[{id:pid,name:playerName.trim(),position:"tortuga",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],ready:false}],phase:"lobby",winner:null};
    await api.create(g);setGameId(gid);setPlayerId(pid);setGame(g);setPhase("lobby");};
  const joinGame=async()=>{if(!playerName.trim()||!joinCode.trim()){setMsg("Name & Code!");return;}const g=await api.load(joinCode.trim());if(!g){setMsg("Nicht gefunden!");return;}if(g.players.length>=2){setMsg("Voll!");return;}
    const pid=uid();g.players.push({id:pid,name:playerName.trim(),position:"puerto",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],ready:false});
    await api.save(g);setGameId(g.id);setPlayerId(pid);setGame(g);setPhase("lobby");};

  const startSetup=()=>{setSetupIdx(0);setHeroes([null,null,null,null]);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);setStatAssign({bw:0,st:0,ge:0,in_:0});setStartGold(0);setPhase("setup");};

  const rollStats=()=>{const rolls=[roll4d6DropLowest(),roll4d6DropLowest(),roll4d6DropLowest(),roll4d6DropLowest()];setDiceRolls(rolls);setStatAssign({bw:rolls[0].total,st:rolls[1].total,ge:rolls[2].total,in_:rolls[3].total});};
  const rollGold=()=>{const g=(d6()+d6()+d6())*3;setStartGold(g);};

  const swapAssign=(a,b)=>{const ns={...statAssign};const tmp=ns[a];ns[a]=ns[b];ns[b]=tmp;setStatAssign(ns);};

  const finishHero=()=>{
    const hero=createHero(tName.trim(),tRace,tProf,statAssign);
    const nh=[...heroes];nh[setupIdx]=hero;setHeroes(nh);
    if(setupIdx<3){setSetupIdx(setupIdx+1);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);setStatAssign({bw:0,st:0,ge:0,in_:0});}
    else setCStep("done");
  };

  const finishSetup=async()=>{
    if(heroes.some(h=>!h)){setMsg("Alle 4 Helden!");return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    g.players[pi]={...g.players[pi],heroes,gold:startGold,ready:true};
    if(g.players.every(p=>p.ready))g.phase="playing";
    await api.save(g);setGame(g);setPhase(g.players.every(p=>p.ready)?"playing":"lobby");
  };

  const moveTo=async rid=>{if(!isMyTurn)return;const r=REGIONS.find(x=>x.id===rid);
    if(me.fame<r.minF){setMsg(`Brauche ${r.minF}⭐!`);return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi]={...g.players[pi],position:rid};
    await api.save(g);setGame(g);triggerEvent(r);};
  const triggerEvent=r=>{setEv(genEvent(r.type,me.fame));setPhase("event");};
  const explore=()=>{if(!isMyTurn)return;triggerEvent(curReg);};

  const resolveEvent=async ci=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);let rw={};
    if(ev.type==="legendary"){g.winner={id:playerId,name:g.players[pi].name,type:"legendary"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
    if(ev.type==="combat"){startCombat(ev.enemy,ev.reward);return;}
    if(ev.type==="choice"&&ci!==undefined){const r=ev.rews[ci];if(r?.combat){startCombat(r.combat,r.reward||r);return;}rw=r||{};if(r?.heal)g.players[pi].heroes.forEach(h=>{h.hp=Math.min(h.maxHp,h.hp+(r.heal||0));});}
    else if(ev.type==="heal"){g.players[pi].heroes.forEach(h=>{h.hp=Math.min(h.maxHp,h.hp+(ev.amount||2));});}
    else{rw={gold:ev.gold||0,ruhm:ev.ruhm||0,fame:ev.fame||0};}
    const bonus=myPerks.find(p=>p.perk==="doubleRewards")?2:1;
    g.players[pi].gold=Math.max(0,(g.players[pi].gold||0)+((rw.gold||0)*bonus));
    g.players[pi].ruhm=(g.players[pi].ruhm||0)+((rw.ruhm||0)*bonus);
    g.players[pi].fame=(g.players[pi].fame||0)+((rw.fame||0)*bonus);
    if(rw.rum)g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)+rw.rum);
    if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
    g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;
    g.log.push(`${g.players[pi].name}: ${(ev.text||"").slice(0,40)}...`);
    await api.save(g);setGame(g);setEv(null);setPhase("playing");};

  const startCombat=(enemy,reward)=>{setCombat({enemy:{...enemy,curHp:enemy.hp},reward,round:1});setCLog([`⚔️ ${enemy.name}!`]);setPhase("combat");};
  const doCombatRound=()=>{const h=me.heroes.filter(h=>h.hp>0);if(!h.length)return;
    const nk=gNK(me.heroes),rw=gRW(me.heroes);const hR=h.reduce(s=>s+d6(),0),hT=hR+nk;
    const eR=d6()+d6(),eT=eR+combat.enemy.nk;const logs=[...cLog];logs.push(`── R${combat.round} ──`);
    logs.push(`Crew: 🎲${hR}+${nk}=${hT}`);logs.push(`${combat.enemy.name}: 🎲${eR}+${combat.enemy.nk}=${eT}`);
    const ne={...combat.enemy};
    if(hT>eT){const dm=Math.max(1,hT-eT-(ne.rw||0));ne.curHp-=dm;logs.push(`✅ ${dm}dmg → HP:${Math.max(0,ne.curHp)}`);}
    else if(eT>hT){const dm=Math.max(0,eT-hT-rw);if(dm>0){const t=pick(h);t.hp=Math.max(0,t.hp-Math.max(1,dm));logs.push(`❌ ${t.name}: ${Math.max(1,dm)}dmg → HP:${t.hp}`);}else logs.push(`🛡️ Rüstung hält!`);}
    else logs.push(`⚖️ Patt!`);
    setCombat({...combat,enemy:ne,round:combat.round+1});setCLog(logs);};
  const endCombat=async won=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    if(won&&combat.reward){const b=myPerks.find(p=>p.perk==="doubleRewards")?2:1;g.players[pi].ruhm+=(combat.reward.ruhm||0)*b;g.players[pi].fame+=(combat.reward.fame||0)*b;g.players[pi].gold+=(combat.reward.gold||0)*b;}
    g.players[pi].heroes=me.heroes.map(h=>({...h}));
    if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
    g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;
    await api.save(g);setGame(g);setCombat(null);setCLog([]);setEv(null);setPhase("playing");};
  const rest=async()=>{if(!isMyTurn)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    g.players[pi].heroes.forEach(h=>{h.hp=Math.min(h.maxHp,h.hp+3);});g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)-1);
    g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);};
  const buyItem=async item=>{const price=Math.round(item.cost*(SHOP_INVENTORY[curReg?.shop]?.priceMod||1));
    if(me.gold<price){setMsg("Kein Gold!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].gold-=price;
    if(item.rum){g.players[pi].rum=(g.players[pi].rum||0)+item.rum;setMsg(`+${item.rum}🍺`);}
    else if(item.heal){g.players[pi].heroes.forEach(h=>{h.hp=Math.min(h.maxHp,h.hp+item.heal);});setMsg("Geheilt!");}
    else if(item.ammo){setMsg(`+${item.ammo}💣`);}
    else{const hero=g.players[pi].heroes.find(h=>h.hp>0&&!(h.equipment||[]).find(e=>e.id===item.id));
      if(hero){hero.equipment=[...(hero.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji}];setMsg(`${hero.name}: ${item.name}!`);}
      else{setMsg("Keiner kann das tragen!");g.players[pi].gold+=price;}}
    await api.save(g);setGame(g);};
  const buyShip=async ship=>{if(me.gold<ship.cost){setMsg("Kein Gold!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
    g.players[pi].gold-=ship.cost;g.players[pi].ship=ship.id;setMsg(`${ship.name}!`);await api.save(g);setGame(g);};
  const learnSkill=async(hid,skillName)=>{if(me.ruhm<10){setMsg("10 Ruhm nötig!");return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=10;
    const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h.skills=[...(h.skills||[]),skillName];h.unlockedSkills=(h.unlockedSkills||1)+1;
      // Skill bonuses
      if(skillName==="Doppelschlag"||skillName==="Kampfrausch")h.st+=1;
      if(skillName==="Windleser"||skillName==="Fluchtexperte")h.bw+=1;
      if(skillName==="Feilschen")h.in_+=1;
      if(skillName==="Breitseite"||skillName==="Kettenschuss")h.ge+=1;
      if(skillName==="Feldchirurg"||skillName==="Kräuterkunde")h.in_+=1;
      if(skillName==="Geisterruf"||skillName==="Schutzamulett")h.in_+=1;
      setMsg(`${h.name}: ${skillName}!`);}
    g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);};
  const trainStat=async(hid,stat)=>{if(me.ruhm<8){setMsg("8 Ruhm nötig!");return;}
    const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=8;
    const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h[stat]=(h[stat]||0)+1;if(stat==="st"){h.maxHp+=1;h.hp+=1;}setMsg(`${h.name}: ${stat.toUpperCase()}+1!`);}
    g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);};

  // For starting equipment purchase during setup
  const buyStartItem=(item)=>{
    const price=item.cost;if(startGold<price){setMsg("Kein Gold!");return;}
    setStartGold(startGold-price);
    // Add to current hero being built
    const hero=heroes[setupIdx];if(hero){hero.equipment=[...(hero.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji}];
      setMsg(`${hero.name}: ${item.name}!`);setHeroes([...heroes]);}};

  // ═══════════════════════════════════════════════════════════
  //  SCREENS
  // ═══════════════════════════════════════════════════════════

  const Menu=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 80%,${T.seaL} 0%,${T.bg} 70%)`}}>
    <div style={{fontSize:52,marginBottom:8}}>🏴‍☠️</div>
    <div style={{fontSize:11,letterSpacing:8,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRATEN</div>
    <div style={{fontSize:36,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",textShadow:`0 0 40px ${T.gold}44`}}>QUEST</div>
    <div style={{fontSize:12,color:T.txtD,fontFamily:"'Crimson Text',serif",marginBottom:4}}>Herrscher der Sieben Meere</div>
    <div style={{fontSize:9,color:T.txtD+"88",marginBottom:28,textAlign:"center",maxWidth:260}}>Würfelt eure Crew · Segelt die Meere · Handelt & kämpft · Werdet Piratenkönig!</div>
    <div style={{width:"100%",maxWidth:310}}>
      <input placeholder="Euer Piratenname" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
      <Btn primary onClick={createGame}>🏴‍☠️ Neues Spiel</Btn><div style={{height:16}}/>
      <input placeholder="Spielcode" value={joinCode} onChange={e=>setJoinCode(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
      <Btn onClick={joinGame}>🤝 Beitreten</Btn>
    </div>
  </div>);

  const Lobby=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:12,color:T.txtD,fontFamily:"'Cinzel',serif"}}>SPIELCODE</div>
      <div style={{fontSize:26,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",letterSpacing:4,background:T.card,padding:"10px 18px",borderRadius:12,display:"inline-block",border:`2px dashed ${T.gold}`,marginTop:6}}>{gameId}</div>
    </div>
    <Card>{game?.players?.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
      <span style={{fontSize:20}}>{i===0?"🏴‍☠️":"⚓"}</span><span style={{color:T.parch,flex:1,fontSize:16}}>{p.name}</span>
      {p.id===playerId&&<Badge>DU</Badge>}{p.ready&&<Badge color={T.green}>✓</Badge>}</div>))}</Card>
    {!me?.ready?<Btn primary onClick={startSetup}>⚔️ Crew erstellen & ausrüsten</Btn>
    :<Card style={{textAlign:"center"}}><div style={{color:T.txtD}}>{game?.players?.every(p=>p.ready)?"Alle bereit!":"⏳ Warte..."}</div>
      {game?.players?.every(p=>p.ready)&&<div style={{marginTop:10}}><Btn primary onClick={()=>setPhase("playing")}>⛵ Auslaufen!</Btn></div>}</Card>}
  </div>);

  // ── CHARACTER CREATION WITH DICE ──
  const Setup=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:12}}>
      <div style={{fontSize:12,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRAT {setupIdx+1}/4</div>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>{[0,1,2,3].map(i=>(<div key={i} style={{width:32,height:4,borderRadius:2,background:heroes[i]?T.green:i===setupIdx?T.gold:T.border}}/>))}</div>
    </div>

    {cStep==="name"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>🏴‍☠️ Name deines Piraten</div>
      <input placeholder="Name" value={tName} onChange={e=>setTName(e.target.value)} style={{width:"100%",padding:12,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:16,boxSizing:"border-box",marginBottom:10}}/>
      <Btn primary onClick={()=>{if(!tName.trim()){setMsg("Name!");return;}setCStep("race");}}>Weiter →</Btn>
    </Card>}

    {cStep==="race"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>RASSE WÄHLEN</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setTRace(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tRace===k?T.gold+"28":T.card,border:`1px solid ${tRace===k?T.gold:T.border}`}}>
          <div style={{fontSize:16}}>{r.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{r.label}</span></div>
          <div style={{fontSize:9,color:T.txtD}}>{r.desc}</div>
          <div style={{fontSize:8,color:T.txtD,marginTop:2}}>BW:{r.bw} ST:{r.st} GE:{r.ge} IN:{r.in_} HP:{r.hp}</div>
        </div>))}
      </div>
      <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tRace){setMsg("Rasse wählen!");return;}setCStep("prof");}} disabled={!tRace}>Weiter →</Btn></div>
    </>}

    {cStep==="prof"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>BERUF WÄHLEN</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setTProf(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tProf===k?T.gold+"28":T.card,border:`1px solid ${tProf===k?T.gold:T.border}`}}>
          <div style={{fontSize:16}}>{p.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{p.label}</span></div>
          <div style={{fontSize:9,color:T.txtD}}>{p.desc}</div>
          <div style={{fontSize:8,color:T.gold+"88",marginTop:2}}>Start: {p.skills[0]}</div>
        </div>))}
      </div>
      <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tProf){setMsg("Beruf!");return;}setCStep("roll");}} disabled={!tProf}>Weiter → Würfeln!</Btn></div>
    </>}

    {cStep==="roll"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>🎲 STATS AUSWÜRFELN</div>
      <div style={{fontSize:11,color:T.txtD,marginBottom:10}}>4W6, niedrigster fällt weg. Ergebnis = Bonus auf Rassenwerte.</div>
      {diceRolls.length===0?<Btn primary onClick={rollStats}>🎲🎲🎲🎲 WÜRFELN!</Btn>
      :<div>
        {["BW","ST","GE","IN"].map((label,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <div style={{width:28,fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",fontWeight:700}}>{label}</div>
          <div style={{display:"flex",gap:4}}>{diceRolls[i].dice.map((v,j)=>(<DiceFace key={j} val={v} dropped={j===0}/>))}</div>
          <div style={{fontSize:16,fontWeight:900,color:T.goldL,fontFamily:"'Cinzel',serif"}}>= +{diceRolls[i].total}</div>
        </div>))}
        <div style={{fontSize:11,color:T.txtD,marginTop:6,marginBottom:8}}>Tippe auf zwei Stat-Reihen zum Tauschen, oder weiter mit diesen Werten:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
          {[["bw","st"],["ge","in_"]].map(([a,b])=>(<Btn key={a+b} small onClick={()=>swapAssign(a,b)}>↔ {a.toUpperCase()} ⇄ {b.toUpperCase()}</Btn>))}
          {[["bw","ge"],["st","in_"]].map(([a,b])=>(<Btn key={a+b} small onClick={()=>swapAssign(a,b)}>↔ {a.toUpperCase()} ⇄ {b.toUpperCase()}</Btn>))}
        </div>
        <Card style={{background:T.bg}}>
          <div style={{fontSize:11,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>ENDWERTE (Rasse + Würfel)</div>
          <div style={{display:"flex",gap:4}}>
            <Stat label="BW" value={`${RACES[tRace].bw}+${statAssign.bw}=${RACES[tRace].bw+statAssign.bw}`}/>
            <Stat label="ST" value={`${RACES[tRace].st}+${statAssign.st}=${RACES[tRace].st+statAssign.st}`}/>
            <Stat label="GE" value={`${RACES[tRace].ge}+${statAssign.ge}=${RACES[tRace].ge+statAssign.ge}`}/>
            <Stat label="IN" value={`${RACES[tRace].in_}+${statAssign.in_}=${RACES[tRace].in_+statAssign.in_}`}/>
          </div>
        </Card>
        <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <Btn onClick={()=>{setDiceRolls([]);setStatAssign({bw:0,st:0,ge:0,in_:0});}}>🔄 Neu würfeln</Btn>
          <Btn primary onClick={()=>{rollGold();const hero=createHero(tName.trim(),tRace,tProf,statAssign);const nh=[...heroes];nh[setupIdx]=hero;setHeroes(nh);setCStep("gold");}}>✅ Übernehmen</Btn>
        </div>
      </div>}
    </Card>}

    {cStep==="gold"&&<Card>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>💰 STARTGOLD</div>
      {startGold===0?<div><div style={{fontSize:11,color:T.txtD,marginBottom:8}}>Würfle 3W6 × 3 für dein Startkapital!</div>
        <Btn primary onClick={rollGold}>💰 Gold würfeln!</Btn></div>
      :<div>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:28,fontWeight:900,color:"#FFC107",fontFamily:"'Cinzel',serif"}}>{startGold} Gold</div>
        </div>
        <div style={{fontSize:11,color:T.txtD,marginBottom:8}}>Kaufe Startausrüstung für deine Crew:</div>
        <div style={{maxHeight:200,overflow:"auto"}}>
          {ALL_ITEMS.filter(i=>i.tier<=0).map(item=>(<div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${T.border}22`}}>
            <span style={{fontSize:14}}>{item.emoji}</span>
            <div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{item.name}</div>
              <div style={{fontSize:9,color:T.txtD}}>{item.nk>0?`NK+${item.nk} `:"" }{item.fk>0?`FK+${item.fk} `:"" }{item.rw>0?`RW+${item.rw} `:"" }{item.heal?`Heilt+${item.heal} `:"" }{item.rum?`+${item.rum}🍺`:"" }</div></div>
            <Btn small primary onClick={()=>buyStartItem(item)} disabled={startGold<item.cost} style={{width:"auto",minWidth:55}}>{item.cost}💰</Btn>
          </div>))}
        </div>
        <div style={{textAlign:"center",marginTop:8}}><Badge color="#FFC107">Übrig: {startGold}💰</Badge></div>
        <div style={{marginTop:8}}><Btn primary onClick={()=>{if(setupIdx<3){setSetupIdx(setupIdx+1);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);}else setCStep("done");}}>
          {setupIdx<3?`Weiter zu Pirat ${setupIdx+2} →`:"✅ Crew fertig!"}</Btn></div>
      </div>}
    </Card>}

    {cStep==="done"&&<div>
      <Card><div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>EURE CREW</div>
        {heroes.filter(Boolean).map((h,i)=>(<div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"5px 0",borderBottom:i<3?`1px solid ${T.border}22`:"none"}}>
          <span style={{fontSize:16}}>{h.emoji}</span>
          <div style={{flex:1}}><div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</div>
            <div style={{fontSize:9,color:T.txtD}}>BW:{h.bw} ST:{h.st} GE:{h.ge} IN:{h.in_} HP:{h.hp}</div></div>
          <Badge>{PROFS[h.profession]?.label}</Badge>
        </div>))}
      </Card>
      <Btn primary onClick={finishSetup}>🏴‍☠️ Bereit zum Auslaufen!</Btn>
    </div>}
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
          <div style={{fontSize:here?8:7,color:here?T.goldL:canGo?T.parch:T.txtD+"66",fontFamily:"'Cinzel',serif",whiteSpace:"nowrap",marginTop:1,fontWeight:here?700:400}}>{r.name}</div>
          {locked&&<div style={{fontSize:7,color:T.red}}>🔒{r.minF}⭐</div>}
          {canGo&&r.shop&&!locked&&<div style={{fontSize:7,color:"#FFC107"}}>🛒</div>}
        </div>;})}
    </div></Card>;};

  const HeroCards=()=>(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
    {me?.heroes?.map(h=>(<Card key={h.id} style={{padding:8,opacity:h.hp<=0?0.3:1}}>
      <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
        <span style={{fontSize:14}}>{h.emoji}</span><span style={{fontSize:11,fontWeight:700,color:T.parch,fontFamily:"'Cinzel',serif",flex:1}}>{h.name}</span></div>
      <Badge>{PROFS[h.profession]?.label}</Badge>{h.hp<=0&&<Badge color={T.red}>TOT</Badge>}
      <div style={{display:"flex",marginTop:5,gap:1}}><Stat label="HP" value={`${h.hp}/${h.maxHp}`} color={h.hp<=2?T.red:T.green}/><Stat label="ST" value={h.st}/><Stat label="GE" value={h.ge}/><Stat label="IN" value={h.in_}/></div>
      {(h.equipment||[]).length>0&&<div style={{marginTop:3,fontSize:9,color:T.txtD}}>{h.equipment.map(e=>e.emoji).join("")}</div>}
      {(h.skills||[]).length>1&&<div style={{marginTop:2,fontSize:8,color:T.gold+"88"}}>{h.skills.slice(1).join(", ")}</div>}
    </Card>))}</div>);

  const Play=()=>{const other=game?.players?.find(p=>p.id!==playerId);
    return <div style={{padding:14,paddingBottom:90}}>
      <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
        <Badge color={T.gold}>⭐{me?.fame||0}</Badge><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge><Badge color="#FFC107">💰{me?.gold||0}</Badge><Badge color="#FF8F00">🍺{me?.rum||0}</Badge>
        <Badge color={T.seaL}>{myShip.emoji}{myShip.name}</Badge><Badge color={isMyTurn?T.green:T.red}>{isMyTurn?"DEIN ZUG":"WARTE"}</Badge>
      </div>
      {myPerks.length>0&&<div style={{fontSize:9,color:T.gold+"88",marginBottom:4}}>{myPerks[myPerks.length-1].label} — {myPerks[myPerks.length-1].desc}</div>}
      {other&&<div style={{fontSize:10,color:T.txtD,marginBottom:6}}>{other.name}: ⭐{other.fame} 💰{other.gold} · {REGIONS.find(r=>r.id===other.position)?.name}</div>}
      <div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif",marginBottom:6}}>📍 {curReg?.name} {REMO[curReg?.type]}</div>
      <MapView/><HeroCards/>
      {isMyTurn&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <Btn primary onClick={explore}>🎲 Erkunden</Btn>
        <Btn onClick={rest}>🍺 Rasten</Btn>
        {curReg?.shop&&<Btn onClick={()=>setPhase("shop")}>🛒 Laden</Btn>}
        <Btn onClick={()=>setPhase("levelup")}>📈 Aufwerten</Btn>
      </div>}
      {game?.log?.length>0&&<Card style={{marginTop:10}}><div style={{fontSize:10,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>LOGBUCH</div>
        <div style={{maxHeight:60,overflow:"auto"}}>{game.log.slice(-5).reverse().map((l,i)=><div key={i} style={{fontSize:10,color:T.txtD,padding:"1px 0"}}>{l}</div>)}</div></Card>}
    </div>;};

  const Event=()=>(<div style={{minHeight:"100vh",padding:20,display:"flex",flexDirection:"column",justifyContent:"center",background:`radial-gradient(ellipse at 50% 30%,${T.seaL}44,${T.bg} 70%)`}}>
    <Card style={{borderColor:T.gold+"44"}}>
      <div style={{textAlign:"center",marginBottom:8}}><Badge>🎲{ev?.w100}</Badge><Badge color={RCOL[curReg?.type]}>{curReg?.name}</Badge></div>
      <div style={{fontSize:16,color:T.parch,fontFamily:"'Crimson Text',serif",lineHeight:1.5,textAlign:"center",marginBottom:16,fontStyle:"italic"}}>„{ev?.text}"</div>
      {ev?.type==="choice"?<div style={{display:"grid",gap:6}}>{ev.opts.map((o,i)=><Btn key={i} primary={i===0} onClick={()=>resolveEvent(i)}>{o}</Btn>)}</div>
      :ev?.type==="combat"?<Btn primary onClick={()=>resolveEvent()}>⚔️ Kampf!</Btn>
      :ev?.type==="legendary"?<div><div style={{textAlign:"center",fontSize:28,marginBottom:10}}>👑💎🏴‍☠️</div><Btn primary onClick={()=>resolveEvent()}>👑 PIRATENKÖNIG!!!</Btn></div>
      :<div>{((ev?.gold||0)>0||(ev?.ruhm||0)>0||(ev?.fame||0)>0)&&<div style={{textAlign:"center",marginBottom:10,fontSize:14,color:T.green}}>
        {ev?.gold>0&&`💰+${ev.gold} `}{ev?.ruhm>0&&`🏆+${ev.ruhm} `}{ev?.fame>0&&`⭐+${ev.fame}`}</div>}
        {ev?.type==="heal"&&<div style={{textAlign:"center",marginBottom:10,color:T.green}}>❤️ Crew geheilt!</div>}
        <Btn primary onClick={()=>resolveEvent()}>✅ Weiter</Btn></div>}
    </Card>
  </div>);

  const Combat=()=>{const alive=me?.heroes?.filter(h=>h.hp>0).length||0;const eDead=combat?.enemy?.curHp<=0;const pDead=alive===0;
    return <div style={{minHeight:"100vh",padding:20,background:`radial-gradient(ellipse at 50% 20%,${T.red}22,${T.bg} 60%)`}}>
      <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:11,color:T.txtD,fontFamily:"'Cinzel',serif"}}>⚔️ RUNDE {combat?.round||1}</div></div>
      <Card style={{textAlign:"center",borderColor:T.red+"44"}}>
        <div style={{fontSize:24,marginBottom:2}}>👹</div>
        <div style={{fontSize:16,color:T.red,fontFamily:"'Cinzel',serif"}}>{combat?.enemy?.name}</div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6}}><Stat label="HP" value={`${Math.max(0,combat?.enemy?.curHp)}/${combat?.enemy?.hp}`} color={T.red}/><Stat label="NK" value={combat?.enemy?.nk}/><Stat label="RW" value={combat?.enemy?.rw}/></div></Card>
      <HeroCards/>
      <Card style={{maxHeight:100,overflow:"auto",background:T.bg}}>{cLog.map((l,i)=><div key={i} style={{fontSize:11,color:l.startsWith("✅")?T.green:l.startsWith("❌")?T.red:T.parch,padding:"1px 0"}}>{l}</div>)}</Card>
      {eDead?<div style={{marginTop:10}}><div style={{textAlign:"center",color:T.green,fontSize:15,fontFamily:"'Cinzel',serif",marginBottom:8}}>
        🎉 SIEG! {combat.reward&&`+${combat.reward.ruhm||0}🏆 +${combat.reward.fame||0}⭐ +${combat.reward.gold||0}💰`}</div>
        <Btn primary onClick={()=>endCombat(true)}>🏴‍☠️ Beute!</Btn></div>
      :pDead?<div style={{marginTop:10}}><div style={{textAlign:"center",color:T.red,fontSize:15,marginBottom:8}}>💀 Niederlage!</div><Btn danger onClick={()=>endCombat(false)}>😢 Weiter</Btn></div>
      :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}><Btn primary onClick={doCombatRound}>🎲 Angriff!</Btn><Btn danger onClick={()=>endCombat(false)}>🏃 Fliehen</Btn></div>}
    </div>;};

  // ── SHOP with location-specific inventory ──
  const Shop=()=>{const shopData=SHOP_INVENTORY[curReg?.shop]||SHOP_INVENTORY.hafen;const availItems=ALL_ITEMS.filter(i=>shopData.items.includes(i.id));const pm=shopData.priceMod;
    return <div style={{minHeight:"100vh",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif"}}>{shopData.emoji} {shopData.name}</div><Badge color="#FFC107">💰{me?.gold||0}</Badge></div>
      {shopData.shipSale&&<><div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>⛵ SCHIFFE</div>
        <div style={{display:"grid",gap:5,marginBottom:12}}>
          {SHIPS.filter(s=>s.cost>0).map(s=>(<Card key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:me?.ship===s.id?0.4:1}}>
            <div style={{fontSize:20}}>{s.emoji}</div>
            <div style={{flex:1}}><div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{s.name}</div>
              <div style={{fontSize:9,color:T.txtD}}>🔫{s.kan} 📦{s.lade} ❤️{s.rumpf} ⚡{s.spd}</div></div>
            <Btn small primary onClick={()=>buyShip(s)} disabled={me?.gold<s.cost||me?.ship===s.id} style={{width:"auto",minWidth:60}}>
              {me?.ship===s.id?"✓":s.cost+"💰"}</Btn></Card>))}</div></>}
      <div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>🛒 WAREN</div>
      <div style={{display:"grid",gap:5}}>
        {availItems.map(item=>{const price=Math.round(item.cost*pm);return(<Card key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:8}}>
          <div style={{fontSize:16}}>{item.emoji}</div>
          <div style={{flex:1}}><div style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{item.name}</div>
            <div style={{fontSize:9,color:T.txtD}}>{item.nk>0&&`NK+${item.nk} `}{item.fk>0&&`FK+${item.fk} `}{item.rw>0&&`RW+${item.rw} `}{item.heal&&`Heilt+${item.heal} `}{item.rum&&`+${item.rum}🍺 `}{item.ammo&&`+${item.ammo}💣`}{item.bonus&&` ★${item.bonus}`}</div></div>
          <Btn small primary onClick={()=>buyItem(item)} disabled={me?.gold<price} style={{width:"auto",minWidth:55}}>{price}💰</Btn>
        </Card>);})}
      </div>
      <div style={{marginTop:12}}><Btn onClick={()=>setPhase("playing")}>← Zurück</Btn></div></div>;};

  // ── LEVELUP: Train Stats + Learn Skills ──
  const LevelUp=()=>(<div style={{minHeight:"100vh",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif"}}>📈 Aufwerten</div><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge></div>
    {me?.heroes?.filter(h=>h.hp>0).map(h=>{const prof=PROFS[h.profession];const nextSkills=prof.skills.filter(s=>!(h.skills||[]).includes(s));
      return <Card key={h.id}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span style={{fontSize:16}}>{h.emoji}</span>
          <span style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</span><Badge>{prof.label}</Badge></div>
        <div style={{fontSize:10,color:T.txtD,marginBottom:6}}>Stats +1 (8🏆) · Fertigkeit (10🏆) · Beendet Zug</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
          {[["st","ST"],["ge","GE"],["in_","IN"],["bw","BW"]].map(([k,l])=>
            <Btn key={k} small onClick={()=>trainStat(h.id,k)} disabled={me.ruhm<8||!isMyTurn}>{l} {h[k]}→{h[k]+1} (8🏆)</Btn>)}
        </div>
        {nextSkills.length>0&&<><div style={{fontSize:10,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>NEUE FERTIGKEITEN</div>
          <div style={{display:"grid",gap:4}}>{nextSkills.map(s=>
            <Btn key={s} small onClick={()=>learnSkill(h.id,s)} disabled={me.ruhm<10||!isMyTurn}>{s} (10🏆)</Btn>)}</div></>}
      </Card>;})}
    <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>← Zurück</Btn></div></div>);

  const Finished=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:`radial-gradient(ellipse at 50% 40%,${T.gold}22,${T.bg} 70%)`}}>
    <div style={{fontSize:52,marginBottom:10}}>👑🏴‍☠️</div>
    <div style={{fontSize:26,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>{game?.winner?.type==="legendary"?"LEGENDÄRER SIEG!":"PIRATENKÖNIG!"}</div>
    <div style={{fontSize:16,color:T.parch,textAlign:"center",marginBottom:20}}>Kapitän {game?.winner?.name} herrscht über die Sieben Meere!</div>
    {game?.players?.map(p=>(<Card key={p.id} style={{width:"100%",maxWidth:300}}>
      <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif"}}>{p.name}</div>
      <div style={{display:"flex",gap:6,marginTop:6}}><Stat label="⭐" value={p.fame}/><Stat label="🏆" value={p.ruhm}/><Stat label="💰" value={p.gold}/></div></Card>))}
    <div style={{marginTop:20,width:"100%",maxWidth:300}}><Btn primary onClick={()=>{setPhase("menu");setGame(null);setGameId("");}}>🔄 Neues Spiel</Btn></div></div>);

  return(<div style={{background:T.bg,minHeight:"100vh",color:T.txt,fontFamily:"'Crimson Text',serif",maxWidth:600,margin:"0 auto"}}>
    <style>{fonts}{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}button:active{transform:scale(0.97);}`}</style>
    <Toast/>
    {phase==="menu"&&<Menu/>}{phase==="lobby"&&<Lobby/>}{phase==="setup"&&<Setup/>}{phase==="playing"&&<Play/>}
    {phase==="event"&&<Event/>}{phase==="combat"&&<Combat/>}{phase==="shop"&&<Shop/>}{phase==="levelup"&&<LevelUp/>}{phase==="finished"&&<Finished/>}
  </div>);
}
