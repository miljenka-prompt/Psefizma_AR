import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const buildRoot = new URL("../dist/client/", import.meta.url);

test("exports a GitHub Pages entry point", async () => {
  await access(new URL("index.html", buildRoot));
});

test("copies the complete audiovisual experience", async () => {
  const expectedAssets = [
    "media/lumbarda-chronovizor.mp4",
    "media/lumbarda-chronovizor-poster.jpg",
    "media/lumbarda-psephisma-talos.mp3",
    "models/lumbarda/Greek_Male_Peasant.gltf",
    "models/lumbarda/Greek_Female_Peasant.gltf",
  ];

  await Promise.all(expectedAssets.map((asset) => access(new URL(asset, buildRoot))));
});

test("uses the repository path in the exported page", async () => {
  const html = await readFile(new URL("index.html", buildRoot), "utf8");
  const expectedBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (expectedBasePath) {
    assert.match(html, new RegExp(`${expectedBasePath.replace("/", "\\/")}\\/`));
  }
});

test("stages HR and EN on one URL without publishing an unreviewed translation", async () => {
  const [types, index, provider, croatian, experience, chronovizor, diorama] =
    await Promise.all([
      readFile(new URL("../lib/i18n/types.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/i18n/index.ts", import.meta.url), "utf8"),
      readFile(new URL("../components/i18n-provider.tsx", import.meta.url), "utf8"),
      readFile(new URL("../lib/i18n/locales/hr.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/experience.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/chronovizor.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/diorama.tsx", import.meta.url), "utf8"),
    ]);

  assert.match(types, /SUPPORTED_LOCALES = \["hr", "en"\]/);
  assert.match(index, /DEFAULT_LOCALE: Locale = "hr"/);
  assert.match(index, /dictionaries[\s\S]*?= \{\s*hr,\s*\}/);
  assert.doesNotMatch(index, /import\s+\{\s*en\s*\}/);
  assert.match(provider, /new URLSearchParams\(window\.location\.search\)\.get\("lang"\)/);
  assert.match(provider, /url\.searchParams\.set\("lang", nextLocale\)/);
  assert.match(provider, /if \(locales\.length < 2\) return null/);
  assert.match(croatian, /Rekonstruirano čitanje dorskoga grčkog teksta/);
  assert.match(experience, /useI18n\(\)/);
  assert.match(chronovizor, /copy\.chronovizor/);
  assert.match(diorama, /copy\.diorama/);
});

test("stops ambient audio when AR or the page exits", async () => {
  const [experience, diorama] = await Promise.all([
    readFile(new URL("../app/experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/diorama.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /window\.addEventListener\("pagehide", stopPageAudio\)/);
  assert.match(experience, /document\.addEventListener\("visibilitychange", handleVisibilityChange\)/);
  assert.match(experience, /onArStop=\{stopSound\}/);
  assert.match(diorama, /if \(!disposed\) onArStop\?\.\(\)/);
  assert.equal(diorama.match(/onArStop\?\.\(\)/g)?.length, 2);
});

test("uses the archaeologically supported flat profiled stele", async () => {
  const diorama = await readFile(new URL("../app/diorama.tsx", import.meta.url), "utf8");

  assert.match(diorama, /profiled-flat-head/);
  assert.match(diorama, /Simple profiled cornice on a flat head/);
  assert.doesNotMatch(diorama, /pedimentShape|new THREE\.ConeGeometry\([^\n]*pediment/);
});
