# Ağıllı Toponim Atlası — nümayiş versiyası

Bakı Slavyan Universiteti (dil və məzmun) və ADNSU (texnologiya) birgə layihəsinin Mədəniyyət Nazirliyinin qrant komissiyası üçün hazırlanmış yüksək dəqiqlikli demosu. AI arxiv mətnlərindən yer adlarını tapır, ekspertlər yoxlayır, interaktiv atlas hər adın tarixi formalarını, mənasını, mənbələrini və yerini göstərir.

> **İki məlumat dəsti var.** *Rəqəmsal arxiv* (`#/arxiv`, atlasda default) real yer adlarıdır: 124 qeyd, hər iddia açıq mənbəyə (Wikidata, Vikipediya AZ/RU/EN konkret redaksiya, Wikimedia Commons) linklənir, mənbə tapılmayan xana boş qalır. *Demo nümunə* isə 30 uydurma toponimdir (adlar, formalar, illər, `NM-…` şifrələri), yalnız AI demo və atlasdakı "Demo nümunə" rejimində görünür və "Nümunə məlumat" yarlığı daşıyır. Heç bir real qeyd hələ ekspert tərəfindən təsdiqlənməyib.

## Rəqəmsal arxiv: məlumat konveyeri

```bash
npm run data:fetch   # şəbəkə: Wikidata SPARQL + MediaWiki API → data/archive-cache/ (yalnız çatışmayanlar; --refresh hamısı)
npm run data:build   # oflayn: cache → src/data/archive/{index.json,summary.json,entries/*.json} + public/data/toponim-arxiv.{json,csv}
```

- Seçim qaydası `scripts/archive/config.mjs`-dədir (Wikidata sinifləri, hər kateqoriyada neçə obyekt, ad/etimologiya bölmə başlıqları, 14 iqtisadi rayon).
- `data/archive-cache/` repoda saxlanır, ona görə Docker build şəbəkəsiz təkrarlanır; `npm run build` heç bir xarici sorğu etmir.
- Status: **Mənbəli** = adın tarixi forması və ya mənşəyi mənbədən sitat gətirilib; **Ekspert yoxlamalıdır** = belə mənbə tapılmayıb. Bu, ekspert təsdiqi deyil.
- Hər qeyd ayrıca lazy chunk-dır (`import.meta.glob`), siyahı/xəritə yalnız yüngül indeksi yükləyir.
- Lisenziya: Wikidata CC0, Vikipediya sitatları CC BY-SA 4.0, şəkillər öz lisenziyası ilə; toplu CC BY-SA 4.0.

## İşə salmaq

```bash
npm install
npm run dev        # http://127.0.0.1:5180
npm run build      # dist/ + landing-in prerender olunmuş HTML-i
npx vite preview   # http://127.0.0.1:5181 (build-i yoxlamaq üçün)
```

`npm run build` sonunda `scripts/prerender.mjs` landing-i headless Chromium ilə render edib `dist/index.html`-ə yazır, ona görə başlıq JavaScript yüklənməmiş görünür. Chromium tapılmasa `CHROME_PATH` dəyişənini verin və ya `npx playwright install chromium` işlədin.

Backend yoxdur: bütün məlumat `src/data/toponyms.json`-dadır. Bu fayl `scripts/gen-data.mjs` ilə yaradılır.

## Canlı və deploy

- **Canlı:** https://top.munsif.im (Let's Encrypt, http → https)
- **Repo:** `github.com/Kadimoff/toponim` (private), branch `main`
- **Avtomatik deploy:** `main`-ə push etdikdən təxminən 1–3 dəqiqə sonra sayt canlıda yenilənir. Serverdə `toponim-autodeploy.timer` hər dəqiqə GitHub-ı deploy key ilə yoxlayır. Yeni commit tapanda Coolify-a deploy əmri verir. Coolify Dockerfile ilə build edib konteyneri dəyişir (rolling update və healthcheck ilə). Build alınmasa, işləyən versiya yerində qalır.
- **Konteyner:** build mərhələsi Node 24 + Chromium ilə gedir (prerender daxil), sayt nginx ilə statik verilir. `.mjs` faylları `text/javascript` kimi verilməlidir, əks halda MapLibre worker-i yüklənmir.
- **Server tərəfi:** Coolify app `toponim-atlas`, autodeploy skripti `/usr/local/bin/toponim-autodeploy`, jurnal `journalctl -u toponim-autodeploy`.

