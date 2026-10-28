from pathlib import Path
p=Path('/app/apps/recommendations/chat/wiring/product_search.py')
s=p.read_text()
assert 'return ranked[:limit]' in s
s=s.replace('return ranked[:limit]', 'return __import__("apps.recommendations.chat.price_alternatives", fromlist=["price_variety"]).price_variety(ranked, limit)')
p.write_text(s)
p=Path('/app/apps/recommendations/chat/async_product_search.py');s=p.read_text()
old="ranked = _post_rank_products(query, category_code or '', candidates, mother_product=mother_product)[:limit]"
assert old in s
s=s.replace(old,"ranked = __import__('apps.recommendations.chat.price_alternatives', fromlist=['price_variety']).price_variety(_post_rank_products(query, category_code or '', candidates, mother_product=mother_product), limit)")
p.write_text(s)
p=Path('/app/apps/recommendations/chat/search_v2/policy.py')
if p.exists():
 s=p.read_text();old='selected = diversify(eligible, request.result_limit, priority=qualified_type)'
 assert old in s
 s=s.replace(old,'selected = __import__("apps.recommendations.chat.price_alternatives", fromlist=["price_variety"]).price_variety(diversify(eligible, len(eligible), priority=qualified_type), request.result_limit, priority=qualified_type)')
 p.write_text(s)
