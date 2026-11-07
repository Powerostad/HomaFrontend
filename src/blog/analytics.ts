import { bindArticleAnalytics } from '../analytics/blogFunnel';

const root = document.querySelector<HTMLElement>('[data-article-path]');
if (root) bindArticleAnalytics(root);
