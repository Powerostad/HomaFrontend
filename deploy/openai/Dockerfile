ARG RUNTIME_IMAGE=nginx:alpine
FROM ${RUNTIME_IMAGE}

RUN command -v node >/dev/null || apk add --no-cache nodejs
COPY nginx.conf /etc/nginx/nginx.conf
COPY deploy/openai/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY render-bot-entrypoint.sh /docker-entrypoint.d/45-render-bot.sh
COPY render-bot.mjs blog-http.mjs public-documents.mjs /
COPY dist-blog-server/blog-render.mjs /blog-render.mjs
COPY dist/ /usr/share/nginx/html/
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/45-render-bot.sh \
    && test -s /usr/share/nginx/html/marketing/home.html
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/
CMD ["nginx", "-g", "daemon off;"]
