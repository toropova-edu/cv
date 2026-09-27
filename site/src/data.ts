const CV = 'https://toropova-edu.github.io/cv/'

export type Lang = 'en' | 'ru'

export type Entry = {
  date: string
  title: string
  org: string
  body: string[]
  note?: { label: string; text: string }
  role?: string
  modules?: { label: string; items: string[] }[]
}

/** `id` keys the map pin and stays the same in every language */
export type Place = { id: string; name: string; coords: string; region: string; text: string; img?: string }

const mail = 'alexandra.toropova2004@gmail.com'
const tg = 'https://t.me/Sasha_Toropova'

const coords = {
  'St Andrews': '56.34° N · 2.80° W',
  Kaliningrad: '54.71° N · 20.51° E',
  Moscow: '55.76° N · 37.62° E',
  Perm: '58.01° N · 56.25° E',
  Arkhangelsk: '64.54° N · 40.54° E',
  Solovki: '65.02° N · 35.71° E',
  'Novaya Zemlya': '73.50° N · 55.00° E',
  Anapa: '44.89° N · 37.32° E',
  Vladivostok: '43.12° N · 131.89° E',
}
const imgs: Partial<Record<keyof typeof coords, string>> = {
  Kaliningrad: 'assets/images/kaliningrad.jpeg',
  Moscow: 'assets/images/Moscow.jpg',
  Perm: 'assets/images/Perm.jpg',
  Arkhangelsk: 'assets/images/Arkhangelsk.jpg',
  Solovki: 'assets/images/solovki.jpg',
  'Novaya Zemlya': 'assets/images/novayazelya.jpg',
  Anapa: 'assets/images/anapa.jpg',
  Vladivostok: 'assets/images/vladivostok.jpeg',
}
const place = (id: keyof typeof coords, name: string, region: string, text: string): Place => ({
  id,
  name,
  region,
  text,
  coords: coords[id],
  img: imgs[id],
})

const stAndrewsModules = {
  core: [
    'Principles of Marine Mammal Biology',
    'Conservation and Management of Marine Mammals',
    'Mathematical and Statistical Modelling for Biologists (R)',
  ],
  optional: [
    'Advanced Bioacoustics for Marine Mammal Science',
    'Current Issues in Biologging',
    'Current Issues in Marine Mammal Behaviour',
    'Estimating Animal Abundance and Biodiversity',
    'Population Biology',
    'Predator Ecology in Polar Ecosystems — Antarctica',
  ],
}

