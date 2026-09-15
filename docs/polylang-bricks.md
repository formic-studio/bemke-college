# Polylang i Bricks: Home Page PL

## Aktualny stan staging

Home Page (EN) ma język `en_GB`, a po instalacji Polylang ma przypięte tłumaczenie PL znajdujące się w koszu. W nagłówku HTML widać adres `/pl/home-page-polski__trashed/` jako `hreflang="pl"`. Na liście stron widać ikonę ołówka w kolumnie PL zamiast plusa oraz `Trash (1)`. Przed tworzeniem kolejnej strony PL otwórz **Pages > Trash** i sprawdź ten wpis. Jeśli jest to pusta strona przygotowana przez kreator, usuń ją na stałe i odśwież listę stron: przy Home Page powinien wrócić plus w kolumnie PL. Jeśli zawiera już pracę, przywróć ją i edytuj tę stronę zamiast tworzyć duplikat.

## Bricks: brak akcji Duplicate

Sprawdź **Bricks > Settings > General > Duplicate content** i wybierz **Enable**, po czym zapisz ustawienia i odśwież listę stron. Bricks pokazuje akcję Duplicate użytkownikom z uprawnieniem `edit_post`, chyba że ustawienie ją wyłącza. W Bricks Builder duplikat strony można też utworzyć przez Command Palette (`Cmd/Ctrl + K`) w zakresie **Post Types > Pages**.

Po usunięciu pustej strony z kosza użyj **Duplicate** przy Home Page EN. Duplikat Bricks kopiuje strukturę strony, ale nie staje się automatycznie tłumaczeniem Polylang. Otwórz nowy duplikat w edytorze WordPressa, ustaw język **Polski**, a w polu tłumaczenia **English** wybierz istniejącą Home Page. Zapisz jako szkic i sprawdź, czy obie strony są połączone w kolumnach językowych. Dopiero po przetłumaczeniu treści i podmianie shortcode'ów GetResponse opublikuj stronę PL.

## Własny przełącznik języków

Motyw podłącza oba istniejące linki `english` i `polish` oraz tor `.lang-switcher` do Polylang. Przełącza na tłumaczenie bieżącej strony, a gdy go brak, na opublikowaną stronę główną w drugim języku. Dopóki PL Home Page nie jest opublikowana, link i tor do PL pozostają nieaktywne. Działanie wymaga deployu child theme (assetów po `npm run build`); nie trzeba ręcznie wpisywać adresów URL w Bricks.

Po publikacji PL sprawdź EN→PL i PL→EN myszą i klawiaturą, także na mobile. Przetłumacz teksty paska WCAG oraz podmień formularze zgodnie z `docs/getresponse-forms.md`. Jeśli header lub footer są template'ami Bricks przypisanymi do EN, przygotuj ich tłumaczenia PL; Bricks nie wyświetla na stronie PL template'u przypisanego tylko do EN.
