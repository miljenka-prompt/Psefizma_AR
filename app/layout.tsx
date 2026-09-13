import type { Metadata } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { getCopy, DEFAULT_LOCALE } from "@/lib/i18n";
import { siteAsset } from "@/lib/site-path";
import "./globals.css";

export const dynamic = "force-static";

const defaultCopy = getCopy(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: defaultCopy.metadata.title,
  description: defaultCopy.metadata.description,
  icons: {
    icon: siteAsset("/favicon.svg"),
    shortcut: siteAsset("/favicon.svg"),
  },
};

const modeScript = `
(() => {
  const KEY = 'psefizma-display-mode';
  const labels = {
    hr: { scientific: 'Znanstvena', visitor: 'Za posjetitelje', aria: 'Razina prikaza' },
    en: { scientific: 'Scientific', visitor: 'For visitors', aria: 'Display level' }
  };
  let mode = localStorage.getItem(KEY) === 'visitor' ? 'visitor' : 'scientific';
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'hr';
  const apply = () => {
    document.body.classList.toggle('visitor-mode', mode === 'visitor');
    const root = document.querySelector('[data-display-mode]');
    if (!root) return;
    const l = labels[lang()];
    root.setAttribute('aria-label', l.aria);
    const s = root.querySelector('[data-mode="scientific"]');
    const v = root.querySelector('[data-mode="visitor"]');
    s.textContent = l.scientific;
    v.textContent = l.visitor;
    s.classList.toggle('is-active', mode === 'scientific');
    v.classList.toggle('is-active', mode === 'visitor');
    s.setAttribute('aria-pressed', String(mode === 'scientific'));
    v.setAttribute('aria-pressed', String(mode === 'visitor'));
  };
  const mount = () => {
    const target = document.querySelector('.header-actions');
    if (!target || target.querySelector('[data-display-mode]')) return false;
    const root = document.createElement('div');
    root.className = 'portfolio-mode-switcher';
    root.dataset.displayMode = '';
    root.setAttribute('role','group');
    root.innerHTML = '<button type="button" data-mode="scientific"></button><button type="button" data-mode="visitor"></button>';
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mode]');
      if (!button) return;
      mode = button.dataset.mode;
      localStorage.setItem(KEY, mode);
      apply();
    });
    target.prepend(root);
    apply();
    return true;
  };
  const observer = new MutationObserver(() => { mount(); apply(); });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['lang']});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
  apply();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <footer
          aria-label="Project credits"
          style={{
            padding: "14px 20px 20px",
            textAlign: "center",
            fontSize: "0.72rem",
            lineHeight: 1.55,
            opacity: 0.68,
            letterSpacing: "0.02em",
          }}
        >
          <strong>Concept, authorship &amp; creative direction:</strong> Miljenka Ćurković
          <span aria-hidden="true"> · </span>
          <strong>AI architecture &amp; development collaboration:</strong> ChatGPT — GPT-5.6 Sol (OpenAI)
        </footer>
        <style>{`
          .portfolio-mode-switcher{display:flex;align-items:center;padding:3px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(8,11,14,.7)}
          .portfolio-mode-switcher button{min-height:34px;padding:0 11px;border:0;border-radius:999px;background:transparent;color:inherit;opacity:.7;font:inherit;font-size:.72rem;font-weight:750;cursor:pointer;white-space:nowrap}
          .portfolio-mode-switcher button.is-active{background:rgba(255,255,255,.92);color:#111;opacity:1}
          body.visitor-mode .evidence-ledger,body.visitor-mode .source-notes{display:none!important}
          body.visitor-mode .scene-body{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
          @media(max-width:760px){.portfolio-mode-switcher button{padding:0 8px;font-size:.66rem}}
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </body>
    </html>
  );
}
