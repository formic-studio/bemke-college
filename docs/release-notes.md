# Release Notes

## Unreleased

- Dodano do `.scroll-highlight` lazy-loaded animację GSAP ScrollTrigger + SplitText, która przy scrollowaniu wzmacnia kolejne słowa z `opacity: 0.4` do pełnego koloru. Animacja działa od `top 80%` do `bottom 45%` i jest wygładzona przez `scrub: 0.8`. SplitText zachowuje pełne zdanie dla technologii asystujących, a przy ograniczeniu ruchu tekst wyświetla się od razu bez podziału i animacji. Stan początkowy `0.4` pozostaje świadomym ryzykiem kontrastu WCAG AA.
- Dodano dla `.mobile-scroll` dostępny, natywny poziomy rząd kart w zakresie 321–767 px: swipe i przewijanie pozostają funkcją przeglądarki, a wizualny pasek został ukryty; region otrzymuje nazwę, instrukcję, obsługę klawiatury i widoczny focus. Tor wychodzi wyłącznie poziomo poza `--padding-global`, pokazując fragment sąsiedniej karty po obu stronach. Przy szerokości 320 px i mniejszej karty wracają do jednej kolumny zgodnie z WCAG 2.2 Reflow.
- Zabezpieczono mobilny hamburger przed utworzeniem więcej niż jednej instancji podczas ponownej inicjalizacji frontendowego DOM.
- Dodano dostępne odwracanie całych kart reverse-card z kompletną strukturą front/back. Na urządzeniach z myszą działa stabilny hover z możliwością zamknięcia przez Escape; klik, touch i klawiatura korzystają z niewidocznego przycisku oraz zsynchronizowanych aria-expanded, aria-hidden i inert. Nieruchoma, przezroczysta powłoka karty utrzymuje stabilny obszar interakcji, a cała widoczna powierzchnia front/back obraca się wewnątrz niej.
- Zablokowano pionowy overscroll ponad początkiem i końcem dokumentu.
- Dodano do dwóch zdjęć w sekcji Boarding desktopową animację powiększania i zwężania podczas scrollowania, przeniesioną z projektu Bemke.
- Przeniesiono do slidera zdjęć choreografię i działanie slidera z projektu Bemke: animacje GSAP, autoplay z pauzą, pełne sterowanie, swipe/drag oraz responsywne rozmiary slajdów.
- Utworzono bazowy szkielet child theme WordPressa dla Bricks Builder.
- Dodano integrację Vite dla assetów frontendowych.
- Dodano workflow CI sprawdzający build assetów i składnię PHP.
