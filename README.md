# Bemke College Child Theme

Child theme WordPressa dla strony budowanej na Bricks Builder. Repozytorium przechowuje kod developerski: helpery PHP, assety CSS/JS budowane przez Vite, custom frontend behavior, automatyzację i dokumentację.

## Wymagania

- WordPress z aktywnym parent theme `bricks`
- Node.js ^20.19.0 albo >=22.12.0
- npm 10+

## Instalacja

```bash
npm install
```

## Development

Uruchom Vite dev server:

```bash
npm run dev
```

W lokalnym `wp-config.php` włącz ładowanie assetów z dev servera:

```php
define( 'BEMKE_COLLEGE_VITE_DEV_SERVER', 'http://localhost:5173' );
```

Child theme załaduje wtedy `@vite/client` oraz `src/main.js` jako module scripts.

## Build produkcyjny

```bash
npm run build
```

Build trafia do `dist/`, a WordPress ładuje assety na podstawie `dist/manifest.json`.

## Typografia

W Bricks Builder rozmiary fontów są ustawione tylko dla desktopu. Wartości dla tablet i mobile oraz fluid design są obsługiwane w CSS przez `src/styles/font-sizes.css`.

Plik `font-sizes.css` jest źródłem prawdy dla aliasów font-size, zmiennych CSS i responsywnych nadpisań typografii.

## Struktura

- `functions.php` - entrypoint child theme
- `inc/` - helpery PHP
- `src/` - źródła assetów Vite
- `bricks/templates/` - eksportowane template’y Bricks, jeśli będą wersjonowane
- `docs/` - dokumentacja projektu i release notes

## Deploy

Workflow GitHub Actions sprawdza build Vite i składnię PHP. Wygenerowane `dist/` nie jest commitowane domyślnie; paczkę release można przygotować osobno, gdy będzie potrzebna.
