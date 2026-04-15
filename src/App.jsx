import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// 🏴‍☠️  P I R A T E N Q U E S T  v3 – Herrscher der Sieben Meere
// ══════════════════════════════════════════════════════════════

const pick=a=>a[Math.floor(Math.random()*a.length)];
const roll=s=>Math.floor(Math.random()*s)+1;
const d6=()=>roll(6);const d100=()=>roll(100);const uid=()=>Math.random().toString(36).slice(2,8);

// ── API + Session persistence ──
const api={
  save:async g=>{try{const r=await fetch(`/api/games/${g.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});if(r.ok)return;}catch{}try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{}},
  load:async id=>{try{const r=await fetch(`/api/games/${id}`);if(r.ok)return await r.json();}catch{}try{const d=localStorage.getItem(`pq:${id}`);return d?JSON.parse(d):null;}catch{return null;}},
  create:async g=>{try{await fetch('/api/games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});}catch{}try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{}},
};
function getSessions(){try{return JSON.parse(localStorage.getItem('pq_sessions')||'[]');}catch{return[];}}
function saveSession(s){const all=getSessions().filter(x=>x.gameId!==s.gameId);all.unshift(s);try{localStorage.setItem('pq_sessions',JSON.stringify(all.slice(0,20)));}catch{}}
function removeSession(gid){const all=getSessions().filter(x=>x.gameId!==gid);try{localStorage.setItem('pq_sessions',JSON.stringify(all));}catch{}}

// ═══════════════════════════════════════════════════════════
//  WORLD DATA
// ═══════════════════════════════════════════════════════════
const RACES={
  Freibeuter:{bw:3,st:3,ge:3,in_:3,hp:7,label:"Freibeuter",emoji:"🏴‍☠️",desc:"Allrounder"},
  Sirene:{bw:4,st:2,ge:4,in_:3,hp:5,label:"Sirene",emoji:"🧜",desc:"Schnell & geschickt"},
  Zwergpirat:{bw:2,st:4,ge:2,in_:3,hp:9,label:"Zwergpirat",emoji:"⛏️",desc:"Kanonenspezialist, zaeh"},
  Aeffling:{bw:5,st:1,ge:5,in_:2,hp:4,label:"Aeffling",emoji:"🐒",desc:"Takelage-Akrobat"},
  HaiBlut:{bw:3,st:5,ge:2,in_:1,hp:11,label:"Hai-Blut",emoji:"🦈",desc:"Kampfmaschine"},
  Geisterblut:{bw:3,st:2,ge:3,in_:4,hp:5,label:"Geisterblut",emoji:"👻",desc:"Mystisch"},
  Krakenbrut:{bw:2,st:4,ge:2,in_:3,hp:8,label:"Krakenbrut",emoji:"🐙",desc:"Tentakelgriff"},
  Papageiling:{bw:3,st:1,ge:3,in_:5,hp:4,label:"Papageiling",emoji:"🦜",desc:"Genialer Stratege"},
};
const PROFS={
  Enterer:{label:"Enterer",nk:2,fk:0,emoji:"⚔️",desc:"Nahkampf",skills:["Enterhaken-Meister","Doppelschlag","Kampfrausch","Schildbrecher","Todeswirbel"]},
  Navigator:{label:"Navigator",nk:0,fk:1,emoji:"🧭",desc:"Wege & Flucht",skills:["Sternennavigation","Windleser","Geheimrouten","Sturmreiter","Fluchtexperte"]},
  Schmuggler:{label:"Schmuggler",nk:1,fk:0,emoji:"🗝️",desc:"Handel & Diebstahl",skills:["Schwarzmarkt","Feilschen","Taschendieb","Falsche Flagge","Meisterschmuggler"]},
  Kanonier:{label:"Kanonier",nk:0,fk:2,emoji:"💣",desc:"Fernkampf",skills:["Breitseite","Kettenschuss","Feuerkanone","Praezisionsschuss","Inferno"]},
  Schiffsarzt:{label:"Schiffsarzt",nk:0,fk:0,emoji:"⚕️",desc:"Heilt Crew",skills:["Wundversorgung","Kraeuterkunde","Feldchirurg","Giftkunde","Wiederbelebung"]},
  VoodooPriester:{label:"Voodoo",nk:0,fk:0,emoji:"🔮",desc:"Dunkle Magie",skills:["Verfluchung","Geisterruf","Schutzamulett","Seelenraub","Totenbeschwuerung"]},
};
const SHIPS=[
  {id:"jolle",name:"Jolle",cost:0,kan:0,rumpf:0,spd:1,emoji:"🚣"},
  {id:"schaluppe",name:"Schaluppe",cost:30,kan:2,rumpf:1,spd:2,emoji:"⛵"},
  {id:"brigg",name:"Brigg",cost:80,kan:6,rumpf:2,spd:2,emoji:"🚢"},
  {id:"fregatte",name:"Fregatte",cost:200,kan:12,rumpf:3,spd:3,emoji:"⚓"},
  {id:"galeone",name:"Galeone",cost:500,kan:20,rumpf:4,spd:2,emoji:"🏴‍☠️"},
  {id:"flaggschiff",name:"Flaggschiff",cost:1200,kan:30,rumpf:5,spd:3,emoji:"👑"},
];
// Items: tier gates by fame. heavy=max 1+1perST4+1perST6
const ITEMS=[
  {id:"dolch",cat:"W",name:"Dolch",nk:1,fk:1,rw:0,cost:3,emoji:"🔪",tier:0,heavy:0},
  {id:"saebel",cat:"W",name:"Entermesser",nk:2,fk:0,rw:0,cost:6,emoji:"🗡️",tier:0,heavy:0},
  {id:"pistole",cat:"W",name:"Pistole",nk:0,fk:2,rw:0,cost:8,emoji:"🔫",tier:0,heavy:0},
  {id:"enterhaken",cat:"W",name:"Enterhaken",nk:2,fk:0,rw:0,cost:5,emoji:"🪝",tier:0,heavy:0},
  {id:"rapier",cat:"W",name:"Rapier",nk:3,fk:0,rw:0,cost:14,emoji:"⚔️",tier:1,heavy:0},
  {id:"axt",cat:"W",name:"Enteraxt",nk:4,fk:0,rw:0,cost:20,emoji:"🪓",tier:1,heavy:1},
  {id:"muskete",cat:"W",name:"Muskete",nk:0,fk:3,rw:0,cost:16,emoji:"🔫",tier:1,heavy:1},
  {id:"dreizack",cat:"W",name:"Dreizack",nk:3,fk:1,rw:0,cost:18,emoji:"🔱",tier:1,heavy:1},
  {id:"flamberg",cat:"W",name:"Flamberge",nk:5,fk:0,rw:0,cost:35,emoji:"⚔️",tier:2,heavy:1},
  {id:"doppellauf",cat:"W",name:"Doppellauf",nk:0,fk:4,rw:0,cost:30,emoji:"🔫",tier:2,heavy:0},
  {id:"neptunklinge",cat:"W",name:"Neptunklinge",nk:6,fk:0,rw:0,cost:60,emoji:"🔱",tier:3,heavy:1},
  {id:"donnerbuechse",cat:"W",name:"Donnerbuechse",nk:0,fk:5,rw:0,cost:55,emoji:"💥",tier:3,heavy:1},
  {id:"lederwams",cat:"R",name:"Lederwams",nk:0,fk:0,rw:1,cost:6,emoji:"🧥",tier:0,heavy:0},
  {id:"buckler",cat:"R",name:"Buckler",nk:0,fk:0,rw:1,cost:7,emoji:"🛡️",tier:0,heavy:0},
  {id:"kette",cat:"R",name:"Kettenhemd",nk:0,fk:0,rw:2,cost:15,emoji:"🛡️",tier:1,heavy:1},
  {id:"brust",cat:"R",name:"Brustpanzer",nk:0,fk:0,rw:3,cost:28,emoji:"🛡️",tier:2,heavy:1},
  {id:"drachenschuppe",cat:"R",name:"Drachenschuppe",nk:0,fk:0,rw:4,cost:50,emoji:"🐉",tier:3,heavy:1},
  {id:"amulett",cat:"R",name:"Schutzamulett",nk:0,fk:0,rw:1,cost:25,emoji:"🧿",tier:2,heavy:0},
  {id:"rum",cat:"K",name:"Fass Rum",cost:4,emoji:"🍺",tier:0,rum:5,heavy:0},
  {id:"proviant",cat:"K",name:"Proviant",cost:3,emoji:"🍖",tier:0,heal:3,heavy:0},
  {id:"heiltrank",cat:"K",name:"Kraeutertinktur",cost:10,emoji:"🧪",tier:1,heal:5,heavy:0},
  {id:"elixier",cat:"K",name:"Voodoo-Elixier",cost:25,emoji:"🧪",tier:2,heal:10,heavy:0},
  {id:"kugeln",cat:"K",name:"Kanonenkugeln",cost:5,emoji:"💣",tier:0,ammo:10,heavy:0},
  {id:"dynamit",cat:"K",name:"Dynamit",cost:12,emoji:"🧨",tier:1,heavy:0},
  {id:"fernrohr",cat:"T",name:"Fernrohr",cost:10,emoji:"🔭",tier:0,heavy:0},
  {id:"kompass",cat:"T",name:"Mag. Kompass",cost:22,emoji:"🧭",tier:1,heavy:0},
  {id:"seil",cat:"T",name:"Seil",cost:4,emoji:"🪢",tier:0,heavy:0},
  {id:"fackel",cat:"T",name:"Laterne",cost:3,emoji:"🏮",tier:0,heavy:0},
  {id:"voodoo",cat:"M",name:"Voodoo-Puppe",cost:18,emoji:"🪆",tier:1,heavy:0},
  {id:"seekarte",cat:"M",name:"Myst. Seekarte",cost:30,emoji:"🗺️",tier:2,heavy:0},
  {id:"geisterflasche",cat:"M",name:"Geisterflasche",cost:40,emoji:"🫧",tier:3,heavy:0},
];
const TIER_FAME={0:0,1:10,2:25,3:40};
const SHOP_INV={
  hafen:{name:"Tortuga Piratenladen",emoji:"🏴‍☠️",ids:["dolch","saebel","pistole","enterhaken","rapier","muskete","lederwams","kette","buckler","rum","proviant","heiltrank","kugeln","dynamit","fernrohr","seil","fackel","voodoo","flamberg","doppellauf","brust","elixier","kompass","seekarte","neptunklinge","donnerbuechse","drachenschuppe","geisterflasche","amulett"],pm:1.0,ships:true},
  dorf:{name:"Fischerhaendler",emoji:"🏘️",ids:["dolch","enterhaken","lederwams","proviant","rum","seil","fackel","heiltrank","buckler"],pm:1.15,ships:false},
  stadt:{name:"Goldkuesten-Basar",emoji:"🏰",ids:["rapier","axt","flamberg","doppellauf","dreizack","kette","brust","buckler","rum","heiltrank","elixier","kugeln","dynamit","fernrohr","kompass","voodoo","amulett","seekarte","geisterflasche","neptunklinge","donnerbuechse","drachenschuppe"],pm:0.9,ships:true},
  festung:{name:"Militaervorraete",emoji:"⚔️",ids:["rapier","axt","flamberg","muskete","doppellauf","kette","brust","buckler","kugeln","dynamit","neptunklinge","donnerbuechse","drachenschuppe"],pm:0.75,ships:false},
};
const RECRUIT_BASE=15;
const HEAL_COST_BASE=8;
const CURSES=[
  {id:"seekrank",name:"Seekrankheit",desc:"BW-1",stat:"bw",mod:-1},
  {id:"pech",name:"Pech",desc:"Gold halbiert",stat:null,mod:0,halfGold:true},
  {id:"jones",name:"Jones Fluch",desc:"ST-1",stat:"st",mod:-1},
  {id:"geist",name:"Geisterblick",desc:"IN-1",stat:"in_",mod:-1},
  {id:"klumpf",name:"Klumpfuss",desc:"GE-1",stat:"ge",mod:-1},
  {id:"meuterei",name:"Meuterei-Fluch",desc:"-3 Rum/Rast",stat:null,mod:0,extraRum:true},
];
const REGIONS=[
  {id:"tortuga",name:"Tortuga",type:"hafen",x:50,y:90,minF:0,conn:["flache_see","handelsweg"],shop:"hafen",port:true,tavern:true},
  {id:"puerto",name:"Puerto Seguro",type:"dorf",x:22,y:85,minF:0,conn:["flache_see","mangroven"],shop:"dorf",port:true},
  {id:"flache_see",name:"Flache See",type:"flach",x:38,y:75,minF:0,conn:["tortuga","puerto","handelsweg","korallenriff","mangroven"]},
  {id:"handelsweg",name:"Handelsstrasse",type:"handel",x:62,y:72,minF:0,conn:["tortuga","flache_see","korallenriff","goldkueste"]},
  {id:"mangroven",name:"Mangroven",type:"sumpf",x:15,y:65,minF:5,conn:["puerto","flache_see","geisterinsel","schlangennest"]},
  {id:"korallenriff",name:"Korallenriff",type:"riff",x:50,y:60,minF:8,conn:["flache_see","handelsweg","nebelbank","haifischbucht"]},
  {id:"goldkueste",name:"Goldkueste",type:"stadt",x:78,y:58,minF:10,conn:["handelsweg","festung","haifischbucht"],shop:"stadt",port:true,tavern:true},
  {id:"nebelbank",name:"Nebelbank",type:"nebel",x:35,y:48,minF:12,conn:["korallenriff","geisterinsel","bermuda"]},
  {id:"haifischbucht",name:"Haifischbucht",type:"hai",x:65,y:45,minF:15,conn:["korallenriff","goldkueste","vulkaninsel","krakentiefen"]},
  {id:"geisterinsel",name:"Geisterinsel",type:"geister",x:18,y:42,minF:18,conn:["mangroven","nebelbank","davyjones"]},
  {id:"schlangennest",name:"Schlangennest",type:"verlies",x:8,y:55,minF:15,conn:["mangroven"]},
  {id:"festung",name:"Festung",type:"festung",x:85,y:48,minF:20,conn:["goldkueste","vulkaninsel"],shop:"festung"},
  {id:"vulkaninsel",name:"Vulkaninsel",type:"vulkan",x:70,y:32,minF:25,conn:["haifischbucht","festung","schatzinsel"]},
  {id:"bermuda",name:"Bermuda",type:"bermuda",x:38,y:32,minF:25,conn:["nebelbank","krakentiefen","schatzinsel"]},
  {id:"krakentiefen",name:"Krakentiefen",type:"tiefsee",x:55,y:25,minF:30,conn:["haifischbucht","bermuda","davyjones"]},
  {id:"davyjones",name:"Davy Jones",type:"unterwasser",x:25,y:22,minF:35,conn:["geisterinsel","krakentiefen"]},
  {id:"schatzinsel",name:"Schatzinsel",type:"schatz",x:58,y:12,minF:40,conn:["vulkaninsel","bermuda","thron"]},
  {id:"thron",name:"Piratenthron",type:"thron",x:50,y:3,minF:50,conn:["schatzinsel"]},
];
const SEA_TYPES=["flach","handel","riff","hai","tiefsee","nebel","bermuda","unterwasser"];
const RCOL={hafen:"#D4A843",dorf:"#8B9E6B",flach:"#4FC3F7",handel:"#FFB74D",sumpf:"#5D4037",riff:"#26C6DA",stadt:"#FFD700",nebel:"#90A4AE",hai:"#EF5350",geister:"#7E57C2",verlies:"#4A148C",festung:"#B71C1C",vulkan:"#FF5722",bermuda:"#6A1B9A",tiefsee:"#0D47A1",unterwasser:"#00695C",schatz:"#FFC107",thron:"#FFD700"};
const REMO={hafen:"🏴‍☠️",dorf:"🏘️",flach:"🌊",handel:"⛵",sumpf:"🌿",riff:"🐠",stadt:"🏰",nebel:"🌫️",hai:"🦈",geister:"👻",verlies:"🐍",festung:"🏰",vulkan:"🌋",bermuda:"🔮",tiefsee:"🐙",unterwasser:"🫧",schatz:"💎",thron:"👑"};

// ═══════════════════════════════════════════════════════════
//  EVENT ENGINE (3000+ combinatorial)
// ═══════════════════════════════════════════════════════════
const PN=["Einauge","Rotbart","Schwarzzahn","La Muerte","Knochenbrecher","Silberfinger","Sturmwind","Bluthund","Donnerschlag","Goldkralle","Schlangenauge","Nebelfaust","Totenkopf-Tom","Haifisch-Henri","Eisenbart","Krakenjager","Dunkle Dolores","Teufelszunge","Galgenvogel","Rum-Rosita","Feuerfaust","Giftzahn","Wirbelwind-Wanda","Voodoo-Vic","Krumsabel-Karl","Narbengesicht","Sturmbraut","Eisenhaken","Goldzahn-Gustav","Mondauge","Taifun-Tessa","Messerhans","Kanonen-Klaus","Korallen-Koenig","Seemine-Sam","Ankerfaust","Schwarze Witwe","Schaedelbrecher","Vulkan-Vera","Dreizack-Dimitri","Seeteufel","Nebelkraehe","Donnergroll","Kielholer","Nordwind-Nils","Salzblut","Riffbrecher","Sturmfalke","Breitseite-Bernd","Flaschenteufel","Brandungshexe","Wellenbrecher","Nebelhorn","Schatzgraber","Korallenherz","Meuterer-Moritz","Barrakuda-Bella","Leuchtqualle","Salzfinger","Wellentanzerin","Seemannsgarn","Reling-Rosa"];
const SN=["Sturmkraehe","Schwarze Perle","Blutige Mary","Seewolf","Nebeltanzerin","Todesschwinge","Goldener Hai","Meerjungfrau","Krakenzorn","Geisterschiff","Feuersbrunst","Sturmbrecher","Mondschatten","Wellenreiter","Korallendolch","Phantomklinge","Teufelsklaue","Piranhabiss","Leuchtfeuer","Ankerschreck","Voodoo-Queen","Salzwind","Neptuns Zorn","Galgenhumor","Schattensegel","Hoellenfeuer","Eisenkiel","Sturmvogel","Kanonendonner","Nachtfalke","Blutrausch","Silberpfeil","Haifischzahn","Donnerkeil","Totenstille","Barrakuda","Perlentaucher","Bugwelle","Seemannsbraut"];
const CN=["Riesenkrake","Seeschlange","Geisterpiraten","Untote Matrosen","Riffhaie","Sumpfkrokodil","Giftige Quallen","Sirenen","Wasserelementar","Skelettcrew","Seehexe","Seeteufel","Piranha-Schwarm","Zombiepiraten","Voodoo-Golem","Sturmgeist","Nebeldamon","Korallenwachter","Lava-Krabbe","Vulkandrache","Bermuda-Phantom","Tentakelhorror","Flutwurm","Muschelgolem","Gezeitenbestie","Feuerfisch","Hai-Koenig","Todesrochen","Barrakuda-Rudel","Hammerhai","Tiefseekrake","Leviathan-Junges"];
const ADJ=["verfluchte","goldene","vergessene","gespenstische","uralte","verrostete","leuchtende","mysterioese","finstere","verborgene","verdammte","zerbrochene","legendaere","verschollene","geheime","stuermische","tosende","neblige","dunkle","brennende","eisige","giftige","schimmernde","blutige","silberne","kristallene","schwarze","smaragdgruene","pechschwarze","mondbeleuchtete","toedliche","verzauberte"];
const TN=["Aztekengold","Rubinkrone","Smaragdkelch","Neptuns Dreizack","Sirenenharfe","Krakens Herz","Davy Jones Schluessel","Poseidons Guertel","Schwarzer Opal","Blutrubin","Mondperle","Vulkanjuwel","Korallendiadem","Gezeitenring","Meerjungfrauen-Traene","Piratenkoenigssiegel","Kristallschadel","Flammenherz","Diamantsabel","Obsidianmaske","Phoenixfeder","Leviathans Schuppe","Weltenkompass","Schicksalswuerfel"];
const CARGO=["Rum","Gewuerze","Seide","Elfenbein","Tabak","Zucker","Tee","Kanonenpulver","Silberbarren","Goldmuenzen","Edelsteine","Waffen","Medizin"];
const LOC=["in einer Felshoehle","am Strand","in einem Wrack","unter Wasser","auf einer Klippe","in einem Dschungel","in einer Ruine","in einem Vulkankrater","in einer Grotte"];
function ft(t){return t.replace(/\{pn\}/g,()=>pick(PN)).replace(/\{sn\}/g,()=>pick(SN)).replace(/\{cn\}/g,()=>pick(CN)).replace(/\{adj\}/g,()=>pick(ADJ)).replace(/\{tn\}/g,()=>pick(TN)).replace(/\{cargo\}/g,()=>pick(CARGO)).replace(/\{loc\}/g,()=>pick(LOC));}
function mkE(n,d){const b=3+d*2;return{name:n,nk:b+roll(3),hp:b+roll(4),rw:Math.floor(d/2)};}
const E={
flach:[d=>({text:ft("{adj} Handelsschiff der {sn} kreuzt euren Kurs."),type:"choice",opts:["Handeln","Ueberfallen","Vorbei"],rews:[{gold:3+roll(5),ruhm:1},{combat:mkE("Handelswachen",d),reward:{gold:10+roll(8),ruhm:2,fame:1}},{}]}),d=>({text:ft("Treibgut der {sn}! Faesser mit {cargo}!"),type:"loot",gold:3+roll(6),ruhm:1}),d=>({text:ft("{cn} tauchen auf!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:roll(5),ruhm:2,fame:1}}),d=>({text:ft("Fischer bieten Fang an."),type:"heal",amount:2+roll(2)}),d=>({text:ft("Flaschenpost! {adj} Schatzkarte von {pn}!"),type:"loot",ruhm:3,fame:1}),d=>({text:ft("{adj} Kauffahrteischiff mit {cargo} in Seenot!"),type:"choice",opts:["Retten","Pluendern","Ignorieren"],rews:[{ruhm:4,fame:2,gold:roll(5)},{gold:10+roll(8),ruhm:-1},{}]}),d=>({text:ft("Delfine! Moral steigt!"),type:"loot",ruhm:1,rum:2}),d=>({text:ft("Marine-Kutter! Schnell reagieren!"),type:"skilltest",stat:"ge",diff:4+d,pass:{ruhm:3,fame:1},fail:{combat:mkE("Marine",d+1),reward:{gold:12,ruhm:3,fame:2}}}),d=>({text:ft("{pn} fordert zum Wuerfelduell!"),type:"choice",opts:["Annehmen","Nein"],rews:[Math.random()>.5?{gold:8,ruhm:2,fame:1}:{gold:-5},{}]}),d=>({text:ft("Ausguck: {adj} Insel!"),type:"skilltest",stat:"in_",diff:3+d,pass:{gold:6+roll(8),ruhm:3,fame:2},fail:{ruhm:1}}),d=>({text:ft("Sturm! Navigator muss steuern!"),type:"skilltest",stat:"ge",diff:5+d,pass:{ruhm:3,fame:1},fail:{gold:-3}}),d=>({text:ft("Ruhige See. Guter Tag."),type:"nothing"}),d=>({text:ft("Alter Matrose auf Fass: kennt {tn}!"),type:"loot",ruhm:4,fame:2}),d=>({text:ft("{adj} Handelsposten auf kleiner Insel."),type:"trade",gold:roll(5)})],
handel:[d=>({text:ft("Galeone {sn} mit {cargo}!"),type:"choice",opts:["Ueberfallen","Handeln","Lassen"],rews:[{combat:mkE("Galeonen-Wachen",d+1),reward:{gold:15+roll(15),ruhm:3,fame:2}},{gold:5+roll(5)},{}]}),d=>({text:ft("Konvoi! Nachtangriff?"),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:20+roll(10),ruhm:4,fame:2},fail:{combat:mkE("Konvoi-Eskorte",d+2),reward:{gold:25+roll(15),ruhm:5,fame:3}}}),d=>({text:ft("Schmuggler {pn} bietet {cargo}."),type:"skilltest",stat:"in_",diff:4+d,pass:{gold:5,ruhm:2},fail:{gold:-8}}),d=>({text:ft("Sinkender Frachter! {cargo}!"),type:"loot",gold:6+roll(10),ruhm:2}),d=>({text:ft("Marine-Fregatte {sn}! Kampf!"),type:"combat",enemy:mkE("Marine-Fregatte",d+2),reward:{gold:15+roll(10),ruhm:4,fame:3}}),d=>({text:ft("Passagierschiff!"),type:"choice",opts:["Ueberfallen","Lassen"],rews:[{combat:mkE("Leibwaechter",d),reward:{gold:20+roll(10),ruhm:2,fame:2}},{ruhm:1}]}),d=>({text:ft("Treibende Faesser mit {cargo}."),type:"loot",gold:4+roll(6),ruhm:1})],
sumpf:[d=>({text:ft("{adj} Krokodil!"),type:"combat",enemy:mkE("Sumpfkrokodil",d),reward:{gold:roll(4),ruhm:2,fame:1}}),d=>({text:ft("Giftnebel! Staerke!"),type:"skilltest",stat:"st",diff:4+d,pass:{ruhm:3,fame:1},fail:{dmgAll:1}}),d=>({text:ft("Voodoo-Priesterin {pn}."),type:"choice",opts:["Besuchen","Meiden"],rews:[Math.random()>.4?{ruhm:4,fame:2,heal:3,removeCurse:true}:{curse:true},{}]}),d=>({text:ft("Versunkenes Piratenlager!"),type:"loot",gold:6+roll(8),ruhm:2,fame:1}),d=>({text:ft("{cn} aus dem Morast!"),type:"combat",enemy:mkE(ft("{cn}"),d+1),reward:{gold:roll(6),ruhm:3,fame:2}}),d=>({text:ft("Geheimer Wasserweg!"),type:"skilltest",stat:"in_",diff:4+d,pass:{ruhm:4,fame:2},fail:{ruhm:0}})],
riff:[d=>({text:ft("Schiff auf {adj} Riff!"),type:"skilltest",stat:"ge",diff:4+d,pass:{ruhm:2},fail:{gold:-5}}),d=>({text:ft("Gold unter Wasser!"),type:"skilltest",stat:"ge",diff:3+d,pass:{gold:8+roll(10),ruhm:2,fame:1},fail:{dmgAll:1}}),d=>({text:ft("{cn} am Riff!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:roll(6),ruhm:3,fame:1}}),d=>({text:ft("Wrack der {sn}!"),type:"choice",opts:["Erkunden","Weiter"],rews:[{gold:10+roll(8),ruhm:4,fame:2},{}]}),d=>({text:ft("Perlenmuscheln!"),type:"loot",gold:5+roll(8),ruhm:2}),d=>({text:ft("{adj} Unterwasserhoehle!"),type:"choice",opts:["Tauchen","Nein"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:5,fame:3}:{combat:mkE("Hoehlenwachter",d+2),reward:{gold:20,ruhm:4,fame:3}},{}]})],
hai:[d=>({text:ft("Weisser Hai!"),type:"combat",enemy:mkE("Weisser Hai",d+1),reward:{gold:roll(4),ruhm:4,fame:2}}),d=>({text:ft("Haifisch-Arena! {pn} laed ein!"),type:"choice",opts:["Wetten(5G)","Kaempfen","Nein"],rews:[Math.random()>.5?{gold:10,ruhm:2}:{gold:-5},{combat:mkE("Arena-Hai",d+1),reward:{gold:15,ruhm:5,fame:3}},{}]}),d=>({text:ft("Hai-Krieger von {pn}!"),type:"choice",opts:["Verhandeln","Angreifen"],rews:[{ruhm:2,fame:1},{combat:mkE("Hai-Krieger",d+1),reward:{gold:10,ruhm:4,fame:2}}]}),d=>({text:ft("Im Haimagen: {adj} Schwert!"),type:"loot",gold:8+roll(6),ruhm:3,fame:1}),d=>({text:ft("Hammerhaie! Mut!"),type:"skilltest",stat:"st",diff:5+d,pass:{ruhm:4,fame:2},fail:{dmgAll:2}})],
geister:[d=>({text:ft("Geisterschiff {sn}!"),type:"combat",enemy:mkE("Geisterpiraten",d+2),reward:{gold:12+roll(10),ruhm:5,fame:3}}),d=>({text:ft("Geist von {pn}!"),type:"choice",opts:["Befragen","Fliehen","Voodoo"],rews:[{ruhm:5,fame:3},{},{ruhm:6,fame:4,gold:roll(8)}]}),d=>({text:ft("{adj} Friedhof."),type:"choice",opts:["Graeber oeffnen","Respekt"],rews:[Math.random()>.5?{gold:15+roll(10),ruhm:3,fame:2}:{combat:mkE("Untote",d+2),reward:{gold:10,ruhm:4,fame:3}},{ruhm:3,fame:2}]}),d=>({text:ft("Irrlichter! Intelligenz!"),type:"skilltest",stat:"in_",diff:5+d,pass:{gold:10+roll(8),ruhm:5,fame:3},fail:{curse:true}}),d=>({text:ft("Skelettkrieger!"),type:"combat",enemy:mkE("Skelettarmee",d+2),reward:{gold:8+roll(8),ruhm:5,fame:3}}),d=>({text:ft("{adj} Truhe — Falle?"),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:20+roll(10),ruhm:3},fail:{combat:mkE("Geisterwachter",d+2),reward:{gold:15,ruhm:5,fame:3}}})],
nebel:[d=>({text:ft("Schreie! Schiff von {cn} angegriffen!"),type:"choice",opts:["Helfen","Weiter"],rews:[{combat:mkE(ft("{cn}"),d+1),reward:{gold:10,ruhm:6,fame:3}},{}]}),d=>({text:ft("Nebel lichtet — {adj} Insel!"),type:"loot",gold:5+roll(8),ruhm:3,fame:2}),d=>({text:ft("Kompass wild! Navigator!"),type:"skilltest",stat:"in_",diff:5+d,pass:{ruhm:4,fame:2},fail:{ruhm:-2}}),d=>({text:ft("Sirenengesang!"),type:"skilltest",stat:"in_",diff:4+d,pass:{ruhm:3},fail:{combat:mkE("Sirenen",d+1),reward:{gold:8,ruhm:4,fame:2}}})],
festung:[d=>({text:ft("Kanonenbeschuss!"),type:"combat",enemy:mkE("Festungskanonen",d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}}),d=>({text:ft("{adj} Geheimgang!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:25+roll(15),ruhm:7,fame:5},fail:{combat:mkE("Festungswachen",d+2),reward:{gold:20,ruhm:6,fame:4}}}),d=>({text:ft("Gefangene Piraten!"),type:"choice",opts:["Befreien","Nein"],rews:[{combat:mkE("Garnison",d+2),reward:{ruhm:8,fame:5,gold:5}},{}]}),d=>({text:ft("Schatzkammer!"),type:"choice",opts:["Ueberfall!","Schleichen"],rews:[{combat:mkE("Elitegarde",d+3),reward:{gold:30+roll(20),ruhm:8,fame:5}},{gold:15+roll(10),ruhm:5,fame:3}]})],
vulkan:[d=>({text:ft("Lavastroeme!"),type:"skilltest",stat:"ge",diff:5+d,pass:{ruhm:5,fame:3},fail:{dmgAll:2}}),d=>({text:ft("{adj} Drache bewacht {tn}!"),type:"combat",enemy:mkE("Vulkandrache",d+3),reward:{gold:20+roll(15),ruhm:8,fame:5}}),d=>({text:ft("Heisse Quellen!"),type:"heal",amount:4}),d=>({text:ft("Obsidianwaffen!"),type:"loot",gold:10+roll(8),ruhm:4,fame:2}),d=>({text:ft("Feuerelementar!"),type:"combat",enemy:mkE("Feuerelementar",d+3),reward:{gold:12+roll(10),ruhm:6,fame:4}})],
bermuda:[d=>({text:ft("Zeitverzerrung!"),type:"skilltest",stat:"in_",diff:6+d,pass:{ruhm:6,fame:4},fail:{curse:true}}),d=>({text:ft("Dimensionsriss!"),type:"choice",opts:["Hindurch!","Nein"],rews:[Math.random()>.4?{gold:30+roll(20),ruhm:8,fame:5}:{combat:mkE("Dimensionswachter",d+3),reward:{gold:20,ruhm:6,fame:4}},{ruhm:2}]}),d=>({text:ft("Strudel!"),type:"skilltest",stat:"st",diff:6+d,pass:{ruhm:5,fame:3},fail:{gold:-10}}),d=>({text:ft("{cn} aus anderer Dimension!"),type:"combat",enemy:mkE("Dimensionsbestie",d+3),reward:{gold:15+roll(10),ruhm:7,fame:4}})],
tiefsee:[d=>({text:ft("DER KRAKEN!!!"),type:"combat",enemy:mkE("Kraken",d+4),reward:{gold:20+roll(15),ruhm:10,fame:6}}),d=>({text:ft("Versunkene Stadt!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:15+roll(15),ruhm:7,fame:4},fail:{dmgAll:2}}),d=>({text:ft("Leviathan!"),type:"combat",enemy:mkE("Leviathan",d+5),reward:{gold:25+roll(20),ruhm:12,fame:8}}),d=>({text:ft("Biolumineszenz!"),type:"loot",ruhm:4,fame:3})],
unterwasser:[d=>({text:ft("Davy Jones!"),type:"choice",opts:["Verhandeln","Kaempfen"],rews:[{ruhm:8,fame:5},{combat:mkE("Davy Jones",d+5),reward:{gold:30,ruhm:15,fame:10}}]}),d=>({text:ft("Jones Schatzkammer!"),type:"loot",gold:20+roll(20),ruhm:8,fame:5}),d=>({text:ft("{cn} in Jones Diensten!"),type:"combat",enemy:mkE("Jones Wachter",d+4),reward:{gold:15+roll(10),ruhm:8,fame:5}}),d=>({text:ft("{adj} Riesenperle — {tn}!"),type:"loot",gold:25+roll(15),ruhm:10,fame:6})],
schatz:[d=>({text:ft("X markiert die Stelle!"),type:"skilltest",stat:"in_",diff:5+d,pass:{gold:25+roll(20),ruhm:8,fame:5},fail:{combat:mkE("Schatzhueter",d+3),reward:{gold:30,ruhm:10,fame:6}}}),d=>({text:ft("{adj} Schatzkammer von {pn}!"),type:"loot",gold:20+roll(15),ruhm:8,fame:5}),d=>({text:ft("Pirat {pn} ist schon da!"),type:"combat",enemy:mkE(ft("Kpt. {pn}"),d+3),reward:{gold:20+roll(15),ruhm:6,fame:4}}),d=>({text:ft("DER LEGENDAERE SCHATZ! {tn}!"),type:"legendary"}),d=>({text:ft("Fallen! Geschick!"),type:"skilltest",stat:"ge",diff:6+d,pass:{gold:15+roll(10),ruhm:5,fame:3},fail:{dmgAll:3}})],
thron:[d=>({text:ft("Piratenrat! Duell!"),type:"combat",enemy:mkE("Rivalen",d+4),reward:{ruhm:15,fame:10,gold:20}}),d=>({text:ft("{adj} Krone der Meere!"),type:"legendary"}),d=>({text:ft("{pn} fordert zum Duell!"),type:"combat",enemy:mkE("Piratenkoenig",d+5),reward:{ruhm:20,fame:15,gold:30}})],
verlies:[d=>({text:ft("Giftschlangen!"),type:"skilltest",stat:"ge",diff:5+d,pass:{gold:10+roll(8),ruhm:4,fame:3},fail:{combat:mkE("Riesenschlangen",d+2),reward:{gold:10,ruhm:4,fame:3}}}),d=>({text:ft("{adj} Schatztruhe — Fallen!"),type:"skilltest",stat:"ge",diff:4+d,pass:{gold:12+roll(10),ruhm:4,fame:2},fail:{dmgAll:2}}),d=>({text:ft("Skelette. Bei einem: {tn}!"),type:"loot",gold:8+roll(8),ruhm:5,fame:3}),d=>({text:ft("{cn} bewacht den Raum!"),type:"combat",enemy:mkE(ft("{cn}"),d+3),reward:{gold:15+roll(10),ruhm:6,fame:4}})],
hafen:[d=>({text:ft("Prugelei! {pn} beleidigt!"),type:"skilltest",stat:"st",diff:3+d,pass:{ruhm:2,fame:1,gold:3},fail:{gold:-2}}),d=>({text:ft("Geruechte: {tn} {loc}!"),type:"loot",ruhm:3,fame:2}),d=>({text:ft("Crew feiert! Rum fliesst!"),type:"loot",ruhm:1,rum:3}),d=>({text:ft("Taschendieb!"),type:"skilltest",stat:"ge",diff:3+d,pass:{gold:5,ruhm:2},fail:{gold:-4}}),d=>({text:ft("{pn}: Geheimwissen fuer 8G."),type:"choice",opts:["Kaufen","Nein"],rews:[{gold:-8,ruhm:4,fame:2},{}]}),d=>({text:ft("Crew will an Land!"),type:"choice",opts:["Erlauben(-5G)","Nein"],rews:[{gold:-5,rum:5,ruhm:1},{ruhm:-1}]})],
dorf:[d=>({text:ft("Fischer: {cn} terrorisiert!"),type:"combat",enemy:mkE(ft("{cn}"),d),reward:{gold:5+roll(5),ruhm:3,fame:2}}),d=>({text:ft("Aeltester kennt {adj} Schatz."),type:"loot",ruhm:3,fame:2}),d=>({text:ft("Frische Vorraete!"),type:"heal",amount:3}),d=>({text:ft("Kinder bewundern Crew!"),type:"loot",ruhm:2,rum:1})],
};
function genEv(rType,fame){const d=Math.floor(fame/10);const pool=E[rType]||E.flach;return{...pick(pool)(d),w100:d100()};}

// ═══════════════════════════════════════════════════════════
//  GAME HELPERS
// ═══════════════════════════════════════════════════════════
function roll4d6(){const d=[roll(6),roll(6),roll(6),roll(6)];d.sort((a,b)=>a-b);return{dice:d,total:d[1]+d[2]+d[3],dropped:d[0]};}
function mkHero(name,rK,pK,bonus){const r=RACES[rK],p=PROFS[pK];const h={id:uid(),name,race:rK,profession:pK,bw:r.bw+(bonus?.bw||0),st:r.st+(bonus?.st||0),ge:r.ge+(bonus?.ge||0),in_:r.in_+(bonus?.in_||0),equipment:[],skills:[p.skills[0]],emoji:r.emoji};h.maxHp=r.hp+h.st;h.hp=h.maxHp;return h;}
function mkRecruit(name,rK,pK){return mkHero(name,rK,pK,{bw:roll(3),st:roll(3),ge:roll(3),in_:roll(3)});} // Recruits get random small bonus
function hNK(h,curses){let v=h.st+(PROFS[h.profession]?.nk||0)+(h.equipment||[]).reduce((s,e)=>s+(e.nk||0),0);(curses||[]).forEach(c=>{if(c.stat==="st")v+=c.mod;});return Math.max(0,v);}
function hRW(h){return(h.equipment||[]).reduce((s,e)=>s+(e.rw||0),0);}
function hMaxHeavy(h){return 1+(h.st>=4?1:0)+(h.st>=6?1:0);}
function hCurHeavy(h){return(h.equipment||[]).reduce((s,e)=>s+(e.heavy||0),0);}
function skillTest(heroes,stat,diff,curses){
  const alive=heroes.filter(h=>h.hp>0);const best=alive.reduce((b,h)=>(!b||h[stat]>b[stat])?h:b,null);
  if(!best)return{ok:false,hero:null,rolled:0,total:0,diff};
  let statVal=best[stat];(curses||[]).forEach(c=>{if(c.stat===stat)statVal+=c.mod;});
  const rolled=d6();const total=rolled+Math.max(0,statVal);
  return{ok:total>=diff,hero:best,rolled,total,diff,statVal:Math.max(0,statVal)};
}
function nearestPort(pos){
  // BFS to find nearest port
  const visited=new Set();const queue=[pos];visited.add(pos);
  while(queue.length){const cur=queue.shift();const reg=REGIONS.find(r=>r.id===cur);
    if(reg?.port&&cur!==pos)return cur;
    (reg?.conn||[]).forEach(c=>{if(!visited.has(c)){visited.add(c);queue.push(c);}});}
  return"tortuga";
}

// ═══════════════════════════════════════════════════════════
//  THEME & UI (outside App!)
// ═══════════════════════════════════════════════════════════
const T={bg:"#0a0e14",card:"#141c26",cardL:"#1e2a38",gold:"#D4A843",goldL:"#F0D78C",goldD:"#8B6914",sea:"#0C3547",seaL:"#1a5276",red:"#C62828",green:"#1B5E20",blue:"#0D47A1",txt:"#E8DCC8",txtD:"#7A6E5A",border:"#2a3a4a",parch:"#F5E6C8"};
const fonts=`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');`;
const Btn=({children,onClick,primary,danger,disabled,small,style:s})=>(<button onClick={onClick} disabled={disabled} style={{padding:small?"8px 12px":"14px 20px",border:`1px solid ${danger?T.red:T.gold}`,borderRadius:10,background:primary?`linear-gradient(135deg,${T.gold},${T.goldD})`:danger?T.red+"22":T.card,color:primary?T.bg:danger?"#ff8a80":T.gold,fontFamily:"'Cinzel',serif",fontSize:small?12:14,fontWeight:700,cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,width:"100%",textAlign:"center",transition:"all .15s",...s}}>{children}</button>);
const Card=({children,style:s})=>(<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:10,...s}}>{children}</div>);
const Badge=({children,color})=>(<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,background:(color||T.gold)+"28",color:color||T.gold,fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",marginRight:4}}>{children}</span>);
const SB=({label,value,color})=>(<div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:T.txtD,fontFamily:"'Cinzel',serif"}}>{label}</div><div style={{fontSize:16,fontWeight:900,color:color||T.gold,fontFamily:"'Cinzel',serif"}}>{value}</div></div>);
const DF=({val,dropped})=>(<div style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:dropped?"#44444444":T.goldD+"44",border:`2px solid ${dropped?T.red+"66":T.gold}`,color:dropped?T.red:T.goldL,fontSize:18,fontWeight:900,fontFamily:"'Cinzel',serif",opacity:dropped?0.4:1,textDecoration:dropped?"line-through":"none"}}>{val}</div>);

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App(){
const[phase,setPhase]=useState("menu");
const[gameId,setGameId]=useState("");const[playerId,setPlayerId]=useState("");const[playerName,setPlayerName]=useState("");
const[game,setGame]=useState(null);const[joinCode,setJoinCode]=useState("");
const[ev,setEv]=useState(null);const[combat,setCombat]=useState(null);const[cLog,setCLog]=useState([]);
const[msg,setMsg]=useState("");const[testRes,setTestRes]=useState(null);
const[setupIdx,setSetupIdx]=useState(0);const[heroes,setHeroes]=useState([null,null,null,null]);
const[cStep,setCStep]=useState("name");
const[tName,setTName]=useState("");const[tRace,setTRace]=useState(null);const[tProf,setTProf]=useState(null);
const[diceRolls,setDiceRolls]=useState([]);const[statA,setStatA]=useState({bw:0,st:0,ge:0,in_:0});
const[startGold,setStartGold]=useState(0);
const[sessions,setSessions]=useState(getSessions());
// Recruit state
const[rName,setRName]=useState("");const[rRace,setRRace]=useState(null);const[rProf,setRProf]=useState(null);
const pollRef=useRef(null);

useEffect(()=>{if(phase==="playing"||phase==="lobby"){pollRef.current=setInterval(async()=>{if(gameId){const g=await api.load(gameId);if(g)setGame(g);}},3000);}return()=>{if(pollRef.current)clearInterval(pollRef.current);};},[phase,gameId]);

const me=game?.players?.find(p=>p.id===playerId);
const isMyTurn=game?.players?.[game?.currentPlayerIndex]?.id===playerId;
const curReg=me?REGIONS.find(r=>r.id===me.position):null;
const myShip=SHIPS.find(s=>s.id===(me?.ship||"jolle"))||SHIPS[0];
const isSea=SEA_TYPES.includes(curReg?.type);
const myCurses=me?.curses||[];
const aliveHeroes=(me?.heroes||[]).filter(h=>h.hp>0);
const deadHeroes=(me?.heroes||[]).filter(h=>h.hp<=0);
const recruitCost=RECRUIT_BASE+Math.floor((me?.fame||0)*2);
const healCost=HEAL_COST_BASE+Math.floor((me?.fame||0));
const Toast=()=>msg?(<div onClick={()=>setMsg("")} style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:T.goldD,color:T.parch,padding:"8px 20px",borderRadius:12,zIndex:999,fontFamily:"'Crimson Text',serif",fontSize:14,boxShadow:"0 4px 24px #000a",cursor:"pointer",maxWidth:"88vw"}}>{msg}</div>):null;

