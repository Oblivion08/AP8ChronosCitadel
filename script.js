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


/* =========================================================
   CHRONOS CITADEL V3 PATCH
   Rule: Every mission becomes a mini-game mission with exactly
   10 playable items. Map, codes, XP, passport, Firebase, and
   teacher dashboard remain unchanged.
========================================================= */
function normalizeChoices(choices, answer) {
  const list = Array.isArray(choices) ? [...choices] : [];
  if (!list.includes(answer)) list.unshift(answer);
  const defaults = [
    "Hindi ito ang tamang sagot",
    "Bahagyang kaugnay lamang",
    "Walang direktang kaugnayan"
  ];
  defaults.forEach(x => { if (list.length < 3 && !list.includes(x)) list.push(x); });
  return list.slice(0, 4);
}

function taskFromQuestion(question, fallbackTitle="Chronos Challenge") {
  const answer = question.c[question.a];
  return {
    term: question.q || fallbackTitle,
    answer,
    choices: normalizeChoices(question.c, answer)
  };
}

function tasksFromExistingGameStages(lesson) {
  const tasks = [];
  (lesson.gameStages || []).forEach(stage => {
    if (Array.isArray(stage.targets)) {
      stage.targets.forEach(target => {
        tasks.push({
          term: `Piliin kung kabilang sa tamang sagot: ${target}`,
          answer: target,
          choices: normalizeChoices(stage.options || stage.targets, target)
        });
      });
    }
    if (Array.isArray(stage.tasks)) {
      stage.tasks.forEach(task => {
        tasks.push({
          term: task.term,
          answer: task.answer,
          choices: normalizeChoices(task.choices, task.answer)
        });
      });
    }
    if (Array.isArray(stage.sequence)) {
      stage.sequence.forEach((item, idx) => {
        tasks.push({
          term: `Ano ang ika-${idx + 1} sa tamang pagkakasunod-sunod?`,
          answer: item,
          choices: normalizeChoices(stage.sequence, item)
        });
      });
    }
  });
  return tasks;
}

