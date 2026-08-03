# Release Notes

## Unreleased

- Dodano dostępne odwracanie całych kart reverse-card z kompletną strukturą front/back. Na urządzeniach z myszą działa stabilny hover z możliwością zamknięcia przez Escape; klik, touch i klawiatura korzystają z niewidocznego przycisku oraz zsynchronizowanych aria-expanded, aria-hidden i inert. Powierzchnie są przełączane w połowie obrotu, co zapobiega wyświetlaniu lustrzanego frontu.
- Zablokowano pionowy overscroll ponad początkiem i końcem dokumentu.
- Dodano do dwóch zdjęć w sekcji Boarding desktopową animację powiększania i zwężania podczas scrollowania, przeniesioną z projektu Bemke.
- Przeniesiono do slidera zdjęć choreografię i działanie slidera z projektu Bemke: animacje GSAP, autoplay z pauzą, pełne sterowanie, swipe/drag oraz responsywne rozmiary slajdów.
- Utworzono bazowy szkielet child theme WordPressa dla Bricks Builder.
- Dodano integrację Vite dla assetów frontendowych.
- Dodano workflow CI sprawdzający build assetów i składnię PHP.
