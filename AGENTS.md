# AGENTS.md

## Język komunikacji

Domyślnie komunikuj się z właścicielem projektu po polsku.

Kod, nazwy funkcji, nazwy plików, hooki WordPressa, nazwy paczek npm, komendy terminalowe i techniczne identyfikatory zostawiaj po angielsku.

Nie tłumacz nazw technologii takich jak WordPress, Bricks Builder, Vite, GitHub Actions, Alpine.js, GSAP, PHP, JavaScript, CSS.

## Opis projektu

To repozytorium zawiera child theme WordPressa dla strony budowanej na Bricks Builder.

Bricks Builder jest używany jako wizualna warstwa edycji dla klienta. Klient może edytować layouty, template’y, sekcje i treści w panelu WordPressa.

To repozytorium jest źródłem prawdy dla kodu developerskiego:

- helpery PHP,
- assety CSS/JS budowane przez Vite,
- animacje,
- custom frontend behavior,
- automatyzacja deploymentu,
- dokumentacja projektu.

## Granice architektury

### Agent może edytować

Agent może edytować:

- `functions.php`
- `inc/**/*.php`
- `src/**/*.js`
- `src/**/*.css`
- `src/**/*.scss`, jeśli istnieje
- `vite.config.*`
- `package.json`
- `package-lock.json`
- `.github/workflows/*.yml`
- `docs/**/*.md`
- `bricks/templates/**/*`, ale tylko przy aktualizacji wyeksportowanych template’ów Bricks

### Agent nie może edytować

Agent nie może edytować:

- plików WordPress core,
- plików parent theme Bricks,
- `wp-content/uploads`,
- produkcyjnych dumpów bazy danych,
- `.env`,
- danych dostępowych do serwera,
- wygenerowanych plików w `dist/`, chyba że użytkownik wyraźnie poprosi o przygotowanie paczki release,
- layoutów Bricks bezpośrednio, jeśli nie zostały dostarczone jako eksportowane pliki template.

## Źródło prawdy

Kod znajduje się w tym repozytorium.

Layouty Bricks, global classes, template’y i treści stron mogą znajdować się w bazie danych WordPressa.

Jeżeli zmiana wymaga ręcznej pracy w Bricks Builder, agent musi opisać tę zmianę w:

```txt
docs/release-notes.md
```
