export const DOCUMENT_EVENT = 'londway-document';

export interface DocumentDetail {
  html: string;
  filename: string;
  title: string;
}

export function downloadHtmlFile(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Open the document in the app. Nothing is saved until the customer chooses Save PDF. */
export function presentHtmlDocument(html: string, filename: string, title: string): 'preview' {
  window.dispatchEvent(new CustomEvent<DocumentDetail>(DOCUMENT_EVENT, {
    detail: { html, filename, title },
  }));
  return 'preview';
}
