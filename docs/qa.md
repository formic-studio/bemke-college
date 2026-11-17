# Natywne zestawy Q&A

Moduł nie wymaga ACF ani innego pluginu pól. Zestawy i relacje ze stronami są przechowywane w natywnych danych WordPressa.

## Utworzenie zestawu

1. W panelu WordPress przejdź do `Q&A → Dodaj zestaw`.
2. W głównym polu tytułu wpisz nazwę administracyjną, np. `Scholarships EN`. Ta nazwa nie jest wyświetlana na stronie.
3. Ustaw widoczny nagłówek, wariant bez kategorii lub z kategoriami oraz zachowanie pierwszego pytania.
4. Dodaj pytania. W wariancie kategoryzowanym najpierw dodaj kategorię, a następnie jej pytania.
5. Zmień kolejność, przeciągając pytania lub kategorie za uchwyt.
6. Kliknij nazwę pytania lub strzałkę kategorii, aby zwinąć albo rozwinąć jej pola.
7. Opublikuj zestaw. Szkice można przypisać do strony, ale nie będą widoczne publicznie do czasu publikacji.

## Przypisanie do strony

1. Otwórz zwykłą edycję strony w WordPressie, nie edytor Bricks.
2. W panelu `Q&A` wybierz zestaw.
3. Pozostaw zaznaczone `Automatycznie dodaj po treści strony`, jeśli Q&A ma być ostatnią sekcją.
4. Zaktualizuj stronę.

Na liście `Q&A → Wszystkie zestawy` kolumna `Podpięte strony` pokazuje, gdzie dany zestaw jest używany. Lista `Strony` ma również kolumnę `Q&A` z nazwą przypisanego zestawu.

## Dokładne położenie w Bricks

Jeżeli sekcja ma się pojawić pomiędzy innymi blokami:

1. Przy przypisaniu do strony wyłącz `Automatycznie dodaj po treści strony`.
2. Wstaw w docelowym miejscu Bricks element `Shortcode`.
3. Wpisz `[bemke_college_qa]`.

Shortcode bez parametrów używa zestawu podpiętego do bieżącej strony. Można też jawnie wskazać zestaw przez `[bemke_college_qa id="123"]`, ale standardowo lepiej zachować relację w panelu strony.

## Wersje językowe

Każda strona EN i PL może wskazywać osobny zestaw, np. `Scholarships EN` oraz `Scholarships PL`. Dzięki temu Polylang nie musi synchronizować zagnieżdżonej treści Q&A.
