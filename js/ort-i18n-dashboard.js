/**
 * ort-i18n-dashboard.js - TEXTES DU TABLEAU DE BORD
 * ==================================================
 * Sortis de dashboard_user.html.
 * 8 langues : fr, en, it, es, pt, ar, nl, de
 *
 * Pour ajouter une langue : ajouter son code dans LANGS ci-dessous,
 * puis ajouter son bloc dans chacun des quatre dictionnaires.
 *
 * ATTENTION : "metas" et "count" ne sont PAS des textes mais de petites
 * fonctions. "metas(nuits, km)" fabrique la ligne "3 nuits - 450 km" et
 * "count(n)" accorde le singulier et le pluriel. Chaque langue doit garder
 * ses deux fonctions, sinon le tableau de bord ne s affiche plus.
 *
 * A charger AVANT le script principal de dashboard_user.html.
 */
(function () {
  "use strict";

  var LANGS = ["fr","en","it","es","pt","ar","nl","de"];

  // Interface du tableau de bord
  var I18N = {
  nl:{exportModules:"Modules exporteren", title:"Mijn dashboard", new:"Nieuwe reis", import:"Importeren", export:"Alles exporteren", deleteAll:"Alles verwijderen",
      hint:"Tip: je reizen worden automatisch bewaard in je ruimte.",
      empty:"Nog geen opgeslagen reizen.", start:"Een reis beginnen",
      metas:(n,k)=>`${n} nachten \u00b7 ${k} km`, needLogin:"Log in om je reizen te zien.",
      confirmDel:"Deze reis verwijderen?", confirmDelAll:"Je staat op het punt alles te verwijderen. Dit kan niet ongedaan worden gemaakt. Doorgaan?", needLoginAction:"Je moet ingelogd zijn.",
      share:"Link gekopieerd naar het klembord",
      count:(n)=> n>1 ? `${n} opgeslagen reizen` : `${n} opgeslagen reis`,
      btn:{openBuilder:"Op de kaart bewerken", "open":"↗ Openen","openEditor":"🛠️ Editor","openStatic":"🗺️ Bekijken","rename":"✏️ Hernoemen","settings":"⚙️ Instellingen","del":"🗑 Verwijderen","link":"🔗 Link","mail":"✉️ E-mail","x":"𝕏","fb":"f","photos":"Foto's","save":"Bevestigen","cancel":"Annuleren","addPhotoUrl":"Een foto toevoegen (URL)","replaceWhich":"Welke foto vervangen?","add":"Toevoegen","replace":"Vervangen"},
      toast:{"deleted":"✅ Reis verwijderd","saved":"✅ Reis opgeslagen","copied":"🔗 Link gekopieerd","renamed":"✅ Reis hernoemd","photosSaved":"📸 Foto's opgeslagen","noPhotos":"Geen foto's beschikbaar","maxPhotos":"Maximaal 4 foto's","invalidUrl":"❌ Ongeldige URL","photoAdded":"✅ Foto toegevoegd","photoReplaced":"✅ Foto vervangen","enterUrl":"Voer een URL in","clickToReplace":"Klik op een foto om die te vervangen","imageLoadError":"❌ Deze afbeelding kan niet worden geladen.<br>Mogelijke oorzaken:<br>• Onjuiste URL<br>• Google-afbeelding (CORS geblokkeerd)<br>• Site die delen blokkeert<br><br>💡 Zet je foto op Imgur of Dropbox"},
      labels:{"steps":"stops","pace":"Tempo"},
      untitled:"Zonder titel",
      btn_extra:{"share":"📤 Delen"},
      shareModal:{"title":"📸 Je afbeelding is klaar!","text":"We hebben een volledige afbeelding van je reis gemaakt. Download hem en deel hem op je favoriete sociale netwerken!","download":"⬇️ Afbeelding downloaden","close":"Sluiten","generating":"🎨 Je afbeelding wordt gemaakt..."},
      shareImage:{"intro":"En dit is onze volgende reis! Binnenkort meer informatie!"}
  },
  de:{exportModules:"Module exportieren", title:"Mein Dashboard", new:"Neue Reise", import:"Importieren", export:"Alles exportieren", deleteAll:"Alles löschen",
      hint:"Tipp: Deine Reisen werden automatisch in deinem Bereich gespeichert.",
      empty:"Noch keine gespeicherten Reisen.", start:"Eine Reise starten",
      metas:(n,k)=>`${n} N\u00e4chte \u00b7 ${k} km`, needLogin:"Melde dich an, um deine Reisen zu sehen.",
      confirmDel:"Diese Reise löschen?", confirmDelAll:"Du bist dabei, alles zu löschen. Das lässt sich nicht rückgängig machen. Fortfahren?", needLoginAction:"Du musst angemeldet sein.",
      share:"Link in die Zwischenablage kopiert",
      count:(n)=> n>1 ? `${n} gespeicherte Reisen` : `${n} gespeicherte Reise`,
      btn:{openBuilder:"Auf der Karte bearbeiten", "open":"↗ Öffnen","openEditor":"🛠️ Editor","openStatic":"🗺️ Ansehen","rename":"✏️ Umbenennen","settings":"⚙️ Einstellungen","del":"🗑 Löschen","link":"🔗 Link","mail":"✉️ E-Mail","x":"𝕏","fb":"f","photos":"Fotos","save":"Bestätigen","cancel":"Abbrechen","addPhotoUrl":"Ein Foto hinzufügen (URL)","replaceWhich":"Welches Foto ersetzen?","add":"Hinzufügen","replace":"Ersetzen"},
      toast:{"deleted":"✅ Reise gelöscht","saved":"✅ Reise gespeichert","copied":"🔗 Link kopiert","renamed":"✅ Reise umbenannt","photosSaved":"📸 Fotos gespeichert","noPhotos":"Keine Fotos verfügbar","maxPhotos":"Maximal 4 Fotos","invalidUrl":"❌ Ungültige URL","photoAdded":"✅ Foto hinzugefügt","photoReplaced":"✅ Foto ersetzt","enterUrl":"Gib eine URL ein","clickToReplace":"Klicke auf ein Foto, um es zu ersetzen","imageLoadError":"❌ Dieses Bild kann nicht geladen werden.<br>Mögliche Gründe:<br>• Falsche URL<br>• Google-Bild (CORS blockiert)<br>• Website blockiert das Teilen<br><br>💡 Lade dein Foto zu Imgur oder Dropbox hoch"},
      labels:{"steps":"Etappen","pace":"Tempo"},
      untitled:"Ohne Titel",
      btn_extra:{"share":"📤 Teilen"},
      shareModal:{"title":"📸 Dein Bild ist fertig!","text":"Wir haben ein vollständiges Bild deiner Reise erstellt. Lade es herunter und teile es in deinen liebsten sozialen Netzwerken!","download":"⬇️ Bild herunterladen","close":"Schließen","generating":"🎨 Dein Bild wird erstellt..."},
      shareImage:{"intro":"Und das ist unsere nächste Reise! Weitere Informationen folgen bald!"}
  },
  fr:{exportModules:"Export modules", title:'Mon tableau de bord', new:'Nouveau voyage', import:'Importer', export:'Exporter tout', deleteAll:'Tout supprimer',
      hint:'Conseil : vos voyages sont sauvegardés automatiquement dans votre espace.',
      empty:'Aucun voyage enregistré pour le moment.', start:'Démarrer un voyage',
      metas:(n,k)=>`${n} nuits · ${k} km`, needLogin:'Connectez-vous pour voir vos voyages.',
      confirmDel:'Supprimer ce voyage ?', confirmDelAll:'Vous êtes sur le point de tout supprimer. Cette action est irréversible. Continuer ?', needLoginAction:'Vous devez être connecté.',
      share:'Lien copié dans le presse-papiers',
      count:(n)=> n>1 ? `${n} voyages enregistrés` : `${n} voyage enregistré`,
      btn:{openBuilder:"Modifier sur la carte", open:'↗ Ouvrir', openEditor:'🛠️ Éditeur', openStatic:'🗺️ Visualiser', rename:'✏️ Renommer', settings:'⚙️ Paramètres', del:'🗑 Supprimer',
           link:'🔗 Lien', mail:'✉️ E-mail', x:'𝕏', fb:'f', photos:'Photos', save:'Valider', cancel:'Annuler',
           addPhotoUrl:'Ajouter une photo (URL)', replaceWhich:'Quelle photo remplacer ?', add:'Ajouter', replace:'Remplacer'},
      toast:{deleted:'✅ Voyage supprimé', saved:'✅ Voyage enregistré', copied:'🔗 Lien copié', 
             renamed:'✅ Voyage renommé', photosSaved:'📸 Photos enregistrées', noPhotos:'Aucune photo disponible', 
             maxPhotos:'Maximum 4 photos', invalidUrl:'❌ URL invalide', photoAdded:'✅ Photo ajoutée',
             photoReplaced:'✅ Photo remplacée', enterUrl:'Entrez une URL', clickToReplace:'Cliquez sur une photo à remplacer',
             imageLoadError:'❌ Cette image ne peut pas être chargée.<br>Raisons possibles :<br>• URL incorrecte<br>• Image Google (CORS bloqué)<br>• Site qui bloque le partage<br><br>💡 Hébergez votre photo sur Imgur ou Dropbox'},
labels:{steps:'étapes', pace:'Rythme'},
untitled:'Sans titre',
btn_extra:{share:'📤 Partager'},
shareModal:{title:'📸 Votre image est prête !', 
           text:'Nous avons généré une image complète de votre voyage. Téléchargez-la et partagez-la sur vos réseaux sociaux préférés !',
           download:'⬇️ Télécharger l\'image', close:'Fermer', generating:'🎨 Génération de votre image...'},
shareImage:{intro:'Et voici notre prochain voyage ! Plus d\'informations très prochainement !'}
  },
  en:{exportModules:"Export modules", title:'My dashboard', new:'New trip', import:'Import', export:'Export all', deleteAll:'Delete all',
      hint:'Tip: trips are auto-saved.',
      empty:'No saved trips yet.', start:'Start a trip',
      metas:(n,k)=>`${n} nights · ${k} km`, needLogin:'Sign in to see your trips.',
      confirmDel:'Delete this trip?', confirmDelAll:'You are about to delete everything. This cannot be undone. Continue?', needLoginAction:'You must be signed in.',
      share:'Share link copied to clipboard',
      count:(n)=> n>1 ? `${n} trips saved` : `${n} trip saved`,
      btn:{openBuilder:"Edit on map", open:'↗ Open', openEditor:'🛠️ Editor', openStatic:'🗺️ View', rename:'✏️ Rename', settings:'⚙️ Settings', del:'🗑 Delete',
           link:'🔗 Link', mail:'✉️ E-mail', x:'𝕏', fb:'f', photos:'Photos', save:'Save', cancel:'Cancel',
           addPhotoUrl:'Add a photo (URL)', replaceWhich:'Which photo to replace?', add:'Add', replace:'Replace'},
      toast:{deleted:'✅ Trip deleted', saved:'✅ Trip saved', copied:'🔗 Link copied',
             renamed:'✅ Trip renamed', photosSaved:'📸 Photos saved', noPhotos:'No photos available', 
             maxPhotos:'Maximum 4 photos', invalidUrl:'❌ Invalid URL', photoAdded:'✅ Photo added',
             photoReplaced:'✅ Photo replaced', enterUrl:'Enter a URL', clickToReplace:'Click on a photo to replace',
             imageLoadError:'❌ Cannot load this image. Check the URL or CORS permissions.'},
      labels:{steps:'steps', pace:'Pace'},
      untitled:'Untitled',
      btn_extra:{share:'📤 Share'},
      shareModal:{title:'📸 Your image is ready!', 
                 text:'We have generated a complete image of your trip. Download it and share it on your favorite social networks!',
                 download:'⬇️ Download image', close:'Close', generating:'🎨 Generating your image...'},
      shareImage:{intro:'And here is our next trip! More information coming soon!'}
  },
  it:{exportModules:"Esporta moduli", title:'La mia dashboard', new:'Nuovo viaggio', import:'Importa', export:'Esporta tutto', deleteAll:'Elimina tutto',
      hint:'Suggerimento: i viaggi sono salvati automaticamente.',
      empty:'Nessun viaggio salvato.', start:'Inizia col questionario',
      metas:(n,k)=>`${n} notti · ${k} km`, needLogin:'Accedi per vedere i tuoi viaggi.',
      confirmDel:'Eliminare questo viaggio?', confirmDelAll:'Stai per eliminare tutto. Questa azione è irreversibile. Continuare?', needLoginAction:'Devi essere connesso.',
      share:'Link copiato',
      count:(n)=> n>1 ? `${n} viaggi salvati` : `${n} viaggio salvato`,
      btn:{openBuilder:"Modifica sulla mappa", open:'↗ Apri', openEditor:'🛠️ Editor', openStatic:'🗺️ Visualizza', rename:'✏️ Rinomina', settings:'⚙️ Impostazioni', del:'🗑 Elimina',
           link:'🔗 Link', mail:'✉️ E-mail', x:'𝕏', fb:'f', photos:'Foto', save:'Salva', cancel:'Annulla',
           addPhotoUrl:'Aggiungi una foto (URL)', replaceWhich:'Quale foto sostituire?', add:'Aggiungi', replace:'Sostituisci'},
      toast:{deleted:'✅ Viaggio eliminato', saved:'✅ Viaggio salvato', copied:'🔗 Link copiato',
             renamed:'✅ Viaggio rinominato', photosSaved:'📸 Foto salvate', noPhotos:'Nessuna foto disponibile',
             maxPhotos:'Massimo 4 foto', invalidUrl:'❌ URL non valido', photoAdded:'✅ Foto aggiunta',
             photoReplaced:'✅ Foto sostituita', enterUrl:'Inserisci un URL', clickToReplace:'Fai clic su una foto da sostituire',
             imageLoadError:'❌ Impossibile caricare questa immagine.<br>Motivi possibili:<br>• URL non corretto<br>• CORS bloccato<br>• Sito che blocca la condivisione<br><br>💡 Ospita la tua foto su Imgur o Dropbox'},
      labels:{steps:'tappe', pace:'Ritmo'},
      untitled:'Senza titolo',
      btn_extra:{share:'📤 Condividi'},
      shareModal:{title:'📸 La tua immagine è pronta!', 
                 text:'Abbiamo generato un\'immagine completa del tuo viaggio. Scaricala e condividila sui tuoi social network preferiti!',
                 download:'⬇️ Scarica immagine', close:'Chiudi', generating:'🎨 Generazione della tua immagine...'},
      shareImage:{intro:'Ed ecco il nostro prossimo viaggio! Maggiori informazioni presto!'}
  },
  es:{exportModules:"Exportar módulos", title:'Mi panel', new:'Nuevo viaje', import:'Importar', export:'Exportar todo', deleteAll:'Borrar todo',
      hint:'Truco: los viajes se guardan automáticamente.',
      empty:'Aún no hay viajes guardados.', start:'Empezar con el cuestionario',
      metas:(n,k)=>`${n} noches · ${k} km`, needLogin:'Inicie sesión para ver sus viajes.',
      confirmDel:'¿Borrar este viaje?', confirmDelAll:'Está a punto de borrar todo. Esta acción es irreversible. ¿Continuar?', needLoginAction:'Debe haber iniciado sesión.',
      share:'Enlace copiado',
      count:(n)=> n>1 ? `${n} viajes guardados` : `${n} viaje guardado`,
      btn:{openBuilder:"Editar en el mapa", open:'↗ Abrir', openEditor:'🛠️ Editor', openStatic:'🗺️ Visualizar', rename:'✏️ Renombrar', settings:'⚙️ Ajustes', del:'🗑 Borrar',
           link:'🔗 Enlace', mail:'✉️ E-mail', x:'𝕏', fb:'f', photos:'Fotos', save:'Guardar', cancel:'Cancelar',
           addPhotoUrl:'Añadir una foto (URL)', replaceWhich:'¿Qué foto reemplazar?', add:'Añadir', replace:'Reemplazar'},
      toast:{deleted:'✅ Viaje eliminado', saved:'✅ Viaje guardado', copied:'🔗 Enlace copiado',
             renamed:'✅ Viaje renombrado', photosSaved:'📸 Fotos guardadas', noPhotos:'No hay fotos disponibles',
             maxPhotos:'Máximo 4 fotos', invalidUrl:'❌ URL no válida', photoAdded:'✅ Foto añadida',
             photoReplaced:'✅ Foto reemplazada', enterUrl:'Ingresa una URL', clickToReplace:'Haz clic en una foto para reemplazar',
             imageLoadError:'❌ No se puede cargar esta imagen.<br>Razones posibles:<br>• URL incorrecta<br>• CORS bloqueado<br>• Sitio que bloquea el uso compartido<br><br>💡 Aloja tu foto en Imgur o Dropbox'},
      labels:{steps:'etapas', pace:'Ritmo'},
      untitled:'Sin título',
      btn_extra:{share:'📤 Compartir'},
      shareModal:{title:'📸 ¡Tu imagen está lista!', 
                 text:'Hemos generado una imagen completa de tu viaje. ¡Descárgala y compártela en tus redes sociales favoritas!',
                 download:'⬇️ Descargar imagen', close:'Cerrar', generating:'🎨 Generando tu imagen...'},
      shareImage:{intro:'¡Y aquí está nuestro próximo viaje! ¡Más información próximamente!'}
  },
  pt:{exportModules:"Exportar módulos", title:'Meu painel', new:'Nova viagem', import:'Importar', export:'Exportar tudo', deleteAll:'Excluir tudo',
      hint:'Dica: as viagens são salvas automaticamente.',
      empty:'Nenhuma viagem salva.', start:'Comece com o questionário',
      metas:(n,k)=>`${n} noites · ${k} km`, needLogin:'Entre para ver suas viagens.',
      confirmDel:'Excluir esta viagem?', confirmDelAll:'Você está prestes a excluir tudo. Esta ação é irreversível. Continuar?', needLoginAction:'Você precisa estar conectado.',
      share:'Link copiado',
      count:(n)=> n>1 ? `${n} viagens salvas` : `${n} viagem salva`,
      btn:{openBuilder:"Editar no mapa", open:'↗ Abrir', openEditor:'🛠️ Editor', openStatic:'🗺️ Visualizar', rename:'✏️ Renomear', settings:'⚙️ Definições', del:'🗑 Excluir',
           link:'🔗 Link', mail:'✉️ E-mail', x:'𝕏', fb:'f', photos:'Fotos', save:'Guardar', cancel:'Cancelar',
           addPhotoUrl:'Adicionar uma foto (URL)', replaceWhich:'Qual foto substituir?', add:'Adicionar', replace:'Substituir'},
      toast:{deleted:'✅ Viagem excluída', saved:'✅ Viagem salva', copied:'🔗 Link copiado',
             renamed:'✅ Viagem renomeada', photosSaved:'📸 Fotos salvas', noPhotos:'Nenhuma foto disponível',
             maxPhotos:'Máximo 4 fotos', invalidUrl:'❌ URL inválida', photoAdded:'✅ Foto adicionada',
             photoReplaced:'✅ Foto substituída', enterUrl:'Digite uma URL', clickToReplace:'Clique em uma foto para substituir',
             imageLoadError:'❌ Não é possível carregar esta imagem.<br>Motivos possíveis:<br>• URL incorreta<br>• CORS bloqueado<br>• Site que bloqueia o compartilhamento<br><br>💡 Hospede sua foto no Imgur ou Dropbox'},
      labels:{steps:'etapas', pace:'Ritmo'},
      untitled:'Sem título',
      btn_extra:{share:'📤 Partilhar'},
      shareModal:{title:'📸 A sua imagem está pronta!', 
                 text:'Geramos uma imagem completa da sua viagem. Descarregue-a e partilhe-a nas suas redes sociais favoritas!',
                 download:'⬇️ Descarregar imagem', close:'Fechar', generating:'🎨 A gerar a sua imagem...'},
      shareImage:{intro:'E aqui está a nossa próxima viagem! Mais informações em breve!'}
  },
  ar:{exportModules:"تصدير الوحدات", title:'لوحة التحكم الخاصة بي', new:'رحلة جديدة', import:'استيراد', export:'تصدير الكل', deleteAll:'حذف الكل',
      hint:'تلميح: تُحفَظ الرحلات تلقائيًا.',
      empty:'لا رحلات محفوظة بعد.', start:'ابدأ بالاستبيان',
      metas:(n,k)=>`${n} ليالٍ · ${k} كم`, needLogin:'سجّل الدخول لعرض رحلاتك.',
      confirmDel:'حذف هذه الرحلة؟', confirmDelAll:'أنت على وشك حذف كل شيء. هذا الإجراء لا يمكن التراجع عنه. متابعة؟', needLoginAction:'يجب أن تكون مسجلاً.',
      share:'تم نسخ الرابط',
      count:(n)=> n>1 ? `تم حفظ ${n} رحلات` : `تم حفظ رحلة واحدة`,
      btn:{openBuilder:"تعديل على الخريطة", open:'↗ فتح', openEditor:'🛠️ المحرر', openStatic:'🗺️ عرض', rename:'✏️ إعادة تسمية', settings:'⚙️ الإعدادات', del:'🗑 حذف',
           link:'🔗 رابط', mail:'✉️ بريد', x:'𝕏', fb:'f', photos:'الصور', save:'حفظ', cancel:'إلغاء',
           addPhotoUrl:'إضافة صورة (رابط URL)', replaceWhich:'أي صورة تريد استبدالها؟', add:'إضافة', replace:'استبدال'},
      toast:{deleted:'✅ تم الحذف', saved:'✅ تم الحفظ', copied:'🔗 تم النسخ',
             renamed:'✅ تم إعادة التسمية', photosSaved:'📸 تم حفظ الصور', noPhotos:'لا توجد صور متاحة',
             maxPhotos:'الحد الأقصى 4 صور', invalidUrl:'❌ رابط URL غير صحيح', photoAdded:'✅ تمت إضافة الصورة',
             photoReplaced:'✅ تم استبدال الصورة', enterUrl:'أدخل رابط URL', clickToReplace:'انقر على صورة لاستبدالها',
             imageLoadError:'❌ لا يمكن تحميل هذه الصورة.<br>الأسباب المحتملة:<br>• رابط URL غير صحيح<br>• CORS محظور<br>• موقع يحظر المشاركة<br><br>💡 استضف صورتك على Imgur أو Dropbox'},
      labels:{steps:'مراحل', pace:'الإيقاع'},
      untitled:'بدون عنوان',
      btn_extra:{share:'📤 مشاركة'},
      shareModal:{title:'📸 صورتك جاهزة!', 
                 text:'لقد قمنا بإنشاء صورة كاملة لرحلتك. قم بتنزيلها ومشاركتها على شبكات التواصل الاجتماعي المفضلة لديك!',
                 download:'⬇️ تنزيل الصورة', close:'إغلاق', generating:'🎨 جارٍ إنشاء صورتك...'},
      shareImage:{intro:'وإليكم رحلتنا القادمة! المزيد من المعلومات قريبًا!'}
  }
};

  // Carte de partage
  var SC_I18N = {
  nl: {"by":"Route gemaakt door","route":"Het traject","steps":"Onze stops","cities":"steden","nights":"nachten","duration":"Reisduur","distance":"Afstand"},
  de: {"by":"Route erstellt von","route":"Die Strecke","steps":"Unsere Etappen","cities":"Städte","nights":"Nächte","duration":"Reisedauer","distance":"Entfernung"},
      fr:{by:'Itinéraire généré par',route:'Le tracé',steps:'Nos étapes',cities:'villes',nights:'nuits',duration:'Durée du voyage',distance:'Distance'},
      en:{by:'Itinerary generated by',route:'The route',steps:'Our stops',cities:'cities',nights:'nights',duration:'Trip duration',distance:'Distance'},
      es:{by:'Itinerario generado por',route:'La ruta',steps:'Nuestras etapas',cities:'ciudades',nights:'noches',duration:'Duración del viaje',distance:'Distancia'},
      pt:{by:'Itinerário gerado por',route:'O percurso',steps:'Nossas etapas',cities:'cidades',nights:'noites',duration:'Duração da viagem',distance:'Distância'},
      it:{by:'Itinerario generato da',route:'Il percorso',steps:'Le nostre tappe',cities:'città',nights:'notti',duration:'Durata del viaggio',distance:'Distanza'},
      ar:{by:'خط سير تم إنشاؤه بواسطة',route:'المسار',steps:'محطاتنا',cities:'مدن',nights:'ليالٍ',duration:'مدة الرحلة',distance:'المسافة'}
    };

  // Fenetre de generation d image
  var CONFIRM_TEXTS = {
  nl: {"title":"📸 Een deelafbeelding maken?","text":"Klik hieronder om de details van je reis te genereren en die op sociale media te delen. Je kunt eerst een presentatietekst schrijven voordat je de afbeelding maakt.","placeholder":"Persoonlijk bericht (optioneel, max. 300 tekens)...","generate":"Afbeelding maken","cancel":"Annuleren"},
  de: {"title":"📸 Ein Bild zum Teilen erstellen?","text":"Klicke unten, um die Details deiner Reise zu erzeugen und sie in sozialen Netzwerken zu teilen. Du kannst vorher einen Begleittext schreiben.","placeholder":"Persönliche Nachricht (optional, max. 300 Zeichen)...","generate":"Bild erstellen","cancel":"Abbrechen"},
      fr: {
        title: '📸 Générer une image de partage ?',
        text: 'Cliquer ci-dessous pour générer le détail de votre voyage et le partager sur les réseaux sociaux. Vous pouvez générer un texte de présentation avant de créer l\'image.',
        placeholder: 'Message personnalisé (optionnel, 300 caractères max)...',
        generate: 'Générer l\'image',
        cancel: 'Annuler'
      },
      en: {
        title: '📸 Generate share image?',
        text: 'Click below to generate your trip details and share them on social networks. You can generate a presentation text before creating the image.',
        placeholder: 'Custom message (optional, 300 characters max)...',
        generate: 'Generate image',
        cancel: 'Cancel'
      },
      it: {
        title: '📸 Generare immagine di condivisione?',
        text: 'Clicca qui sotto per generare i dettagli del tuo viaggio e condividerli sui social network. Puoi generare un testo di presentazione prima di creare l\'immagine.',
        placeholder: 'Messaggio personalizzato (facoltativo, 300 caratteri max)...',
        generate: 'Genera immagine',
        cancel: 'Annulla'
      },
      es: {
        title: '📸 ¿Generar imagen para compartir?',
        text: 'Haz clic a continuación para generar los detalles de tu viaje y compartirlos en las redes sociales. Puedes generar un texto de presentación antes de crear la imagen.',
        placeholder: 'Mensaje personalizado (opcional, 300 caracteres máx)...',
        generate: 'Generar imagen',
        cancel: 'Cancelar'
      },
      pt: {
        title: '📸 Gerar imagem de partilha?',
        text: 'Clique abaixo para gerar os detalhes da sua viagem e partilhá-los nas redes sociais. Pode gerar um texto de apresentação antes de criar a imagem.',
        placeholder: 'Mensagem personalizada (opcional, 300 caracteres máx)...',
        generate: 'Gerar imagem',
        cancel: 'Cancelar'
      },
      ar: {
        title: '📸 إنشاء صورة للمشاركة؟',
        text: 'انقر أدناه لإنشاء تفاصيل رحلتك ومشاركتها على الشبكات الاجتماعية. يمكنك إنشاء نص تقديمي قبل إنشاء الصورة.',
        placeholder: 'رسالة مخصصة (اختياري، 300 حرف كحد أقصى)...',
        generate: 'إنشاء الصورة',
        cancel: 'إلغاء'
      }
    };

  // Message apres telechargement
  var SUCCESS_TEXTS = {
  nl: "✅ Afbeelding gedownload!",
  de: "✅ Bild heruntergeladen!",
            fr: '✅ Image téléchargée !',
            en: '✅ Image downloaded!',
            it: '✅ Immagine scaricata!',
            es: '✅ ¡Imagen descargada!',
            pt: '✅ Imagem descarregada!',
            ar: '✅ تم تنزيل الصورة!'
          };

  window.ORT_I18N_DASHBOARD = {
    LANGS: LANGS,
    I18N: I18N,
    SC_I18N: SC_I18N,
    CONFIRM_TEXTS: CONFIRM_TEXTS,
    SUCCESS_TEXTS: SUCCESS_TEXTS
  };

  console.log("[ORT-I18N-DASHBOARD] OK " + LANGS.length + " langues");
})();