const UNIQUE_MISSION_TASKS = {
  1: [{"term": "Tigris at Euphrates", "answer": "Mesopotamia", "choices": ["Mesopotamia", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Indus", "answer": "Harappa Civilization", "choices": ["Harappa Civilization", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Huang He / Yellow River", "answer": "Kabihasnang Tsino", "choices": ["Kabihasnang Tsino", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Ilog Nile", "answer": "Ancient Egypt", "choices": ["Ancient Egypt", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Cuneiform", "answer": "Unang sistema ng pagsulat ng Sumerian", "choices": ["Unang sistema ng pagsulat ng Sumerian", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Selyo / seal", "answer": "Ambag ng Indus sa kalakalan", "choices": ["Ambag ng Indus sa kalakalan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Oracle bones", "answer": "Pinagsulatan ng sinaunang Tsino", "choices": ["Pinagsulatan ng sinaunang Tsino", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pyramids", "answer": "Ambag ng sinaunang Egypt", "choices": ["Ambag ng sinaunang Egypt", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Irigasyon", "answer": "Sistema ng patubig sa lambak-ilog", "choices": ["Sistema ng patubig sa lambak-ilog", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Cradle of Civilization", "answer": "Tawag sa Mesopotamia", "choices": ["Tawag sa Mesopotamia", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  2: [{"term": "Minoan", "answer": "Kabihasnang umusbong sa Crete", "choices": ["Kabihasnang umusbong sa Crete", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Mycenaean", "answer": "Kabihasnang mandirigma sa mainland Greece", "choices": ["Kabihasnang mandirigma sa mainland Greece", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Knossos", "answer": "Palasyo ng mga Minoan", "choices": ["Palasyo ng mga Minoan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Linear A", "answer": "Sistema ng pagsulat ng Minoan", "choices": ["Sistema ng pagsulat ng Minoan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Linear B", "answer": "Sistema ng pagsulat ng Mycenaean", "choices": ["Sistema ng pagsulat ng Mycenaean", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Mediterranean Sea", "answer": "Dagat na sentro ng kalakalan ng Minoan", "choices": ["Dagat na sentro ng kalakalan ng Minoan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Bull-leaping", "answer": "Palakasan ng Minoan", "choices": ["Palakasan ng Minoan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Agamemnon", "answer": "Kaugnay ng Mycenaean", "choices": ["Kaugnay ng Mycenaean", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Thera / Santorini eruption", "answer": "Isa sa dahilan ng paghina ng Minoan", "choices": ["Isa sa dahilan ng paghina ng Minoan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Dorian invasion", "answer": "Isa sa dahilan ng pagbagsak ng Mycenaean", "choices": ["Isa sa dahilan ng pagbagsak ng Mycenaean", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  3: [{"term": "Olmec", "answer": "Ina ng mga kabihasnan sa Mesoamerica", "choices": ["Ina ng mga kabihasnan sa Mesoamerica", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Maya", "answer": "Kilala sa astronomiya at hieroglyphs", "choices": ["Kilala sa astronomiya at hieroglyphs", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Aztec", "answer": "May sistemang pamilihan at mandirigma", "choices": ["May sistemang pamilihan at mandirigma", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Inca", "answer": "Gumamit ng quipu sa pagtatala", "choices": ["Gumamit ng quipu sa pagtatala", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Malalaking batong ulo", "answer": "Ambag o likha ng Olmec", "choices": ["Ambag o likha ng Olmec", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Tenochtitlan", "answer": "Lungsod ng Aztec", "choices": ["Lungsod ng Aztec", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Machu Picchu", "answer": "Kilalang lugar ng Inca", "choices": ["Kilalang lugar ng Inca", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Quipu", "answer": "Tali na gamit sa pagtatala", "choices": ["Tali na gamit sa pagtatala", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kalendaryo", "answer": "Ambag ng Maya at Aztec", "choices": ["Ambag ng Maya at Aztec", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Polynesian", "answer": "Mahuhusay na mandaragat sa rehiyong Pacific", "choices": ["Mahuhusay na mandaragat sa rehiyong Pacific", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  4: [{"term": "Hari / Lugal", "answer": "Pinuno ng lungsod-estado sa Sumer", "choices": ["Pinuno ng lungsod-estado sa Sumer", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pari", "answer": "Namamahala sa relihiyon at seremonya", "choices": ["Namamahala sa relihiyon at seremonya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Eskribang Egyptian", "answer": "Nagtatala ng buwis at batas", "choices": ["Nagtatala ng buwis at batas", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pharaoh", "answer": "Hari at diyos ng Egypt", "choices": ["Hari at diyos ng Egypt", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Brahmin", "answer": "Pari at guro sa sistemang varna", "choices": ["Pari at guro sa sistemang varna", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kshatriya", "answer": "Mandirigma at pinuno sa varna", "choices": ["Mandirigma at pinuno sa varna", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Vaishya", "answer": "Mangangalakal at magsasaka", "choices": ["Mangangalakal at magsasaka", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Shudra", "answer": "Manggagawa at lingkod", "choices": ["Manggagawa at lingkod", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Jati", "answer": "Maraming pangkat batay sa trabaho", "choices": ["Maraming pangkat batay sa trabaho", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Caste system", "answer": "Sistemang batay sa kapanganakan", "choices": ["Sistemang batay sa kapanganakan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  5: [{"term": "Aristokrata", "answer": "Mayayamang namumuno sa Greece", "choices": ["Mayayamang namumuno sa Greece", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Mamamayan / citizens", "answer": "Lalaking may karapatang bumoto sa Athens", "choices": ["Lalaking may karapatang bumoto sa Athens", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kababaihan", "answer": "Limitado ang karapatan sa sinaunang Greece", "choices": ["Limitado ang karapatan sa sinaunang Greece", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Metic", "answer": "Dayuhang naninirahan sa Greece", "choices": ["Dayuhang naninirahan sa Greece", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Alipin", "answer": "Walang kalayaan sa lipunang Greek", "choices": ["Walang kalayaan sa lipunang Greek", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Sparta", "answer": "Militaristang lungsod-estado", "choices": ["Militaristang lungsod-estado", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Athens", "answer": "Kilala sa demokrasya at edukasyon", "choices": ["Kilala sa demokrasya at edukasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Demokrasya", "answer": "Pamamahala na may partisipasyon ng mamamayan", "choices": ["Pamamahala na may partisipasyon ng mamamayan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Parthenon", "answer": "Templong kaugnay ng Athens", "choices": ["Templong kaugnay ng Athens", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Disiplina at lakas militar", "answer": "Pangunahing pagpapahalaga ng Sparta", "choices": ["Pangunahing pagpapahalaga ng Sparta", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  6: [{"term": "Zoroastrianismo", "answer": "Nagsimula sa Persia", "choices": ["Nagsimula sa Persia", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Ahura Mazda", "answer": "Diyos ng kabutihan at liwanag", "choices": ["Diyos ng kabutihan at liwanag", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Angra Mainyu", "answer": "Diyos ng kasamaan at kadiliman", "choices": ["Diyos ng kasamaan at kadiliman", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Hinduismo", "answer": "Relihiyong nagmula sa India", "choices": ["Relihiyong nagmula sa India", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Judaismo", "answer": "Relihiyong may banal na aklat na Torah", "choices": ["Relihiyong may banal na aklat na Torah", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kristiyanismo", "answer": "Relihiyong nakasentro kay Hesus Kristo", "choices": ["Relihiyong nakasentro kay Hesus Kristo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Islam", "answer": "May Limang Haligi at Qur’an", "choices": ["May Limang Haligi at Qur’an", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Buddhismo", "answer": "Nagtuturo ng pagwakas ng pagdurusa", "choices": ["Nagtuturo ng pagwakas ng pagdurusa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reinkarnasyon", "answer": "Paniniwala sa muling pagsilang", "choices": ["Paniniwala sa muling pagsilang", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Five Pillars of Islam", "answer": "Limang tungkulin ng Muslim", "choices": ["Limang tungkulin ng Muslim", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  7: [{"term": "Confucianism", "answer": "Nagtuturo ng tamang asal at kaayusan", "choices": ["Nagtuturo ng tamang asal at kaayusan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Confucius", "answer": "Nagtatag ng Confucianism", "choices": ["Nagtatag ng Confucianism", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Shintoism", "answer": "Relihiyon ng kalikasan sa Japan", "choices": ["Relihiyon ng kalikasan sa Japan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kami", "answer": "Diyos o espiritu sa Shintoism", "choices": ["Diyos o espiritu sa Shintoism", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Buddhism", "answer": "Relihiyon ng kapayapaan at pagwakas ng pagdurusa", "choices": ["Relihiyon ng kapayapaan at pagwakas ng pagdurusa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Siddhartha Gautama", "answer": "Nagtatag ng Buddhism", "choices": ["Nagtatag ng Buddhism", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nirvana", "answer": "Kalayaan mula sa pagdurusa", "choices": ["Kalayaan mula sa pagdurusa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Torii gate", "answer": "Simbolo ng Shinto shrine", "choices": ["Simbolo ng Shinto shrine", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Paggalang sa magulang", "answer": "Mahalagang turo ng Confucianism", "choices": ["Mahalagang turo ng Confucianism", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Apat na Marangal na Katotohanan", "answer": "Mahalagang aral ng Buddhism", "choices": ["Mahalagang aral ng Buddhism", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  8: [{"term": "Pagsasara ng Constantinople", "answer": "1453 pangyayaring naghanap ng bagong ruta ang Europeo", "choices": ["1453 pangyayaring naghanap ng bagong ruta ang Europeo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Renaissance", "answer": "Muling pagsilang ng sining at kaalaman", "choices": ["Muling pagsilang ng sining at kaalaman", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reformation", "answer": "Pagbabago sa Simbahang Katolika na pinasimulan ni Martin Luther", "choices": ["Pagbabago sa Simbahang Katolika na pinasimulan ni Martin Luther", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Counter-Reformation", "answer": "Tugon ng Simbahang Katolika sa Repormasyon", "choices": ["Tugon ng Simbahang Katolika sa Repormasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Martin Luther", "answer": "Nagpako ng 95 Theses", "choices": ["Nagpako ng 95 Theses", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Leonardo da Vinci", "answer": "Halimbawa ng Renaissance artist at scientist", "choices": ["Halimbawa ng Renaissance artist at scientist", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Council of Trent", "answer": "Pagpupulong para sa reporma ng Simbahan", "choices": ["Pagpupulong para sa reporma ng Simbahan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Printing press", "answer": "Nakatulong sa paglaganap ng ideya", "choices": ["Nakatulong sa paglaganap ng ideya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Humanism", "answer": "Pagtuon sa kakayahan at dignidad ng tao", "choices": ["Pagtuon sa kakayahan at dignidad ng tao", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Bagong ruta sa Asya", "answer": "Hinahanap ng Europeo matapos maapektuhan ang kalakalan", "choices": ["Hinahanap ng Europeo matapos maapektuhan ang kalakalan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  9: [{"term": "Christopher Columbus", "answer": "Nakarating sa Caribbean noong 1492", "choices": ["Nakarating sa Caribbean noong 1492", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Vasco da Gama", "answer": "Nakarating sa India sa pamamagitan ng pag-ikot sa Africa", "choices": ["Nakarating sa India sa pamamagitan ng pag-ikot sa Africa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Ferdinand Magellan", "answer": "Nanguna sa unang paglalayag na nakapaligid sa mundo", "choices": ["Nanguna sa unang paglalayag na nakapaligid sa mundo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Gold, God, Glory", "answer": "Tatlong layunin ng paggalugad", "choices": ["Tatlong layunin ng paggalugad", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Compass", "answer": "Kagamitang pantulong sa nabigasyon", "choices": ["Kagamitang pantulong sa nabigasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Caravel / barko", "answer": "Sasakyang ginamit sa paglalayag", "choices": ["Sasakyang ginamit sa paglalayag", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kolonyalismo", "answer": "Pananakop at pagkontrol sa bagong lupain", "choices": ["Pananakop at pagkontrol sa bagong lupain", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "America", "answer": "Bagong lupain na sinakop ng mga Europeo", "choices": ["Bagong lupain na sinakop ng mga Europeo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pagpapalaganap ng Kristiyanismo", "answer": "Isa sa epekto ng kolonyalismo", "choices": ["Isa sa epekto ng kolonyalismo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pagkuha ng yaman at lupa", "answer": "Epekto ng kolonyalismo sa katutubo", "choices": ["Epekto ng kolonyalismo sa katutubo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  10: [{"term": "Imperyalismo", "answer": "Pagpapalawak ng kapangyarihan sa ibang bansa", "choices": ["Pagpapalawak ng kapangyarihan sa ibang bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Asya at Africa", "answer": "Rehiyong sinakop ng Europe at Japan", "choices": ["Rehiyong sinakop ng Europe at Japan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Hilaw na materyales", "answer": "Dahilan ng pananakop", "choices": ["Dahilan ng pananakop", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pamilihan", "answer": "Lugar na pagbebentahan ng produkto", "choices": ["Lugar na pagbebentahan ng produkto", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Japan", "answer": "Bansang Asyanong naging imperyalista", "choices": ["Bansang Asyanong naging imperyalista", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Europeo", "answer": "Mga bansang nanakop sa Asya at Africa", "choices": ["Mga bansang nanakop sa Asya at Africa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Protectorate", "answer": "Uri ng pagkontrol sa bansa", "choices": ["Uri ng pagkontrol sa bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Colony", "answer": "Lupaing direktang pinamumunuan ng dayuhan", "choices": ["Lupaing direktang pinamumunuan ng dayuhan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Economic imperialism", "answer": "Kontrol sa ekonomiya ng ibang bansa", "choices": ["Kontrol sa ekonomiya ng ibang bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nasyonalismo", "answer": "Pagmamahal sa bansa bilang tugon sa pananakop", "choices": ["Pagmamahal sa bansa bilang tugon sa pananakop", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  11: [{"term": "Enlightenment", "answer": "Panahon ng kaisipang karapatan at katwiran", "choices": ["Panahon ng kaisipang karapatan at katwiran", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "John Locke", "answer": "Nagtaguyod ng natural rights", "choices": ["Nagtaguyod ng natural rights", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Montesquieu", "answer": "Kilala sa separation of powers", "choices": ["Kilala sa separation of powers", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Rousseau", "answer": "Kaugnay ng social contract", "choices": ["Kaugnay ng social contract", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Rebolusyong Amerikano", "answer": "Pakikibaka ng kolonya laban sa Britain", "choices": ["Pakikibaka ng kolonya laban sa Britain", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Declaration of Independence", "answer": "Dokumentong naghayag ng kalayaan ng America", "choices": ["Dokumentong naghayag ng kalayaan ng America", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nasyonalismo", "answer": "Pagmamahal at katapatan sa bansa", "choices": ["Pagmamahal at katapatan sa bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pagkabansa", "answer": "Pagbuo ng pagkakakilanlan ng bayan", "choices": ["Pagbuo ng pagkakakilanlan ng bayan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kalayaan", "answer": "Isa sa ideyang pinalakas ng Enlightenment", "choices": ["Isa sa ideyang pinalakas ng Enlightenment", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Karapatan", "answer": "Prinsipyong mahalaga sa nasyonalismo", "choices": ["Prinsipyong mahalaga sa nasyonalismo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  12: [{"term": "Rebolusyong Pranses", "answer": "Pangyayaring nagpatibay ng liberty, equality, fraternity", "choices": ["Pangyayaring nagpatibay ng liberty, equality, fraternity", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Liberty", "answer": "Kalayaan", "choices": ["Kalayaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Equality", "answer": "Pagkakapantay-pantay", "choices": ["Pagkakapantay-pantay", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Fraternity", "answer": "Pagkakapatiran", "choices": ["Pagkakapatiran", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Estates General", "answer": "Asembleya ng tatlong estate sa France", "choices": ["Asembleya ng tatlong estate sa France", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Bastille", "answer": "Bilangguang sinalakay noong 1789", "choices": ["Bilangguang sinalakay noong 1789", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Declaration of the Rights of Man", "answer": "Dokumentong naghayag ng karapatan", "choices": ["Dokumentong naghayag ng karapatan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Bansang-estado", "answer": "Bansang may pamahalaan at pagkakakilanlan", "choices": ["Bansang may pamahalaan at pagkakakilanlan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Monarkiya", "answer": "Pamumuno ng hari o reyna", "choices": ["Pamumuno ng hari o reyna", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reign of Terror", "answer": "Marahas na yugto ng Rebolusyong Pranses", "choices": ["Marahas na yugto ng Rebolusyong Pranses", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  13: [{"term": "Sepoy Mutiny", "answer": "Pag-aalsa sa India laban sa British", "choices": ["Pag-aalsa sa India laban sa British", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Boxer Rebellion", "answer": "Paglaban sa impluwensiyang dayuhan sa China", "choices": ["Paglaban sa impluwensiyang dayuhan sa China", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Meiji Restoration", "answer": "Modernisasyon ng Japan", "choices": ["Modernisasyon ng Japan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Latin America", "answer": "Rehiyong naghangad ng kalayaan sa Spain at Portugal", "choices": ["Rehiyong naghangad ng kalayaan sa Spain at Portugal", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Simón Bolívar", "answer": "Pinunong lumaban para sa kalayaan sa Latin America", "choices": ["Pinunong lumaban para sa kalayaan sa Latin America", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Rebelyon", "answer": "Marahas na paglaban sa mananakop", "choices": ["Marahas na paglaban sa mananakop", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reporma", "answer": "Mapayapang pagbabago sa sistema", "choices": ["Mapayapang pagbabago sa sistema", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Diplomasya", "answer": "Pakikipag-ugnayan upang maresolba ang isyu", "choices": ["Pakikipag-ugnayan upang maresolba ang isyu", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nasyonalismo", "answer": "Nagbuklod sa mga kolonya laban sa imperyalismo", "choices": ["Nagbuklod sa mga kolonya laban sa imperyalismo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kalayaan", "answer": "Pangunahing layunin ng paglaban", "choices": ["Pangunahing layunin ng paglaban", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  14: [{"term": "Militarismo", "answer": "Pagpapalakas ng hukbo bago WWI", "choices": ["Pagpapalakas ng hukbo bago WWI", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Alyansa", "answer": "Kasunduan ng mga bansa na magtulungan", "choices": ["Kasunduan ng mga bansa na magtulungan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Imperyalismo", "answer": "Kompetisyon sa kolonya at yaman", "choices": ["Kompetisyon sa kolonya at yaman", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nasyonalismo", "answer": "Matinding pagmamahal sa bansa", "choices": ["Matinding pagmamahal sa bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pagpaslang kay Archduke Franz Ferdinand", "answer": "Agarang sanhi ng WWI", "choices": ["Agarang sanhi ng WWI", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Trench warfare", "answer": "Pakikipaglaban sa hukay", "choices": ["Pakikipaglaban sa hukay", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Central Powers", "answer": "Germany, Austria-Hungary at kaalyado", "choices": ["Germany, Austria-Hungary at kaalyado", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Allied Powers", "answer": "Britain, France, Russia at kaalyado", "choices": ["Britain, France, Russia at kaalyado", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Treaty of Versailles", "answer": "Kasunduang nagtapos sa WWI", "choices": ["Kasunduang nagtapos sa WWI", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "League of Nations", "answer": "Samahang itinatag matapos WWI", "choices": ["Samahang itinatag matapos WWI", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  15: [{"term": "Great Depression", "answer": "Malaking krisis pang-ekonomiya pagkatapos ng digmaan", "choices": ["Malaking krisis pang-ekonomiya pagkatapos ng digmaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reparations", "answer": "Bayad-pinsala matapos WWI", "choices": ["Bayad-pinsala matapos WWI", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Treaty of Versailles", "answer": "Kasunduang nagpahirap sa Germany", "choices": ["Kasunduang nagpahirap sa Germany", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "League of Nations", "answer": "Nabigong pigilan ang bagong digmaan", "choices": ["Nabigong pigilan ang bagong digmaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Inflation", "answer": "Pagtaas ng presyo ng bilihin", "choices": ["Pagtaas ng presyo ng bilihin", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Unemployment", "answer": "Kawalan ng trabaho", "choices": ["Kawalan ng trabaho", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Reconstruction", "answer": "Muling pagbangon mula sa digmaan", "choices": ["Muling pagbangon mula sa digmaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Isolationism", "answer": "Pag-iwas sa pakikialam sa ibang bansa", "choices": ["Pag-iwas sa pakikialam sa ibang bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Mandate system", "answer": "Pamamahala sa dating kolonya", "choices": ["Pamamahala sa dating kolonya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pagbangon", "answer": "Tugon ng bansa sa krisis", "choices": ["Tugon ng bansa sa krisis", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  16: [{"term": "Totalitaryanismo", "answer": "Kontrol ng estado sa halos lahat ng aspeto ng buhay", "choices": ["Kontrol ng estado sa halos lahat ng aspeto ng buhay", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Diktador", "answer": "Pinunong may lubos na kapangyarihan", "choices": ["Pinunong may lubos na kapangyarihan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Propaganda", "answer": "Impormasyong ginagamit upang impluwensiyahan ang tao", "choices": ["Impormasyong ginagamit upang impluwensiyahan ang tao", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Censorship", "answer": "Pagkontrol sa impormasyon", "choices": ["Pagkontrol sa impormasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Fascism", "answer": "Ideolohiya nina Mussolini at Hitler", "choices": ["Ideolohiya nina Mussolini at Hitler", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nazism", "answer": "Ideolohiyang pinamunuan ni Hitler", "choices": ["Ideolohiyang pinamunuan ni Hitler", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Communism sa Soviet Union", "answer": "Ideolohiyang pinamunuan ni Stalin", "choices": ["Ideolohiyang pinamunuan ni Stalin", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Demokrasya", "answer": "Pamamahalang may karapatan at partisipasyon", "choices": ["Pamamahalang may karapatan at partisipasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Karapatang pantao", "answer": "Karapatang nilalabag ng totalitaryanismo", "choices": ["Karapatang nilalabag ng totalitaryanismo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "One-party rule", "answer": "Iisang partidong kumokontrol sa pamahalaan", "choices": ["Iisang partidong kumokontrol sa pamahalaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  17: [{"term": "Ikalawang Digmaang Pandaigdig", "answer": "Digmaang pandaigdig noong 1939–1945", "choices": ["Digmaang pandaigdig noong 1939–1945", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Appeasement", "answer": "Pagpapahinuhod sa agresibong bansa", "choices": ["Pagpapahinuhod sa agresibong bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Invasion of Poland", "answer": "Simula ng WWII sa Europe", "choices": ["Simula ng WWII sa Europe", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Axis Powers", "answer": "Germany, Italy, Japan", "choices": ["Germany, Italy, Japan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Allied Powers", "answer": "Britain, Soviet Union, United States at kaalyado", "choices": ["Britain, Soviet Union, United States at kaalyado", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pearl Harbor", "answer": "Pag-atake ng Japan sa US noong 1941", "choices": ["Pag-atake ng Japan sa US noong 1941", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Holocaust", "answer": "Pag-uusig at pagpatay sa mga Hudyo", "choices": ["Pag-uusig at pagpatay sa mga Hudyo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "D-Day", "answer": "Paglusob ng Allies sa Normandy", "choices": ["Paglusob ng Allies sa Normandy", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Atomic bomb", "answer": "Ginamit sa Hiroshima at Nagasaki", "choices": ["Ginamit sa Hiroshima at Nagasaki", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "United Nations", "answer": "Itinatag upang mapanatili ang kapayapaan", "choices": ["Itinatag upang mapanatili ang kapayapaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  18: [{"term": "Cold War", "answer": "Tensiyon ng US at Soviet Union na hindi direktang digmaan", "choices": ["Tensiyon ng US at Soviet Union na hindi direktang digmaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "United States", "answer": "Pinuno ng kapitalistang bloke", "choices": ["Pinuno ng kapitalistang bloke", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Soviet Union", "answer": "Pinuno ng komunistang bloke", "choices": ["Pinuno ng komunistang bloke", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kapitalismo", "answer": "Sistemang nakabatay sa pribadong pag-aari", "choices": ["Sistemang nakabatay sa pribadong pag-aari", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Komunismo", "answer": "Sistemang may kontrol ng estado sa ekonomiya", "choices": ["Sistemang may kontrol ng estado sa ekonomiya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Iron Curtain", "answer": "Simbolo ng pagkakahati ng Europe", "choices": ["Simbolo ng pagkakahati ng Europe", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "NATO", "answer": "Alyansang pinamunuan ng US", "choices": ["Alyansang pinamunuan ng US", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Warsaw Pact", "answer": "Alyansang pinamunuan ng Soviet Union", "choices": ["Alyansang pinamunuan ng Soviet Union", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Arms race", "answer": "Paligsahan sa armas", "choices": ["Paligsahan sa armas", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Space race", "answer": "Paligsahan sa kalawakan", "choices": ["Paligsahan sa kalawakan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  19: [{"term": "Proxy war", "answer": "Digmaang sinusuportahan ng makapangyarihang bansa", "choices": ["Digmaang sinusuportahan ng makapangyarihang bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Korean War", "answer": "Cold War conflict sa Asya", "choices": ["Cold War conflict sa Asya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Vietnam War", "answer": "Cold War conflict sa Timog-Silangang Asya", "choices": ["Cold War conflict sa Timog-Silangang Asya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Afghanistan", "answer": "Lugar ng tunggalian ng Soviet Union", "choices": ["Lugar ng tunggalian ng Soviet Union", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Asya at Africa", "answer": "Rehiyong naapektuhan ng Cold War", "choices": ["Rehiyong naapektuhan ng Cold War", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Non-Aligned Movement", "answer": "Mga bansang hindi kumampi sa US o USSR", "choices": ["Mga bansang hindi kumampi sa US o USSR", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Decolonization", "answer": "Paglaya ng mga kolonya", "choices": ["Paglaya ng mga kolonya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Military aid", "answer": "Tulong militar mula sa superpower", "choices": ["Tulong militar mula sa superpower", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Ideological conflict", "answer": "Banggaan ng kapitalismo at komunismo", "choices": ["Banggaan ng kapitalismo at komunismo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Political instability", "answer": "Isa sa epekto ng Cold War", "choices": ["Isa sa epekto ng Cold War", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  20: [{"term": "Pagbagsak ng Berlin Wall", "answer": "Simbolo ng pagtatapos ng Cold War", "choices": ["Simbolo ng pagtatapos ng Cold War", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "1989", "answer": "Taon ng pagbagsak ng Berlin Wall", "choices": ["Taon ng pagbagsak ng Berlin Wall", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "1991", "answer": "Taon ng pagbuwag ng Soviet Union", "choices": ["Taon ng pagbuwag ng Soviet Union", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Mikhail Gorbachev", "answer": "Pinunong nagpasimula ng glasnost at perestroika", "choices": ["Pinunong nagpasimula ng glasnost at perestroika", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Glasnost", "answer": "Pagiging bukas sa pamahalaan", "choices": ["Pagiging bukas sa pamahalaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Perestroika", "answer": "Reporma sa ekonomiya ng Soviet Union", "choices": ["Reporma sa ekonomiya ng Soviet Union", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Germany reunification", "answer": "Muling pagkakaisa ng Germany", "choices": ["Muling pagkakaisa ng Germany", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Unipolar world", "answer": "Daigdig na pinangungunahan ng iisang superpower", "choices": ["Daigdig na pinangungunahan ng iisang superpower", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Globalization", "answer": "Mas malawak na ugnayang pandaigdig", "choices": ["Mas malawak na ugnayang pandaigdig", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Post-Cold War", "answer": "Panahon pagkatapos ng Cold War", "choices": ["Panahon pagkatapos ng Cold War", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  21: [{"term": "Kilusang demokratiko", "answer": "Kilusan para sa karapatan at partisipasyon", "choices": ["Kilusan para sa karapatan at partisipasyon", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "People Power", "answer": "Halimbawa ng mapayapang demokratikong kilusan", "choices": ["Halimbawa ng mapayapang demokratikong kilusan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Civil rights movement", "answer": "Kilusan para sa pagkakapantay-pantay", "choices": ["Kilusan para sa pagkakapantay-pantay", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Apartheid resistance", "answer": "Pakikibaka laban sa racial segregation", "choices": ["Pakikibaka laban sa racial segregation", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Nelson Mandela", "answer": "Pinuno laban sa apartheid", "choices": ["Pinuno laban sa apartheid", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Karapatang bumoto", "answer": "Mahalagang karapatang demokratiko", "choices": ["Mahalagang karapatang demokratiko", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Malayang pamamahayag", "answer": "Sandigan ng demokrasya", "choices": ["Sandigan ng demokrasya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pakikilahok", "answer": "Gawain ng aktibong mamamayan", "choices": ["Gawain ng aktibong mamamayan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Accountability", "answer": "Pananagutan ng pinuno", "choices": ["Pananagutan ng pinuno", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Rule of law", "answer": "Pangingibabaw ng batas", "choices": ["Pangingibabaw ng batas", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  22: [{"term": "United Nations", "answer": "Samahang pandaigdig para sa kapayapaan", "choices": ["Samahang pandaigdig para sa kapayapaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "1945", "answer": "Taon ng pagkakatatag ng UN", "choices": ["Taon ng pagkakatatag ng UN", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "General Assembly", "answer": "Kapulungan ng lahat ng kasaping bansa", "choices": ["Kapulungan ng lahat ng kasaping bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Security Council", "answer": "Sangay na tumutugon sa seguridad", "choices": ["Sangay na tumutugon sa seguridad", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "UNICEF", "answer": "Ahensiyang tumutulong sa mga bata", "choices": ["Ahensiyang tumutulong sa mga bata", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "WHO", "answer": "Ahensiyang pangkalusugan", "choices": ["Ahensiyang pangkalusugan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "UNESCO", "answer": "Ahensiyang pang-edukasyon at kultura", "choices": ["Ahensiyang pang-edukasyon at kultura", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Philippines", "answer": "Kasaping bansa ng United Nations", "choices": ["Kasaping bansa ng United Nations", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Peacekeeping", "answer": "Pagpapanatili ng kapayapaan", "choices": ["Pagpapanatili ng kapayapaan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Human rights", "answer": "Isa sa itinataguyod ng UN", "choices": ["Isa sa itinataguyod ng UN", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  23: [{"term": "Kahirapan", "answer": "Isyung panlipunan tungkol sa kakulangan ng pangangailangan", "choices": ["Isyung panlipunan tungkol sa kakulangan ng pangangailangan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Diskriminasyon", "answer": "Hindi pantay na pagtrato", "choices": ["Hindi pantay na pagtrato", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Migrasyon", "answer": "Paglipat ng tao sa ibang lugar", "choices": ["Paglipat ng tao sa ibang lugar", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kawalan ng trabaho", "answer": "Suliranin sa hanapbuhay", "choices": ["Suliranin sa hanapbuhay", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Edukasyon", "answer": "Serbisyong mahalaga sa pag-unlad", "choices": ["Serbisyong mahalaga sa pag-unlad", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kalusugan", "answer": "Isyung may kaugnayan sa serbisyong medikal", "choices": ["Isyung may kaugnayan sa serbisyong medikal", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Gender equality", "answer": "Pantay na karapatan ng kasarian", "choices": ["Pantay na karapatan ng kasarian", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Human trafficking", "answer": "Ilegal na pang-aabuso at pagbebenta ng tao", "choices": ["Ilegal na pang-aabuso at pagbebenta ng tao", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Urbanisasyon", "answer": "Paglaki ng mga lungsod", "choices": ["Paglaki ng mga lungsod", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pakikiisa", "answer": "Mabuting tugon sa isyung panlipunan", "choices": ["Mabuting tugon sa isyung panlipunan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  24: [{"term": "Climate change", "answer": "Pangkalikasang isyu ng pag-init ng mundo", "choices": ["Pangkalikasang isyu ng pag-init ng mundo", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Korapsyon", "answer": "Pampolitikang isyu ng pang-aabuso sa kapangyarihan", "choices": ["Pampolitikang isyu ng pang-aabuso sa kapangyarihan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kahirapan", "answer": "Pangkabuhayang isyu", "choices": ["Pangkabuhayang isyu", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Global inequality", "answer": "Hindi pantay na kaunlaran ng bansa", "choices": ["Hindi pantay na kaunlaran ng bansa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Food security", "answer": "Sapat at ligtas na pagkain", "choices": ["Sapat at ligtas na pagkain", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Renewable energy", "answer": "Malinis na mapagkukunan ng enerhiya", "choices": ["Malinis na mapagkukunan ng enerhiya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Deforestation", "answer": "Pagkakalbo ng kagubatan", "choices": ["Pagkakalbo ng kagubatan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pollution", "answer": "Polusyon sa hangin, tubig, o lupa", "choices": ["Polusyon sa hangin, tubig, o lupa", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Conflict", "answer": "Pampolitikang tunggalian", "choices": ["Pampolitikang tunggalian", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Sustainable development", "answer": "Kaunlarang hindi sinisira ang kinabukasan", "choices": ["Kaunlarang hindi sinisira ang kinabukasan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
  25: [{"term": "Mapanagutang mamamayan", "answer": "May malasakit, kaalaman, at pakikilahok", "choices": ["May malasakit, kaalaman, at pakikilahok", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Global citizen", "answer": "Mamamayang may pananagutan sa daigdig", "choices": ["Mamamayang may pananagutan sa daigdig", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Paggalang sa kultura", "answer": "Katangian ng global citizen", "choices": ["Katangian ng global citizen", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pangangalaga sa kapaligiran", "answer": "Responsableng gawain", "choices": ["Responsableng gawain", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Pakikilahok sa komunidad", "answer": "Tungkulin ng mamamayan", "choices": ["Tungkulin ng mamamayan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Critical thinking", "answer": "Mapanuring pag-iisip", "choices": ["Mapanuring pag-iisip", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Volunteerism", "answer": "Boluntaryong pagtulong", "choices": ["Boluntaryong pagtulong", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Digital responsibility", "answer": "Responsableng paggamit ng teknolohiya", "choices": ["Responsableng paggamit ng teknolohiya", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kapayapaan", "answer": "Layunin ng pandaigdigang mamamayan", "choices": ["Layunin ng pandaigdigang mamamayan", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}, {"term": "Kooperasyon", "answer": "Sama-samang pagtugon sa suliranin", "choices": ["Sama-samang pagtugon sa suliranin", "Hindi ito ang tamang sagot", "Bahagyang kaugnay lamang"]}],
};

function buildTenTasks(lesson, index) {
  const customTasks = UNIQUE_MISSION_TASKS[index];
  if (customTasks && customTasks.length >= 10) {
    return customTasks.slice(0, 10).map(task => ({
      term: task.term,
      answer: task.answer,
      choices: normalizeChoices(task.choices, task.answer)
    }));
  }

  const source = [
    ...tasksFromExistingGameStages(lesson),
    ...(lesson.questions || []).map(qItem => taskFromQuestion(qItem, lesson.title))
  ];

  const base = source.length ? source : [{
    term: lesson.brief || lesson.title,
    answer: lesson.title,
    choices: [lesson.title, "Ibang paksa", "Hindi kaugnay"]
  }];

  const tasks = [];
  let i = 0;
  while (tasks.length < 10) {
    const original = base[i % base.length];
    const label = i >= base.length ? ` (${Math.floor(i / base.length) + 1})` : "";
    tasks.push({
      term: `${original.term}${label}`,
      answer: original.answer,
      choices: normalizeChoices(original.choices, original.answer)
    });
    i++;
  }
  return tasks.slice(0, 10);
}

function makeTrueFalseStatements(tasks) {
  return tasks.map((task, idx) => {
    const makeFalse = idx % 2 === 1;
    const wrong = task.choices.find(choice => choice !== task.answer) || "hindi tamang paglalarawan";
    return {
      text: makeFalse
        ? `Ang ${task.term} ay tumutukoy sa ${wrong}.`
        : `Ang ${task.term} ay tumutukoy sa ${task.answer}.`,
      answer: makeFalse ? "Mali" : "Tama"
    };
  });
}

function convertLessonToTenItemMiniGame(lesson, index) {
  const tasks = buildTenTasks(lesson, index);
  lesson.multiGame = true;
  lesson.gameStages = [
    {
      type: "dragDrop",
      title: `🧲 Drag and Drop: ${lesson.title}`,
      instruction: "I-drag o i-tap ang konsepto, pagkatapos ilagay sa tamang kahon. May 3 items dito.",
      tasks: tasks.slice(0, 3)
    },
    {
      type: "matchingGrid",
      title: `🧩 Matching Type: ${lesson.title}`,
      instruction: "I-tap ang konsepto sa kaliwa at itugma sa tamang sagot sa kanan. May 3 items dito.",
      tasks: tasks.slice(3, 6)
    },
    {
      type: "trueFalseDrop",
      title: `✅❌ Tama o Mali: ${lesson.title}`,
      instruction: "Ilagay ang pahayag sa TAMA o MALI. May 2 items dito.",
      statements: makeTrueFalseStatements(tasks.slice(6, 8))
    },
    {
      type: lesson.boss ? "boss" : "finalQuest",
      title: `👾 Boss Challenge: ${lesson.title}`,
      instruction: "Sagutin ang huling 2 hamon para makuha ang stamp at unlock code.",
      tasks: tasks.slice(8, 10)
    }
  ];
}

function normalizeAllLessonsToTenMiniGames() {
  LESSONS.forEach((lesson, index) => {
    // Mission 1 is already a special multi-game geography adventure.
    // Do not overwrite its stages/content.
    if (index === 0) return;

    // Mission 2 to Mission 26 become 10-item mini-game missions.
    convertLessonToTenItemMiniGame(lesson, index);
  });
}

normalizeAllLessonsToTenMiniGames();

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
  if (stage.statements) return stage.statements.length;
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
  if (stage.type === "dragDrop") return renderDragDropStage(stage, choices, result);
  if (stage.type === "matchingGrid") return renderMatchingGridStage(stage, choices, result);
  if (stage.type === "trueFalseDrop") return renderTrueFalseDropStage(stage, choices, result);
  return renderTaskStage(stage, choices, result);
}

function miniGameStyles() {
  return `
    <style>
      .mg-board{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}
      .mg-card,.mg-zone{border:2px dashed rgba(250,204,21,.65);border-radius:14px;padding:12px;margin:8px 0;background:rgba(255,255,255,.08);color:white;min-height:52px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700}
      .mg-card{cursor:grab;border-style:solid;background:rgba(51,65,85,.95)}
      .mg-card.selected{outline:3px solid #facc15;background:rgba(250,204,21,.25)}
      .mg-zone.filled{border-style:solid;background:rgba(34,197,94,.22)}
      .mg-label{color:#facc15;font-weight:900;text-align:center;margin:8px 0}
      @media(max-width:640px){.mg-board{grid-template-columns:1fr}.mg-card,.mg-zone{font-size:.95rem}}
    </style>
  `;
}

function renderDragDropStage(stage, choices, result) {
  stageProgress = stageProgress || { matched: {}, selected: null };
  const answers = shuffleArray(stage.tasks.map(t => t.answer));
  choices.innerHTML = miniGameStyles() + `
    <div class="mg-board">
      <div>
        <div class="mg-label">Mga Konsepto</div>
        <div id="dragCards"></div>
      </div>
      <div>
        <div class="mg-label">Tamang Kahon</div>
        <div id="dropZones"></div>
      </div>
    </div>
    <small>Tip: Sa cellphone, i-tap muna ang konsepto, tapos i-tap ang kahon.</small>
  `;
  const cards = document.getElementById("dragCards");
  const zones = document.getElementById("dropZones");

  stage.tasks.forEach((task, idx) => {
    if (stageProgress.matched[task.term]) return;
    const card = document.createElement("div");
    card.className = "mg-card" + (stageProgress.selected === task.term ? " selected" : "");
    card.textContent = task.term;
    card.draggable = true;
    card.ondragstart = ev => ev.dataTransfer.setData("text/plain", task.term);
    card.onclick = () => {
      stageProgress.selected = stageProgress.selected === task.term ? null : task.term;
      renderDragDropStage(stage, choices, result);
    };
    cards.appendChild(card);
  });

  answers.forEach(answer => {
    const zone = document.createElement("div");
    const filledTerm = Object.keys(stageProgress.matched).find(term => stageProgress.matched[term] === answer);
    zone.className = "mg-zone" + (filledTerm ? " filled" : "");
    zone.innerHTML = filledTerm ? `✅ <strong>${filledTerm}</strong><br><small>${answer}</small>` : answer;
    zone.ondragover = ev => ev.preventDefault();
    zone.ondrop = ev => {
      ev.preventDefault();
      checkDragDropMatch(ev.dataTransfer.getData("text/plain"), answer, stage, choices, result);
    };
    zone.onclick = () => {
      if (stageProgress.selected) checkDragDropMatch(stageProgress.selected, answer, stage, choices, result);
    };
    zones.appendChild(zone);
  });
}

function checkDragDropMatch(term, answer, stage, choices, result) {
  const task = stage.tasks.find(t => t.term === term);
  if (!task || stageProgress.matched[term]) return;
  if (task.answer === answer) {
    stageProgress.matched[term] = answer;
    stageProgress.selected = null;
    score++;
    playSound("correct");
    result.innerHTML = `<span class="success">✅ Tama ang pagkakatugma!</span>`;
    if (Object.keys(stageProgress.matched).length >= stage.tasks.length) {
      setTimeout(completeStage, 500);
    } else {
      setTimeout(() => renderDragDropStage(stage, choices, result), 350);
    }
  } else {
    playSound("wrong");
    result.innerHTML = `<span class="warning">❌ Hindi tugma. Subukan ulit.</span>`;
  }
}

function renderMatchingGridStage(stage, choices, result) {
  stageProgress = stageProgress || { matched: {}, left: null };
  const remainingTerms = stage.tasks.filter(t => !stageProgress.matched[t.term]);
  const answers = shuffleArray(stage.tasks.map(t => t.answer));
  choices.innerHTML = miniGameStyles() + `
    <div class="mg-board">
      <div><div class="mg-label">Column A</div><div id="matchLeft"></div></div>
      <div><div class="mg-label">Column B</div><div id="matchRight"></div></div>
    </div>
  `;
  const left = document.getElementById("matchLeft");
  const right = document.getElementById("matchRight");

  stage.tasks.forEach(task => {
    const item = document.createElement("div");
    const done = stageProgress.matched[task.term];
    item.className = "mg-card" + (stageProgress.left === task.term ? " selected" : "") + (done ? " filled" : "");
    item.textContent = done ? `✅ ${task.term}` : task.term;
    item.onclick = () => {
      if (done) return;
      stageProgress.left = stageProgress.left === task.term ? null : task.term;
      renderMatchingGridStage(stage, choices, result);
    };
    left.appendChild(item);
  });

  answers.forEach(answer => {
    const item = document.createElement("div");
    item.className = "mg-zone";
    item.textContent = answer;
    item.onclick = () => {
      if (!stageProgress.left) return result.innerHTML = `<span class="warning">Pumili muna sa Column A.</span>`;
      const task = stage.tasks.find(t => t.term === stageProgress.left);
      if (task.answer === answer) {
        stageProgress.matched[task.term] = answer;
        stageProgress.left = null;
        score++;
        playSound("correct");
        result.innerHTML = `<span class="success">✅ Match!</span>`;
        if (Object.keys(stageProgress.matched).length >= stage.tasks.length) setTimeout(completeStage, 500);
        else setTimeout(() => renderMatchingGridStage(stage, choices, result), 350);
      } else {
        playSound("wrong");
        result.innerHTML = `<span class="warning">❌ Maling match. Subukan ulit.</span>`;
      }
    };
    right.appendChild(item);
  });
}

function renderTrueFalseDropStage(stage, choices, result) {
  stageProgress = stageProgress || { item: 0 };
  const statement = stage.statements[stageProgress.item];
  if (!statement) return completeStage();
  document.getElementById("questionText").innerHTML += `<h3>📌 Pahayag ${stageProgress.item + 1}/${stage.statements.length}</h3><p>${statement.text}</p>`;
  choices.innerHTML = miniGameStyles() + `
    <div class="mg-board">
      <button onclick="answerTrueFalseDrop('Tama')">✅ TAMA</button>
      <button onclick="answerTrueFalseDrop('Mali')">❌ MALI</button>
    </div>
  `;
}

function answerTrueFalseDrop(answer) {
  const lesson = LESSONS[currentMission];
  const stage = lesson.gameStages[currentStage];
  const statement = stage.statements[stageProgress.item];
  const result = document.getElementById("resultText");
  if (answer === statement.answer) {
    score++;
    stageProgress.item++;
    playSound("correct");
    result.innerHTML = `<span class="success">✅ Tama!</span>`;
    setTimeout(() => {
      result.textContent = "";
      if (stageProgress.item >= stage.statements.length) completeStage();
      else showGameStage();
    }, 650);
  } else {
    playSound("wrong");
    result.innerHTML = `<span class="warning">❌ Mali. Basahin ulit ang pahayag.</span>`;
  }
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
    console.assert(l.multiGame, `Lesson ${i+1} dapat mini-game mission.`);

    // Mission 1 is preserved as the special custom geography adventure.
    // Missions 2 to 26 must show exactly 10 playable mini-game items.
    if (i > 0) {
      console.assert(totalGameItems(l) === 10, `Lesson ${i+1} dapat exactly 10 items.`);
    }

    (l.questions || []).forEach((qq,j) => {
      const shuffled = shuffleQuestion(qq);
      console.assert(shuffled.c[shuffled.a] === qq.c[qq.a], `Shuffle error L${i+1} Q${j+1}`);
    });
  });
  console.log("✅ AP8 World Quest v3 tests passed: Mission 1 preserved; Missions 2-26 have 10 mini-game items each.");
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
window.answerTrueFalseDrop = answerTrueFalseDrop;
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