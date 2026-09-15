const DATA_ID = 'bemke-college-language-switch-data';
const READY_ATTRIBUTE = 'data-bemke-language-switch-ready';

function readDestinations() {
  const node = document.getElementById(DATA_ID);

  if (!node) {
    return null;
  }

  try {
    const data = JSON.parse(node.textContent || '{}');

    if (!['en', 'pl'].includes(data.current) || !data.urls) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function initLanguageSwitcher() {
  const data = readDestinations();

  if (!data) {
    return;
  }

  document.querySelectorAll('.lang-switcher-block').forEach((control) => {
    const track = control.querySelector(':scope > .lang-switcher');
    const links = Array.from(control.querySelectorAll(':scope > a'));

    if (!track || links.length < 2 || control.hasAttribute(READY_ATTRIBUTE)) {
      return;
    }

    control.setAttribute(READY_ATTRIBUTE, '1');
    control.classList.toggle('is-polish', data.current === 'pl');

    [['en', links[0]], ['pl', links[1]]].forEach(([language, link]) => {
      const url = data.urls[language];

      link.classList.toggle('in-active', language !== data.current);

      if (language === data.current) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }

      if (typeof url === 'string' && url) {
        link.href = url;
        link.removeAttribute('aria-disabled');
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
      }
    });

    const targetLanguage = data.current === 'en' ? 'pl' : 'en';
    const targetUrl = data.urls[targetLanguage];
    const hasTarget = typeof targetUrl === 'string' && Boolean(targetUrl);

    track.setAttribute('role', 'link');
    track.setAttribute(
      'aria-label',
      targetLanguage === 'pl' ? 'Przejdź do wersji polskiej' : 'Go to English version',
    );
    track.setAttribute('aria-disabled', String(!hasTarget));
    track.tabIndex = hasTarget ? 0 : -1;

    if (!hasTarget) {
      return;
    }

    const navigate = () => {
      window.location.assign(targetUrl);
    };

    track.addEventListener('click', navigate);
    track.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        navigate();
      }
    });
  });
}
