import type { Localized } from '../types';

/** Peer-reviewed work behind each comparison. Every DOI was checked on 2026-11-06. */
export interface Reference {
  id: string;
  cite: string;
  title: string;
  venue: string;
  url: string;
  /** Site ids this paper supports (Oman side or target side). */
  sites: string[];
  supports: Localized;
  /** 'site' = why a site was chosen (default); 'method' = an instrument or method paper behind a dataset. */
  kind?: 'site' | 'method';
}

const doi = (d: string) => `https://doi.org/${d}`;

export const REFERENCES: Reference[] = [
  {
    id: 'kelemen2008', cite: 'Kelemen & Matter (2008)', title: 'In situ carbonation of peridotite for CO2 storage',
    venue: 'PNAS 105(45), 17295–17300', url: doi('10.1073/pnas.0805794105'), sites: ['samail_ophiolite'],
    supports: {
      en: 'Samail peridotite reacts with water and CO2 to form serpentine and carbonate veins today.',
      ar: 'بيريدوتيت سمائل يتفاعل مع الماء وثاني أكسيد الكربون مكوّناً عروق السربنتين والكربونات حتى اليوم.',
    },
  },
  {
    id: 'ehlmann2008', cite: 'Ehlmann et al. (2008)', title: 'Orbital identification of carbonate-bearing rocks on Mars',
    venue: 'Science 322(5909), 1828–1832', url: doi('10.1126/science.1164759'), sites: ['nili_fossae'],
    supports: {
      en: 'First orbital detection of Mg-carbonate on Mars, in Nili Fossae, with olivine and clays.',
      ar: 'أول رصد مداري لكربونات المغنيسيوم على المريخ في Nili Fossae مع الأوليفين والطين.',
    },
  },
  {
    id: 'ehlmann2010', cite: 'Ehlmann, Mustard & Murchie (2010)', title: 'Geologic setting of serpentine deposits on Mars',
    venue: 'Geophysical Research Letters 37, L06201', url: doi('10.1029/2010GL042596'), sites: ['nili_fossae'],
    supports: {
      en: 'Serpentine on Mars, including the olivine-rich unit near Isidis: evidence of past serpentinization.',
      ar: 'السربنتين على المريخ ومنها الوحدة الغنية بالأوليفين قرب Isidis: دليل على تسربنت قديم.',
    },
  },
  {
    id: 'goudge2015', cite: 'Goudge et al. (2015)', title: 'Assessing the mineralogy of the watershed and fan deposits of the Jezero crater paleolake system, Mars',
    venue: 'JGR Planets 120, 775–808', url: doi('10.1002/2014JE004782'), sites: ['jezero_crater'],
    supports: {
      en: 'Jezero delta holds Mg-carbonate and olivine carried in by rivers from its watershed.',
      ar: 'دلتا Jezero تحوي كربونات المغنيسيوم والأوليفين نقلتها الأنهار من حوض التصريف.',
    },
  },
  {
    id: 'osterloo2008', cite: 'Osterloo et al. (2008)', title: 'Chloride-bearing materials in the southern highlands of Mars',
    venue: 'Science 319(5870), 1651–1654', url: doi('10.1126/science.1150690'), sites: ['terra_sirenum_chlorides'],
    supports: {
      en: 'About 200 chloride deposits in the southern highlands, found with THEMIS thermal-infrared data.',
      ar: 'نحو 200 رواسب كلوريد في المرتفعات الجنوبية رُصدت ببيانات THEMIS الحرارية.',
    },
  },
  {
    id: 'usgs1982', cite: 'U.S. Geological Survey (1982)', title: 'Open-File Report 82-387 (Umm as Samim area, eastern Rub al Khali)',
    venue: 'USGS Open-File Report',url: 'https://pubs.usgs.gov/of/1982/0387/report.pdf', sites: ['umm_as_samim'],
    supports: {
      en: 'Describes Umm as Samim as one of the largest contiguous salt flats and studies its brine.',
      ar: 'يصف أم السميم كواحدة من أكبر السبخات المتصلة ويدرس محاليلها الملحية.',
    },
  },
  {
    id: 'radies2004', cite: 'Radies et al. (2004)', title: 'Eustatic and climatic controls on the development of the Wahiba Sand Sea, Sultanate of Oman',
    venue: 'Sedimentology 51(6), 1359–1385', url: doi('10.1111/j.1365-3091.2004.00678.x'), sites: ['sharqiya_sands'],
    supports: {
      en: 'How the Wahiba (Sharqiya) sand sea and its dunes formed.',
      ar: 'كيف تكوّن بحر رمال الشرقية (وهيبة) وكثبانه.',
    },
  },
  {
    id: 'silvestro2010', cite: 'Silvestro et al. (2010)', title: 'Ripple migration and dune activity on Mars: Evidence for dynamic wind processes',
    venue: 'Geophysical Research Letters 37, L20203', url: doi('10.1029/2010GL044743'), sites: ['nili_patera_dunes'],
    supports: {
      en: 'Nili Patera dunes and ripples move today under Martian winds (HiRISE).',
      ar: 'كثبان Nili Patera وتموّجاتها تتحرك اليوم بفعل رياح المريخ (HiRISE).',
    },
  },
  {
    id: 'lalla2020', cite: 'Lalla et al. (2020)', title: 'Laboratory analysis of returned samples from the AMADEE-18 Mars analog mission',
    venue: 'Astrobiology 20(11), 1303–1320', url: doi('10.1089/ast.2019.2038'), sites: ['dhofar_amadee18'],
    supports: {
      en: 'Lab analyses of 25 Dhofar samples from the 2018 mission; the authors compare Dhofar with the Eridania Basin on Mars.',
      ar: 'تحليل مخبري لـ 25 عينة من ظفار جُمعت في مهمة 2018؛ ويقارن الباحثون ظفار بحوض Eridania على المريخ.',
    },
  },
  {
    id: 'zuber2012', cite: 'Zuber et al. (2012)', title: 'Constraints on the volatile distribution within Shackleton crater at the lunar south pole',
    venue: 'Nature 486, 378–381', url: doi('10.1038/nature11216'), sites: ['moon_south_pole'],
    supports: {
      en: 'LOLA topography of Shackleton crater: steep walls, rim relief and slopes.',
      ar: 'تضاريس فوهة Shackleton من LOLA: جدران شديدة الانحدار وارتفاع الحافة.',
    },
  },
  // Added 2026-11-07; every DOI checked against the Crossref registry the same day.
  {
    id: 'leask2021', cite: 'Leask et al. (2021)', title: 'Tracing carbonate formation, serpentinization, and biological materials with micro-/meso-scale infrared imaging spectroscopy in a Mars analog system, Samail Ophiolite, Oman',
    venue: 'Earth and Space Science 8(11), e2021EA001637', url: doi('10.1029/2021EA001637'), sites: ['samail_ophiolite'],
    supports: {
      en: 'Treats the Samail ophiolite explicitly as a Mars analog and maps its serpentine and carbonate with infrared imaging spectroscopy.',
      ar: 'يعامل أفيوليت سمائل صراحةً كنظير للمريخ ويرسم السربنتين والكربونات فيه بالتصوير الطيفي بالأشعة تحت الحمراء.',
    },
  },
  {
    id: 'farley2022', cite: 'Farley et al. (2022)', title: 'Aqueously altered igneous rocks sampled on the floor of Jezero crater, Mars',
    venue: 'Science 377', url: doi('10.1126/science.abo2196'), sites: ['jezero_crater'],
    supports: {
      en: 'Perseverance rover results: the Jezero floor rocks are igneous and were altered by water, the ground truth behind the orbital view.',
      ar: 'نتائج عربة Perseverance: صخور أرضية Jezero نارية غيّرها الماء، وهي الحقيقة الأرضية خلف الرصد المداري.',
    },
  },
  {
    id: 'groemer2020', cite: 'Groemer et al. (2020)', title: 'The AMADEE-18 Mars analog expedition in the Dhofar region of Oman',
    venue: 'Astrobiology 20(11), 1276–1286', url: doi('10.1089/ast.2019.2031'), sites: ['dhofar_amadee18'],
    supports: {
      en: 'The mission paper for AMADEE-18: why Dhofar was chosen and what was tested there in 2018.',
      ar: 'ورقة مهمة AMADEE-18: سبب اختيار ظفار وما اختُبر فيها عام 2018.',
    },
  },
  {
    id: 'navarro2003', cite: 'Navarro-González et al. (2003)', title: 'Mars-like soils in the Atacama Desert, Chile, and the dry limit of microbial life',
    venue: 'Science 302(5647), 1018–1021', url: doi('10.1126/science.1089143'), sites: ['atacama'],
    supports: {
      en: 'Why the Atacama is a classic Mars analog: soils so dry that Viking-style life tests come back nearly empty.',
      ar: 'سبب اعتبار أتاكاما نظيراً كلاسيكياً للمريخ: تربة شديدة الجفاف لدرجة أن اختبارات الحياة على طريقة Viking تكاد لا تجد شيئاً.',
    },
  },
  {
    id: 'eppler2013', cite: 'Eppler et al. (2013)', title: 'Desert Research and Technology Studies (DRATS) 2010 science operations: Operational approaches and lessons learned for managing science during human planetary surface missions',
    venue: 'Acta Astronautica 90(2), 224–241', url: doi('10.1016/j.actaastro.2012.03.009'), sites: ['black_point'],
    supports: {
      en: "NASA's own account of the Desert RATS field tests run at the Black Point Lava Flow.",
      ar: 'رواية ناسا نفسها لاختبارات Desert RATS الميدانية في تدفق بلاك بوينت البركاني.',
    },
  },
  {
    id: 'sauro2020', cite: 'Sauro et al. (2020)', title: 'Lava tubes on Earth, Moon and Mars: A review on their size and morphology revealed by comparative planetology',
    venue: 'Earth-Science Reviews 209, 103288', url: doi('10.1016/j.earscirev.2020.103288'), sites: ['lanzarote', 'majlis_al_jinn'],
    supports: {
      en: 'Compares Lanzarote lava tubes with lunar and Martian ones and discusses caves as shelters from radiation and micrometeorites.',
      ar: 'يقارن أنابيب الحمم في لانزاروتي بنظيراتها على القمر والمريخ ويناقش الكهوف كملاجئ من الإشعاع والنيازك الدقيقة.',
    },
  },
  {
    id: 'davison1990', cite: 'Davison (1990)', title: 'Meeting place of the spirits',
    venue: 'Aramco World 41(5)', url: 'https://archive.aramcoworld.com/issue/199005/meeting.place.of.the.spirits.htm', sites: ['majlis_al_jinn'],
    supports: {
      en: 'Account of the Majlis al Jinn chamber by the geologist who surveyed it for the 1985 Public Authority for Water Resources report.',
      ar: 'وصف قاعة مجلس الجن بقلم الجيولوجي الذي مسحها لتقرير الهيئة العامة لموارد المياه عام 1985.',
    },
  },
  // Instrument and method papers behind the datasets the scores use.
  { id: 'smith2001', kind: 'method', cite: 'Smith et al. (2001)', title: 'Mars Orbiter Laser Altimeter: Experiment summary after the first year of global mapping of Mars', venue: 'JGR Planets 106, 23689–23722', url: doi('10.1029/2000JE001364'), sites: [], supports: { en: 'MOLA: the Mars elevation data behind every Mars terrain score.', ar: 'MOLA: بيانات ارتفاع المريخ وراء كل درجة تضاريس مريخية.' } },
  { id: 'murchie2007', kind: 'method', cite: 'Murchie et al. (2007)', title: 'Compact Reconnaissance Imaging Spectrometer for Mars (CRISM) on Mars Reconnaissance Orbiter (MRO)', venue: 'JGR Planets 112', url: doi('10.1029/2006JE002682'), sites: [], supports: { en: 'CRISM: the Mars mineral spectra behind the serpentine and carbonate indices.', ar: 'CRISM: أطياف معادن المريخ وراء مؤشري السربنتين والكربونات.' } },
  { id: 'christensen2001', kind: 'method', cite: 'Christensen et al. (2001)', title: 'Mars Global Surveyor Thermal Emission Spectrometer experiment: Investigation description and surface science results', venue: 'JGR Planets 106, 23823–23871', url: doi('10.1029/2000JE001370'), sites: [], supports: { en: 'TES: the Mars albedo map, and thermal inertia where THEMIS has no data.', ar: 'TES: خريطة ألبيدو المريخ، والقصور الحراري حيث لا تتوفر بيانات THEMIS.' } },
  { id: 'fergason2006', kind: 'method', cite: 'Fergason et al. (2006)', title: 'High-resolution thermal inertia derived from the Thermal Emission Imaging System (THEMIS): Thermal model and applications', venue: 'JGR Planets 111', url: doi('10.1029/2006JE002735'), sites: [], supports: { en: 'How thermal inertia is derived from THEMIS, the 100 m Mars thermal inertia we use.', ar: 'كيف يُشتق القصور الحراري من THEMIS، وهو القصور الحراري المريخي بدقة 100 م الذي نستخدمه.' } },
  { id: 'smith2010', kind: 'method', cite: 'Smith et al. (2010)', title: 'Initial observations from the Lunar Orbiter Laser Altimeter (LOLA)', venue: 'Geophysical Research Letters 37', url: doi('10.1029/2010GL043751'), sites: [], supports: { en: 'LOLA: the lunar elevation data behind the south-pole terrain score.', ar: 'LOLA: بيانات ارتفاع القمر وراء درجة تضاريس القطب الجنوبي.' } },
  { id: 'green2020', kind: 'method', cite: 'Green et al. (2020)', title: 'An Earth science imaging spectroscopy mission: The Earth Surface Mineral Dust Source Investigation (EMIT)', venue: 'IGARSS 2020, 6262–6265', url: doi('10.1109/IGARSS39084.2020.9323741'), sites: [], supports: { en: 'EMIT: the Earth mineral spectra behind the Omani serpentine and carbonate indices.', ar: 'EMIT: أطياف معادن الأرض وراء مؤشري السربنتين والكربونات في عُمان.' } },
  { id: 'liang2001', kind: 'method', cite: 'Liang (2001)', title: 'Narrowband to broadband conversions of land surface albedo I: Algorithms', venue: 'Remote Sensing of Environment 76(2), 213–238', url: doi('10.1016/S0034-4257(00)00205-4'), sites: [], supports: { en: 'The formula that turns MODIS bands into the Earth albedo values we compare.', ar: 'المعادلة التي تحوّل نطاقات MODIS إلى قيم ألبيدو الأرض التي نقارنها.' } },
];

export function referencesFor(...siteIds: string[]): Reference[] {
  return REFERENCES.filter((r) => siteIds.some((id) => r.sites.includes(id)));
}
