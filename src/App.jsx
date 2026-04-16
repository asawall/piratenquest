import{useState,useEffect,useRef}from"react";

// ════════════════════════════════════════════════════════════
//  PIRATENQUEST v6 — Kompletter Rebuild nach GDD
// ════════════════════════════════════════════════════════════

const pick=a=>a[Math.floor(Math.random()*a.length)];
const roll=s=>Math.floor(Math.random()*s)+1;
const d6=()=>roll(6);const d100=()=>roll(100);const uid=()=>Math.random().toString(36).slice(2,8);

// ── API ──
const api={
  save:async g=>{try{await fetch(`/api/games/${g.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});}catch{}try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{}},
  load:async id=>{try{const r=await fetch(`/api/games/${id}`);if(r.ok)return await r.json();}catch{}try{const d=localStorage.getItem(`pq:${id}`);return d?JSON.parse(d):null;}catch{return null;}},
  create:async g=>{try{await fetch('/api/games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});}catch{}try{localStorage.setItem(`pq:${g.id}`,JSON.stringify(g));}catch{}},
};
const getSess=()=>{try{return JSON.parse(localStorage.getItem('pq_sess')||'[]');}catch{return[];}};
const saveSess=s=>{const a=getSess().filter(x=>x.gid!==s.gid);a.unshift(s);try{localStorage.setItem('pq_sess',JSON.stringify(a.slice(0,20)));}catch{}};
const delSess=gid=>{const a=getSess().filter(x=>x.gid!==gid);try{localStorage.setItem('pq_sess',JSON.stringify(a));}catch{}};

// ════════════════════════════════════════════════════════════
//  DATEN (GDD Kapitel 2-5)
// ════════════════════════════════════════════════════════════

const RACES={
  Freibeuter:{bw:3,st:3,ge:3,in_:3,hp:7,em:"🏴‍☠️",desc:"Allrounder"},
  Sirene:{bw:4,st:2,ge:4,in_:3,hp:5,em:"🧜",desc:"Schnell & geschickt"},
  Zwergpirat:{bw:2,st:4,ge:2,in_:3,hp:9,em:"⛏️",desc:"Zäh & stark"},
  Äffling:{bw:5,st:1,ge:5,in_:2,hp:4,em:"🐒",desc:"Extrem flink"},
  HaiBlut:{bw:3,st:5,ge:2,in_:1,hp:11,em:"🦈",desc:"Kampfmaschine"},
  Geisterblut:{bw:3,st:2,ge:3,in_:4,hp:5,em:"👻",desc:"Mystisch"},
  Krakenbrut:{bw:2,st:4,ge:2,in_:3,hp:8,em:"🐙",desc:"Starker Griff"},
  Papageiling:{bw:3,st:1,ge:3,in_:5,hp:4,em:"🦜",desc:"Genialer Stratege"},
};

const PROFS={
  Enterer:{nk:2,fk:0,em:"⚔️",desc:"Nahkampf-Spezialist",
    skills:[
      {id:"s_enter",name:"Enterhaken-Meister",desc:"Auto-Erfolg bei Enter-Events",active:false,stat:"st",mod:0},
      {id:"s_doppel",name:"Doppelschlag",desc:"Schaden ×2 bei Treffer",active:true,cd:4,stat:"st",mod:1},
      {id:"s_rausch",name:"Kampfrausch",desc:"NK ×1.5 diese Runde",active:true,cd:3,stat:"st",mod:1},
      {id:"s_schild",name:"Schildbrecher",desc:"Ignoriert Gegner-RW",active:true,cd:3,stat:"st",mod:1},
      {id:"s_wirbel",name:"Todeswirbel",desc:"Flächenschaden",active:true,cd:5,stat:"st",mod:1},
    ]},
  Navigator:{nk:0,fk:1,em:"🧭",desc:"Wege & Flucht",
    skills:[
      {id:"s_stern",name:"Sternennavigation",desc:"+2 auf IN-Tests auf See",active:false,stat:null,mod:0},
      {id:"s_wind",name:"Windleser",desc:"Flucht gelingt leichter",active:false,stat:"bw",mod:1},
      {id:"s_route",name:"Geheimrouten",desc:"Regionen überspringen",active:false,stat:"in_",mod:1},
      {id:"s_sturm",name:"Sturmreiter",desc:"Kein Sturmschaden",active:false,stat:"bw",mod:1},
      {id:"s_flucht",name:"Fluchtexperte",desc:"Auto-Flucht 1×/Gebiet",active:true,cd:99,stat:"bw",mod:1},
    ]},
  Schmuggler:{nk:1,fk:0,em:"🗝️",desc:"Handel & Diebstahl",
    skills:[
      {id:"s_schwarz",name:"Schwarzmarkt",desc:"Tier+1 Items überall",active:false,stat:null,mod:0},
      {id:"s_feilsch",name:"Feilschen",desc:"Shop-Preise −20%",active:false,stat:"in_",mod:1},
      {id:"s_tasche",name:"Taschendieb",desc:"Extra-Gold bei Events",active:false,stat:"ge",mod:1},
      {id:"s_flagge",name:"Falsche Flagge",desc:"Marine → Handel",active:false,stat:"in_",mod:1},
      {id:"s_meister",name:"Meisterschmuggler",desc:"Doppeltes Handels-Gold",active:false,stat:"in_",mod:1},
    ]},
  Kanonier:{nk:0,fk:2,em:"💣",desc:"Fernkampf-Spezialist",
    skills:[
      {id:"s_breit",name:"Breitseite",desc:"FK ×2 in Runde 1",active:true,cd:3,stat:null,mod:0},
      {id:"s_kette",name:"Kettenschuss",desc:"Gegner kann nicht fliehen",active:true,cd:3,stat:"ge",mod:1},
      {id:"s_feuer",name:"Feuerkanone",desc:"+3 FK auf See permanent",active:false,stat:"ge",mod:1},
      {id:"s_praez",name:"Präzisionsschuss",desc:"Ignoriert RW im FK",active:true,cd:3,stat:"ge",mod:1},
      {id:"s_inferno",name:"Inferno",desc:"Runde 1 Schaden ×3",active:true,cd:5,stat:"ge",mod:1},
    ]},
  Schiffsarzt:{nk:0,fk:0,em:"⚕️",desc:"Heilt die Crew",
    skills:[
      {id:"s_wund",name:"Wundversorgung",desc:"Heilt 3 HP nach Kampf",active:false,stat:null,mod:0},
      {id:"s_kraut",name:"Kräuterkunde",desc:"Heiltränke ×2",active:false,stat:"in_",mod:1},
      {id:"s_feld",name:"Feldchirurg",desc:"K.O.-Held 1× im Kampf beleben",active:true,cd:99,stat:"in_",mod:1},
      {id:"s_gift",name:"Giftkunde",desc:"Immun gegen Gift-Events",active:false,stat:"in_",mod:1},
      {id:"s_wiederb",name:"Wiederbelebung",desc:"K.O.→50% HP nach Kampf",active:false,stat:"in_",mod:1},
    ]},
  VoodooPriester:{nk:0,fk:0,em:"🔮",desc:"Dunkle Magie",
    skills:[
      {id:"s_fluch",name:"Verfluchung",desc:"Gegner NK −3, 2 Runden",active:true,cd:4,stat:null,mod:0},
      {id:"s_geist",name:"Geisterruf",desc:"+5 NK/FK diese Runde",active:true,cd:5,stat:"in_",mod:1},
      {id:"s_schutz",name:"Schutzamulett",d:"Magischer Schutz, lenkt Angriffe ab",desc:"+1 RW Gruppe passiv",active:false,stat:"in_",mod:1},
      {id:"s_seele",name:"Seelenraub",desc:"Heilt 3 HP bei Kill",active:false,stat:"in_",mod:1},
      {id:"s_toten",name:"Totenbeschwörung",desc:"+8 NK eine Runde",active:true,cd:5,stat:"in_",mod:1},
    ]},
};

const PREGROUPS=[
  {name:"Die Sturmbrecher",heroes:[["Kpt. Sturmwind","Freibeuter","Enterer"],["Eisenbart","Zwergpirat","Kanonier"],["Wellensang","Sirene","Navigator"],["Nebelgeist","Geisterblut","Schiffsarzt"]]},
  {name:"Die Schattenkrallen",heroes:[["Blutflosse","HaiBlut","Enterer"],["Kletteraffe","Äffling","Schmuggler"],["Tentakel-Tor","Krakenbrut","Kanonier"],["Weissfeder","Papageiling","VoodooPriester"]]},
  {name:"Die Wellenreiter",heroes:[["Korallensang","Sirene","Enterer"],["Kompass-Karl","Freibeuter","Navigator"],["Hammerschlag","Zwergpirat","Schiffsarzt"],["Scharfauge","Papageiling","Kanonier"]]},
];

const SHIPS=[
  {id:"jolle",name:"Jolle",cost:0,kan:0,rumpf:0,spd:1,em:"🚣"},
  {id:"schaluppe",name:"Schaluppe",cost:30,kan:2,rumpf:1,spd:2,em:"⛵"},
  {id:"brigg",name:"Brigg",cost:80,kan:6,rumpf:2,spd:2,em:"🚢"},
  {id:"fregatte",name:"Fregatte",cost:200,kan:12,rumpf:3,spd:3,em:"⚓"},
  {id:"galeone",name:"Galeone",cost:500,kan:20,rumpf:4,spd:2,em:"🏴‍☠️"},
  {id:"flaggschiff",name:"Flaggschiff",cost:1200,kan:30,rumpf:5,spd:3,em:"👑"},
];

const ITEMS=[
  // m1=1H Melee, m2=2H Melee, r=Ranged, a=Armor, s=Shield, k=Consumable, t=Tool
  {id:"dolch",s:"m1",name:"Dolch",d:"Leichte Einhandwaffe, schnell und vielseitig",nk:1,fk:0,rw:0,cost:3,em:"🔪",tier:0,hv:0},
  {id:"saebel",s:"m1",name:"Entermesser",d:"Klassische Piratenwaffe fürs Entern",nk:2,fk:0,rw:0,cost:6,em:"🗡️",tier:0,hv:0},
  {id:"enterhaken",s:"m1",name:"Enterhaken",d:"Zum Entern und Klettern, auch im Kampf brauchbar",nk:2,fk:0,rw:0,cost:5,em:"🪝",tier:0,hv:0},
  {id:"rapier",s:"m1",name:"Rapier",d:"Elegante Fechtwaffe mit langer Klinge",nk:3,fk:0,rw:0,cost:14,em:"⚔️",tier:1,hv:0},
  {id:"axt",s:"m2",name:"Enteraxt",d:"Wuchtige Zweihandaxt, durchschlägt Holz und Knochen",nk:4,fk:0,rw:0,cost:20,em:"🪓",tier:1,hv:1},
  {id:"dreizack",s:"m2",name:"Dreizack",d:"Dreizinkige Zweihandwaffe, hält Gegner auf Distanz",nk:3,fk:0,rw:0,cost:18,em:"🔱",tier:1,hv:1},
  {id:"flamberg",s:"m2",name:"Flamberge",d:"Gewellte Klinge, reißt tiefe Wunden",nk:5,fk:0,rw:0,cost:35,em:"⚔️",tier:2,hv:1},
  {id:"neptun",s:"m2",name:"Neptunklinge",d:"Legendäre Meereswaffe, leuchtet blau im Mondlicht",nk:6,fk:0,rw:0,cost:60,em:"🔱",tier:3,hv:1},
  {id:"pistole",s:"r",name:"Pistole",d:"Ein Schuss pro Runde, danach nachladen",nk:0,fk:2,rw:0,cost:8,em:"🔫",tier:0,hv:0},
  {id:"muskete",s:"r",name:"Muskete",d:"Schwere Fernwaffe, hohe Durchschlagskraft",nk:0,fk:3,rw:0,cost:16,em:"🔫",tier:1,hv:1},
  {id:"doppellauf",s:"r",name:"Doppellauf",d:"Zwei Schüsse ohne Nachladen!",nk:0,fk:4,rw:0,cost:30,em:"🔫",tier:2,hv:0},
  {id:"donner",s:"r",name:"Donnerbüchse",d:"Legendäre Schrotflinte, verheerend auf kurze Distanz",nk:0,fk:5,rw:0,cost:55,em:"💥",tier:3,hv:1},
  {id:"leder",s:"a",name:"Lederwams",d:"Leichter Schutz, behindert nicht",nk:0,fk:0,rw:1,cost:6,em:"🧥",tier:0,hv:0},
  {id:"kette",s:"a",name:"Kettenhemd",d:"Guter Schutz gegen Hieb- und Stichwaffen",nk:0,fk:0,rw:2,cost:15,em:"🛡️",tier:1,hv:1},
  {id:"brust",s:"a",name:"Brustpanzer",d:"Schwerer Plattenpanzer, exzellenter Schutz",nk:0,fk:0,rw:3,cost:28,em:"🛡️",tier:2,hv:1},
  {id:"drache",s:"a",name:"Drachenschuppe",d:"Legendäre Rüstung aus Drachenhaut, nahezu undurchdringlich",nk:0,fk:0,rw:4,cost:50,em:"🐉",tier:3,hv:1},
  {id:"buckler",s:"s",name:"Buckler",d:"Kleiner Faustschild zum Parieren",nk:0,fk:0,rw:1,cost:7,em:"🛡️",tier:0,hv:0},
  {id:"amulett",s:"s",name:"Schutzamulett",d:"Magischer Schutz, lenkt Angriffe ab",nk:0,fk:0,rw:1,cost:25,em:"🧿",tier:2,hv:0},
  {id:"rum",s:"k",name:"Fass Rum",d:"+5 Rum für die Crew-Moral",nk:0,fk:0,rw:0,cost:4,em:"🍺",tier:0,hv:0,rum:5},
  {id:"proviant",s:"k",name:"Proviant",d:"Heilt alle lebenden Helden um 3 HP",nk:0,fk:0,rw:0,cost:3,em:"🍖",tier:0,hv:0,heal:3},
  {id:"tinktur",s:"k",name:"Kräutertinktur",d:"Heilt alle lebenden Helden um 5 HP",nk:0,fk:0,rw:0,cost:10,em:"🧪",tier:1,hv:0,heal:5},
  {id:"elixier",s:"k",name:"Voodoo-Elixier",d:"Mächtiger Heiltrank, +10 HP für alle",nk:0,fk:0,rw:0,cost:25,em:"🧪",tier:2,hv:0,heal:10},
  {id:"kugeln",s:"k",name:"Kanonenkugeln",d:"Munition für Schiffskanonen",nk:0,fk:0,rw:0,cost:5,em:"💣",tier:0,hv:0},
  {id:"dynamit",s:"k",name:"Dynamit",d:"Sprengstoff! +5 auf nächsten Fernkampfwurf",nk:0,fk:0,rw:0,cost:12,em:"🧨",tier:1,hv:0},
  {id:"fernrohr",s:"t",name:"Fernrohr",d:"+1 auf Erkundungs-Events (IN-Tests)",nk:0,fk:0,rw:0,cost:10,em:"🔭",tier:0,hv:0},
  {id:"kompass",s:"t",name:"Mag. Kompass",d:"+2 auf Navigation (IN-Tests auf See)",nk:0,fk:0,rw:0,cost:22,em:"🧭",tier:1,hv:0},
  {id:"voodoo",s:"t",name:"Voodoo-Puppe",d:"Einmal-Einsatz: Gegner NK−5 für einen Kampf",nk:0,fk:0,rw:0,cost:18,em:"🪆",tier:1,hv:0},
];
const TIER_FAME={0:0,1:10,2:25,3:40};

const SHOP_CONF={
  hafen:{name:"Tortuga Piratenladen",em:"🏴‍☠️",ids:["dolch","saebel","enterhaken","rapier","pistole","muskete","leder","kette","buckler","rum","proviant","tinktur","kugeln","dynamit","fernrohr","voodoo","flamberg","doppellauf","brust","elixier","kompass","neptun","donner","drache","amulett"],pm:1.0,ships:true},
  dorf:{name:"Fischerhändler",em:"🏘️",ids:["dolch","enterhaken","leder","proviant","rum","buckler","tinktur"],pm:1.15,ships:false},
  stadt:{name:"Goldküsten-Basar",em:"🏰",ids:["rapier","axt","flamberg","doppellauf","dreizack","kette","brust","buckler","rum","tinktur","elixier","kugeln","dynamit","fernrohr","kompass","voodoo","amulett","neptun","donner","drache"],pm:0.9,ships:true},
  festung:{name:"Militärvorräte",em:"⚔️",ids:["rapier","axt","flamberg","muskete","doppellauf","kette","brust","buckler","kugeln","dynamit","neptun","donner","drache"],pm:0.75,ships:false},
};

const CURSES=[
  {id:"seekrank",name:"Seekrankheit",desc:"BW −1",stat:"bw",mod:-1},
  {id:"pech",name:"Pech des Meeres",desc:"Gold halbiert",stat:null,mod:0,halfGold:true},
  {id:"jones",name:"Davy Jones' Fluch",desc:"ST −1",stat:"st",mod:-1},
  {id:"geist",name:"Geisterblick",desc:"IN −1",stat:"in_",mod:-1},
  {id:"klumpf",name:"Klumpfuß",desc:"GE −1",stat:"ge",mod:-1},
  {id:"meuterei",name:"Meuterei-Fluch",desc:"−3 Rum/Rast",stat:null,mod:0,extraRum:true},
];

const SEA=["flach","handel","riff","hai","tiefsee","nebel","bermuda","unterwasser"];
const REGIONS=[
  {id:"tortuga",name:"Tortuga",type:"hafen",x:50,y:90,minE:0,maxE:15,lv:1,conn:["flache_see","handelsweg"],shop:"hafen",port:true,tavern:true},
  {id:"puerto",name:"Puerto Seguro",type:"dorf",x:22,y:85,minE:0,maxE:15,lv:1,conn:["flache_see","mangroven"],shop:"dorf",port:true},
  {id:"flache_see",name:"Flache See",type:"flach",x:38,y:75,minE:0,maxE:15,lv:1,conn:["tortuga","puerto","handelsweg","korallenriff","mangroven"]},
  {id:"handelsweg",name:"Handelsstraße",type:"handel",x:62,y:72,minE:0,maxE:20,lv:2,conn:["tortuga","flache_see","korallenriff","goldkueste"]},
  {id:"mangroven",name:"Mangroven",type:"sumpf",x:15,y:65,minE:5,maxE:25,lv:2,conn:["puerto","flache_see","geisterinsel","schlangennest"],dungeon:{rooms:2,boss:"Sumpfkrokodil-König"}},
  {id:"korallenriff",name:"Korallenriff",type:"riff",x:50,y:60,minE:8,maxE:30,lv:3,conn:["flache_see","handelsweg","nebelbank","haifischbucht"],dungeon:{rooms:2,boss:"Riffwächter"}},
  {id:"goldkueste",name:"Goldküste",type:"stadt",x:78,y:58,minE:10,maxE:35,lv:3,conn:["handelsweg","festung","haifischbucht"],shop:"stadt",port:true,tavern:true},
  {id:"nebelbank",name:"Nebelbank",type:"nebel",x:35,y:48,minE:12,maxE:40,lv:4,conn:["korallenriff","geisterinsel","bermuda"]},
  {id:"haifischbucht",name:"Haifischbucht",type:"hai",x:65,y:45,minE:15,maxE:45,lv:4,conn:["korallenriff","goldkueste","vulkaninsel","krakentiefen"],dungeon:{rooms:3,boss:"Hai-König"}},
  {id:"geisterinsel",name:"Geisterinsel",type:"geister",x:18,y:42,minE:18,maxE:50,lv:5,conn:["mangroven","nebelbank","davyjones"]},
  {id:"schlangennest",name:"Schlangennest",type:"verlies",x:8,y:55,minE:15,maxE:50,lv:5,conn:["mangroven"],dungeon:{rooms:3,boss:"Schlangenkönigin"}},
  {id:"festung",name:"Festung San Carlos",type:"festung",x:85,y:48,minE:20,maxE:60,lv:5,conn:["goldkueste","vulkaninsel"],shop:"festung",dungeon:{rooms:4,boss:"Festungskommandant"}},
  {id:"vulkaninsel",name:"Vulkaninsel",type:"vulkan",x:70,y:32,minE:25,maxE:70,lv:6,conn:["haifischbucht","festung","schatzinsel"],dungeon:{rooms:3,boss:"Vulkandrache"}},
  {id:"bermuda",name:"Bermuda-Dreieck",type:"bermuda",x:38,y:32,minE:25,maxE:70,lv:6,conn:["nebelbank","krakentiefen","schatzinsel"]},
  {id:"krakentiefen",name:"Kraken-Tiefen",type:"tiefsee",x:55,y:25,minE:30,maxE:80,lv:7,conn:["haifischbucht","bermuda","davyjones"]},
  {id:"davyjones",name:"Davy Jones' Riff",type:"unterwasser",x:25,y:22,minE:35,maxE:90,lv:8,conn:["geisterinsel","krakentiefen"],dungeon:{rooms:5,boss:"Davy Jones"}},
  {id:"schatzinsel",name:"Schatzinsel",type:"schatz",x:58,y:12,minE:40,maxE:999,lv:9,conn:["vulkaninsel","bermuda","thron"]},
  {id:"thron",name:"Piratenthron",type:"thron",x:50,y:3,minE:50,maxE:999,lv:10,conn:["schatzinsel"]},
];
const RCOL={hafen:"#D4A843",dorf:"#8B9E6B",flach:"#4FC3F7",handel:"#FFB74D",sumpf:"#5D4037",riff:"#26C6DA",stadt:"#FFD700",nebel:"#90A4AE",hai:"#EF5350",geister:"#7E57C2",verlies:"#4A148C",festung:"#B71C1C",vulkan:"#FF5722",bermuda:"#6A1B9A",tiefsee:"#0D47A1",unterwasser:"#00695C",schatz:"#FFC107",thron:"#FFD700"};
const REMO={hafen:"🏴‍☠️",dorf:"🏘️",flach:"🌊",handel:"⛵",sumpf:"🌿",riff:"🐠",stadt:"🏰",nebel:"🌫️",hai:"🦈",geister:"👻",verlies:"🐍",festung:"🏰",vulkan:"🌋",bermuda:"🔮",tiefsee:"🐙",unterwasser:"🫧",schatz:"💎",thron:"👑"};

const MILESTONES=[
  {e:10,title:"Bekannter Pirat",msg:"Euer Name wird in den Tavernen geflüstert!"},
  {e:25,title:"Gefürchteter Pirat",msg:"Handelsschiffe hissen die weiße Flagge!"},
  {e:50,title:"Piratenlord",msg:"Der Rat der Kapitäne erkennt euch an!"},
  {e:75,title:"Schrecken der Meere",msg:"Legenden werden über euch erzählt!"},
  {e:100,title:"PIRATENKÖNIG!",msg:"IHR HERRSCHT ÜBER DIE SIEBEN MEERE!"},
];

// ════════════════════════════════════════════════════════════
//  EVENT ENGINE — Atmosphärische Piratentexte
// ════════════════════════════════════════════════════════════
const PN=["Einauge","Rotbart","Schwarzzahn","La Muerte","Knochenbrecher","Silberfinger","Sturmwind","Bluthund","Donnerschlag","Goldkralle","Schlangenauge","Nebelfaust","Totenkopf-Tom","Haifisch-Henri","Eisenbart","Krakenjäger","Dunkle Dolores","Teufelszunge","Galgenvogel","Rum-Rosita","Feuerfaust","Giftzahn","Todeslächeln","Wirbelwind-Wanda","Voodoo-Vic","Krummsäbel-Karl","Narbengesicht","Sturmbraut","Eisenhaken","Goldzahn-Gustav","Mondauge","Taifun-Tessa","Messerhans","Kanonen-Klaus","Seemine-Sam","Ankerfaust","Schwarze Witwe","Schädelbrecher","Vulkan-Vera","Dreizack-Dimitri","Seeteufel","Nebelkrähe","Donnergroll","Kielholer","Salzblut","Riffbrecher","Sturmfalke","Breitseite-Bernd","Flaschenteufel","Brandungshexe","Wellenbrecher","Nebelhorn","Schatzgräber","Korallenherz","Barrakuda-Bella","Leuchtqualle","Salzfinger","Wellentänzerin","Seemannsgarn","Reling-Rosa"];
const SN=["Sturmkrähe","Schwarze Perle","Blutige Mary","Seewolf","Nebeltänzerin","Todesschwinge","Goldener Hai","Meerjungfrau","Krakenzorn","Geisterschiff","Sturmbrecher","Mondschatten","Wellenreiter","Korallendolch","Phantomklinge","Teufelsklaue","Leuchtfeuer","Ankerschreck","Voodoo-Queen","Salzwind","Neptuns Zorn","Schattensegel","Höllenfeuer","Eisenkiel","Sturmvogel","Kanonendonner","Nachtfalke","Silberpfeil","Haifischzahn","Donnerkeil","Totenstille","Barrakuda","Perlentaucher","Seemannsbraut"];
const CN=["Riesenkrake","Seeschlange","Geisterpiraten","Untote Matrosen","Riffhaie","Sumpfkrokodil","Giftige Quallen","Sirenen","Wasserelementar","Skelettcrew","Seehexe","Seeteufel","Piranha-Schwarm","Zombiepiraten","Voodoo-Golem","Sturmgeist","Nebeldämon","Korallenwächter","Lava-Krabbe","Vulkandrache","Bermuda-Phantom","Tentakelhorror","Flutwurm","Muschelgolem","Gezeitenbestie","Feuerfisch","Hai-König","Todesrochen","Muränen-Pack","Hammerhai","Tiefseekrake","Leviathan"];
const ADJ=["verfluchte","goldene","vergessene","gespenstische","uralte","verrostete","leuchtende","mysteriöse","finstere","verborgene","verdammte","legendäre","verschollene","geheime","stürmische","neblige","dunkle","brennende","eisige","giftige","schimmernde","blutige","silberne","kristallene","schwarze","pechschwarze","mondbeleuchtete","tödliche","betörende","verzauberte"];
const TN=["Aztekengold","Rubinkrone","Smaragdkelch","Neptuns Dreizack","Sirenenharfe","Krakens Herz","Davy Jones' Schlüssel","Poseidons Gürtel","Schwarzer Opal","Blutrubin","Mondperle","Vulkanjuwel","Korallendiadem","Gezeitenring","Meerjungfrauenträne","Piratenkönigs-Siegel","Kristallschädel","Flammenherz","Diamantsäbel","Obsidianmaske","Phönixfeder","Leviathans Schuppe","Weltenkompass","Schicksalswürfel"];

function ft(t){return t.replace(/\{pn\}/g,()=>pick(PN)).replace(/\{sn\}/g,()=>pick(SN)).replace(/\{cn\}/g,()=>pick(CN)).replace(/\{adj\}/g,()=>pick(ADJ)).replace(/\{tn\}/g,()=>pick(TN));}
function mkE(n,lv){const nk=8+lv*4+roll(6);const hp=4+lv*3+roll(4);const rw=Math.min(1+Math.floor(lv/2),5);
  // 30% chance to drop loot item scaled to level
  let loot=null;if(Math.random()<0.3){const tier=Math.min(3,Math.floor(lv/3));
    const pool=ITEMS.filter(i=>(i.s==="m1"||i.s==="m2"||i.s==="r"||i.s==="a"||i.s==="s")&&i.tier<=tier);
    if(pool.length)loot=pick(pool);}
  return{name:n,nk,hp,rw,loot};}

// Events per region type — atmospheric pirate text, every event has consequence
const EVT={
flach:[
lv=>({text:ft("Arr! Am Horizont segelt die {sn} unter Kapitän {pn}! Die Kanonen sind ausgefahren — aber das Schiff scheint schwer beladen mit Fracht. Was soll's sein, Käpt'n?"),type:"choice",opts:["Friedlich handeln","Zum Angriff! ❗","Kurs halten"],rews:[{gold:3+roll(5),ruhm:2},{combat:mkE("Wachen der "+pick(SN),lv),reward:{gold:8+roll(10),ruhm:3,ehre:1}},{}]}),
lv=>({text:ft("Zwischen den Wellen treiben Wrackteile der {sn}! Fässer, Kisten und — heiliger Klabautermann — ist das Gold, was da im Salzwasser glitzert?"),type:"loot",gold:4+roll(6),ruhm:2}),
lv=>({text:ft("Aus der Tiefe steigen Blasen auf. Dann bricht die See auf — {cn}! Die Bestien sind hungrig und euer Schiff ist die nächste Mahlzeit! ❗"),type:"forcecombat",enemy:mkE(ft("{cn}"),lv),reward:{gold:3+roll(5),ruhm:2,ehre:1}}),
lv=>({text:ft("Eine Fischerbarke kreuzt euren Weg. Der alte Seebär an Bord grinst zahnlos: 'Frischer Fang, Käpt'n? Für'n Lächeln und 'ne gute Geschichte!' Die Crew schlägt sich den Bauch voll."),type:"heal",amount:2+roll(2)}),
lv=>({text:ft("Euer Ausguck brüllt: 'Land in Sicht!' Eine {adj} Insel, die auf keiner Seekarte verzeichnet ist. Zwischen den Palmen schimmert etwas Metallisches..."),type:"skilltest",stat:"in_",diff:4+lv,pass:{gold:6+roll(8),ruhm:3,ehre:1},fail:{gold:1,ruhm:1}}),
lv=>({text:ft("Donnergrollen! Schwarze Wolken türmen sich am Horizont. Der Navigator muss das Schiff durch den Sturm steuern oder ihr geht unter!"),type:"skilltest",stat:"ge",diff:5+lv,pass:{ruhm:3,ehre:1},fail:{gold:-3,dmgAll:1}}),
lv=>({text:ft("Eine Marinefregatte unter königlicher Flagge! Der Offizier an Deck hebt das Fernrohr. Verdammt — er hat die Piratenflagge gesehen!"),type:"choice",opts:["Falsche Flagge hissen","Kampfstationen! ❗","Fliehen!"],rews:[{ruhm:2},{combat:mkE("Marine-Fregatte",lv+1),reward:{gold:12+roll(8),ruhm:4,ehre:2}},{ruhm:-1}]}),
lv=>({text:ft("Delfine! Ein ganzer Schwarm begleitet euer Schiff. Die Crew nimmt es als gutes Omen — heute Abend gibt's extra Rum!"),type:"loot",gold:1+roll(3),ruhm:1,rum:2}),
lv=>({text:ft("'Würfelduell, Landratte?' Kapitän {pn} von der {sn} grinst euch über die Reling an und wedelt mit einem Beutel voll Goldmünzen. 5 Gold Einsatz!"),type:"duel",bet:5}),
],
handel:[
lv=>({text:ft("Eine prächtige Galeone! Die {sn}, vollbeladen mit {adj} Schätzen. Kapitän {pn} steht breitbeinig an Deck. Der Jackpot, Käpt'n — aber die Wachen sind zahlreich!"),type:"choice",opts:["Überfallen! ❗","Handeln","Laufen lassen"],rews:[{combat:mkE("Galeonen-Wachen",lv+1),reward:{gold:15+roll(15),ruhm:4,ehre:2}},{gold:4+roll(5),ruhm:1},{}]}),
lv=>({text:ft("Drei Handelsschiffe im Konvoi! Bewaffnete Eskorte. Aber nachts, wenn die Wachen müde sind..."),type:"skilltest",stat:"ge",diff:5+lv,pass:{gold:18+roll(12),ruhm:4,ehre:1},fail:{combat:mkE("Konvoi-Eskorte",lv+2),reward:{gold:25+roll(15),ruhm:5,ehre:2}}}),
lv=>({text:ft("Ein Schmugglerschiff unter Kapitän {pn}! 'Psst, Interesse an {adj} Ware? Beste Qualität, keine Fragen!' Klingt verdächtig billig..."),type:"skilltest",stat:"in_",diff:4+lv,pass:{gold:6,ruhm:2},fail:{gold:-8}}),
lv=>({text:ft("Wrackteile treiben vorbei — ein Handelsschiff, erst kürzlich gesunken. Die Ladung schwimmt noch! Schnell zugreifen, bevor sie abtaucht!"),type:"loot",gold:6+roll(10),ruhm:2}),
lv=>({text:ft("Die Marinefregatte {sn} hat euch entdeckt! Kanonen werden geladen! Keine Verhandlung möglich! ❗"),type:"forcecombat",enemy:mkE("Marine-Fregatte",lv+2),reward:{gold:15+roll(10),ruhm:5,ehre:2}}),
],
sumpf:[
lv=>({text:ft("Ein {adj} Krokodil, so lang wie euer Beiboot, gleitet lautlos durchs trübe Wasser. Plötzlich schnappt es zu! ❗"),type:"forcecombat",enemy:mkE("Sumpfkrokodil",lv),reward:{gold:2+roll(4),ruhm:2,ehre:1}}),
lv=>({text:ft("Giftiger Nebel kriecht über das Wasser. Der Gestank ist bestialisch — eure Lungen brennen! Nur die Stärksten halten durch!"),type:"skilltest",stat:"st",diff:4+lv,pass:{ruhm:3,ehre:1},fail:{dmgAll:2}}),
lv=>({text:ft("Zwischen den Mangroven steht eine Hütte auf Stelzen. Rauch quillt aus dem Schornstein. Eine alte Frau mit knochigem Gesicht und leuchtenden Augen öffnet die Tür: 'Die Geister haben mir von euch erzählt...'"),type:"choice",opts:["Eintreten","Lieber nicht!"],rews:[Math.random()>.35?{ruhm:4,ehre:1,heal:3,removeCurse:true}:{curse:true},{}]}),
lv=>({text:ft("Im Schlamm — halb versunken — eine {adj} Truhe! Die Initialen {pn} sind eingraviert. Was mag darin sein?"),type:"loot",gold:5+roll(8),ruhm:2,ehre:1}),
lv=>({text:ft("{cn} erheben sich aus dem Morast! Modrige Leiber, leuchtende Augen — sie greifen an! ❗"),type:"forcecombat",enemy:mkE(ft("{cn}"),lv+1),reward:{gold:3+roll(6),ruhm:3,ehre:1}}),
],
riff:[
lv=>({text:ft("KRRRK! Der Kiel knirscht! Ein {adj} Riff, direkt unter der Wasserlinie! Euer Navigator muss blitzschnell reagieren!"),type:"skilltest",stat:"ge",diff:4+lv,pass:{ruhm:2},fail:{gold:-5,dmgAll:1}}),
lv=>({text:ft("Unter dem kristallklaren Wasser schimmert es golden! Ein versunkener Schatz zwischen den Korallen! Aber die Strömung ist tückisch..."),type:"skilltest",stat:"ge",diff:3+lv,pass:{gold:8+roll(10),ruhm:3,ehre:1},fail:{dmgAll:1}}),
lv=>({text:ft("Zwischen den Korallen lauern {cn}! Sie verteidigen ihr Revier mit zähnefletschender Wut! ❗"),type:"forcecombat",enemy:mkE(ft("{cn}"),lv),reward:{gold:3+roll(6),ruhm:3,ehre:1}}),
lv=>({text:ft("Perlenmuscheln! Hunderte! Euer Taucher kann sein Glück kaum fassen — manche sind so groß wie Fäuste!"),type:"loot",gold:5+roll(8),ruhm:2}),
lv=>({text:ft("Das Wrack der {sn} liegt auf dem Riffgrund! Durch die zerbrochenen Fenster der Kapitänskajüte glitzert es verheißungsvoll..."),type:"choice",opts:["Wrack erkunden","Zu gefährlich"],rews:[{gold:10+roll(8),ruhm:4,ehre:1},{}]}),
],
hai:[
lv=>({text:ft("ALARM! Eine {adj} Haiflosse durchschneidet die Wellen — und sie kommt direkt auf euch zu! Das Biest ist riesig! ❗"),type:"forcecombat",enemy:mkE("Weißer Hai",lv+1),reward:{gold:2+roll(4),ruhm:4,ehre:1}}),
lv=>({text:ft("'Willkommen in der Arena, Landratten!' Kapitän {pn} betreibt hier Haifischkämpfe. 'Wer traut sich? 5 Gold Einsatz — und die doppelte Ehre!'"),type:"choice",opts:["Wetten (5G)","Selbst kämpfen! ❗","Nein danke"],rews:[Math.random()>.5?{gold:10,ruhm:2}:{gold:-5},{combat:mkE("Arena-Hai",lv+1),reward:{gold:15,ruhm:5,ehre:2}},{}]}),
lv=>({text:ft("Hai-Blut-Krieger! {pn}s Clan patrouilliert die Bucht. Ihre Narben erzählen von hundert Kämpfen."),type:"choice",opts:["Verhandeln","Angreifen! ❗"],rews:[{ruhm:2,ehre:1},{combat:mkE("Hai-Krieger",lv+1),reward:{gold:10,ruhm:4,ehre:2}}]}),
lv=>({text:ft("Ein erlegter Hai treibt vorbei. In seinem aufgeschlitzten Bauch: ein {adj} Säbel und ein Lederbeutel voller Goldmünzen! Jemand hatte weniger Glück als ihr."),type:"loot",gold:8+roll(6),ruhm:3,ehre:1}),
],
geister:[
lv=>({text:ft("Aus dem Nichts materialisiert sich ein Schiff — die {sn}! Geisterhafte Laternen beleuchten die verrotteten Segel. Untote Matrosen starren euch mit leeren Augen an. ❗"),type:"forcecombat",enemy:mkE("Geisterpiraten",lv+2),reward:{gold:10+roll(10),ruhm:5,ehre:2}}),
lv=>({text:ft("Der Geist von Kapitän {pn} schwebt über den Ruinen. 'Ihr sucht den Schatz? Ich kann euch den Weg zeigen... für einen Preis.' Seine Stimme klingt wie Wind in zerbrochenen Masten."),type:"choice",opts:["Zuhören","Voodoo-Ritual","Fliehen!"],rews:[{ruhm:5,ehre:1},{ruhm:6,ehre:2,gold:roll(8)},{ruhm:-1}]}),
lv=>({text:ft("Irrlichter! Blaue Flammen tanzen zwischen den verfallenen Grabsteinen. Sie locken euch tiefer... Euer klügster Kopf muss herausfinden ob Falle oder Weg!"),type:"skilltest",stat:"in_",diff:5+lv,pass:{gold:10+roll(8),ruhm:5,ehre:2},fail:{curse:true}}),
lv=>({text:ft("Skelettkrieger! Sie erheben sich klappernd aus dem Sand, rostige Säbel in knöchernen Fäusten! ❗"),type:"forcecombat",enemy:mkE("Skelettarmee",lv+2),reward:{gold:6+roll(8),ruhm:5,ehre:2}}),
],
nebel:[
lv=>({text:ft("Aus dem undurchdringlichen Nebel: Schreie! Ein Schiff wird von {cn} angegriffen! Die Crew braucht Hilfe!"),type:"choice",opts:["Zu Hilfe! ❗","Weiterfahren"],rews:[{combat:mkE(ft("{cn}"),lv+1),reward:{gold:10,ruhm:6,ehre:2}},{}]}),
lv=>({text:ft("Der Kompass dreht sich wie verrückt! Magnetische Anomalie! Euer Navigator muss die Sterne lesen — wenn er sie durch den Nebel überhaupt sieht!"),type:"skilltest",stat:"in_",diff:5+lv,pass:{ruhm:4,ehre:1},fail:{ruhm:-2}}),
lv=>({text:ft("Betörende Stimmen durchdringen den Nebel... Sirenengesang! 'Kommt zu uns, ihr mutigen Seeleute...' Wer schwach ist, springt über Bord!"),type:"skilltest",stat:"in_",diff:4+lv,pass:{ruhm:3},fail:{combat:mkE("Sirenen",lv+1),reward:{gold:8,ruhm:4,ehre:1}}}),
lv=>({text:ft("Der Nebel lichtet sich plötzlich und enthüllt eine {adj} Insel! Ein Strand voller Muscheln und — Goldmünzen!"),type:"loot",gold:5+roll(8),ruhm:3,ehre:1}),
],
festung:[
lv=>({text:ft("KANONENBESCHUSS! Die Festung hat euch entdeckt! Eisenkugeln pfeifen an euren Ohren vorbei! ❗"),type:"forcecombat",enemy:mkE("Festungskanonen",lv+3),reward:{gold:15+roll(10),ruhm:6,ehre:2}}),
lv=>({text:ft("Ein {adj} Geheimgang führt unter die Festungsmauern! Spinnweben und Ratten — aber am Ende glitzert der Goldschatz des Gouverneurs!"),type:"skilltest",stat:"ge",diff:6+lv,pass:{gold:25+roll(15),ruhm:7,ehre:2},fail:{combat:mkE("Festungswachen",lv+2),reward:{gold:20,ruhm:6,ehre:2}}}),
lv=>({text:ft("Hinter Gittern: gefangene Piraten! Sie flehen um Befreiung. 'Wir kennen den Weg zum Schatz, Käpt'n! Befreit uns und wir teilen!'"),type:"choice",opts:["Befreien! ❗","Unmöglich"],rews:[{combat:mkE("Garnison",lv+2),reward:{ruhm:8,ehre:2,gold:5}},{}]}),
],
vulkan:[
lv=>({text:ft("Lavaströme fließen zischend ins Meer! Dampfwolken verdecken die Sicht! Euer Geschick entscheidet über Leben und Tod!"),type:"skilltest",stat:"ge",diff:5+lv,pass:{ruhm:5,ehre:2},fail:{dmgAll:2}}),
lv=>({text:ft("In einer glühenden Höhle: ein {adj} Drache! Seine Schuppen glühen wie Kohlen, und zwischen seinen Klauen liegt {tn}! ❗"),type:"forcecombat",enemy:mkE("Vulkandrache",lv+3),reward:{gold:20+roll(15),ruhm:8,ehre:2}}),
lv=>({text:ft("Heiße Quellen! Das Wasser dampft und riecht nach Schwefel — aber es heilt! Die Crew entspannt sich und die Wunden schließen sich."),type:"heal",amount:4}),
lv=>({text:ft("{adj} Obsidianwaffen! Vulkanisch geschmiedet, schärfer als jeder Stahl! Ein Schatz für jeden Krieger!"),type:"loot",gold:10+roll(8),ruhm:4,ehre:1}),
],
bermuda:[
lv=>({text:ft("Die Zeit verzerrt sich! Alles bewegt sich rückwärts! Euer Navigator wird wahnsinnig — nur Intelligenz kann euch hier retten!"),type:"skilltest",stat:"in_",diff:6+lv,pass:{ruhm:6,ehre:2},fail:{curse:true}}),
lv=>({text:ft("Ein Dimensionsriss öffnet sich! Dahinter: eine {adj} Welt voller Schätze — aber auch voller Gefahren!"),type:"choice",opts:["Hindurchspringen!","Nein danke!"],rews:[Math.random()>.4?{gold:25+roll(20),ruhm:8,ehre:2}:{combat:mkE("Dimensionswächter",lv+3),reward:{gold:20,ruhm:6,ehre:2}},{ruhm:2}]}),
lv=>({text:ft("Ein gewaltiger Strudel! Das Schiff dreht sich immer schneller! Alle Mann an die Ruder! ❗"),type:"skilltest",stat:"st",diff:6+lv,pass:{ruhm:5,ehre:2},fail:{gold:-10}}),
lv=>({text:ft("{cn} aus einer anderen Dimension! Diese Kreaturen hat noch kein Pirat je gesehen! ❗"),type:"forcecombat",enemy:mkE("Dimensionsbestie",lv+3),reward:{gold:12+roll(10),ruhm:7,ehre:2}}),
],
tiefsee:[
lv=>({text:ft("DER KRAKEN! Riesige Tentakel schießen aus der Tiefe und umklammern euer Schiff! Die Planken ächzen! Kämpft um euer Leben! ❗"),type:"forcecombat",enemy:mkE("Mächtiger Kraken",lv+4),reward:{gold:18+roll(15),ruhm:10,ehre:3}}),
lv=>({text:ft("In der Tiefe schimmert eine versunkene Stadt! Goldene Kuppeln und juwelenbesetzte Türme! Aber der Abstieg ist tödlich gefährlich..."),type:"skilltest",stat:"ge",diff:6+lv,pass:{gold:15+roll(15),ruhm:7,ehre:2},fail:{dmgAll:2}}),
lv=>({text:ft("LEVIATHAN! Eine uralte Bestie, größer als jedes Schiff, erhebt sich aus dem Abgrund! Selbst die tapfersten Piraten zittern! ❗"),type:"forcecombat",enemy:mkE("Leviathan",lv+5),reward:{gold:22+roll(20),ruhm:12,ehre:3}}),
lv=>({text:ft("Biolumineszenz! Die gesamte Tiefsee leuchtet in {adj} Farben. Zwischen dem Licht: Schätze versunkener Zivilisationen!"),type:"loot",gold:8+roll(10),ruhm:5,ehre:2}),
],
unterwasser:[
lv=>({text:ft("Davy Jones persönlich! Er steht vor euch, Seetang im Bart, Kraken-Tentakel statt Fingern. 'Ihr wagt es, in mein Reich einzudringen?'"),type:"choice",opts:["Verhandeln","Kämpfen! ❗"],rews:[{ruhm:8,ehre:2},{combat:mkE("Davy Jones",lv+5),reward:{gold:30,ruhm:15,ehre:4}}]}),
lv=>({text:ft("Die {adj} Schatzkammer von Davy Jones! Goldberge, Juwelen, Kronen versunkener Könige — unvorstellbare Reichtümer!"),type:"loot",gold:18+roll(20),ruhm:8,ehre:2}),
lv=>({text:ft("{cn} in Jones' Diensten! Untote Seeleute, gebunden an den Meeresgrund für alle Ewigkeit! ❗"),type:"forcecombat",enemy:mkE("Jones' Wächter",lv+4),reward:{gold:12+roll(10),ruhm:8,ehre:2}}),
],
schatz:[
lv=>({text:ft("X markiert die Stelle! Der Sand ist frisch aufgegraben — jemand war vor euch hier! Aber der Schatz liegt tiefer... Euer klügster Kopf muss die Falle entschärfen!"),type:"skilltest",stat:"in_",diff:5+lv,pass:{gold:20+roll(20),ruhm:8,ehre:2},fail:{combat:mkE("Schatzhüter",lv+3),reward:{gold:25,ruhm:10,ehre:2}}}),
lv=>({text:ft("Die {adj} Schatzkammer von Kapitän {pn}! Goldmünzen bis zur Decke gestapelt!"),type:"loot",gold:18+roll(15),ruhm:8,ehre:2}),
lv=>({text:ft("Verfluchtes Gold! Der Schatz ist da — aber ein {adj} Nebel umgibt ihn. Wer es anfasst, wird verflucht..."),type:"choice",opts:["Alles nehmen!","Nur wenig","Finger weg"],rews:[{gold:25+roll(20),ruhm:5,ehre:1,curse:true},{gold:10,ruhm:3,ehre:1},{ruhm:4,ehre:2}]}),
lv=>({text:ft("Kapitän {pn} ist bereits hier! 'Dieser Schatz gehört MIR, Landratte!' Säbel werden gezogen! ❗"),type:"forcecombat",enemy:mkE("Kapitän "+pick(PN),lv+3),reward:{gold:18+roll(15),ruhm:6,ehre:2}}),
lv=>({text:ft("Fallen überall! Giftpfeile, Fallgruben, Steinlawinen! Nur die Geschicktesten überleben! ❗"),type:"skilltest",stat:"ge",diff:6+lv,pass:{gold:15+roll(10),ruhm:5,ehre:2},fail:{dmgAll:3}}),
],
thron:[
lv=>({text:ft("Der Rat der Piratenkapitäne! Narbengesichter, Augenklappe, Holzbeine — die gefährlichsten Männer und Frauen der Sieben Meere! 'Wer bist DU, dass du den Thron beanspruchst?'"),type:"forcecombat",enemy:mkE("Rivalen-Kapitäne",lv+4),reward:{ruhm:7,ehre:3,gold:20}}),
lv=>({text:ft("Kapitän {pn}, der letzte Wächter des Throns! Ein Veteran tausender Schlachten! 'Nur über meine Leiche, Rotznase!' ❗"),type:"forcecombat",enemy:mkE("Piratenkönig "+pick(PN),lv+5),reward:{ruhm:8,ehre:4,gold:30}}),
lv=>({text:ft("Die Geister aller Piratenkönige erscheinen! Ihre Prüfung: Stärke, Geschick UND Verstand! ❗"),type:"skilltest",stat:pick(["st","ge","in_"]),diff:8+lv,pass:{ruhm:7,ehre:3},fail:{dmgAll:3,curse:true}}),
lv=>({text:ft("Die Wächter des Throns stellen sich euch in den Weg! Bewährt euch! ❗"),type:"forcecombat",enemy:mkE("Thronwächter",lv+5),reward:{ruhm:6,ehre:3,gold:20}}),
lv=>{if(Math.random()<0.08)return{text:ft("DA IST SIE! Die {adj} Krone der Sieben Meere! Sie leuchtet golden auf dem Thron! Euer Herz rast — ihr greift danach — und sie ist ECHT! IHR SEID DER NEUE PIRATENKÖNIG!!!"),type:"legendary"};
  return{text:ft("Der Thron ist so nah! Aber noch müsst ihr euch beweisen. Ein weiterer Herausforderer tritt vor! ❗"),type:"forcecombat",enemy:mkE("Herausforderer",lv+5),reward:{ruhm:6,ehre:3,gold:15}};},
],
verlies:[
lv=>({text:ft("Giftschlangen! Sie hängen von der Decke, sie ringeln sich um eure Füße! Überall dieses entsetzliche Zischen! ❗"),type:"forcecombat",enemy:mkE("Riesenschlangen",lv+2),reward:{gold:8+roll(8),ruhm:4,ehre:1}}),
lv=>({text:ft("Eine {adj} Schatztruhe, bewacht von tödlichen Fallen! Giftnadeln, Fallbeile, Säurefallen — euer Geschick ist gefragt!"),type:"skilltest",stat:"ge",diff:5+lv,pass:{gold:12+roll(10),ruhm:4,ehre:1},fail:{dmgAll:2}}),
lv=>({text:ft("Skelette ehemaliger Abenteurer liegen herum. Bei einem von ihnen: {tn}! Der Griff noch warm..."),type:"loot",gold:8+roll(8),ruhm:5,ehre:1}),
lv=>({text:ft("{cn} bewacht den tiefsten Raum! Ein uraltes Wesen, gebunden an diesen Ort seit Jahrhunderten! ❗"),type:"forcecombat",enemy:mkE(ft("{cn}"),lv+3),reward:{gold:12+roll(10),ruhm:6,ehre:2}}),
],
hafen:[
lv=>({text:ft("'Hey Landratte!' Ein besoffener Kerl in der Taverne wirft euch einen Krug an den Kopf! Prügelei! ❗"),type:"skilltest",stat:"st",diff:3+lv,pass:{ruhm:2,ehre:1,gold:3},fail:{gold:-2}}),
lv=>({text:ft("In der verrauchten Taverne flüstert ein einäugiger Matrose: '{tn}! Vergraben nahe dem Korallenriff. Ich hab die Karte — aber die hat ihren Preis, Käpt'n!'"),type:"choice",opts:["Kaufen (8G)","Nein"],rews:[{gold:-8,ruhm:4,ehre:1},{}]}),
lv=>({text:ft("Die Crew feiert! Rum fließt in Strömen, Seemannslieder schallen durch die Nacht! Morgen werden Köpfe brummen — aber heute lebt man!"),type:"loot",gold:1+roll(3),ruhm:1,rum:3}),
lv=>({text:ft("'Haltet den Dieb!' Ein flinker Taschendieb hat sich euren Geldbeutel geschnappt und rennt durch die Gassen!"),type:"skilltest",stat:"ge",diff:3+lv,pass:{gold:5,ruhm:2},fail:{gold:-4}}),
lv=>({text:ft("'Würfelduell, Landratte?' Ein breit grinsender Pirat namens {pn} wedelt mit Goldmünzen. 5 Gold Einsatz!"),type:"duel",bet:5}),
],
dorf:[
lv=>({text:ft("Die Fischer des Dorfes bitten um Hilfe: '{cn} terrorisieren unsere Bucht! Wir haben Gold gesammelt — bitte, Käpt'n!'"),type:"choice",opts:["Helfen! ❗","Nicht unser Problem"],rews:[{combat:mkE(ft("{cn}"),lv),reward:{gold:5+roll(5),ruhm:3,ehre:1}},{ruhm:-1}]}),
lv=>({text:ft("Der Dorfälteste nimmt euch beiseite: 'Ich bin alt, aber ich erinnere mich — {tn} liegt {adj} verborgen, westlich von hier...' Er zeichnet eine Karte in den Sand."),type:"loot",gold:2+roll(5),ruhm:3,ehre:1}),
lv=>({text:ft("Frische Vorräte! Die Dorfbewohner sind gastfreundlich. Frisches Obst, gebratener Fisch und — natürlich — selbstgebrannter Rum!"),type:"heal",amount:3}),
lv=>({text:ft("Kinder laufen aufgeregt neben eurer Crew her: 'Echte Piraten! Zeigt uns eure Schwerter!' Die Crew genießt die Bewunderung."),type:"loot",gold:1+roll(3),ruhm:2,rum:1}),
],
};

function genEv(rType,lv,ehre,maxE){
  const pool=EVT[rType]||EVT.flach;
  const ev=pick(pool)(lv);
  ev.w100=d100();
  // Over-level: no ehre rewards
  if(ehre>maxE){
    if(ev.reward)ev.reward.ehre=0;
    if(ev.pass)ev.pass.ehre=0;
    if(ev.rews)ev.rews.forEach(r=>{if(r&&r.ehre)r.ehre=0;if(r&&r.reward)r.reward.ehre=0;});
    if(ev.ehre)ev.ehre=0;
    ev.overLevel=true;
  }
  return ev;
}

// ════════════════════════════════════════════════════════════
//  SPIELLOGIK
// ════════════════════════════════════════════════════════════
function mkHero(name,rK,pK){const r=RACES[rK],p=PROFS[pK];const h={id:uid(),name,race:rK,prof:pK,bw:r.bw,st:r.st,ge:r.ge,in_:r.in_,eq:[],skills:[p.skills[0].id],em:r.em,cdMap:{}};h.maxHp=r.hp+h.st;h.hp=h.maxHp;return h;}
function mkRecruit(name,rK,pK){const h=mkHero(name,rK,pK);h.bw+=roll(2);h.st+=roll(2);h.ge+=roll(2);h.in_+=roll(2);h.maxHp=RACES[rK].hp+h.st;h.hp=h.maxHp;return h;}

function hNK(h,curses){
  const melee=(h.eq||[]).filter(e=>e.s==="m1"||e.s==="m2");
  const bestNK=melee.length?Math.max(...melee.map(e=>e.nk||0)):0;
  let v=h.st+(PROFS[h.prof]?.nk||0)+bestNK;
  (curses||[]).forEach(c=>{if(c.stat==="st")v+=c.mod;});return Math.max(0,v);
}
function hFK(h,curses){
  const ranged=(h.eq||[]).filter(e=>e.s==="r");
  const bestFK=ranged.length?Math.max(...ranged.map(e=>e.fk||0)):0;
  let v=h.ge+(PROFS[h.prof]?.fk||0)+bestFK;
  (curses||[]).forEach(c=>{if(c.stat==="ge")v+=c.mod;});return Math.max(0,v);
}
function hRW(h){return(h.eq||[]).reduce((s,e)=>s+(e.rw||0),0);}
function hMaxHv(h){return 1+(h.st>=4?1:0)+(h.st>=6?1:0);}
function hCurHv(h){return(h.eq||[]).reduce((s,e)=>s+(e.hv||0),0);}
function canEquip(h,item){
  const eq=h.eq||[];const has=s=>eq.filter(e=>e.s===s);
  if(item.s==="m1"){if(has("m2").length>0)return"Hat Zweihandwaffe";if(has("m1").length>=2)return"Max 2 Einhandwaffen";}
  if(item.s==="m2"){if(has("m1").length>0)return"Hat Einhandwaffen";if(has("m2").length>=1)return"Schon Zweihandwaffe";}
  if(item.s==="r"&&has("r").length>=1)return"Schon Fernkampfwaffe";
  if(item.s==="a"&&has("a").length>=1)return"Schon Rüstung";
  if(item.s==="s"){if(has("s").length>=1)return"Schon Schild";if(has("m2").length>0)return"Kein Schild mit Zweihand";}
  if(item.hv&&hCurHv(h)>=hMaxHv(h))return"Zu schwer";
  return null;
}
function nearPort(pos){const vis=new Set();const q=[pos];vis.add(pos);while(q.length){const c=q.shift();const r=REGIONS.find(x=>x.id===c);if(r?.port&&c!==pos)return c;(r?.conn||[]).forEach(n=>{if(!vis.has(n)){vis.add(n);q.push(n);}});}return"tortuga";}
function skillTest(heroes,stat,diff,curses){
  const alive=heroes.filter(h=>h.hp>0);const best=alive.reduce((b,h)=>(!b||h[stat]>b[stat])?h:b,null);
  if(!best)return{ok:false,hero:null,rolled:0,total:0,diff};
  let sv=best[stat];(curses||[]).forEach(c=>{if(c.stat===stat)sv+=c.mod;});
  const rolled=d6();return{ok:rolled+Math.max(0,sv)>=diff,hero:best,rolled,sv:Math.max(0,sv),total:rolled+Math.max(0,sv),diff};
}

// ════════════════════════════════════════════════════════════
//  THEME & UI PRIMITIVES (außerhalb App!)
// ════════════════════════════════════════════════════════════
const T={bg:"#0a0e14",card:"#141c26",cardL:"#1e2a38",gold:"#D4A843",goldL:"#F0D78C",goldD:"#8B6914",sea:"#0C3547",seaL:"#1a5276",red:"#C62828",green:"#1B5E20",txt:"#E8DCC8",txtD:"#7A6E5A",border:"#2a3a4a",parch:"#F5E6C8"};
const fonts=`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');`;
const Btn=({children,onClick,primary,danger,disabled,small,style:st})=>(<button onClick={onClick} disabled={disabled} style={{padding:small?"8px 12px":"14px 20px",border:`1px solid ${danger?T.red:T.gold}`,borderRadius:10,background:primary?`linear-gradient(135deg,${T.gold},${T.goldD})`:danger?T.red+"22":T.card,color:primary?T.bg:danger?"#ff8a80":T.gold,fontFamily:"'Cinzel',serif",fontSize:small?12:14,fontWeight:700,cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,width:"100%",textAlign:"center",transition:"all .15s",...st}}>{children}</button>);
const Card=({children,style:st})=>(<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:10,...st}}>{children}</div>);
const Badge=({children,color})=>(<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,background:(color||T.gold)+"28",color:color||T.gold,fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",marginRight:4}}>{children}</span>);
const SB=({label,value,color})=>(<div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:T.txtD,fontFamily:"'Cinzel',serif"}}>{label}</div><div style={{fontSize:16,fontWeight:900,color:color||T.gold,fontFamily:"'Cinzel',serif"}}>{value}</div></div>);
const DF=({val,dropped})=>(<div style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:dropped?"#44444444":T.goldD+"44",border:`2px solid ${dropped?T.red+"66":T.gold}`,color:dropped?T.red:T.goldL,fontSize:18,fontWeight:900,fontFamily:"'Cinzel',serif",opacity:dropped?0.4:1,textDecoration:dropped?"line-through":"none"}}>{val}</div>);

