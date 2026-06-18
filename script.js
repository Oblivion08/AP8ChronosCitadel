import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAo4nG5OrgWYMRHwbl2xb4rc9VTMwe8fxY",
  authDomain: "ap8-world-quest.firebaseapp.com",
  projectId: "ap8-world-quest",
  storageBucket: "ap8-world-quest.firebasestorage.app",
  messagingSenderId: "195573811114",
  appId: "1:195573811114:web:41757f872db24203228dd3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let unsubscribeLeaderboard = null;

const SECTIONS = ["8-ABRAHAM","8-ISAAC","8-MOSES","8-EZEKIEL","8-ISAIAH","8-JEREMIAH"];

const GUILDS = [
  { id:"antiqua", emoji:"🏺", name:"Antiqua Guild", desc:"Tagapag-ingat ng Sinaunang Kabihasnan" },
  { id:"navigators", emoji:"⛵", name:"Navigators Guild", desc:"Mga Manlalakbay ng Daigdig" },
  { id:"empires", emoji:"👑", name:"Empires Guild", desc:"Mga Tagapagmana ng mga Imperyo" },
  { id:"guardians", emoji:"⚔️", name:"Guardians Guild", desc:"Mga Tagapagtanggol ng Timeline" },
  { id:"unity", emoji:"🌍", name:"Unity Guild", desc:"Mga Tagapagtaguyod ng Pandaigdigang Pagkakaisa" }
];

function q(question, choices, answer) { return { q: question, c: choices, a: answer }; }

