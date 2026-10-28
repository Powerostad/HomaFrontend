FROM homa_openai_backend:merchant-product-cards-20261027
COPY deploy/credits-price-backend/image_credits.py /app/apps/recommendations/services/image_credits.py
COPY deploy/credits-price-backend/serializers.py /app/apps/users/serializers.py
COPY deploy/credits-price-backend/price_alternatives.py /app/apps/recommendations/chat/price_alternatives.py
COPY deploy/credits-price-backend/patch_search.py /tmp/patch_search.py
RUN python /tmp/patch_search.py && python -m compileall -q /app/apps/users/serializers.py /app/apps/recommendations/services/image_credits.py /app/apps/recommendations/chat/price_alternatives.py
