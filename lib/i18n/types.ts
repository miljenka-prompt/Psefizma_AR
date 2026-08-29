export const SUPPORTED_LOCALES = ["hr", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type EvidenceKind =
  | "inscription"
  | "archaeology"
  | "interpretation"
  | "reconstruction";

export type SceneCopy = {
  eyebrow: string;
  title: string;
  body: string;
  evidence: ReadonlyArray<{ kind: EvidenceKind; text: string }>;
};

export type SiteCopy = {
  locale: Locale;
  localeLabel: string;
  metadata: {
    title: string;
    description: string;
  };
  languageSwitcherLabel: string;
  pronunciationNote: string;
  experience: {
    projectLabel: string;
    title: string;
    enterScene: string;
    returnToDiorama: string;
    returnDiorama: string;
    soundOn: string;
    soundOff: string;
    narrativeAria: string;
    liveReconstruction: string;
    placeTitle: string;
    placeDefault: string;
    placeSurveyors: string;
    sceneProgress: (current: number, total: number) => string;
    navigationAria: string;
    previousScene: string;
    nextScene: string;
    restart: string;
    nextTrace: string;
    enterLandDivision: string;
    enter: string;
    exit: string;
    immersiveControlsAria: string;
    sources: {
      summary: string;
      basis: string;
      links: ReadonlyArray<{ href: string; label: string }>;
    };
    evidenceLabels: Record<EvidenceKind, string>;
    scenes: ReadonlyArray<SceneCopy>;
  };
  chronovizor: {
    stageAria: string;
    videoAria: string;
    loading: string;
    play: string;
    inscriptionAria: string;
    openInscriptionAria: string;
    inscriptionAction: string;
    dialogTitle: string;
    dialogDescription: string;
    translationLabel: string;
    translation: string;
    reconstructedPartsNote: string;
    returnToChronovizor: string;
    inscriptionLines: ReadonlyArray<string>;
  };
  diorama: {
    canvasAria: string;
    startAr: string;
    stopAr: string;
    stopCamera: string;
    starting: string;
    retry: string;
    cameraError: string;
    cameraGuidanceTitle: string;
    cameraGuidanceText: string;
    surfaceGuidanceTitle: string;
    surfaceGuidanceText: string;
    launchAria: string;
    canvasInstruction: string;
    webglFallback: string;
  };
};