const LESSONS = [
  {term:1,title:"Kampo ng mga Manlalakbay",icon:"🗺️",brief:"Multi-game adventure tungkol sa 7 kontinente, anyong lupa at tubig, Continental Drift, Plate Tectonics, at 5 Tema ng Heograpiya.",code:"MAPA",multiGame:true,questions:[
    q("Ano ang pangunahing gamit ng heograpiya sa kasaysayan?",["Para malaman ang impluwensya ng kapaligiran sa pamumuhay","Para kabisaduhin lang ang mapa","Para pumili ng bakasyon"],0),
    q("Alin ang katangiang pisikal ng daigdig?",["Bundok, ilog, kapatagan, at klima","Pera, presyo, at kita","Batas at eleksyon"],0),
    q("Bakit mahalaga ang klima?",["Nakaaapekto sa hanapbuhay, pananamit, at pagkain","Wala itong epekto","Para lang sa weather forecast"],0)
  ],gameStages:[
    {type:"continents",title:"Stage 1: World Map Challenge",instruction:"I-tap ang lahat ng 7 kontinente. Iwasan ang maling lokasyon.",targets:["Asya","Aprika","Hilagang Amerika","Timog Amerika","Europa","Australia/Oceania","Antarctica"],options:["Asya","Karagatang Pasipiko","Aprika","Hilagang Amerika","Bundok Everest","Timog Amerika","Europa","Australia/Oceania","Antarctica","Ilog Nile"]},
    {type:"match",title:"Stage 2: Anyong Lupa at Anyong Tubig Match",instruction:"Itugma ang termino sa tamang kahulugan.",tasks:[
      {term:"Bundok",answer:"Mataas na anyong lupa",choices:["Mataas na anyong lupa","Umaagos na anyong tubig","Malawak na anyong tubig"]},
      {term:"Kapatagan",answer:"Malawak at patag na lupain",choices:["Malawak at patag na lupain","Lupang napapalibutan ng tubig","Malalim na bahagi ng dagat"]},
      {term:"Ilog",answer:"Umaagos na anyong tubig",choices:["Umaagos na anyong tubig","Pinakamataas na anyong lupa","Tuyong disyerto"]},
      {term:"Karagatan",answer:"Pinakamalawak na anyong tubig",choices:["Pinakamalawak na anyong tubig","Makitid na daanan sa bundok","Mataas na talampas"]},
      {term:"Pulo",answer:"Lupang napapalibutan ng tubig",choices:["Lupang napapalibutan ng tubig","Patag na lupain","Nagyeyelong bundok"]}
    ]},
    {type:"timeline",title:"Stage 3: Continental Drift Timeline",instruction:"Ayusin ang tamang pagkakasunod-sunod ng ideya.",sequence:["Pangaea","Continental Drift Theory","Paggalaw ng mga Kontinente","Kasalukuyang Kontinente"]},
    {type:"simulation",title:"Stage 4: Plate Tectonics Simulator",instruction:"Piliin ang posibleng epekto ng galaw ng plate.",tasks:[
      {term:"Plate Collision / Pagbanggaan",answer:"Mountain Formation",choices:["Mountain Formation","Walang mangyayari","Paglalaho ng kontinente"]},
      {term:"Plate Separation / Paghihiwalay",answer:"Volcano o bagong crust",choices:["Volcano o bagong crust","Pagbuo ng ulap","Pagiging disyerto agad"]},
      {term:"Plate Sliding / Pagkiskis",answer:"Earthquake",choices:["Earthquake","Paglamig ng klima","Pagdami ng ilog"]}
    ]},
    {type:"wheel",title:"Stage 5: 5 Tema ng Heograpiya Wheel",instruction:"Basahin ang sitwasyon at piliin ang tamang tema.",tasks:[
      {term:"Ang Pilipinas ay nasa Timog-Silangang Asya.",answer:"Lokasyon",choices:["Lokasyon","Lugar","Paggalaw"]},
      {term:"Ang Baguio ay malamig at bulubundukin.",answer:"Lugar",choices:["Lugar","Rehiyon","Paggalaw"]},
      {term:"Maraming tao ang nangingisda sa baybayin.",answer:"Interaksyon ng Tao at Kapaligiran",choices:["Interaksyon ng Tao at Kapaligiran","Lokasyon","Rehiyon"]},
      {term:"Ang mga OFW ay lumilipat sa ibang bansa para magtrabaho.",answer:"Paggalaw",choices:["Paggalaw","Lugar","Lokasyon"]},
      {term:"Ang Gitnang Silangan ay rehiyong kilala sa disyerto at langis.",answer:"Rehiyon",choices:["Rehiyon","Lugar","Paggalaw"]}
    ]},
    {type:"boss",title:"Final Boss: Restore the World Map",instruction:"Ibalik ang kaalaman sa mapa bago tuluyang mabura ang Timeline.",tasks:[
      {term:"Ilan ang kontinente ng daigdig?",answer:"7",choices:["7","5","10"]},
      {term:"Sino ang nagpanukala ng Continental Drift Theory?",answer:"Alfred Wegener",choices:["Alfred Wegener","Isaac Newton","Ferdinand Magellan"]},
      {term:"Ano ang tawag sa malaking supercontinent noon?",answer:"Pangaea",choices:["Pangaea","Atlantis","Eurasia"]},
      {term:"Anong paggalaw ng plate ang madalas magdulot ng lindol?",answer:"Sliding / Transform",choices:["Sliding / Transform","Pag-ikot ng mundo","Pag-ulan"]},
      {term:"Aling tema ang tumutukoy sa paglipat ng tao, produkto, at ideya?",answer:"Paggalaw",choices:["Paggalaw","Lugar","Rehiyon"]}
    ]}
  ]},
  {term:1,title:"Lambak ng Kabihasnan",icon:"🏺",brief:"Tuklasin kung bakit umusbong ang kabihasnan malapit sa ilog.",code:"ILOG",questions:[
    q("Bakit umusbong ang kabihasnan malapit sa ilog?",["May tubig, pagkain, at matabang lupa","Malamig palagi","Walang panganib doon"],0),
    q("Alin ang sinaunang kabihasnan sa Asya?",["Indus at China","Rome at Greece lamang","United Nations"],0),
    q("Ano ang naitulong ng agrikultura?",["Nagkaroon ng pagkain at permanenteng pamayanan","Nawala ang tao","Tinanggal ang kalakalan"],0)
  ]},
  {term:1,title:"Tulay ng Pakikipag-ugnayan",icon:"🤝",brief:"Alamin paano nakatulong ang kalakalan at komunikasyon sa pag-unlad.",code:"UGNAYAN",questions:[
    q("Ano ang epekto ng pakikipag-ugnayan?",["Pag-unlad ng kultura at kaalaman","Pagkawala ng lahat ng tradisyon","Pagtigil ng kalakalan"],0),
    q("Halimbawa ng pakikipag-ugnayan?",["Kalakalan at pagpapalitan ng ideya","Pag-iisa sa bahay","Hindi pakikipag-usap"],0),
    q("Bakit mahalaga ang komunikasyon?",["Naipapasa ang kaalaman at teknolohiya","Pinipigilan ang pagbabago","Walang silbi ang kultura"],0)
  ]},
  {term:1,title:"Kaharian ng Lipunan",icon:"🏛️",brief:"Suriin ang gampanin at antas sa sinaunang lipunan.",code:"LIPUNAN",questions:[
    q("Ano ang estrukturang panlipunan?",["Antas at gampanin ng tao sa lipunan","Uri ng klima","Bilang ng bundok"],0),
    q("Sino kadalasang nasa mataas na antas?",["Pinuno, pari, at maharlika","Lahat pare-pareho palagi","Mga turista"],0),
    q("Epekto ng estrukturang panlipunan?",["Nagbigay ng tungkulin at limitasyon","Walang epekto","Nagpawala ng pamahalaan"],0)
  ]},
  {term:1,title:"Templo ng Paniniwala",icon:"🛕",brief:"Tuklasin kung paano hinubog ng relihiyon ang kultura.",code:"KULTURA",questions:[
    q("Paano nakatutulong ang relihiyon sa kultura?",["Hinuhubog ang paniniwala at kaugalian","Tinatanggal ang wika","Ginagawang pare-pareho lahat"],0),
    q("Impluwensya ng paniniwala?",["Paglilibing, sining, at batas","Cellphone","Social media"],0),
    q("Bakit mahalaga ang pagkakakilanlang kultural?",["Ipinapakita ang pinagmulan ng pangkat","Para makalimutan ang tradisyon","Para hindi mag-aral"],0)
  ]},
  {term:1,title:"Gubat ng Kalikasan",icon:"🌿",brief:"Pahalagahan ang ugnayan ng tao at kapaligiran.",code:"KALIKASAN",questions:[
    q("Bakit mahalaga ang interaksiyon ng tao at kapaligiran?",["Nakaaapekto sa kabuhayan at pamumuhay","Walang koneksyon","Mapa lang ito"],0),
    q("Mabuting pangangalaga sa kapaligiran?",["Wastong paggamit ng likas na yaman","Walang pakialam sa basura","Pagsira sa kagubatan"],0),
    q("Kapag nasira ang kapaligiran?",["Maapektuhan ang kalusugan at kabuhayan","Mas aayos ang lahat","Walang epekto"],0)
  ]},
  {term:1,title:"Ruta ng mga Mangangalakal",icon:"📜",brief:"Balikan ang mahahalagang pangyayari bago ang paggalugad.",code:"RUTA",questions:[
    q("Ano ang nagtulak sa Europeo na maghanap ng ruta?",["Kalakalan, kayamanan, at bagong lupain","Palaro lamang","Ayaw sa dagat"],0),
    q("Nakatulong sa paglalayag?",["Mapa, compass, at barko","Telebisyon","Internet"],0),
    q("Ano ang eksplorasyon?",["Paggalugad ng bagong lupain at ruta","Pagtatago sa bahay","Pagbili sa palengke"],0)
  ]},
  {term:1,title:"Karagatan ng Paggalugad",icon:"⛵",brief:"Suriin ang paggalugad at kolonyalismo ng mga Europeo.",code:"LAYAG",questions:[
    q("Bunga ng paggalugad ng Europeo?",["Kolonyalismo at pagbabago sa bagong lupain","Pagtigil ng kalakalan","Pagkawala ng lahat ng bansa"],0),
    q("Layunin ng manlalakbay na Europeo?",["Gold, God, and Glory","Sleep, Food, and Games","Rain, Wind, and Fire"],0),
    q("Ano ang kolonyalismo?",["Pananakop at pagkontrol ng bansa sa ibang lupain","Pag-aaral ng wika","Simpleng pagbisita"],0)
  ]},
  {term:1,title:"Lupain ng Kolonyalismo",icon:"🌎",brief:"Suriin ang epekto ng kolonyalismo sa mga bagong lupain.",code:"KOLONYA",questions:[
    q("Epekto ng kolonyalismo?",["Pagbabago sa politika, ekonomiya, at kultura","Walang epekto","Lahat agad lumaya"],0),
    q("Epekto sa maraming katutubo sa America?",["Pagkawala ng lupa, sakit, at sapilitang paggawa","Mas ligtas agad","Walang pagbabago"],0),
    q("Bakit suriin ang kolonyalismo?",["Para maunawaan ang epekto nito ngayon","Para kalimutan ang kasaysayan","Para hindi magtanong"],0)
  ]},
  {term:1,title:"Bantayan ng mga Asyano",icon:"🧭",brief:"Tuklasin ang tugon ng mga Asyano sa kolonyalismo.",code:"ASYA",questions:[
    q("Tugon ng mga Asyano sa kolonyalismo?",["Pakikibagay, paglaban, o pakikipagkalakalan","Pagtulog lamang","Paglimot sa lahat"],0),
    q("Bakit may lumaban sa kolonyalismo?",["Ipagtanggol ang kalayaan at kabuhayan","Gusto ng exam","Ayaw sa mapa"],0),
    q("Ano ang ipinapakita ng pagtugon ng Asyano?",["May kakayahang magpasya at lumaban","Walang kultura","Hindi naapektuhan"],0)
  ]},
  {term:2,title:"Imperyo ng Mananakop",icon:"👑",brief:"Harapin ang hamon ng imperyalismo sa Asya at Africa.",code:"IMPERYO",questions:[
    q("Ano ang imperyalismo?",["Pagpapalawak ng kapangyarihan sa ibang bansa","Simpleng paglalakbay","Pag-aaral ng mapa"],0),
    q("Bakit sinakop ang Asya at Africa?",["Hilaw na materyales, pamilihan, kapangyarihan","Para magbakasyon","Para magtayo lang ng paaralan"],0),
    q("Epekto ng imperyalismo?",["Pagbabago sa ekonomiya, politika, at kultura","Walang epekto","Naging pantay agad"],0)
  ]},
  {term:2,title:"Tore ng Kaliwanagan",icon:"💡",brief:"Tuklasin ang ideya ng kalayaan, karapatan, at nasyonalismo.",code:"LIWANAG",questions:[
    q("Kaisipang kaugnay ng Enlightenment?",["Karapatan at kalayaan","Pagpapasailalim lagi sa hari","Pagtanggi sa pag-iisip"],0),
    q("Ano ang nasyonalismo?",["Pagmamahal at katapatan sa bansa","Paglimot sa bayan","Pag-iwas sa responsibilidad"],0),
    q("Ambag ng Rebolusyong Amerikano?",["Pakikibaka para sa kalayaan","Tinanggal ang karapatan","Walang kaugnayan"],0)
  ]},
  {term:2,title:"Plaza ng Rebolusyon",icon:"🇫🇷",brief:"Saksihan ang Rebolusyong Pranses at pag-usbong ng bansang-estado.",code:"LAYA",questions:[
    q("Prinsipyo ng Rebolusyong Pranses?",["Liberty, Equality, Fraternity","Gold, Glory, God","Land, Sea, Air"],0),
    q("Sanhi ng Rebolusyong Pranses?",["Hindi pagkakapantay-pantay","Sobrang kapayapaan","Internet"],0),
    q("Ano ang bansang-estado?",["Bansang may sariling pamahalaan at pagkakakilanlan","Bahay ng hari","Lugar na walang mamamayan"],0)
  ]},
  {term:2,title:"Kuta ng Kalayaan",icon:"✊",brief:"Suriin ang tugon ng mga bansa sa imperyalismo.",code:"LABAN",questions:[
    q("Isang tugon sa imperyalismo?",["Nasyonalismo at paglaban","Pagsuko lagi","Pagbawal sa edukasyon"],0),
    q("Bakit mahalaga ang kilusang makabayan?",["Hangaring lumaya at magkaisa","Pinipigilan kalayaan","Para sa laro lang"],0),
    q("Paraan ng paglaban?",["Pag-aalsa, reporma, at diplomasiya","Pananahimik palagi","Pag-iwas sa kasaysayan"],0)
  ]},
  {term:2,title:"Larangan ng Unang Digmaan",icon:"⚔️",brief:"Suriin ang sanhi at epekto ng Unang Digmaang Pandaigdig.",code:"DIGMAAN1",questions:[
    q("Sanhi ng Unang Digmaang Pandaigdig?",["Militarismo at alyansa","Pagdami ng paaralan","Internet"],0),
    q("Ano ang alyansa?",["Kasunduan ng mga bansa na magtulungan","Uri ng pagkain","Paraan ng pagsulat"],0),
    q("Epekto ng Unang Digmaan?",["Pagkamatay, pagkasira, pagbabago ng hangganan","Mas simple ang mundo","Walang naapektuhan"],0)
  ]},
  {term:2,title:"Lambak ng Pagbangon",icon:"🕊️",brief:"Unawain ang tugon ng bansa pagkatapos ng digmaan.",code:"BANGON",questions:[
    q("Suliranin pagkatapos ng digmaan?",["Pagkasira ng ekonomiya at lipunan","Walang problema","Walang pagbabago"],0),
    q("Bakit nahirapan ang bansa pagkatapos ng digmaan?",["Maraming nasira at naapektuhan","Sobra ang yaman","Walang aayusin"],0),
    q("Tugon pagkatapos ng digmaan?",["Pagbangon, kasunduan, reporma","Bagong digmaan agad","Iwas sa problema"],0)
  ]},
  {term:2,title:"Tore ng Totalitaryanismo",icon:"🛡️",brief:"Suriin kung bakit banta sa demokrasya ang totalitaryanismo.",code:"BABALA",questions:[
    q("Ano ang totalitaryanismo?",["Kontrolado ng lider o partido ang halos lahat","Ganap na kalayaan","Sistema ng palitan"],0),
    q("Bakit banta sa demokrasya?",["Nililimitahan ang karapatan at kalayaan","Pinapalawak ang pagboto","Walang epekto"],0),
    q("Palatandaan ng totalitaryanismo?",["Kontrol sa media, oposisyon, at mamamayan","Malayang pamamahayag","Pantay na partisipasyon"],0)
  ]},
  {term:2,title:"Larangan ng Ikalawang Digmaang Pandaigdig",icon:"🌍",brief:"Tayahin ang sanhi at epekto ng Ikalawang Digmaang Pandaigdig.",code:"DIGMAAN2",questions:[
    q("Malaking epekto ng Ikalawang Digmaan?",["Malawakang pagkasira at pagbabago sa kaayusan","Walang naapektuhan","Nawala lahat ng bansa"],0),
    q("Sanhi ng Ikalawang Digmaan?",["Totalitaryanismo at agresyon ng ilang bansa","Pagdami ng paaralan","Social media"],0),
    q("Itinatag para sa kapayapaan pagkatapos ng digmaan?",["United Nations","Roman Empire","Silk Road"],0)
  ]},
  {term:3,title:"Yelong Kaharian ng Cold War",icon:"❄️",brief:"Ipaliwanag ang pinagmulan at tunggalian ng Cold War.",code:"COLDWAR",questions:[
    q("Ano ang Cold War?",["Tensiyon na hindi direktang digmaan","Digmaan gamit yelo","Labanan ng panahon"],0),
    q("Pangunahing magkatunggali?",["United States at Soviet Union","Egypt at Mesopotamia","Greece at Rome"],0),
    q("Ideolohiyang nagbanggaan?",["Kapitalismo at komunismo","Agrikultura at pangingisda","Sining at musika"],0)
  ]},
  {term:3,title:"Alyansa ng Asya at Africa",icon:"🌏",brief:"Suriin ang epekto ng Cold War sa Asya at Africa.",code:"ALYANSA",questions:[
    q("Epekto ng Cold War sa ibang rehiyon?",["Proxy wars at alyansa","Walang politika","Nawala ekonomiya"],0),
    q("Ano ang proxy war?",["Digmaang sinusuportahan ng malalakas na bansa","Digmaan sa computer","Paligsahan sa paaralan"],0),
    q("Bakit mahalaga ito?",["Naapektuhan ang politika at kalayaan ng maraming bansa","Walang epekto","Para sa mapa lang"],0)
  ]},
  {term:3,title:"Pader ng Berlin",icon:"🧱",brief:"Tayahin ang kalagayan ng daigdig matapos ang Cold War.",code:"BERLIN",questions:[
    q("Simbolikong pangyayari sa pagtatapos ng Cold War?",["Pagbagsak ng Berlin Wall","Pagkatuklas ng apoy","Paglalayag ni Magellan"],0),
    q("Epekto ng pagtatapos ng Cold War?",["Pagbabago sa pandaigdigang kapangyarihan","Pagbalik ng sinaunang kabihasnan","Pagkawala ng bansa"],0),
    q("Ipinakita ng pagwawakas ng Cold War?",["Nagbabago ang ugnayan at kapangyarihan","Hindi nagbabago ang kasaysayan","Walang saysay diplomasya"],0)
  ]},
  {term:3,title:"Hardin ng Demokrasya",icon:"🗳️",brief:"Pahalagahan ang papel ng kilusang demokratiko.",code:"DEMOKRASYA",questions:[
    q("Layunin ng demokratikong kilusan?",["Karapatan at partisipasyon ng mamamayan","Tanggalin boses ng tao","Kontrolin lahat ng ideya"],0),
    q("Demokratikong pagpapahalaga?",["Kalayaan, pagkakapantay-pantay, pananagutan","Takot at pananahimik","Pang-aabuso"],0),
    q("Bakit mahalaga ang partisipasyon?",["Napapalakas ang demokrasya","Pinahihina karapatan","Walang epekto"],0)
  ]},
  {term:3,title:"Bulwagan ng United Nations",icon:"🤝",brief:"Kilalanin ang United Nations at ang Pilipinas bilang kasapi.",code:"UN",questions:[
    q("Layunin ng United Nations?",["Kapayapaan at kooperasyong pandaigdig","Pagsisimula ng digmaan","Pagpapalawak ng kolonya"],0),
    q("Papel ng Pilipinas sa UN?",["Makilahok sa pandaigdigang kooperasyon","Iwasan lahat ng bansa","Maging kolonya muli"],0),
    q("Isyung tinutugunan ng UN?",["Kapayapaan, karapatang pantao, kaunlaran","Pagpili ng hari","Pagsakop ng lupain"],0)
  ]},
  {term:3,title:"Siyudad ng mga Isyung Panlipunan",icon:"🏙️",brief:"Suriin ang mga isyung panlipunang kinakaharap ng daigdig.",code:"ISYU",questions:[
    q("Halimbawa ng isyung panlipunan?",["Kahirapan at diskriminasyon","Latitude at longitude","Uri ng bato"],0),
    q("Bakit kailangang suriin ang isyu?",["Upang makabuo ng solusyon","Para sisihin iba","Para iwasan responsibilidad"],0),
    q("Mabuting tugon sa isyu?",["Pakikiisa, pag-unawa, pagkilos","Panghuhusga","Pagwawalang-bahala"],0)
  ]},
  {term:3,title:"Bundok ng Pandaigdigang Hamon",icon:"🌱",brief:"Suriin ang pampolitika, pangkabuhayan, at pangkalikasang isyu.",code:"DAIGDIG",questions:[
    q("Halimbawa ng pangkalikasang isyu?",["Climate change","Cuneiform","Feudalism"],0),
    q("Halimbawa ng pangkabuhayang isyu?",["Kahirapan at unemployment","Berlin Wall","Pyramid building"],0),
    q("Dapat gawin sa pandaigdigang isyu?",["Pag-aralan, makipagtulungan, kumilos","Balewalain","Hintayin ang iba"],0)
  ]},
  {term:3,title:"Final Boss: Korona ng Mapanagutang Mamamayan",icon:"👑",brief:"Talunin ang Tagabura ng Kasaysayan at ibalik ang timeline.",code:"MASTER",boss:true,questions:[
    q("Katangian ng mapanagutang mamamayan?",["May malasakit, kaalaman, at pakikilahok","Walang pakialam","Sarili lang iniisip"],0),
    q("Paano maging global citizen?",["Respeto sa karapatan, kultura, at kapaligiran","Makasarili","Iwas sa usapin"],0),
    q("Aral ng kasaysayan?",["Matuto sa nakaraan para sa mabuting pasya","Ulitin mali","Huwag makialam"],0),
    q("Bakit mahalaga ang kooperasyon?",["Maraming suliranin ang kailangan ng sama-samang tugon","Para mag-away","Para mawala kultura"],0),
    q("Final mission ng AP8 World Quest?",["Gamitin ang aral ng kasaysayan sa responsableng pagkilos","Kalimutan lesson","Manalo lamang sa laro"],0)
  ]}
];

