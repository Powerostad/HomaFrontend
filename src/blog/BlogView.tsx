import { Fragment } from 'react';
import { articleCover } from './editorial';
import { blogPath, categoryPath, safeLink, type BlogData, type BlogPost } from './types';

export const blogCopy = { journal: 'مجله هما', studio: 'طراحی فضای من', home: 'خانه', introduction: 'برای خانه‌ای که به تو می‌آید.', description: 'راهنماهای کاربردی برای انتخاب رنگ، پرده، روتختی و چیدمان؛ با نگاه یک طراح داخلی.', all: 'همه مطالب', read: 'خواندن مقاله', minutes: 'دقیقه مطالعه', previous: 'صفحه قبل', next: 'صفحه بعد', toc: 'در این مقاله', related: 'بیشتر بخوانید', empty: 'هنوز مقاله‌ای منتشر نشده است.', emptyHelp: 'راهنماهای طراحی و انتخاب وسایل خانه در این بخش منتشر می‌شوند.', cta: 'این ایده‌ها را در فضای خودت ببین.', ctaHelp: 'عکس اتاقت را به هما بده و طراحی متناسب با فضای خودت دریافت کن.', notFound: 'این مقاله پیدا نشد.', unavailable: 'دریافت مطالب فعلاً ممکن نیست.', retry: 'تلاش دوباره', back: 'بازگشت به مجله' };
export type BlogCopy = typeof blogCopy;
const date = (value: string) => { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''; };
export function inlineText(text: string) {
  return text.split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link && safeLink(link[2])) return <a key={i} href={safeLink(link[2])}>{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}