// ── SESSION MANAGEMENT ──
const saveSessionInfo=(g)=>{if(!g)return;const other=g.players.find(p=>p.id!==playerId);
  saveSession({gameId:g.id,playerId,playerName:me?.name||playerName,opponentName:other?.name||"Solo",lastPlayed:new Date().toISOString(),position:me?.position||"tortuga",fame:me?.fame||0});setSessions(getSessions());};
const resumeGame=async(s)=>{const g=await api.load(s.gameId);if(!g){setMsg("Spiel nicht gefunden!");removeSession(s.gameId);setSessions(getSessions());return;}
  setGameId(s.gameId);setPlayerId(s.playerId);setPlayerName(s.playerName);setGame(g);setPhase(g.phase==="finished"?"finished":"playing");};
const deleteSession=(gid)=>{removeSession(gid);setSessions(getSessions());};

// ── GAME ACTIONS ──
const createGame=async()=>{if(!playerName.trim()){setMsg("Name!");return;}const gid=uid(),pid=uid();
  const g={id:gid,turn:1,currentPlayerIndex:0,log:[],players:[{id:pid,name:playerName.trim(),position:"tortuga",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false}],phase:"lobby",winner:null};
  await api.create(g);setGameId(gid);setPlayerId(pid);setGame(g);setPhase("lobby");saveSession({gameId:gid,playerId:pid,playerName:playerName.trim(),opponentName:"...",lastPlayed:new Date().toISOString(),position:"tortuga",fame:0});setSessions(getSessions());};