/* ============================== English ============================== */
const en = {
  ui: {
    brand: 'A.-S. Toropova',
    marquee: 'Sasha — Toropova',
    title: 'Sasha Toropova',
    siteIndex: 'Site Index',
    findMe: 'Find Me',
    language: 'Language',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    close: 'Close',
    depth: 'Depth',
    metres: 'm',
    next: 'Next',
    backToStart: 'Back to start',
    footer: ['Alexandra-Sofia Toropova · Marine Mammal Biologist', 'St Andrews, 2026'],
    homeLeft: ['Marine Mammal Biologist', 'Cetacean Field Observer', 'Obsessed by The Ocean'],
    homeRight: ['MSc candidate at', 'University of St Andrews'],
    portraitAlt: 'Portrait of Alexandra-Sofia Toropova',
    mapHint: 'Tap a point to see what happened there',
    mapHintOpen: 'Tap elsewhere to close',
    mapSwipe: 'swipe the chart sideways',
    mapLabel: 'Expedition map — scroll sideways',
    mapList: 'All places',
    whaleLatin: 'Delphinapterus leucas',
    whalePlace: 'Beluga · Solovki, 2025',
  },
  nav: [
    { label: 'About', href: '#/about' },
    { label: 'Education', href: '#/education' },
    { label: 'Experience', href: '#/experience' },
  ],
  social: [
    { label: 'Telegram', href: tg },
    { label: 'Email', href: `mailto:${mail}` },
    { label: 'CV (PDF)', href: `${CV}Alexandra-Toropova-CV.pdf` },
  ],
  pages: {
    about: { title: 'About', eyebrow: 'Profile', place: 'St Andrews, Scotland' },
    education: { title: 'Education', eyebrow: 'Education & qualifications', place: 'Arkhangelsk → St Andrews' },
    experience: { title: 'Experience', eyebrow: 'Career & fieldwork', place: 'Solovetsky Archipelago, White Sea' },
  },
  sections: {
    details: 'Details',
    languages: 'Languages',
    competencies: 'Competencies',
    qualities: 'Personal qualities',
    hobbies: 'Beyond the field',
    degrees: 'Degrees & courses',
    geography: 'Expedition geography',
    expeditions: 'Field expeditions',
    work: 'Work experience',
    conferences: 'Conferences',
    gallery: 'From the field',
  },
  about: {
    intro:
      'Marine biologist with field experience in cetacean observation, scientific work and expedition research. Now studying the physiology, acoustics and conservation of marine mammals at the University of St Andrews.',
    photoAlt: 'Sasha on board a research vessel',
    photoCaption: 'On board R/V Akademik Mstislav Keldysh, 2024',
    facts: [
      { k: 'Born', v: '15 September 2004' },
      { k: 'Based in', v: 'St Andrews, Scotland' },
      { k: 'Email', v: mail, href: `mailto:${mail}` },
      { k: 'Telegram', v: '@Sasha_Toropova', href: tg },
      { k: 'Phone', v: '+7 919 450 1896', href: 'tel:+79194501896' },
    ] as { k: string; v: string; href?: string }[],
    languages: [
      { name: 'Russian', level: 'Native' },
      { name: 'English', level: 'C1 · IELTS 2026' },
    ],
    qualities: ['Resourceful', 'Punctual', 'Stress-resistant', 'Attentive to detail', 'Responsible', 'Ready for long expeditions'],
    skills: [
      { title: 'Field observation', text: 'Cetaceans, seabirds, coastal survey routes' },
      { title: 'Ship-based protocols', text: 'Opportunistic sightings and precise field documentation' },
      { title: 'Marine biology', text: 'Behaviour, physiology and conservation of marine mammals' },
      { title: 'Science communication', text: 'English C1, IELTS, EN↔RU translation' },
      { title: 'Expedition work', text: 'Ready for long field deployments' },
      { title: 'Working with data', text: 'Observation records, systematisation and analysis' },
    ],
  },
  hobbies: [
    { title: 'Horse riding', text: 'Multiple-time regional equestrian champion, Category II adult ranking in the Russian equestrian classification.' },
    { title: 'Dogs', text: 'Trains dogs in her free time — from basic obedience to building rapport with the handler.' },
    { title: 'Reading', text: 'A favourite way to unwind outside fieldwork and the lab.' },
    { title: 'Travel', text: 'New routes, cultures and expedition destinations. Cape Town and Antarctica top the wish list.' },
  ],
  education: [
    {
      date: '2026 — present',
      title: 'Marine Mammal Science, MSc',
      org: 'University of St Andrews, Scotland',
      body: [
        'A continuation of the bachelor thesis at an international level, focused on the physiology, acoustics and conservation biology of marine mammals.',
        'A one-year programme run by the Sea Mammal Research Unit (SMRU). It ends with a year-long research project supervised by SMRU staff — a written dissertation and a poster at the MSc student conference.',
      ],
      modules: [
        { label: 'Core modules', items: stAndrewsModules.core },
        { label: 'Optional modules on offer', items: stAndrewsModules.optional },
      ],
      note: {
        label: 'About the university',
        text: "Founded in 1413 — the oldest university in Scotland and the third-oldest in the English-speaking world. Home to the Sea Mammal Research Unit (SMRU), one of the world's leading centres for the biology of seals, whales and dolphins.",
      },
    },
    {
      date: '2022 — 2026',
      title: 'Biology, BSc',
      org: 'Northern (Arctic) Federal University',
      body: [
        'Programme: “Living Systems of the Arctic and Subarctic”. Organismal biology, northern-ecosystem ecology, adaptation to Arctic conditions and field-research methods.',
        'Thesis: “Socio-sexual behaviour of beluga whales in the summer reproductive aggregation off Bolshoy Solovetsky Island.”',
      ],
      role: 'Group leader (starosta) — the elected representative of her study group',
      modules: [
        {
          label: 'Biodiversity & the Arctic',
          items: ['Invertebrate zoology', 'Vertebrate zoology', 'Hydrobiology', 'Biodiversity studies', 'Population ecology', 'Environmental monitoring', 'Ecology of natural and technogenic systems'],
        },
        {
          label: 'Structure & function',
          items: ['Histology', 'Developmental biology', 'Genetics', 'Biochemistry', 'Molecular biology', 'Biophysics', 'Physiology of the CNS and sensory systems', 'Theories of evolution'],
        },
        {
          label: 'Research & field practice',
          items: ['Research methods and data analysis', 'Field practice: local fauna', 'Field practice: local flora', 'Field practice: ecology', 'Practical biology', 'Research internship and pre-diploma practice'],
        },
      ],
      note: {
        label: 'About the university',
        text: 'Founded in 2010 by merging Arkhangelsk State Technical University, Pomor State University and several specialised colleges. Today it is the largest research and education centre in North-West Russia, specialising in Arctic research, with partners in Norway, Finland, Sweden, Canada and the United States.',
      },
    },
    {
      date: 'Continuing education',
      title: 'Translator, English',
      org: 'Northern (Arctic) Federal University',
      body: ['Additional qualification: “Translator in Professional Communication” — to read the professional literature as fluently in English as in Russian.'],
      note: {
        label: 'About the programme',
        text: 'Translation of scientific and specialised texts, natural-science terminology, and written and oral translation practice. It opened up foreign-language research papers and international sources in marine biology.',
      },
    },
  ] as Entry[],
  work: [
    {
      date: '2024 — 2025',
      title: 'Laboratory Assistant',
      org: 'P.P. Shirshov Institute of Oceanology, RAS',
      body: [],
      note: {
        label: 'About the institute',
        text: "Russia's leading marine research institute, founded in 1946. Research across the World Ocean — from physical and chemical oceanography to seafloor geology and marine ecosystem biology — with its own fleet, including R/V Akademik Mstislav Keldysh.",
      },
    },
  ] as Entry[],
  expeditions: [
    {
      date: '2026',
      title: 'Black Sea dolphin population survey',
      org: 'Nature and People Charity Foundation, Anapa',
      body: ["The local marine-mammal population in Anapa's coastal waters: species, occurrence and patterns of distribution."],
      note: {
        label: 'About the foundation',
        text: 'A Russian charitable foundation supporting wildlife research and conservation, including monitoring of Black Sea marine mammals and help for animals in distress.',
      },
    },
    {
      date: '2025',
      title: 'Solovetsky Archipelago',
      org: 'Field observations',
      body: ['Socio-sexual behaviour of beluga whales (Delphinapterus leucas): interactions, behaviour and social structure.'],
      note: {
        label: 'About the location',
        text: 'Cape Beluzhy on Bolshoy Solovetsky Island is a summer gathering site for the White Sea beluga — the smallest beluga population in Russia, about 80 animals in the Solovetsky herd. The Shirshov Institute runs its “Beluga – White Whale” programme here.',
      },
    },
    {
      date: '2024',
      title: '95th voyage of R/V Akademik Mstislav Keldysh',
      org: 'Marine mammal and seabird observer',
      body: ['Watching marine mammals and birds from the vessel, recording sightings and keeping field documentation along the route.'],
      note: {
        label: 'About the vessel',
        text: 'Built in 1980 in Rauma, Finland. 122 metres, 17 research laboratories and two Mir submersibles rated to 6 km — a “floating institute” and one of Russia’s largest research vessels.',
      },
    },
  ] as Entry[],
  conferences: [
    {
      date: 'October 2025',
      title: 'Poster presentation at MARESEDU-2025',
      org: 'XIV International Conference “Marine Research and Education”, P.P. Shirshov Institute of Oceanology RAS, Moscow',
      body: ['Presented and defended a poster at the annual multidisciplinary conference on oceanology, marine biology and marine mammals.'],
    },
  ] as Entry[],
  gallery: [
    { src: 'assets/images/expedition_photo1.jpg', title: 'On board', caption: 'R/V Akademik Mstislav Keldysh, 2024' },
    { src: 'assets/images/lighthouse.jpg', title: 'Lighthouse at the edge of the world', caption: 'Field expedition' },
    { src: 'assets/images/seal.jpg', title: 'Seal on an ice floe', caption: 'Field observation' },
  ],
  places: [
    place('St Andrews', 'St Andrews', 'Scotland', "MSc in Marine Mammal Science. Scotland's oldest university (1413), a leader in marine research."),
    place('Kaliningrad', 'Kaliningrad', 'Baltic', 'Home port of R/V Akademik Mstislav Keldysh — the starting point for many oceanographic and polar voyages.'),
    place('Moscow', 'Moscow', 'Central Russia', 'P.P. Shirshov Institute of Oceanology — laboratory work, and a poster at MARESEDU-2025.'),
    place('Perm', 'Perm', 'Urals', 'Home town on the Kama River — school, and the first steps into science.'),
    place('Arkhangelsk', 'Arkhangelsk', 'White Sea', "Northern (Arctic) Federal University — bachelor's degree. Russia's largest Arctic university."),
    place('Solovki', 'Solovki', 'White Sea', 'Beluga whale expedition, 2025. A unique summer gathering site of White Sea belugas.'),
    place('Novaya Zemlya', 'Novaya Zemlya', 'Arctic', 'Observations on the 95th voyage of the Keldysh, between the Barents and Kara Seas — one of the least-studied corners of the Russian Arctic.'),
    place('Anapa', 'Anapa', 'Black Sea', 'Expedition 2026: bottlenose dolphins, common dolphins and harbour porpoises in coastal waters.'),
    place('Vladivostok', 'Vladivostok', 'Pacific', "Maritime forum at Russia's largest Far East port and centre for Pacific marine research."),
  ],
}