// ════════════════════════════════════════════════════════════
//  APP (Komplett-Rebuild)
// ════════════════════════════════════════════════════════════


export default function App(){
const[phase,setPhase]=useState("menu");
const[gameId,setGameId]=useState("");const[playerId,setPlayerId]=useState("");const[playerName,setPlayerName]=useState("");
const[game,setGame]=useState(null);const[joinCode,setJoinCode]=useState("");
const[ev,setEv]=useState(null);const[combat,setCombat]=useState(null);const[cLog,setCLog]=useState([]);
const[msg,setMsg]=useState("");const[testRes,setTestRes]=useState(null);
const[setupIdx,setSetupIdx]=useState(0);const[heroes,setHeroes]=useState([null,null,null,null]);
const[cStep,setCStep]=useState("name");
const[tName,setTName]=useState("");const[tRace,setTRace]=useState(null);const[tProf,setTProf]=useState(null);
const[startGold,setStartGold]=useState(0);const[selHero,setSelHero]=useState(0);
const[shopHero,setShopHero]=useState(0);const[showHelp,setShowHelp]=useState(false);const[showOpp,setShowOpp]=useState(false);
const[rName,setRName]=useState("");const[inventory,setInventory]=useState([]);const[rRace,setRRace]=useState(null);const[rProf,setRProf]=useState(null);
const[activeSkills,setActiveSkills]=useState([]);const[duelState,setDuelState]=useState(null);
const[sessions,setSessions]=useState(getSess());
const pollRef=useRef(null);

useEffect(()=>{if(phase==="playing"||phase==="lobby"){pollRef.current=setInterval(async()=>{if(gameId){const g=await api.load(gameId);if(g)setGame(g);}},3000);}return()=>{if(pollRef.current)clearInterval(pollRef.current);};},[phase,gameId]);

const me=game?.players?.find(p=>p.id===playerId);
const isMyTurn=game?.players?.[game?.currentPlayerIndex]?.id===playerId;
const curReg=me?REGIONS.find(r=>r.id===me.position):null;
const myShip=SHIPS.find(s=>s.id===(me?.ship||"jolle"))||SHIPS[0];
const isSea=SEA.includes(curReg?.type);
const myCurses=me?.curses||[];
const aliveH=(me?.heroes||[]).filter(h=>h.hp>0);
const deadH=(me?.heroes||[]).filter(h=>h.hp<=0);
const recruitCost=15+Math.floor((me?.ehre||0)*2);
const healCost=8+Math.floor((me?.ehre||0));

const Toast=()=>msg?(<div onClick={()=>setMsg("")} style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",background:T.goldD,color:T.parch,padding:"8px 20px",borderRadius:12,zIndex:999,fontFamily:"'Crimson Text',serif",fontSize:14,boxShadow:"0 4px 24px #000a",cursor:"pointer",maxWidth:"88vw"}}>{msg}</div>):null;

// ── Session ──
const saveSI=(g)=>{if(!g)return;const ot=g.players.find(p=>p.id!==playerId);
  saveSess({gid:g.id,pid:playerId,pname:me?.name||playerName,oname:ot?.name||"Solo",date:new Date().toISOString(),pos:me?.position||"tortuga",ehre:me?.ehre||0});setSessions(getSess());};
const resumeGame=async(s)=>{const g=await api.load(s.gid);if(!g){setMsg("Nicht gefunden!");delSess(s.gid);setSessions(getSess());return;}
  setGameId(s.gid);setPlayerId(s.pid);setPlayerName(s.pname);setGame(g);const myP=g.players.find(p=>p.id===s.pid);setPhase(g.phase==="finished"?"finished":myP?.ready?"playing":"lobby");};

// ── Game Create/Join ──
const createGame=async()=>{if(!playerName.trim()){setMsg("Name!");return;}const gid=uid(),pid=uid();
  const g={id:gid,turn:1,currentPlayerIndex:0,log:[],players:[{id:pid,name:playerName.trim(),position:"tortuga",ehre:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false}],phase:"lobby",winner:null};
  await api.create(g);setGameId(gid);setPlayerId(pid);setGame(g);setPhase("lobby");
  saveSess({gid,pid,pname:playerName.trim(),oname:"...",date:new Date().toISOString(),pos:"tortuga",ehre:0});setSessions(getSess());};
const joinGame=async()=>{if(!playerName.trim()||!joinCode.trim()){setMsg("Name & Code!");return;}const g=await api.load(joinCode.trim());if(!g){setMsg("Nicht gefunden!");return;}if(g.players.length>=2){setMsg("Voll!");return;}
  const pid=uid();g.players.push({id:pid,name:playerName.trim(),position:"puerto",ehre:0,ruhm:0,gold:0,rum:10,ship:"jolle",heroes:[],curses:[],ready:false});
  await api.save(g);setGameId(g.id);setPlayerId(pid);setGame(g);setPhase("lobby");saveSI(g);};

// ── Setup ──
const startSetup=()=>{setSetupIdx(0);setHeroes([null,null,null,null]);setCStep("name");setTName("");setTRace(null);setTProf(null);setStartGold(0);setSelHero(0);setPhase("setup");};
const usePreGroup=(pg)=>{const hs=pg.heroes.map(([n,r,p])=>mkHero(n,r,p));setHeroes(hs);setCStep("gold");setSelHero(0);};
const confirmHero=()=>{if(!tName.trim()||!tRace||!tProf){setMsg("Alles ausfüllen!");return;}
  const h=mkHero(tName.trim(),tRace,tProf);const nh=[...heroes];nh[setupIdx]=h;setHeroes(nh);
  if(setupIdx<3){setSetupIdx(setupIdx+1);setCStep("name");setTName("");setTRace(null);setTProf(null);}
  else{setCStep("gold");setSelHero(0);}};
const buyStartItem=(item)=>{if(startGold<item.cost)return;const h=heroes[selHero];
  if(h&&(item.nk||item.fk||item.rw)){const err=canEquip(h,item);if(err){setMsg(err);return;}
    h.eq=[...(h.eq||[]),{id:item.id,s:item.s,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,em:item.em,hv:item.hv||0}];
    setStartGold(startGold-item.cost);setMsg(`${h.name}: ${item.name}!`);setHeroes([...heroes]);}
  else{setStartGold(startGold-item.cost);setMsg("Gekauft!");}};
const finishSetup=async()=>{if(heroes.some(h=>!h)){setMsg("4 Helden!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi]={...g.players[pi],heroes,gold:startGold,ready:true};if(g.players.every(p=>p.ready))g.phase="playing";
  await api.save(g);setGame(g);saveSI(g);setPhase(g.players.every(p=>p.ready)?"playing":"lobby");};

// ── Turn ──
const endTurn=async(g)=>{g.currentPlayerIndex=(g.currentPlayerIndex+1)%g.players.length;g.turn++;await api.save(g);setGame(g);saveSI(g);};

// ── Party Wipe ──
const checkWipe=async(g,pi,koThisRound)=>{
  const alive=g.players[pi].heroes.filter(h=>h.hp>0);
  if(alive.length===0){
    const port=nearPort(g.players[pi].position);const lost=Math.floor(g.players[pi].gold*0.25);
    g.players[pi].position=port;g.players[pi].gold=Math.max(0,g.players[pi].gold-lost);
    // Only revive heroes that fell THIS round
    (koThisRound||[]).forEach(hid=>{const h=g.players[pi].heroes.find(x=>x.id===hid);if(h)h.hp=1;});
    g.log.push(`${g.players[pi].name}: ALLE K.O.! Rückzug nach ${REGIONS.find(r=>r.id===port)?.name||"Hafen"}, −${lost}G`);
    setMsg(`Rückzug! −${lost} Gold. Nur im Kampf Gefallene wiederbelebt.`);
    return true;
  }return false;};

// ── Move & Explore ──
const moveTo=async rid=>{if(!isMyTurn)return;const r=REGIONS.find(x=>x.id===rid);if((me?.ehre||0)<r.minE){setMsg(`${r.minE}⭐ nötig!`);return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].position=rid;
  g.log.push(`${me.name}: Segelt nach ${r.name}`);await api.save(g);setGame(g);
  // Mandatory event after moving
  const ev=genEv(r.type,r.lv,(me?.ehre||0),r.maxE);setEv(ev);setTestRes(null);setDuelState(null);setPhase("event");};
const explore=()=>{if(!isMyTurn||!aliveH.length)return;
  const ev=genEv(curReg.type,curReg.lv,me?.ehre||0,curReg.maxE);
  setEv(ev);setTestRes(null);setDuelState(null);setPhase("event");};

// ── Rewards ──
const applyReward=async(rw,g,pi,koList)=>{
  const bonus=(me?.ehre||0)>=75?2:1;const halfG=myCurses.some(c=>c.halfGold);
  let gG=Math.round((rw.gold||0)*bonus);if(halfG&&gG>0)gG=Math.floor(gG/2);
  const rG=Math.round((rw.ruhm||0)*bonus);const eG=Math.round((rw.ehre||0)*bonus);
  g.players[pi].gold=Math.max(0,g.players[pi].gold+gG);
  g.players[pi].ruhm=Math.max(0,(g.players[pi].ruhm||0)+rG);
  g.players[pi].ehre=Math.max(0,(g.players[pi].ehre||0)+eG);
  if(rw.rum)g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)+rw.rum);
  if(rw.heal&&rw.heal>0)g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+rw.heal);});
  if(rw.dmgAll)g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.max(0,h.hp-rw.dmgAll);});
  const parts=[];if(gG>0)parts.push(`+${gG}💰`);if(gG<0)parts.push(`${gG}💰`);
  if(rG>0)parts.push(`+${rG}🏆`);if(eG>0)parts.push(`+${eG}⭐`);
  if(rw.rum>0)parts.push(`+${rw.rum}🍺`);if(rw.heal>0)parts.push(`+${rw.heal}❤️`);
  if(rw.dmgAll)parts.push(`−${rw.dmgAll}HP alle!`);
  if(rw.curse){const c={...pick(CURSES)};g.players[pi].curses=[...(g.players[pi].curses||[]),c];parts.push(`FLUCH: ${c.name}!`);}
  if(rw.removeCurse&&(g.players[pi].curses||[]).length>0){g.players[pi].curses.pop();parts.push("Fluch gebrochen!");}
  if(parts.length>0)setMsg(parts.join(" "));
  // Check milestones
  const newE=g.players[pi].ehre;MILESTONES.forEach(m=>{if(newE>=m.e&&newE-eG<m.e)setMsg(`🏆 ${m.title}! ${m.msg}`);});
  // Hard victory feedback
  if(rw._hardWin)setMsg(prev=>`HELDENTAT! Gegen alle Widrigkeiten! 💪 ${prev||""}`);
  await checkWipe(g,pi,koList);
  if(newE>=100){g.winner={id:playerId,name:g.players[pi].name,type:"ehre"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return true;}
  return false;
};

