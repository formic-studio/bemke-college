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

Projekt musi być tworzony z dbałością o zgodność z WCAG, wysoką jakość accessibility oraz rozsądną wydajność frontendu.

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

## Workflow pracy

Domyślny zakres pracy agenta:

- wprowadzić zmianę w kodzie,
- uruchomić wymagane lokalne komendy, np. `npm run build`,
- zweryfikować wynik na tyle, na ile pozwala środowisko,
- zostawić zmiany w working tree do review właściciela projektu.

Agent nie powinien domyślnie wykonywać `git commit`, `git push` ani `Commit & Sync`.

Commit i push wykonuje właściciel projektu, chyba że właściciel wyraźnie poprosi agenta o:

- przygotowanie commita,
- wykonanie commita,
- wypchnięcie zmian do GitHub,
- przygotowanie paczki release.

## Deployment przez WP Pusher

Strona jest aktualizowana przez WP Pusher po pushu do GitHub.

WP Pusher pobiera pliki z repozytorium, ale nie uruchamia `npm run build` na serwerze.

Jeżeli zmiana dotyczy assetów Vite i ma być widoczna po deployu przez WP Pusher, trzeba przed commitem uruchomić:

```bash
npm run build
```

W takim przypadku wygenerowane pliki w `dist/` są częścią paczki deploy i mogą zostać dodane do commita, mimo że `dist/` jest normalnie traktowany jako katalog wygenerowany.

Agent może przygotować aktualne `dist/` po buildzie, ale decyzję o commicie i pushu zostawia właścicielowi projektu, chyba że właściciel poprosi inaczej.

## Performance

Przy zmianach wpływających na performance agent musi przed zakończeniem pracy sprawdzić:

- `npm run build` przechodzi poprawnie,
- nie dodano dużej zależności bez uzasadnienia,
- CSS nie wpływa przypadkowo na Bricks editor,
- animacje respektują `prefers-reduced-motion`,
- ciężkie animacje są inicjalizowane lazy,
- skrypty są ładowane jako deferred/module, jeśli to możliwe,
- assety nie są ładowane globalnie bez potrzeby,
- nowe fonty/obrazy mają uzasadnienie i notatkę optymalizacyjną.

## Accessibility

Przy zmianach UI, template’ów PHP i animacji agent musi:

- zachować obsługę klawiaturą,
- nie usuwać widocznych focus states,
- respektować `prefers-reduced-motion`,
- nie ukrywać ważnych treści wyłącznie za hoverem,
- nie tworzyć animacji blokujących czytanie,
- zachowywać semantic HTML w template’ach PHP.
