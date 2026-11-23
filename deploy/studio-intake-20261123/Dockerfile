FROM homa-wardrobe-20261121-bic7ek:latest
COPY deploy/studio-intake-20261123/artifact/ /usr/share/nginx/html/
RUN sed -i \
  -e 's|/assets/index-TImBqkyd-wardrobe-358fbeab\.js|/assets/index-D9tZ2E9c.js|g' \
  -e 's|/assets/index-h5fxgB-l\.css|/assets/index-BDbtiCcT.css|g' \
  /usr/share/nginx/html/marketing/*.html /usr/share/nginx/html/offline-shell.html