// ── Event Resolution ──
const resolveEvent=async ci=>{
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  if(ev.type==="legendary"){g.winner={id:playerId,name:g.players[pi].name,type:"legendary"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
  if(ev.type==="forcecombat"||ev.type==="combat"){startCombat(ev.enemy,ev.reward);return;}
  if(ev.type==="skilltest"&&!testRes){setTestRes(skillTest(me.heroes,ev.stat,ev.diff,myCurses));return;}
  if(ev.type==="duel"&&!duelState){const pR=d6(),eR=d6();setDuelState({pR,eR,won:pR>eR});return;}
  if(ev.type==="duel"&&duelState){
    const rw=duelState.won?{gold:ev.bet,ruhm:2,ehre:1}:{gold:-ev.bet};
    await applyReward(rw,g,pi);g.log.push(`${me.name}: Würfelduell ${duelState.won?"gewonnen":"verloren"}`);
    await endTurn(g);setEv(null);setDuelState(null);setPhase("playing");return;}
  let rw={};
  if(ev.type==="choice"&&ci!==undefined){const r=ev.rews[ci];if(r?.combat){startCombat(r.combat,r.reward||r);return;}rw=r||{};}
  else if(ev.type==="heal"){rw={heal:ev.amount||2};}
  else{rw={gold:ev.gold||0,ruhm:ev.ruhm||0,ehre:ev.ehre||0,rum:ev.rum||0};}
  const won=await applyReward(rw,g,pi);if(won)return;
  g.log.push(`${me.name}: ${(ev.text||"").slice(0,40)}...`);await endTurn(g);setEv(null);setTestRes(null);setPhase("playing");
};
const resolveSkillTest=async(passed)=>{
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const rw=passed?ev.pass:ev.fail;
  if(rw?.combat){startCombat(rw.combat,rw.reward||rw);return;}
  const won=await applyReward(rw||{},g,pi);if(won)return;
  g.log.push(`${me.name}: ${(ev.text||"").slice(0,40)}...`);await endTurn(g);setEv(null);setTestRes(null);setPhase("playing");
};

// ── COMBAT (GDD Kapitel 4: FK Runde 1, NK Runde 2+) ──
const startCombat=(enemy,reward)=>{setCombat({enemy:{...enemy,curHp:enemy.hp},reward,round:1,koThisRound:[]});setCLog([`⚔️ Kampf gegen ${enemy.name}! (NK:${enemy.nk} HP:${enemy.hp} RW:${enemy.rw})`]);setActiveSkills([]);setPhase("combat");};
const doCombatRound=()=>{
  const alive=me.heroes.filter(h=>h.hp>0);if(!alive.length)return;
  const isFK=combat.round===1;const phaseName=isFK?"FERNKAMPF":"NAHKAMPF";
  let groupVal=alive.reduce((s,h)=>s+(isFK?hFK(h,myCurses):hNK(h,myCurses)),0);
  let shipBonus=isSea&&isFK?myShip.kan:0;
  // Active skill effects
  let skillMult=1;let ignoreRW=false;let skillMsg="";
  if(activeSkill){
    if(activeSkill.id==="s_rausch"&&!isFK){groupVal=Math.floor(groupVal*1.5);skillMsg="Kampfrausch! NK×1.5";}
    if(activeSkill.id==="s_breit"&&isFK){groupVal=Math.floor(groupVal*2);skillMsg="Breitseite! FK×2";}
    if(activeSkill.id==="s_doppel"){skillMult=2;skillMsg="Doppelschlag bereit!";}
    if(activeSkill.id==="s_schild"){ignoreRW=true;skillMsg="Schildbrecher! RW ignoriert!";}
    if(activeSkill.id==="s_geist"){groupVal+=5;skillMsg="Geisterruf! +5";}
    if(activeSkill.id==="s_toten"&&!isFK){groupVal+=8;skillMsg="Totenbeschwörung! +8 NK";}
    if(activeSkill.id==="s_fluch"){combat.enemy.nk=Math.max(0,combat.enemy.nk-3);skillMsg="Verfluchung! Gegner NK−3";}
    if(activeSkill.id==="s_inferno"&&isFK){skillMult=3;skillMsg="INFERNO! Schaden×3";}
    if(activeSkill.id==="s_praez"&&isFK){ignoreRW=true;skillMsg="Präzisionsschuss! RW ignoriert";}
    setActiveSkills([]);
  }
  const pRoll=d6();const pTotal=pRoll+groupVal+shipBonus;
  const eRoll=d6();const eTotal=eRoll+combat.enemy.nk;
  const logs=[...cLog];
  logs.push(`── Runde ${combat.round} (${phaseName}) ──`);
  if(skillMsg)logs.push(`  🌟 ${skillMsg}`);
  logs.push(`  Crew: W6(${pRoll}) + ${groupVal}${isFK?"FK":"NK"}${shipBonus?` + ${shipBonus}🔫`:""} = ${pTotal}`);
  logs.push(`  ${combat.enemy.name}: W6(${eRoll}) + ${combat.enemy.nk}NK = ${eTotal}`);
  const ne={...combat.enemy};const koList=[...(combat.koThisRound||[])];
  if(pTotal>eTotal){
    const rawDmg=(pTotal-eTotal)*skillMult;const eRW=ignoreRW?0:(ne.rw||0);
    const dmg=Math.max(1,rawDmg-eRW);ne.curHp=Math.max(0,ne.curHp-dmg);
    const diff=pTotal-eTotal;
    if(diff<=2)logs.push(`  ⚔️ Knapper Treffer! ${dmg} Schaden → HP:${ne.curHp}`);
    else if(diff<=5)logs.push(`  ⚔️ Sauberer Treffer! ${dmg} Schaden → HP:${ne.curHp}`);
    else logs.push(`  🔥 VERNICHTEND! ${dmg} Schaden → HP:${ne.curHp}`);
  }else if(eTotal>pTotal){
    const rawDmg=eTotal-pTotal;const target=[...alive].sort((a,b)=>a.hp-b.hp)[0];
    const shipDef=isSea?myShip.rumpf:0;const absorbed=hRW(target)+shipDef;
    const finalDmg=Math.max(1,rawDmg-absorbed);
    target.hp=Math.max(0,target.hp-finalDmg);
    if(target.hp<=0)koList.push(target.id);
    logs.push(`  💥 ${target.name}: ${finalDmg} Schaden (RW:${absorbed}) → HP:${target.hp}${target.hp<=0?" K.O.!":""}`);
  }else logs.push(`  ⚖️ Klingen prallen ab — Gleichstand!`);
  setCombat({...combat,enemy:ne,round:combat.round+1,koThisRound:koList});setCLog(logs);
};
const endCombat=async won=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  if(won&&combat.reward){
    const rw={...combat.reward};
    // Hard win bonus
    const groupStrength=aliveH.reduce((s,h)=>s+hNK(h,myCurses),0);
    if(combat.enemy.nk>groupStrength){rw._hardWin=true;rw.ehre=(rw.ehre||0)+1;rw.ruhm=(rw.ruhm||0)+2;rw.gold=(rw.gold||0)+5;}
    await applyReward(rw,g,pi,combat.koThisRound);
    // Loot drop
    if(combat.enemy.loot){const li=combat.enemy.loot;
      const g2={...game};const pi2=g2.players.findIndex(p=>p.id===playerId);
      g2.players[pi2].inv=[...(g2.players[pi2].inv||[]),{id:li.id,s:li.s,name:li.name,nk:li.nk||0,fk:li.fk||0,rw:li.rw||0,em:li.em,hv:li.hv||0}];
      setMsg(prev=>(prev||"")+" Beute: "+li.em+li.name+"!");}
    // Schiffsarzt Wundversorgung
    const arzt=me.heroes.find(h=>h.hp>0&&(h.skills||[]).includes("s_wund"));
    if(arzt&&won){const wounded=g.players[pi].heroes.filter(h=>h.hp>0&&h.hp<h.maxHp);
      if(wounded.length){const t=wounded[0];t.hp=Math.min(t.maxHp,t.hp+3);}}
  }
  g.players[pi].heroes=me.heroes.map(h=>({...h}));
  await checkWipe(g,pi,combat.koThisRound);
  if((g.players[pi].ehre||0)>=100){g.winner={id:playerId,name:g.players[pi].name,type:"ehre"};g.phase="finished";await api.save(g);setGame(g);setPhase("finished");return;}
  await endTurn(g);setCombat(null);setCLog([]);setEv(null);setPhase("playing");
};

// ── Rest ──
const rest=async()=>{if(!isMyTurn||!aliveH.length)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const heal=curReg?.tavern?5:3;g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+heal);});
  const rumCost=myCurses.some(c=>c.extraRum)?3:1;g.players[pi].rum=Math.max(0,(g.players[pi].rum||0)-rumCost);
  setMsg(`+${heal}❤️ −${rumCost}🍺`);await endTurn(g);};