## Struktur

```
src/
  data/toponyms.json        30 nümunə toponim (AZ/RU/EN adlar, tarixi formalar, mənbələr, status, əminlik)
  lib/data.ts               tiplər, dövr hesabı, AZ hərflərini qatlayan fold()
  lib/search.ts             Fuse.js: AZ / RU (kirildən translit) / EN / tarixi formalar üzrə səhvə dözümlü axtarış
  lib/extract.ts            AI demo SİMULYASİYASI — lüğət + Azərbaycan hal şəkilçilərinə dözümlü uyğunlaşdırma
  lib/router.ts             hash routing: #/  #/atlas  #/atlas/:id  #/arxiv[?filtrlər]  #/arxiv/:id  #/metod  #/ai  #/stats  #/about
  lib/archive.ts            real arxiv: tiplər, axtarış, filtrlər, APA istinadı, lazy qeyd yükləmə
  components/archive/       arxiv filtrləri, qeyd görünüşü (tam səhifə və atlas paneli), statistika
  i18n/strings.ts           bütün UI mətni üç dildə (AZ default)
  components/map/           MapLibre + OpenFreeMap (violet tonlu stil, dil üzrə etiketlər), sxematik ehtiyat xəritə
  components/atlas/         axtarış/filtr paneli, detal kartı (zaman xətti, mənbələr, paylaşma linki)
  components/home/          hero xəritə səhnəsi (əvvəlcədən render olunmuş baza + canlı pinlər)
  pages/                    Home, Atlas, AiDemo, Stats, About
public/hero/                hero xəritə şəkilləri (capture.html ilə yaradılıb); pin koordinatları: src/data/hero-pins.json
```

## 60 saniyəlik təqdimat ssenarisi

| Vaxt | Ekran | Nə deyirik |
|---|---|---|
| 0–10 s | **Əsas səhifə** | "Hər yer adının öz tarixi var. Sistem üç işi görür: AI arxivdə adı tapır, ekspert yoxlayır, atlas göstərir." Önizləmədə qızılı pin dəyişdikcə adın tarixi formaları görünür. |
| 10–30 s | **Atlas** → axtarışa `Гюмюшдере` yazın | "Rusca yazılışla axtarıram, eyni yer tapılır. `Gumushdara` və ya səhv yazılış da işləyir." Pin qızılı olur, detal kartında üç dildə ad, **zaman xətti** (1593 → 1831 → 1929), mənbələr və "Ekspert təsdiqli" nişanı görünür. "Linki kopyala" ilə konkret toponimə link paylaşmaq olur. |
| 30–48 s | **AI demo** → "Nümunə mətn qoy" → "Yer adlarını tap" | Violet skan işığı mətndən keçir, 8 ad əminlik faizi ilə işarələnir (hal şəkilçili `Qayalıdağın`, `Daşkörpülüdə` də). "Atlasa əlavə et" → ekspert mənbəni tutuşdurur → "Təsdiqlə" → qızılı nişan. "Yalnız ekspertin təsdiqlədiyi ad ictimai atlasa düşür." |
| 48–60 s | **Statistika**, sonra **Layihə haqqında** | "Hazırda nümunə bazanın 77%-i təsdiqlənib. 6 ayda: korpus → model → ekspert paneli → kütləvi emal → atlas → təhvil." BSU və ADNSU-nun rolları. |

Məsləhət: təqdimata tünd rejimdə başlayın (default). Proyektor solğundursa sağ üstdəki düymə ilə açıq rejimə keçin. AZ/RU/EN düyməsi bütün interfeysi, xəritədəki şəhər adlarını da dəyişir.

## Verilmiş dizayn qərarları