const joinGame=async()=>{if(!playerName.trim()||!joinCode.trim()){setMsg("Name & Code!");return;}const g=await api.load(joinCode.trim());if(!g){setMsg("Nicht gefunden!");return;}if(g.players.length>=2){setMsg("Voll!");return;}
  const pid=uid();g.players.push({id:pid,name:playerName.trim(),position:"puerto",fame:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false});
  await api.save(g);setGameId(g.id);setPlayerId(pid);setGame(g);setPhase("lobby");saveSessionInfo(g);};

// Setup
const startSetup=()=>{setSetupIdx(0);setHeroes([null,null,null,null]);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);setStatA({bw:0,st:0,ge:0,in_:0});setStartGold(0);setPhase("setup");};
const confirmHero=()=>{const h=mkHero(tName.trim(),tRace,tProf,statA);const nh=[...heroes];nh[setupIdx]=h;setHeroes(nh);setCStep("gold");};
const buyStartItem=(item)=>{if(startGold<item.cost)return;setStartGold(startGold-item.cost);const h=heroes[setupIdx];
  if(h&&(item.nk||item.fk||item.rw)){if(item.heavy&&hCurHeavy(h)>=hMaxHeavy(h)){setMsg("Zu schwer!");setStartGold(startGold);return;}
    h.equipment=[...(h.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji,heavy:item.heavy||0}];setMsg(`${h.name}: ${item.name}!`);setHeroes([...heroes]);}else setMsg("Gekauft!");};