// ── Shop ──
const buyItem=async(item,hIdx)=>{const pr=Math.round(item.cost*(SHOP_CONF[curReg?.shop]?.pm||1));if((me?.gold||0)<pr){setMsg("Kein Gold!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].gold-=pr;
  if(item.rum){g.players[pi].rum=(g.players[pi].rum||0)+item.rum;setMsg(`+${item.rum}🍺`);}
  else if(item.heal){g.players[pi].heroes.forEach(h=>{if(h.hp>0)h.hp=Math.min(h.maxHp,h.hp+item.heal);});setMsg("Crew geheilt!");}
  else if(item.nk||item.fk||item.rw){const h=g.players[pi].heroes[hIdx!=null?hIdx:0];
    if(!h||h.hp<=0){setMsg("Held nicht verfügbar!");g.players[pi].gold+=pr;return;}
    const err=canEquip(h,item);if(err){setMsg(err);g.players[pi].gold+=pr;return;}
    h.eq=[...(h.eq||[]),{id:item.id,s:item.s,name:item.name,nk:item.nk||0,fk:item.fk||0,rw:item.rw||0,em:item.em,hv:item.hv||0}];
    setMsg(`${h.name}: ${item.name}!`);}
  else{setMsg("Gekauft!");}
  await api.save(g);setGame(g);};
const sellItem=async(hIdx,eIdx)=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const h=g.players[pi].heroes[hIdx];if(!h)return;const item=h.eq[eIdx];if(!item)return;
  const refund=Math.floor((ITEMS.find(i=>i.id===item.id)?.cost||0)/2);
  h.eq=h.eq.filter((_,i)=>i!==eIdx);g.players[pi].gold+=refund;setMsg(`${item.name} verkauft: +${refund}💰`);
  await api.save(g);setGame(g);};
const buyShip=async ship=>{if((me?.gold||0)<ship.cost)return;const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi].gold-=ship.cost;g.players[pi].ship=ship.id;setMsg(ship.name+"!");await api.save(g);setGame(g);};