- **Rəng:** brief-dəki violet şkala və tək qızılı aksent. Qızılı yalnız ekspert təsdiqi, seçilmiş pin və ekranda bir əsas rəqəm üçündür. Qradiyent hero fonunda, əsas düymədə, hero başlığında və zaman xəttində işlənir. Oxu sahələri düz rəngdədir.
- **Şrift:** brief-dəki Fraunces-də **kiril yoxdur**, ona görə rus dilində işləmir. Display üçün **Piazzolla** (optik ölçülü serif, kiril və `ə ğ ı ö ş ç ü` var), mətn üçün **IBM Plex Sans** seçildi. İkisi də öz serverimizdən verilir (fontsource).
- **Motiv:** dairəli pin. Eyni SVG loqoda, xəritə pinlərində, siyahıda, boş vəziyyətlərdə və nişanlarda işlənir. Yoxlamadakı adlarda halqa qırıq xəttlə çəkilir.
- **Zaman xətti:** violetdən qızılıya keçən xətt. Atlasdakı adın tarixçəsində və "Layihə haqqında"dakı yol xəritəsində eynidir: köhnə forma violetdir, bugünkü forma qızılı.
- **Xəritə:** OpenFreeMap Positron stili runtime-da violet tonlara salınır, su violet görünür. Etiketlər seçilmiş dildə göstərilir (`name:az` / `name:ru` / `name:en`). Plitələr 12 saniyəyə yüklənməsə, koordinat şəbəkəli sxematik xəritə açılır. Sərhədini mənbədən götürə bilmədiyimiz ölkə konturu çəkilmir.
- **Landing hero:** xəritə bütün hero-nun fonudur. Desktopda Azərbaycan sağ yarıdadır, başlıq solda, sakit (örtülmüş) xəritə sahəsinin üstündədir. Telefonda və planşetdə xəritə pəncərəsi mətndən sonra gəlir. Fon atlasın eyni stilindən əvvəlcədən render olunmuş şəkildir (`wide-*` 1600×1000, `tall-*` 400×550 @3x), pinlər canlı DOM-dur. Belə olanda ~1 MB-lıq WebGL mühərriki landing-də yüklənmir.
- **Mobil:** explorer paneli sürüklənən bottom sheet olur (peek / yarım / tam).
- **AI demo:** yerli lüğətlə təqlid olunur və bu açıq yazılıb ("Demo simulyasiya"). Model yoxdur.
- **Dizayn yoxlaması:** impeccable (craft floor, detector) və unslop (by [@heydamir](https://x.com/heydamir), CC BY 4.0) skill-ləri ilə aparılıb. Detektorun yeganə xəbərdarlığı hero başlığındakı qradiyent mətnə aiddir, o da brief-in tələbidir.

## Keyfiyyət ölçmələri (Lighthouse 12, production build, brotli)

| Səhifə | Mobil (simulyasiya) | Desktop |
|---|---|---|
| Əsas | Perf 86 · A11y 100 · BP 100 | Perf 99 · A11y 100 · BP 100 |
| AI demo | Perf 84 · A11y 100 · BP 100 | Perf 98 · A11y 100 · BP 100 |
| Statistika / Haqqında | Perf 85 · A11y 100 · BP 100 | — |
| Atlas | Perf ~45 · A11y 100 | Perf 95 · A11y 100 |

Açıq qeyd: mobil Performance hədəfi (≥90) **tam əldə olunmayıb**. Kontent səhifələri 84–87 aralığındadır, real ölçülən FCP ~1.1 s olsa da, Lighthouse simulyasiyası onu 2.9 s hesablayır. Atlas mobil profildə ~1 MB-lıq WebGL xəritə mühərriki (MapLibre) üzündən aşağı bal alır, desktopda 95-dir. Ölçmələr zəif noutbukda aparılıb. Növbəti addımlar: MapLibre-ni xəritə görünəndə yükləmək, istifadə olunmayan JS-i (≈26 KB) azaltmaq.

## Real məlumata keçid üçün əvəz ediləcəklər

- `src/data/toponyms.json` — real, ekspert təsdiqli toponimlər
- `src/lib/extract.ts` — real modelin API çağırışı
- BSU / ADNSU mətn yer tutanları — rəsmi loqolar (icazə ilə)
- `public/hero/*` — real məlumatla yenidən render: `npm run dev`, sonra `capture.html`
