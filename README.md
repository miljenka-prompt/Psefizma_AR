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

## Jezična arhitektura

Sav tekst koji vidi posjetitelj izdvojen je iz komponenti u centralne jezične
rječnike. Hrvatska verzija nalazi se u `lib/i18n/locales/hr.ts`, a ugovor koji
moraju zadovoljiti svi jezici definiran je u `lib/i18n/types.ts`.

Hrvatski je zadani jezik i jedini trenutačno objavljeni rječnik. Zato javno
sučelje i poveznica ostaju nepromijenjeni, bez nedovršenog jezičnog prekidača.
Kada stručni pregled engleskog prijevoda bude završen:

1. kopirajte strukturu `hr.ts` u `lib/i18n/locales/en.ts` i unesite pregledani tekst,
2. uvezite `en` i registrirajte ga u objektu `dictionaries` u `lib/i18n/index.ts`.

Time se automatski uključuje prekidač **HR | EN**. Obje verzije ostaju na istoj
GitHub Pages adresi i koriste isti QR kod; engleska se verzija može izravno
dijeliti dodatkom `?lang=en`. Odabir se pamti u pregledniku, dok osnovna adresa
bez parametra i dalje otvara hrvatsku verziju.

## Medijski sadržaj

- `public/media/lumbarda-chronovizor.mp4` – videorekonstrukcija
- `public/media/lumbarda-chronovizor-poster.jpg` – naslovni kadar
- `public/media/lumbarda-psephisma-talos.mp3` – muški Talosov glas
- `public/models/lumbarda/` – 3D modeli i teksture likova

Napomene o komponentama i sadržaju trećih strana nalaze se u `THIRD_PARTY.md` i mapi `vendor/`.