// ── Inventory functions ──
const unequipItem=async(hIdx,eIdx)=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const h=g.players[pi].heroes[hIdx];if(!h)return;const item=h.eq[eIdx];if(!item)return;
  h.eq=h.eq.filter((_,i)=>i!==eIdx);g.players[pi].inv=[...(g.players[pi].inv||[]),item];
  setMsg(`${item.name} abgelegt → Inventar`);await api.save(g);setGame(g);};
const equipFromInv=async(invIdx)=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const inv=g.players[pi].inv||[];const item=inv[invIdx];if(!item)return;
  const h=g.players[pi].heroes[shopHero];if(!h||h.hp<=0){setMsg("Held nicht verfügbar!");return;}
  const err=canEquip(h,item);if(err){setMsg(err);return;}
  h.eq=[...(h.eq||[]),item];g.players[pi].inv=inv.filter((_,i)=>i!==invIdx);
  setMsg(`${h.name}: ${item.name} ausgerüstet!`);await api.save(g);setGame(g);};
const sellFromInv=async(invIdx)=>{const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const inv=g.players[pi].inv||[];const item=inv[invIdx];if(!item)return;
  const refund=Math.floor((ITEMS.find(i=>i.id===item.id)?.cost||0)/2);
  g.players[pi].inv=inv.filter((_,i)=>i!==invIdx);g.players[pi].gold+=refund;
  setMsg(`${item.name} verkauft: +${refund}💰`);await api.save(g);setGame(g);};

