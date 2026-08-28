"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  Footprints,
  Info,
  MapPin,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Diorama } from "@/app/diorama";
import { Chronovizor } from "@/app/chronovizor";

type EvidenceKind =
  | "inscription"
  | "archaeology"
  | "interpretation"
  | "reconstruction";

type Scene = {
  eyebrow: string;
  title: string;
  body: string;
  evidence: Array<{ kind: EvidenceKind; text: string }>;
};

const scenes: Scene[] = [
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
];

const evidenceLabels: Record<EvidenceKind, string> = {
  inscription: "NATPIS",
  archaeology: "ARHEOLOGIJA",
  interpretation: "TUMAČENJE",
  reconstruction: "REKONSTRUKCIJA",
};

export default function Home() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [viewpoint, setViewpoint] = useState<"diorama" | "inside">("diorama");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const stopAmbientRef = useRef<() => void>(() => undefined);
  const scene = scenes[sceneIndex];
  const progress = useMemo(
    () => ((sceneIndex + 1) / scenes.length) * 100,
    [sceneIndex],
  );

  const stopSound = useCallback(() => {
    stopAmbientRef.current();
    setSoundEnabled(false);
  }, []);

  useEffect(() => {
    if (!soundEnabled || viewpoint === "inside") return;

    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.18;
    master.connect(context.destination);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1;
    }

    const sea = context.createBufferSource();
    const seaFilter = context.createBiquadFilter();
    const seaGain = context.createGain();
    sea.buffer = noiseBuffer;
    sea.loop = true;
    seaFilter.type = "lowpass";
    seaFilter.frequency.value = 620;
    seaGain.gain.value = 0.09;
    sea.connect(seaFilter).connect(seaGain).connect(master);

    const wave = context.createOscillator();
    const waveDepth = context.createGain();
    wave.frequency.value = 0.11;
    waveDepth.gain.value = 0.055;
    wave.connect(waveDepth).connect(seaGain.gain);

    const wind = context.createBufferSource();
    const windFilter = context.createBiquadFilter();
    const windGain = context.createGain();
    wind.buffer = noiseBuffer;
    wind.loop = true;
    windFilter.type = "bandpass";
    windFilter.frequency.value = 1250;
    windFilter.Q.value = 0.7;
    windGain.gain.value = 0.025;
    wind.connect(windFilter).connect(windGain).connect(master);

    const voices = [116, 143, 174].map((frequency, index) => {
      const voice = context.createOscillator();
      const voiceGain = context.createGain();
      voice.type = "triangle";
      voice.frequency.value = frequency;
      voiceGain.gain.value = 0.004 + index * 0.001;
      voice.connect(voiceGain).connect(master);
      voice.start();
      return voice;
    });

    void context.resume();
    sea.start();
    wind.start();
    wave.start();

    let stopped = false;
    const stopAmbient = () => {
      if (stopped) return;
      stopped = true;
      sea.stop();
      wind.stop();
      wave.stop();
      voices.forEach((voice) => voice.stop());
      void context.close();
    };

    stopAmbientRef.current = stopAmbient;

    return () => {
      if (stopAmbientRef.current === stopAmbient) {
        stopAmbientRef.current = () => undefined;
      }
      stopAmbient();
    };
  }, [soundEnabled, viewpoint]);

  useEffect(() => {
    const stopPageAudio = () => {
      stopAmbientRef.current();
      document.querySelectorAll<HTMLAudioElement>("audio").forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setSoundEnabled(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopPageAudio();
    };

    window.addEventListener("pagehide", stopPageAudio);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", stopPageAudio);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("chronovizor-active", viewpoint === "inside");
    return () => document.body.classList.remove("chronovizor-active");
  }, [viewpoint]);

  const goBack = () => {
    setSceneIndex((current) => Math.max(0, current - 1));
  };

  const enterHeroScene = () => {
    setSoundEnabled(true);
    setViewpoint("inside");
  };

  const goForward = () => {
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex((current) => current + 1);
      return;
    }
    if (viewpoint === "diorama") {
      enterHeroScene();
    } else {
      setViewpoint("diorama");
    }
  };

  const restart = () => {
    setSceneIndex(0);
    setViewpoint("diorama");
  };

  const toggleViewpoint = () => {
    if (viewpoint === "diorama") {
      enterHeroScene();
      return;
    }
    setViewpoint("diorama");
  };

  return (
    <main className="experience-shell">
      <header className="site-header">
        <div>
          <p className="project-label">QUANTUMHIPPIE · RADNA REKONSTRUKCIJA</p>
          <h1>Lumbardska psefizma</h1>
        </div>
        <div className="header-actions">
          <Button
            variant="outline"
            className="header-status"
            onClick={toggleViewpoint}
            aria-label={viewpoint === "diorama" ? "Uđi u prizor" : "Vrati se na dioramu"}
          >
            {viewpoint === "diorama" ? <Footprints /> : <Expand />}
            <span>{viewpoint === "diorama" ? "Uđi u prizor" : "Vrati dioramu"}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sound-toggle"
            onClick={() => setSoundEnabled((current) => !current)}
            aria-label={soundEnabled ? "Isključi ambijentalni zvuk" : "Uključi ambijentalni zvuk"}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
        </div>
      </header>

      <section className="experience-grid" aria-label="AR narativ">
        <div className="visual-stage">
          <Diorama
            stage={sceneIndex}
            viewpoint={viewpoint}
            active={viewpoint === "diorama"}
            onArStop={stopSound}
          />
          {viewpoint === "inside" && (
            <Chronovizor stage={sceneIndex} soundEnabled={soundEnabled} />
          )}

          <div className="visual-caption">
            <span className="live-dot" aria-hidden="true" />
            ŽIVA REKONSTRUKCIJA · V0.5.4
          </div>

          <div className="place-context">
            <MapPin aria-hidden="true" />
            <div>
              <strong>Koludrt / bilo koja ravna podloga</strong>
              <span>
                {sceneIndex === 3
                  ? "Uđi među mjernike: postolje nestaje, a kamera se spušta u visinu čovjeka."
                  : "AR sidrenje koristi površinu koju kamera pronađe."}
              </span>
            </div>
          </div>
        </div>

        <aside className="story-panel" aria-live="polite">
          <div className="story-progress">
            <div className="progress-copy">
              <span>{String(sceneIndex + 1).padStart(2, "0")}</span>
              <span>{String(scenes.length).padStart(2, "0")}</span>
            </div>
            <Progress value={progress} aria-label={`Prizor ${sceneIndex + 1} od ${scenes.length}`} />
          </div>

          <div className="story-copy">
            <p className="scene-eyebrow">{scene.eyebrow}</p>
            <h2>{scene.title}</h2>
            <p className="scene-body">{scene.body}</p>
          </div>

          <div className="evidence-ledger">
            {scene.evidence.map((item) => (
              <article key={item.text} className={`evidence evidence-${item.kind}`}>
                <span>{evidenceLabels[item.kind]}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <nav className="story-controls" aria-label="Kretanje kroz prizore">
            <Button
              variant="outline"
              size="lg"
              className="control-button control-back"
              onClick={goBack}
              disabled={sceneIndex === 0}
              aria-label="Prethodni prizor"
            >
              <ArrowLeft />
            </Button>

            <Button size="lg" className="control-button control-next" onClick={goForward}>
              {sceneIndex < scenes.length - 1 ? (
                <>
                  Sljedeći trag <ArrowRight />
                </>
              ) : viewpoint === "diorama" ? (
                <>
                  Uđi u podjelu zemlje <Footprints />
                </>
              ) : (
                <>
                  Vrati dioramu <Expand />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-lg"
              className="control-button control-reset"
              onClick={restart}
              aria-label="Počni ispočetka"
            >
              <RotateCcw />
            </Button>
          </nav>

          <details className="source-notes">
            <summary>
              <Info aria-hidden="true" /> Izvori i granice rekonstrukcije
            </summary>
            <p>
              Prvi sloj temelji se na opisu Arheološkog muzeja u Zagrebu, novom
              čitanju ulomka iz 2021. i objavljenom prijevodu natpisa. Tijek
              podizanja stele i izgled naselja ostaju radne hipoteze.
            </p>
            <div className="source-links">
              <a
                href="https://amz.hr/hr/virtualni-muzej/vodici-kroz-stalni-postav/vodic-kroz-stalni-postav-anticke-zbirke-arheoloskog-muzeja-u-zagrebu/grci-na-istocnoj-obali-jadrana/lumbardska-psefizma/"
                target="_blank"
                rel="noreferrer"
              >
                Arheološki muzej u Zagrebu
              </a>
              <a
                href="https://www.researchgate.net/publication/366399086_A_NEW_FRAGMENT_OF_THE_GREEK_LAND_DIVISION_DECREE_FROM_LUMBARDA_ON_THE_ISLAND_OF_KORCULA"
                target="_blank"
                rel="noreferrer"
              >
                Marohnić · Potrebica · Vuković, 2021.
              </a>
              <a href="https://www.attalus.org/docs/sig1/s141.html" target="_blank" rel="noreferrer">
                Objavljeni tekst i prijevod
              </a>
              <a
                href="https://quaternius.com/packs/universalbasecharacters.html"
                target="_blank"
                rel="noreferrer"
              >
                CC0 baza 3D likova · Quaternius
              </a>
            </div>
          </details>
        </aside>
      </section>

      <section className="immersive-toolbar" aria-label="Kontrole živog prizora">
        <div className="immersive-copy" aria-live="polite">
          <span>
            {String(sceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")} · {scene.eyebrow}
          </span>
          <strong>{scene.title}</strong>
        </div>
        <div className="immersive-actions">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSceneIndex((current) => Math.max(0, current - 1))}
            disabled={sceneIndex === 0}
            aria-label="Prethodni prizor"
          >
            <ArrowLeft />
          </Button>
          <Button className="immersive-view" onClick={toggleViewpoint}>
            {viewpoint === "diorama" ? <Footprints /> : <Expand />}
            <span>{viewpoint === "diorama" ? "Uđi" : "Izađi"}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSceneIndex((current) => Math.min(scenes.length - 1, current + 1))}
            disabled={sceneIndex === scenes.length - 1}
            aria-label="Sljedeći prizor"
          >
            <ArrowRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled((current) => !current)}
            aria-label={soundEnabled ? "Isključi ambijentalni zvuk" : "Uključi ambijentalni zvuk"}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
        </div>
      </section>
    </main>
  );
}