const nextHero=()=>{if(setupIdx<3){setSetupIdx(setupIdx+1);setCStep("name");setTName("");setTRace(null);setTProf(null);setDiceRolls([]);}else setCStep("done");};
const finishSetup=async()=>{if(heroes.some(h=>!h)){setMsg("4 Helden!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi]={...g.players[pi],heroes,gold:startGold,ready:true};if(g.players.every(p=>p.ready))g.phase="playing";
  await api.save(g);setGame(g);saveSessionInfo(g);setPhase(g.players.every(p=>p.ready)?"playing":"lobby");};

// Turn management
const endTurn=async(g)=>{g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);saveSessionInfo(g);};

// Party wipe check
const checkPartyWipe=async(g,pi)=>{
  const alive=g.players[pi].heroes.filter(h=>h.hp>0);
  if(alive.length===0){
    // AUTO-RETREAT: go to nearest port, lose 25% gold, revive at 1HP
    const port=nearestPort(g.players[pi].position);
    const lostGold=Math.floor(g.players[pi].gold*0.25);
    g.players[pi].position=port;g.players[pi].gold=Math.max(0,g.players[pi].gold-lostGold);
    g.players[pi].heroes.forEach(h=>{h.hp=1;});
    g.log.push(`${g.players[pi].name}: ALLE K.O.! Rueckzug nach ${REGIONS.find(r=>r.id===port)?.name}, -${lostGold}G`);
    setMsg(`Alle K.O.! Rueckzug, -${lostGold} Gold.`);
    return true;
  }
  return false;
};

const moveTo=async rid=>{if(!isMyTurn)return;const r=REGIONS.find(x=>x.id===rid);if(me.fame<r.minF){setMsg(`${r.minF}⭐ noetig!`);return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi]={...g.players[pi],position:rid};await api.save(g);setGame(g);
  setEv(genEv(r.type,me.fame));setTestRes(null);setPhase("event");};
const explore=()=>{if(!isMyTurn||!aliveHeroes.length)return;setEv(genEv(curReg.type,me.fame));setTestRes(null);setPhase("event");};

const applyReward=async(rw,g,pi)=>{
  const bonus=me.fame>=75?2:1;const halfGold=myCurses.some(c=>c.halfGold);
  let goldGain=Math.round((rw.gold||0)*bonus);if(halfGold&&goldGain>0)goldGain=Math.floor(goldGain/2);
  g.players[pi].gold=Math.max(0,g.players[pi].gold+goldGain);
  g.players[pi].ruhm=Math.max(0,(g.players[pi].ruhm||0)+Math.round((rw.ruhm||0)*bonus));
  g.players[pi].fame=Math.max(0,(g.players[pi].fame||0)+Math.round((rw.fame||0)*bonus));
  if(rw.rum)g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)+rw.rum);
  if(rw.heal&&rw.heal>0)g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+rw.heal);});
  if(rw.dmgAll)g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.max(0,h.hp-rw.dmgAll);});
  if(rw.curse){const c={...pick(CURSES)};g.players[pi].curses=[...(g.players[pi].curses||[]),c];setMsg(`VERFLUCHT: ${c.name}!`);}
  if(rw.removeCurse&&(g.players[pi].curses||[]).length>0){g.players[pi].curses.pop();setMsg("Fluch entfernt!");}
  await checkPartyWipe(g,pi);
  if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return true;}
  return false;
};