// ── Level Up ──
const learnSkill=async(hid,skillId)=>{if((me?.ruhm||0)<10){setMsg("10 🏆 nötig!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=10;
  const h=g.players[pi].heroes.find(x=>x.id===hid);if(!h)return;
  h.skills=[...(h.skills||[]),skillId];
  const sk=PROFS[h.prof]?.skills.find(s=>s.id===skillId);
  if(sk?.stat&&sk.mod){h[sk.stat]=(h[sk.stat]||0)+sk.mod;if(sk.stat==="st"){h.maxHp+=1;h.hp+=1;}}
  setMsg(`${h.name}: ${sk?.name}!`);await endTurn(g);};
const trainStat=async(hid,stat)=>{if((me?.ruhm||0)<8){setMsg("8 🏆 nötig!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);g.players[pi].ruhm-=8;
  const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h[stat]+=1;if(stat==="st"){h.maxHp+=1;h.hp+=1;}setMsg(`${h.name}: ${stat.toUpperCase()}+1!`);}await endTurn(g);};

// ── Recruit/Heal ──
const healHero=async(hid)=>{if((me?.gold||0)<healCost){setMsg("Kein Gold!");return;}const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  g.players[pi].gold-=healCost;const h=g.players[pi].heroes.find(x=>x.id===hid);if(h){h.hp=Math.max(1,Math.floor(h.maxHp/2));setMsg(`${h.name} wiederbelebt!`);}
  await api.save(g);setGame(g);};
const recruitHero=async()=>{if(!rName.trim()||!rRace||!rProf){setMsg("Alles ausfüllen!");return;}if((me?.gold||0)<recruitCost){setMsg("Kein Gold!");return;}
  const g={...game};const pi=g.players.findIndex(p=>p.id===playerId);
  const dIdx=g.players[pi].heroes.findIndex(h=>h.hp<=0);
  if(dIdx<0){setMsg("Kein Platz (alle leben)!");return;}
  const nh=mkRecruit(rName.trim(),rRace,rProf);g.players[pi].heroes[dIdx]=nh;g.players[pi].gold-=recruitCost;
  setMsg(`${nh.name} angeheuert!`);setRName("");setRRace(null);setRProf(null);
  await api.save(g);setGame(g);};

// ════════════════════════════════════════════════════════════
//  SCREENS
// ════════════════════════════════════════════════════════════

const HeroCards=()=>(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
  {me?.heroes?.map(h=>(<Card key={h.id} style={{padding:8,opacity:h.hp<=0?0.3:1}}>
    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:3}}>
      <span style={{fontSize:13}}>{h.em}</span><span style={{fontSize:10,fontWeight:700,color:T.parch,fontFamily:"'Cinzel',serif",flex:1}}>{h.name}</span></div>
    <Badge>{PROFS[h.prof]?.em}{PROFS[h.prof]?.desc}</Badge>{h.hp<=0&&<Badge color={T.red}>K.O.</Badge>}
    <div style={{display:"flex",marginTop:3,gap:1}}>
      <SB label="HP" value={`${h.hp}/${h.maxHp}`} color={h.hp<=2?T.red:T.green}/>
      <SB label="NK" value={hNK(h,myCurses)}/><SB label="FK" value={hFK(h,myCurses)}/><SB label="RW" value={hRW(h)}/></div>
    <div style={{display:"flex",marginTop:2,gap:1}}><SB label="ST" value={h.st}/><SB label="GE" value={h.ge}/><SB label="IN" value={h.in_}/><SB label="BW" value={h.bw}/></div>
    {(h.eq||[]).length>0&&<div style={{marginTop:2,fontSize:8,color:T.gold}}>{h.eq.map(e=>`${e.em}${e.name}`).join(" ")}</div>}
  </Card>))}</div>);

const MapView=()=>{const conns=curReg?curReg.conn:[];
  return <Card style={{padding:0,overflow:"hidden"}}><div style={{position:"relative",width:"100%",paddingBottom:"110%",background:`linear-gradient(180deg,${T.sea},${T.bg} 50%,#1a120a)`}}>
    <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}>
      {REGIONS.flatMap(r=>r.conn.map(c=>{const t=REGIONS.find(x=>x.id===c);if(!t||r.id>c)return null;
        return <line key={r.id+c} x1={`${r.x}%`} y1={`${r.y}%`} x2={`${t.x}%`} y2={`${t.y}%`} stroke={conns.includes(r.id)||conns.includes(c)?T.gold+"44":T.border+"22"} strokeWidth={1}/>;}))}
    </svg>
    {REGIONS.map(r=>{const here=me?.position===r.id,canGo=conns.includes(r.id),locked=canGo&&r.minE>(me?.ehre||0),other=game?.players?.find(p=>p.id!==playerId&&p.position===r.id);
      return <div key={r.id} onClick={()=>canGo&&!locked&&isMyTurn?moveTo(r.id):null}
        style={{position:"absolute",left:`${r.x}%`,top:`${r.y}%`,transform:"translate(-50%,-50%)",cursor:canGo&&!locked&&isMyTurn?"pointer":"default",zIndex:here?10:canGo?5:1,textAlign:"center"}}>
        <div style={{width:here?44:canGo?36:26,height:here?44:canGo?36:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
          background:here?T.gold:canGo?RCOL[r.type]+"cc":RCOL[r.type]+"44",border:here?`3px solid ${T.goldL}`:canGo?`2px solid ${T.gold}88`:`1px solid ${T.border}33`,
          boxShadow:here?`0 0 18px ${T.gold}55`:"none",fontSize:here?18:canGo?14:11}}>{REMO[r.type]}</div>
        {other&&<div style={{position:"absolute",top:-6,right:-6,fontSize:10}}>🏴‍☠️</div>}
        <div style={{fontSize:here?8:7,color:here?T.goldL:canGo?T.parch:T.txtD+"55",fontFamily:"'Cinzel',serif",whiteSpace:"nowrap",marginTop:1}}>{r.name}</div>
        <div style={{fontSize:7,color:canGo?T.gold:T.txtD+"44"}}>{locked?`🔒${r.minE}`:`Lv${r.lv}`}</div>
      </div>;})}
  </div>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"6px 10px",background:T.bg+"cc",borderTop:`1px solid ${T.border}33`}}>
    {[["🏴‍☠️","Hafen"],["🏘️","Dorf"],["🌊","See"],["⛵","Handel"],["🌿","Sumpf"],["🐠","Riff"],["🏰","Stadt"],["🌫️","Nebel"],["🦈","Hai"],["👻","Geister"],["🐍","Verlies"],["🌋","Vulkan"],["🔮","Bermuda"],["🐙","Tiefsee"],["🫧","Unterwasser"],["💎","Schatz"],["👑","Thron"]].map(([e,l])=>
      <span key={l} style={{fontSize:8,color:T.txtD,whiteSpace:"nowrap"}}>{e}{l}</span>)}
  </div></Card>;};

// ── MENU ──
const MenuScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 80%,${T.seaL},${T.bg} 70%)`}}>
  <div style={{fontSize:52,marginBottom:8}}>🏴‍☠️</div>
  <div style={{fontSize:11,letterSpacing:8,color:T.txtD,fontFamily:"'Cinzel',serif"}}>PIRATEN</div>
  <div style={{fontSize:36,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",textShadow:`0 0 40px ${T.gold}44`}}>QUEST</div>
  <div style={{fontSize:12,color:T.txtD,marginBottom:20}}>Herrscher der Sieben Meere</div>
  <div style={{width:"100%",maxWidth:320}}>
    <input placeholder="Piratenname" value={playerName} onChange={e=>setPlayerName(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
    <Btn primary onClick={createGame}>Neues Spiel</Btn><div style={{height:12}}/>
    <input placeholder="Spielcode" value={joinCode} onChange={e=>setJoinCode(e.target.value)} style={{width:"100%",padding:13,border:`1px solid ${T.border}`,borderRadius:10,background:T.cardL,color:T.parch,fontSize:16,marginBottom:10,boxSizing:"border-box"}}/>
    <Btn onClick={joinGame}>Beitreten</Btn>
    {sessions.length>0&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginTop:20,marginBottom:8}}>GESPEICHERTE SPIELE</div>
      {sessions.map(s=>(<Card key={s.gid} style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{s.pname} vs {s.oname}</div>
          <div style={{fontSize:10,color:T.txtD}}>⭐{s.ehre||0} · {REGIONS.find(r=>r.id===s.pos)?.name||"?"}</div></div>
        <Btn small primary onClick={()=>resumeGame(s)} style={{width:"auto",minWidth:60}}>Laden</Btn>
        <Btn small danger onClick={()=>{delSess(s.gid);setSessions(getSess());}} style={{width:"auto",minWidth:30}}>✕</Btn>
      </Card>))}</>}
  </div></div>);

// ── LOBBY ──
const LobbyScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{textAlign:"center",marginBottom:20}}>
    <div style={{fontSize:12,color:T.txtD}}>SPIELCODE</div>
    <div style={{fontSize:26,fontWeight:900,color:T.gold,letterSpacing:4,background:T.card,padding:"10px 18px",borderRadius:12,display:"inline-block",border:`2px dashed ${T.gold}`,marginTop:6}}>{gameId}</div></div>
  <Card>{game?.players?.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
    <span style={{fontSize:18}}>{i===0?"🏴‍☠️":"⚓"}</span><span style={{color:T.parch,flex:1,fontSize:15}}>{p.name}</span>
    {p.id===playerId&&<Badge>DU</Badge>}{p.ready&&<Badge color={T.green}>BEREIT</Badge>}</div>))}</Card>
  {!me?.ready?<Btn primary onClick={startSetup}>Crew erstellen</Btn>
  :<Card style={{textAlign:"center"}}><div style={{color:T.txtD}}>{game?.players?.every(p=>p.ready)?"Bereit!":"Warte..."}</div>
    {game?.players?.every(p=>p.ready)&&<div style={{marginTop:10}}><Btn primary onClick={()=>setPhase("playing")}>Auslaufen! ⚓</Btn></div>}</Card>}
</div>);

// ── SETUP ──
const SetupScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{textAlign:"center",marginBottom:12}}>
    <div style={{fontSize:12,color:T.txtD}}>PIRAT {setupIdx+1}/4</div>
    <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>{[0,1,2,3].map(i=>(<div key={i} style={{width:32,height:4,borderRadius:2,background:heroes[i]?T.green:i===setupIdx?T.gold:T.border}}/>))}</div></div>
  {cStep==="name"&&<Card>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>Name deines Piraten</div>
    {setupIdx===0&&<div style={{marginBottom:10}}>
      <div style={{fontSize:11,color:T.txtD,marginBottom:6}}>Oder vorgefertigte Crew wählen:</div>
      {PREGROUPS.map(pg=>(<Btn key={pg.name} small onClick={()=>usePreGroup(pg)} style={{marginBottom:4}}>{pg.name}</Btn>))}
    </div>}
    <input placeholder="Name" value={tName} onChange={e=>setTName(e.target.value)} style={{width:"100%",padding:12,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:16,boxSizing:"border-box",marginBottom:10}}/>
    <Btn primary onClick={()=>{if(!tName.trim()){setMsg("Name!");return;}setCStep("race");}}>Weiter</Btn></Card>}
  {cStep==="race"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>RASSE</div>
    <div style={{fontSize:9,color:T.txtD,marginBottom:6}}>Werte sind fest pro Rasse (wie bei UltraQuest)</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setTRace(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tRace===k?T.gold+"28":T.card,border:`1px solid ${tRace===k?T.gold:T.border}`}}>
      <div>{r.em} <span style={{fontSize:11,color:T.parch,fontFamily:"'Cinzel',serif"}}>{k==="HaiBlut"?"Hai-Blut":k}</span></div>
      <div style={{fontSize:9,color:T.txtD}}>{r.desc}</div>
      <div style={{fontSize:8,color:T.txtD}}>BW:{r.bw} ST:{r.st} GE:{r.ge} IN:{r.in_} HP:{r.hp+r.st}</div></div>))}</div>
    <div style={{marginTop:10}}><Btn primary onClick={()=>{if(!tRace){setMsg("Wählen!");return;}setCStep("prof");}} disabled={!tRace}>Weiter</Btn></div></>}
  {cStep==="prof"&&<><div style={{fontSize:13,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>BERUF</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setTProf(k)} style={{padding:8,borderRadius:10,cursor:"pointer",background:tProf===k?T.gold+"28":T.card,border:`1px solid ${tProf===k?T.gold:T.border}`}}>
      <div>{p.em} <span style={{fontSize:11,color:T.parch,fontFamily:"'Cinzel',serif"}}>{p.desc}</span></div>
      <div style={{fontSize:8,color:T.gold+"88"}}>NK+{p.nk} FK+{p.fk}</div>
      <div style={{fontSize:8,color:T.txtD}}>Start: {p.skills[0].name}</div>
      <div style={{fontSize:7,color:T.txtD}}>{p.skills[0].desc}</div></div>))}</div>
    <div style={{marginTop:10}}><Btn primary onClick={confirmHero} disabled={!tProf}>Bestätigen</Btn></div></>}
  {cStep==="gold"&&<div>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:6}}>CREW AUSRÜSTEN</div>
    {startGold===0?<Card style={{textAlign:"center"}}><div style={{fontSize:11,color:T.txtD,marginBottom:8}}>Alle 4 Piraten erstellt! Startgold würfeln (3W6 × 3)</div>
      <Btn primary onClick={()=>setStartGold((d6()+d6()+d6())*3)}>Gold würfeln!</Btn></Card>
    :<div>
      <div style={{textAlign:"center",marginBottom:8}}><span style={{fontSize:24,fontWeight:900,color:"#FFC107"}}>{startGold}G</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {heroes.filter(Boolean).map((h,i)=>(<div key={h.id} onClick={()=>setSelHero(i)} style={{padding:6,borderRadius:8,background:selHero===i?T.gold+"22":T.card,border:`2px solid ${selHero===i?T.gold:T.border}`,cursor:"pointer"}}>
          <div style={{fontSize:11,fontWeight:700,color:selHero===i?T.goldL:T.parch}}>{h.em} {h.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>NK:{hNK(h,[])} FK:{hFK(h,[])} RW:{hRW(h)}</div>
          {(h.eq||[]).length>0?<div style={{fontSize:8,color:T.gold}}>{h.eq.map(e=>e.em+e.name).join(", ")}</div>
          :<div style={{fontSize:8,color:T.red}}>Keine Ausrüstung</div>}
        </div>))}</div>
      <div style={{fontSize:10,color:T.gold,marginBottom:4}}>Kaufen für: {heroes[selHero]?.em} {heroes[selHero]?.name}</div>
      <div style={{maxHeight:200,overflow:"auto",marginBottom:8}}>
        {ITEMS.filter(i=>i.tier<=0&&(i.nk||i.fk||i.rw||i.heal||i.rum)).map(it=>{
          const err=heroes[selHero]?canEquip(heroes[selHero],it):null;
          return(<div key={it.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${T.border}22`,opacity:err?0.4:1}}>
            <span style={{fontSize:12}}>{it.em}</span>
            <div style={{flex:1}}><div style={{fontSize:10,color:T.parch}}>{it.name}{err?` (${err})`:""}</div>
              <div style={{fontSize:8,color:T.txtD}}>{it.s==="m1"?"1H ":it.s==="m2"?"2H ":it.s==="r"?"FK ":it.s==="a"?"Rüst ":it.s==="s"?"Schild ":""}{it.nk>0&&`NK+${it.nk} `}{it.fk>0&&`FK+${it.fk} `}{it.rw>0&&`RW+${it.rw} `}{it.heal&&`Heal+${it.heal} `}{it.rum&&`+${it.rum}🍺`}</div></div>
            <Btn small primary onClick={()=>buyStartItem(it)} disabled={startGold<it.cost||!!err} style={{width:"auto",minWidth:50}}>{it.cost}G</Btn></div>);})}
      </div>
      <Btn primary onClick={()=>setCStep("done")}>Fertig ausgerüstet!</Btn></div>}</div>}
  {cStep==="done"&&<div>
    <Card><div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:8}}>EURE CREW</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{heroes.filter(Boolean).map((h,i)=>(<div key={i} style={{padding:6,background:T.bg,borderRadius:8}}>
        <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:2}}><span>{h.em}</span><span style={{fontSize:11,color:T.parch,fontWeight:700}}>{h.name}</span></div>
        <Badge>{PROFS[h.prof]?.desc}</Badge>
        <div style={{fontSize:8,color:T.txtD,marginTop:2}}>NK:{hNK(h,[])} FK:{hFK(h,[])} RW:{hRW(h)} HP:{h.maxHp}</div>
        {(h.eq||[]).length>0&&<div style={{fontSize:8,color:T.gold}}>{h.eq.map(e=>e.em+e.name).join(", ")}</div>}
      </div>))}</div></Card>
    <div style={{textAlign:"center",marginBottom:8}}><Badge color="#FFC107">{startGold}G übrig (wird mitgenommen)</Badge></div>
    <Btn primary onClick={finishSetup}>Auslaufen! ⚓</Btn></div>}
