"""Price variety within already qualified results; preserve the main recommendation."""
def price_variety(ranked, limit, *, priority=None):
    rows = list(ranked)
    if not rows or limit <= 0:
        return []
    def value(row, key):
        return row.get(key) if isinstance(row, dict) else getattr(row, key, None)
    main = rows[0]
    price = value(main, 'price_rial')
    if not price or price <= 0:
        return rows[:limit]
    pool = [r for r in rows[1:] if not priority or priority(r) == priority(main)]
    chosen = [main]
    # Choose the highest-ranked suitable option in each meaningful price band.
    for lower, upper in [(0, .85), (.85, 1.15), (1.15, float('inf'))]:
        for row in pool:
            p = value(row, 'price_rial')
            if p and p > 0 and lower <= p / price < upper:
                chosen.append(row)
                break
    keys = {(value(r,'product_id'), value(r,'variant_id')) for r in chosen}
    chosen.extend(r for r in rows if (value(r,'product_id'), value(r,'variant_id')) not in keys)
    return chosen[:limit]
