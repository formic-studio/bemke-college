# Formularz kontaktowy

## Osadzenie w Bricks

Formularz jest renderowany przez shortcode:

```text
[bemke_college_contact_form]
```

Na stronie Contact należy pozostawić istniejącą sekcję, tło, białą kartę oraz nagłówki „questions?” / „We’re here to help.”. W miejsce dotychczasowego elementu **Form** (`#brxe-jxqhcs`) należy wstawić element **Shortcode** z powyższą wartością. Nie należy osadzać shortcode obok starego formularza, ponieważ wyświetliłyby się dwie kopie formularza.

Shortcode zawiera:

- imię i nazwisko,
- adres e-mail,
- opcjonalny telefon,
- temat wiadomości,
- treść wiadomości,
- wymagane potwierdzenie zapoznania się z polityką prywatności,
- komunikat wyniku oraz przycisk wysyłki.

Formularz działa także bez JavaScript. Z JavaScript wysyłka odbywa się bez przeładowania strony.

## Routing wiadomości

Adresy odbiorców są zapisane wyłącznie po stronie WordPressa w `inc/contact-form.php`. Formularz przesyła jedynie identyfikator tematu, a serwer wybiera adres z zaufanej mapy.

| Temat | To | Cc |
| --- | --- | --- |
| Admissions | admissions@bemke.pl | katarzyna.baran@bemke.pl |
| Scholarships & Financial Aid | admissions@bemke.pl | katarzyna.baran@bemke.pl |
| Open Days & School Visits | admissions@bemke.pl | — |
| Fees & Payments | katarzyna.baran@bemke.pl | — |
| Safeguarding | erik.lutley@bemke.pl | — |
| Careers | erik.lutley@bemke.pl | — |
| Press & Media | anna.kutrzuba@bemke.pl | — |
| Marketing | marta.stach@bemke.pl | — |
| Partnerships & Support | katarzyna.ostrowska@bemke.pl | — |
| General Enquiry | admissions@bemke.pl | — |

Mapę można zmienić w kodzie albo przez filtr `bemke_college_contact_topics`.

## Dostarczalność i test po wdrożeniu

Formularz używa `wp_mail()` i zachowuje nadawcę ustawionego przez WordPress lub plugin SMTP. Adres użytkownika jest ustawiany jako `Reply-To`, co ogranicza problemy z SPF/DMARC.

Po wdrożeniu należy:

1. upewnić się, że WordPress ma poprawnie skonfigurowany SMTP,
2. sprawdzić docelowy adres ustawiony jako WordPress Privacy Policy; gdy go nie ma, formularz użyje `/privacy-policy/`,
3. wysłać po jednej wiadomości testowej dla każdego tematu,
4. potwierdzić odbiór u adresata głównego oraz w `Cc`,
5. sprawdzić folder spam i działanie odpowiedzi na wiadomość.

Formularz ma nonce, pole-pułapkę, walidację serwerową oraz krótkie ograniczenie powtórnych wysyłek dla tej samej kombinacji adresu e-mail i IP.
