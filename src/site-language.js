export function isEnglishPage() {
  return document.documentElement.lang.toLowerCase().startsWith('en');
}

export function siteText(polish, english) {
  return isEnglishPage() ? english : polish;
}

