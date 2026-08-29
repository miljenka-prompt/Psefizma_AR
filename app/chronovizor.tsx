"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteAsset } from "@/lib/site-path";
import type { SiteCopy } from "@/lib/i18n";

type ChronovizorProps = {
  stage: number;
  soundEnabled: boolean;
};

const spokenDecreeAudio = siteAsset("/media/lumbarda-psephisma-talos.mp3");

type ChronovizorCopy = SiteCopy["chronovizor"];

function Inscription({ copy }: { copy: ChronovizorCopy }) {
  return (
    <div className="psephisma-inscription" lang="grc" aria-label={copy.inscriptionAria}>
      {copy.inscriptionLines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}

function SteleSurface({
  closeup = false,
  copy,
  locale,
  pronunciationNote,
}: {
  closeup?: boolean;
  copy: ChronovizorCopy;
  locale: SiteCopy["locale"];
  pronunciationNote: string;
}) {
  return (
    <div className={closeup ? "psephisma-stone is-closeup" : "psephisma-stone"}>
      <Inscription copy={copy} />
      {closeup && (
        <div className="psephisma-translation" lang={locale}>
          <span>{copy.translationLabel}</span>
          <p>{copy.translation}</p>
          <small>{copy.reconstructedPartsNote}</small>
          <small>{pronunciationNote}</small>
        </div>
      )}
    </div>
  );
}

export function Chronovizor({ stage, soundEnabled }: ChronovizorProps) {
  const { copy } = useI18n();
  const chronovizor = copy.chronovizor;
  const videoRef = useRef<HTMLVideoElement>(null);
  const decreeAudioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [steleOpen, setSteleOpen] = useState(false);
  const finalScene = stage === 5;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const play = async () => {
      video.muted = true;
      try {
        await video.play();
        if (!cancelled) setPlayBlocked(false);
      } catch {
        video.muted = true;
        try {
          await video.play();
          if (!cancelled) setPlayBlocked(false);
        } catch {
          if (!cancelled) setPlayBlocked(true);
        }
      }
    };

    void play();
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [soundEnabled]);

  useEffect(() => {
    const audio = decreeAudioRef.current;
    if (!audio) return;

    if (!soundEnabled) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Mobile browsers may defer playback until the next explicit sound gesture.
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [soundEnabled]);

  const resumeVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(
      () => setPlayBlocked(false),
      () => setPlayBlocked(true),
    );
  };

  return (
    <section
      className="chronovizor-stage"
      aria-label={chronovizor.stageAria}
      style={{
        backgroundImage: `url("${siteAsset("/media/lumbarda-chronovizor-poster.jpg")}")`,
      }}
    >
      <video
        ref={videoRef}
        className="chronovizor-video"
        src={siteAsset("/media/lumbarda-chronovizor.mp4")}
        poster={siteAsset("/media/lumbarda-chronovizor-poster.jpg")}
        preload="metadata"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        onCanPlay={() => setReady(true)}
        aria-label={chronovizor.videoAria}
      />
      <audio ref={decreeAudioRef} src={spokenDecreeAudio} preload="auto" />

      <div className="chronovizor-shade" aria-hidden="true" />

      {!ready && !playBlocked && (
        <div className="chronovizor-loading" role="status">
          <span className="live-dot" aria-hidden="true" />
          {chronovizor.loading}
        </div>
      )}

      {playBlocked && (
        <Button className="chronovizor-play" onClick={resumeVideo}>
          <Play aria-hidden="true" /> {chronovizor.play}
        </Button>
      )}

      {finalScene && (
        <button
          type="button"
          className="psephisma-hero"
          onClick={() => setSteleOpen(true)}
          aria-label={chronovizor.openInscriptionAria}
          aria-haspopup="dialog"
        >
          <SteleSurface
            copy={chronovizor}
            locale={copy.locale}
            pronunciationNote={copy.pronunciationNote}
          />
          <span className="psephisma-hero-action">{chronovizor.inscriptionAction}</span>
        </button>
      )}

      <Dialog open={steleOpen} onOpenChange={setSteleOpen}>
        <DialogContent
          className="psephisma-dialog"
          showCloseButton={false}
          style={{
            inset: 0,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100vw",
            height: "100dvh",
            maxWidth: "none",
            transform: "none",
            translate: "0 0",
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{chronovizor.dialogTitle}</DialogTitle>
            <DialogDescription>{chronovizor.dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="psephisma-closeup">
            <SteleSurface
              closeup
              copy={chronovizor}
              locale={copy.locale}
              pronunciationNote={copy.pronunciationNote}
            />
            <DialogClose asChild>
              <Button className="psephisma-return">
                <ArrowLeft aria-hidden="true" /> {chronovizor.returnToChronovizor}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