export function articleBlocks(body: string) { return body.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean); }
function ArticleBody({ body, format }: { body: string; format?: 'markdown' | 'html' }) {
  if (format === 'html') return <div className="journal-prose journal-imported-article" dangerouslySetInnerHTML={{ __html: body }} />;
  return <div className="journal-prose">{articleBlocks(body).map((block, i) => {
    if (/^#{1,3} /.test(block)) { const title = block.replace(/^#{1,3} /, ''); return block.startsWith('### ') ? <h3 id={`section-${i}`} key={i}>{title}</h3> : <h2 id={`section-${i}`} key={i}>{title}</h2>; }
    if (block.split('\n').every(line => line.startsWith('- '))) return <ul key={i}>{block.split('\n').map((line, j) => <li key={j}>{inlineText(line.slice(2))}</li>)}</ul>;
    return <p key={i}>{inlineText(block)}</p>;
  })}</div>;
}
function EditorialNote() {
  return <details className="journal-editorial-note"><summary>دربارهٔ این راهنما</summary><p>این مطلب یک راهنمای تصمیم‌گیری برای انتخاب و چیدمان است. اندازه‌های نمونه را با ابعاد واقعی اتاق و کالا تطبیق بدهید. تصاویر الهام‌بخش و تصویرسازی‌ها، به‌تنهایی گزارش اجرای یک پروژه یا تأیید کیفیت کالا نیستند.</p><p>اگر نکته‌ای نیاز به اصلاح دارد، عنوان مقاله و توضیح خود را به <a href="mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM">پشتیبانی هما</a> بفرستید.</p></details>;
}
function PostCard({ post, copy }: { post: BlogPost; copy: BlogCopy }) {
  const image = articleCover(post)?.src;
  return <article className="journal-card"><a href={blogPath(post.slug)} className="journal-cover" tabIndex={-1} aria-hidden="true">{image ? <img src={image} alt="" loading="lazy" width="900" height="675" /> : <span className="journal-type-cover"><span>HOMA JOURNAL</span><b>{post.category.title}</b></span>}</a><div className="journal-card-meta"><a href={categoryPath(post.category.slug)}>{post.category.title}</a><span>{post.reading_minutes.toLocaleString('fa-IR')} {copy.minutes}</span></div><h2><a href={blogPath(post.slug)}>{post.title}</a></h2><p>{post.excerpt}</p><a className="journal-read" href={blogPath(post.slug)}>{copy.read}<span aria-hidden="true">←</span></a></article>;
}
export function BlogView({ data, copy = blogCopy, retryHref = '/blog' }: { data: BlogData; copy?: BlogCopy; retryHref?: string }) {
  const post = data.kind === 'article' ? data.post : null;
  const cover = post ? articleCover(post) : null;
  const toc = post && post.body_format !== 'html' ? articleBlocks(post.body || '').map((b, i) => ({ title: b.replace(/^#{1,3} /, ''), id: `section-${i}`, heading: /^#{1,3} /.test(b) })).filter(b => b.heading) : [];
  return <div className="homa-journal" dir="rtl"><a className="journal-skip" href="#journal-main">{copy.read}</a><header className="journal-header"><a href="/" className="journal-logo" aria-label="HOMA">HOMA</a><nav aria-label={copy.journal}><a href="/">{copy.home}</a><a href="/blog" aria-current={data.kind === 'index' ? 'page' : undefined}>{copy.journal}</a><a href="/studio">{copy.studio}</a></nav></header>
  <main id="journal-main" className="journal-main">
  {data.kind === 'index' && <><section className="journal-intro"><span className="journal-eyebrow">HOMA JOURNAL</span><h1>{data.category?.title || copy.journal}</h1><p className="journal-deck">{data.category?.description || copy.introduction}</p>{!data.category && <p className="journal-description">{copy.description}</p>}</section><nav className="journal-categories" aria-label={copy.all}><a href="/blog" aria-current={!data.category ? 'page' : undefined}>{copy.all}</a>{data.categories.map(c => <a key={c.slug} href={categoryPath(c.slug)} aria-current={data.category?.slug === c.slug ? 'page' : undefined}>{c.title}</a>)}</nav>{data.posts.length ? <div className="journal-grid">{data.posts.map(p => <PostCard key={p.slug} post={p} copy={copy} />)}</div> : <div className="journal-empty"><h2>{copy.empty}</h2><p>{copy.emptyHelp}</p></div>}{(data.page > 1 || data.has_next) && <nav className="journal-pagination" aria-label={copy.journal}>{data.page > 1 && <a href={`${data.category ? categoryPath(data.category.slug) : '/blog'}${data.page > 2 ? `?page=${data.page - 1}` : ''}`}>{copy.previous}</a>}<span>{data.page.toLocaleString('fa-IR')}</span>{data.has_next && <a href={`${data.category ? categoryPath(data.category.slug) : '/blog'}?page=${data.page + 1}`}>{copy.next}</a>}</nav>}</>}
  {post && <article><nav className="journal-breadcrumb" aria-label={copy.journal}><a href="/blog">{copy.journal}</a><span aria-hidden="true">/</span><a href={categoryPath(post.category.slug)}>{post.category.title}</a></nav><header className="journal-article-head"><span className="journal-eyebrow">{post.category.title}</span><h1>{post.title}</h1><p className="journal-deck">{post.excerpt}</p><div className="journal-byline"><span>{post.author_name}</span><time dateTime={post.published_at}>{date(post.published_at)}</time><span>{post.reading_minutes.toLocaleString('fa-IR')} {copy.minutes}</span></div></header>{cover && <figure className="journal-hero"><img src={cover.src} alt={cover.alt} width="1440" height="900" fetchPriority="high" />{cover.inspiration && <figcaption>تصویر الهام‌بخش هما؛ این تصویر گزارش اجرای پروژه یا عکس یک کالای مشخص نیست.</figcaption>}</figure>}<div className={toc.length > 1 ? "journal-reading" : "journal-reading journal-reading-without-toc"}>{toc.length > 1 && <aside><details open><summary>{copy.toc}</summary><nav>{toc.map(h => <a key={h.id} href={`#${h.id}`}>{h.title}</a>)}</nav></details></aside>}<div><ArticleBody body={post.body || ''} format={post.body_format} /><EditorialNote /></div></div>{data.kind === 'article' && data.related.length > 0 && <section className="journal-related"><h2>{copy.related}</h2><div className="journal-grid">{data.related.map(p => <PostCard key={p.slug} post={p} copy={copy} />)}</div></section>}</article>}
  {(data.kind === 'not-found' || data.kind === 'unavailable') && <section className="journal-empty" role="status"><h1>{data.kind === 'not-found' ? copy.notFound : copy.unavailable}</h1>{data.kind === 'unavailable' && <a href={retryHref}>{copy.retry}</a>}<a href="/blog">{copy.back}</a></section>}
  <section className="journal-cta"><div><h2>{copy.cta}</h2><p>{copy.ctaHelp}</p></div><a href="/studio">{copy.studio}<span aria-hidden="true">←</span></a></section></main><footer className="journal-footer"><a className="journal-logo" href="/">HOMA</a><nav><a href="/blog">{copy.journal}</a><a href="/studio">{copy.studio}</a><a href="/support">پشتیبانی</a><a href="/privacy">حریم خصوصی</a></nav></footer></div>;
}
