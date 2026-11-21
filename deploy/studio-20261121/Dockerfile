FROM homa-sizpay-studio-20261119-21mtxd:latest
COPY deploy/studio-20261121/artifact/index.html deploy/studio-20261121/artifact/sw.js /usr/share/nginx/html/
COPY deploy/studio-20261121/artifact/assets/ /usr/share/nginx/html/assets/
RUN sed -i \
    -e 's|/assets/index-DKv0-O9V\.js|/assets/index-B7kBp2dy.js|g' \
    -e 's|/assets/radix-vendor-49pizU-y\.js|/assets/radix-vendor-CSw2e4_P.js|g' \
    -e 's|/assets/index-BiPSwvuO\.css|/assets/index-h4vatEsX.css|g' \
    /usr/share/nginx/html/marketing/*.html /usr/share/nginx/html/offline-shell.html
