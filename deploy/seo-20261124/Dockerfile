FROM homa-studio-intake-front-20261123-kmg7t3:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY public-documents.mjs render-bot.mjs /
COPY deploy/seo-20261124/artifact/ /usr/share/nginx/html/
RUN sed -i -e 's|/assets/index-D9tZ2E9c\.js|/assets/index-R9r_oyoF.js|g' \
    -e 's|/assets/index-BDbtiCcT\.css|/assets/index-BDbtiCcT.css|g' \
    /usr/share/nginx/html/marketing/*.html /usr/share/nginx/html/offline-shell.html
