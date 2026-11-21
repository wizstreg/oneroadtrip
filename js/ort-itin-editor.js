/**
 * ORT Itinerary Editor — Éditeur d'itinéraire pour pages statiques
 * Chargé à la demande (lazy load) quand l'utilisateur clique "Modifier"
 *
 * Dépendances runtime : Leaflet (déjà chargé), Firebase Auth (déjà chargé)
 * Dépendances chargées dynamiquement : ort-state-manager.js (si absent)
 *
 * Point d'entrée :
 *   window.ORT_ITIN_EDITOR.init({ cc, itinId, lang, detailUrl })
 */
(function (global) {
  'use strict';

  // ─────────────────────────────────────────────
  // I18N — 6 langues
  // ─────────────────────────────────────────────
  const I18N = {
      "fr": {
          "editExplain": "Réorganisez les étapes, ajoutez ou supprimez des lieux. Pour modifier les visites et activités, utilisez les fonctions avancées.",
          "save": "Sauvegarder",
          "cancel": "Annuler",
          "advanced": "Modifier les étapes et leurs durées, les visites, incorporez vos hôtels, calculez votre budget, partagez votre périple, interrogez l'IA et bien d'autres choses sur la page suivante",
          "addStep": "Ajouter une étape",
          "deleteStep": "Supprimer",
          "confirmDelete": "Supprimer {name} de l'itinéraire ?",
          "confirmCancel": "Annuler les modifications ? Toutes les changements seront perdus.",
          "confirmSave": "Sauvegarder cet itinéraire dans vos voyages ?",
          "keepEditing": "Continuer sans sauvegarder",
          "saveNow": "Sauvegarder",
          "saved": "Sauvegardé !",
          "saving": "Sauvegarde…",
          "loginRequired": "Connectez-vous ou créez un compte pour sauvegarder vos modifications.",
          "loginBtn": "Se connecter / S’inscrire",
          "unsaved": "Modifications non sauvegardées",
          "searchPlace": "Rechercher un lieu…",
          "alreadyIn": "déjà dans l'itinéraire",
          "insertBefore": "Insérer avant",
          "insertAfter": "Insérer après",
          "choosePosition": "Où placer {name} ?",
          "day": "Jour",
          "step": "Étape",
          "visits": "Visites",
          "activities": "Activités",
          "noResults": "Aucun lieu trouvé",
          "close": "Fermer",
          "driveToNext": "Vers l'étape suivante",
          "start": "Début",
          "end": "Fin",
          "nVisits": "{n} visite(s)",
          "nActivities": "{n} activité(s)",
          "editBtn": "Ajoutez, supprimez, modifiez l'ordre des étapes sur cette page",
          "editStops": "Modifier",
          "editBtnSub": "(nécessite d'être connecté — la version mobile permet une visualisation plus fluide mais pas ces modifications)",
          "limitReached": "Limite de voyages sauvegardés atteinte. Supprimez un voyage existant depuis votre tableau de bord.",
          "reorgTitle": "Réorganisation",
          "reorgOnMap": "Réorganiser sur la carte",
          "reorgList": "Mode liste",
          "reorgInst": "Cliquez sur une étape pour définir l’ordre · ✕ pour supprimer · Cliquez sur un lieu gris pour l’ajouter",
          "reorgInstMobile": "Tapez les étapes dans l’ordre souhaité. Ouvrez une étape pour la supprimer. Les lieux gris peuvent être ajoutés.",
          "reorgInvert": "Inverser le circuit",
          "reorgReset": "Réinitialiser",
          "reorgPreview": "Prévisualiser",
          "reorgValidate": "Valider",
          "reorgCancel": "Annuler",
          "reorgStepCount": "{done}/{total} étapes",
          "reorgDeleted": "Supprimée",
          "reorgConfirmExit": "Quitter sans appliquer les modifications ?",
          "reorgMustKeepOne": "Gardez au moins une étape !",
          "reorgAddPlace": "Ajouter {name} ?",
          "reorgAdd": "Ajouter",
          "reorgNewOrder": "Nouvel ordre",
          "reorgPending": "En attente",
          "saveQuestion": "Sauvegarder dans vos voyages ?",
          "saveYes": "Oui, sauvegarder",
          "saveNo": "Non, juste prévisualiser",
          "saveLater": "💾 Sauvegarder",
          "saveLimit": "Nombre de voyages limité."
      },
      "en": {
          "editExplain": "Rearrange stops, add or remove places. To edit visits and activities, use advanced features.",
          "save": "Save",
          "cancel": "Cancel",
          "advanced": "Edit stops and durations, visits, add your hotels, calculate your budget, share your trip, ask AI and much more on the next page",
          "addStep": "Add a stop",
          "deleteStep": "Delete",
          "confirmDelete": "Remove {name} from the itinerary?",
          "confirmCancel": "Cancel changes? All modifications will be lost.",
          "confirmSave": "Save this itinerary to your trips?",
          "keepEditing": "Continue without saving",
          "saveNow": "Save",
          "saved": "Saved!",
          "saving": "Saving…",
          "loginRequired": "Sign in or create an account to save your changes.",
          "loginBtn": "Sign in / Register",
          "unsaved": "Unsaved changes",
          "searchPlace": "Search a place…",
          "alreadyIn": "already in itinerary",
          "insertBefore": "Insert before",
          "insertAfter": "Insert after",
          "choosePosition": "Where to place {name}?",
          "day": "Day",
          "step": "Stop",
          "visits": "Visits",
          "activities": "Activities",
          "noResults": "No places found",
          "close": "Close",
          "driveToNext": "Drive to next stop",
          "start": "Start",
          "end": "End",
          "nVisits": "{n} visit(s)",
          "nActivities": "{n} activity(ies)",
          "editBtn": "Add, remove, reorder stops on this page",
          "editStops": "Edit",
          "editBtnSub": "(requires login — mobile version allows smoother viewing but not these edits)",
          "limitReached": "Saved trips limit reached. Delete an existing trip from your dashboard.",
          "reorgTitle": "Reorganization",
          "reorgOnMap": "Reorder on map",
          "reorgList": "List mode",
          "reorgInst": "Click a stop to set the order · ✕ to delete · Click a grey place to add it",
          "reorgInstMobile": "Tap stops in your desired order. Open a stop to delete it. Grey places can be added.",
          "reorgInvert": "Reverse route",
          "reorgReset": "Reset",
          "reorgPreview": "Preview",
          "reorgValidate": "Apply",
          "reorgCancel": "Cancel",
          "reorgStepCount": "{done}/{total} stops",
          "reorgDeleted": "Deleted",
          "reorgConfirmExit": "Quit without applying changes?",
          "reorgMustKeepOne": "Keep at least one stop!",
          "reorgAddPlace": "Add {name}?",
          "reorgAdd": "Add",
          "reorgNewOrder": "New order",
          "reorgPending": "Pending",
          "saveQuestion": "Save to your trips?",
          "saveYes": "Yes, save",
          "saveNo": "No, just preview",
          "saveLater": "💾 Save",
          "saveLimit": "Saved trips limit."
      },
      "es": {
          "editExplain": "Reorganiza las paradas, añade o elimina lugares. Para modificar visitas y actividades, usa las funciones avanzadas.",
          "save": "Guardar",
          "cancel": "Cancelar",
          "advanced": "Modifica etapas y duraciones, visitas, añade tus hoteles, calcula tu presupuesto, comparte tu viaje, pregunta a la IA y mucho más en la página siguiente",
          "addStep": "Añadir una parada",
          "deleteStep": "Eliminar",
          "confirmDelete": "¿Eliminar {name} del itinerario?",
          "confirmCancel": "¿Cancelar los cambios? Se perderán todas las modificaciones.",
          "confirmSave": "¿Guardar este itinerario en tus viajes?",
          "keepEditing": "Continuar sin guardar",
          "saveNow": "Guardar",
          "saved": "¡Guardado!",
          "saving": "Guardando…",
          "loginRequired": "Inicia sesión o crea una cuenta para guardar tus cambios.",
          "loginBtn": "Iniciar sesión / Registrarse",
          "unsaved": "Cambios sin guardar",
          "searchPlace": "Buscar un lugar…",
          "alreadyIn": "ya en el itinerario",
          "insertBefore": "Insertar antes",
          "insertAfter": "Insertar después",
          "choosePosition": "¿Dónde colocar {name}?",
          "day": "Día",
          "step": "Etapa",
          "visits": "Visitas",
          "activities": "Actividades",
          "noResults": "Ningún lugar encontrado",
          "close": "Cerrar",
          "driveToNext": "Trayecto siguiente",
          "start": "Inicio",
          "end": "Fin",
          "nVisits": "{n} visita(s)",
          "nActivities": "{n} actividad(es)",
          "editBtn": "Añade, elimina, reordena las paradas en esta página",
          "editStops": "Editar",
          "editBtnSub": "(requiere iniciar sesión — la versión móvil permite una visualización más fluida pero no estas modificaciones)",
          "limitReached": "Límite de viajes guardados alcanzado. Elimina un viaje existente desde tu panel.",
          "reorgTitle": "Reorganización",
          "reorgOnMap": "Reorganizar en el mapa",
          "reorgList": "Modo lista",
          "reorgInst": "Haz clic en una parada para definir el orden · ✕ para eliminar · Haz clic en un lugar gris para añadirlo",
          "reorgInstMobile": "Toca las paradas en el orden deseado. Abre una parada para eliminarla. Los lugares grises se pueden añadir.",
          "reorgInvert": "Invertir circuito",
          "reorgReset": "Reiniciar",
          "reorgPreview": "Previsualizar",
          "reorgValidate": "Aplicar",
          "reorgCancel": "Cancelar",
          "reorgStepCount": "{done}/{total} paradas",
          "reorgDeleted": "Eliminada",
          "reorgConfirmExit": "¿Salir sin aplicar los cambios?",
          "reorgMustKeepOne": "¡Mantén al menos una parada!",
          "reorgAddPlace": "¿Añadir {name}?",
          "reorgAdd": "Añadir",
          "reorgNewOrder": "Nuevo orden",
          "reorgPending": "Pendiente",
          "saveQuestion": "¿Guardar en tus viajes?",
          "saveYes": "Sí, guardar",
          "saveNo": "No, solo previsualizar",
          "saveLater": "💾 Guardar",
          "saveLimit": "Límite de viajes."
      },
      "pt": {
          "editExplain": "Reorganize as paragens, adicione ou remova lugares. Para editar visitas e atividades, use as funções avançadas.",
          "save": "Salvar",
          "cancel": "Cancelar",
          "advanced": "Edite etapas e durações, visitas, adicione seus hotéis, calcule seu orçamento, compartilhe sua viagem, pergunte à IA e muito mais na página seguinte",
          "addStep": "Adicionar uma paragem",
          "deleteStep": "Eliminar",
          "confirmDelete": "Remover {name} do itinerário?",
          "confirmCancel": "Cancelar as alterações? Todas as modificações serão perdidas.",
          "confirmSave": "Salvar este itinerário nas suas viagens?",
          "keepEditing": "Continuar sem salvar",
          "saveNow": "Salvar",
          "saved": "Salvo!",
          "saving": "Salvando…",
          "loginRequired": "Faça login ou crie uma conta para salvar suas alterações.",
          "loginBtn": "Entrar / Registar",
          "unsaved": "Alterações não salvas",
          "searchPlace": "Procurar um lugar…",
          "alreadyIn": "já no itinerário",
          "insertBefore": "Inserir antes",
          "insertAfter": "Inserir depois",
          "choosePosition": "Onde colocar {name}?",
          "day": "Dia",
          "step": "Etapa",
          "visits": "Visitas",
          "activities": "Atividades",
          "noResults": "Nenhum lugar encontrado",
          "close": "Fechar",
          "driveToNext": "Trajeto seguinte",
          "start": "Início",
          "end": "Fim",
          "nVisits": "{n} visita(s)",
          "nActivities": "{n} atividade(s)",
          "editBtn": "Adicione, remova, reordene paragens nesta página",
          "editStops": "Editar",
          "editBtnSub": "(requer login — a versão móvel permite uma visualização mais fluida mas não estas modificações)",
          "limitReached": "Limite de viagens salvas atingido. Exclua uma viagem existente do seu painel.",
          "reorgTitle": "Reorganização",
          "reorgOnMap": "Reorganizar no mapa",
          "reorgList": "Modo lista",
          "reorgInst": "Clique numa paragem para definir a ordem · ✕ para eliminar · Clique num lugar cinza para o adicionar",
          "reorgInstMobile": "Toque nas paragens na ordem desejada. Abra uma paragem para a eliminar. Os lugares cinzentos podem ser adicionados.",
          "reorgInvert": "Inverter circuito",
          "reorgReset": "Reiniciar",
          "reorgPreview": "Pré-visualizar",
          "reorgValidate": "Aplicar",
          "reorgCancel": "Cancelar",
          "reorgStepCount": "{done}/{total} paragens",
          "reorgDeleted": "Eliminada",
          "reorgConfirmExit": "Sair sem aplicar as alterações?",
          "reorgMustKeepOne": "Mantenha pelo menos uma paragem!",
          "reorgAddPlace": "Adicionar {name}?",
          "reorgAdd": "Adicionar",
          "reorgNewOrder": "Nova ordem",
          "reorgPending": "Pendente",
          "saveQuestion": "Salvar nas suas viagens?",
          "saveYes": "Sim, salvar",
          "saveNo": "Não, apenas pré-visualizar",
          "saveLater": "💾 Salvar",
          "saveLimit": "Limite de viagens."
      },
      "it": {
          "editExplain": "Riorganizza le tappe, aggiungi o rimuovi luoghi. Per modificare visite e attività, usa le funzioni avanzate.",
          "save": "Salva",
          "cancel": "Annulla",
          "advanced": "Modifica tappe e durate, visite, aggiungi i tuoi hotel, calcola il budget, condividi il viaggio, chiedi all'IA e molto altro nella pagina seguente",
          "addStep": "Aggiungi una tappa",
          "deleteStep": "Elimina",
          "confirmDelete": "Rimuovere {name} dall'itinerario?",
          "confirmCancel": "Annullare le modifiche? Tutte le modifiche saranno perse.",
          "confirmSave": "Salvare questo itinerario nei tuoi viaggi?",
          "keepEditing": "Continua senza salvare",
          "saveNow": "Salva",
          "saved": "Salvato!",
          "saving": "Salvataggio…",
          "loginRequired": "Accedi o crea un account per salvare le tue modifiche.",
          "loginBtn": "Accedi / Registrati",
          "unsaved": "Modifiche non salvate",
          "searchPlace": "Cerca un luogo…",
          "alreadyIn": "già nell'itinerario",
          "insertBefore": "Inserisci prima",
          "insertAfter": "Inserisci dopo",
          "choosePosition": "Dove posizionare {name}?",
          "day": "Giorno",
          "step": "Tappa",
          "visits": "Visite",
          "activities": "Attività",
          "noResults": "Nessun luogo trovato",
          "close": "Chiudi",
          "driveToNext": "Tragitto successivo",
          "start": "Inizio",
          "end": "Fine",
          "nVisits": "{n} visita/e",
          "nActivities": "{n} attività",
          "editBtn": "Aggiungi, rimuovi, riordina le tappe in questa pagina",
          "editStops": "Modifica",
          "editBtnSub": "(richiede l'accesso — la versione mobile permette una visualizzazione più fluida ma non queste modifiche)",
          "limitReached": "Limite di viaggi salvati raggiunto. Elimina un viaggio esistente dalla tua dashboard.",
          "reorgTitle": "Riorganizzazione",
          "reorgOnMap": "Riorganizza sulla mappa",
          "reorgList": "Modalità lista",
          "reorgInst": "Clicca su una tappa per definire l’ordine · ✕ per eliminare · Clicca su un luogo grigio per aggiungerlo",
          "reorgInstMobile": "Tocca le tappe nell’ordine desiderato. Apri una tappa per eliminarla. I luoghi grigi possono essere aggiunti.",
          "reorgInvert": "Inverti percorso",
          "reorgReset": "Reimposta",
          "reorgPreview": "Anteprima",
          "reorgValidate": "Applica",
          "reorgCancel": "Annulla",
          "reorgStepCount": "{done}/{total} tappe",
          "reorgDeleted": "Eliminata",
          "reorgConfirmExit": "Uscire senza applicare le modifiche?",
          "reorgMustKeepOne": "Mantieni almeno una tappa!",
          "reorgAddPlace": "Aggiungere {name}?",
          "reorgAdd": "Aggiungi",
          "reorgNewOrder": "Nuovo ordine",
          "reorgPending": "In attesa",
          "saveQuestion": "Salvare nei tuoi viaggi?",
          "saveYes": "Sì, salva",
          "saveNo": "No, solo anteprima",
          "saveLater": "💾 Salva",
          "saveLimit": "Limite viaggi raggiunto."
      },
      "ar": {
          "editExplain": "أعد ترتيب المحطات، أضف أو احذف أماكن. لتعديل الزيارات والأنشطة، استخدم الوظائف المتقدمة.",
          "save": "حفظ",
          "cancel": "إلغاء",
          "advanced": "عدّل المحطات ومددها، الزيارات، أضف فنادقك، احسب ميزانيتك، شارك رحلتك، اسأل الذكاء الاصطناعي والمزيد في الصفحة التالية",
          "addStep": "أضف محطة",
          "deleteStep": "حذف",
          "confirmDelete": "حذف {name} من المسار؟",
          "confirmCancel": "إلغاء التغييرات؟ ستفقد جميع التعديلات.",
          "confirmSave": "حفظ هذا المسار في رحلاتك؟",
          "keepEditing": "متابعة بدون حفظ",
          "saveNow": "حفظ",
          "saved": "تم الحفظ!",
          "saving": "جارٍ الحفظ…",
          "loginRequired": "سجّل الدخول أو أنشئ حسابًا لحفظ تعديلاتك.",
          "loginBtn": "تسجيل الدخول / إنشاء حساب",
          "unsaved": "تغييرات غير محفوظة",
          "searchPlace": "ابحث عن مكان…",
          "alreadyIn": "موجود في المسار",
          "insertBefore": "إدراج قبل",
          "insertAfter": "إدراج بعد",
          "choosePosition": "أين تضع {name}؟",
          "day": "يوم",
          "step": "محطة",
          "visits": "زيارات",
          "activities": "أنشطة",
          "noResults": "لم يتم العثور على أماكن",
          "close": "إغلاق",
          "driveToNext": "الطريق التالي",
          "start": "البداية",
          "end": "النهاية",
          "nVisits": "{n} زيارة/زيارات",
          "nActivities": "{n} نشاط/أنشطة",
          "editBtn": "أضف، احذف، أعد ترتيب المحطات في هذه الصفحة",
          "editStops": "تعديل",
          "editBtnSub": "(يتطلب تسجيل الدخول — نسخة الجوال تتيح عرضاً أكثر سلاسة لكن لا تسمح بهذه التعديلات)",
          "limitReached": "تم الوصول إلى الحد الأقصى للرحلات المحفوظة. احذف رحلة موجودة من لوحة التحكم.",
          "reorgTitle": "إعادة الترتيب",
          "reorgOnMap": "إعادة الترتيب على الخريطة",
          "reorgList": "وضع القائمة",
          "reorgInst": "انقر على محطة لتحديد الترتيب · ✕ للحذف · انقر على مكان رمادي لإضافته",
          "reorgInstMobile": "اضغط على المحطات بالترتيب المطلوب. افتح محطة لحذفها. يمكن إضافة الأماكن الرمادية.",
          "reorgInvert": "عكس المسار",
          "reorgReset": "إعادة تعيين",
          "reorgPreview": "معاينة",
          "reorgValidate": "تطبيق",
          "reorgCancel": "إلغاء",
          "reorgStepCount": "{done}/{total} محطات",
          "reorgDeleted": "محذوفة",
          "reorgConfirmExit": "الخروج بدون تطبيق التغييرات؟",
          "reorgMustKeepOne": "احتفظ بمحطة واحدة على الأقل!",
          "reorgAddPlace": "إضافة {name}؟",
          "reorgAdd": "إضافة",
          "reorgNewOrder": "الترتيب الجديد",
          "reorgPending": "في الانتظار",
          "saveQuestion": "حفظ في رحلاتك؟",
          "saveYes": "نعم، حفظ",
          "saveNo": "لا، معاينة فقط",
          "saveLater": "💾 حفظ",
          "saveLimit": "تم الوصول إلى الحد الأقصى."
      },
      "nl": {
          "editExplain": "Herschik de stops, voeg plaatsen toe of verwijder ze. Gebruik de geavanceerde functies om bezienswaardigheden en activiteiten te bewerken.",
          "save": "Opslaan",
          "cancel": "Annuleren",
          "advanced": "Bewerk stops en hun duur, bezienswaardigheden, voeg je hotels toe, bereken je budget, deel je reis, stel de AI vragen en veel meer op de volgende pagina",
          "addStep": "Stop toevoegen",
          "deleteStep": "Verwijderen",
          "confirmDelete": "{name} uit de route verwijderen?",
          "confirmCancel": "Wijzigingen annuleren? Alle aanpassingen gaan verloren.",
          "confirmSave": "Deze route opslaan bij je reizen?",
          "keepEditing": "Doorgaan zonder opslaan",
          "saveNow": "Opslaan",
          "saved": "Opgeslagen!",
          "saving": "Opslaan…",
          "loginRequired": "Log in of maak een account aan om je wijzigingen op te slaan.",
          "loginBtn": "Inloggen / Registreren",
          "unsaved": "Niet-opgeslagen wijzigingen",
          "searchPlace": "Zoek een plaats…",
          "alreadyIn": "staat al in de route",
          "insertBefore": "Ervoor invoegen",
          "insertAfter": "Erna invoegen",
          "choosePosition": "Waar wil je {name} plaatsen?",
          "day": "Dag",
          "step": "Stop",
          "visits": "Bezienswaardigheden",
          "activities": "Activiteiten",
          "noResults": "Geen plaatsen gevonden",
          "close": "Sluiten",
          "driveToNext": "Naar de volgende stop",
          "start": "Start",
          "end": "Einde",
          "nVisits": "{n} bezienswaardigheid(en)",
          "nActivities": "{n} activiteit(en)",
          "editBtn": "Voeg stops toe, verwijder ze of wijzig de volgorde op deze pagina",
          "editStops": "Bewerken",
          "editBtnSub": "(inloggen vereist — de mobiele versie toont alles vloeiender, maar staat deze wijzigingen niet toe)",
          "limitReached": "Limiet voor opgeslagen reizen bereikt. Verwijder een bestaande reis via je dashboard.",
          "reorgTitle": "Herschikken",
          "reorgOnMap": "Herschikken op de kaart",
          "reorgList": "Lijstweergave",
          "reorgInst": "Klik op een stop om de volgorde te bepalen · ✕ om te verwijderen · Klik op een grijze plaats om die toe te voegen",
          "reorgInstMobile": "Tik de stops aan in de gewenste volgorde. Open een stop om die te verwijderen. Grijze plaatsen kun je toevoegen.",
          "reorgInvert": "Route omkeren",
          "reorgReset": "Opnieuw instellen",
          "reorgPreview": "Voorbeeld",
          "reorgValidate": "Toepassen",
          "reorgCancel": "Annuleren",
          "reorgStepCount": "{done}/{total} stops",
          "reorgDeleted": "Verwijderd",
          "reorgConfirmExit": "Afsluiten zonder de wijzigingen toe te passen?",
          "reorgMustKeepOne": "Houd minstens één stop over!",
          "reorgAddPlace": "{name} toevoegen?",
          "reorgAdd": "Toevoegen",
          "reorgNewOrder": "Nieuwe volgorde",
          "reorgPending": "In afwachting",
          "saveQuestion": "Opslaan bij je reizen?",
          "saveYes": "Ja, opslaan",
          "saveNo": "Nee, alleen bekijken",
          "saveLater": "💾 Opslaan",
          "saveLimit": "Beperkt aantal reizen."
      },
      "de": {
          "editExplain": "Ordne die Etappen neu, füge Orte hinzu oder entferne sie. Für Sehenswürdigkeiten und Aktivitäten nutze die erweiterten Funktionen.",
          "save": "Speichern",
          "cancel": "Abbrechen",
          "advanced": "Bearbeite Etappen und deren Dauer, Sehenswürdigkeiten, füge deine Hotels hinzu, berechne dein Budget, teile deine Reise, frage die KI und vieles mehr auf der nächsten Seite",
          "addStep": "Etappe hinzufügen",
          "deleteStep": "Löschen",
          "confirmDelete": "{name} aus der Route entfernen?",
          "confirmCancel": "Änderungen verwerfen? Alle Anpassungen gehen verloren.",
          "confirmSave": "Diese Route bei deinen Reisen speichern?",
          "keepEditing": "Ohne Speichern fortfahren",
          "saveNow": "Speichern",
          "saved": "Gespeichert!",
          "saving": "Wird gespeichert…",
          "loginRequired": "Melde dich an oder erstelle ein Konto, um deine Änderungen zu speichern.",
          "loginBtn": "Anmelden / Registrieren",
          "unsaved": "Nicht gespeicherte Änderungen",
          "searchPlace": "Ort suchen…",
          "alreadyIn": "bereits in der Route",
          "insertBefore": "Davor einfügen",
          "insertAfter": "Danach einfügen",
          "choosePosition": "Wo soll {name} eingefügt werden?",
          "day": "Tag",
          "step": "Etappe",
          "visits": "Sehenswürdigkeiten",
          "activities": "Aktivitäten",
          "noResults": "Keine Orte gefunden",
          "close": "Schließen",
          "driveToNext": "Zur nächsten Etappe",
          "start": "Start",
          "end": "Ende",
          "nVisits": "{n} Sehenswürdigkeit(en)",
          "nActivities": "{n} Aktivität(en)",
          "editBtn": "Etappen auf dieser Seite hinzufügen, entfernen oder neu ordnen",
          "editStops": "Bearbeiten",
          "editBtnSub": "(Anmeldung erforderlich — die mobile Version zeigt alles flüssiger, erlaubt diese Änderungen aber nicht)",
          "limitReached": "Limit für gespeicherte Reisen erreicht. Lösche eine bestehende Reise in deinem Dashboard.",
          "reorgTitle": "Neu ordnen",
          "reorgOnMap": "Auf der Karte neu ordnen",
          "reorgList": "Listenansicht",
          "reorgInst": "Klicke auf eine Etappe, um die Reihenfolge festzulegen · ✕ zum Löschen · Klicke auf einen grauen Ort, um ihn hinzuzufügen",
          "reorgInstMobile": "Tippe die Etappen in der gewünschten Reihenfolge an. Öffne eine Etappe, um sie zu löschen. Graue Orte lassen sich hinzufügen.",
          "reorgInvert": "Route umkehren",
          "reorgReset": "Zurücksetzen",
          "reorgPreview": "Vorschau",
          "reorgValidate": "Übernehmen",
          "reorgCancel": "Abbrechen",
          "reorgStepCount": "{done}/{total} Etappen",
          "reorgDeleted": "Gelöscht",
          "reorgConfirmExit": "Beenden, ohne die Änderungen zu übernehmen?",
          "reorgMustKeepOne": "Behalte mindestens eine Etappe!",
          "reorgAddPlace": "{name} hinzufügen?",
          "reorgAdd": "Hinzufügen",
          "reorgNewOrder": "Neue Reihenfolge",
          "reorgPending": "Ausstehend",
          "saveQuestion": "Bei deinen Reisen speichern?",
          "saveYes": "Ja, speichern",
          "saveNo": "Nein, nur ansehen",
          "saveLater": "💾 Speichern",
          "saveLimit": "Begrenzte Anzahl an Reisen."
      }
  };

  // ─────────────────────────────────────────────
  // CSS — injecté au init()
  // ─────────────────────────────────────────────
  const CSS = `
/* === ORT ITIN EDITOR === */

/* Modal overlay */
.ort-ed-modal-bg{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.ort-ed-modal{background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.25);overflow:hidden}
.ort-ed-modal-head{padding:16px 20px;border-bottom:1px solid #e1e8ed;display:flex;justify-content:space-between;align-items:center}
.ort-ed-modal-head h3{font-size:1rem;margin:0;color:#113f7a}
.ort-ed-modal-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:#999;padding:4px}
.ort-ed-modal-close:hover{color:#333}
.ort-ed-modal-search{padding:10px 20px;border-bottom:1px solid #e1e8ed}
.ort-ed-modal-search input{width:100%;padding:8px 12px;border:1px solid #d0dff0;border-radius:8px;font-size:.88rem;outline:none}
.ort-ed-modal-search input:focus{border-color:#00b2ff}
.ort-ed-modal-list{flex:1;overflow-y:auto;padding:8px 0}
.ort-ed-modal-item{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;transition:background .1s}
.ort-ed-modal-item:hover{background:#f0f7ff}
.ort-ed-modal-item.disabled{opacity:.45;cursor:default;pointer-events:none}
.ort-ed-modal-item-name{font-weight:500;font-size:.9rem;flex:1}
.ort-ed-modal-item-rating{font-size:.78rem;color:#f4a623}
.ort-ed-modal-item-badge{font-size:.7rem;color:#7f8c8d;background:#f0f0f0;padding:2px 8px;border-radius:10px}
.ort-ed-modal-empty{padding:20px;text-align:center;color:#999;font-size:.88rem}

/* Position chooser modal */
.ort-ed-pos-list{padding:10px 20px}
.ort-ed-pos-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0}
.ort-ed-pos-item:last-child{border-bottom:none}
.ort-ed-pos-num{background:#e1e8ed;color:#113f7a;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0}
.ort-ed-pos-name{flex:1;font-size:.88rem}
.ort-ed-pos-btns{display:flex;gap:4px}
.ort-ed-pos-btns button{padding:4px 10px;border:1px solid #d0dff0;border-radius:6px;background:#fff;font-size:.75rem;cursor:pointer;transition:all .1s;white-space:nowrap}
.ort-ed-pos-btns button:hover{background:#113f7a;color:#fff;border-color:#113f7a}

/* Toast */
.ort-ed-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:10px;color:#fff;font-weight:600;font-size:.88rem;z-index:10002;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:opacity .3s;pointer-events:none}

/* Edit button injected into static page */
.ort-ed-launch{display:flex;align-items:stretch;gap:8px;margin:16px auto;max-width:720px;flex-wrap:wrap;justify-content:center;padding:0 16px}
.ort-ed-launch button,.ort-ed-launch a{border:none;border-radius:12px;padding:12px 20px;font-size:.85rem;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 12px rgba(0,0,0,.15);line-height:1.4;text-align:center}
.ort-ed-launch .ort-ed-btn-steps{background:linear-gradient(135deg,#113f7a,#0a2a57);color:#fff}
.ort-ed-launch .ort-ed-btn-detail{background:linear-gradient(135deg,#113f7a,#0a2a57);color:#fff;font-weight:500;font-size:.8rem}
.ort-ed-launch button:hover,.ort-ed-launch a:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.2)}
.ort-ed-launch small{font-size:.72rem;color:#7f8c8d;width:100%;text-align:center}
@media(max-width:900px){.ort-ed-launch{gap:6px;margin:12px 10px;padding:0}.ort-ed-launch button,.ort-ed-launch a{padding:10px 14px;font-size:.78rem;flex:1 1 100%}}

/* Mobile modals */
@media(max-width:900px){
  .ort-ed-modal{max-width:100%;margin:8px;max-height:90vh}
}

/* === MODE CARTE RÉORGANISATION === */
.ort-ed-map-fs .ml{display:block}
.ort-ed-map-fs #mapPanel{position:fixed!important;top:0;left:0;right:0;bottom:0;z-index:2000;height:100vh!important;width:100vw}
.ort-ed-map-fs #textPanel{display:none!important}
.ort-ed-map-fs .ip-bar{display:none}
.ort-ed-map-fs .fc{display:none!important}
.ort-ed-map-fs .ort-ed-toolbar{position:fixed;top:0;left:0;right:0;z-index:2003}
.ort-ed-map-fs .hd,.ort-ed-map-fs .ort-hdr,.ort-ed-map-fs header{display:none!important}

/* Panneau latéral réorg (desktop) */
.ort-ed-rpanel{position:fixed;top:0;right:0;bottom:0;width:320px;background:#fff;z-index:2002;box-shadow:-4px 0 20px rgba(0,0,0,.15);display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif}
.ort-ed-rpanel-head{padding:14px 16px;border-bottom:1px solid #e1e8ed;display:flex;justify-content:space-between;align-items:center}
.ort-ed-rpanel-head h3{font-size:1rem;margin:0;color:#113f7a}
.ort-ed-rpanel-inst{padding:8px 16px;font-size:.75rem;color:#7f8c8d;background:#f8f9fa;border-bottom:1px solid #e1e8ed}
.ort-ed-rpanel-tools{padding:8px 16px;display:flex;gap:6px;border-bottom:1px solid #e1e8ed}
.ort-ed-rpanel-tools button{flex:1;padding:6px;border:1px solid #d0dff0;border-radius:6px;background:#fff;font-size:.75rem;cursor:pointer;transition:all .1s}
.ort-ed-rpanel-tools button:hover{background:#113f7a;color:#fff;border-color:#113f7a}
.ort-ed-rpanel-list{flex:1;overflow-y:auto;padding:4px 0}
.ort-ed-rpanel-item{display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid #f5f5f5}
.ort-ed-rpanel-item:hover{background:#f0f7ff}
.ort-ed-rpanel-item.ordered{background:#fff5f5}
.ort-ed-rpanel-item.deleted{opacity:.35;text-decoration:line-through}
.ort-ed-rpanel-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0;color:#fff}
.ort-ed-rpanel-num.pending{background:#94a3b8}
.ort-ed-rpanel-num.ordered{background:#e11d48}
.ort-ed-rpanel-num.deleted{background:#cbd5e1}
.ort-ed-rpanel-name{flex:1;font-size:.85rem}
.ort-ed-rpanel-badge{font-size:.68rem;padding:2px 6px;border-radius:8px;background:#f0f0f0;color:#999}
.ort-ed-rpanel-footer{padding:10px 16px;border-top:1px solid #e1e8ed;display:flex;gap:8px}
.ort-ed-rpanel-footer button{flex:1;padding:8px;border-radius:8px;border:none;font-weight:600;font-size:.82rem;cursor:pointer}
.ort-ed-rpanel-footer .ort-ed-rbtn-preview{background:#113f7a;color:#fff}
.ort-ed-rpanel-footer .ort-ed-rbtn-validate{background:#e11d48;color:#fff}
.ort-ed-rpanel-footer .ort-ed-rbtn-cancel{background:#f0f0f0;color:#333}

/* Avec panneau : carte réduite */
.ort-ed-map-fs.ort-ed-has-panel #mapPanel{right:320px;width:calc(100vw - 320px)}

/* Badge mobile */
.ort-ed-reorg-badge{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(17,63,122,.9);color:#fff;padding:8px 16px;border-radius:20px;font-size:.82rem;font-weight:600;z-index:2004;pointer-events:none}
/* Boutons mobile */
.ort-ed-reorg-mbtns{position:fixed;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:12px;z-index:2004;padding:0 20px}
.ort-ed-reorg-mbtns button{padding:10px 20px;border-radius:10px;border:none;font-weight:600;font-size:.88rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)}

@media(min-width:901px){
  .ort-ed-reorg-badge{display:none}
  .ort-ed-reorg-mbtns{display:none}
}
@media(max-width:900px){
  .ort-ed-rpanel{display:none!important}
  .ort-ed-map-fs.ort-ed-has-panel #mapPanel{right:0;width:100vw}
  .ort-ed-map-fs .ort-ed-toolbar{font-size:.75rem;padding:6px 10px}
}

/* Animation pulsation marqueur */
@keyframes ort-pulse{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
.ort-ed-pulse{animation:ort-pulse .3s ease}

/* Listes des fenêtres : barre de défilement toujours visible + indicateur « il y a la suite » */
.ort-ed-modal{position:relative}
.ort-ed-scroll{overflow-y:scroll!important;scrollbar-width:auto!important;scrollbar-color:#113f7a #e8edf3!important}
.ort-ed-scroll::-webkit-scrollbar{width:14px!important;display:block!important}
.ort-ed-scroll::-webkit-scrollbar-track{background:#e8edf3!important}
.ort-ed-scroll::-webkit-scrollbar-thumb{background:#113f7a!important;border:3px solid #e8edf3;border-radius:8px;min-height:40px}
.ort-ed-modal.ort-ed-has-more::after{content:'';position:absolute;left:0;right:14px;bottom:0;height:64px;background:linear-gradient(rgba(255,255,255,0),#fff 85%);pointer-events:none;border-radius:0 0 16px 16px}
.ort-ed-more{position:absolute;z-index:2;bottom:12px;left:calc(50% - 7px);transform:translateX(-50%) scale(.8);width:42px;height:42px;border-radius:50%;border:0;background:#113f7a;color:#fff;font:700 1.3rem/1 Inter,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease}
.ort-ed-more.on{opacity:1;pointer-events:auto;transform:translateX(-50%) scale(1);animation:ort-ed-bounce 1.6s ease-in-out 2}
@keyframes ort-ed-bounce{0%,100%{margin-bottom:0}50%{margin-bottom:6px}}
@media(prefers-reduced-motion:reduce){.ort-ed-more.on{animation:none}}
/* === Réorganisation V4 === */
.ort-ed-rp-sec{padding:8px 16px 4px;font-size:.7rem;color:#113f7a;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.ort-ed-rp-sec.del{color:#9ca3af}
.ort-ed-rpanel-num.active{background:#113f7a}
.ort-ed-rpanel-item{gap:6px}
.ort-ed-rpanel-item.deleted2 .ort-ed-rpanel-name{color:#9ca3af;text-decoration:line-through}
.ort-ed-rp-arr{width:28px;height:28px;flex-shrink:0;border:1px solid #d0dff0;border-radius:6px;background:#fff;color:#113f7a;font-size:.95rem;font-weight:700;cursor:pointer;padding:0;line-height:1}
.ort-ed-rp-arr:hover:not([disabled]){background:#113f7a;color:#fff;border-color:#113f7a}
.ort-ed-rp-arr[disabled]{opacity:.25;cursor:default}
.ort-ed-rp-del{width:28px;height:28px;flex-shrink:0;border:0;background:none;color:#e11d48;font-size:1rem;cursor:pointer;padding:0}
.ort-ed-rp-del:hover{background:#fff1f2;border-radius:6px}
.ort-ed-rp-restore{flex-shrink:0;border:1px solid #d0dff0;border-radius:6px;background:#fff;color:#113f7a;font-size:.75rem;font-weight:600;cursor:pointer;padding:4px 8px}
.ort-ed-rp-new{display:inline-block;background:#16a34a;color:#fff;border-radius:8px;font-size:.65rem;font-weight:700;padding:0 5px;margin-left:4px;vertical-align:1px}
.ort-ed-steppop{font-family:Inter,system-ui,sans-serif;min-width:190px}
.ort-ed-steppop-t{font-weight:700;color:#113f7a;font-size:.95rem;margin-bottom:8px;padding-right:12px}
.ort-ed-steppop-b{display:flex;gap:6px}
.ort-ed-steppop-b button{flex:1;padding:8px 10px;border-radius:8px;border:0;font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap}
.ort-ed-steppop-b .mv{background:#113f7a;color:#fff}
.ort-ed-steppop-b .del{background:#fff1f2;color:#e11d48}
.ort-ed-steppop-b .ok{background:#16a34a;color:#fff}
.ort-ed-vfab{position:fixed;z-index:2005;bottom:28px;left:50%;transform:translate(-50%,30px) scale(.92);opacity:0;pointer-events:none;background:#16a34a;color:#fff;border:0;border-radius:14px;padding:16px 36px;font:700 1.1rem/1.1 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer;transition:opacity .25s ease,transform .25s ease;white-space:nowrap}
.ort-ed-vfab.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}
.ort-ed-vfab:hover{background:#15803d}
.ort-ed-vfab:focus-visible{outline:3px solid #e49d16;outline-offset:3px}
.ort-ed-map-fs.ort-ed-has-panel .ort-ed-vfab{left:calc((100vw - 320px) / 2)}
.ort-ed-reorg-badge{top:12px;bottom:auto}
/* Textes de la page qui passaient par-dessus la carte plein écran (bandeau titre, bas de page « flow ») */
.ort-ed-map-fs section.hr,.ort-ed-map-fs .ort-flow-bottom{display:none!important}
.ort-ed-map-fs .ort-ed-toast{bottom:auto;top:20px}
.ort-ed-map-fs.ort-ed-has-panel .ort-ed-toast{left:calc((100vw - 320px) / 2)}
@media(max-width:900px){
  .ort-ed-vfab{bottom:76px;width:min(92vw,380px);padding:15px 18px;white-space:normal}
  .ort-ed-map-fs .ort-ed-toast{top:64px}
}
@media(prefers-reduced-motion:reduce){.ort-ed-vfab{transition:none}}
`;

  // ─────────────────────────────────────────────
  // ÉTAT
  // ─────────────────────────────────────────────
  let config = {};
  let t = {};               // labels i18n courants
  let steps = [];
  let originalSteps = [];
  let placesIndex = {};     // { place_id: { name, lat, lon, rating, ... } }
  let itinTitle = '';
  let originalHTML = '';
  let isDirty = false;
  let cssInjected = false;
  let editorActive = false;
  let savedTripId = null;   // tripId attribué à la première sauvegarde, réutilisé ensuite
  let editorMode = 'map';   // 'list' ou 'map' — le mode carte est le défaut


  // Textes du mode Réorganisation V4 (ajoutés au dictionnaire de la langue au démarrage)
  var REORG_V4_TXT = {
    fr: { reorgInst: '↑↓ pour changer l’ordre · ✕ pour supprimer · Cliquez sur une étape de la carte pour la déplacer · Cliquez sur un lieu gris pour l’ajouter', reorgInstMobile: 'Touchez une étape pour la déplacer ou la supprimer, et un lieu gris pour l’ajouter. La carte se met à jour à chaque changement.', reorgOrder: 'Ordre du voyage', reorgMove: 'Déplacer', reorgUp: 'Monter', reorgDown: 'Descendre', reorgRestore: 'Remettre', reorgValidateBig: 'Valider les modifications', reorgMoveTitle: 'Où déplacer {name} ?' },
    en: { reorgInst: '↑↓ to change the order · ✕ to remove · Click a stop on the map to move it · Click a grey place to add it', reorgInstMobile: 'Tap a stop to move or remove it, and a grey place to add it. The map updates with every change.', reorgOrder: 'Trip order', reorgMove: 'Move', reorgUp: 'Move up', reorgDown: 'Move down', reorgRestore: 'Restore', reorgValidateBig: 'Confirm changes', reorgMoveTitle: 'Where to move {name}?' },
    es: { reorgInst: '↑↓ para cambiar el orden · ✕ para eliminar · Haz clic en una etapa del mapa para moverla · Haz clic en un lugar gris para añadirlo', reorgInstMobile: 'Toca una etapa para moverla o eliminarla, y un lugar gris para añadirlo. El mapa se actualiza con cada cambio.', reorgOrder: 'Orden del viaje', reorgMove: 'Mover', reorgUp: 'Subir', reorgDown: 'Bajar', reorgRestore: 'Restaurar', reorgValidateBig: 'Confirmar los cambios', reorgMoveTitle: '¿Dónde mover {name}?' },
    pt: { reorgInst: '↑↓ para mudar a ordem · ✕ para remover · Clique numa etapa do mapa para a mover · Clique num local cinzento para o adicionar', reorgInstMobile: 'Toque numa etapa para a mover ou remover, e num local cinzento para o adicionar. O mapa atualiza-se a cada alteração.', reorgOrder: 'Ordem da viagem', reorgMove: 'Mover', reorgUp: 'Subir', reorgDown: 'Descer', reorgRestore: 'Repor', reorgValidateBig: 'Confirmar alterações', reorgMoveTitle: 'Para onde mover {name}?' },
    it: { reorgInst: '↑↓ per cambiare l’ordine · ✕ per eliminare · Clicca su una tappa della mappa per spostarla · Clicca su un luogo grigio per aggiungerlo', reorgInstMobile: 'Tocca una tappa per spostarla o eliminarla, e un luogo grigio per aggiungerlo. La mappa si aggiorna a ogni modifica.', reorgOrder: 'Ordine del viaggio', reorgMove: 'Sposta', reorgUp: 'Su', reorgDown: 'Giù', reorgRestore: 'Ripristina', reorgValidateBig: 'Conferma le modifiche', reorgMoveTitle: 'Dove spostare {name}?' },
    ar: { reorgInst: '↑↓ لتغيير الترتيب · ✕ للحذف · انقر على محطة في الخريطة لنقلها · انقر على مكان رمادي لإضافته', reorgInstMobile: 'المس محطة لنقلها أو حذفها، والمس مكانًا رماديًا لإضافته. تتحدث الخريطة مع كل تغيير.', reorgOrder: 'ترتيب الرحلة', reorgMove: 'نقل', reorgUp: 'إلى الأعلى', reorgDown: 'إلى الأسفل', reorgRestore: 'استعادة', reorgValidateBig: 'تأكيد التعديلات', reorgMoveTitle: 'إلى أين تنقل {name}؟' },
    nl: { reorgInst: '↑↓ om de volgorde te wijzigen · ✕ om te verwijderen · Klik op een etappe op de kaart om die te verplaatsen · Klik op een grijze plek om die toe te voegen', reorgInstMobile: 'Tik op een etappe om die te verplaatsen of te verwijderen, en op een grijze plek om die toe te voegen. De kaart wordt bij elke wijziging bijgewerkt.', reorgOrder: 'Volgorde van de reis', reorgMove: 'Verplaatsen', reorgUp: 'Omhoog', reorgDown: 'Omlaag', reorgRestore: 'Terugzetten', reorgValidateBig: 'Wijzigingen bevestigen', reorgMoveTitle: 'Waar wil je {name} heen verplaatsen?' },
    de: { reorgInst: '↑↓ zum Ändern der Reihenfolge · ✕ zum Entfernen · Klicke auf eine Etappe in der Karte, um sie zu verschieben · Klicke auf einen grauen Ort, um ihn hinzuzufügen', reorgInstMobile: 'Tippe auf eine Etappe, um sie zu verschieben oder zu entfernen, und auf einen grauen Ort, um ihn hinzuzufügen. Die Karte aktualisiert sich bei jeder Änderung.', reorgOrder: 'Reihenfolge der Reise', reorgMove: 'Verschieben', reorgUp: 'Nach oben', reorgDown: 'Nach unten', reorgRestore: 'Wiederherstellen', reorgValidateBig: 'Änderungen übernehmen', reorgMoveTitle: 'Wohin soll {name} verschoben werden?' }
  };
  function applyReorgTexts(lang) {
    var x = REORG_V4_TXT[lang] || REORG_V4_TXT.en;
    Object.keys(x).forEach(function (k) { t[k] = x[k]; });
  }

  // État de la réorganisation carte
  let reorg = {
    active: false,
    newOrder: [],     // place_ids dans le nouvel ordre
    deleted: [],      // place_ids supprimés
    clickTimer: null,
    savedMk: {},      // copie des marqueurs originaux
    addedPlaces: [],  // lieux ajoutés depuis OP
    opMarkers: []     // marqueurs OP rendus cliquables
  };

  // ─────────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function drvT(m) {
    if (!m) return '';
    var h = Math.floor(m / 60), mn = m % 60;
    return h > 0 ? (mn > 0 ? h + 'h' + String(mn).padStart(2, '0') : h + 'h') : mn + 'min';
  }

  function stars(r) {
    if (!r || r <= 0) return '';
    var n = Math.round(r / 2);
    if (n < 1) n = 1;
    if (n > 5) n = 5;
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function showToast(msg, type) {
    var el = document.createElement('div');
    el.className = 'ort-ed-toast';
    el.textContent = msg;
    el.style.background = type === 'error' ? '#cb2b2b' : type === 'success' ? '#2d9f3d' : '#113f7a';
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 2500);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Déterminer la langue de façon fiable (évite le bug lang="en" sur pages FR)
  function detectLang() {
    // 1. Slug du dossier dans l'URL — source la plus fiable sur les pages statiques
    var pathMap = {itineraires:'fr',itineraries:'en',rutas:'es',roteiros:'pt',itinerari:'it',masar:'ar',routes:'nl',routen:'de'};
    var pathMatch = window.location.pathname.match(/^\/(itineraires|itineraries|rutas|roteiros|itinerari|masar)\//);
    if (pathMatch && pathMap[pathMatch[1]]) return pathMap[pathMatch[1]];
    // 2. Préférence utilisateur en localStorage (pour les pages non-statiques)
    var stored = null;
    try { stored = localStorage.getItem('ORT_LANG') || localStorage.getItem('lang'); } catch(e) {}
    if (stored && /^(fr|en|es|pt|it|ar)$/.test(stored)) return stored;
    // 3. Paramètre ?lang= dans l'URL
    try {
      var urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang && /^(fr|en|es|pt|it|ar)$/.test(urlLang)) return urlLang;
    } catch(e) {}
    // 4. Fallback : attribut HTML lang
    return (document.documentElement.lang || 'fr').slice(0, 2);
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  async function init(opts) {
    config = opts || {};
    config.cc = (config.cc || '').toUpperCase();
    config.lang = config.lang || 'fr';
    t = I18N[config.lang] || I18N.en;
    applyReorgTexts(config.lang);

    console.log('[ORT-EDITOR] init', config);

    // Afficher un indicateur de chargement
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) {
      console.error('[ORT-EDITOR] #textPanel introuvable');
      return;
    }

    showToast(t.saving, 'info');

    try {
      // 1. Charger les données
      await loadItineraryData();
      await loadPlacesData();

      // 2. Sauvegarder le HTML original pour pouvoir restaurer
      originalHTML = textPanel.innerHTML;
      originalSteps = deepClone(steps);

      // 3. Activer le mode édition
      editorActive = true;
      isDirty = false;
      if (!savedTripId) savedTripId = null;  // conserver le tripId si chargé depuis Firestore
      editorMode = 'map';

      // Lancer directement le mode carte (principal)
      startMapReorg();

      // 4. Écouter les événements de limite
      window.addEventListener('ort:limit-reached', onLimitReached);

    } catch (err) {
      console.error('[ORT-EDITOR] Erreur init:', err);
      showToast(String(err.message || err), 'error');
    }
  }

  // ─────────────────────────────────────────────
  // CHARGEMENT DONNÉES
  // ─────────────────────────────────────────────
  async function loadItineraryData() {
    // Chemin alternatif : si tripId est dans l'URL, charger depuis Firestore
    var urlTripId = new URLSearchParams(window.location.search).get('tripId');
    if (urlTripId && window.ORT_STATE) {
      try {
        var trip = await window.ORT_STATE.getTrip(urlTripId);
        if (trip && trip.steps && trip.steps.length) {
          console.log('[ORT-EDITOR] Chargement depuis Firestore pour tripId:', urlTripId);
          itinTitle = trip.title || 'Roadtrip';
          config._estimatedDaysBase = trip.estimated_days_base || null;
          steps = normalizeSteps(trip.steps, config.cc);
          savedTripId = urlTripId;
          console.log('[ORT-EDITOR] ' + steps.length + ' étapes chargées depuis Firestore pour "' + itinTitle + '"');
          return;
        }
      } catch (e) {
        console.warn('[ORT-EDITOR] Firestore fallback échoué, chargement catalogue:', e);
      }
    }

    var cc = config.cc;
    var ccLow = cc.toLowerCase();
    var lang = config.lang;

    // Essayer les noms de fichiers dans les 2 casses (US.itins ou us.itins)
    var langOrder = [lang, 'en', 'fr'].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var data = null;

    for (var li = 0; li < langOrder.length; li++) {
      var tryLang = langOrder[li];
      // Essai 1: préfixe minuscule (ma.itins.modules-fr.json) — format le plus courant
      var url1 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + ccLow + '.itins.modules-' + tryLang + '.json';
      data = await fetchJSON(url1);
      if (data) break;
      // Essai 2: préfixe majuscule (MA.itins.modules-fr.json) — fallback
      var url2 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + cc + '.itins.modules-' + tryLang + '.json';
      data = await fetchJSON(url2);
      if (data) break;
    }

    if (!data) throw new Error('Impossible de charger les données de l\'itinéraire');

    var itins = data.itins || data.itineraries || data || [];
    if (!Array.isArray(itins)) itins = [];
    var itin = itins.find(function (i) { return (i.id || i.itin_id) === config.itinId; });
    if (!itin) throw new Error('Itinéraire ' + config.itinId + ' non trouvé');

    itinTitle = itin.title || itin.name || 'Roadtrip';
    config._estimatedDaysBase = itin.estimated_days_base || null;
    steps = normalizeSteps(itin.days_plan || itin.steps || [], cc);

    console.log('[ORT-EDITOR] ' + steps.length + ' étapes chargées pour "' + itinTitle + '"');
  }

  async function loadPlacesData() {
    var cc = config.cc;
    var ccLow = cc.toLowerCase();
    var lang = config.lang;
    var langOrder = [lang, 'en', 'fr'].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var data = null;

    for (var li = 0; li < langOrder.length; li++) {
      var tryLang = langOrder[li];
      var url1 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + ccLow + '.places.master-' + tryLang + '.json';
      data = await fetchJSON(url1);
      if (data) break;
      var url2 = '/data/Roadtripsprefabriques/countries/' + cc + '/' + cc + '.places.master-' + tryLang + '.json';
      data = await fetchJSON(url2);
      if (data) break;
    }

    if (!data) {
      console.warn('[ORT-EDITOR] Places master introuvable, ajout impossible');
      return;
    }

    var arr = Array.isArray(data) ? data : (data.places || []);
    placesIndex = {};

    arr.forEach(function (pl) {
      var pid = pl.place_id || pl.id;
      if (!pid) return;

      var visits = Array.isArray(pl.visits)
        ? pl.visits.map(function (v) { return typeof v === 'string' ? { text: v } : v; })
        : [];
      var activities = Array.isArray(pl.activities)
        ? pl.activities.map(function (a) { return typeof a === 'string' ? { text: a } : a; })
        : [];

      placesIndex[pid] = {
        place_id: pid,
        name: pl.name || pl.title || '',
        lat: Number(pl.lat) || (pl.coords ? pl.coords[0] : null),
        lon: Number(pl.lon) || Number(pl.lng) || (pl.coords ? pl.coords[1] : null),
        rating: Number(pl.rating) || 0,
        suggested_days: Number(pl.suggested_days) || 1,
        visits: visits,
        activities: activities,
        cc: cc
      };
    });

    console.log('[ORT-EDITOR] ' + Object.keys(placesIndex).length + ' lieux chargés');
  }

  async function fetchJSON(url) {
    try {
      var r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return null;
      var ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json') && !ct.includes('text/')) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // NORMALISATION (copie de la logique ort-data-loader)
  // ─────────────────────────────────────────────
  function normalizeSteps(daysPlan, cc) {
    var result = [];
    daysPlan.forEach(function (day, idx) {
      var nightData = day.night || {};
      var placeId = nightData.place_id || day.place_id || '';
      var coords = nightData.coords || [];
      var suggestedDays = day.suggested_days || 1;
      var driveMin = day.to_next_leg ? (day.to_next_leg.drive_min || 0) : 0;
      var distanceKm = day.to_next_leg ? (day.to_next_leg.distance_km || 0) : 0;

      var transportBonus = driveMin > 300 ? 1.0 : driveMin > 180 ? 0.5 : 0;
      var nights = Math.max(0, Math.round(suggestedDays + transportBonus));

      var name = day.name || '';
      if (!name && placeId) {
        var parts = placeId.split('::');
        name = (parts[parts.length - 1] || '').replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) || ('Étape ' + (idx + 1));
      }

      var visits = Array.isArray(day.visits) ? day.visits.map(function (v) { return typeof v === 'string' ? { text: v } : v; }) : [];
      var activities = Array.isArray(day.activities) ? day.activities.map(function (a) { return typeof a === 'string' ? { text: a } : a; }) : [];

      result.push({
        _idx: result.length,
        name: name || ('Étape ' + (idx + 1)),
        lat: coords[0] || day.lat,
        lng: coords[1] || day.lng || day.lon,
        nights: nights,
        description: visits.map(function (v) { return v.text || v; }).filter(Boolean).join(' '),
        photos: [],
        distance_km: distanceKm,
        placeId: placeId,
        place_id: placeId,
        visits: visits,
        activities: activities,
        rating: day.rating || 0,
        suggested_days: suggestedDays,
        _suggestedDays: suggestedDays,
        _driveMinToNext: driveMin,
        to_next_leg: day.to_next_leg || null,
        night: nightData,
        _mapKeywords: Array.isArray(nightData.map_keywords) ? nightData.map_keywords : (Array.isArray(day.map_keywords) ? day.map_keywords : [])
      });
    });
    return result;
  }

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────

  function removeStep(index) {
    var step = steps[index];
    if (!step) return;
    if (!confirm(t.confirmDelete.replace('{name}', step.name))) return;
    steps.splice(index, 1);
    reindex();
    recalcDistances();
    isDirty = true;
    updateMap();
  }

  function addStep(position, placeData) {
    // Construire un step depuis les données du place
    var newStep = {
      _idx: 0,
      name: placeData.name || '',
      lat: placeData.lat || null,
      lng: placeData.lon || placeData.lng || null,
      nights: Math.max(0, Math.round(placeData.suggested_days || 1)),
      description: (placeData.visits || []).map(function (v) { return v.text || v; }).filter(Boolean).join(' '),
      photos: [],
      distance_km: 0,
      placeId: placeData.place_id || '',
      place_id: placeData.place_id || '',
      visits: placeData.visits || [],
      activities: placeData.activities || [],
      rating: placeData.rating || 0,
      suggested_days: placeData.suggested_days || 1,
      _suggestedDays: placeData.suggested_days || 1,
      _driveMinToNext: 0,
      to_next_leg: null,
      night: {
        place_id: placeData.place_id || '',
        coords: [placeData.lat || 0, placeData.lon || placeData.lng || 0]
      },
      _mapKeywords: []
    };

    steps.splice(position, 0, newStep);
    reindex();
    recalcDistances();
    isDirty = true;
    updateMap();
  }

  function reindex() {
    steps.forEach(function (s, i) { s._idx = i; });
  }

  // ─────────────────────────────────────────────
  // CALCUL DES DISTANCES ENTRE ÉTAPES
  // ─────────────────────────────────────────────

  // Haversine — distance à vol d'oiseau en km (résultat immédiat)
  function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Recalcule to_next_leg pour toutes les étapes
  // D'abord avec Haversine (×1.3 pour approcher la distance route),
  // puis met à jour avec OSRM si disponible
  function recalcDistances() {
    // 1. Haversine immédiat
    for (var i = 0; i < steps.length; i++) {
      if (i < steps.length - 1) {
        var a = steps[i], b = steps[i + 1];
        if (a.lat && a.lng && b.lat && b.lng) {
          var hav = haversineKm(a.lat, a.lng, b.lat, b.lng);
          var approxKm = Math.round(hav * 1.3); // facteur route
          var approxMin = Math.round(approxKm / 1.1); // ~66 km/h moyen
          a.to_next_leg = { distance_km: approxKm, duration_min: approxMin };
          a._driveMinToNext = approxMin;
        } else {
          a.to_next_leg = null;
          a._driveMinToNext = 0;
        }
      } else {
        // Dernière étape : pas de leg suivant
        steps[i].to_next_leg = null;
        steps[i]._driveMinToNext = 0;
      }
    }

    // 2. OSRM en arrière-plan pour les distances route réelles
    var coords = steps.filter(function (s) { return s.lat && s.lng; })
                      .map(function (s) { return s.lng + ',' + s.lat; });
    if (coords.length < 2) return;

    var url = 'https://router.project-osrm.org/route/v1/driving/' +
              coords.join(';') + '?overview=false&steps=false&annotations=distance,duration';

    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.routes || !data.routes[0] || !data.routes[0].legs) return;
      var legs = data.routes[0].legs;
      var stepIdx = 0;
      for (var i = 0; i < steps.length && stepIdx < legs.length; i++) {
        if (!steps[i].lat || !steps[i].lng) continue;
        if (i < steps.length - 1 && steps[i + 1].lat && steps[i + 1].lng) {
          var leg = legs[stepIdx];
          steps[i].to_next_leg = {
            distance_km: Math.round(leg.distance / 1000),
            duration_min: Math.round(leg.duration / 60)
          };
          steps[i]._driveMinToNext = Math.round(leg.duration / 60);
          stepIdx++;
        }
      }
    }).catch(function () {
      // Haversine reste en place, pas grave
    });
  }


  function closeModal() {
    var container = document.getElementById('ort-ed-modal-container');
    if (container) container.remove();
  }

  // ─────────────────────────────────────────────
  // CARTE — mise à jour de la carte Leaflet existante
  // ─────────────────────────────────────────────
  function updateMap() {
    var map = global.map;
    if (!map) return;

    // 1. Supprimer les anciens marqueurs
    var mk = global.mk || {};
    Object.keys(mk).forEach(function (key) {
      try { map.removeLayer(mk[key]); } catch (e) { }
    });
    global.mk = {};

    // 2. Supprimer l'ancienne polyline
    if (global.pl) {
      try { map.removeLayer(global.pl); } catch (e) { }
    }

    // 3. Reconstruire MP depuis les steps
    var newMP = [];
    steps.forEach(function (step, idx) {
      if (step.lat && step.lng) {
        newMP.push({
          day: idx + 1,
          name: step.name,
          lat: step.lat,
          lng: step.lng,
          tag: '',
          photo: '',
          photoAlts: [],
          htl: null
        });
      }
    });
    global.MP = newMP;

    if (newMP.length === 0) return;

    // 4. Calculer le fan pattern (décalage pour étapes au même endroit)
    var groups = {};
    newMP.forEach(function (p) {
      var k = p.lat.toFixed(4) + '_' + p.lng.toFixed(4);
      if (!groups[k]) groups[k] = [];
      groups[k].push(p);
    });
    var fanInfo = {};
    Object.keys(groups).forEach(function (k) {
      var pts = groups[k];
      if (pts.length <= 1) return;
      pts.forEach(function (p, i) {
        fanInfo[p.day] = { angle: (2 * Math.PI * i) / pts.length - Math.PI / 2, count: pts.length };
      });
    });
    var FAN_PX = 20;
    function fanPos(p) {
      var fi = fanInfo[p.day];
      if (!fi) return [p.lat, p.lng];
      var pt = map.latLngToLayerPoint([p.lat, p.lng]);
      pt.x += FAN_PX * Math.cos(fi.angle);
      pt.y += FAN_PX * Math.sin(fi.angle);
      var ll2 = map.layerPointToLatLng(pt);
      return [ll2.lat, ll2.lng];
    }

    // 5. Créer les nouveaux marqueurs
    var mkIcon = global.mkIcon;
    if (typeof mkIcon !== 'function') {
      mkIcon = function (day, active) {
        var bg = active ? '#e11d48' : '#113f7a';
        var sz = active ? 34 : 26;
        var fs = active ? 14 : 11;
        return L.divIcon({
          html: '<div style="background:' + bg + ';color:#fff;width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + fs + 'px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">' + day + '</div>',
          className: 'dm',
          iconSize: [sz, sz],
          iconAnchor: [sz / 2, sz / 2]
        });
      };
    }

    newMP.forEach(function (p) {
      var pos = fanPos(p);
      var m = L.marker(pos, { icon: mkIcon(p.day, false) }).addTo(map);
      m.bindPopup('<strong>' + esc(p.name) + '</strong>');
      m.on('click', function () {
        var el = document.getElementById('day-' + p.day);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (typeof global.hD === 'function') {
          global.hD(p.day);
        }
      });
      global.mk[p.day] = m;
    });

    // Repositionner les marqueurs décalés à chaque changement de zoom
    map.off('zoomend.fan'); // éviter les doublons
    map.on('zoomend.fan', function () {
      newMP.forEach(function (p) {
        if (!fanInfo[p.day]) return;
        var pos = fanPos(p);
        if (global.mk[p.day]) global.mk[p.day].setLatLng(pos);
      });
    });

    // 6. Dessiner la polyline
    var ll = newMP.map(function (p) { return [p.lat, p.lng]; });
    global.pl = L.polyline(ll, { color: '#113f7a', weight: 3, opacity: 0.7, dashArray: '8,6' }).addTo(map);

    // 6. Route OSRM si disponible
    if (typeof global.calculateOSRMRoute === 'function' && ll.length >= 2) {
      global.calculateOSRMRoute(ll, 'driving').then(function (result) {
        try { map.removeLayer(global.pl); } catch (e) { }
        if (result && result.coordinates && result.coordinates.length > 1) {
          global.pl = L.polyline(result.coordinates, {
            color: result.color || '#113f7a',
            weight: result.weight || 3,
            opacity: 0.8,
            dashArray: result.dashArray || null
          }).addTo(map);
        } else {
          global.pl = L.polyline(ll, { color: '#113f7a', weight: 3, opacity: 0.7, dashArray: '8,6' }).addTo(map);
        }
      }).catch(function () {
        // Garder la polyline droite
      });
    }

    // 7. Ajuster les bounds
    var bounds = L.latLngBounds(ll);
    map.fitBounds(bounds.pad(0.1));
  }

  // ─────────────────────────────────────────────
  // RECONSTRUCTION HTML — après sauvegarde
  // Reconstruit le #textPanel avec les steps modifiés
  // dans le même format que le template original (.ds, .dh, .dd, etc.)
  // ─────────────────────────────────────────────
  function rebuildDaySections() {
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) return;

    var uiStep = t.step || t.day || 'Étape';
    var uiActivities = t.activities || 'Activités';
    var uiDrive = t.driveToNext || 'Vers l\'étape suivante';

    var html = '';
    steps.forEach(function (step, idx) {
      var dayNum = idx + 1;
      var lat = step.lat || '';
      var lng = step.lng || '';

      html += '<section class="ds" id="day-' + dayNum + '" data-day="' + dayNum + '"';
      if (lat && lng) html += ' data-lat="' + lat + '" data-lng="' + lng + '"';
      html += '>';

      // Header (.dh)
      html += '<div class="dh" onclick="sD(' + dayNum + ')">';
      html += '<div class="db">' + uiStep + ' ' + dayNum + '</div>';
      html += '<div class="di"><h3>' + esc(step.name) + '</h3></div>';
      if (step.rating) html += '<div class="dr">' + stars(step.rating) + '</div>';
      html += '</div>';

      // Visites (.dd)
      var visits = step.visits || [];
      var activities = step.activities || [];
      if (visits.length || activities.length) {
        html += '<div class="dd">';
        visits.forEach(function (v, vi) {
          var txt = v.text || v;
          html += '<div class="vi"><div class="vm">' + (vi + 1) + '</div><div class="vc"><p>' + esc(txt) + '</p>';
          if (v.visit_duration_min) html += '<span class="vd">⏱ ' + v.visit_duration_min + ' min</span>';
          html += '</div></div>';
        });
        if (activities.length) {
          html += '<div class="ab"><h4>' + uiActivities + '</h4>';
          activities.forEach(function (a) {
            var txt = a.text || a;
            html += '<div class="ai"><p>' + esc(txt) + '</p>';
            if (a.activity_duration_min) html += '<span class="vd">⏱ ' + a.activity_duration_min + ' min</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      }

      // Next leg (.nl)
      if (idx < steps.length - 1 && step.to_next_leg && step.to_next_leg.distance_km) {
        html += '<div class="nl"><span>🚗</span><span>' + esc(uiDrive) + ': <b>' + Math.round(step.to_next_leg.distance_km) + ' km</b> · <b>' + drvT(step._driveMinToNext) + '</b></span></div>';
      }

      html += '</section>';
    });

    textPanel.innerHTML = html;

    // T20 : les sections .ds sont masquees par defaut et revelees via .active.
    // Sans ca, le panneau reste entierement blanc apres une fusion.
    try {
      var secs = textPanel.querySelectorAll('section.ds');
      if (secs.length && window.getComputedStyle(secs[0]).display === 'none') {
        if (typeof global.sD === 'function') { try { global.sD(1); } catch (e) {} }
        if (window.getComputedStyle(secs[0]).display === 'none') secs[0].classList.add('active');
      }
    } catch (e) {}
  }

  // ─────────────────────────────────────────────
  // SAUVEGARDE
  // ─────────────────────────────────────────────
  async function save() {
    // Vérifier la connexion
    var user = null;
    try { user = global.firebase && global.firebase.auth && global.firebase.auth().currentUser; } catch (e) { }

    if (!user) {
      showToast(t.loginRequired, 'error');
      return;
    }

    showToast(t.saving, 'info');

    // Charger ORT_STATE si nécessaire
    if (!global.ORT_STATE) {
      try {
        await loadScript('/js/ort-state-manager.js');
        // Attendre un peu que le script s'initialise
        await new Promise(function (r) { setTimeout(r, 200); });
      } catch (e) {
        console.error('[ORT-EDITOR] Impossible de charger ort-state-manager.js:', e);
        showToast('Erreur chargement', 'error');
        return;
      }
    }

    if (global.ORT_STATE && !global.ORT_STATE.currentUser) {
      try {
        await global.ORT_STATE.init({ user: user });
      } catch (e) {
        console.error('[ORT-EDITOR] Erreur init ORT_STATE:', e);
      }
    }

    if (!global.ORT_STATE) {
      showToast('Erreur système', 'error');
      return;
    }

    // Construire le tripData au même format que RT Detail
    // Réutiliser le tripId si on a déjà sauvegardé une fois
    var tripId = savedTripId || global.ORT_STATE.generateTripId();

    // Normaliser les steps pour RT Detail (qui attend step.lon, pas step.lng)
    var normalizedSteps = deepClone(steps).map(function (step) {
      if (step.lng && !step.lon) step.lon = step.lng;
      if (step.lon && !step.lng) step.lng = step.lon;
      // S'assurer que place_id est bien présent
      if (!step.place_id && step.placeId) step.place_id = step.placeId;
      if (!step.placeId && step.place_id) step.placeId = step.place_id;
      return step;
    });

    // Convertir les steps internes en days_plan (format attendu par RT Detail)
    var daysPlan = steps.map(function (step, idx) {
      var sLat = step.lat || 0;
      var sLon = step.lng || step.lon || 0;
      return {
        day: idx + 1,
        slice: 1,
        suggested_days: step.suggested_days || step._suggestedDays || 1,
        rating: step.rating || 0,
        name: step.name || '',
        night: {
          place_id: step.place_id || step.placeId || '',
          coords: (sLat && sLon) ? [sLat, sLon] : [],
          map_keywords: step._mapKeywords || []
        },
        visits: (step.visits || []).map(function (v) {
          return typeof v === 'string' ? { text: v, place_id: '' } : { text: v.text || '', place_id: v.place_id || '', visit_duration_min: v.visit_duration_min || 0 };
        }),
        activities: (step.activities || []).map(function (a) {
          return typeof a === 'string' ? { text: a, place_id: '' } : { text: a.text || '', place_id: a.place_id || '', activity_duration_min: a.activity_duration_min || 0 };
        }),
        to_next_leg: step.to_next_leg || (idx < steps.length - 1 ? { distance_km: 0, drive_min: 0, transport_mode: 'car', method: 'heuristic' } : {})
      };
    });

    var tripData = {
      id: tripId,
      title: itinTitle,
      country: config.cc,
      cc: config.cc,
      steps: normalizedSteps,
      days_plan: daysPlan,
      estimated_days_base: config._estimatedDaysBase || steps.length,
      saved: true,
      source: 'static-editor',
      _originalItinId: config.itinId,
      sourceUrl: global.location.href,
      updatedAt: Date.now(),
      createdAt: savedTripId ? undefined : Date.now(),
      nights: steps.reduce(function (sum, s) { return sum + (s.nights || 0); }, 0),
      kms: steps.reduce(function (sum, s) { return sum + (s.distance_km || 0); }, 0)
    };

    // Supprimer createdAt si undefined (mise à jour)
    if (tripData.createdAt === undefined) delete tripData.createdAt;

    try {
      var result = await global.ORT_STATE.saveTrip(tripData);
      var success = typeof result === 'object' ? result.success : result;
      var finalTripId = (typeof result === 'object' && result.tripId) ? result.tripId : tripId;

      if (success) {
        // Mémoriser le tripId pour les sauvegardes suivantes
        savedTripId = finalTripId;

        // Mettre à jour les liens vers RT Detail avec le tripId
        if (finalTripId) {
          // Stocker le tripId pour que RT Detail le retrouve (même mécanisme que import.html)
          if (global.ORT_TRIPID) {
            global.ORT_TRIPID.store(finalTripId);
          } else {
            try { localStorage.setItem('ORT_CURRENT_TRIP_ID', finalTripId); } catch (e) { }
          }

          // Construire l'URL complète avec tous les paramètres nécessaires
          var detailParams = new URLSearchParams({
            cc: config.cc,
            itin: config.itinId,
            lang: config.lang,
            days: config._estimatedDaysBase || steps.reduce(function (sum, s) { return sum + (s.nights || 0); }, 0),
            tripId: finalTripId
          });
          config.detailUrl = '/roadtrip_detail.html?' + detailParams.toString();
          document.querySelectorAll('a[href*="roadtrip_detail"]').forEach(function (a) {
            a.href = config.detailUrl;
          });
          // Mettre à jour aussi le data-detail-url du body
          document.body.dataset.detailUrl = config.detailUrl;
        }

        showToast(t.saved, 'success');
        isDirty = false;

        // Reconstruire le HTML des étapes avec le nouvel ordre
        setTimeout(function () {
          rebuildDaySections();
          editorActive = false;
          // Mettre à jour la carte avec le nouvel ordre
          updateMap();
          // Réinjecter le bouton de lancement dans le textPanel
          injectLaunchButton();
          // Réafficher le CTA flottant
          var fc = document.getElementById('fcBar');
          if (fc) fc.style.display = '';
          // Réinitialiser les observers
          reinitDayObservers();
          // Mettre à jour les originalSteps pour refléter le nouvel état
          originalSteps = deepClone(steps);
          originalHTML = document.getElementById('textPanel').innerHTML;
        }, 800);
      } else {
        showToast('Erreur sauvegarde', 'error');
      }
    } catch (err) {
      console.error('[ORT-EDITOR] Erreur sauvegarde:', err);
      showToast('Erreur: ' + (err.message || err), 'error');
    }
  }

  function onLimitReached(e) {
    showToast(t.limitReached, 'error');
  }

  // ─────────────────────────────────────────────
  // ANNULER / QUITTER
  // ─────────────────────────────────────────────
  function cancel() {
    if (isDirty || (reorg.active && (reorg.newOrder.length > 0 || reorg.deleted.length > 0))) {
      if (!confirm(t.confirmCancel)) return;
    }
    // Si en mode carte, quitter le mode carte d'abord
    if (reorg.active) {
      stopMapReorg(false);
    }
    exitEditor();
  }

  function exitEditor() {
    editorActive = false;
    isDirty = false;

    // Nettoyer les classes du mode carte si elles restent
    document.body.classList.remove('ort-ed-map-fs', 'ort-ed-has-panel');

    // Retirer la toolbar si elle est dans le body (mode carte)
    var tb = document.getElementById('ort-ed-toolbar');
    if (tb) tb.remove();

    // Restaurer le HTML original
    var textPanel = document.getElementById('textPanel');
    if (textPanel && originalHTML) {
      textPanel.innerHTML = originalHTML;
    }

    // Rétablir le CTA flottant
    var fc = document.getElementById('fcBar');
    if (fc) fc.style.display = '';

    // Réafficher le bouton de lancement
    var launcher = document.getElementById('ort-ed-launcher');
    if (launcher) launcher.style.display = '';

    // Restaurer les steps originaux et la carte
    updateMapFromOriginal();

    // Réactiver l'IntersectionObserver des day sections
    reinitDayObservers();

    // Nettoyer les event listeners
    window.removeEventListener('ort:limit-reached', onLimitReached);
  }

  function updateMapFromOriginal() {
    // Restaurer les steps d'abord, puis mettre à jour la carte
    steps = deepClone(originalSteps);
    updateMap();
  }

  function reinitDayObservers() {
    // L'IntersectionObserver original est dans une closure du template.
    // On doit en recréer un qui appelle les mêmes fonctions globales (hD, sD).
    setTimeout(function () {
      var sections = document.querySelectorAll('.ds');
      if (!sections.length) return;

      // Si le template a exposé hD et map globalement, on peut ré-observer
      if (typeof global.hD !== 'function') return;

      var newObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var d = parseInt(e.target.dataset.day);
            if (d) {
              global.hD(d);
              if (global.autoFollow && global.map) {
                var p = (global.MP || []).find(function (x) { return x.day === d; });
                if (p) global.map.panTo([p.lat, p.lng], { animate: true, duration: 0.5 });
              }
            }
          }
        });
      }, { threshold: 0.3 });

      sections.forEach(function (s) { newObs.observe(s); });
    }, 500);
  }

  function goAdvanced() {
    if (isDirty) {
      if (!confirm(t.unsaved + '. ' + t.confirmCancel)) return;
    }
    if (config.detailUrl) {
      global.location.href = config.detailUrl;
    }
  }

  // ─────────────────────────────────────────────
  // BOUTON DE LANCEMENT (injecté dans la page statique)
  // ─────────────────────────────────────────────
  function injectLaunchButton() {
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) return;
    if (document.getElementById('ort-ed-launcher')) return;

    var lang = detectLang();
    var labels = I18N[lang] || I18N.en;

    // Récupérer l'URL vers RT Detail depuis le body ou un lien existant
    var detailUrl = document.body.dataset.detailUrl || document.body.dataset.detailurl || '';
    if (!detailUrl) {
      var link = document.querySelector('a[href*="roadtrip_detail"]');
      if (link) detailUrl = link.href || link.getAttribute('href') || '';
    }

    var div = document.createElement('div');
    div.id = 'ort-ed-launcher';
    div.className = 'ort-ed-launch';

    var h = '';
    if (detailUrl) {
      h += '<a href="' + esc(detailUrl) + '" class="ort-ed-btn-detail" style="text-decoration:none;display:inline-block;text-align:center">🚀 ' + esc(labels.advanced) + '</a>';
    }

    div.innerHTML = h;
    textPanel.insertBefore(div, textPanel.firstChild);
  }

  function launch() {
    // Collecter les paramètres depuis plusieurs sources
    var body = document.body;
    var lang = detectLang();

    var opts = {
      cc: body.dataset.cc || '',
      itinId: body.dataset.itinId || body.dataset.itinid || '',
      lang: lang,
      detailUrl: body.dataset.detailUrl || body.dataset.detailurl || ''
    };

    // Fallback 1: variables globales injectées par le template
    if (!opts.cc && global.CC) opts.cc = global.CC;
    if (!opts.itinId && global.ITIN_ID) opts.itinId = global.ITIN_ID;
    if (!opts.detailUrl && global.DETAIL_URL) opts.detailUrl = global.DETAIL_URL;

    // Fallback 2: chercher dans tous les liens vers RT Detail (CTA flottant + CTA section + tout lien)
    if (!opts.cc || !opts.itinId) {
      var links = document.querySelectorAll('a[href*="roadtrip_detail"]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].href || links[i].getAttribute('href') || '';
        try {
          var u = new URL(href, global.location.origin);
          var foundCc = u.searchParams.get('cc') || '';
          var foundItin = u.searchParams.get('itin') || '';
          if (foundCc && foundItin) {
            if (!opts.cc) opts.cc = foundCc;
            if (!opts.itinId) opts.itinId = foundItin;
            if (!opts.detailUrl) opts.detailUrl = href;
            break;
          }
        } catch (e) { }
      }
    }

    if (!opts.cc || !opts.itinId) {
      console.error('[ORT-EDITOR] Paramètres manquants (cc, itinId).');
      showToast('Erreur : paramètres manquants', 'error');
      return;
    }

    // S'assurer que la langue de détail correspond à la page
    if (opts.detailUrl && opts.detailUrl.indexOf('lang=') >= 0) {
      try {
        var du = new URL(opts.detailUrl, global.location.origin);
        du.searchParams.set('lang', lang);
        opts.detailUrl = du.toString();
      } catch (e) { }
    }

    init(opts);
  }

  // ─────────────────────────────────────────────
  // BASCULE LISTE / CARTE
  // ─────────────────────────────────────────────
  function switchMode(mode) {
    if (mode === editorMode) return;
    if (mode === 'map') {
      editorMode = 'map';
      startMapReorg();
    }
    // Mode liste supprimé (V2 carte uniquement)
  }

  // ─────────────────────────────────────────────
  // MODE CARTE — DÉMARRAGE
  // ─────────────────────────────────────────────
  // V4 (nov. 2026) : le voyage complet est toujours affiché et numéroté. Chaque changement
  // (déplacer, supprimer, remettre, ajouter, inverser) redessine tout de suite la carte.
  // Un gros bouton « Valider » apparaît sur la carte dès la première modification.
  // Plus de clic « dans l'ordre » ni de prévisualisation.
  function startMapReorg() {
    reorg.active = true;
    reorg.deleted = [];
    reorg.addedPlaces = [];
    reorg.newOrder = steps.map(function (s) { return s._idx; });
    reorg.origOrder = reorg.newOrder.slice();
    reorg.mkByIdx = {};

    // Sauvegarder le HTML original si pas encore fait
    var textPanel = document.getElementById('textPanel');
    if (textPanel && !originalHTML) {
      originalHTML = textPanel.innerHTML;
    }

    // Masquer le launcher
    var launcher = document.getElementById('ort-ed-launcher');
    if (launcher) launcher.style.display = 'none';
    var fc = document.getElementById('fcBar');
    if (fc) fc.style.display = 'none';

    // Retirer la toolbar si elle existe (on n'en a pas besoin en mode carte, tout est dans le panneau)
    var existingTb = document.getElementById('ort-ed-toolbar');
    if (existingTb) existingTb.remove();

    // Passer en plein écran carte
    document.body.classList.add('ort-ed-map-fs');
    var isDesktop = window.innerWidth > 900;
    if (isDesktop) document.body.classList.add('ort-ed-has-panel');

    // Invalider la taille de la carte (plusieurs fois pour être sûr)
    var map = global.map;
    if (map) {
      [100, 300, 500].forEach(function (delay) {
        setTimeout(function () { map.invalidateSize(); }, delay);
      });
    }

    // Marqueurs des étapes : un clic ouvre « Déplacer / Supprimer »
    steps.forEach(function (step, idx) {
      var m = global.mk[idx + 1];
      if (!m) return;
      reorg.mkByIdx[step._idx] = m;
      try { m.unbindPopup(); } catch (e) { }
      m.off('click');
      m.off('dblclick');
      m.on('click', function () { handleReorgClick(step._idx); });
    });

    // Rendre les "autres lieux" (OP) cliquables pour ajout
    // D'abord, masquer les OP originaux du template (ils gardent l'ancien popup)
    hideOriginalOPMarkers();
    setupOPMarkers();

    // Afficher le panneau latéral (desktop) ou les boutons mobile
    if (isDesktop) {
      renderReorgPanel();
    } else {
      renderReorgMobile();
    }
    renderValidateFab();
    refreshReorgVisuals();

    console.log('[ORT-EDITOR] Mode carte démarré');
  }


  // Listes des fenêtres (Où placer / Où déplacer / Ajouter) : barre de défilement visible,
  // fondu en bas et bouton ↓ tant qu'il reste des lignes cachées.
  function enhanceScrollList(list) {
    if (!list || list._ortMore) return;
    var modal = list.closest('.ort-ed-modal');
    if (!modal) return;
    list.classList.add('ort-ed-scroll');
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'ort-ed-more';
    more.setAttribute('aria-hidden', 'true');
    more.tabIndex = -1;
    more.textContent = '↓';
    modal.appendChild(more);
    list._ortMore = more;
    function upd() {
      var hasMore = list.scrollHeight - list.scrollTop - list.clientHeight > 8;
      more.classList.toggle('on', hasMore);
      modal.classList.toggle('ort-ed-has-more', hasMore);
    }
    more.addEventListener('click', function () {
      try { list.scrollBy({ top: Math.round(list.clientHeight * 0.7), behavior: 'smooth' }); } catch (e) { list.scrollTop += Math.round(list.clientHeight * 0.7); }
    });
    list.addEventListener('scroll', upd, { passive: true });
    try { if (window.ResizeObserver) new ResizeObserver(upd).observe(list); } catch (e) { }
    try { if (window.MutationObserver) new MutationObserver(upd).observe(list, { childList: true }); } catch (e) { }
    setTimeout(upd, 60);
    upd();
  }

  // Retire tout ce que le mode carte a ajouté à l'écran
  function cleanupReorgUI() {
    ['ort-ed-toolbar', 'ort-ed-rpanel', 'ort-ed-reorg-badge', 'ort-ed-reorg-mbtns', 'ort-ed-vfab', 'ort-ed-help-modal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    try { if (global.map) global.map.closePopup(); } catch (e) { }
  }

  // ─────────────────────────────────────────────
  // MODE CARTE — ARRÊT
  // ─────────────────────────────────────────────
  function stopMapReorg(apply) {
    if (apply) {
      applyReorgResult();
    }

    reorg.active = false;

    // Retirer le plein écran
    document.body.classList.remove('ort-ed-map-fs', 'ort-ed-has-panel');

    // Retirer la toolbar, le panneau, le bouton Valider et les éléments mobiles
    cleanupReorgUI();

    // Nettoyer les listeners OP et restaurer les originaux
    cleanupOPMarkers();
    showOriginalOPMarkers();

    // Nettoyer la polyline grise de l'ordre original
    if (reorgOriginalPl) {
      try { global.map.removeLayer(reorgOriginalPl); } catch (e) { }
      reorgOriginalPl = null;
    }
    reorg.mkByIdx = {};

    // Restaurer les marqueurs normaux
    updateMap();

    // Invalider la carte
    if (global.map) {
      [100, 300, 500].forEach(function (d) {
        setTimeout(function () { global.map.invalidateSize(); }, d);
      });
    }

    // Remonter à la carte (ou au top si pas de carte)
    setTimeout(function () {
      var mapEl = document.getElementById('mapPanel') || document.getElementById('map');
      if (mapEl && mapEl.scrollIntoView) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  // ─────────────────────────────────────────────
  // ICÔNES RÉORG
  // ─────────────────────────────────────────────
  function reorgIcon(day, state, label) {
    var bg, sz, fs, txt, extra = '';
    if (state === 'active') {
      bg = '#113f7a'; sz = 30; fs = 13; txt = label;
    } else if (state === 'ordered') {
      bg = '#e11d48'; sz = 32; fs = 13; txt = label;
    } else if (state === 'deleted') {
      bg = '#9ca3af'; sz = 22; fs = 11; txt = '✕'; extra = 'opacity:.55;';
    } else {
      bg = '#4b7ab5'; sz = 28; fs = 12; txt = label; extra = '';
    }
    return L.divIcon({
      html: '<div style="background:' + bg + ';color:#fff;width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + fs + 'px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;' + extra + '">' + txt + '</div>',
      className: 'dm',
      iconSize: [sz, sz],
      iconAnchor: [sz / 2, sz / 2]
    });
  }

  // ─────────────────────────────────────────────
  // ACTIONS SUR LES ÉTAPES
  // ─────────────────────────────────────────────
  function stepByIdx(sIdx) {
    return steps.find(function (s) { return s._idx === sIdx; });
  }

  // Y a-t-il une vraie modification par rapport au voyage de départ ?
  function reorgIsChanged() {
    if (reorg.deleted.some(function (i) { return reorg.addedPlaces.indexOf(i) < 0; })) return true;
    if (reorg.addedPlaces.some(function (i) { return reorg.newOrder.indexOf(i) >= 0; })) return true;
    var a = reorg.newOrder, b = reorg.origOrder || [];
    if (a.length !== b.length) return true;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
    return false;
  }

  function reorgDelete(sIdx) {
    var k = reorg.newOrder.indexOf(sIdx);
    if (k < 0) return;
    if (reorg.newOrder.length <= 1) { showToast(t.reorgMustKeepOne, 'error'); return; }
    reorg.newOrder.splice(k, 1);
    if (reorg.deleted.indexOf(sIdx) < 0) reorg.deleted.push(sIdx);
    refreshReorgVisuals();
  }

  // Remet une étape supprimée à sa place d'origine (ou à la fin pour un lieu ajouté)
  function reorgRestore(sIdx) {
    var d = reorg.deleted.indexOf(sIdx);
    if (d < 0) return;
    reorg.deleted.splice(d, 1);
    var orig = reorg.origOrder || [];
    var o = orig.indexOf(sIdx);
    var at = reorg.newOrder.length;
    if (o >= 0) {
      for (var i = 0; i < reorg.newOrder.length; i++) {
        var oi = orig.indexOf(reorg.newOrder[i]);
        if (oi > o) { at = i; break; }
      }
    }
    reorg.newOrder.splice(at, 0, sIdx);
    refreshReorgVisuals();
  }

  function reorgMoveBy(sIdx, delta) {
    var k = reorg.newOrder.indexOf(sIdx);
    var j = k + delta;
    if (k < 0 || j < 0 || j >= reorg.newOrder.length) return;
    reorg.newOrder.splice(k, 1);
    reorg.newOrder.splice(j, 0, sIdx);
    refreshReorgVisuals();
  }

  // pos = rang d'insertion dans l'ordre actuel (0 = au début, i+1 = après l'étape i)
  function reorgMoveTo(sIdx, pos) {
    var k = reorg.newOrder.indexOf(sIdx);
    if (k < 0) return;
    reorg.newOrder.splice(k, 1);
    if (pos > k) pos--;
    reorg.newOrder.splice(pos, 0, sIdx);
    refreshReorgVisuals();
  }

  // Clic sur une étape de la carte : petite fenêtre « Déplacer / Supprimer » (ou « Remettre »)
  function handleReorgClick(sIdx) {
    openStepPopup(sIdx);
  }

  // Double clic (ancien geste) : supprimer / remettre
  function handleReorgDblClick(sIdx) {
    if (reorg.deleted.indexOf(sIdx) >= 0) reorgRestore(sIdx);
    else reorgDelete(sIdx);
  }

  function openStepPopup(sIdx) {
    var step = stepByIdx(sIdx);
    var map = global.map;
    if (!step || !map) return;
    var isDel = reorg.deleted.indexOf(sIdx) >= 0;
    var pos = reorg.newOrder.indexOf(sIdx);
    var box = document.createElement('div');
    box.className = 'ort-ed-steppop';
    var title = document.createElement('div');
    title.className = 'ort-ed-steppop-t';
    title.textContent = (pos >= 0 ? (pos + 1) + '. ' : '') + step.name;
    box.appendChild(title);
    var row = document.createElement('div');
    row.className = 'ort-ed-steppop-b';
    function btn(label, cls, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', function (e) { e.stopPropagation(); map.closePopup(); fn(); });
      row.appendChild(b);
    }
    if (isDel) {
      btn('↩ ' + t.reorgRestore, 'ok', function () { reorgRestore(sIdx); });
    } else {
      btn('↕ ' + t.reorgMove, 'mv', function () { openMoveModal(sIdx); });
      btn('✕ ' + t.deleteStep, 'del', function () { reorgDelete(sIdx); });
    }
    box.appendChild(row);
    var m = reorg.mkByIdx[sIdx];
    var ll = m ? m.getLatLng() : L.latLng(step.lat, step.lng);
    L.popup({ offset: [0, -10], autoPanPadding: [40, 40], className: 'ort-ed-steppop-wrap' })
      .setLatLng(ll).setContent(box).openOn(map);
  }

  // Liste : clic sur un nom = centrer la carte sur l'étape et ouvrir sa fenêtre
  function reorgFocus(sIdx) {
    var m = reorg.mkByIdx[sIdx];
    if (m && global.map) {
      try { global.map.panTo(m.getLatLng()); } catch (e) { }
    }
    openStepPopup(sIdx);
  }

  // Fenêtre « Où déplacer X ? » : Au début / Après [étape]
  function openMoveModal(sIdx) {
    var step = stepByIdx(sIdx);
    if (!step) return;
    closeModal();
    var k = reorg.newOrder.indexOf(sIdx);
    var h = '<div class="ort-ed-modal-bg" id="ort-ed-modal-bg" onclick="if(event.target===this)ORT_ITIN_EDITOR._closeModal()">';
    h += '<div class="ort-ed-modal">';
    h += '<div class="ort-ed-modal-head"><h3>' + esc(t.reorgMoveTitle.replace('{name}', step.name)) + '</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._closeModal()">×</button></div>';
    h += '<div style="overflow-y:auto;max-height:60vh;padding:8px 0" id="ort-ed-movelist">';
    if (k !== 0) {
      h += '<div class="ort-ed-pos-hover" data-move-at="0" style="display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-bottom:1px solid #f5f5f5">';
      h += '<div style="background:#e11d48;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700">↑</div>';
      h += '<div style="flex:1;font-weight:600;font-size:.88rem">' + esc(t.start) + '</div></div>';
    }
    reorg.newOrder.forEach(function (oIdx, j) {
      if (oIdx === sIdx || j === k - 1) return;
      var o = stepByIdx(oIdx);
      h += '<div class="ort-ed-pos-hover" data-move-at="' + (j + 1) + '" style="display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-bottom:1px solid #f5f5f5">';
      h += '<div style="background:#113f7a;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">' + (j + 1) + '</div>';
      h += '<div style="flex:1;font-size:.88rem">' + esc(t.insertAfter) + ' <strong>' + esc(o ? o.name : '') + '</strong></div></div>';
    });
    h += '</div></div></div>';
    var container = document.createElement('div');
    container.id = 'ort-ed-modal-container';
    container.innerHTML = h;
    var style = document.createElement('style');
    style.textContent = '.ort-ed-pos-hover:hover{background:#f0f7ff}';
    container.appendChild(style);
    document.body.appendChild(container);
    var list = document.getElementById('ort-ed-movelist');
    enhanceScrollList(list);
    if (list) {
      list.addEventListener('click', function (e) {
        var item = e.target.closest('[data-move-at]');
        if (!item) return;
        var at = parseInt(item.dataset.moveAt, 10);
        closeModal();
        reorgMoveTo(sIdx, at);
      });
    }
  }

  // ─────────────────────────────────────────────
  // MISE À JOUR VISUELLE (CARTE, LISTE, BOUTON VALIDER)
  // ─────────────────────────────────────────────
  function refreshReorgVisuals() {
    steps.forEach(function (step) {
      var m = reorg.mkByIdx[step._idx];
      if (!m) return;
      var pos = reorg.newOrder.indexOf(step._idx);
      if (reorg.deleted.indexOf(step._idx) >= 0) {
        m.setIcon(reorgIcon(0, 'deleted', '✕'));
        try { m.setZIndexOffset(-500); } catch (e) { }
      } else if (pos >= 0) {
        m.setIcon(reorgIcon(pos + 1, 'active', pos + 1));
        try { m.setZIndexOffset(1000 - pos); } catch (e) { }
      }
    });

    // Trajet redessiné dans le nouvel ordre
    updateReorgPolyline();

    // Panneau latéral ou badge mobile
    if (window.innerWidth > 900) {
      updateReorgPanelList();
    } else {
      updateReorgBadge();
    }
    updateValidateFab();
  }

  // Ligne grise en pointillés = trajet de départ ; ligne rouge pleine = trajet actuel
  var reorgOriginalPl = null;

  function updateReorgPolyline() {
    var map = global.map;
    if (!map) return;

    if (global.pl) { try { map.removeLayer(global.pl); } catch (e) { } }
    global.pl = null;

    if (!reorgOriginalPl) {
      var origLL = [];
      (reorg.origOrder || []).forEach(function (sIdx) {
        var s = stepByIdx(sIdx);
        if (s && s.lat && s.lng) origLL.push([s.lat, s.lng]);
      });
      if (origLL.length >= 2) {
        reorgOriginalPl = L.polyline(origLL, { color: '#94a3b8', weight: 3, opacity: 0.6, dashArray: '6,8', interactive: false }).addTo(map);
      }
    }

    var ll = [];
    reorg.newOrder.forEach(function (sIdx) {
      var s = stepByIdx(sIdx);
      if (s && s.lat && s.lng) ll.push([s.lat, s.lng]);
    });
    if (ll.length >= 2) {
      global.pl = L.polyline(ll, { color: '#e11d48', weight: 4, opacity: 0.9, interactive: false }).addTo(map);
    }
  }

  // Gros bouton « Valider » sur la carte, visible dès la première modification
  function renderValidateFab() {
    var b = document.getElementById('ort-ed-vfab');
    if (b) b.remove();
    b = document.createElement('button');
    b.id = 'ort-ed-vfab';
    b.type = 'button';
    b.className = 'ort-ed-vfab';
    b.textContent = '✓ ' + t.reorgValidateBig;
    b.tabIndex = -1;
    b.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', function () { reorgValidate(); });
    document.body.appendChild(b);
  }

  function updateValidateFab() {
    var b = document.getElementById('ort-ed-vfab');
    if (!b) return;
    var on = reorgIsChanged();
    b.classList.toggle('on', on);
    b.setAttribute('aria-hidden', on ? 'false' : 'true');
    b.tabIndex = on ? 0 : -1;
  }

  // ─────────────────────────────────────────────
  // PANNEAU LATÉRAL (DESKTOP)
  // ─────────────────────────────────────────────
  function renderReorgPanel() {
    var existing = document.getElementById('ort-ed-rpanel');
    if (existing) existing.remove();

    var panel = document.createElement('div');
    panel.id = 'ort-ed-rpanel';
    panel.className = 'ort-ed-rpanel';

    var h = '';
    h += '<div class="ort-ed-rpanel-head"><h3>🔄 ' + esc(t.reorgTitle) + '</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._stopReorg(false)">×</button></div>';
    h += '<div class="ort-ed-rpanel-inst">' + esc(t.reorgInst) + '</div>';
    h += '<div class="ort-ed-rpanel-tools">';
    h += '<button onclick="ORT_ITIN_EDITOR._reorgInvert()">🔁 ' + esc(t.reorgInvert) + '</button>';
    h += '<button onclick="ORT_ITIN_EDITOR._reorgReset()">⟲ ' + esc(t.reorgReset) + '</button>';
    h += '</div>';
    h += '<div class="ort-ed-rpanel-list" id="ort-ed-rpanel-list"></div>';
    h += '<div class="ort-ed-rpanel-footer">';
    h += '<button class="ort-ed-rbtn-cancel" onclick="ORT_ITIN_EDITOR._stopReorg(false)">✕ ' + esc(t.reorgCancel) + '</button>';
    h += '</div>';

    panel.innerHTML = h;
    document.body.appendChild(panel);

    updateReorgPanelList();
  }

  function updateReorgPanelList() {
    var listEl = document.getElementById('ort-ed-rpanel-list');
    if (!listEl) return;
    var keepScroll = listEl.scrollTop;
    var n = reorg.newOrder.length;
    var h = '';

    h += '<div class="ort-ed-rp-sec">' + esc(t.reorgOrder) + ' (' + n + ')</div>';
    reorg.newOrder.forEach(function (sIdx, i) {
      var step = stepByIdx(sIdx);
      var name = step ? step.name : String(sIdx);
      var added = reorg.addedPlaces.indexOf(sIdx) >= 0;
      h += '<div class="ort-ed-rpanel-item">';
      h += '<div class="ort-ed-rpanel-num active">' + (i + 1) + '</div>';
      h += '<div class="ort-ed-rpanel-name" onclick="ORT_ITIN_EDITOR._reorgFocus(' + sIdx + ')" style="cursor:pointer">' + esc(name) + (added ? ' <span class="ort-ed-rp-new">+</span>' : '') + '</div>';
      h += '<button class="ort-ed-rp-arr" title="' + esc(t.reorgUp) + '" aria-label="' + esc(t.reorgUp) + '"' + (i === 0 ? ' disabled' : '') + ' onclick="ORT_ITIN_EDITOR._reorgMoveBy(' + sIdx + ',-1)">↑</button>';
      h += '<button class="ort-ed-rp-arr" title="' + esc(t.reorgDown) + '" aria-label="' + esc(t.reorgDown) + '"' + (i === n - 1 ? ' disabled' : '') + ' onclick="ORT_ITIN_EDITOR._reorgMoveBy(' + sIdx + ',1)">↓</button>';
      h += '<button class="ort-ed-rp-del" title="' + esc(t.deleteStep) + '" aria-label="' + esc(t.deleteStep) + '" onclick="ORT_ITIN_EDITOR._reorgDelete(' + sIdx + ')">✕</button>';
      h += '</div>';
    });

    if (reorg.deleted.length > 0) {
      h += '<div class="ort-ed-rp-sec del">✕ ' + esc(t.reorgDeleted) + '</div>';
      reorg.deleted.forEach(function (sIdx) {
        var step = stepByIdx(sIdx);
        h += '<div class="ort-ed-rpanel-item deleted2">';
        h += '<div class="ort-ed-rpanel-num deleted">✕</div>';
        h += '<div class="ort-ed-rpanel-name">' + esc(step ? step.name : String(sIdx)) + '</div>';
        h += '<button class="ort-ed-rp-restore" onclick="ORT_ITIN_EDITOR._reorgRestore(' + sIdx + ')">↩ ' + esc(t.reorgRestore) + '</button>';
        h += '</div>';
      });
    }

    h += '<div style="padding:10px 16px">';
    h += '<button onclick="ORT_ITIN_EDITOR._openAddFromPanel()" style="display:block;width:100%;padding:10px;border:2px dashed #d0dff0;border-radius:8px;background:none;color:#113f7a;font-size:.85rem;font-weight:600;cursor:pointer">＋ ' + esc(t.addStep) + '</button>';
    h += '</div>';

    listEl.innerHTML = h;
    listEl.scrollTop = keepScroll;
  }

  // ─────────────────────────────────────────────
  // MOBILE : BADGE + BOUTONS
  // ─────────────────────────────────────────────
  function renderReorgMobile() {
    var badge = document.createElement('div');
    badge.id = 'ort-ed-reorg-badge';
    badge.className = 'ort-ed-reorg-badge';
    document.body.appendChild(badge);

    var btns = document.createElement('div');
    btns.id = 'ort-ed-reorg-mbtns';
    btns.className = 'ort-ed-reorg-mbtns';
    btns.innerHTML = '<button style="background:#f0f0f0;color:#333" onclick="ORT_ITIN_EDITOR._stopReorg(false)">✕ ' + esc(t.reorgCancel) + '</button>' +
      '<button style="background:#fff;color:#113f7a;border:2px solid #113f7a" onclick="ORT_ITIN_EDITOR._openAddFromPanel()">＋ ' + esc(t.addStep) + '</button>';
    document.body.appendChild(btns);
    updateReorgBadge();

    // Modale explicative mobile (affichée une seule fois par session)
    if (!sessionStorage.getItem('ort_reorg_help_seen_v4')) {
      var helpModal = document.createElement('div');
      helpModal.id = 'ort-ed-help-modal';
      helpModal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
      var helpContent = '<div style="background:#fff;border-radius:16px;max-width:340px;width:100%;padding:20px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.25)">';
      helpContent += '<div style="font-size:1.5rem;margin-bottom:10px">🗺️</div>';
      helpContent += '<h3 style="color:#113f7a;margin:0 0 12px;font-size:1rem">' + esc(t.reorgTitle) + '</h3>';
      helpContent += '<div style="text-align:left;font-size:.88rem;color:#444;line-height:1.6;margin-bottom:16px">';
      helpContent += '<p style="margin:0 0 8px"><b style="color:#e11d48">☝️</b> ' + esc(t.reorgInstMobile || t.reorgInst) + '</p>';
      helpContent += '</div>';
      helpContent += '<button id="ort-ed-help-ok" style="padding:10px 28px;background:#113f7a;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:.9rem;cursor:pointer">OK</button>';
      helpContent += '</div>';
      helpModal.innerHTML = helpContent;
      document.body.appendChild(helpModal);
      var closeHelp = function () {
        helpModal.remove();
        try { sessionStorage.setItem('ort_reorg_help_seen_v4', '1'); } catch (e) { }
      };
      document.getElementById('ort-ed-help-ok').addEventListener('click', closeHelp);
      helpModal.addEventListener('click', function (e) { if (e.target === helpModal) closeHelp(); });
    }
  }

  function updateReorgBadge() {
    var badge = document.getElementById('ort-ed-reorg-badge');
    if (badge) {
      badge.textContent = t.reorgOrder + ' : ' + reorg.newOrder.length;
    }
  }

  // ─────────────────────────────────────────────
  // "AUTRES LIEUX" (OP) CLIQUABLES
  // ─────────────────────────────────────────────
  function setupOPMarkers() {
    // Créer des marqueurs enrichis pour les "autres lieux" (OP)
    cleanupOPMarkers();

    var map = global.map;
    var opData = global.OP || [];
    if (!map || !opData.length) return;

    // Couleurs par rating (mêmes que le template)
    function opColor(r) {
      if (r >= 8.8) return '#1565C0';
      if (r >= 7.6) return '#43A047';
      if (r >= 6.1) return '#7CB342';
      if (r >= 3.1) return '#78909C';
      if (r > 0) return '#B0BEC5';
      return '#CFD8DC';
    }

    opData.forEach(function (p) {
      // Chercher le place_id correspondant dans placesIndex
      var pid = null;
      Object.keys(placesIndex).forEach(function (k) {
        var pl = placesIndex[k];
        if (Math.abs((pl.lat || 0) - p.lat) < 0.005 && Math.abs((pl.lon || 0) - p.lng) < 0.005) {
          pid = k;
        }
      });
      if (!pid) return;
      var alreadyIn = steps.some(function (s) { return s.place_id === pid; });
      if (alreadyIn) return;

      var placeData = placesIndex[pid];
      if (!placeData) return;

      // Construire le popup
      var popHtml = '<div style="min-width:220px;max-width:300px;font-family:Inter,system-ui,sans-serif;line-height:1.5">';

      // Bouton ajouter EN HAUT
      popHtml += '<button data-add-pid="' + esc(pid) + '" style="display:block;width:100%;margin:0 0 10px;padding:9px 12px;background:#e11d48;color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:600;cursor:pointer">＋ ' + esc(t.reorgAdd) + ' ' + esc(placeData.name) + '</button>';

      // Nom + rating
      popHtml += '<div style="font-size:1rem;font-weight:700;color:#113f7a;margin-bottom:2px">' + esc(placeData.name) + '</div>';
      if (placeData.rating) popHtml += '<div style="color:#f4a623;font-size:.82rem;margin-bottom:8px">' + stars(placeData.rating) + '</div>';

      // Visites
      var visits = placeData.visits || [];
      if (visits.length > 0) {
        popHtml += '<div style="margin-bottom:8px">';
        popHtml += '<div style="font-size:.78rem;font-weight:600;color:#113f7a;margin-bottom:4px">📍 ' + esc(t.visits) + ' (' + visits.length + ')</div>';
        visits.slice(0, 5).forEach(function (v) {
          var txt = v.text || v;
          var dur = v.visit_duration_min;
          popHtml += '<div style="font-size:.8rem;color:#444;padding:3px 0;border-bottom:1px solid #f5f5f5">';
          popHtml += esc(txt);
          if (dur) popHtml += ' <span style="color:#aaa;font-size:.72rem">· ' + dur + ' min</span>';
          popHtml += '</div>';
        });
        if (visits.length > 5) popHtml += '<div style="font-size:.72rem;color:#999;padding:3px 0">+ ' + (visits.length - 5) + ' ' + esc(t.visits).toLowerCase() + '…</div>';
        popHtml += '</div>';
      }

      // Activités
      var activities = placeData.activities || [];
      if (activities.length > 0) {
        popHtml += '<div style="margin-bottom:4px">';
        popHtml += '<div style="font-size:.78rem;font-weight:600;color:#113f7a;margin-bottom:4px">🎯 ' + esc(t.activities) + ' (' + activities.length + ')</div>';
        activities.slice(0, 4).forEach(function (a) {
          var txt = a.text || a;
          var dur = a.activity_duration_min;
          popHtml += '<div style="font-size:.8rem;color:#444;padding:3px 0;border-bottom:1px solid #f5f5f5">';
          popHtml += esc(txt);
          if (dur) popHtml += ' <span style="color:#aaa;font-size:.72rem">· ' + dur + ' min</span>';
          popHtml += '</div>';
        });
        if (activities.length > 4) popHtml += '<div style="font-size:.72rem;color:#999;padding:3px 0">+ ' + (activities.length - 4) + '…</div>';
        popHtml += '</div>';
      }

      popHtml += '</div>';

      // Utiliser les mêmes couleurs que le template pour le marqueur
      var col = opColor(p.rat);
      var rad = p.rat >= 8.8 ? 10 : (p.rat >= 7.6 ? 8 : 7);

      var m = L.circleMarker([p.lat, p.lng], {
        radius: rad, fillColor: col, color: '#fff', weight: 2, fillOpacity: 0.85
      }).addTo(map);
      m.bindPopup(popHtml, { maxWidth: 320, maxHeight: 350, autoPanPadding: [20, 20] });

      // Au clic sur le bouton "Ajouter" dans le popup → ouvrir le choix de position
      m.on('popupopen', function () {
        setTimeout(function () {
          var btn = document.querySelector('button[data-add-pid="' + pid + '"]');
          if (btn) {
            btn.addEventListener('click', function () {
              global.map.closePopup();
              openInsertPositionModal(pid);
            });
          }
        }, 50);
      });

      reorg.opMarkers.push(m);
    });

    console.log('[ORT-EDITOR] ' + reorg.opMarkers.length + ' lieux ajoutables sur la carte');
  }

  function cleanupOPMarkers() {
    reorg.opMarkers.forEach(function (m) {
      try { global.map.removeLayer(m); } catch (e) { }
    });
    reorg.opMarkers = [];
  }

  // Cacher les marqueurs OP originaux du template (ils ont l'ancien popup avec lien RT Detail)
  // On les stocke pour les restaurer à la sortie
  var hiddenOriginalOP = [];
  function hideOriginalOPMarkers() {
    hiddenOriginalOP = [];
    if (!global.map) return;
    // Collecter les day markers pour ne pas les masquer par erreur
    var dayMkValues = {};
    var mkObj = global.mk || {};
    Object.keys(mkObj).forEach(function (k) { dayMkValues[L.stamp(mkObj[k])] = true; });

    global.map.eachLayer(function (layer) {
      // Ne pas toucher aux marqueurs de jours (itinéraire), ni à la polyline, ni aux tiles
      if (dayMkValues[L.stamp(layer)]) return;
      if (layer === global.pl) return;
      if (layer._url) return; // tile layer

      if (layer._popup) {
        var content = '';
        try { content = layer._popup.getContent() || ''; } catch (e) { }
        // Les OP originaux ont soit "roadtrip_detail" (circleMarker classiques)
        // soit "addPlaceFromMap" (marqueurs étoiles rating >= 8.8) dans leur popup
        if (typeof content === 'string' &&
            (content.indexOf('roadtrip_detail') >= 0 || content.indexOf('addPlaceFromMap') >= 0)) {
          hiddenOriginalOP.push(layer);
          global.map.removeLayer(layer);
        }
      }
    });
    if (hiddenOriginalOP.length) {
      console.log('[ORT-EDITOR] ' + hiddenOriginalOP.length + ' marqueurs OP originaux masqués');
    }
  }

  function showOriginalOPMarkers() {
    hiddenOriginalOP.forEach(function (layer) {
      try { layer.addTo(global.map); } catch (e) { }
    });
    hiddenOriginalOP = [];
  }

  function reorgAddOP(placeId, insertPosition) {
    var place = placesIndex[placeId];
    if (!place) return;

    // Position par défaut = fin
    if (insertPosition === undefined) insertPosition = reorg.newOrder.length;

    // Créer un step temporaire
    var newStep = {
      _idx: steps.length,
      name: place.name || '',
      lat: place.lat || null,
      lng: place.lon || place.lng || null,
      nights: Math.max(0, Math.round(place.suggested_days || 1)),
      description: '',
      photos: [],
      distance_km: 0,
      placeId: placeId,
      place_id: placeId,
      visits: place.visits || [],
      activities: place.activities || [],
      rating: place.rating || 0,
      suggested_days: place.suggested_days || 1,
      _suggestedDays: place.suggested_days || 1,
      _driveMinToNext: 0,
      to_next_leg: null,
      night: { place_id: placeId, coords: [place.lat || 0, place.lon || place.lng || 0] },
      _mapKeywords: []
    };

    steps.push(newStep);
    reorg.addedPlaces.push(newStep._idx);

    // Insérer à la bonne position dans newOrder (par _idx)
    reorg.newOrder.splice(insertPosition, 0, newStep._idx);

    // Ajouter un marqueur sur la carte
    var dayNum = steps.length;
    var m = L.marker([newStep.lat, newStep.lng], {
      icon: reorgIcon(dayNum, 'ordered', insertPosition + 1),
      zIndexOffset: 1000
    }).addTo(global.map);
    m.on('click', function () { handleReorgClick(newStep._idx); });
    m.on('dblclick', function () { handleReorgDblClick(newStep._idx); });
    global.mk[dayNum] = m;
    reorg.mkByIdx[newStep._idx] = m;

    global.map.closePopup();
    closeModal();

    refreshReorgVisuals();
    showToast('+ ' + newStep.name, 'success');
  }

  // Ouvrir une modale de recherche de lieux depuis le panneau latéral
  function openAddFromPanel() {
    var usedIds = {};
    steps.forEach(function (s) { if (s.place_id) usedIds[s.place_id] = true; });

    var places = Object.values(placesIndex).filter(function (p) {
      return !usedIds[p.place_id];
    }).sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });

    if (places.length === 0) {
      showToast(t.noResults, 'error');
      return;
    }

    var h = '<div class="ort-ed-modal-bg" id="ort-ed-modal-bg" onclick="if(event.target===this)ORT_ITIN_EDITOR._closeModal()">';
    h += '<div class="ort-ed-modal">';
    h += '<div class="ort-ed-modal-head"><h3>＋ ' + esc(t.addStep) + '</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._closeModal()">×</button></div>';
    h += '<div class="ort-ed-modal-search"><input type="text" id="ort-ed-search" placeholder="' + esc(t.searchPlace) + '" autocomplete="off"></div>';
    h += '<div class="ort-ed-modal-list" id="ort-ed-placelist">';
    h += renderAddPlaceList(places);
    h += '</div></div></div>';

    var container = document.createElement('div');
    container.id = 'ort-ed-modal-container';
    container.innerHTML = h;
    document.body.appendChild(container);

    var searchInput = document.getElementById('ort-ed-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.addEventListener('input', function () {
        var query = this.value.toLowerCase().trim();
        var filtered = places.filter(function (p) {
          return p.name.toLowerCase().indexOf(query) >= 0;
        });
        document.getElementById('ort-ed-placelist').innerHTML = renderAddPlaceList(filtered);
        bindAddPlaceClicks();
      });
    }
    bindAddPlaceClicks();
  }

  function renderAddPlaceList(places) {
    if (places.length === 0) return '<div class="ort-ed-modal-empty">' + esc(t.noResults) + '</div>';
    var h = '';
    places.forEach(function (p) {
      h += '<div class="ort-ed-modal-item" data-place-id="' + esc(p.place_id) + '">';
      h += '<div class="ort-ed-modal-item-name">' + esc(p.name) + '</div>';
      if (p.rating) h += '<div class="ort-ed-modal-item-rating">' + stars(p.rating) + '</div>';
      h += '</div>';
    });
    return h;
  }

  function bindAddPlaceClicks() {
    var list = document.getElementById('ort-ed-placelist');
    enhanceScrollList(list);
    if (!list || list._ortBound) return;
    list._ortBound = true;
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.ort-ed-modal-item[data-place-id]');
      if (!item) return;
      var pid = item.dataset.placeId;
      if (pid) {
        closeModal();
        openInsertPositionModal(pid);
      }
    });
  }

  // Bouton "Ajouter" de la carte des pages : au premier clic, l'éditeur charge encore l'itinéraire
  // et les lieux. On attend qu'il soit prêt (10 s au plus) avant d'ouvrir le choix de position.
  function openInsertPositionWhenReady(placeId) {
    var tries = 0;
    (function attempt() {
      var ready = editorActive && reorg.active && Object.keys(placesIndex).length > 0;
      if (ready) {
        if (placesIndex[placeId]) openInsertPositionModal(placeId);
        else console.warn('[ORT-EDITOR] Lieu absent des lieux du pays : ' + placeId);
        return;
      }
      if (++tries > 40) { console.warn('[ORT-EDITOR] Ajout abandonné : éditeur pas prêt'); return; }
      setTimeout(attempt, 250);
    })();
  }

  // Modale de choix de position d'insertion
  function openInsertPositionModal(placeId) {
    var place = placesIndex[placeId];
    if (!place) return;

    // Construire l'ordre courant pour montrer les positions
    var currentOrder = buildFinalOrder();

    var h = '<div class="ort-ed-modal-bg" id="ort-ed-modal-bg" onclick="if(event.target===this)ORT_ITIN_EDITOR._closeModal()">';
    h += '<div class="ort-ed-modal">';
    h += '<div class="ort-ed-modal-head"><h3>' + t.choosePosition.replace('{name}', esc(place.name)) + '</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._closeModal()">×</button></div>';
    h += '<div style="overflow-y:auto;max-height:60vh;padding:8px 0" id="ort-ed-poslist">';

    // "Au début"
    h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-bottom:1px solid #f5f5f5" class="ort-ed-pos-hover" data-insert-pid="' + esc(placeId) + '" data-insert-at="0">';
    h += '<div style="background:#e11d48;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700">↑</div>';
    h += '<div style="flex:1;font-weight:600;font-size:.88rem">' + esc(t.start) + '</div>';
    h += '</div>';

    // "Après [étape X]"
    currentOrder.forEach(function (step, idx) {
      h += '<div style="display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-bottom:1px solid #f5f5f5" class="ort-ed-pos-hover" data-insert-pid="' + esc(placeId) + '" data-insert-at="' + (idx + 1) + '">';
      h += '<div style="background:#113f7a;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">' + (idx + 1) + '</div>';
      h += '<div style="flex:1;font-size:.88rem">' + esc(t.insertAfter) + ' <strong>' + esc(step.name) + '</strong></div>';
      h += '</div>';
    });

    h += '</div></div></div>';

    var container = document.createElement('div');
    container.id = 'ort-ed-modal-container';
    container.innerHTML = h;
    document.body.appendChild(container);

    var style = document.createElement('style');
    style.textContent = '.ort-ed-pos-hover:hover{background:#f0f7ff}';
    container.appendChild(style);

    // Event delegation — au clic, on reconstruit le newOrder complet puis on insère
    var list = document.getElementById('ort-ed-poslist');
    enhanceScrollList(list);
    if (list) {
      list.addEventListener('click', function (e) {
        var item = e.target.closest('[data-insert-pid]');
        if (!item) return;
        var pid = item.dataset.insertPid;
        var posInFinal = parseInt(item.dataset.insertAt);

        // Construire le newOrder complet (toutes les étapes non supprimées dans l\u2019ordre final)
        // puis insérer le nouveau lieu à la position choisie
        var fullOrder = buildFinalOrder().map(function (s) { return s._idx; });

        // Créer le step et l'ajouter AVANT de reconstruire newOrder
        var place = placesIndex[pid];
        if (!place) return;
        var newStep = {
          _idx: steps.length,
          name: place.name || '',
          lat: place.lat || null,
          lng: place.lon || place.lng || null,
          nights: Math.max(0, Math.round(place.suggested_days || 1)),
          description: '',
          photos: [],
          distance_km: 0,
          placeId: pid,
          place_id: pid,
          visits: place.visits || [],
          activities: place.activities || [],
          rating: place.rating || 0,
          suggested_days: place.suggested_days || 1,
          _suggestedDays: place.suggested_days || 1,
          _driveMinToNext: 0,
          to_next_leg: null,
          night: { place_id: pid, coords: [place.lat || 0, place.lon || place.lng || 0] },
          _mapKeywords: []
        };
        steps.push(newStep);
        reorg.addedPlaces.push(newStep._idx);

        // Insérer le _idx du nouveau step dans l\u2019ordre complet
        fullOrder.splice(posInFinal, 0, newStep._idx);
        reorg.newOrder = fullOrder;

        // Ajouter un marqueur sur la carte
        var dayNum = steps.length;
        var m = L.marker([newStep.lat, newStep.lng], {
          icon: reorgIcon(dayNum, 'ordered', posInFinal + 1),
          zIndexOffset: 1000
        }).addTo(global.map);
        m.on('click', function () { handleReorgClick(newStep._idx); });
        m.on('dblclick', function () { handleReorgDblClick(newStep._idx); });
        global.mk[dayNum] = m;
        reorg.mkByIdx[newStep._idx] = m;

        global.map.closePopup();
        closeModal();
        refreshReorgVisuals();
        showToast('+ ' + newStep.name, 'success');
      });
    }
  }

  // ─────────────────────────────────────────────
  // INVERSER / RÉINITIALISER
  // ─────────────────────────────────────────────
  function reorgInvert() {
    reorg.newOrder.reverse();
    refreshReorgVisuals();
  }

  // Retour au voyage de départ : on retire les lieux ajoutés (toujours en fin de tableau)
  function reorgReset() {
    reorg.addedPlaces.slice().sort(function (a, b) { return b - a; }).forEach(function (sIdx) {
      var m = reorg.mkByIdx[sIdx];
      if (m) {
        try { global.map.removeLayer(m); } catch (e) { }
        Object.keys(global.mk || {}).forEach(function (k) { if (global.mk[k] === m) delete global.mk[k]; });
      }
      delete reorg.mkByIdx[sIdx];
      var idx = steps.findIndex(function (s) { return s._idx === sIdx; });
      if (idx >= 0) steps.splice(idx, 1);
    });
    reorg.addedPlaces = [];
    reorg.deleted = [];
    reorg.newOrder = (reorg.origOrder || []).slice();
    try { global.map.closePopup(); } catch (e) { }
    refreshReorgVisuals();
  }

  // ─────────────────────────────────────────────
  // PRÉVISUALISER / VALIDER
  // ─────────────────────────────────────────────
  function reorgPreview() {
    var finalOrder = buildFinalOrder();
    if (finalOrder.length === 0) {
      showToast(t.reorgMustKeepOne, 'error');
      return;
    }

    // Construire la modale de prévisualisation
    var h = '<div class="ort-ed-modal-bg" id="ort-ed-modal-bg" onclick="if(event.target===this)ORT_ITIN_EDITOR._closeModal()">';
    h += '<div class="ort-ed-modal">';
    h += '<div class="ort-ed-modal-head"><h3>👁️ ' + esc(t.reorgPreview) + ' (' + finalOrder.length + ' ' + t.day.toLowerCase() + 's)</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._closeModal()">×</button></div>';
    h += '<div class="ort-ed-modal-list" style="padding:10px 0">';

    finalOrder.forEach(function (step, i) {
      h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 20px">';
      h += '<div style="background:#e11d48;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0">' + (i + 1) + '</div>';
      h += '<div style="flex:1"><strong>' + esc(step.name) + '</strong>';
      if (step.nights > 1) h += ' <small style="color:#7f8c8d">(' + step.nights + ' nuits)</small>';
      h += '</div>';
      h += '</div>';
    });

    h += '</div>';
    h += '<div style="padding:12px 20px;border-top:1px solid #e1e8ed;display:flex;gap:8px">';
    h += '<button onclick="ORT_ITIN_EDITOR._closeModal()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-weight:600">✕ ' + esc(t.reorgCancel) + '</button>';
    h += '<button onclick="ORT_ITIN_EDITOR._reorgValidate()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#e11d48;color:#fff;cursor:pointer;font-weight:600">✓ ' + esc(t.reorgValidate) + '</button>';
    h += '</div>';
    h += '</div></div>';

    var container = document.createElement('div');
    container.id = 'ort-ed-modal-container';
    container.innerHTML = h;
    document.body.appendChild(container);
  }

  function buildFinalOrder() {
    var result = [];
    // D'abord les étapes dans newOrder
    reorg.newOrder.forEach(function (sIdx) {
      var step = steps.find(function (s) { return s._idx === sIdx; });
      if (step) result.push(step);
    });
    // Puis les étapes non cliquées et non supprimées, dans l\u2019ordre original
    steps.forEach(function (step) {
      if (reorg.newOrder.indexOf(step._idx) < 0 && reorg.deleted.indexOf(step._idx) < 0) {
        result.push(step);
      }
    });
    return result;
  }

  function reorgValidate() {
    var finalOrder = buildFinalOrder();
    if (finalOrder.length === 0) {
      showToast(t.reorgMustKeepOne, 'error');
      return;
    }

    closeModal();

    // Appliquer le nouvel ordre
    steps = finalOrder;
    reindex();
    recalcDistances();
    isDirty = true;

    // Quitter le mode carte
    stopMapReorg(false);

    // Afficher la vue post-réorg avec le choix de sauvegarder ou non
    renderPostReorgChoice();
  }

  // Vue après validation — choix sauvegarder ou continuer sans sauvegarder
  function renderPostReorgChoice() {
    // Reconstruire les sections d'étapes avec le nouvel ordre
    rebuildDaySections();
    updateMap();

    // Insérer un bandeau de choix en haut du textPanel
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) return;

    var user = null;
    try { user = global.firebase && global.firebase.auth && global.firebase.auth().currentUser; } catch (e) { }

    var bar = document.createElement('div');
    bar.id = 'ort-ed-save-bar';
    bar.style.cssText = 'padding:14px 20px;background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border:1px solid #d0dff0;border-radius:12px;margin-bottom:16px;text-align:center';

    var h = '<div style="font-size:1rem;font-weight:600;color:#113f7a;margin-bottom:8px">';
    h += '✓ ' + steps.length + ' ' + esc(t.step || t.day).toLowerCase() + 's';
    h += '</div>';
    h += '<p style="color:#555;margin-bottom:12px;font-size:.88rem;line-height:1.5">' + esc(t.confirmSave) + '</p>';
    h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';

    if (user) {
      // Connecté → bouton sauvegarder direct
      h += '<button id="ort-ed-btn-save" style="padding:10px 20px;border:none;border-radius:8px;background:#113f7a;color:#fff;cursor:pointer;font-weight:600;font-size:.9rem">💾 ' + esc(t.saveNow || t.save) + '</button>';
    } else {
      // Pas connecté → bouton "Se connecter" qui ouvre l'auth
      h += '<button id="ort-ed-btn-login" style="padding:10px 20px;border:none;border-radius:8px;background:#113f7a;color:#fff;cursor:pointer;font-weight:600;font-size:.9rem">🔑 ' + esc(t.loginBtn || 'Se connecter') + '</button>';
    }
    h += '<button id="ort-ed-btn-skip" style="padding:10px 20px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:.85rem;color:#555">' + esc(t.keepEditing) + '</button>';
    h += '<button id="ort-ed-btn-reorg" style="padding:10px 20px;border:1px solid #d0dff0;border-radius:8px;background:#fff;cursor:pointer;font-weight:600;font-size:.85rem;color:#113f7a">🗺️ ' + esc(t.reorgOnMap) + '</button>';
    h += '<button id="ort-ed-btn-cancel" style="padding:10px 20px;border:1px solid #ddd;border-radius:8px;background:#f0f0f0;cursor:pointer;font-size:.85rem">' + esc(t.cancel) + '</button>';
    h += '</div>';

    bar.innerHTML = h;
    textPanel.insertBefore(bar, textPanel.firstChild);

    // Handlers
    var saveBtn = document.getElementById('ort-ed-btn-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        showToast(t.saving, 'info');
        save();
      });
    }

    var loginBtn = document.getElementById('ort-ed-btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        // Ouvrir la popup d'auth du header
        var authPop = document.getElementById('authPop');
        if (authPop) authPop.style.display = 'block';
        // Quand l'utilisateur se connecte, remplacer le bandeau par la version connectée
        if (global.firebase && global.firebase.auth) {
          var unsub = global.firebase.auth().onAuthStateChanged(function (newUser) {
            if (newUser) {
              unsub();
              // Re-render le bandeau avec le bouton Sauvegarder (pas sauvegarde auto)
              var saveBar = document.getElementById('ort-ed-save-bar');
              if (saveBar) saveBar.remove();
              renderPostReorgChoice();
            }
          });
        }
      });
    }

    document.getElementById('ort-ed-btn-skip').addEventListener('click', function () {
      // Retirer le bandeau, garder les étapes modifiées affichées
      var saveBar = document.getElementById('ort-ed-save-bar');
      if (saveBar) saveBar.remove();
      isDirty = true; // Marquer comme modifié mais pas sauvegardé
      editorActive = false;
      // Réinjecter le bouton de lancement avec un bouton save en plus
      injectLaunchButtonWithSave();
      reinitDayObservers();
    });

    document.getElementById('ort-ed-btn-reorg').addEventListener('click', function () {
      startMapReorg();
    });

    document.getElementById('ort-ed-btn-cancel').addEventListener('click', function () {
      cancel();
    });
  }

  // Injecte le bouton de lancement + un bouton sauvegarder si modifications non sauvegardées
  function injectLaunchButtonWithSave() {
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) return;

    // Retirer l'ancien launcher s'il existe
    var old = document.getElementById('ort-ed-launcher');
    if (old) old.remove();

    var lang = detectLang();
    var labels = I18N[lang] || I18N.en;
    var detailUrl = document.body.dataset.detailUrl || document.body.dataset.detailurl || '';
    if (!detailUrl) {
      var link = document.querySelector('a[href*="roadtrip_detail"]');
      if (link) detailUrl = link.href || link.getAttribute('href') || '';
    }

    var div = document.createElement('div');
    div.id = 'ort-ed-launcher';
    div.className = 'ort-ed-launch';

    var h = '';
    // Bouton sauvegarder (bien visible si modifications non sauvées)
    if (isDirty) {
      h += '<button class="ort-ed-btn-steps" style="background:linear-gradient(135deg,#d4a039,#b8860b)" onclick="ORT_ITIN_EDITOR._save()">💾 ' + esc(labels.saveNow || labels.save) + '</button>';
    }
    if (detailUrl) {
      h += '<a href="' + esc(detailUrl) + '" class="ort-ed-btn-detail" style="text-decoration:none;display:inline-block;text-align:center">🚀 ' + esc(labels.advanced) + '</a>';
    }

    div.innerHTML = h;
    textPanel.insertBefore(div, textPanel.firstChild);
  }

  function applyReorgResult() {
    var finalOrder = buildFinalOrder();
    if (finalOrder.length > 0) {
      steps = finalOrder;
      reindex();
      recalcDistances();
      isDirty = true;
    }
  }

  // ─────────────────────────────────────────────
  // BEFOREUNLOAD — protège les modifications non sauvegardées
  // ─────────────────────────────────────────────
  window.addEventListener('beforeunload', function (e) {
    if (editorActive && isDirty) {
      e.preventDefault();
      e.returnValue = t.unsaved;
      return t.unsaved;
    }
  });

  // ─────────────────────────────────────────────
  // API PUBLIQUE
  // ─────────────────────────────────────────────
  // V3 : point d'entree fusion (appele par ort-merge.js). Recoit un days_plan deja
  // dedoublonne et reordonne ; on le normalise et on entre direct en reorganisation.
  async function startMerged(daysPlan, title, cc) {
    try {
      if (cc) config.cc = (cc || '').toUpperCase();
      if (!config.lang) config.lang = detectLang();
      t = I18N[config.lang] || I18N.en;
      applyReorgTexts(config.lang);
      var textPanel = document.getElementById('textPanel');
      if (!textPanel) { console.error('[ORT-EDITOR] #textPanel introuvable'); return; }
      console.log('[MERGE] _startMerged daysPlan=', (daysPlan || []).length, 'cc=', cc, 'title=', title);
      showToast(t.saving, 'info');
      try { await loadPlacesData(); } catch (e) {}
      steps = normalizeSteps(daysPlan || [], config.cc);
      if (typeof reindex === 'function') reindex();
      console.log('[MERGE] steps=', steps.length, 'avec coords=', steps.filter(function (s) { return s.lat && s.lng; }).length);
      console.log('[MERGE] coords=', steps.map(function (s) { return s.name + ':' + s.lat + ',' + s.lng; }));
      // V3 fusion : reploter TOUS les marqueurs depuis les etapes fusionnees,
      // sinon la carte ne montre que l'itineraire d'origine.
      try { if (typeof updateMap === 'function') updateMap(); } catch (e) { console.warn('[ORT-EDITOR] updateMap:', e); }
      console.log('[MERGE] apres updateMap: mk=', Object.keys(global.mk || {}).length, 'MP=', (global.MP || []).length);
      try {
        var _m = global.map;
        var _pts = steps.filter(function (s) { return s.lat && s.lng; }).map(function (s) { return [s.lat, s.lng]; });
        if (_m && _pts.length) _m.fitBounds(_pts, { padding: [40, 40] });
      } catch (e) {}
      if (title) itinTitle = title;
      originalHTML = textPanel.innerHTML;
      originalSteps = deepClone(steps);
      editorActive = true;
      isDirty = true;
      editorMode = 'list';
      // Fusion : on montre directement le resultat fusionne, avec le choix
      // sauvegarder / annuler. La reorganisation sur carte reste accessible
      // par le bouton du bandeau, mais n'est plus imposee.
      try { recalcDistances(); } catch (e) {}
      renderPostReorgChoice();
      try {
        var _tp = document.getElementById('textPanel');
        if (_tp && _tp.scrollIntoView) _tp.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {}
    } catch (err) {
      console.error('[ORT-EDITOR] startMerged:', err);
      try { showToast(String(err.message || err), 'error'); } catch (e) {}
    }
  }

  global.ORT_ITIN_EDITOR = {
    init: init,
    _startMerged: startMerged,
    injectLaunchButton: injectLaunchButton,

    // Méthodes appelées depuis le HTML (onclick)
    _save: save,
    _cancel: cancel,
    _goAdvanced: goAdvanced,
    _closeModal: closeModal,
    _launch: launch,
    _isEditorActive: function () { return editorActive; },
    _isReorgActive: function () { return reorg.active; },
    _startMapReorg: function () { startMapReorg(); },

    // Mode carte réorg
    _stopReorg: function (apply) {
      if (!apply && reorgIsChanged()) {
        if (!confirm(t.reorgConfirmExit)) return;
      }
      stopMapReorg(apply);
    },
    _reorgInvert: reorgInvert,
    _reorgReset: reorgReset,
    _reorgPreview: reorgValidate,   // V4 : plus de previsualisation, on valide directement
    _reorgValidate: reorgValidate,
    _reorgAddOP: function (pid, pos) { reorgAddOP(pid, pos); },
    _openAddFromPanel: function () { openAddFromPanel(); },
    // Choix de la position (Au début / Après l'étape N), appelé par le bouton "Ajouter" de la carte des pages
    _openInsertPosition: function (pid) { openInsertPositionWhenReady(pid); },
    _reorgClickPanel: function (sIdx) { handleReorgClick(sIdx); },
    _reorgDblClickPanel: function (sIdx) { handleReorgDblClick(sIdx); },
    _reorgMoveBy: function (sIdx, d) { reorgMoveBy(sIdx, d); },
    _reorgDelete: function (sIdx) { reorgDelete(sIdx); },
    _reorgRestore: function (sIdx) { reorgRestore(sIdx); },
    _reorgFocus: function (sIdx) { reorgFocus(sIdx); },
    _reorgMoveAsk: function (sIdx) { openMoveModal(sIdx); },

    // Récupère une chaîne i18n selon la langue détectée (fallback FR)
    _getLabel: function (key) {
      var lang = detectLang();
      var L = I18N[lang] || I18N.en;
      return L[key] || (I18N.en[key] || key);
    }
  };

  // Injecter le CSS et le bouton dès le chargement du script
  // (le CSS est léger, juste pour le bouton de lancement)
  if (!cssInjected) {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }

  // Injecter le bouton de lancement au DOMContentLoaded ou immédiatement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLaunchButton);
  } else {
    injectLaunchButton();
  }

  console.log('[ORT-ITIN-EDITOR] ✅ Module chargé');

})(window);