const resolveEvent=async ci=>{
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  if(ev.type==="legendary"){g.winner={id:playerId,name:g.players[pi].name,type:"legendary"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
  if(ev.type==="combat"){startCombat(ev.enemy,ev.reward);return;}
  if(ev.type==="skilltest"&&!testRes){setTestRes(skillTest(me.heroes,ev.stat,ev.diff,myCurses));return;}
  let rw={};
  if(ev.type==="choice"&&ci!==undefined){const r=ev.rews[ci];if(r?.combat){startCombat(r.combat,r.reward||r);return;}rw=r||{};}
  else if(ev.type==="heal"){rw={heal:ev.amount||2};}
  else{rw={gold:ev.gold||0,ruhm:ev.ruhm||0,fame:ev.fame||0,rum:ev.rum||0};}
  const won=await applyReward(rw,g,pi);if(won)return;
  g.log.push(`${me.name}: ${(ev.text||"").slice(0,35)}...`);await endTurn(g);setEv(null);setTestRes(null);setPhase("playing");
};
const resolveSkillTest=async(passed)=>{
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const rw=passed?ev.pass:ev.fail;
  if(rw?.combat){startCombat(rw.combat,rw.reward||rw);return;}
  const won=await applyReward(rw||{},g,pi);if(won)return;
  g.log.push(`${me.name}: ${(ev.text||"").slice(0,35)}...`);await endTurn(g);setEv(null);setTestRes(null);setPhase("playing");
};

// COMBAT (UltraQuest-style)
const startCombat=(enemy,reward)=>{setCombat({enemy:{...enemy,curHp:enemy.hp},reward,round:1});setCLog([`Kampf: ${enemy.name}!`]);setPhase("combat");};
const doCombatRound=()=>{
  const alive=me.heroes.filter(h=>h.hp>0);if(!alive.length)return;
  let pTotal=0;const hRolls=[];
  alive.forEach(h=>{const r=d6();const nk=hNK(h,myCurses);pTotal+=r+nk;hRolls.push({name:h.name,r,nk,t:r+nk});});
  const shipBonus=isSea?myShip.kan:0;pTotal+=shipBonus;
  const eR1=d6(),eR2=d6(),eTotal=eR1+eR2+combat.enemy.nk;
  const logs=[...cLog];logs.push(`-- Runde ${combat.round} --`);
  hRolls.forEach(h=>logs.push(`  ${h.name}: W6(${h.r})+${h.nk}=${h.t}`));
  if(shipBonus>0)logs.push(`  Kanonen: +${shipBonus}`);
  logs.push(`  CREW: ${pTotal}`);
  logs.push(`  ${combat.enemy.name}: W6(${eR1}+${eR2})+${combat.enemy.nk}=${eTotal}`);
  const ne={...combat.enemy};
  if(pTotal>eTotal){const dmg=Math.max(1,pTotal-eTotal-(ne.rw||0));ne.curHp=Math.max(0,ne.curHp-dmg);logs.push(`  => ${dmg} Schaden! HP:${ne.curHp}`);}
  else if(eTotal>pTotal){const rawDmg=eTotal-pTotal;
    const target=[...alive].sort((a,b)=>a.hp-b.hp)[0]; // weakest hero
    const shipDef=isSea?myShip.rumpf:0; // ship hull as defense on sea
    const absorbed=hRW(target)+shipDef;const finalDmg=Math.max(0,rawDmg-absorbed);
    if(finalDmg>0){target.hp=Math.max(0,target.hp-finalDmg);logs.push(`  => ${target.name}: ${finalDmg}dmg (RW:${absorbed}) HP:${target.hp}`);}
    else logs.push(`  => Abgewehrt! (RW:${absorbed})`);
  } else logs.push(`  => Unentschieden!`);
  setCombat({...combat,enemy:ne,round:combat.round+1});setCLog(logs);
};
const endCombat=async won=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  if(won&&combat.reward)await applyReward(combat.reward,g,pi);
  g.players[pi].heroes=me.heroes.map(h=>({...h}));
  await checkPartyWipe(g,pi);
  if(g.players[pi].fame>=100){g.winner={id:playerId,name:g.players[pi].name,type:"fame"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
  await endTurn(g);setCombat(null);setCLog([]);setEv(null);setPhase("playing");
};

// Rest
const rest=async()=>{if(!isMyTurn||!aliveHeroes.length)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const heal=curReg?.tavern?5:3;g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+heal);});
  const rumCost=myCurses.some(c=>c.extraRum)?3:1;g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)-rumCost);
  await endTurn(g);};

