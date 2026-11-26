// What goes into the open archive and how names/etymologies are recognised in source articles.
// Changing this file and re-running `npm run data:fetch && npm run data:build` regenerates the dataset.

/** Wikidata classes (P31) of items located in Azerbaijan (P17 = Q227) with coordinates (P625).
 *  `top` = keep the N items with the most Wikipedia sitelinks (a reproducible proxy for notability). */
export const SELECTION = [
  { category: 'city', type: 'oikonym', classes: ['Q515', 'Q1549591', 'Q56557664'], top: Infinity },
  { category: 'river', type: 'hydronym', classes: ['Q4022'], top: 12 },
  { category: 'lake', type: 'hydronym', classes: ['Q23397'], top: 6 },
  { category: 'reservoir', type: 'hydronym', classes: ['Q131681'], top: 3 },
  { category: 'mountain', type: 'oronym', classes: ['Q8502'], top: 10 },
  { category: 'range', type: 'oronym', classes: ['Q46831'], top: 4 },
  { category: 'site', type: 'site', classes: ['Q839954'], top: 8 },
  { category: 'historical-region', type: 'choronym', classes: ['Q1620908'], top: Infinity },
]

/** Generous box around Azerbaijan incl. Nakhchivan; items whose Wikidata point falls outside are dropped. */
export const BOUNDS = { w: 44.7, s: 38.3, e: 50.9, n: 42.0 }

/** Section headings that talk about the name itself. */
export const NAME_HEADINGS = {
  az: { include: /etimolog|toponim|adın|^ad[ıi]?$|adlanma|mənşə/i, exclude: /tanınmış|şəxs|məşhur|qardaş/i },
  ru: { include: /этимолог|назван|топоним|происхождение/i, exclude: /известн|уроженц|побратим/i },
  en: { include: /etymolog|^names?$|toponym|naming|name origin|^name and/i, exclude: /notable|people|twin/i },
}

/** Infobox parameters kept verbatim (AZ "Yaşayış məntəqəsi", RU "НП"). EN infoboxes have no former-name field. */
export const INFOBOX_FIELDS = {
  az: {
    formerNames: ['əvvəlki adı', 'əvvəlki adları', 'keçmiş adı', 'keçmiş adları'],
    region: ['region'],
    founded: ['əsası qoyulub', 'əsasının qoyulması', 'təsis tarixi', 'yaranma tarixi', 'ilk xatırlanma'],
  },
  ru: {
    formerNames: ['прежние имена', 'прежние названия'],
    region: ['регион'],
    founded: ['дата основания', 'основан'],
    firstMention: ['первое упоминание'],
  },
}

/** The 14 economic regions (Presidential Decree of 7 July 2021). */
export const REGIONS = [
  { id: 'baki', az: 'Bakı', ru: 'Баку', en: 'Baku', match: [/^bakı/i, /^баку/i] },
  { id: 'abseron-xizi', az: 'Abşeron-Xızı', ru: 'Апшерон-Хызы', en: 'Absheron-Khizi', match: [/abşeron/i, /апшерон/i] },
  { id: 'dagliq-sirvan', az: 'Dağlıq Şirvan', ru: 'Горный Ширван', en: 'Mountainous Shirvan', match: [/dağlıq şirvan/i, /горн\S* ширван/i] },
  { id: 'gence-daskesen', az: 'Gəncə-Daşkəsən', ru: 'Гянджа-Дашкесан', en: 'Ganja-Dashkasan', match: [/gəncə-daşkəsən/i, /гянджа-дашкесан/i] },
  { id: 'qarabag', az: 'Qarabağ', ru: 'Карабах', en: 'Karabakh', match: [/^qarabağ/i, /^карабах/i] },
  { id: 'qazax-tovuz', az: 'Qazax-Tovuz', ru: 'Газах-Товуз', en: 'Gazakh-Tovuz', match: [/qazax-tovuz/i, /газах-товуз/i] },
  { id: 'quba-xacmaz', az: 'Quba-Xaçmaz', ru: 'Губа-Хачмаз', en: 'Guba-Khachmaz', match: [/quba-xaçmaz/i, /губа-хачмаз/i] },
  { id: 'lenkeran-astara', az: 'Lənkəran-Astara', ru: 'Ленкорань-Астара', en: 'Lankaran-Astara', match: [/lənkəran/i, /ленкорань/i] },
  { id: 'merkezi-aran', az: 'Mərkəzi Aran', ru: 'Центральный Аран', en: 'Central Aran', match: [/mərkəzi aran/i, /центральн\S* аран/i] },
  { id: 'mil-mugan', az: 'Mil-Muğan', ru: 'Миль-Муган', en: 'Mil-Mugan', match: [/mil-muğan/i, /миль-муган/i] },
  { id: 'seki-zaqatala', az: 'Şəki-Zaqatala', ru: 'Шеки-Закатала', en: 'Shaki-Zagatala', match: [/şəki-zaqatala/i, /шеки-закатал/i] },
  { id: 'serqi-zengezur', az: 'Şərqi Zəngəzur', ru: 'Восточный Зангезур', en: 'East Zangezur', match: [/şərqi zəngəzur/i, /восточн\S* зангезур/i] },
  { id: 'sirvan-salyan', az: 'Şirvan-Salyan', ru: 'Ширван-Сальян', en: 'Shirvan-Salyan', match: [/şirvan-salyan/i, /ширван-сальян/i] },
  { id: 'naxcivan', az: 'Naxçıvan', ru: 'Нахчыван', en: 'Nakhchivan', match: [/naxçıvan/i, /нахчыван/i] },
]
