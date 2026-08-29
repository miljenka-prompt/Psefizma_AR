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
import { LanguageSwitcher, useI18n } from "@/components/i18n-provider";
import { Progress } from "@/components/ui/progress";
import { Diorama } from "@/app/diorama";
import { Chronovizor } from "@/app/chronovizor";

export default function Home() {
  const { copy } = useI18n();
  const { experience } = copy;
  const scenes = experience.scenes;
  const evidenceLabels = experience.evidenceLabels;
  const [sceneIndex, setSceneIndex] = useState(0);
  const [viewpoint, setViewpoint] = useState<"diorama" | "inside">("diorama");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const stopAmbientRef = useRef<() => void>(() => undefined);
  const scene = scenes[sceneIndex];
  const progress = useMemo(
    () => ((sceneIndex + 1) / scenes.length) * 100,
    [sceneIndex, scenes.length],
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
          <p className="project-label">{experience.projectLabel}</p>
          <h1>{experience.title}</h1>
        </div>
        <div className="header-actions">
          <LanguageSwitcher />
          <Button
            variant="outline"
            className="header-status"
            onClick={toggleViewpoint}
            aria-label={
              viewpoint === "diorama" ? experience.enterScene : experience.returnToDiorama
            }
          >
            {viewpoint === "diorama" ? <Footprints /> : <Expand />}
            <span>
              {viewpoint === "diorama" ? experience.enterScene : experience.returnDiorama}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sound-toggle"
            onClick={() => setSoundEnabled((current) => !current)}
            aria-label={soundEnabled ? experience.soundOff : experience.soundOn}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
        </div>
      </header>

      <section className="experience-grid" aria-label={experience.narrativeAria}>
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
            {experience.liveReconstruction}
          </div>

          <div className="place-context">
            <MapPin aria-hidden="true" />
            <div>
              <strong>{experience.placeTitle}</strong>
              <span>
                {sceneIndex === 3
                  ? experience.placeSurveyors
                  : experience.placeDefault}
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
            <Progress
              value={progress}
              aria-label={experience.sceneProgress(sceneIndex + 1, scenes.length)}
            />
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

          <nav className="story-controls" aria-label={experience.navigationAria}>
            <Button
              variant="outline"
              size="lg"
              className="control-button control-back"
              onClick={goBack}
              disabled={sceneIndex === 0}
              aria-label={experience.previousScene}
            >
              <ArrowLeft />
            </Button>

            <Button size="lg" className="control-button control-next" onClick={goForward}>
              {sceneIndex < scenes.length - 1 ? (
                <>
                  {experience.nextTrace} <ArrowRight />
                </>
              ) : viewpoint === "diorama" ? (
                <>
                  {experience.enterLandDivision} <Footprints />
                </>
              ) : (
                <>
                  {experience.returnDiorama} <Expand />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-lg"
              className="control-button control-reset"
              onClick={restart}
              aria-label={experience.restart}
            >
              <RotateCcw />
            </Button>
          </nav>

          <details className="source-notes">
            <summary>
              <Info aria-hidden="true" /> {experience.sources.summary}
            </summary>
            <p>{experience.sources.basis}</p>
            <p>{copy.pronunciationNote}</p>
            <div className="source-links">
              {experience.sources.links.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </details>
        </aside>
      </section>

      <section className="immersive-toolbar" aria-label={experience.immersiveControlsAria}>
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
            aria-label={experience.previousScene}
          >
            <ArrowLeft />
          </Button>
          <Button className="immersive-view" onClick={toggleViewpoint}>
            {viewpoint === "diorama" ? <Footprints /> : <Expand />}
            <span>{viewpoint === "diorama" ? experience.enter : experience.exit}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSceneIndex((current) => Math.min(scenes.length - 1, current + 1))}
            disabled={sceneIndex === scenes.length - 1}
            aria-label={experience.nextScene}
          >
            <ArrowRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled((current) => !current)}
            aria-label={soundEnabled ? experience.soundOff : experience.soundOn}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
        </div>
      </section>
    </main>
  );
}