// Shop
const buyItem=async item=>{const pr=Math.round(item.cost*(SHOP_INV[curReg?.shop]?.pm||1));if(me.gold<pr){setMsg("Kein Gold!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].gold-=pr;
  if(item.rum){g.players[pi].rum=(g.players[pi].rum||0)+item.rum;}
  else if(item.heal){g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+item.heal);});}
  else if(item.ammo){/* consumed */}
  else{const h=g.players[pi].heroes.find(h=>h.hp>0&&!(h.equipment||[]).find(e=>e.id===item.id)&&(!item.heavy||hCurHeavy(h)<hMaxHeavy(h)));
    if(h){h.equipment=[...(h.equipment||[]),{id:item.id,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,emoji:item.emoji,heavy:item.heavy||0}];setMsg(`${h.name}: ${item.name}!`);}
    else{setMsg("Niemand kann das tragen!");g.players[pi].gold+=pr;}}
  await api.save(g);setGame(g);};
const buyShip=async ship=>{if(me.gold<ship.cost)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi].gold-=ship.cost;g.players[pi].ship=ship.id;setMsg(ship.name+"!");await api.save(g);setGame(g);};

// Level up
const learnSkill=async(hid,skill)=>{if(me.ruhm<10)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=10;
  const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h.skills=[...(h.skills||[]),skill];
    if(["Doppelschlag","Kampfrausch","Schildbrecher"].includes(skill))h.st+=1;
    if(["Windleser","Fluchtexperte","Sturmreiter"].includes(skill))h.bw+=1;
    if(["Feilschen","Kraeuterkunde","Giftkunde","Geisterruf"].includes(skill))h.in_+=1;
    if(["Breitseite","Kettenschuss","Praezisionsschuss"].includes(skill))h.ge+=1;
    if(["Feldchirurg","Wiederbelebung"].includes(skill))h.in_+=1;
    if(skill==="Wiederbelebung"){h.maxHp+=2;h.hp+=2;}
    setMsg(`${h.name}: ${skill}!`);}await endTurn(g);};
const trainStat=async(hid,stat)=>{if(me.ruhm<8)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=8;
  const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h[stat]+=1;if(stat==="st"){h.maxHp+=1;h.hp+=1;}setMsg(`${h.name}: ${stat.toUpperCase()}+1!`);}await endTurn(g);};

// RECRUIT / HEAL at port
const healHero=async(hid)=>{if(me.gold<healCost)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi].gold-=healCost;const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h.hp=Math.max(1,Math.floor(h.maxHp/2));setMsg(`${h.name} wiederbelebt!`);}
  await api.save(g);setGame(g);};
