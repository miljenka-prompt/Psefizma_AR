# Lumbardska psefizma – AR rekonstrukcija

Interaktivna rekonstrukcija osnutka isejske naseobine i podjele zemlje u antičkoj Lumbardi. Projekt sadrži 3D dioramu, prikaz proširene stvarnosti, kronovizor-video i mušku Talosovu zvučnu interpretaciju teksta psefizme.

## Lokalno pokretanje

Preduvjet je Node.js 22 ili noviji.

```bash
npm ci
npm run dev
```

Za provjeru statičkog GitHub Pages paketa:

```bash
NEXT_PUBLIC_BASE_PATH=/Psefizma_AR npm run build:pages
```

Izlaz se stvara u `dist/client`.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` automatski:

1. instalira zaključane ovisnosti,
2. gradi statičku stranicu s baznom putanjom repozitorija,
3. učitava paket za GitHub Pages,
4. objavljuje ga u okruženje `github-pages`.

Pokreće se pri svakom slanju na granu `main`, a može se pokrenuti i ručno iz kartice **Actions**.

Očekivana javna adresa je:

<https://miljenka-prompt.github.io/Psefizma_AR/>

## Medijski sadržaj

- `public/media/lumbarda-chronovizor.mp4` – videorekonstrukcija
- `public/media/lumbarda-chronovizor-poster.jpg` – naslovni kadar
- `public/media/lumbarda-psephisma-talos.mp3` – muški Talosov glas
- `public/models/lumbarda/` – 3D modeli i teksture likova

Napomene o komponentama i sadržaju trećih strana nalaze se u `THIRD_PARTY.md` i mapi `vendor/`.
