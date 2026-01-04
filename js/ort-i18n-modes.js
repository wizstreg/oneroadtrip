/**
 * OneRoadTrip - Traductions des modales explicatives (?)
 * 6 langues : fr, en, es, it, pt, ar
 * Utilisé par index.html pour les boutons ? des 3 modes
 */

window.ORT_I18N_MODES = {
  // ═══════════════════════════════════════════════════════════════
  // MODE SIMPLE - EXPLICATION
  // ═══════════════════════════════════════════════════════════════
  
  simpleTitle: {
    fr: 'Mode Simple',
    en: 'Simple Mode',
    es: 'Modo Simple',
    it: 'Modalità Semplice',
    pt: 'Modo Simples',
    ar: 'الوضع البسيط'
  },

  simpleDesc: {
    fr: 'Le mode Simple vous donne accès à une sélection de plusieurs centaines d\'itinéraires préconçus couvrant plus de 90 pays. Ces roadtrips, disponibles en 6 langues, ont été créés et testés lors du développement de OneRoadTrip. Certains seront améliorés dans les semaines à venir, notamment concernant les visites et activités.',
    en: 'Simple Mode gives you access to hundreds of pre-made itineraries covering over 90 countries. These roadtrips, available in 6 languages, were created and tested during OneRoadTrip\'s development. Some will be improved in the coming weeks, especially regarding visits and activities.',
    es: 'El Modo Simple le da acceso a cientos de itinerarios premade que cubren más de 90 países. Estos roadtrips, disponibles en 6 idiomas, fueron creados y probados durante el desarrollo de OneRoadTrip. Algunos se mejorarán en las próximas semanas, especialmente respecto a visitas y actividades.',
    it: 'La Modalità Semplice ti dà accesso a centinaia di itinerari preconfezionati che coprono più di 90 paesi. Questi roadtrips, disponibili in 6 lingue, sono stati creati e testati durante lo sviluppo di OneRoadTrip. Alcuni verranno migliorati nelle prossime settimane, specialmente per quanto riguarda visite e attività.',
    pt: 'O Modo Simples oferece acesso a centenas de itinerários pré-feitos cobrindo mais de 90 países. Estas viagens, disponíveis em 6 idiomas, foram criadas e testadas durante o desenvolvimento do OneRoadTrip. Algumas serão melhoradas nas próximas semanas, especialmente quanto a visitas e atividades.',
    ar: 'يوفر الوضع البسيط لك الوصول إلى مئات من المسارات المُعدة مسبقًا التي تغطي أكثر من 90 دولة. تم إنشاء هذه الرحلات، المتاحة بـ 6 لغات، واختبارها أثناء تطوير OneRoadTrip. سيتم تحسين البعض في الأسابيع القادمة، خاصة فيما يتعلق بالزيارات والأنشطة.'
  },

  simpleAccessTitle: {
    fr: 'En sélectionnant un itinéraire :',
    en: 'When selecting an itinerary:',
    es: 'Al seleccionar un itinerario:',
    it: 'Selezionando un itinerario:',
    pt: 'Ao selecionar um itinerário:',
    ar: 'عند اختيار مسار:'
  },

  simpleListView: {
    fr: '<strong>Vue Liste</strong> : Vos étapes affichées avec :',
    en: '<strong>List View</strong>: Your stages displayed with:',
    es: '<strong>Vista de Lista</strong>: Sus etapas mostradas con:',
    it: '<strong>Vista Elenco</strong>: Le tue tappe visualizzate con:',
    pt: '<strong>Vista de Lista</strong>: Suas etapas exibidas com:',
    ar: '<strong>عرض القائمة</strong>: مراحلك معروضة مع:'
  },

  simpleListItems: {
    fr: [
      'Le numéro et la description de l\'étape',
      'Les visites et activités recommandées (avec photos libres de droits et liens de réservation)',
      'Le temps et distance estimée jusqu\'à la prochaine étape',
      'Le nombre de nuits (modifiable) et les dates',
      'Un lien pour réserver un hébergement',
      'Option pour supprimer l\'étape',
      'Possibilité de réorganiser les étapes par glisser-déposer'
    ],
    en: [
      'Stage number and description',
      'Recommended visits and activities (with royalty-free photos and booking links)',
      'Estimated time and distance to the next stage',
      'Number of nights (editable) and dates',
      'Link to book accommodation',
      'Option to delete a stage',
      'Ability to reorganize stages by drag-and-drop'
    ],
    es: [
      'Número y descripción de la etapa',
      'Visitas y actividades recomendadas (con fotos libres de derechos y enlaces de reserva)',
      'Tiempo y distancia estimada a la siguiente etapa',
      'Número de noches (editable) y fechas',
      'Enlace para reservar alojamiento',
      'Opción para eliminar una etapa',
      'Capacidad de reorganizar etapas arrastrando y soltando'
    ],
    it: [
      'Numero e descrizione della tappa',
      'Visite e attività consigliate (con foto royalty-free e link di prenotazione)',
      'Tempo e distanza stimati fino alla tappa successiva',
      'Numero di notti (modificabile) e date',
      'Link per prenotare alloggio',
      'Opzione per eliminare una tappa',
      'Capacità di riorganizzare le tappe con trascinamento'
    ],
    pt: [
      'Número e descrição da etapa',
      'Visitas e atividades recomendadas (com fotos livres de direitos e links de reserva)',
      'Tempo e distância estimados até a próxima etapa',
      'Número de noites (editável) e datas',
      'Link para reservar acomodação',
      'Opção para excluir uma etapa',
      'Capacidade de reorganizar etapas por arrasto'
    ],
    ar: [
      'رقم ووصف المرحلة',
      'الزيارات والأنشطة الموصى بها (مع صور خالية من الحقوق ورابط الحجوزات)',
      'الوقت والمسافة المقدرة إلى المرحلة التالية',
      'عدد الليالي (قابل للتعديل) والتواريخ',
      'رابط لحجز الإقامة',
      'خيار حذف المرحلة',
      'القدرة على إعادة تنظيم المراحل بالسحب والإفلات'
    ]
  },

  simpleMapView: {
    fr: '<strong>Vue Carte</strong> (plein écran possible) : Visualisez votre trajet avec option d\'ajouter d\'autres lieux des autres itinéraires (ajout en dernière position ; réorganisation disponible sur la liste)',
    en: '<strong>Map View</strong> (fullscreen available): Visualize your route with the option to add places from other itineraries (added at the end; reorganization available on the list)',
    es: '<strong>Vista de Mapa</strong> (pantalla completa disponible): Visualice su ruta con la opción de agregar lugares de otros itinerarios (añadido al final; reorganización disponible en la lista)',
    it: '<strong>Vista Mappa</strong> (fullscreen disponibile): Visualizza il tuo percorso con l\'opzione di aggiungere luoghi da altri itinerari (aggiunto alla fine; reorganizzazione disponibile nell\'elenco)',
    pt: '<strong>Vista de Mapa</strong> (tela cheia disponível): Visualize sua rota com a opção de adicionar locais de outros itinerários (adicionado ao final; reorganização disponível na lista)',
    ar: '<strong>عرض الخريطة</strong> (ملء الشاشة متاح): تصور مسارك مع خيار إضافة أماكن من مسارات أخرى (مضاف في النهاية؛ إعادة التنظيم متاحة في القائمة)'
  },

  simpleTools: {
    fr: '<strong>En haut de page :</strong>',
    en: '<strong>At the top of the page:</strong>',
    es: '<strong>En la parte superior de la página:</strong>',
    it: '<strong>In cima alla pagina:</strong>',
    pt: '<strong>No topo da página:</strong>',
    ar: '<strong>في أعلى الصفحة:</strong>'
  },

  simpleToolsItems: {
    fr: [
      '<strong>Services</strong> : Réservez vols, voitures, assurances',
      '<strong>Outils</strong> : Fiche pays, signalement ou notation de l\'itinéraire',
      '<strong>Dashboard</strong> : Accédez à vos voyages sauvegardés (connexion requise)',
      '<strong>Carnet</strong> : Générez un carnet de voyage papier/numérique'
    ],
    en: [
      '<strong>Services</strong>: Book flights, cars, insurance',
      '<strong>Tools</strong>: Country information, report or rate the itinerary',
      '<strong>Dashboard</strong>: Access your saved trips (login required)',
      '<strong>Notebook</strong>: Generate a paper/digital travel journal'
    ],
    es: [
      '<strong>Servicios</strong>: Reserve vuelos, autos, seguros',
      '<strong>Herramientas</strong>: Información del país, informe o calificación del itinerario',
      '<strong>Panel</strong>: Acceda a sus viajes guardados (se requiere inicio de sesión)',
      '<strong>Cuaderno</strong>: Genere un diario de viaje en papel/digital'
    ],
    it: [
      '<strong>Servizi</strong>: Prenota voli, auto, assicurazioni',
      '<strong>Strumenti</strong>: Informazioni sul paese, segnala o valuta l\'itinerario',
      '<strong>Dashboard</strong>: Accedi ai tuoi viaggi salvati (accesso richiesto)',
      '<strong>Quaderno</strong>: Genera un diario di viaggio cartaceo/digitale'
    ],
    pt: [
      '<strong>Serviços</strong>: Reserve voos, carros, seguros',
      '<strong>Ferramentas</strong>: Informações do país, relatório ou classificação do itinerário',
      '<strong>Painel</strong>: Acesse suas viagens salvas (login obrigatório)',
      '<strong>Caderno</strong>: Gere um diário de viagem em papel/digital'
    ],
    ar: [
      '<strong>الخدمات</strong>: احجز رحلات وسيارات وتأمين',
      '<strong>الأدوات</strong>: معلومات البلد والإبلاغ عن المسار أو تقييمه',
      '<strong>لوحة التحكم</strong>: الوصول إلى رحلاتك المحفوظة (يلزم تسجيل الدخول)',
      '<strong>الدفتر</strong>: إنشاء دفتر سفر ورقي/رقمي'
    ]
  },

  simpleExpertCTA: {
    fr: '→ Pour plus de fonctionnalités, passez au <strong>Mode Expert</strong>',
    en: '→ For more features, switch to <strong>Expert Mode</strong>',
    es: '→ Para más funciones, cambie al <strong>Modo Experto</strong>',
    it: '→ Per più funzioni, passa alla <strong>Modalità Esperto</strong>',
    pt: '→ Para mais recursos, mude para o <strong>Modo Expert</strong>',
    ar: '→ لمزيد من الميزات، انتقل إلى <strong>وضع الخبير</strong>'
  },

  // ═══════════════════════════════════════════════════════════════
  // MODE ITINÉRAIRES - EXPLICATION
  // ═══════════════════════════════════════════════════════════════

  itinsTitle: {
    fr: 'Voir les itinéraires',
    en: 'Browse itineraries',
    es: 'Ver itinerarios',
    it: 'Sfoglia gli itinerari',
    pt: 'Ver itinerários',
    ar: 'تصفح المسارات'
  },

  itinsDesc: {
    fr: 'Le mode Itinéraires vous donne accès à une page avec les titres de tous les itinéraires créés. Vous pouvez les filtrer de diverses façons. Les itinéraires vous seront présentés sous forme de guide de voyages inspirant. Ils seront entièrement personnalisables dans la page Expert.',
    en: 'The Itineraries mode gives you access to a page with the titles of all created itineraries. You can filter them in various ways. The itineraries are presented as inspiring travel guides. They are fully customizable on the Expert page.',
    es: 'El modo Itinerarios le da acceso a una página con los títulos de todos los itinerarios creados. Puede filtrarlos de varias formas. Los itinerarios se presentan como guías de viaje inspiradoras. Son completamente personalizables en la página Expert.',
    it: 'La modalità Itinerari ti dà accesso a una pagina con i titoli di tutti gli itinerari creati. Puoi filtrarli in vari modi. Gli itinerari sono presentati come guide di viaggio ispiratrici. Sono completamente personalizzabili nella pagina Expert.',
    pt: 'O modo Itinerários oferece acesso a uma página com os títulos de todos os itinerários criados. Você pode filtrá-los de várias maneiras. Os itinerários são apresentados como guias de viagem inspiradores. Eles são totalmente personalizáveis na página Expert.',
    ar: 'يوفر وضع المسارات لك الوصول إلى صفحة تحتوي على عناوين جميع المسارات التي تم إنشاؤها. يمكنك تصفيتها بطرق مختلفة. يتم عرض المسارات كأدلة سفر ملهمة. يمكن تخصيصها بالكامل في صفحة الخبير.'
  },

  itinsFeatures: {
    fr: '<strong>Fonctionnalités :</strong>',
    en: '<strong>Features:</strong>',
    es: '<strong>Características:</strong>',
    it: '<strong>Funzioni:</strong>',
    pt: '<strong>Funcionalidades:</strong>',
    ar: '<strong>الميزات:</strong>'
  },

  itinsFeaturesList: {
    fr: [
      'Accédez à tous les itinéraires disponibles avec leurs titres et descriptions',
      'Filtrez par destination, durée, type de voyage ou autres critères',
      'Consultez les itinéraires au format guide de voyage attractif',
      'Sélectionnez un itinéraire pour l\'explorer ou le modifier'
    ],
    en: [
      'Access all available itineraries with their titles and descriptions',
      'Filter by destination, duration, travel type or other criteria',
      'View itineraries in an attractive travel guide format',
      'Select an itinerary to explore or modify it'
    ],
    es: [
      'Acceda a todos los itinerarios disponibles con sus títulos y descripciones',
      'Filtre por destino, duración, tipo de viaje u otros criterios',
      'Vea los itinerarios en un formato de guía de viaje atractivo',
      'Seleccione un itinerario para explorarlo o modificarlo'
    ],
    it: [
      'Accedi a tutti gli itinerari disponibili con i loro titoli e descrizioni',
      'Filtra per destinazione, durata, tipo di viaggio o altri criteri',
      'Visualizza gli itinerari in un formato guida di viaggio attraente',
      'Seleziona un itinerario per esplorarlo o modificarlo'
    ],
    pt: [
      'Acesse todos os itinerários disponíveis com seus títulos e descrições',
      'Filtre por destino, duração, tipo de viagem ou outros critérios',
      'Visualize os itinerários em um formato de guia de viagem atraente',
      'Selecione um itinerário para explorar ou modificá-lo'
    ],
    ar: [
      'الوصول إلى جميع المسارات المتاحة مع عناوينها ووصفاتها',
      'التصفية حسب الوجهة والمدة ونوع السفر أو معايير أخرى',
      'عرض المسارات بصيغة دليل سفر جذاب',
      'حدد مسارًا لاستكشافه أو تعديله'
    ]
  },

  itinsExplore: {
    fr: 'Parcourez notre galerie d\'itinéraires pour découvrir votre prochaine destination ! Chaque guide offre une vision complète et inspirante de votre voyage.',
    en: 'Browse our itinerary gallery to discover your next destination! Each guide offers a complete and inspiring vision of your journey.',
    es: '¡Explore nuestra galería de itinerarios para descubrir su próximo destino! Cada guía ofrece una visión completa e inspiradora de su viaje.',
    it: 'Sfoglia la nostra galleria di itinerari per scoprire la tua prossima destinazione! Ogni guida offre una visione completa e stimolante del tuo viaggio.',
    pt: 'Procure na nossa galeria de itinerários para descobrir seu próximo destino! Cada guia oferece uma visão completa e inspiradora da sua jornada.',
    ar: 'تصفح معرض المسارات الخاص بنا لاكتشاف وجهتك التالية! يقدم كل دليل رؤية شاملة وملهمة لرحلتك.'
  },

  itinsExpertCTA: {
    fr: '→ Pour plus de fonctionnalités, passez en <strong>Mode Simple</strong> ou au <strong>Mode Expert</strong>',
    en: '→ For more features, switch to <strong>Simple Mode</strong> or <strong>Expert Mode</strong>',
    es: '→ Para más funciones, cambie al <strong>Modo Simple</strong> o al <strong>Modo Experto</strong>',
    it: '→ Per più funzioni, passa alla <strong>Modalità Semplice</strong> o <strong>Modalità Esperto</strong>',
    pt: '→ Para mais recursos, mude para o <strong>Modo Simples</strong> ou <strong>Modo Expert</strong>',
    ar: '→ لمزيد من الميزات، انتقل إلى <strong>الوضع البسيط</strong> أو <strong>وضع الخبير</strong>'
  },

  // ═══════════════════════════════════════════════════════════════
  // VISION - LILIA - EXPLICATION
  // ═══════════════════════════════════════════════════════════════

  visionTitle: {
    fr: 'Lilia - Vision',
    en: 'Lilia - Vision',
    es: 'Lilia - Visión',
    it: 'Lilia - Visione',
    pt: 'Lilia - Visão',
    ar: 'ليليا - الرؤية'
  },

  visionDesc: {
    fr: 'Prenez une photo et demandez à notre IA de vous raconter une œuvre, un monument, un lieu ou de traduire un menu. Limité à deux photos par jour. OneRoadTrip est gratuit et nous payons l\'IA... Pensez à réserver via nos liens sponsorisés, cela nous permettra de continuer à exister. Uniquement disponible sur mobile.',
    en: 'Take a photo and ask our AI to tell you about a artwork, a monument, a place or translate a menu. Limited to two photos per day. OneRoadTrip is free and we pay for the AI... Please book through our sponsored links, this will help us continue to exist. Available on mobile only.',
    es: 'Toma una foto y pide a nuestra IA que te cuente sobre una obra de arte, un monumento, un lugar o traduzca un menú. Limitado a dos fotos por día. OneRoadTrip es gratuito y pagamos la IA... Por favor, reserva a través de nuestros enlaces patrocinados, esto nos ayudará a continuar existiendo. Disponible solo en móvil.',
    it: 'Scatta una foto e chiedi alla nostra IA di raccontarti un\'opera d\'arte, un monumento, un luogo o di tradurre un menu. Limitato a due foto al giorno. OneRoadTrip è gratuito e paghiamo l\'IA... Per favore prenota tramite i nostri link sponsorizzati, questo ci aiuterà a continuare a esistere. Disponibile solo su mobile.',
    pt: 'Tire uma foto e peça à nossa IA para contar sobre uma obra de arte, um monumento, um lugar ou traduzir um menu. Limitado a duas fotos por dia. OneRoadTrip é gratuito e pagamos a IA... Por favor, reserve por meio de nossos links patrocinados, isso nos ajudará a continuar existindo. Disponível apenas no celular.',
    ar: 'التقط صورة واطلب من ذكاؤنا الاصطناعي أن يحكي لك عن عمل فني أو نصب أو مكان أو ترجم القائمة. محدود بصورتين يوميًا. OneRoadTrip مجاني ونحن ندفع للذكاء الاصطناعي... يرجى الحجز من خلال روابطنا المدعومة، هذا سيساعدنا على الاستمرار في البقاء. متاح على الجوال فقط.'
  },

  // ═══════════════════════════════════════════════════════════════
  // MODE EXPERT - EXPLICATION
  // ═══════════════════════════════════════════════════════════════

  expertTitle: {
    fr: 'Mode Expert',
    en: 'Expert Mode',
    es: 'Modo Experto',
    it: 'Modalità Esperto',
    pt: 'Modo Expert',
    ar: 'وضع الخبير'
  },

  expertDesc: {
    fr: 'Le Mode Expert est le plus puissant mais aussi le plus complexe de OneRoadTrip. Vous avez un contrôle total sur votre itinéraire avec quatre options de départ.',
    en: 'Expert Mode is the most powerful but also the most complex in OneRoadTrip. You have complete control over your itinerary with four starting options.',
    es: 'El Modo Experto es el más potente pero también el más complejo de OneRoadTrip. Tiene control total sobre su itinerario con cuatro opciones de inicio.',
    it: 'La Modalità Esperto è la più potente ma anche la più complessa di OneRoadTrip. Hai il controllo completo sul tuo itinerario con quattro opzioni di partenza.',
    pt: 'O Modo Expert é o mais poderoso mas também o mais complexo do OneRoadTrip. Você tem controle total sobre seu itinerário com quatro opções de início.',
    ar: 'وضع الخبير هو الأقوى لكنه أيضًا الأكثر تعقيدًا في OneRoadTrip. لديك التحكم الكامل في مسارك مع أربع خيارات بدء.'
  },

  expertFourWays: {
    fr: '<strong>Quatre façons de commencer :</strong>',
    en: '<strong>Four ways to start:</strong>',
    es: '<strong>Cuatro formas de comenzar:</strong>',
    it: '<strong>Quattro modi per iniziare:</strong>',
    pt: '<strong>Quatro maneiras de começar:</strong>',
    ar: '<strong>أربع طرق للبدء:</strong>'
  },

  expertWaysList: {
    fr: [
      'Combiner jusqu\'à trois itinéraires existants pour créer votre propre route',
      'Construire un itinéraire entièrement personnalisé lieu par lieu, en puisant parmi 5 000 destinations que nous avons référencées avec leurs activités et visites',
      'Générer un itinéraire automatiquement entre deux villes en fonction du temps que vous souhaitez y consacrer',
      'Importer depuis le web : copiez-collez n\'importe quelle page parlant de destinations (blog, guide, "les plus beaux lieux de", roadtrips...), l\'outil la transforme en itinéraire grâce à l\'IA. ⚠️ Attention : un itinéraire importé depuis une source externe ne doit en aucun cas être commercialisé — il reste pour votre usage personnel uniquement.'
    ],
    en: [
      'Combine up to three existing itineraries to create your own route',
      'Build a fully personalized itinerary location by location, drawing from 5,000 destinations we have referenced with their activities and visits',
      'Automatically generate an itinerary between two cities based on the time you want to spend there',
      'Import from the web: copy and paste any page discussing destinations (blog, guide, "most beautiful places", roadtrips...), the tool transforms it into an itinerary using AI. ⚠️ Warning: an itinerary imported from an external source must never be commercialized — it remains for your personal use only.'
    ],
    es: [
      'Combinar hasta tres itinerarios existentes para crear su propia ruta',
      'Construir un itinerario completamente personalizado lugar por lugar, utilizando 5.000 destinos que hemos referenciado con sus actividades y visitas',
      'Generar automáticamente un itinerario entre dos ciudades según el tiempo que desee pasar allí',
      'Importar desde la web: copie y pegue cualquier página que hable de destinos (blog, guía, "los lugares más bellos de", roadtrips...), la herramienta la transforma en itinerario usando IA. ⚠️ Advertencia: un itinerario importado de una fuente externa nunca debe comercializarse — es solo para su uso personal.'
    ],
    it: [
      'Combina fino a tre itinerari esistenti per creare il tuo percorso',
      'Costruisci un itinerario completamente personalizzato da luogo a luogo, utilizzando 5.000 destinazioni che abbiamo referenziato con le loro attività e visite',
      'Genera automaticamente un itinerario tra due città in base al tempo che desideri trascorrervi',
      'Importa dal web: copia e incolla qualsiasi pagina che parli di destinazioni (blog, guida, "i posti più belli di", roadtrips...), lo strumento la trasforma in un itinerario usando l\'IA. ⚠️ Attenzione: un itinerario importato da una fonte esterna non deve mai essere commercializzato — rimane solo per uso personale.'
    ],
    pt: [
      'Combine até três itinerários existentes para criar sua própria rota',
      'Construa um itinerário completamente personalizado local a local, utilizando 5.000 destinos que referenciamos com suas atividades e visitas',
      'Gere automaticamente um itinerário entre duas cidades com base no tempo que deseja passar lá',
      'Importe da web: copie e cole qualquer página discutindo destinos (blog, guia, "os lugares mais bonitos de", roadtrips...), a ferramenta a transforma em itinerário usando IA. ⚠️ Aviso: um itinerário importado de uma fonte externa nunca deve ser comercializado — é apenas para seu uso pessoal.'
    ],
    ar: [
      'دمج حتى ثلاثة مسارات موجودة لإنشاء مسارك الخاص',
      'بناء مسار مخصص بالكامل من مكان إلى آخر، باستخدام 5000 وجهة أرجعناها مع أنشطتها وزياراتها',
      'إنشاء مسار تلقائيًا بين مدينتين بناءً على الوقت الذي تريد قضاءه هناك',
      'استيراد من الويب: انسخ والصق أي صفحة تتحدث عن الوجهات (مدونة، دليل، "أجمل الأماكن في"، رحلات الطريق...)، تحول الأداة إلى مسار باستخدام الذكاء الاصطناعي. ⚠️ تحذير: لا يجب أبدًا تسويق المسار المستورد من مصدر خارجي — يبقى للاستخدام الشخصي فقط.'
    ]
  },

  expertCreatedTitle: {
    fr: '<strong>Une fois votre itinéraire créé :</strong>',
    en: '<strong>Once your itinerary is created:</strong>',
    es: '<strong>Una vez que se crea su itinerario:</strong>',
    it: '<strong>Una volta creato il tuo itinerario:</strong>',
    pt: '<strong>Depois que seu itinerário for criado:</strong>',
    ar: '<strong>بمجرد إنشاء مسارك:</strong>'
  },

  expertViews: {
    fr: 'Vous accédez à une page de personnalisation complète avec une <strong>vue en liste</strong> et une <strong>vue en carte</strong> (toutes deux redimensionnables en plein écran).',
    en: 'You access a complete customization page with a <strong>list view</strong> and a <strong>map view</strong> (both resizable in fullscreen).',
    es: 'Accede a una página de personalización completa con una <strong>vista de lista</strong> y una <strong>vista de mapa</strong> (ambas redimensionables en pantalla completa).',
    it: 'Accedi a una pagina di personalizzazione completa con una <strong>vista elenco</strong> e una <strong>vista mappa</strong> (entrambe ridimensionabili a schermo intero).',
    pt: 'Você acessa uma página de personalização completa com uma <strong>visualização em lista</strong> e uma <strong>visualização em mapa</strong> (ambas redimensionáveis em tela cheia).',
    ar: 'تصل إلى صفحة تخصيص شاملة مع <strong>عرض القائمة</strong> و<strong>عرض الخريطة</strong> (كلاهما قابل لتغيير الحجم في ملء الشاشة).'
  },

  expertListTitle: {
    fr: '<strong>Sur la liste, vous trouverez :</strong>',
    en: '<strong>On the list, you will find:</strong>',
    es: '<strong>En la lista, encontrará:</strong>',
    it: '<strong>Nell\'elenco troverai:</strong>',
    pt: '<strong>Na lista, você encontrará:</strong>',
    ar: '<strong>في القائمة، ستجد:</strong>'
  },

  expertListItems: {
    fr: [
      'La note de chaque étape (calculée par OneRoadTrip)',
      'La distance et durée jusqu\'à l\'étape suivante',
      'Options de réservation hôtel et hébergements déjà réservés',
      'Photos libres de droit',
      'Activités et visites proposées (modifiables et extensibles)'
    ],
    en: [
      'The rating of each stage (calculated by OneRoadTrip)',
      'Distance and duration to the next stage',
      'Hotel booking options and already reserved accommodations',
      'Royalty-free photos',
      'Proposed activities and visits (editable and expandable)'
    ],
    es: [
      'La calificación de cada etapa (calculada por OneRoadTrip)',
      'Distancia y duración hasta la siguiente etapa',
      'Opciones de reserva de hotel y alojamientos ya reservados',
      'Fotos libres de derechos',
      'Actividades y visitas propuestas (editables y ampliables)'
    ],
    it: [
      'La valutazione di ogni tappa (calcolata da OneRoadTrip)',
      'Distanza e durata fino alla tappa successiva',
      'Opzioni di prenotazione hotel e alloggi già prenotati',
      'Foto royalty-free',
      'Attività e visite proposte (modificabili ed estensibili)'
    ],
    pt: [
      'A classificação de cada etapa (calculada por OneRoadTrip)',
      'Distância e duração até a próxima etapa',
      'Opções de reserva de hotel e acomodações já reservadas',
      'Fotos livres de direitos',
      'Atividades e visitas propostas (editáveis e expansíveis)'
    ],
    ar: [
      'تقييم كل مرحلة (محسوب بواسطة OneRoadTrip)',
      'المسافة والمدة إلى المرحلة التالية',
      'خيارات حجز الفندق والإقامات المحجوزة بالفعل',
      'صور خالية من الحقوق',
      'الأنشطة والزيارات المقترحة (قابلة للتحرير والتوسيع)'
    ]
  },

  expertMapTitle: {
    fr: '<strong>Sur la carte, vous pouvez :</strong>',
    en: '<strong>On the map, you can:</strong>',
    es: '<strong>En el mapa, puede:</strong>',
    it: '<strong>Sulla mappa puoi:</strong>',
    pt: '<strong>No mapa, você pode:</strong>',
    ar: '<strong>على الخريطة، يمكنك:</strong>'
  },

  expertMapItems: {
    fr: [
      'Ajouter une nouvelle étape en cliquant sur la carte',
      'Déplacer les étapes existantes',
      'Ajouter des lieux de notre base de 5 000 références',
      'Réorganiser les étapes par glisser-déposer ou les copier',
      'Passer en mode édition pour réorganiser complètement votre trajet, clics après clics'
    ],
    en: [
      'Add a new stage by clicking on the map',
      'Move existing stages',
      'Add places from our database of 5,000 references',
      'Reorganize stages by drag-and-drop or copy them',
      'Switch to edit mode to completely reorganize your route, click by click'
    ],
    es: [
      'Agregue una nueva etapa haciendo clic en el mapa',
      'Mover etapas existentes',
      'Agregar lugares de nuestra base de 5.000 referencias',
      'Reorganizar etapas mediante arrastrar y soltar o copiarlas',
      'Cambiar al modo edición para reorganizar completamente su ruta, clic a clic'
    ],
    it: [
      'Aggiungi una nuova tappa cliccando sulla mappa',
      'Sposta le tappe esistenti',
      'Aggiungi luoghi dal nostro database di 5.000 riferimenti',
      'Riorganizza le tappe tramite trascinamento o copiale',
      'Passa alla modalità modifica per riorganizzare completamente il tuo percorso, clic dopo clic'
    ],
    pt: [
      'Adicione uma nova etapa clicando no mapa',
      'Mova etapas existentes',
      'Adicione locais de nossa base de dados de 5.000 referências',
      'Reorganize etapas por arrastar e soltar ou copie-as',
      'Alterne para o modo de edição para reorganizar completamente sua rota, clique a clique'
    ],
    ar: [
      'أضف مرحلة جديدة بالنقر على الخريطة',
      'حرك المراحل الموجودة',
      'أضف أماكن من قاعدة بيانات 5000 مرجع',
      'أعد تنظيم المراحل عن طريق السحب والإفلات أو انسخها',
      'بدل إلى وضع التحرير لإعادة تنظيم مسارك تمامًا، بنقرة تلو الأخرى'
    ]
  },

  expertLocationNote: {
    fr: '<strong>Remarque importante :</strong> Si un lieu n\'est pas encore référencé, vous pourrez le rajouter.',
    en: '<strong>Important note:</strong> If a place is not yet listed, you can add it.',
    es: '<strong>Nota importante:</strong> Si un lugar aún no está referenciado, puede agregarlo.',
    it: '<strong>Nota importante:</strong> Se un luogo non è ancora referenziato, puoi aggiungerlo.',
    pt: '<strong>Nota importante:</strong> Se um local ainda não estiver referenciado, você pode adicioná-lo.',
    ar: '<strong>ملاحظة مهمة:</strong> إذا لم يتم إدراج مكان بعد، يمكنك إضافته.'
  },

  expertBookingTitle: {
    fr: '<strong>Réservations et outils :</strong>',
    en: '<strong>Bookings and tools:</strong>',
    es: '<strong>Reservas y herramientas:</strong>',
    it: '<strong>Prenotazioni e strumenti:</strong>',
    pt: '<strong>Reservas e ferramentas:</strong>',
    ar: '<strong>الحجوزات والأدوات:</strong>'
  },

  expertBookingItems: {
    fr: [
      'Réservez vols, voitures, assurances depuis la barre du haut',
      'Bouton "Personnaliser" pour ajouter vos réservations (voyage ou étape)',
      'Notre IA analyse vos confirmations de réservation et les intègre automatiquement',
      'Ajoutez vos propres photos si celles proposées ne vous conviennent pas',
      'Budget calculé en temps réel'
    ],
    en: [
      'Book flights, cars, insurance from the top bar',
      '"Customize" button to add your bookings (trip or stage)',
      'Our AI analyzes your booking confirmations and integrates them automatically',
      'Add your own photos if the proposed ones don\'t suit you',
      'Budget calculated in real time'
    ],
    es: [
      'Reserve vuelos, autos, seguros desde la barra superior',
      'Botón "Personalizar" para agregar sus reservas (viaje o etapa)',
      'Nuestra IA analiza sus confirmaciones de reserva e las integra automáticamente',
      'Agregue sus propias fotos si las propuestas no le convienen',
      'Presupuesto calculado en tiempo real'
    ],
    it: [
      'Prenota voli, auto, assicurazioni dalla barra in alto',
      'Pulsante "Personalizza" per aggiungere le tue prenotazioni (viaggio o tappa)',
      'La nostra IA analizza le tue conferme di prenotazione e le integra automaticamente',
      'Aggiungi le tue foto se quelle proposte non ti piacciono',
      'Budget calcolato in tempo reale'
    ],
    pt: [
      'Reserve voos, carros, seguros na barra superior',
      'Botão "Personalizar" para adicionar suas reservas (viagem ou etapa)',
      'Nossa IA analisa suas confirmações de reserva e as integra automaticamente',
      'Adicione suas próprias fotos se as propostas não forem do seu agrado',
      'Orçamento calculado em tempo real'
    ],
    ar: [
      'احجز الرحلات والسيارات والتأمين من الشريط العلوي',
      'زر "تخصيص" لإضافة حجوزاتك (رحلة أو مرحلة)',
      'يحلل ذكاؤنا الاصطناعي تأكيدات حجزك ويدمجها تلقائيًا',
      'أضف صورك الخاصة إذا لم تناسبك الصور المقترحة',
      'الميزانية المحسوبة في الوقت الفعلي'
    ]
  },

  expertBeforeTitle: {
    fr: '<strong>Avant de partir :</strong>',
    en: '<strong>Before you go:</strong>',
    es: '<strong>Antes de partir:</strong>',
    it: '<strong>Prima di partire:</strong>',
    pt: '<strong>Antes de sair:</strong>',
    ar: '<strong>قبل أن تذهب:</strong>'
  },

  expertBeforeItems: {
    fr: [
      'Créez votre carnet de voyage (imprimable ou numérique) avec tous les détails',
      'Accédez à d\'autres outils comme la fiche pays',
      'Sauvegardez votre voyage dans le Dashboard pour le retrouver à tout moment'
    ],
    en: [
      'Create your travel journal (printable or digital) with all the details',
      'Access other tools such as the country sheet',
      'Save your trip to the Dashboard to find it anytime'
    ],
    es: [
      'Cree su diario de viaje (imprimible o digital) con todos los detalles',
      'Acceda a otras herramientas como la ficha del país',
      'Guarde su viaje en el Dashboard para encontrarlo en cualquier momento'
    ],
    it: [
      'Crea il tuo diario di viaggio (stampabile o digitale) con tutti i dettagli',
      'Accedi ad altri strumenti come la scheda paese',
      'Salva il tuo viaggio nella Dashboard per trovarlo in qualsiasi momento'
    ],
    pt: [
      'Crie seu diário de viagem (imprimível ou digital) com todos os detalhes',
      'Acesse outras ferramentas como a ficha do país',
      'Salve sua viagem no Dashboard para encontrá-la a qualquer momento'
    ],
    ar: [
      'أنشئ دفتر رحلتك (قابل للطباعة أو رقمي) مع جميع التفاصيل',
      'الوصول إلى أدوات أخرى مثل ورقة البلد',
      'احفظ رحلتك في لوحة التحكم للعثور عليها في أي وقت'
    ]
  }
};

console.log('[ORT-I18N-MODES] ✅ Chargé - Simple + Itinéraires + Expert + Vision (6 langues)');
