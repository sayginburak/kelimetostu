# Word List Pipeline

Söz Arası iki ayrı kelime listesi kullanır:

- `validWords`: oyuncunun tahmin olarak yazabileceği geniş havuz.
- `answerWords`: günlük cevap olarak seçilebilecek daha temiz ve daha yaygın havuz.

`answerWords`, her zaman `validWords` listesinin alt kümesi olmalıdır. Oyun içindeki bound güncellemeleri `validWords` indexleriyle yapılır. Sol yakınlık göstergesindeki nokta ve yüzdeler ise Türkçe alfabetik 5 harf uzayındaki yaklaşık konuma göre hesaplanır.

## Hedef Boyutlar

- `validWords`: 4.000-8.000 kelime hedeflenir.
- `answerWords`: 800-1.500 kelime hedeflenir.
- MVP minimumları: 2.000+ `validWords`, 300+ `answerWords`.

Minimumların altında kalınırsa script uyarı verir, fakat build’i durdurmaz.

## Kaynaklar

Pipeline şu ana kaynakları indirir:

- `mertemin/turkish-word-list`
- `CanNuhlar/Turkce-Kelime-Listesi`

Varsa GitHub CLI ile opsiyonel Wordle Türkçe kaynak keşfi yapılır. Keşif başarısız olursa pipeline bozulmaz, sadece manifest içine warning yazılır.

Kaynak metadata dosyası:

- `raw/sources/sources-manifest.json`

Lisans uyarısı: Kaynakların lisansı tek tek kontrol edilmelidir. Lisansı belirsiz kaynaklar manifest içinde `license: "unknown"` ve `license unclear, verify before commercial use` notuyla işaretlenir. Ticari kullanım öncesi lisans doğrulaması yapılmalıdır.

## Manuel Kürasyon

Bu dosyalar pipeline tarafından okunur:

- `raw/manual-valid-include.txt`
- `raw/manual-valid-exclude.txt`
- `raw/manual-answer-include.txt`
- `raw/manual-answer-exclude.txt`

`manual-answer-include` içine eklenen kelime `validWords` içinde yoksa cevap havuzuna alınmaz ve warning yazılır.

## Çalıştırma

```bash
pnpm fetch:words
pnpm build:words
pnpm audit:words
```

Tek komut:

```bash
pnpm prepare:words
```

## Üretilen Dosyalar

- `src/data/validWords.ts`
- `src/data/answerWords.ts`
- `src/data/wordListMeta.ts`
- `docs/answer-review-needed.txt`
- `raw/rejected-words.txt`

`answer-review-needed.txt`, otomatik cevap adayları içindeki şüpheli veya tek kaynakta görünen kelimeleri manuel inceleme için listeler. Otomatik üretim pratik bir başlangıçtır; günlük cevap havuzu için manuel review önerilir.