const ACHIEVEMENTS = [
  {id:"first", name:"🗺️ Unang Hakbang", need:1},
  {id:"mapper", name:"🧭 Master Cartographer", need:5},
  {id:"civilization", name:"🏺 Kabihasnang Dalubhasa", need:10},
  {id:"warrior", name:"⚔️ History Warrior", need:18},
  {id:"global", name:"🌍 Global Citizen", need:25},
  {id:"master", name:"👑 Tagapagbalik ng Timeline", need:26}
];

const SAVE_PREFIX = "AP8_V2_";
let currentSection = localStorage.getItem("ap8_v2_section") || "";
let currentGuild = localStorage.getItem("ap8_v2_guild") || "";
let state = blankState();
let currentMission = null;
let currentQuestion = 0;
let currentStage = 0;
let stageProgress = null;
let currentShuffled = null;
let acceptingAnswer = false;
let score = 0;
let bossHp = 0;
let audioCtx = null;
let musicOn = false;
let musicTimer = null;

function blankState(section=currentSection, guild=currentGuild) {
  return { section, guild, unlocked:[0], completed:[], coded:[], achievements:[], xp:0, race:[] };
}
function saveKey(section=currentSection, guild=currentGuild) {
  return SAVE_PREFIX + section + "_" + guild;
}
function loadState() {
  if (!currentSection || !currentGuild) {
    state = blankState();
    return;
  }
  state = JSON.parse(localStorage.getItem(saveKey()) || "null") || blankState(currentSection, currentGuild);
}
function saveState() {
  if (!currentSection || !currentGuild) return;
  state.section = currentSection;
  state.guild = currentGuild;
  localStorage.setItem("ap8_v2_section", currentSection);
  localStorage.setItem("ap8_v2_guild", currentGuild);
  localStorage.setItem(saveKey(), JSON.stringify(state));
}
function getGuild(id) { return GUILDS.find(g => g.id === id); }
function guildDisplay(id=currentGuild) {
  const g = getGuild(id);
  return g ? `${g.emoji} ${g.name}` : "Wala pa";
}
function getRank(xp) {
  if (xp >= 2600) return "👑 Tagapagbalik ng Timeline";
  if (xp >= 1800) return "🛡️ Tagapangalaga ng Timeline";
  if (xp >= 1000) return "🏆 Batang Historyador";
  if (xp >= 400) return "🧭 Batikang Manlalakbay";
  return "🌱 Baguhang Manlalakbay";
}

