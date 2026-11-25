// Generates src/data/toponyms.json — ALL ENTRIES ARE FICTIONAL SAMPLE DATA.
// Names are invented compounds; forms, years and archive codes are illustrative only.
import { writeFileSync } from 'node:fs'

const T = { o: 'oikonym', h: 'hydronym', r: 'oronym' }
// [id, az, ru, en, type, lng, lat, region, status, confidence, gloss{az,ru,en}, forms[[form, year, kind]]]
const rows = [
 ['gumusdere','Gümüşdərə','Гюмюшдере','Gumushdara','o',47.40,41.10,'nw','verified',0.97,['«gümüş» və «dərə» sözlərindən','из слов «гюмюш» (серебро) и «дере» (долина)','from "gümüş" (silver) and "dərə" (valley)'],[['Gümişdərə',1593,'tax'],['Кумушдере',1831,'cameral'],['Gümüşdərə',1929,'map']]],
 ['saribulaq','Sarıbulaq','Сарыбулаг','Saribulag','o',47.00,41.30,'nw','verified',0.94,['«sarı» və «bulaq» sözlərindən','из слов «сары» (жёлтый) и «булаг» (родник)','from "sarı" (yellow) and "bulaq" (spring)'],[['Sarı Bulağ',1647,'waqf'],['Сары-Булахъ',1854,'cameral'],['Sarıbulaq',1933,'census']]],
 ['qizilkend','Qızılkənd','Гызылкенд','Gizilkend','o',48.10,40.55,'center','verified',0.91,['«qızıl» və «kənd» sözlərindən','из слов «гызыл» (золотой) и «кенд» (село)','from "qızıl" (golden) and "kənd" (village)'],[['Qızılkend',1727,'tax'],['Кызылкендъ',1868,'cameral'],['Qızılkənd',1958,'map']]],
 ['agcaqala','Ağcaqala','Агджагала','Aghjagala','o',47.70,39.95,'center','verified',0.95,['«ağca» və «qala» sözlərindən','из слов «агджа» (беловатый) и «гала» (крепость)','from "ağca" (whitish) and "qala" (fortress)'],[['Akça Kale',1588,'chronicle'],['Агджа-Кала',1823,'military'],['Ağcaqala',1927,'census']]],
 ['demirciler','Dəmirçilər','Демирчилер','Damirchilar','o',46.55,40.65,'west','pending',0.78,['«dəmirçi» sözündən, cəm şəkilçisi ilə','от слова «демирчи» (кузнец) с аффиксом множ. числа','from "dəmirçi" (smith) with the plural suffix'],[['Demirçiler',1702,'tax'],['Демирчиляр',1886,'cameral']]],
 ['bagliqislaq','Bağlıqışlaq','Баглыгышлаг','Baghligishlag','o',48.55,41.25,'ne','verified',0.89,['«bağlı» və «qışlaq» sözlərindən','из слов «баглы» (с садами) и «гышлаг» (зимовье)','from "bağlı" (with gardens) and "qışlaq" (winter quarters)'],[['Bağlu Kışlak',1661,'waqf'],['Баглы-Кишлагъ',1840,'military'],['Bağlıqışlaq',1931,'census']]],
 ['cinarliyurd','Çinarlıyurd','Чинарлыюрд','Chinarliyurd','o',46.00,41.00,'west','verified',0.92,['«çinarlı» və «yurd» sözlərindən','из слов «чинарлы» (с чинарами) и «юрд» (стан)','from "çinarlı" (with plane trees) and "yurd" (homestead)'],[['Çinarlu Yurt',1615,'chronicle'],['Чинарлы-Юртъ',1859,'cameral'],['Çinarlıyurd',1939,'map']]],
 ['duzlutepe','Duzlutəpə','Дузлутепе','Duzlutepe','o',48.90,39.90,'south','pending',0.71,['«duzlu» və «təpə» sözlərindən','из слов «дузлу» (солёный) и «тепе» (холм)','from "duzlu" (salty) and "təpə" (hill)'],[['Дузлы-Тепе',1874,'cameral'],['Duzlutəpə',1946,'map']]],
 ['yeddiqapi','Yeddiqapı','Еддигапы','Yeddigapi','o',47.10,40.25,'center','verified',0.96,['«yeddi» və «qapı» sözlərindən','из слов «едди» (семь) и «гапы» (ворота)','from "yeddi" (seven) and "qapı" (gate)'],[['Yedi Kapu',1574,'chronicle'],['Йедди-Капы',1819,'military'],['Yeddiqapı',1925,'census']]],
 ['kehrizobasi','Kəhrizobası','Кяхризобасы','Kahrizobasi','o',47.95,40.15,'center','verified',0.88,['«kəhriz» və «oba» sözlərindən','из слов «кяхриз» (подземный канал) и «оба» (поселение)','from "kəhriz" (underground channel) and "oba" (hamlet)'],[['Kehriz Obası',1690,'tax'],['Кягризъ-Оба',1862,'cameral'],['Kəhrizobası',1937,'census']]],
 ['balliqoruq','Ballıqoruq','Баллыгоруг','Balligoruq','o',48.25,41.05,'ne','pending',0.74,['«ballı» və «qoruq» sözlərindən','из слов «баллы» (медовый) и «горуг» (заповедное место)','from "ballı" (honeyed) and "qoruq" (reserve)'],[['Баллы-Горукъ',1891,'cameral'],['Ballıqoruq',1952,'map']]],
 ['daskorpulu','Daşkörpülü','Дашкёрпюлю','Dashkorpulu','o',47.25,40.45,'center','verified',0.93,['«daş» və «körpü» sözlərindən','из слов «даш» (камень) и «кёрпю» (мост)','from "daş" (stone) and "körpü" (bridge)'],[['Taş Köprülü',1609,'waqf'],['Дашъ-Кёрпюлю',1847,'military'],['Daşkörpülü',1930,'census']]],
 ['soyudluova','Söyüdlüova','Сёюдлюова','Soyudluova','o',48.70,38.85,'south','verified',0.90,['«söyüdlü» və «ova» sözlərindən','из слов «сёюдлю» (ивовый) и «ова» (равнина)','from "söyüdlü" (with willows) and "ova" (plain)'],[['Söğütlü Ova',1679,'tax'],['Сёгютлю-Ова',1836,'cameral'],['Söyüdlüova',1948,'map']]],
 ['durnaliyurd','Durnalıyurd','Дурналыюрд','Durnaliyurd','o',47.50,40.70,'center','verified',0.87,['«durnalı» və «yurd» sözlərindən','из слов «дурналы» (журавлиный) и «юрд» (стан)','from "durnalı" (of cranes) and "yurd" (homestead)'],[['Turnalu Yurt',1736,'tax'],['Дурналы-Юртъ',1871,'cameral'],['Durnalıyurd',1941,'census']]],
 ['gumuscay','Gümüşçay','Гюмюшчай','Gumushchay','h',47.45,41.00,'nw','verified',0.98,['«gümüş» və «çay» sözlərindən','из слов «гюмюш» (серебро) и «чай» (река)','from "gümüş" (silver) and "çay" (river)'],[['Gümiş Çay',1593,'tax'],['р. Кумушъ-чай',1831,'military'],['Gümüşçay',1929,'map']]],
 ['goycekcay','Göyçəkçay','Гёйчекчай','Goychakchay','h',47.20,40.95,'nw','verified',0.92,['«göyçək» və «çay» sözlərindən','из слов «гёйчек» (голубоватый) и «чай» (река)','from "göyçək" (bluish) and "çay" (river)'],[['Gökçek Çay',1652,'chronicle'],['р. Гёкчекъ',1858,'military'],['Göyçəkçay',1934,'map']]],
 ['qaynarbulaq','Qaynarbulaq','Гайнарбулаг','Gaynarbulag','h',46.45,40.85,'west','verified',0.95,['«qaynar» və «bulaq» sözlərindən','из слов «гайнар» (кипящий) и «булаг» (родник)','from "qaynar" (boiling) and "bulaq" (spring)'],[['Kaynar Bulak',1621,'waqf'],['ист. Кайнаръ-Булахъ',1849,'cameral'],['Qaynarbulaq',1936,'map']]],
 ['durnagolu','Durnagölü','Дурнагёлю','Durnagolu','h',48.35,39.70,'south','pending',0.69,['«durna» və «göl» sözlərindən','из слов «дурна» (журавль) и «гёль» (озеро)','from "durna" (crane) and "göl" (lake)'],[['оз. Дурна-Гёль',1883,'military'],['Durnagölü',1955,'map']]],
 ['soyuqsu','Soyuqsu','Союгсу','Soyugsu','h',48.45,41.40,'ne','verified',0.94,['«soyuq» və «su» sözlərindən','из слов «союг» (холодный) и «су» (вода)','from "soyuq" (cold) and "su" (water)'],[['Soğuk Su',1598,'tax'],['р. Согукъ-Су',1828,'military'],['Soyuqsu',1932,'map']]],
 ['qamisligol','Qamışlıgöl','Гамышлыгёль','Gamishligol','h',48.75,39.35,'south','verified',0.86,['«qamışlı» və «göl» sözlərindən','из слов «гамышлы» (камышовый) и «гёль» (озеро)','from "qamışlı" (reedy) and "göl" (lake)'],[['Kamışlu Göl',1714,'tax'],['оз. Камышлы-Гёль',1866,'military'],['Qamışlıgöl',1944,'map']]],
 ['aglarcay','Ağlarçay','Агларчай','Aghlarchay','h',46.85,41.20,'nw','pending',0.81,['«ağlar» və «çay» sözlərindən','из слов «аглар» и «чай» (река)','from "ağlar" and "çay" (river)'],[['Aglar Çay',1758,'chronicle'],['р. Агларъ',1897,'military']]],
 ['mermerbulaq','Mərmərbulaq','Мярмярбулаг','Marmarbulag','h',48.05,41.15,'ne','verified',0.90,['«mərmər» və «bulaq» sözlərindən','из слов «мярмяр» (мрамор) и «булаг» (родник)','from "mərmər" (marble) and "bulaq" (spring)'],[['Mermer Bulak',1683,'waqf'],['ист. Мермеръ-Булахъ',1852,'cameral'],['Mərmərbulaq',1938,'map']]],
 ['qivrimcay','Qıvrımçay','Гыврымчай','Givrimchay','h',48.60,39.05,'south','verified',0.89,['«qıvrım» və «çay» sözlərindən','из слов «гыврым» (извилистый) и «чай» (река)','from "qıvrım" (winding) and "çay" (river)'],[['Kıvrım Çay',1705,'tax'],['р. Кыврымъ-чай',1844,'military'],['Qıvrımçay',1950,'map']]],
 ['qartaldas','Qartaldaş','Гарталдаш','Gartaldash','r',47.60,41.12,'nw','verified',0.96,['«qartal» və «daş» sözlərindən','из слов «гартал» (орёл) и «даш» (камень)','from "qartal" (eagle) and "daş" (rock)'],[['Kartal Taş',1606,'chronicle'],['г. Карталъ-Ташъ',1837,'military'],['Qartaldaş',1928,'map']]],
 ['buludlutepe','Buludlutəpə','Булудлутепе','Buludlutepe','r',46.60,41.30,'nw','verified',0.91,['«buludlu» və «təpə» sözlərindən','из слов «булудлу» (облачный) и «тепе» (холм)','from "buludlu" (cloudy) and "təpə" (hill)'],[['Bulutlu Tepe',1667,'tax'],['г. Булутлу-Тепе',1861,'military'],['Buludlutəpə',1943,'map']]],
 ['yasilyal','Yaşılyal','Яшылъял','Yashilyal','r',48.30,38.75,'south','verified',0.93,['«yaşıl» və «yal» sözlərindən','из слов «яшыл» (зелёный) и «ял» (хребет)','from "yaşıl" (green) and "yal" (ridge)'],[['Yaşıl Yal',1695,'waqf'],['хр. Яшилъ-Ялъ',1879,'military'],['Yaşılyal',1949,'map']]],
 ['deveboynu','Dəvəboynu','Девебойну','Daveboynu','r',46.35,40.25,'west','pending',0.76,['«dəvə» və «boyun» sözlərindən','из слов «деве» (верблюд) и «бойун» (шея)','from "dəvə" (camel) and "boyun" (neck)'],[['пер. Деве-Бойну',1888,'military'],['Dəvəboynu',1957,'map']]],
 ['qayalidag','Qayalıdağ','Гаялыдаг','Gayalidag','r',48.20,41.25,'ne','verified',0.95,['«qayalı» və «dağ» sözlərindən','из слов «гаялы» (скалистый) и «даг» (гора)','from "qayalı" (rocky) and "dağ" (mountain)'],[['Kayalu Dağ',1582,'chronicle'],['г. Каялы-Дагъ',1826,'military'],['Qayalıdağ',1926,'map']]],
 ['ulduzyali','Ulduzyalı','Улдузъялы','Ulduzyali','r',46.20,40.75,'west','verified',0.88,['«ulduz» və «yal» sözlərindən','из слов «улдуз» (звезда) и «ял» (хребет)','from "ulduz" (star) and "yal" (ridge)'],[['Yıldız Yalı',1721,'tax'],['хр. Улдузъ-Ялы',1864,'military'],['Ulduzyalı',1947,'map']]],
 ['kuleklidag','Küləklidağ','Кюлеклидаг','Kulaklidag','r',48.40,40.80,'ne','pending',0.83,['«küləkli» və «dağ» sözlərindən','из слов «кюлекли» (ветреный) и «даг» (гора)','from "küləkli" (windy) and "dağ" (mountain)'],[['Küleklü Dağ',1744,'tax'],['г. Кюлеклю-Дагъ',1893,'military']]],
]

let n = 0
const code = (kind) => `NM-${kind.slice(0,2).toUpperCase()}-${String(++n).padStart(3,'0')}`
const out = rows.map(([id, az, ru, en, t, lng, lat, region, status, confidence, gloss, forms]) => {
  const historicalForms = forms.map(([form, year, kind]) => ({ form, year, source: code(kind), kind }))
  return {
    id, names: { az, ru, en }, type: T[t], region,
    coordinates: [lng, lat],
    historicalForms,
    meaning: { az: gloss[0], ru: gloss[1], en: gloss[2] },
    sources: historicalForms.map(f => ({ code: f.source, kind: f.kind, year: f.year })),
    status, confidence,
    ...(status === 'verified' ? { verifiedBy: `E-0${(id.length % 4) + 1}` } : {}),
  }
})
writeFileSync(new URL('../src/data/toponyms.json', import.meta.url), JSON.stringify({ _note: 'NÜMUNƏ MƏLUMAT / SAMPLE DATA — all names, forms, years and archive codes are fictional and for demonstration only.', items: out }, null, 1))
console.log(out.length, 'entries;', out.filter(o=>o.status==='verified').length, 'verified')
