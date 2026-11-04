# Instagram feed

Integracja przechowuje maksymalnie 12 najnowszych postów Instagrama jako wpisy typu `instagram_post`. Istniejący Query Loop Bricks na stronie Home v2 korzysta bezpośrednio z tego typu wpisu, jego featured image oraz pola `ig_permalink`.

## Konfiguracja WordPress

1. W panelu WordPress przejdź do `Ustawienia → Bemke College Instagram`.
2. Wygeneruj silny, losowy token i zapisz go w polu `Nowy token webhooka`.
3. Skopiuj wyświetlany w panelu endpoint do scenariusza Make.

Endpoint:

```txt
POST /wp-json/bemke-college/v1/instagram-post
```

Wymagany nagłówek:

```txt
X-Secret-Token: <token ustawiony w WordPress i Make>
```

Token jest przechowywany w bazie wyłącznie jako hash. Alternatywnie może zostać ustawiony jako stała `BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN` w `wp-config.php`; w takim przypadku wartość z panelu nie jest używana.

## Payload Make

Endpoint przyjmuje pojedynczy obiekt posta albo tablicę pod kluczem `items` lub `posts`.

Przykład:

```json
{
  "items": [
    {
      "id": "instagram-media-id",
      "caption": "Opis posta",
      "media_url": "https://example.com/image.jpg",
      "thumbnail_url": "https://example.com/video-thumbnail.jpg",
      "permalink": "https://www.instagram.com/p/example/",
      "media_type": "IMAGE",
      "published_at": "2026-11-04T10:00:00+00:00"
    }
  ]
}
```

Wymagane po normalizacji są:

- ID: `id`, `post_id`, `media_id` lub `ig_post_id`,
- obraz: `media_url`, `image_url`, `image` lub `thumbnail_url`,
- link: `permalink`, `url`, `post_url` lub `content_landing_page`.

Dla wideo i karuzel `thumbnail_url` ma pierwszeństwo przed `media_url`. Odpowiedź endpointu podaje liczbę utworzonych, zaktualizowanych i pominiętych elementów.

## Wyświetlanie

Home v2 korzysta z Query Loop Bricks ustawionego na `instagram_post`. Alternatywnie feed można wyrenderować shortcode'em:

```txt
[bemke_college_instagram_feed limit="8" columns="4"]
```

Przycisk prowadzący do Instagrama jest osobnym elementem Bricks i jego adres trzeba ustawić ręcznie na profil Bemke College.