</div>);

// ── PLAY ──
const PlayScreen=()=>{const other=game?.players?.find(p=>p.id!==playerId);
  return <div style={{padding:14,paddingBottom:100}}>
    <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
      <Badge color={T.gold}>⭐{me?.ehre||0}</Badge><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge><Badge color="#FFC107">💰{me?.gold||0}</Badge><Badge color="#FF8F00">🍺{me?.rum||0}</Badge>
      <Badge color={T.seaL}>{myShip.em}{myShip.name}</Badge><Badge color={isMyTurn?T.green:T.red}>{isMyTurn?"DEIN ZUG":"WARTE"}</Badge>
      <div onClick={()=>setShowHelp(true)} style={{marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:T.gold+"33",border:`1px solid ${T.gold}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.gold,fontWeight:900}}>?</div>
    </div>
    {myCurses.length>0&&<div style={{fontSize:9,color:T.red,marginBottom:4}}>Flüche: {myCurses.map(c=>`${c.name} (${c.desc})`).join(", ")}</div>}
    {other&&<div onClick={()=>setShowOpp(!showOpp)} style={{fontSize:10,color:T.txtD,marginBottom:4,cursor:"pointer"}}>
      {showOpp?"▼":"▶"} {other.name}: ⭐{other.ehre||0} 🏆{other.ruhm||0} 💰{other.gold||0}</div>}
    {showOpp&&other&&<Card style={{background:T.bg,marginBottom:8}}>
      <div style={{fontSize:11,color:T.gold,marginBottom:4}}>{other.name}s Crew</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
        {(other.heroes||[]).map(h=>(<div key={h.id} style={{padding:4,background:T.card,borderRadius:6,opacity:h.hp<=0?0.3:1}}>
          <div style={{fontSize:10,color:T.parch,fontWeight:700}}>{h.em} {h.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>{PROFS[h.prof]?.desc} · HP:{h.hp}/{h.maxHp}</div>
          <div style={{fontSize:8,color:T.txtD}}>NK:{hNK(h,other.curses||[])} FK:{hFK(h,other.curses||[])}</div>
        </div>))}</div></Card>}
    {curReg?.maxE&&(me?.ehre||0)>curReg.maxE&&<div style={{fontSize:10,color:T.gold,marginBottom:4,fontStyle:"italic"}}>Diese Gewässer sind unter eurer Würde, Kapitän. (Keine ⭐ hier)</div>}
    <div style={{fontSize:13,color:T.parch,fontFamily:"'Cinzel',serif",marginBottom:6}}>📍 {curReg?.name} {REMO[curReg?.type]} <span style={{fontSize:10,color:T.txtD}}>Lv{curReg?.lv}</span></div>
    {MapView()}{HeroCards()}
    {isMyTurn&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <Btn primary onClick={explore} disabled={!aliveH.length}>Erkunden (W100)</Btn>
      <Btn onClick={rest} disabled={!aliveH.length}>{curReg?.tavern?"Taverne (+5❤️)":"Rasten (+3❤️)"}</Btn>
      {curReg?.shop&&<Btn onClick={()=>{setShopHero(0);setPhase("shop");}}>Laden</Btn>}
      {curReg?.port&&<Btn onClick={()=>{setRName("");setRRace(null);setRProf(null);setPhase("recruit");}}>Hafen{deadH.length>0?` (${deadH.length} K.O.)`:""}</Btn>}
      {curReg?.port&&<Btn onClick={()=>setPhase("levelup")}>Aufwerten 🏆</Btn>}
      <Btn onClick={()=>setPhase("inventory")}>Inventar 🎒</Btn>
      {curReg?.dungeon&&<Btn onClick={()=>setMsg("Dungeons kommen bald!")}>Dungeon ⚔️</Btn>}
    </div>}
    {game?.log?.length>0&&<Card style={{marginTop:8}}><div style={{maxHeight:50,overflow:"auto"}}>{game.log.slice(-4).reverse().map((l,i)=><div key={i} style={{fontSize:9,color:T.txtD}}>{l}</div>)}</div></Card>}
  </div>;};

// ── EVENT ──
const EventScreen=()=>(<div style={{minHeight:"100vh",padding:20,display:"flex",flexDirection:"column",justifyContent:"center"}}>
  <Card style={{borderColor:T.gold+"44"}}>
    <div style={{textAlign:"center",marginBottom:8}}><Badge>W100:{ev?.w100}</Badge><Badge color={RCOL[curReg?.type]}>{curReg?.name} Lv{curReg?.lv}</Badge>
      {ev?.overLevel&&<Badge color={T.red}>Zu stark — keine ⭐</Badge>}</div>
    <div style={{fontSize:15,color:T.parch,fontFamily:"'Crimson Text',serif",lineHeight:1.6,textAlign:"center",marginBottom:16,fontStyle:"italic"}}>{ev?.text}</div>
    {ev?.type==="skilltest"&&!testRes&&(<div><div style={{textAlign:"center",fontSize:12,color:T.gold,marginBottom:8}}>{ev.stat==="st"?"Stärke":ev.stat==="ge"?"Geschick":"Intelligenz"}-Test (≥{ev.diff})</div>
      <Btn primary onClick={()=>resolveEvent()}>Würfeln! (W6 + {ev.stat.toUpperCase()})</Btn></div>)}
    {ev?.type==="skilltest"&&testRes&&(<div>
      <Card style={{background:T.bg,textAlign:"center"}}>
        <div style={{fontSize:12,color:T.gold,marginBottom:4}}>{testRes.hero?.name} würfelt:</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,alignItems:"center",marginBottom:6}}>
          <DF val={testRes.rolled}/><span style={{color:T.parch}}>+{testRes.sv}=</span>
          <div style={{fontSize:22,fontWeight:900,color:testRes.ok?T.green:T.red}}>{testRes.total}</div>
          <span style={{color:T.txtD}}>vs {testRes.diff}</span></div>
        <div style={{fontSize:16,fontWeight:900,color:testRes.ok?T.green:T.red}}>{testRes.ok?"GESCHAFFT! 💪":"MISSLUNGEN! 💀"}</div></Card>
      <div style={{marginTop:8}}><Btn primary onClick={()=>resolveSkillTest(testRes.ok)}>Weiter</Btn></div></div>)}
    {ev?.type==="duel"&&!duelState&&(<div>
      <div style={{textAlign:"center",fontSize:13,color:T.gold,marginBottom:8}}>Einsatz: {ev.bet} Gold</div>
      <Btn primary onClick={()=>resolveEvent()}>Würfelduell! 🎲</Btn></div>)}
    {ev?.type==="duel"&&duelState&&(<div>
      <Card style={{background:T.bg,textAlign:"center"}}>
        <div style={{fontSize:12,color:T.gold,marginBottom:8}}>WÜRFELDUELL!</div>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8}}>
          <div><div style={{fontSize:9,color:T.txtD}}>IHR</div><DF val={duelState.pR}/></div>
          <div style={{fontSize:20,color:T.parch,alignSelf:"center"}}>vs</div>
          <div><div style={{fontSize:9,color:T.txtD}}>GEGNER</div><DF val={duelState.eR}/></div></div>
        <div style={{fontSize:16,fontWeight:900,color:duelState.won?T.green:T.red}}>{duelState.won?`GEWONNEN! +${ev.bet}💰`:`VERLOREN! −${ev.bet}💰`}</div></Card>
      <div style={{marginTop:8}}><Btn primary onClick={()=>resolveEvent()}>Weiter</Btn></div></div>)}
    {ev?.type==="choice"&&<div style={{display:"grid",gap:6}}>{ev.opts.map((o,i)=><Btn key={i} primary={i===0} onClick={()=>resolveEvent(i)}>{o}</Btn>)}</div>}
    {(ev?.type==="forcecombat"||ev?.type==="combat")&&<Btn primary onClick={()=>resolveEvent()}>Kampf! ⚔️</Btn>}
    {ev?.type==="legendary"&&<div><div style={{textAlign:"center",fontSize:28,marginBottom:10}}>👑💎🏴‍☠️</div><Btn primary onClick={()=>resolveEvent()}>PIRATENKÖNIG!!!</Btn></div>}
    {["loot","heal","trade"].includes(ev?.type)&&<div>
      {((ev?.gold||0)>0||(ev?.ruhm||0)>0||(ev?.ehre||0)>0)&&<div style={{textAlign:"center",marginBottom:10,color:T.green,fontSize:14}}>
        {ev?.gold>0&&`💰+${ev.gold} `}{ev?.ruhm>0&&`🏆+${ev.ruhm} `}{ev?.ehre>0&&`⭐+${ev.ehre}`}</div>}
      {ev?.type==="heal"&&<div style={{textAlign:"center",marginBottom:10,color:T.green}}>Crew geheilt! +{ev.amount}❤️</div>}
      <Btn primary onClick={()=>resolveEvent()}>Weiter</Btn></div>}
  </Card></div>);

// ── COMBAT ──
const CombatScreen=()=>{const alive=aliveH.length;const eDead=combat?.enemy?.curHp<=0;const pDead=alive===0;
  const isFK=combat?.round===1;
  // Get available active skills for this round
  const availSkills=aliveH.flatMap(h=>{const prof=PROFS[h.prof];return(h.skills||[]).map(sid=>prof?.skills.find(s=>s.id===sid)).filter(s=>s&&s.active);});
  return <div style={{minHeight:"100vh",padding:20}}>
    <div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:11,color:T.txtD}}>RUNDE {combat?.round||1} · {isFK?"FERNKAMPF 🔫":"NAHKAMPF ⚔️"}{isSea?` · ${myShip.name} (${myShip.kan}🔫 ${myShip.rumpf}🛡️)`:""}</div></div>
    <Card style={{textAlign:"center",borderColor:T.red+"44"}}>
      <div style={{fontSize:20}}>👹</div>
      <div style={{fontSize:15,color:T.red,fontFamily:"'Cinzel',serif"}}>{combat?.enemy?.name}</div>
      <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:4}}><SB label="HP" value={`${Math.max(0,combat?.enemy?.curHp)}/${combat?.enemy?.hp}`} color={T.red}/><SB label="NK" value={combat?.enemy?.nk}/><SB label="RW" value={combat?.enemy?.rw}/></div></Card>
    {HeroCards()}
    {!eDead&&!pDead&&availSkills.length>0&&<Card style={{padding:8}}>
      <div style={{fontSize:10,color:T.gold,marginBottom:4}}>Fertigkeit einsetzen:</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        <div onClick={()=>setActiveSkill(null)} style={{padding:"4px 8px",borderRadius:6,fontSize:10,cursor:"pointer",background:activeSkills.length===0?T.gold+"44":T.card,border:`1px solid ${T.border}`,color:T.parch}}>Keine</div>
        {availSkills.map(s=>(<div key={s.id} onClick={()=>setActiveSkills(prev=>prev.find(x=>x.id===s.id)?prev.filter(x=>x.id!==s.id):[...prev,s])} style={{padding:"4px 8px",borderRadius:6,fontSize:10,cursor:"pointer",background:activeSkills.find(x=>x.id===s.id)?T.gold+"44":T.card,border:`1px solid ${activeSkill?.id===s.id?T.gold:T.border}`,color:T.parch}}>
          {s.name}<div style={{fontSize:8,color:T.txtD}}>{s.desc}</div></div>))}</div></Card>}
    <Card style={{maxHeight:100,overflow:"auto",background:T.bg}}>{cLog.map((l,i)=><div key={i} style={{fontSize:10,color:l.includes("💥")?T.red:l.includes("⚔️")||l.includes("🔥")?T.green:T.parch,padding:"1px 0"}}>{l}</div>)}</Card>
    {eDead?<div style={{marginTop:8}}><div style={{textAlign:"center",color:T.green,fontSize:14,marginBottom:6}}>
      SIEG! {combat.reward&&`+${combat.reward.ruhm||0}🏆 +${combat.reward.ehre||0}⭐ +${combat.reward.gold||0}💰`}</div>
      <Btn primary onClick={()=>endCombat(true)}>Beute einsammeln! 💰</Btn></div>
    :pDead?<div style={{marginTop:8}}><div style={{textAlign:"center",color:T.red,fontSize:14,marginBottom:6}}>Niederlage! 💀</div><Btn danger onClick={()=>endCombat(false)}>Weiter</Btn></div>
    :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
      <Btn primary onClick={doCombatRound}>Angriff! {isFK?"🔫":"⚔️"}</Btn><Btn danger onClick={()=>endCombat(false)}>Fliehen!</Btn></div>}
  </div>;};

// ── SHOP ──
const ShopScreen=()=>{const sd=SHOP_CONF[curReg?.shop]||SHOP_CONF.hafen;const ehre=me?.ehre||0;
  const sh=me?.heroes?.[shopHero];
  return <div style={{minHeight:"100vh",padding:20}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif"}}>{sd.em} {sd.name}</div><Badge color="#FFC107">💰{me?.gold||0}</Badge></div>
    <div style={{fontSize:10,color:T.gold,marginBottom:4}}>KAUFEN FÜR:</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
      {me?.heroes?.map((h,i)=>(<div key={h.id} onClick={()=>setShopHero(i)} style={{padding:6,borderRadius:8,background:shopHero===i?T.gold+"22":T.card,border:`2px solid ${shopHero===i?T.gold:T.border}`,cursor:"pointer",opacity:h.hp<=0?0.3:1}}>
        <div style={{fontSize:10,color:shopHero===i?T.goldL:T.parch,fontWeight:700}}>{h.em} {h.name}</div>
        <div style={{fontSize:8,color:T.txtD}}>NK:{hNK(h,myCurses)} FK:{hFK(h,myCurses)} RW:{hRW(h)}</div>
        {(h.eq||[]).length>0&&<div style={{fontSize:8,color:T.gold}}>{h.eq.map((e,ei)=>(<span key={ei} onClick={ev=>{ev.stopPropagation();sellItem(i,ei);}} style={{cursor:"pointer",marginRight:3}}>
          {e.em}{e.name}✕</span>))}</div>}
      </div>))}</div>
    <div style={{fontSize:8,color:T.txtD,marginBottom:6}}>Tippe ✕ neben Item zum Verkaufen (halber Preis)</div>
    {sd.ships&&<><div style={{fontSize:11,color:T.gold,marginBottom:4}}>SCHIFFE</div>
      <div style={{display:"grid",gap:4,marginBottom:8}}>{SHIPS.filter(s=>s.cost>0).map(s=>(<Card key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:me?.ship===s.id?0.4:1}}>
        <div style={{fontSize:16}}>{s.em}</div><div style={{flex:1}}><div style={{fontSize:11,color:T.parch}}>{s.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>🔫{s.kan} 🛡️{s.rumpf} ⚡{s.spd}</div></div>
        <Btn small primary onClick={()=>buyShip(s)} disabled={(me?.gold||0)<s.cost||me?.ship===s.id} style={{width:"auto",minWidth:50}}>{me?.ship===s.id?"✓":s.cost+"G"}</Btn></Card>))}</div></>}
    <div style={{fontSize:11,color:T.gold,marginBottom:4}}>WAREN {sh?`für ${sh.name}`:""}</div>
    <div style={{display:"grid",gap:3}}>{ITEMS.filter(i=>sd.ids.includes(i.id)).map(it=>{const pr=Math.round(it.cost*sd.pm);const locked=ehre<TIER_FAME[it.tier];
      const slotErr=sh?canEquip(sh,it):null;const cant=locked||(me?.gold||0)<pr||!!slotErr;
      return(<Card key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:8,opacity:locked?0.3:cant?0.5:1}}>
        <div style={{fontSize:14}}>{it.em}</div>
        <div style={{flex:1}}><div style={{fontSize:10,color:T.parch}}>{it.name}{locked?` 🔒${TIER_FAME[it.tier]}⭐`:""}{slotErr?` (${slotErr})`:""}</div>
          <div style={{fontSize:8,color:T.txtD}}>{it.s==="m1"?"1H ":it.s==="m2"?"2H ":it.s==="r"?"FK ":it.s==="a"?"Rüst ":it.s==="s"?"Schild ":""}{it.nk>0&&`NK+${it.nk} `}{it.fk>0&&`FK+${it.fk} `}{it.rw>0&&`RW+${it.rw} `}{it.heal&&`Heal+${it.heal} `}{it.rum&&`+${it.rum}🍺 `}{it.hv?"[schwer] ":""}</div>
          {it.d&&<div style={{fontSize:7,color:T.txtD,fontStyle:"italic"}}>{it.d}</div>}
          {sh&&(it.nk>0||it.fk>0||it.rw>0)&&!slotErr&&<div style={{fontSize:8,color:T.green}}>
            {it.nk>0&&`NK: ${hNK(sh,myCurses)}→${hNK(sh,myCurses)+it.nk-(sh.eq.filter(e=>e.s==="m1"||e.s==="m2").reduce((b,e)=>Math.max(b,e.nk),0)>it.nk?0:it.nk)} `}
            {it.fk>0&&`FK: ${hFK(sh,myCurses)}→${hFK(sh,myCurses)+it.fk} `}
            {it.rw>0&&`RW: ${hRW(sh)}→${hRW(sh)+it.rw}`}
          </div>}</div>
        <Btn small primary onClick={()=>buyItem(it,shopHero)} disabled={cant} style={{width:"auto",minWidth:50}}>{pr}G</Btn></Card>);})}</div>
    <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurück</Btn></div></div>;};

// ── RECRUIT ──
const RecruitScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:10}}>⚓ Hafen: {curReg?.name}</div>
  {deadH.length>0&&<><div style={{fontSize:12,color:T.gold,marginBottom:6}}>K.O. Helden heilen ({healCost}G → 50% HP)</div>
    {deadH.map(h=>(<Card key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:8}}>
      <span style={{fontSize:14}}>{h.em}</span><div style={{flex:1}}><div style={{fontSize:12,color:T.parch}}>{h.name}</div><div style={{fontSize:9,color:T.red}}>K.O.</div></div>
      <Btn small primary onClick={()=>healHero(h.id)} disabled={(me?.gold||0)<healCost} style={{width:"auto",minWidth:70}}>Heilen {healCost}G</Btn></Card>))}</>}
  {deadH.length>0&&<><div style={{fontSize:12,color:T.gold,marginTop:14,marginBottom:6}}>Neuen Söldner anheuern ({recruitCost}G)</div>
    <div style={{fontSize:9,color:T.txtD,marginBottom:6}}>Ersetzt einen K.O.-Helden. Söldner: Basiswerte + Zufallsbonus.</div>
    <input placeholder="Name" value={rName} onChange={e=>setRName(e.target.value)} style={{width:"100%",padding:10,border:`1px solid ${T.border}`,borderRadius:8,background:T.cardL,color:T.parch,fontSize:14,boxSizing:"border-box",marginBottom:8}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
      {Object.entries(RACES).map(([k,r])=>(<div key={k} onClick={()=>setRRace(k)} style={{padding:4,borderRadius:6,cursor:"pointer",background:rRace===k?T.gold+"28":T.card,border:`1px solid ${rRace===k?T.gold:T.border}`,fontSize:10}}>{r.em} {k==="HaiBlut"?"Hai-Blut":k}</div>))}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
      {Object.entries(PROFS).map(([k,p])=>(<div key={k} onClick={()=>setRProf(k)} style={{padding:4,borderRadius:6,cursor:"pointer",background:rProf===k?T.gold+"28":T.card,border:`1px solid ${rProf===k?T.gold:T.border}`,fontSize:10}}>{p.em} {p.desc}</div>))}</div>
    <Btn primary onClick={recruitHero} disabled={(me?.gold||0)<recruitCost||!rName.trim()||!rRace||!rProf}>Anheuern! ({recruitCost}G)</Btn></>}
  {deadH.length===0&&<div style={{fontSize:11,color:T.txtD,marginTop:10}}>Alle Helden leben — keine Heilung/Rekrutierung nötig.</div>}
  <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurück</Btn></div></div>);

// ── LEVEL UP ──
const LevelUpScreen=()=>(<div style={{minHeight:"100vh",padding:20}}>
  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif"}}>Aufwerten</div><Badge color="#FFD700">🏆{me?.ruhm||0}</Badge></div>
  <div style={{fontSize:10,color:T.txtD,marginBottom:8}}>Stats: 8🏆 | Fertigkeiten: 10🏆 | Beendet den Zug</div>
  {aliveH.map(h=>{const prof=PROFS[h.prof];const learned=h.skills||[];const next=prof.skills.filter(s=>!learned.includes(s.id));
    return <Card key={h.id}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span>{h.em}</span>
        <span style={{fontSize:12,color:T.parch,fontFamily:"'Cinzel',serif"}}>{h.name}</span><Badge>{prof.desc}</Badge></div>
      <div style={{fontSize:9,color:T.txtD,marginBottom:2}}>Gelernt: {learned.map(sid=>prof.skills.find(s=>s.id===sid)?.name).filter(Boolean).join(", ")}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:4}}>
        {[["st","ST"],["ge","GE"],["in_","IN"],["bw","BW"]].map(([k,l])=>
          <Btn key={k} small onClick={()=>trainStat(h.id,k)} disabled={(me?.ruhm||0)<8||!isMyTurn}>{l}:{h[k]}→{h[k]+1} (8🏆)</Btn>)}</div>
      {next.length>0&&next.map(s=>(<div key={s.id} style={{marginBottom:3}}>
        <Btn small onClick={()=>learnSkill(h.id,s.id)} disabled={(me?.ruhm||0)<10||!isMyTurn}>
          {s.name} (10🏆) {s.active?"[AKTIV]":"[PASSIV]"}</Btn>
        <div style={{fontSize:8,color:T.txtD,padding:"2px 4px"}}>{s.desc}{s.stat?` · ${s.stat.toUpperCase()}+${s.mod}`:""}{s.cd?` · CD:${s.cd}R`:""}</div></div>))}
    </Card>;})}
  <div style={{marginTop:8}}><Btn onClick={()=>setPhase("playing")}>Zurück</Btn></div></div>);

// ── INVENTORY ──
const InventoryScreen=()=>{
  const inv=me?.inv||[];
  return <div style={{minHeight:"100vh",padding:20}}>
    <div style={{fontSize:15,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:10}}>🎒 Inventar & Ausrüstung</div>
    <div style={{fontSize:10,color:T.txtD,marginBottom:8}}>Tippe ✕ zum Ablegen, tippe Item im Inventar zum Ausrüsten auf gewählten Helden.</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
      {me?.heroes?.map((h,i)=>(<div key={h.id} onClick={()=>setShopHero(i)} style={{padding:6,borderRadius:8,background:shopHero===i?T.gold+"22":T.card,border:`2px solid ${shopHero===i?T.gold:T.border}`,cursor:"pointer",opacity:h.hp<=0?0.3:1}}>
        <div style={{fontSize:11,fontWeight:700,color:shopHero===i?T.goldL:T.parch}}>{h.em} {h.name}</div>
        <div style={{fontSize:8,color:T.txtD}}>NK:{hNK(h,myCurses)} FK:{hFK(h,myCurses)} RW:{hRW(h)}</div>
        {(h.eq||[]).map((e,ei)=>(<div key={ei} style={{fontSize:8,color:T.gold}}>
          {e.em}{e.name} <span onClick={ev=>{ev.stopPropagation();unequipItem(i,ei);}} style={{cursor:"pointer",color:T.red}}>✕</span></div>))}
      </div>))}</div>
    {inv.length>0&&<><div style={{fontSize:12,color:T.gold,marginBottom:6}}>Lose Gegenstände ({inv.length})</div>
      {inv.map((it,idx)=>(<Card key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:8}}>
        <span style={{fontSize:14}}>{it.em}</span>
        <div style={{flex:1}}><div style={{fontSize:11,color:T.parch}}>{it.name}</div>
          <div style={{fontSize:8,color:T.txtD}}>{it.nk>0&&`NK+${it.nk} `}{it.fk>0&&`FK+${it.fk} `}{it.rw>0&&`RW+${it.rw}`}</div></div>
        <Btn small primary onClick={()=>equipFromInv(idx)} style={{width:"auto",minWidth:55}}>Ausrüsten</Btn>
        <Btn small danger onClick={()=>sellFromInv(idx)} style={{width:"auto",minWidth:45}}>Verkauf</Btn>
      </Card>))}</>}
    {inv.length===0&&<div style={{fontSize:11,color:T.txtD,textAlign:"center",padding:20}}>Kein loses Inventar. Beute aus Kämpfen landet hier.</div>}
    <div style={{marginTop:10}}><Btn onClick={()=>setPhase("playing")}>Zurück</Btn></div>
  </div>;};

// ── FINISHED ──
const FinishedScreen=()=>(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
  <div style={{fontSize:52,marginBottom:10}}>👑🏴‍☠️</div>
  <div style={{fontSize:24,fontWeight:900,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:4}}>{game?.winner?.type==="legendary"?"LEGENDÄRER SIEG!":"PIRATENKÖNIG!"}</div>
  <div style={{fontSize:15,color:T.parch,textAlign:"center",marginBottom:20}}>Kapitän {game?.winner?.name} herrscht über die Sieben Meere!</div>
  {game?.players?.map(p=>(<Card key={p.id} style={{width:"100%",maxWidth:300}}>
    <div style={{fontSize:14,color:T.gold,fontFamily:"'Cinzel',serif"}}>{p.name}{p.id===game?.winner?.id?" 👑":""}</div>
    <div style={{display:"flex",gap:6,marginTop:4}}><SB label="Ehre" value={p.ehre||0}/><SB label="Ruhm" value={p.ruhm||0}/><SB label="Gold" value={p.gold||0}/></div></Card>))}
  <div style={{marginTop:20,width:"100%",maxWidth:300}}><Btn primary onClick={()=>{setPhase("menu");setGame(null);setGameId("");}}>Neues Spiel</Btn></div></div>);

// ── HELP OVERLAY ──
const HelpOverlay=()=>showHelp?(<div onClick={()=>setShowHelp(false)} style={{position:"fixed",inset:0,background:"#000c",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
  <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.gold}`,borderRadius:16,padding:20,maxWidth:380,maxHeight:"85vh",overflow:"auto",width:"100%"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:16,color:T.gold,fontFamily:"'Cinzel',serif"}}>🏴‍☠️ Spielhilfe</div>
      <div onClick={()=>setShowHelp(false)} style={{width:28,height:28,borderRadius:"50%",background:T.red+"33",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.red,fontWeight:900}}>✕</div></div>
    {[
      ["Ziel","Sammle 100 Ehre (⭐) oder finde den legendären Schatz. Erster Spieler gewinnt!"],
      ["Währungen","⭐ Ehre = Siegpunkte (100=Sieg) | 🏆 Ruhm = zum Aufwerten | 💰 Gold = zum Kaufen | 🍺 Rum = Moral"],
      ["Züge","Pro Zug: Erkunden ODER Bewegen ODER Rasten ODER Laden/Hafen/Aufwerten. Bewegen beendet den Zug!"],
      ["Kampf","Runde 1: FERNKAMPF (W6 + Gruppen-FK + Schiffskanonen). Ab Runde 2: NAHKAMPF (W6 + Gruppen-NK). Höherer Wert trifft!"],
      ["NK/FK","NK = ST + Beruf + BESTE Nahkampfwaffe. FK = GE + Beruf + Fernkampfwaffe. Nur die beste Waffe zählt!"],
      ["Slots","Pro Held: 1 Fernkampfwaffe + (1 Zweihand ODER 2 Einhand) + 1 Rüstung + 1 Schild (kein Schild mit Zweihand)"],
      ["Regionen","Jede Region hat ein Level und Min/Max-Ehre. Über dem Max-Level: keine ⭐ mehr!"],
      ["Aufwerten","Nur in Häfen! Stats: 8🏆, Fertigkeiten: 10🏆. Aktive Fertigkeiten im Kampf einsetzbar!"],
      ["K.O.","Held bei 0 HP = K.O. Im Hafen heilen oder neuen Söldner anheuern. Alle K.O. = Rückzug, −25% Gold."],
      ["Verkaufen","Im Laden: ✕ neben Item tippen = Verkauf für halben Preis."],
    ].map(([t,d])=>(<div key={t} style={{marginBottom:8}}>
      <div style={{fontSize:11,color:T.gold,fontFamily:"'Cinzel',serif",marginBottom:1}}>{t}</div>
      <div style={{fontSize:10,color:T.parch,lineHeight:1.4}}>{d}</div></div>))}
  </div></div>):null;

return(<div style={{background:T.bg,minHeight:"100vh",color:T.txt,fontFamily:"'Crimson Text',serif",maxWidth:600,margin:"0 auto"}}>
  <style>{fonts}{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}button:active{transform:scale(0.97);}`}</style>
  {Toast()}{HelpOverlay()}
  {phase==="menu"&&MenuScreen()}
  {phase==="lobby"&&LobbyScreen()}
  {phase==="setup"&&SetupScreen()}
  {phase==="playing"&&PlayScreen()}
  {phase==="event"&&EventScreen()}
  {phase==="combat"&&CombatScreen()}
  {phase==="shop"&&ShopScreen()}
  {phase==="recruit"&&RecruitScreen()}
  {phase==="levelup"&&LevelUpScreen()}
  {phase==="inventory"&&InventoryScreen()}
  {phase==="finished"&&FinishedScreen()}
</div>);
}
