# Polylang i Bricks: Home Page PL

## Aktualny stan staging

Home Page (EN) ma język `en_GB`. W trakcie instalacji Polylang powstało puste tłumaczenie PL w koszu, które zostało później zastąpione stroną Home Page PL (ID 728). Ta nowa strona jest obecnie opublikowana z adresem `/pl/home-page-pl/`, ale adres zwraca 404; `/pl/` też zwraca 404. EN Home Page nadal ma plus w kolumnie PL, więc stron nie połączono jako tłumaczeń. Próba **Edit with Bricks** przy PL kończy się komunikatem **Invalid post type**. Publiczne API WordPressa wskazuje, że ID 728 jest zwykłą stroną (`type: page`), więc nie należy zmieniać jej typu wpisu ani slugu w ciemno.

## Naprawa strony PL i Bricks

1. W **Pages > All Pages > Home Page PL > Quick Edit** ustaw status **Draft** i zapisz, jeśli treść PL nie jest jeszcze gotowa.
2. W **Settings > Permalinks** kliknij **Save Changes** bez zmiany struktury adresów. To odświeża reguły routingu WordPressa.
3. W **Bricks > Settings > General > Post types** sprawdź, czy **Pages** jest włączone. EN Home Page korzysta z Bricks, więc to kontrola konfiguracji, nie potwierdzona przyczyna.
4. Otwórz **Home Page PL > Edit** w zwykłym edytorze WordPressa. W panelu **Languages** sprawdź język **Polski**, a w polu tłumaczenia **English** wskaż **Home Page**. Zapisz szkic pełnym przyciskiem **Save Draft / Update**.
5. Z tego edytora ponownie kliknij **Edit with Bricks**. Jeżeli błąd nadal wystąpi, sprawdź, czy angielska Home Page nadal otwiera się w Bricks; jeśli tak, problem dotyczy tłumaczenia PL lub jego relacji, a nie globalnego ustawienia Pages.

Po połączeniu tłumaczeń sprawdź **Languages > Settings > URL modifications**: dla statycznej strony głównej ustaw URL z samym kodem języka. Po ukończeniu i publikacji strony PL oczekiwany adres to `/pl/`, a nie `/pl/home-page-pl/`.

## Bricks: brak akcji Duplicate

Sprawdź **Bricks > Settings > General > Duplicate content** i wybierz **Enable**, po czym zapisz ustawienia i odśwież listę stron. Bricks pokazuje akcję Duplicate użytkownikom z uprawnieniem `edit_post`, chyba że ustawienie ją wyłącza. W Bricks Builder duplikat strony można też utworzyć przez Command Palette (`Cmd/Ctrl + K`) w zakresie **Post Types > Pages**.

Po usunięciu pustej strony z kosza użyj **Duplicate** przy Home Page EN. Duplikat Bricks kopiuje strukturę strony, ale nie staje się automatycznie tłumaczeniem Polylang. Otwórz nowy duplikat w edytorze WordPressa, ustaw język **Polski**, a w polu tłumaczenia **English** wybierz istniejącą Home Page. Zapisz jako szkic i sprawdź, czy obie strony są połączone w kolumnach językowych. Dopiero po przetłumaczeniu treści i podmianie shortcode'ów GetResponse opublikuj stronę PL.

## Własny przełącznik języków

Motyw podłącza oba istniejące linki `english` i `polish` oraz tor `.lang-switcher` do Polylang. Przełącza na tłumaczenie bieżącej strony, a gdy go brak, na opublikowaną stronę główną w drugim języku. Dopóki PL Home Page nie jest opublikowana, link i tor do PL pozostają nieaktywne. Działanie wymaga deployu child theme (assetów po `npm run build`); nie trzeba ręcznie wpisywać adresów URL w Bricks.

Po publikacji PL sprawdź EN→PL i PL→EN myszą i klawiaturą, także na mobile. Przetłumacz teksty paska WCAG oraz podmień formularze zgodnie z `docs/getresponse-forms.md`. Jeśli header lub footer są template'ami Bricks przypisanymi do EN, przygotuj ich tłumaczenia PL; Bricks nie wyświetla na stronie PL template'u przypisanego tylko do EN.
