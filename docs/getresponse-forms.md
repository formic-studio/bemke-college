# Formularze GetResponse w Bricks

Motyw ładuje Web Connect raz na każdej publicznej stronie. W Bricks używamy elementu **Shortcode** z `[bemke_college_getresponse_form form_id="..."]`; shortcode wypisuje natywny `<getresponse-form>`. Nie dodawaj drugiej kopii Web Connect w Bricks ani przez plugin.

Lighthouse wskazuje fonty Lato i DM Sans pobierane z `fonts.bunny.net`. Inicjatorem żądania jest GetResponse Web Connect (`gr-popups.js`), więc ustawienia fontów trzeba przejrzeć w edytorze projektu formularza i popupu GetResponse: nagłówki, tekst, pola i przyciski. Motyw nie pobiera tych krojów. Po zapisaniu zmian sprawdź w Network, czy pliki Lato i DM Sans przestały się pobierać.

| Miejsce | ID GetResponse | Zawartość elementu Shortcode |
| --- | --- | --- |
| Newsletter EN | `b2ac1302-032a-4e81-9c0f-46e8f9b223b1` | `[bemke_college_getresponse_form]` |
| Popup Open Day EN | `10649871-fa96-4bf5-ba9b-aec69df3d575` | `[bemke_college_getresponse_form form_id="10649871-fa96-4bf5-ba9b-aec69df3d575"]` |
| Newsletter PL | `74cf9962-c46b-4d14-9a90-14d29742bda2` | `[bemke_college_getresponse_form form_id="74cf9962-c46b-4d14-9a90-14d29742bda2"]` |
| Popup Open Day PL | `6fb5a863-5deb-488a-b0ad-76d999351734` | `[bemke_college_getresponse_form form_id="6fb5a863-5deb-488a-b0ad-76d999351734"]` |

Na stronie PL w sekcji zapisu podmień zawartość elementu Shortcode na wariant **Newsletter PL**. W `.popup-block > .contact-form` podmień zawartość elementu Shortcode na wariant **Popup Open Day PL**. Nie wklejaj obu formularzy do tego samego elementu.

Na 15 września 2026 staging `/pl/` zwraca 404 i publiczna lista stron WordPressa zawiera tylko stronę główną EN oraz politykę prywatności. Dlatego podmiana elementów PL wymaga najpierw utworzenia i opublikowania polskiego tłumaczenia strony głównej w Bricks/Polylang. Jeśli popup ma działać na stronie PL, musi ona być tłumaczeniem front page; obecny warunek w `inc/popup.php` uruchamia popup tylko na publicznej stronie głównej.

Po zapisaniu Bricks sprawdź na obu wersjach językowych, czy formularz się renderuje, czy można zaznaczyć zgodę i czy zapis testowy trafia na właściwą listę GetResponse. W ustawieniach każdego formularza uwzględnij domenę docelową i staging podczas testów.