export type Content = typeof en

/* ============================== Русский ============================== */
const ru: Content = {
  ui: {
    brand: 'А.-С. Торопова',
    marquee: 'Саша — Торопова',
    title: 'Саша Торопова',
    siteIndex: 'Разделы',
    findMe: 'Связь',
    language: 'Язык',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    close: 'Закрыть',
    depth: 'Глубина',
    metres: 'м',
    next: 'Дальше',
    backToStart: 'На главную',
    footer: ['Александра-Софья Торопова · морской биолог', 'Сент-Эндрюс, 2026'],
    homeLeft: ['Морской биолог', 'Наблюдатель за китообразными', 'Одержима океаном'],
    homeRight: ['Магистрантка', 'University of St Andrews'],
    portraitAlt: 'Портрет Александры-Софьи Тороповой',
    mapHint: 'Коснитесь точки, чтобы узнать, что там происходило',
    mapHintOpen: 'Коснитесь в другом месте, чтобы закрыть',
    mapSwipe: 'карту можно листать вбок',
    mapLabel: 'Карта экспедиций — листается вбок',
    mapList: 'Все места',
    whaleLatin: 'Delphinapterus leucas',
    whalePlace: 'Белуха · Соловки, 2025',
  },
  nav: [
    { label: 'Обо мне', href: '#/about' },
    { label: 'Образование', href: '#/education' },
    { label: 'Опыт', href: '#/experience' },
  ],
  social: [
    { label: 'Telegram', href: tg },
    { label: 'Почта', href: `mailto:${mail}` },
    { label: 'CV (PDF)', href: `${CV}Alexandra-Toropova-CV.pdf` },
  ],
  pages: {
    about: { title: 'Обо мне', eyebrow: 'Профиль', place: 'Сент-Эндрюс, Шотландия' },
    education: { title: 'Образование', eyebrow: 'Образование и квалификации', place: 'Архангельск → Сент-Эндрюс' },
    experience: { title: 'Опыт', eyebrow: 'Работа и экспедиции', place: 'Соловецкий архипелаг, Белое море' },
  },
  sections: {
    details: 'Подробности',
    languages: 'Языки',
    competencies: 'Профессиональные компетенции',
    qualities: 'Личные качества',
    hobbies: 'Вне поля',
    degrees: 'Программы и курсы',
    geography: 'География экспедиций',
    expeditions: 'Полевые экспедиции',
    work: 'Опыт работы',
    conferences: 'Конференции',
    gallery: 'Из экспедиций',
  },
  about: {
    intro:
      'Морской биолог с полевым опытом наблюдений за китообразными, научной работы и экспедиционных исследований. Сейчас изучаю физиологию, акустику и охрану морских млекопитающих в магистратуре University of St Andrews.',
    photoAlt: 'Саша на борту научного судна',
    photoCaption: 'На борту НИС «Академик Мстислав Келдыш», 2024',
    facts: [
      { k: 'Дата рождения', v: '15 сентября 2004' },
      { k: 'Город', v: 'Сент-Эндрюс, Шотландия' },
      { k: 'Почта', v: mail, href: `mailto:${mail}` },
      { k: 'Telegram', v: '@Sasha_Toropova', href: tg },
      { k: 'Телефон', v: '+7 919 450 1896', href: 'tel:+79194501896' },
    ],
    languages: [
      { name: 'Русский', level: 'родной' },
      { name: 'English', level: 'C1 · IELTS 2026' },
    ],
    qualities: ['Находчивая', 'Пунктуальная', 'Стрессоустойчивая', 'Внимательна к деталям', 'Ответственная', 'Готова к длительным экспедициям'],
    skills: [
      { title: 'Полевые наблюдения', text: 'Китообразные, морские птицы, береговые маршруты' },
      { title: 'Судовые протоколы', text: 'Попутные наблюдения и точная полевая документация' },
      { title: 'Морская биология', text: 'Поведение, физиология и охрана морских млекопитающих' },
      { title: 'Научная коммуникация', text: 'Английский C1, IELTS, перевод EN↔RU' },
      { title: 'Экспедиционная работа', text: 'Готовность к длительным полевым выездам' },
      { title: 'Работа с данными', text: 'Наблюдательные записи, систематизация и анализ материалов' },
    ],
  },
  hobbies: [
    { title: 'Конный спорт', text: 'Многократная чемпионка региональных соревнований по конному спорту, второй взрослый спортивный разряд.' },
    { title: 'Собаки', text: 'В свободное время занимается дрессировкой собак — от послушания до контакта с хендлером.' },
    { title: 'Чтение', text: 'Любимый способ отдыха вне поля и лаборатории.' },
    { title: 'Путешествия', text: 'Новые маршруты, культуры и экспедиционные направления. В списке мечты — Кейптаун и Антарктида.' },
  ],
  education: [
    {
      date: '2026 — наст. время',
      title: 'Marine Mammal Science, магистратура',
      org: 'Университет Сент-Эндрюс, Шотландия',
      body: [
        'Продолжение темы дипломной работы на международном уровне, с уклоном в физиологию, акустику и природоохранную биологию морских млекопитающих.',
        'Годичная программа Научно-исследовательского центра морских млекопитающих (SMRU). Завершается годовым исследовательским проектом под руководством сотрудников SMRU — диссертацией и постером на студенческой конференции.',
      ],
      modules: [
        { label: 'Обязательные модули', items: stAndrewsModules.core },
        { label: 'Модули по выбору в программе', items: stAndrewsModules.optional },
      ],
      note: {
        label: 'Об университете',
        text: 'Основан в 1413 году — старейший университет Шотландии и третий по старшинству в англоязычном мире. При университете работает Научно-исследовательский центр морских млекопитающих (SMRU) — одно из ведущих мировых учреждений в области биологии тюленей, китов и дельфинов.',
      },
    },
    {
      date: '2022 — 2026',
      title: 'Биология, бакалавриат',
      org: 'Северный (Арктический) федеральный университет',
      body: [
        'Профиль «Живые системы Арктики и Субарктики». Биология организмов, экология северных экосистем, адаптации к арктическим условиям и методы полевых исследований.',
        'Тема дипломной работы: «Социо-половое поведение белух в летнем репродуктивном скоплении Большого Соловецкого острова».',
      ],
      role: 'Староста учебной группы',
      modules: [
        {
          label: 'Биоразнообразие и Арктика',
          items: ['Зоология беспозвоночных', 'Зоология позвоночных', 'Гидробиология', 'Учение о биоразнообразии', 'Популяционная экология', 'Экологический мониторинг', 'Экология природных и техногенных систем'],
        },
        {
          label: 'Строение и функции',
          items: ['Гистология', 'Биология индивидуального развития', 'Генетика', 'Биохимия', 'Молекулярная биология', 'Биофизика', 'Физиология ЦНС, ВНД и сенсорных систем', 'Теории эволюции'],
        },
        {
          label: 'Исследования и практики',
          items: ['Основы исследовательской деятельности и анализ данных', 'Практика по местной фауне', 'Практика по местной флоре', 'Практика по экологии', 'Практика по практической биологии', 'Производственная и преддипломная практика'],
        },
      ],
      note: {
        label: 'Об университете',
        text: 'САФУ имени М.В. Ломоносова основан в 2010 году объединением Архангельского государственного технического университета, Поморского государственного университета и профильных колледжей. Сегодня это крупнейший научно-образовательный центр Северо-Запада России, специализирующийся на исследовании Арктики, с партнёрами в Норвегии, Финляндии, Швеции, Канаде и США.',
      },
    },
    {
      date: 'Доп. образование',
      title: 'Переводчик, английский язык',
      org: 'Северный (Арктический) федеральный университет',
      body: ['Дополнительная квалификация «Переводчик в сфере профессиональной коммуникации» — чтобы свободно читать профессиональную литературу не только на русском языке.'],
      note: {
        label: 'О программе',
        text: 'Перевод научных и специализированных текстов, терминология естественных наук, практика письменного и устного перевода. После программы стали доступны зарубежные научные статьи и международные источники по морской биологии.',
      },
    },
  ],
  work: [
    {
      date: '2024 — 2025',
      title: 'Лаборант',
      org: 'Институт океанологии им. П.П. Ширшова РАН',
      body: [],
      note: {
        label: 'Об институте',
        text: 'Головной институт морских исследований России, основан в 1946 году. Комплексные исследования Мирового океана — от физики и химии вод до геологии дна и биологии морских экосистем. Собственный научный флот, включая НИС «Академик Мстислав Келдыш».',
      },
    },
  ],
  expeditions: [
    {
      date: '2026',
      title: 'Учёт черноморских дельфинов',
      org: 'Благотворительный фонд «Природа и Люди», Анапа',
      body: ['Популяция морских млекопитающих в прибрежных водах Анапы: виды, встречаемость и особенности распределения.'],
      note: {
        label: 'О фонде',
        text: 'Российский благотворительный фонд, поддерживающий изучение и охрану дикой природы, в том числе мониторинг морских млекопитающих Чёрного моря.',
      },
    },
    {
      date: '2025',
      title: 'Соловецкий архипелаг',
      org: 'Полевые наблюдения',
      body: ['Социо-половое поведение белух (Delphinapterus leucas): взаимодействия животных, поведение и социальная структура.'],
      note: {
        label: 'О месте',
        text: 'Мыс Белужий на Большом Соловецком острове — место летнего скопления беломорской белухи, самой мелкой популяции вида в России (соловецкое стадо — около 80 особей). Институт океанологии ведёт здесь программу «Белуха — белый кит».',
      },
    },
    {
      date: '2024',
      title: '95-й рейс НИС «Академик Мстислав Келдыш»',
      org: 'Наблюдатель за морскими млекопитающими и птицами',
      body: ['Наблюдение с борта за морскими млекопитающими и птицами, фиксация встреч и ведение полевой документации по маршруту судна.'],
      note: {
        label: 'О судне',
        text: 'Построено в 1980 году в Финляндии (Раума). 122 метра, 17 научных лабораторий и два глубоководных аппарата «Мир» с глубиной погружения до 6 км — «плавучий институт» и одно из крупнейших научных судов России.',
      },
    },
  ],
  conferences: [
    {
      date: 'Октябрь 2025',
      title: 'Стендовый доклад на MARESEDU-2025',
      org: 'XIV Международная конференция «Морские исследования и образование», Институт океанологии им. П.П. Ширшова РАН, Москва',
      body: ['Представила и защитила постер на ежегодной междисциплинарной конференции по океанологии, морской биологии и морским млекопитающим.'],
    },
  ],
  gallery: [
    { src: 'assets/images/expedition_photo1.jpg', title: 'На борту', caption: 'НИС «Академик Мстислав Келдыш», 2024' },
    { src: 'assets/images/lighthouse.jpg', title: 'Маяк на краю света', caption: 'Полевая экспедиция' },
    { src: 'assets/images/seal.jpg', title: 'Тюлень на льдине', caption: 'Полевое наблюдение' },
  ],
  places: [
    place('St Andrews', 'Сент-Эндрюс', 'Шотландия', 'Магистратура Marine Mammal Science. Древнейший университет Шотландии (1413), лидер морских исследований.'),
    place('Kaliningrad', 'Калининград', 'Балтика', 'Порт приписки НИС «Академик Мстислав Келдыш» — отсюда началось не одно океанографическое и полярное плавание.'),
    place('Moscow', 'Москва', 'Центральная Россия', 'Институт океанологии им. П.П. Ширшова РАН — работа в лаборатории и постер на MARESEDU-2025.'),
    place('Perm', 'Пермь', 'Урал', 'Родной город на Каме — школа и первые шаги в науку.'),
    place('Arkhangelsk', 'Архангельск', 'Белое море', 'САФУ имени М.В. Ломоносова — бакалавриат. Крупнейший арктический вуз России.'),
    place('Solovki', 'Соловки', 'Белое море', 'Экспедиция к белухам, 2025. Уникальное место летнего скопления беломорской белухи.'),
    place('Novaya Zemlya', 'Новая Земля', 'Арктика', 'Наблюдения по маршруту 95-го рейса «Келдыша» между Баренцевым и Карским морями — один из самых малоизученных уголков российской Арктики.'),
    place('Anapa', 'Анапа', 'Чёрное море', 'Экспедиция 2026 года: афалины, белобочки и азовки в прибрежных водах.'),
    place('Vladivostok', 'Владивосток', 'Тихий океан', 'Морской форум в крупнейшем порту Дальнего Востока — центре тихоокеанских морских исследований.'),
  ],
}

export const content: Record<Lang, Content> = { en, ru }
