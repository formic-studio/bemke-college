# Development

## Local Vite dev server

1. Uruchom `npm run dev`.
2. W lokalnym `wp-config.php` dodaj:

```php
define( 'BEMKE_COLLEGE_VITE_DEV_SERVER', 'http://localhost:5173' );
```

3. Aktywuj child theme `Bemke College` w WordPressie.

## Production assets

Uruchom `npm run build`. WordPress czyta plik `dist/manifest.json` i ładuje wygenerowane CSS/JS z katalogu `dist/assets/`.

## Bricks Builder

Layouty i global classes mogą mieszkać w bazie WordPressa. Jeżeli zmiana wymaga ręcznej aktualizacji w Bricks Builder, opisz ją w `docs/release-notes.md`.
