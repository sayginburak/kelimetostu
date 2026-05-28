# Söz Arası

Söz Arası, Türkçe alfabetik sıradaki kelimeler arasında gizlenen 5 harfli günlük kelimeyi bulmaya çalıştığın client-side bir web kelime oyunudur. Betweenle mekaniklerinden ilham alır; isim, arayüz, renkler ve assetler özgündür.

## Kurulum

```bash
pnpm install
pnpm dev
```

## Kelime Listesi Hazırlama

GitHub kaynaklarını indirip temizlenmiş listeleri üretmek için:

```bash
pnpm fetch:words
pnpm build:words
pnpm audit:words
```

Tek komut:

```bash
pnpm prepare:words
```

Detaylar için [docs/WORD_LISTS.md](docs/WORD_LISTS.md) dosyasına bak. Süre ve sonuç formatı için [docs/TIMER_AND_RESULTS.md](docs/TIMER_AND_RESULTS.md) dosyasına bak.

## Test

```bash
pnpm test
```

## Deploy

Uygulama tamamen statik çalışır. Vercel, Netlify veya Cloudflare Pages üzerinde `pnpm build` çıktısı olan `dist` klasörüyle yayınlanabilir.

## Veri Kaynağı Notu

MVP küçük örnek veriyle gelir. Üretim için kelime listesi kaynaklı, deterministik ve manuel filtrelenmiş olmalıdır. Cevap havuzu tahmin havuzundan daha küçük ve daha yaygın kelimelerden oluşmalıdır.

## Future Improvements

- özel kelime linki
- seviye modu
- prefix index / trie optimizasyonu
- daha iyi kelime zorluk derecelendirme
- kullanıcı geri bildirimli kelime eleme
