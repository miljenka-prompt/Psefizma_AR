"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteAsset } from "@/lib/site-path";

type ChronovizorProps = {
  stage: number;
  soundEnabled: boolean;
};

const inscriptionLines = [
  "ΑΓΑΘΑΙ ΤΥΧΑΙ ΕΦ ΙΕΡΟΜΝΑΜΟΝΟΣ ΠΡΑΞΙΔΑΜΟΥ",
  "ΜΑΧΑΝΕΟΣ ΣΥΝΘΗΚΑ ΟΙΚΙΣΤΑΝ ΙΣΣΑΙΩΝ",
  "ΚΑΙ ΠΥΛΛΟΥ ΚΑΙ ΤΟΥ ΥΟΥ ΔΑΖΟΥ ΤΑΔΕ",
  "ΣΥΝΕΓΡΑΨΑΝ ΟΙ ΟΙΚΙΣΤΑΙ ΚΑΙ ΕΔΟΞΕ ΤΩΙ ΔΑΜΩΙ",
  "ΛΑΒΕΙΝ ΕΞΑΙΡΕΤΟΝ ΤΟΥΣ ΠΡΩΤΟΥΣ",
  "ΚΑΤΑΛΑΒΟΝΤΑΣ ΤΑΝ ΧΩΡΑΝ ΚΑΙ ΤΕΙΧΙΞΑΝΤΑΣ",
  "ΤΑΝ ΠΟΛΙΝ ΤΑΣ ΠΟΛΙΟΣ ΟΙΚΟΠΕΔΟΝ ΕΝ ΕΚΑΣΤΟΝ",
  "ΤΑΣ ΤΕΤΕΙΧΙΣΜΕΝΑΣ ΕΞΑΙΡΕΤΟΝ ΣΥΝ ΤΩΙ ΜΕΡΕΙ",
] as const;

const spokenDecreeAudio = siteAsset("/media/lumbarda-psephisma-talos.mp3");

const croatianTranslation =
  "Neka je sa srećom. Za hijeromnamona Praksidama [u mjesecu Mahaneju utvrđen je ugovor o osnivanju naseobine između] Isejaca te Pila i njegova sina Daza. Ovo [su osnivači naseobine ugovorili] i narod je odlučio: da oni koji su prvi [zauzeli zemlju] i obzidali grad dobiju posebno zemljište za gradnju kuće unutar utvrđenoga grada, zajedno s pripadajućim dijelom.";

function Inscription() {
  return (
    <div className="psephisma-inscription" lang="grc" aria-label="Početak natpisa Lumbardske psefizme">
      {inscriptionLines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}

function SteleSurface({ closeup = false }: { closeup?: boolean }) {
  return (
    <div className={closeup ? "psephisma-stone is-closeup" : "psephisma-stone"}>
      <Inscription />
      {closeup && (
        <div className="psephisma-translation" lang="hr">
          <span>HRVATSKI PRIJEVOD</span>
          <p>{croatianTranslation}</p>
          <small>Rekonstruirani dijelovi označeni su uglatim zagradama.</small>
        </div>
      )}
    </div>
  );
}

export function Chronovizor({ stage, soundEnabled }: ChronovizorProps) {
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
      aria-label="Pogled kroz kronovizor na grčku Lumbardu"
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
        aria-label="Realistična videorekonstrukcija grčke naseobine u Lumbardi"
      />
      <audio ref={decreeAudioRef} src={spokenDecreeAudio} preload="auto" />

      <div className="chronovizor-shade" aria-hidden="true" />

      {!ready && !playBlocked && (
        <div className="chronovizor-loading" role="status">
          <span className="live-dot" aria-hidden="true" />
          Učitavam kronovizor…
        </div>
      )}

      {playBlocked && (
        <Button className="chronovizor-play" onClick={resumeVideo}>
          <Play aria-hidden="true" /> Pokreni kronovizor
        </Button>
      )}

      {finalScene && (
        <button
          type="button"
          className="psephisma-hero"
          onClick={() => setSteleOpen(true)}
          aria-label="Otvori uvećani, čitljivi natpis Lumbardske psefizme"
          aria-haspopup="dialog"
        >
          <SteleSurface />
          <span className="psephisma-hero-action">Dodirni psefizmu · pročitaj natpis</span>
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
            <DialogTitle>Lumbardska psefizma</DialogTitle>
            <DialogDescription>
              Uvećani prikaz početka autentičnog grčkog natpisa.
            </DialogDescription>
          </DialogHeader>
          <div className="psephisma-closeup">
            <SteleSurface closeup />
            <DialogClose asChild>
              <Button className="psephisma-return">
                <ArrowLeft aria-hidden="true" /> Povratak u kronovizor
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
