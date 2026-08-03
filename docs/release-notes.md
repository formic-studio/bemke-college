# Release Notes

## Unreleased

- Dodano dla `.mobile-scroll` dostępny, natywny poziomy rząd kart w zakresie 321–767 px: swipe i pasek przewijania pozostają funkcją przeglądarki, region otrzymuje nazwę, instrukcję, obsługę klawiatury i widoczny focus. Przy szerokości 320 px i mniejszej karty wracają do jednej kolumny zgodnie z WCAG 2.2 Reflow.
- Dodano dostępne odwracanie całych kart reverse-card z kompletną strukturą front/back. Na urządzeniach z myszą działa stabilny hover z możliwością zamknięcia przez Escape; klik, touch i klawiatura korzystają z niewidocznego przycisku oraz zsynchronizowanych aria-expanded, aria-hidden i inert. Nieruchoma, przezroczysta powłoka karty utrzymuje stabilny obszar interakcji, a cała widoczna powierzchnia front/back obraca się wewnątrz niej.
- Zablokowano pionowy overscroll ponad początkiem i końcem dokumentu.
- Dodano do dwóch zdjęć w sekcji Boarding desktopową animację powiększania i zwężania podczas scrollowania, przeniesioną z projektu Bemke.
- Przeniesiono do slidera zdjęć choreografię i działanie slidera z projektu Bemke: animacje GSAP, autoplay z pauzą, pełne sterowanie, swipe/drag oraz responsywne rozmiary slajdów.
- Utworzono bazowy szkielet child theme WordPressa dla Bricks Builder.
- Dodano integrację Vite dla assetów frontendowych.
- Dodano workflow CI sprawdzający build assetów i składnię PHP.