function enterGame() {

  sounds.chronos.pause();
  sounds.chronos.currentTime = 0;

  startAdventureSound();

  document.getElementById("introScreen")
    .classList.add("hidden");

  document.getElementById("gameApp")
    .classList.remove("hidden");

  showTab("hub");

  renderAll();

  listenSectionLeaderboard();
}

function selectSection() {
  currentSection = document.getElementById("sectionSelect").value;

  localStorage.setItem("ap8_v2_section", currentSection);

  loadState();
  renderAll();

  listenSectionLeaderboard();
}
function selectGuild() {
  currentGuild = document.getElementById("guildSelect").value;

  localStorage.setItem("ap8_v2_guild", currentGuild);

  loadState();
  renderAll();

  saveGuildOnline();
  if (currentGuild) {
    const g = getGuild(currentGuild);
    toast(`${g.emoji} ${g.name}: ${g.desc}`);
    playSound("unlock");
  }
}
function showTab(id) {
  const dialog = document.getElementById("missionDialog");
  if (dialog && dialog.open) dialog.close();

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  loadState();
  checkAchievements();
  document.getElementById("sectionSelect").value = currentSection || "";
  document.getElementById("guildSelect").value = currentGuild || "";
  document.getElementById("profileTitle").textContent = currentGuild ? guildDisplay() : "Walang napiling Guild";
  document.getElementById("profileMeta").textContent = currentSection ? `Section: ${currentSection}` : "Pumili muna ng section.";
  document.getElementById("profileXp").textContent = state.xp || 0;
  document.getElementById("profileRank").textContent = getRank(state.xp || 0);
  renderMapNodes();
  renderTokens();
  renderLeaderboards();
  renderMissions();
  renderPassport();
  saveState();
}