const recruitHero=async()=>{if(!rName.trim()||!rRace||!rProf){setMsg("Alles ausfuellen!");return;}if(me.gold<recruitCost){setMsg("Kein Gold!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  // Replace a dead hero or add if <4
  const deadIdx=g.players[pi].heroes.findIndex(h=>h.hp<=0);
  const newH=mkRecruit(rName.trim(),rRace,rProf);
  if(deadIdx>=0)g.players[pi].heroes[deadIdx]=newH;
  else if(g.players[pi].heroes.length<4)g.players[pi].heroes.push(newH);
  else{setMsg("Crew voll! Erst K.O.-Held ersetzen.");return;}
  g.players[pi].gold-=recruitCost;
  setMsg(`${newH.name} angeheuert!`);setRName("");setRRace(null);setRProf(null);
  await api.save(g);setGame(g);};

// ═══════════════════════════════════════════════════════════
//  SCREENS
// ═══════════════════════════════════════════════════════════
const HeroCards=()=>(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
  {me?.heroes?.map(h=>(<Card key={h.id} style={{padding:8,opacity:h.hp<=0?0.3:1}}>
    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
      <span style={{fontSize:14}}>{h.emoji}</span><span style={{fontSize:10,fontWeight:700,color:T.parch,fontFamily:"'Cinzel',serif",flex:1}}>{h.name}</span></div>
    <Badge>{PROFS[h.profession]?.label}</Badge>{h.hp<=0&&<Badge color={T.red}>K.O.</Badge>}
    <div style={{display:"flex",marginTop:4,gap:1}}>
      <SB label="HP" value={`${h.hp}/${h.maxHp}`} color={h.hp<=2?T.red:T.green}/><SB label="NK" value={hNK(h,myCurses)}/><SB label="RW" value={hRW(h)}/></div>
    <div style={{display:"flex",marginTop:2,gap:1}}><SB label="ST" value={h.st}/><SB label="GE" value={h.ge}/><SB label="IN" value={h.in_}/><SB label="BW" value={h.bw}/></div>
    {(h.equipment||[]).length>0&&<div style={{marginTop:2,fontSize:9,color:T.txtD}}>{h.equipment.map(e=>e.emoji).join("")} {h.equipment.map(e=>e.name).join(", ")}</div>}
  </Card>))}</div>);

const MapView=()=>{const conns=curReg?curReg.conn:[];
  return <Card style={{padding:0,overflow:"hidden"}}><div style={{position:"relative",width:"100%",paddingBottom:"110%",background:`linear-gradient(180deg,${T.sea},${T.bg} 50%,#1a120a)`}}>
    <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}>
      {REGIONS.flatMap(r=>r.conn.map(c=>{const t=REGIONS.find(x=>x.id===c);if(!t||r.id>c)return null;
        return <line key={r.id+c} x1={`${r.x}%`} y1={`${r.y}%`} x2={`${t.x}%`} y2={`${t.y}%`} stroke={conns.includes(r.id)||conns.includes(c)?T.gold+"44":T.border+"22"} strokeWidth={1}/>;}))}
    </svg>
    {REGIONS.map(r=>{const here=me?.position===r.id,canGo=conns.includes(r.id),locked=canGo&&r.minF>(me?.fame||0),other=game?.players?.find(p=>p.id!==playerId&&p.position===r.id);
      return <div key={r.id} onClick={()=>canGo&&!locked&&isMyTurn?moveTo(r.id):null}
        style={{position:"absolute",left:`${r.x}%`,top:`${r.y}%`,transform:"translate(-50%,-50%)",cursor:canGo&&!locked&&isMyTurn?"pointer":"default",zIndex:here?10:canGo?5:1,textAlign:"center"}}>
        <div style={{width:here?44:canGo?36:26,height:here?44:canGo?36:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
          background:here?T.gold:canGo?RCOL[r.type]+"cc":RCOL[r.type]+"44",border:here?`3px solid ${T.goldL}`:canGo?`2px solid ${T.gold}88`:`1px solid ${T.border}33`,
          boxShadow:here?`0 0 18px ${T.gold}55`:"none",fontSize:here?18:canGo?14:11}}>{REMO[r.type]}</div>
        {other&&<div style={{position:"absolute",top:-6,right:-6,fontSize:10}}>🏴‍☠️</div>}
        <div style={{fontSize:here?8:7,color:here?T.goldL:canGo?T.parch:T.txtD+"55",fontFamily:"'Cinzel',serif",whiteSpace:"nowrap",marginTop:1}}>{r.name}</div>
        {locked&&<div style={{fontSize:7,color:T.red}}>🔒{r.minF}</div>}
      </div>;})}
  </div></Card>;};

// ── MENU (with session list) ──
const MenuScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 80%,${T.seaL},${T.bg} 70%)`}}>
  <div style={{fontSize:52,marginBottom:8}}>🏴‍☠️</div>
  <div style={{fontSize:11,letterSpacing:8,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRATEN</div>
  <div style={{fontSize:36,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",textShadow:`0 0 40px ${T.gold}44`}}>QUEST</div>
  <div style={{fontSize:12,color:T.txtD,marginBottom:4}}>Herrscher der Sieben Meere</div>
  <div style={{width:"100%",maxWidth:320,marginTop:20}}>
    <input placeholder="Piratenname" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
    <Btn primary onClick={createGame}>Neues Spiel</Btn><div style={{height:12}}/>
    <input placeholder="Spielcode" value={joinCode} onChange={e=>setJoinCode(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontFamily:"'Crimson Text',serif",fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
    <Btn onClick={joinGame}>Beitreten</Btn>
    {sessions.length>0&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginTop:20,marginBottom:8}}>GESPEICHERTE SPIELE</div>
      {sessions.map(s=>(<Card key={s.gameId} style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif"}}>{s.playerName} vs {s.opponentName}</div>
          <div style={{fontSize:10,color:T.txtD}}>⭐{s.fame||0} · {REGIONS.find(r=>r.id===s.position)?.name||"?"} · {new Date(s.lastPlayed).toLocaleDateString("de")}</div>
        </div>
        <Btn small primary onClick={()=>resumeGame(s)} style={{width:"auto",minWidth:70}}>Laden</Btn>
        <Btn small danger onClick={()=>deleteSession(s.gameId)} style={{width:"auto",minWidth:30}}>X</Btn>
      </Card>))}</>}
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
  :<Card style={{textAlign:"center"}}><div style={{color:T.txtD}}>{game?.players?.every(p=>p.ready)?"Bereit!":"Warte..."}</div>
    {game?.players?.every(p=>p.ready)&&<div style={{marginTop:10}}><Btn primary onClick={()=>setPhase("playing")}>Auslaufen!</Btn></div>}</Card>}
</div>);

const SetupScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{textAlign:"center",marginBottom:12}}>
    <div style={{fontSize:12,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRAT {setupIdx+1}/4</div>
    <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>{[0,1,2,3].map(i=>(<div key={i} style={{width:32,height:4,borderRadius:2,background:heroes[i]?T.green:i===setupIdx?T.gold:T.border}}/>))}</div>
  </div>
  {cStep==="name"&&<Card>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>Name</div>
    <input placeholder="Name" value={tName} onChange={e=>setTName(e.target.value)} style={{width:"100%",padding:12,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:16,boxSizing:"border-box",marginBottom:10}}/>
    <Btn primary onClick={()=>{if(!tName.trim()){setMsg("Name!");return;}setCStep("race");}}>Weiter</Btn></Card>}
  {cStep==="race"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>RASSE</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setTRace(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tRace===k?T.gold+"28":T.card,border:`1px solid ${tRace===k?T.gold:T.border}`}}>
      <div>{r.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{r.label}</span></div>
      <div style={{fontSize:9,color:T.txtD}}>{r.desc}</div>
      <div style={{fontSize:8,color:T.txtD,marginTop:2}}>BW:{r.bw} ST:{r.st} GE:{r.ge} IN:{r.in_} HP:{r.hp}</div></div>))}</div>
    <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tRace){setMsg("Waehlen!");return;}setCStep("prof");}} disabled={!tRace}>Weiter</Btn></div></>}
  {cStep==="prof"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>BERUF</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setTProf(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tProf===k?T.gold+"28":T.card,border:`1px solid ${tProf===k?T.gold:T.border}`}}>
      <div>{p.emoji} <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{p.label}</span></div>
      <div style={{fontSize:9,color:T.txtD}}>{p.desc}</div>
      <div style={{fontSize:8,color:T.gold+"88"}}>NK+{p.nk} FK+{p.fk}</div></div>))}</div>
    <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tProf){setMsg("!");return;}setCStep("roll");}} disabled={!tProf}>Wuerfeln!</Btn></div></>}
  {cStep==="roll"&&<Card>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>STATS WUERFELN</div>
    <div style={{fontSize:10,color:T.txtD,marginBottom:10}}>4W6, niedrigster weg = Bonus</div>
    {diceRolls.length===0?<Btn primary onClick={()=>{setDiceRolls([roll4d6(),roll4d6(),roll4d6(),roll4d6()]);const r=[roll4d6(),roll4d6(),roll4d6(),roll4d6()];setDiceRolls(r);setStatA({bw:r[0].total,st:r[1].total,ge:r[2].total,in_:r[3].total});}}>WUERFELN!</Btn>
    :<div>
      {["BW","ST","GE","IN"].map((l,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <div style={{width:24,fontSize:11,color:T.gold,fontWeight:700}}>{l}</div>
        <div style={{display:"flex",gap:3}}>{diceRolls[i].dice.map((v,j)=>(<DF key={j} val={v} dropped={j===0}/>))}</div>
        <div style={{fontSize:15,fontWeight:900,color:T.goldL}}>+{diceRolls[i].total}</div></div>))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
        {[["bw","st"],["ge","in_"],["bw","ge"],["st","in_"],["bw","in_"],["st","ge"]].map(([a,b])=>(<Btn key={a+b} small onClick={()=>{const n={...statA};const t=n[a];n[a]=n[b];n[b]=t;setStatA(n);}}>{a.toUpperCase()}↔{b.toUpperCase()}</Btn>))}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <Btn onClick={()=>setDiceRolls([])}>Neu</Btn><Btn primary onClick={confirmHero}>OK</Btn></div>
    </div>}</Card>}
  {cStep==="gold"&&<Card>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>STARTGOLD</div>
    {startGold===0?<Btn primary onClick={()=>setStartGold((d6()+d6()+d6())*3)}>Gold wuerfeln!</Btn>
    :<div>
      <div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:28,fontWeight:900,color:"#FFC107"}}>{startGold}G</div></div>
      <div style={{maxHeight:160,overflow:"auto"}}>{ITEMS.filter(i=>i.tier<=0&&(i.nk||i.fk||i.rw||i.heal||i.rum)).map(it=>(<div key={it.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${T.border}22`}}>
        <span>{it.emoji}</span><div style={{flex:1}}><div style={{fontSize:11,color:T.parch}}>{it.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>{it.nk>0?`NK+${it.nk} `:""}{it.fk>0?`FK+${it.fk} `:""}{it.rw>0?`RW+${it.rw} `:""}{it.heal?`Heal+${it.heal} `:""}{it.rum?`+${it.rum}Rum`:""}{it.heavy?` [schwer]`:""}</div></div>
        <Btn small primary onClick={()=>buyStartItem(it)} disabled={startGold<it.cost} style={{width:"auto",minWidth:50}}>{it.cost}G</Btn></div>))}</div>
      <div style={{textAlign:"center",marginTop:6}}><Badge color="#FFC107">{startGold}G uebrig</Badge></div>
      <div style={{marginTop:8}}><Btn primary onClick={nextHero}>{setupIdx<3?`Pirat ${setupIdx+2}`:"Fertig!"}</Btn></div></div>}</Card>}
  {cStep==="done"&&<div>
    <Card><div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>CREW</div>
      {heroes.filter(Boolean).map((h,i)=>(<div key={i} style={{display:"flex",gap:6,alignItems:"center",padding:"4px 0"}}>
        <span>{h.emoji}</span><div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{h.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>BW:{h.bw} ST:{h.st} GE:{h.ge} IN:{h.in_} HP:{h.maxHp} NK:{hNK(h,[])}</div></div>
        <Badge>{PROFS[h.profession]?.label}</Badge></div>))}</Card>
    <Btn primary onClick={finishSetup}>Bereit!</Btn></div>}
</div>);

const PlayScreen=()=>{const other=game?.players?.find(p=>p.id!==playerId);
  return <div style={{padding:14,paddingBottom:100}}>
    <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
      <Badge color={T.gold}>⭐{me?.fame||0}</Badge><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge><Badge color="#FFC107">💰{me?.gold||0}</Badge><Badge color="#FF8F00">🍺{me?.rum||0}</Badge>
      <Badge color={T.seaL}>{myShip.emoji}{myShip.name}</Badge><Badge color={isMyTurn?T.green:T.red}>{isMyTurn?"DEIN ZUG":"WARTE"}</Badge></div>
    {myCurses.length>0&&<div style={{fontSize:9,color:T.red,marginBottom:4}}>Flueche: {myCurses.map(c=>c.name).join(", ")}</div>}
    {other&&<div style={{fontSize:10,color:T.txtD,marginBottom:4}}>{other.name}: ⭐{other.fame} 💰{other.gold}</div>}
    <div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif",marginBottom:6}}>📍 {curReg?.name} {REMO[curReg?.type]}{isSea?" (See)":""}</div>
    {MapView()}{HeroCards()}
    {isMyTurn&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <Btn primary onClick={explore} disabled={!aliveHeroes.length}>Erkunden</Btn>
      <Btn onClick={rest} disabled={!aliveHeroes.length}>{curReg?.tavern?"Taverne(+5HP)":"Rasten(+3HP)"}</Btn>
      {curReg?.shop&&<Btn onClick={()=>setPhase("shop")}>Laden</Btn>}
      {curReg?.port&&<Btn onClick={()=>{setRName("");setRRace(null);setRProf(null);setPhase("recruit");}}>Hafen{deadHeroes.length>0?` (${deadHeroes.length} K.O.)`:""}</Btn>}
      <Btn onClick={()=>setPhase("levelup")}>Aufwerten</Btn>
    </div>}
    {game?.log?.length>0&&<Card style={{marginTop:8}}><div style={{maxHeight:50,overflow:"auto"}}>{game.log.slice(-4).reverse().map((l,i)=><div key={i} style={{fontSize:9,color:T.txtD}}>{l}</div>)}</div></Card>}
  </div>;};

