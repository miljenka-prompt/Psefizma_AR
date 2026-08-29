import type { SiteCopy } from "@/lib/i18n/types";

export const hr = {
  locale: "hr",
  localeLabel: "HR",
  metadata: {
    title: "Lumbardska psefizma – AR rekonstrukcija",
    description:
      "Interaktivna, izvorno označena rekonstrukcija osnutka isejske naseobine i podjele zemlje u antičkoj Lumbardi.",
  },
  languageSwitcherLabel: "Odabir jezika",
  pronunciationNote:
    "Rekonstruirano čitanje dorskoga grčkog teksta. Izgovor je povijesno utemeljena aproksimacija, ne doslovna rekonstrukcija lokalnog govora.",
  experience: {
    projectLabel: "QUANTUMHIPPIE · RADNA REKONSTRUKCIJA",
    title: "Lumbardska psefizma",
    enterScene: "Uđi u prizor",
    returnToDiorama: "Vrati se na dioramu",
    returnDiorama: "Vrati dioramu",
    soundOn: "Uključi ambijentalni zvuk",
    soundOff: "Isključi ambijentalni zvuk",
    narrativeAria: "AR narativ",
    liveReconstruction: "ŽIVA REKONSTRUKCIJA · V0.5.4",
    placeTitle: "Koludrt / bilo koja ravna podloga",
    placeDefault: "AR sidrenje koristi površinu koju kamera pronađe.",
    placeSurveyors:
      "Uđi među mjernike: postolje nestaje, a kamera se spušta u visinu čovjeka.",
    sceneProgress: (current, total) => `Prizor ${current} od ${total}`,
    navigationAria: "Kretanje kroz prizore",
    previousScene: "Prethodni prizor",
    nextScene: "Sljedeći prizor",
    restart: "Počni ispočetka",
    nextTrace: "Sljedeći trag",
    enterLandDivision: "Uđi u podjelu zemlje",
    enter: "Uđi",
    exit: "Izađi",
    immersiveControlsAria: "Kontrole živog prizora",
    sources: {
      summary: "Izvori i granice rekonstrukcije",
      basis:
        "Prvi sloj temelji se na opisu Arheološkog muzeja u Zagrebu, novom čitanju ulomka iz 2021. i objavljenom prijevodu natpisa. Tijek podizanja stele i izgled naselja ostaju radne hipoteze.",
      links: [
        {
          href: "https://amz.hr/hr/virtualni-muzej/vodici-kroz-stalni-postav/vodic-kroz-stalni-postav-anticke-zbirke-arheoloskog-muzeja-u-zagrebu/grci-na-istocnoj-obali-jadrana/lumbardska-psefizma/",
          label: "Arheološki muzej u Zagrebu",
        },
        {
          href: "https://www.researchgate.net/publication/366399086_A_NEW_FRAGMENT_OF_THE_GREEK_LAND_DIVISION_DECREE_FROM_LUMBARDA_ON_THE_ISLAND_OF_KORCULA",
          label: "Marohnić · Potrebica · Vuković, 2021.",
        },
        {
          href: "https://www.attalus.org/docs/sig1/s141.html",
          label: "Objavljeni tekst i prijevod",
        },
        {
          href: "https://quaternius.com/packs/universalbasecharacters.html",
          label: "CC0 baza 3D likova · Quaternius",
        },
      ],
    },
    evidenceLabels: {
      inscription: "NATPIS",
      archaeology: "ARHEOLOGIJA",
      interpretation: "TUMAČENJE",
      reconstruction: "REKONSTRUKCIJA",
    },
    scenes: [
      {
        eyebrow: "I · KORKYRA MELAINA",
        title: "Kolonija čije ime nismo sačuvali",
        body: "Doseljenici iz Isse stižu na istočni kraj Korčule. Psefizma je gotovo jedini glas grada koji će nestati iz krajolika, ali ne i iz kamena.",
        evidence: [
          {
            kind: "inscription",
            text: "Natpis veže osnivače uz Issu; ime nove naseobine nije sačuvano.",
          },
          {
            kind: "interpretation",
            text: "Datacija nije čvrsta; najčešće se smješta u 3. stoljeće pr. Kr.",
          },
        ],
      },
      {
        eyebrow: "II · DOGOVOR",
        title: "Issa, Pyllos i Dazos",
        body: "Prije kuća, zidina i parcela postoji politički dogovor. Uz isejske osnivače imenovani su Pyllos i njegov sin Dazos — ljudi s ilirskim imenima, ali nepoznatim položajem.",
        evidence: [
          {
            kind: "inscription",
            text: "Pyllos i njegov sin Dazos navedeni su uz isejske osnivače.",
          },
          {
            kind: "interpretation",
            text: "Njihova su imena ilirska; jesu li bili lokalni dinasti ostaje tumačenje.",
          },
        ],
      },
      {
        eyebrow: "III · ODLUKA",
        title: "Demos izglasava pravila",
        body: "Odabrana skupina oblikuje tekst, a zajednica ga prihvaća glasanjem. Psefizma nije ukrasni natpis: ona određuje tko dobiva zemlju, pod kojim uvjetima i što slijedi ako se pravila prekrše.",
        evidence: [
          {
            kind: "inscription",
            text: "Sačuvana formula govori o sastavljačima i odluci demos-a.",
          },
          {
            kind: "reconstruction",
            text: "Mjesto sjednice, način glasanja i javno čitanje nisu sačuvani.",
          },
        ],
      },
      {
        eyebrow: "IV · GRAD I ZEMLJA",
        title: "Pravo zapisano u prostoru",
        body: "Prvi kolonisti utvrđuju grad i dobivaju prednost pri izboru kućnih i obradivih čestica. Za one koji dolaze poslije propisani su drugi dijelovi. Zemlja postaje nacrt političke zajednice.",
        evidence: [
          {
            kind: "inscription",
            text: "Natpis razlikuje prve koloniste od kasnijih doseljenika i uređuje dodjelu čestica.",
          },
          {
            kind: "reconstruction",
            text: "Prikazana mreža parcela prostorni je model, a ne otkriven katastarski plan.",
          },
        ],
      },
      {
        eyebrow: "V · TRI FILE",
        title: "Grad dobiva imena",
        body: "Dimani, Hili i Pamfili. Ispod pravila slijede stupci ljudi — ime uz ime, patronimik uz patronimik. Politička odluka postaje popis stvarnih kolonista.",
        evidence: [
          {
            kind: "inscription",
            text: "Kolonisti su raspoređeni u tri dorske file: Dimane, Hile i Pamfile.",
          },
          {
            kind: "archaeology",
            text: "Sačuvano je približno 180 imena; izvorno ih je možda bilo oko 300.",
          },
        ],
      },
      {
        eyebrow: "VI · JAVNI KAMEN",
        title: "Psefizma se uspravlja",
        body: "Stela se podiže kao javna memorija osnutka, zemlje i pripadnosti. Ovdje kronovizor prelazi iz izvora u transparentnu rekonstrukciju — pokazujemo mogući trenutak, ne tvrdimo da smo ga pronašli.",
        evidence: [
          {
            kind: "archaeology",
            text: "Ulomci su pronađeni u antičkoj cisterni; izvorno mjesto stele nije poznato.",
          },
          {
            kind: "reconstruction",
            text: "Podizanje, okupljeni ljudi i javno čitanje prikazani su kao hipoteza.",
          },
        ],
      },
    ],
  },
  chronovizor: {
    stageAria: "Pogled kroz kronovizor na grčku Lumbardu",
    videoAria: "Realistična videorekonstrukcija grčke naseobine u Lumbardi",
    loading: "Učitavam kronovizor…",
    play: "Pokreni kronovizor",
    inscriptionAria: "Početak natpisa Lumbardske psefizme",
    openInscriptionAria: "Otvori uvećani, čitljivi natpis Lumbardske psefizme",
    inscriptionAction: "Dodirni psefizmu · pročitaj natpis",
    dialogTitle: "Lumbardska psefizma",
    dialogDescription: "Uvećani prikaz početka autentičnog grčkog natpisa.",
    translationLabel: "HRVATSKI PRIJEVOD",
    translation:
      "Neka je sa srećom. Za hijeromnamona Praksidama [u mjesecu Mahaneju utvrđen je ugovor o osnivanju naseobine između] Isejaca te Pila i njegova sina Daza. Ovo [su osnivači naseobine ugovorili] i narod je odlučio: da oni koji su prvi [zauzeli zemlju] i obzidali grad dobiju posebno zemljište za gradnju kuće unutar utvrđenoga grada, zajedno s pripadajućim dijelom.",
    reconstructedPartsNote: "Rekonstruirani dijelovi označeni su uglatim zagradama.",
    returnToChronovizor: "Povratak u kronovizor",
    inscriptionLines: [
      "ΑΓΑΘΑΙ ΤΥΧΑΙ ΕΦ ΙΕΡΟΜΝΑΜΟΝΟΣ ΠΡΑΞΙΔΑΜΟΥ",
      "ΜΑΧΑΝΕΟΣ ΣΥΝΘΗΚΑ ΟΙΚΙΣΤΑΝ ΙΣΣΑΙΩΝ",
      "ΚΑΙ ΠΥΛΛΟΥ ΚΑΙ ΤΟΥ ΥΟΥ ΔΑΖΟΥ ΤΑΔΕ",
      "ΣΥΝΕΓΡΑΨΑΝ ΟΙ ΟΙΚΙΣΤΑΙ ΚΑΙ ΕΔΟΞΕ ΤΩΙ ΔΑΜΩΙ",
      "ΛΑΒΕΙΝ ΕΞΑΙΡΕΤΟΝ ΤΟΥΣ ΠΡΩΤΟΥΣ",
      "ΚΑΤΑΛΑΒΟΝΤΑΣ ΤΑΝ ΧΩΡΑΝ ΚΑΙ ΤΕΙΧΙΞΑΝΤΑΣ",
      "ΤΑΝ ΠΟΛΙΝ ΤΑΣ ΠΟΛΙΟΣ ΟΙΚΟΠΕΔΟΝ ΕΝ ΕΚΑΣΤΟΝ",
      "ΤΑΣ ΤΕΤΕΙΧΙΣΜΕΝΑΣ ΕΞΑΙΡΕΤΟΝ ΣΥΝ ΤΩΙ ΜΕΡΕΙ",
    ],
  },
  diorama: {
    canvasAria: "Interaktivna živa rekonstrukcija antičke Lumbarde",
    startAr: "START AR",
    stopAr: "STOP AR",
    stopCamera: "ZAUSTAVI KAMERU",
    starting: "POKREĆEM…",
    retry: "POKUŠAJ PONOVNO",
    cameraError:
      "Kamera nije otvorena. U Chromeu otvori ⋮ → Postavke web-lokacije → Kamera → Dopusti, pa pokušaj ponovno.",
    cameraGuidanceTitle: "Živa kamera + 3D",
    cameraGuidanceText:
      "Mijenjaj prizore donjim kontrolama. Ovaj rezervni prikaz nije prostorno usidren.",
    surfaceGuidanceTitle: "Pronađi površinu",
    surfaceGuidanceText:
      "Polako pomiči mobitel. Kad se pojavi zlatni krug, dodirni ga.",
    launchAria: "Pokreni prikaz u proširenoj stvarnosti",
    canvasInstruction: "Povuci za obilazak · približi prstima · AR traži ravnu površinu",
    webglFallback:
      "3D prikaz nije dostupan na ovom uređaju. Kronovizor i video ostaju dostupni.",
  },
} satisfies SiteCopy;
