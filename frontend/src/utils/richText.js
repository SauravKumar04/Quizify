import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'img',
];

const ALLOWED_ATTR = ['src', 'alt', 'title'];

const normalizeBlockTags = (rawHtml = '') => {
  if (typeof window === 'undefined' || !rawHtml) return rawHtml || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  doc.querySelectorAll('div').forEach((divEl) => {
    const pEl = doc.createElement('p');
    pEl.innerHTML = divEl.innerHTML;
    divEl.replaceWith(pEl);
  });

  return doc.body.innerHTML;
};

export const sanitizeRichTextHtml = (html = '') => {
  const normalizedHtml = normalizeBlockTags(html);

  return DOMPurify.sanitize(normalizedHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  }).trim();
};

const extractTextFromHtml = (html = '') => {
  if (typeof window === 'undefined' || !html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export const richTextToPlainText = (html = '') => {
  const cleanHtml = sanitizeRichTextHtml(html);
  const text = extractTextFromHtml(cleanHtml);

  return text
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const hasRichTextContent = (html = '') => {
  const cleanHtml = sanitizeRichTextHtml(html);
  if (!cleanHtml) return false;

  const hasImage = /<img\s+[^>]*src=["'][^"']+["'][^>]*>/i.test(cleanHtml);
  const text = richTextToPlainText(cleanHtml);

  return hasImage || text.length > 0;
};

export const getRichTextPreview = (html = '', maxLength = 100) => {
  const text = richTextToPlainText(html);

  if (!text) return '';
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trimEnd()}...`;
};