const EventScreen=()=>(<div style={{minHeight:"100vh",padding:20,display:"flex",flexDirection:"column",justifyContent:"center"}}>
  <Card style={{borderColor:T.gold+"44"}}>
    <div style={{textAlign:"center",marginBottom:8}}><Badge>W100:{ev?.w100}</Badge><Badge color={RCOL[curReg?.type]}>{curReg?.name}</Badge></div>
    <div style={{fontSize:15,color:T.parch,fontFamily:"'Crimson Text',serif",lineHeight:1.5,textAlign:"center",marginBottom:16,fontStyle:"italic"}}>{ev?.text}</div>
    {ev?.type==="skilltest"&&!testRes&&(<div><div style={{textAlign:"center",fontSize:12,color:T.gold,marginBottom:8}}>{ev.stat==="st"?"Staerke":ev.stat==="ge"?"Geschick":"Intelligenz"}-Test (≥{ev.diff})</div>
      <Btn primary onClick={()=>resolveEvent()}>Wuerfeln!</Btn></div>)}
    {ev?.type==="skilltest"&&testRes&&(<div>
      <Card style={{background:T.bg,textAlign:"center"}}>
        <div style={{fontSize:12,color:T.gold,marginBottom:4}}>{testRes.hero?.name}:</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,alignItems:"center",marginBottom:6}}>
          <DF val={testRes.rolled}/><span style={{color:T.parch}}>+{testRes.statVal}=</span>
          <div style={{fontSize:22,fontWeight:900,color:testRes.ok?T.green:T.red}}>{testRes.total}</div>
          <span style={{color:T.txtD}}>vs {testRes.diff}</span></div>
        <div style={{fontSize:16,fontWeight:900,color:testRes.ok?T.green:T.red}}>{testRes.ok?"GESCHAFFT!":"MISSLUNGEN!"}</div></Card>
      <div style={{marginTop:8}}><Btn primary onClick={()=>resolveSkillTest(testRes.ok)}>Weiter</Btn></div></div>)}
    {ev?.type==="choice"&&<div style={{display:"grid",gap:6}}>{ev.opts.map((o,i)=><Btn key={i} primary={i===0} onClick={()=>resolveEvent(i)}>{o}</Btn>)}</div>}
    {ev?.type==="combat"&&<Btn primary onClick={()=>resolveEvent()}>Kampf!</Btn>}
    {ev?.type==="legendary"&&<div><div style={{textAlign:"center",fontSize:28,marginBottom:10}}>👑💎</div><Btn primary onClick={()=>resolveEvent()}>PIRATENKOENIG!</Btn></div>}
    {["loot","heal","nothing","trade"].includes(ev?.type)&&<div>
      {((ev?.gold||0)>0||(ev?.ruhm||0)>0||(ev?.fame||0)>0)&&<div style={{textAlign:"center",marginBottom:10,color:T.green,fontSize:13}}>
        {ev?.gold>0&&`💰+${ev.gold} `}{ev?.ruhm>0&&`🏆+${ev.ruhm} `}{ev?.fame>0&&`⭐+${ev.fame}`}</div>}
      {ev?.type==="heal"&&<div style={{textAlign:"center",marginBottom:10,color:T.green}}>Crew geheilt!</div>}
      <Btn primary onClick={()=>resolveEvent()}>Weiter</Btn></div>}
  </Card></div>);

const CombatScreen=()=>{const alive=aliveHeroes.length;const eDead=combat?.enemy?.curHp<=0;const pDead=alive===0;
  return <div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:11,color:T.txtD}}>RUNDE {combat?.round||1}{isSea?` | Schiff: ${myShip.name} (${myShip.kan}🔫 ${myShip.rumpf}🛡️)`:""}</div></div>
    <Card style={{textAlign:"center",borderColor:T.red+"44"}}>
      <div style={{fontSize:22}}>👹</div>
      <div style={{fontSize:15,color:T.red,fontFamily:"'Cinzel',serif"}}>{combat?.enemy?.name}</div>
      <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:4}}><SB label="HP" value={`${Math.max(0,combat?.enemy?.curHp)}/${combat?.enemy?.hp}`} color={T.red}/><SB label="NK" value={combat?.enemy?.nk}/><SB label="RW" value={combat?.enemy?.rw}/></div></Card>
    {HeroCards()}
    <Card style={{maxHeight:90,overflow:"auto",background:T.bg}}>{cLog.map((l,i)=><div key={i} style={{fontSize:10,color:l.includes("Schaden")||l.includes("dmg")?T.red:l.includes("=>")?T.green:T.parch,padding:"1px 0"}}>{l}</div>)}</Card>
    {eDead?<div style={{marginTop:8}}><div style={{textAlign:"center",color:T.green,fontSize:14,marginBottom:6}}>SIEG! {combat.reward&&`+${combat.reward.ruhm||0}🏆 +${combat.reward.fame||0}⭐ +${combat.reward.gold||0}💰`}</div>
      <Btn primary onClick={()=>endCombat(true)}>Beute!</Btn></div>
    :pDead?<div style={{marginTop:8}}><div style={{textAlign:"center",color:T.red,fontSize:14,marginBottom:6}}>Niederlage!</div><Btn danger onClick={()=>endCombat(false)}>Weiter</Btn></div>
    :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}><Btn primary onClick={doCombatRound}>Angriff!</Btn><Btn danger onClick={()=>endCombat(false)}>Fliehen</Btn></div>}
  </div>;};

const ShopScreen=()=>{const sd=SHOP_INV[curReg?.shop]||SHOP_INV.hafen;const fame=me?.fame||0;
  return <div style={{minHeight:"100vh",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
      <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif"}}>{sd.emoji} {sd.name}</div><Badge color="#FFC107">💰{me?.gold||0}</Badge></div>
    {sd.ships&&<><div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>SCHIFFE</div>
      <div style={{display:"grid",gap:5,marginBottom:10}}>{SHIPS.filter(s=>s.cost>0).map(s=>(<Card key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:me?.ship===s.id?0.4:1}}>
        <div style={{fontSize:18}}>{s.emoji}</div><div style={{flex:1}}><div style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{s.name}</div>
          <div style={{fontSize:9,color:T.txtD}}>🔫{s.kan} 🛡️{s.rumpf} ⚡{s.spd}</div></div>
        <Btn small primary onClick={()=>buyShip(s)} disabled={me?.gold<s.cost||me?.ship===s.id} style={{width:"auto",minWidth:55}}>{me?.ship===s.id?"✓":s.cost+"G"}</Btn></Card>))}</div></>}
    <div style={{fontSize:12,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>WAREN</div>
    <div style={{display:"grid",gap:4}}>{ITEMS.filter(i=>sd.ids.includes(i.id)).map(it=>{const pr=Math.round(it.cost*sd.pm);const locked=fame<TIER_FAME[it.tier];
      return(<Card key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:locked?0.3:1}}>
        <div style={{fontSize:15}}>{it.emoji}</div>
        <div style={{flex:1}}><div style={{fontSize:11,color:T.parch}}>{it.name}{locked?` 🔒${TIER_FAME[it.tier]}⭐`:""}</div>
          <div style={{fontSize:8,color:T.txtD}}>{it.nk>0&&`NK+${it.nk} `}{it.fk>0&&`FK+${it.fk} `}{it.rw>0&&`RW+${it.rw} `}{it.heal&&`Heal+${it.heal} `}{it.rum&&`+${it.rum}🍺 `}{it.heavy?`[schwer] `:""}</div></div>
        <Btn small primary onClick={()=>buyItem(it)} disabled={me?.gold<pr||locked} style={{width:"auto",minWidth:50}}>{pr}G</Btn></Card>);})}</div>
    <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurueck</Btn></div></div>;};

// ── RECRUIT / HEAL screen ──
const RecruitScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:10}}>⚓ Hafen: {curReg?.name}</div>
  {deadHeroes.length>0&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>K.O. Helden heilen ({healCost}G)</div>
    {deadHeroes.map(h=>(<Card key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:8}}>
      <span style={{fontSize:16}}>{h.emoji}</span><div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{h.name}</div><div style={{fontSize:9,color:T.red}}>K.O.</div></div>
      <Btn small primary onClick={()=>healHero(h.id)} disabled={me.gold<healCost} style={{width:"auto",minWidth:70}}>Heilen {healCost}G</Btn></Card>))}</>}
  <div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginTop:14,marginBottom:6}}>Neuen Piraten anheuern ({recruitCost}G)</div>
  <div style={{fontSize:10,color:T.txtD,marginBottom:8}}>Soeldner: Basiswerte + kleiner Zufallsbonus. Ersetzt K.O.-Helden.</div>
  <input placeholder="Name" value={rName} onChange={e=>setRName(e.target.value)} style={{width:"100%",padding:10,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:15,boxSizing:"border-box",marginBottom:8}}/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
    {Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setRRace(k)} style={{padding:6,borderRadius:8,cursor:"pointer",background:rRace===k?T.gold+"28":T.card,border:`1px solid ${rRace===k?T.gold:T.border}`,fontSize:11}}>
      {r.emoji} {r.label}</div>))}</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
    {Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setRProf(k)} style={{padding:6,borderRadius:8,cursor:"pointer",background:rProf===k?T.gold+"28":T.card,border:`1px solid ${rProf===k?T.gold:T.border}`,fontSize:11}}>
      {p.emoji} {p.label}</div>))}</div>
  <Btn primary onClick={recruitHero} disabled={me?.gold<recruitCost||!rName.trim()||!rRace||!rProf||deadHeroes.length===0}>Anheuern! ({recruitCost}G)</Btn>
  <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurueck</Btn></div>
</div>);

const LevelUpScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
    <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif"}}>Aufwerten</div><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge></div>
  <div style={{fontSize:10,color:T.txtD,marginBottom:8}}>Stats: 8R | Skills: 10R | Beendet Zug</div>
  {aliveHeroes.map(h=>{const prof=PROFS[h.profession];const next=prof.skills.filter(s=>!(h.skills||[]).includes(s));
    return <Card key={h.id}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span>{h.emoji}</span>
        <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</span><Badge>{prof.label}</Badge></div>
      <div style={{fontSize:9,color:T.txtD,marginBottom:4}}>Skills: {(h.skills||[]).join(", ")}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:4}}>
        {[["st","ST"],["ge","GE"],["in_","IN"],["bw","BW"]].map(([k,l])=>
          <Btn key={k} small onClick={()=>trainStat(h.id,k)} disabled={me.ruhm<8||!isMyTurn}>{l}:{h[k]}→{h[k]+1} (8R)</Btn>)}</div>
      {next.length>0&&next.map(s=><Btn key={s} small onClick={()=>learnSkill(h.id,s)} disabled={me.ruhm<10||!isMyTurn} style={{marginBottom:3}}>{s} (10R)</Btn>)}
    </Card>;})}
  <div style={{marginTop:8}}><Btn onClick={()=>setPhase("playing")}>Zurueck</Btn></div></div>);

const FinishedScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
  <div style={{fontSize:52,marginBottom:10}}>👑🏴‍☠️</div>
  <div style={{fontSize:24,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>{game?.winner?.type==="legendary"?"LEGENDAER!":"PIRATENKOENIG!"}</div>
  <div style={{fontSize:15,color:T.parch,textAlign:"center",marginBottom:20}}>Kapitaen {game?.winner?.name} herrscht!</div>
  {game?.players?.map(p=>(<Card key={p.id} style={{width:"100%",maxWidth:300}}>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif"}}>{p.name}</div>
    <div style={{display:"flex",gap:6,marginTop:4}}><SB label="Ruhm" value={p.fame}/><SB label="Beute" value={p.ruhm}/><SB label="Gold" value={p.gold}/></div></Card>))}
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
  {phase==="recruit"&&RecruitScreen()}
  {phase==="levelup"&&LevelUpScreen()}
  {phase==="finished"&&FinishedScreen()}
</div>);
}
