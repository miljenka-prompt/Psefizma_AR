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