function nodePosition(index) {
  const positions = [
    [12,86],[22,78],[31,66],[40,56],[49,50],[58,43],[66,34],[75,29],[83,38],[90,28],
    [18,72],[27,63],[36,54],[45,46],[54,39],[63,32],[72,23],[82,18],
    [26,30],[36,22],[46,26],[56,20],[65,26],[73,38],[82,48],[90,12]
  ];
  return positions[index] || [50,50];
}
function activeIndexFor(section, guild) {
  const s = getGuildState(section, guild);
  for (let i=0; i<LESSONS.length; i++) {
    if ((s.unlocked || [0]).includes(i) && !(s.completed || []).includes(i)) return i;
  }
  return Math.max(0, (s.completed || []).length - 1);
}
function getGuildState(section, guild) {
  if (!section || !guild) return blankState(section,guild);
  return JSON.parse(localStorage.getItem(SAVE_PREFIX + section + "_" + guild) || "null") || blankState(section,guild);
}
function renderMapNodes() {
  const box = document.getElementById("missionNodes");
  box.innerHTML = "";
  LESSONS.forEach((lesson, i) => {
    const pos = nodePosition(i);
    const node = document.createElement("div");
    node.className = "mission-node " + (i < 10 ? "node-t1" : i < 18 ? "node-t2" : i < 25 ? "node-t3" : "node-final");
    node.style.left = `calc(${pos[0]}% - 21px)`;
    node.style.top = `calc(${pos[1]}% - 21px)`;
    node.textContent = i + 1;
    node.title = `${i+1}. ${lesson.title}`;
    box.appendChild(node);
  });
}
function renderTokens() {
  const box = document.getElementById("guildTokens");
  const activeIds = new Set();

  GUILDS.forEach((g, idx) => {
    const active = activeIndexFor(currentSection, g.id);
    const pos = nodePosition(active);
    const id = "token_" + g.id;
    activeIds.add(id);

    let token = document.getElementById(id);
    if (!token) {
      token = document.createElement("div");
      token.id = id;
      token.className = "guild-token";
      token.innerHTML = `${g.emoji}<small>${g.name}</small>`;
      box.appendChild(token);
    }

    token.style.left = `calc(${pos[0]}% - ${25 - idx*7}px)`;
    token.style.top = `calc(${pos[1]}% - ${25 - idx*5}px)`;
    token.title = `${g.name}: Mission ${active+1}`;
  });

  [...box.children].forEach(child => {
    if (!activeIds.has(child.id)) child.remove();
  });
}

function renderLeaderboards() {
  const rows = GUILDS.map(g => {
    const s = getGuildState(currentSection, g.id);
    return { guild:g, xp:s.xp || 0, completed:(s.completed || []).length };
  }).sort((a,b) => b.xp - a.xp || b.completed - a.completed);

  const medal = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  const html = rows.map((r,i) => `
    <div class="rank-row">
      <div class="rank-left"><span>${medal[i]}</span><span>${r.guild.emoji} ${r.guild.name}<br><small>${r.completed}/26 missions</small></span></div>
      <div class="rank-xp">${r.xp} XP</div>
    </div>
  `).join("");

  document.getElementById("leaderboardLabel").textContent = currentSection ? `Section: ${currentSection}` : "Pumili muna ng section.";
  document.getElementById("hubLeaderboard").innerHTML = html || "<p>Wala pang score.</p>";
  document.getElementById("fullLeaderboard").innerHTML = html || "<p>Wala pang score.</p>";
}

function renderMissions() {
  [1,2,3].forEach(term => document.getElementById("term"+term).innerHTML = "");
  LESSONS.forEach((lesson, i) => {
    const open = (state.unlocked || [0]).includes(i);
    const done = (state.completed || []).includes(i);
    const card = document.createElement("div");
    card.className = "mission-card " + (done ? "completed" : open ? "unlocked" : "locked");
    card.innerHTML = `
      <span class="kingdom">${lesson.icon}</span>
      <span class="badge">${done ? "✅ Tapos" : open ? "🔓 Bukas" : "🔒 Sarado"}</span>
      <h3>${i+1}. ${lesson.title}</h3>
      <p>${lesson.brief}</p>
      <button ${open ? "" : "disabled"} onclick="openMission(${i})">${open ? "Simulan" : "Sarado pa"}</button>
    `;
    document.getElementById("term"+lesson.term).appendChild(card);
  });
}

