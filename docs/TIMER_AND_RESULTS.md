# Söz Arası Süre ve Sonuç Modeli

Söz Arası artık puan hesaplamaz. Oyun sonucu iki temel bilgiyle gösterilir:

- Tahmin sayısı: kelimenin kaçıncı hakta bulunduğu veya kaybedildiyse `X/14`.
- Süre: oyuncunun aktif olarak oyunda geçirdiği süre.

## Süre Nasıl Çalışır?

Süre yalnızca oyun `playing` durumundayken akar. Sayfa görünür değilse, pencere odakta değilse veya kullanıcı sayfadan çıkarsa süre durur ve mevcut değer localStorage'a yazılır.

Bu sayede telefon kilitlendiğinde, kullanıcı başka sekmeye geçtiğinde veya uygulama arka plana alındığında süre haksız şekilde artmaz.

## Sonuç Ekranı

Oyun bitince sonuç ekranında doğru kelime, tahmin sayısı ve süre gösterilir. İstatistik alanı oynanan oyun, kazanma sayısı, kazanma yüzdesi, seri, en iyi seri ve ortalama süreyi gösterir.

Günlük oyun ve serbest oyun istatistikleri ayrı tutulur. Serbest oyun sonuçları günlük seriyi veya günlük kazanma oranını etkilemez.

Oyun bittikten sonra istatistik ikonuna basılırsa genel istatistik modalı yerine sonuç ekranı açılır. Böylece kullanıcı kaç tahminde bildiğini, süresini ve paylaşım butonunu tekrar görebilir.

Tahmin dağılımı yalnızca kazanılan günlük oyunları sayar. Kaybedilen oyunlar oynanan oyun ve süre istatistiklerine dahil edilir, fakat belirli bir tahmin sayısında kazanılmadıkları için dağılıma eklenmez.

## Paylaşım

Paylaşım cevabı açık etmez. Format:

```text
Söz Arası #123
7/14 · 3:42
🟦🟦🟦🟧🟦🟦🟩
```

Kaybedilirse:

```text
Söz Arası #123
X/14 · 8:15
🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟧
```