function renderPassport() {
  const box = document.getElementById("passportStamps");
  box.innerHTML = "";
  (state.completed || []).forEach(i => {
    const l = LESSONS[i];
    const d = document.createElement("div");
    d.className = "stamp";
    d.innerHTML = `<strong>${l.icon}</strong><small>${l.title}</small>`;
    box.appendChild(d);
  });
  if (!(state.completed || []).length) box.innerHTML = "<p>Wala pang stamp. Tapusin ang unang mission.</p>";

  const ach = document.getElementById("achievements");
  ach.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const earned = (state.achievements || []).includes(a.id);
    const d = document.createElement("div");
    d.className = "achievement " + (earned ? "" : "locked");
    d.innerHTML = earned ? `<strong>${a.name}</strong><small>Nakuha na</small>` : `<strong>🔒 Nakatago</strong><small>${a.need} missions</small>`;
    ach.appendChild(d);
  });
}
function checkAchievements() {
  if (!state.achievements) state.achievements = [];
  ACHIEVEMENTS.forEach(a => {
    if ((state.completed || []).length >= a.need && !state.achievements.includes(a.id)) {
      state.achievements.push(a.id);
      toast("🏆 Achievement unlocked: " + a.name);
      playSound("victory");
    }
  });
}
async function saveGuildOnline() {
  if (!currentSection || !currentGuild) return;
  try {
    const guildRef = doc(db, "sections", currentSection, "guilds", currentGuild);
    await setDoc(guildRef, {
      section: currentSection,
      guild: currentGuild,
      guildName: guildDisplay(currentGuild),
      xp: state.xp || 0,
      missions: (state.completed || []).length,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Firebase save error:", error);
    toast("Hindi naka-save online. Check internet o Firebase Rules.");
  }
}

function listenSectionLeaderboard() {
  if (!currentSection) return;
  if (unsubscribeLeaderboard) unsubscribeLeaderboard();
  const guildsRef = collection(db, "sections", currentSection, "guilds");
  unsubscribeLeaderboard = onSnapshot(guildsRef, snapshot => {
    const onlineRows = [];
    snapshot.forEach(docSnap => onlineRows.push(docSnap.data()));
    onlineRows.sort((a,b) => (b.xp || 0) - (a.xp || 0) || (b.missions || 0) - (a.missions || 0));
    renderOnlineLeaderboard(onlineRows);
  }, error => {
    console.error("Firebase leaderboard error:", error);
    toast("Hindi mabasa ang online leaderboard.");
  });
}

function renderOnlineLeaderboard(rows) {
  const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const html = rows.map((r,i) => `
    <div class="rank-row">
      <div class="rank-left">
        <span>${medal[i] || ""}</span>
        <span>${r.guildName || r.guild}<br><small>${r.missions || 0}/26 missions</small></span>
      </div>
      <div class="rank-xp">${r.xp || 0} XP</div>
    </div>
  `).join("");
  document.getElementById("hubLeaderboard").innerHTML = html || "<p>Wala pang online data.</p>";
  document.getElementById("fullLeaderboard").innerHTML = html || "<p>Wala pang online data.</p>";
}

async function awardFirebaseRaceBonus(missionIndex) {
  if (!currentSection || !currentGuild) return { medal:"", label:"No Bonus", xp:0, place:-1 };

  const raceRef = doc(db, "sections", currentSection, "missionRace", "mission_" + missionIndex);

  return await runTransaction(db, async (transaction) => {
    const raceSnap = await transaction.get(raceRef);
    let finishers = [];
    if (raceSnap.exists()) finishers = raceSnap.data().finishers || [];

    if (!finishers.includes(currentGuild)) {
      finishers.push(currentGuild);
      transaction.set(raceRef, { missionIndex, finishers, updatedAt: serverTimestamp() }, { merge:true });
    }

    const place = finishers.indexOf(currentGuild);
    const rewards = [
      { medal:"🥇", label:"1st Place", xp:50, place:1 },
      { medal:"🥈", label:"2nd Place", xp:30, place:2 },
      { medal:"🥉", label:"3rd Place", xp:20, place:3 },
      { medal:"4️⃣", label:"4th Place", xp:10, place:4 },
      { medal:"5️⃣", label:"5th Place", xp:5, place:5 }
    ];
    return rewards[place] || { medal:"", label:"No Bonus", xp:0, place:place+1 };
  });
}

function openMission(index) {
  if (!currentSection) return toast("Piliin muna ang section.");
  if (!currentGuild) return toast("Piliin muna ang guild.");
  if (!(state.unlocked || [0]).includes(index)) return toast("Sarado pa ang mission.");
  currentMission = index;
  currentQuestion = 0;
  currentStage = 0;
  stageProgress = null;
  currentShuffled = null;
  acceptingAnswer = false;
  score = 0;
  bossHp = LESSONS[index].boss ? 5 : 0;

  const lesson = LESSONS[index];
  document.getElementById("missionTitle").textContent = `${lesson.icon} ${lesson.title}`;
  document.getElementById("missionBrief").textContent = lesson.brief;
  document.getElementById("resultText").textContent = "";
  document.getElementById("bossIntro").classList.toggle("hidden", !lesson.boss);
  if (lesson.boss) {
    document.getElementById("bossIntro").innerHTML = `
      <strong>⚠️ BABALA: Final Boss</strong>
      <p>Haharapin ninyo ang Tagabura ng Kasaysayan. Tamang sagot = bawas buhay ng kalaban.</p>
      <div class="boss-hp">${"❤️".repeat(bossHp)}</div>
    `;
    playSound("boss");
  } else {
    playSound("unlock");
  }
  if (lesson.multiGame) {
    showGameStage();
  } else {
    showQuestion();
  }
  document.getElementById("missionDialog").showModal();
}


function stageTotalItems(stage) {
  if (!stage) return 0;
  if (stage.targets) return stage.targets.length;
  if (stage.tasks) return stage.tasks.length;
  if (stage.sequence) return stage.sequence.length;
  return 1;
}
function totalGameItems(lesson) {
  return (lesson.gameStages || []).reduce((sum, stage) => sum + stageTotalItems(stage), 0);
}
function pillButton(label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.onclick = onClick;
  btn.style.margin = "6px";
  btn.style.width = "calc(50% - 12px)";
  btn.style.textAlign = "center";
  return btn;
}
function showGameStage() {
  const lesson = LESSONS[currentMission];
  const stage = lesson.gameStages[currentStage];
  const qBox = document.getElementById("questionText");
  const choices = document.getElementById("choices");
  const result = document.getElementById("resultText");

  if (!stage) return finishMission();

  acceptingAnswer = true;
  result.textContent = "";
  choices.innerHTML = "";
  qBox.innerHTML = `
    <div class="boss-intro" style="border-color:#facc15;background:rgba(250,204,21,.08)">
      <strong>🎮 ${stage.title}</strong><br>
      <small>Stage ${currentStage + 1}/${lesson.gameStages.length}</small>
      <p>${stage.instruction}</p>
      <p><strong>Score:</strong> ${score}/${totalGameItems(lesson)}</p>
    </div>
  `;

  if (stage.type === "continents") return renderContinentsStage(stage, choices, result);
  if (stage.type === "timeline") return renderTimelineStage(stage, choices, result);
  return renderTaskStage(stage, choices, result);
}
function renderContinentsStage(stage, choices, result) {
  stageProgress = stageProgress || { selected: [] };
  choices.innerHTML = "";
  stage.options.forEach(option => {
    const btn = pillButton(stageProgress.selected.includes(option) ? `✅ ${option}` : option, () => {
      if (!acceptingAnswer) return;
      if (stage.targets.includes(option)) {
        if (!stageProgress.selected.includes(option)) {
          stageProgress.selected.push(option);
          score++;
          playSound("correct");
          result.innerHTML = `<span class="success">✅ Tama! ${stageProgress.selected.length}/${stage.targets.length} kontinente.</span>`;
        }
        if (stageProgress.selected.length >= stage.targets.length) return completeStage();
      } else {
        result.innerHTML = `<span class="warning">❌ Hindi kontinente iyan. Piliin ang 7 kontinente lamang.</span>`;
        playSound("wrong");
      }
      renderContinentsStage(stage, choices, result);
    });
    if (stageProgress.selected.includes(option)) btn.disabled = true;
    choices.appendChild(btn);
  });
}
function renderTaskStage(stage, choices, result) {
  stageProgress = stageProgress || { item: 0 };
  const task = stage.tasks[stageProgress.item];
  if (!task) return completeStage();
  const icon = stage.type === "match" ? "🧩" : stage.type === "simulation" ? "🌋" : stage.type === "wheel" ? "🎡" : "👾";
  document.getElementById("questionText").innerHTML += `<h3>${icon} ${task.term}</h3>`;
  choices.innerHTML = "";
  shuffleArray(task.choices).forEach(choice => {
    choices.appendChild(pillButton(choice, () => {
      if (!acceptingAnswer) return;
      if (choice === task.answer) {
        score++;
        stageProgress.item++;
        result.innerHTML = `<span class="success">✅ Tama!</span>`;
        playSound("correct");
        setTimeout(() => {
          result.textContent = "";
          if (stageProgress.item >= stage.tasks.length) completeStage();
          else showGameStage();
        }, 650);
      } else {
        result.innerHTML = `<span class="warning">❌ Try again. Hanapin ang mas tamang sagot.</span>`;
        playSound("wrong");
      }
    }));
  });
}
function renderTimelineStage(stage, choices, result) {
  stageProgress = stageProgress || { next: 0, picked: [], pool: shuffleArray(stage.sequence) };
  const needed = stage.sequence[stageProgress.next];
  document.getElementById("questionText").innerHTML += `
    <h3>⏳ Piliin ang susunod: ${stageProgress.next + 1}/${stage.sequence.length}</h3>
    <p><strong>Nabuo:</strong> ${stageProgress.picked.join(" → ") || "Wala pa"}</p>
  `;
  choices.innerHTML = "";
  stageProgress.pool.forEach(item => {
    choices.appendChild(pillButton(item, () => {
      if (!acceptingAnswer) return;
      if (item === needed) {
        score++;
        stageProgress.picked.push(item);
        stageProgress.next++;
        stageProgress.pool = stageProgress.pool.filter(x => x !== item);
        result.innerHTML = `<span class="success">✅ Tama ang pagkakasunod!</span>`;
        playSound("correct");
        setTimeout(() => {
          result.textContent = "";
          if (stageProgress.next >= stage.sequence.length) completeStage();
          else showGameStage();
        }, 650);
      } else {
        result.innerHTML = `<span class="warning">❌ Hindi pa iyan ang susunod. Balikan ang simula: Pangaea muna.</span>`;
        playSound("wrong");
      }
    }));
  });
}
function completeStage() {
  acceptingAnswer = false;
  stageProgress = null;
  const lesson = LESSONS[currentMission];
  const result = document.getElementById("resultText");
  const choices = document.getElementById("choices");
  currentStage++;
  if (currentStage >= lesson.gameStages.length) return finishMission();
  result.innerHTML = `<span class="success">🏆 Stage Complete! +Progress unlocked.</span>`;
  choices.innerHTML = `<button onclick="nextGameStage()">➡️ Next Stage</button>`;
}
function nextGameStage() {
  showGameStage();
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i=copy.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function shuffleQuestion(question) {
  const correct = question.c[question.a];
  const choices = shuffleArray(question.c);
  return { q:question.q, c:choices, a:choices.indexOf(correct) };
}
function showQuestion() {
  const lesson = LESSONS[currentMission];
  const original = lesson.questions[currentQuestion];
  if (!original) return finishMission();
  currentShuffled = shuffleQuestion(original);
  acceptingAnswer = true;
  const boss = lesson.boss ? `<div class="boss-intro"><strong>👾 Tagabura ng Kasaysayan</strong><div class="boss-hp">${"❤️".repeat(Math.max(0,bossHp))}</div></div>` : "";
  document.getElementById("questionText").innerHTML = `${boss}<strong>Tanong ${currentQuestion+1} sa ${lesson.questions.length}:</strong><br>${currentShuffled.q}`;
  const choices = document.getElementById("choices");
  choices.innerHTML = "";
  currentShuffled.c.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => answerQuestion(i);
    choices.appendChild(btn);
  });
}
function answerQuestion(choiceIndex) {
  if (!acceptingAnswer || !currentShuffled) return;
  acceptingAnswer = false;
  document.querySelectorAll("#choices button").forEach(b => b.disabled = true);
  const lesson = LESSONS[currentMission];
  const result = document.getElementById("resultText");
  if (choiceIndex === currentShuffled.a) {
    score++;
    if (lesson.boss) bossHp--;
    result.innerHTML = `<span class="success">✅ Tama!</span>`;
    playSound("correct");
  } else {
    result.innerHTML = `<span class="warning">❌ Mali. Tamang sagot: ${currentShuffled.c[currentShuffled.a]}</span>`;
    playSound("wrong");
  }
  currentQuestion++;
  currentShuffled = null;
  if (currentQuestion < lesson.questions.length && (!lesson.boss || bossHp > 0)) {
    setTimeout(() => { result.textContent = ""; showQuestion(); }, 850);
  } else {
    setTimeout(finishMission, 850);
  }
}

async function finishMission() {
  const lesson = LESSONS[currentMission];
  const pass = lesson.multiGame ? score >= totalGameItems(lesson) : (lesson.boss ? bossHp <= 0 : score >= 2);
  const result = document.getElementById("resultText");
  document.getElementById("choices").innerHTML = "";

  if (!pass) {
    result.innerHTML = `<span class="warning">Iskor: ${score}/${lesson.multiGame ? totalGameItems(lesson) : lesson.questions.length}. Subukan muli.</span>`;
    return;
  }

  let bonus = 0;
  let placeText = "";
  if (!(state.completed || []).includes(currentMission)) {
    state.completed.push(currentMission);
    state.xp += lesson.boss ? 300 : 100;
    bonus = await awardFirebaseRaceBonus(currentMission);
    state.xp += bonus.xp;
    placeText = bonus.xp > 0 ? `<br>${bonus.medal} Firebase Race Bonus: ${bonus.label} +${bonus.xp} XP` : "";
  }

  result.innerHTML = `
    <span class="success">
      ✅ Misyon Tapos! Iskor: ${score}/${lesson.multiGame ? totalGameItems(lesson) : lesson.questions.length}<br>
      📘 May passport stamp na ang guild.${placeText}<br><br>
      🔑 Lihim na Code: <strong>${lesson.code}</strong><br>
      I-type ang code sa Missions tab para mabuksan ang susunod.
    </span>
  `;
  playSound("victory");
  saveState();
  renderAll();
  saveGuildOnline();
  listenSectionLeaderboard();
}

function awardRaceBonus(missionIndex) {
  const raceKey = SAVE_PREFIX + currentSection + "_race_mission_" + missionIndex;
  let race = JSON.parse(localStorage.getItem(raceKey) || "[]");
  if (!race.includes(currentGuild)) race.push(currentGuild);
  localStorage.setItem(raceKey, JSON.stringify(race));
  const place = race.indexOf(currentGuild);
  const bonuses = [
    {label:"🥇 1st Place", xp:50},
    {label:"🥈 2nd Place", xp:30},
    {label:"🥉 3rd Place", xp:20},
    {label:"4th Place", xp:10},
    {label:"5th Place", xp:5}
  ];
  return bonuses[place] || {label:"", xp:0};
}

function submitCode() {
  const input = document.getElementById("codeInput").value.trim().toUpperCase();
  const msg = document.getElementById("codeMessage");
  const index = LESSONS.findIndex(l => l.code.toUpperCase() === input);
  if (index === -1) {
    msg.innerHTML = `<span class="warning">Maling code.</span>`;
    playSound("wrong");
    return;
  }
  if (!(state.completed || []).includes(index)) {
    msg.innerHTML = `<span class="warning">Tama ang code, pero kailangan munang matapos ang mission.</span>`;
    return;
  }
  const next = index + 1;
  if (next < LESSONS.length) {

  const teacherPass = prompt(
    "🔐 Enter Teacher Password:"
  );

  if (teacherPass !== "CHRONOS2026") {

    msg.innerHTML =
      `<span class="warning">
        ❌ Invalid Teacher Password
      </span>`;

    return;
  }

  if (!state.unlocked.includes(next))
    state.unlocked.push(next);

  if (!state.coded.includes(index))
    state.coded.push(index);

  msg.innerHTML =
    `<span class="success">
      🔓 Nabuksan: ${LESSONS[next].title}
    </span>`;

  document.getElementById("codeInput").value = "";

  playSound("unlock");

  saveState();
  renderAll();
  saveGuildOnline();
}
    msg.innerHTML = `<span class="success">🎉 Kumpleto! Naibalik ang Timeline!</span>`;
  }
function closeMission() {
  acceptingAnswer = false;
  currentShuffled = null;
  document.getElementById("missionDialog").close();
}

function resetCurrentGuild() {
  if (!currentSection || !currentGuild) return toast("Pumili muna ng section at guild.");
  if (!confirm("I-reset ang progress ng napiling guild sa device na ito?")) return;
  localStorage.removeItem(saveKey());
  state = blankState(currentSection, currentGuild);
  saveState();
  renderAll();
}

function toast(text) {
  const t = document.getElementById("toast");
  t.textContent = text;
  t.style.display = "block";
  setTimeout(() => t.style.display = "none", 2300);
}

/* Sounds: Web Audio, no external files needed */
const sounds = {
  chronos: new Audio("assets/chronos.mp3"),

  adventure: new Audio("assets/adventure.mp3"),

  correct: new Audio("assets/correct.mp3"),

  wrong: new Audio("assets/wrong.mp3"),

  unlock: new Audio("assets/unlock.mp3"),

  victory: new Audio("assets/victory.mp3")
};
sounds.chronos.loop = true;
sounds.chronos.volume = 0.35;

sounds.adventure.loop = true;
sounds.adventure.volume = 0.25;

function startAdventureSound() {
  sounds.adventure.play().catch(err => {
    console.log("Audio blocked:", err);
  });
}

function playSound(type) {
  if (!sounds[type]) return;

  sounds[type].currentTime = 0;
  sounds[type].play().catch(() => {});
}
function toggleMusic() {
  const btn = document.getElementById("musicBtn");
  if (sounds.adventure.paused) {
    sounds.adventure.play().catch(() => {});
    if (btn) btn.textContent = "🔇 Music Off";
  } else {
    sounds.adventure.pause();
    if (btn) btn.textContent = "🎵 Music On";
  }
}

function runTests() {
  console.assert(LESSONS.length === 26, "Dapat 26 ang missions.");
  LESSONS.forEach((l,i) => {
    console.assert(l.questions.length >= 3 || l.multiGame, `Lesson ${i+1} dapat may questions o multi-game stages.`);
    l.questions.forEach((qq,j) => {
      const shuffled = shuffleQuestion(qq);
      console.assert(shuffled.c[shuffled.a] === qq.c[qq.a], `Shuffle error L${i+1} Q${j+1}`);
    });
  });
  console.log("✅ AP8 World Quest v2 tests passed.");
}

loadState();
runTests();
renderAll();
listenSectionLeaderboard();
function showStory() {

  sounds.adventure.pause();
  sounds.adventure.currentTime = 0;

  document.getElementById("introScreen")
    .classList.remove("hidden");

  document.getElementById("gameApp")
    .classList.add("hidden");

  playOpeningStory();
}
listenSectionLeaderboard();
/* Needed because script.js uses type="module" */
window.enterGame = enterGame;
window.showStory = showStory;
window.showTab = showTab;
window.toggleMusic = toggleMusic;
window.selectSection = selectSection;
window.selectGuild = selectGuild;
window.openMission = openMission;
window.answerQuestion = answerQuestion;
window.nextGameStage = nextGameStage;
window.submitCode = submitCode;
window.closeMission = closeMission;
window.resetCurrentGuild = resetCurrentGuild;
const openingStory = `
Noong unang panahon...

Ang Kasaysayan ng Daigdig ay nakaukit
sa Banal na Aklat ng Panahon.

Ngunit dumating ang
TAGABURA NG TIMELINE...

Isa-isang naglaho ang mga kabihasnan,
mga imperyo, at mga alaala ng sangkatauhan.

Sa huling sandali,
hinati ng Orasan ng Panahon
ang kapangyarihan nito
sa limang sinaunang Guild.

Kayo ang mga napiling
Tagapaglakbay ng Panahon.

Kapag tuluyang naglaho ang Timeline...

ang Kasaysayan ay hindi na muling
maisusulat.
`;

let storyIndex = 0;

function playOpeningStory() {

  sounds.chronos.pause();
  sounds.chronos.currentTime = 0;

  sounds.chronos.play().catch(() => {
    console.log("Chronos music blocked.");
  });

  const storyBox = document.getElementById("storyText");
  const guildReveal = document.getElementById("guildReveal");
  const startBtn = document.getElementById("startJourneyBtn");

  if (!storyBox) return;

  guildReveal.classList.add("hidden");
  startBtn.classList.add("hidden");

  storyBox.textContent = "";
  storyIndex = 0;

  const typing = setInterval(() => {
    storyBox.textContent += openingStory.charAt(storyIndex);
    storyIndex++;

    if (storyIndex >= openingStory.length) {
      clearInterval(typing);

      setTimeout(() => {
        guildReveal.classList.remove("hidden");
      }, 700);

      setTimeout(() => {
        startBtn.classList.remove("hidden");
      }, 1500);
    }
  }, 35);
}

window.addEventListener("load", playOpeningStory);