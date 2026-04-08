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
    fr: {
      editExplain: 'Réorganisez les étapes, ajoutez ou supprimez des lieux. Pour modifier les visites et activités, utilisez les fonctions avancées.',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      advanced: 'Modifier les étapes et leurs durées, les visites, incorporez vos hôtels, calculez votre budget, partagez votre périple, interrogez l\'IA et bien d\'autres choses sur la page suivante',
      addStep: 'Ajouter une étape',
      deleteStep: 'Supprimer',
      confirmDelete: 'Supprimer {name} de l\'itinéraire ?',
      confirmCancel: 'Annuler les modifications ? Toutes les changements seront perdus.',
      saved: 'Sauvegardé !',
      saving: 'Sauvegarde…',
      loginRequired: 'Connectez-vous pour sauvegarder votre itinéraire personnalisé.',
      unsaved: 'Modifications non sauvegardées',
      searchPlace: 'Rechercher un lieu…',
      alreadyIn: 'déjà dans l\'itinéraire',
      insertBefore: 'Insérer avant',
      insertAfter: 'Insérer après',
      choosePosition: 'Où placer {name} ?',
      day: 'Jour',
      visits: 'Visites',
      activities: 'Activités',
      noResults: 'Aucun lieu trouvé',
      close: 'Fermer',
      driveToNext: 'Vers l\'étape suivante',
      start: 'Début',
      end: 'Fin',
      nVisits: '{n} visite(s)',
      nActivities: '{n} activité(s)',
      editBtn: 'Ajoutez, supprimez, modifiez l\'ordre des étapes sur cette page',
      editBtnSub: '(nécessite d\'être connecté — la version mobile permet une visualisation plus fluide mais pas ces modifications)',
      limitReached: 'Limite de voyages sauvegardés atteinte. Supprimez un voyage existant depuis votre tableau de bord.',
      reorgTitle: 'Réorganisation',
      reorgOnMap: 'Réorganiser sur la carte',
      reorgList: 'Mode liste',
      reorgInst: 'Clic = prochaine étape · Double-clic = supprimer',
      reorgInvert: 'Inverser le circuit',
      reorgReset: 'Réinitialiser',
      reorgPreview: 'Prévisualiser',
      reorgValidate: 'Valider',
      reorgCancel: 'Annuler',
      reorgStepCount: '{done}/{total} étapes',
      reorgDeleted: 'Supprimée',
      reorgConfirmExit: 'Quitter sans appliquer les modifications ?',
      reorgMustKeepOne: 'Gardez au moins une étape !',
      reorgAddPlace: 'Ajouter {name} ?',
      reorgAdd: 'Ajouter',
      reorgNewOrder: 'Nouvel ordre',
      reorgPending: 'En attente',
    },
    en: {
      editExplain: 'Rearrange stops, add or remove places. To edit visits and activities, use advanced features.',
      save: 'Save',
      cancel: 'Cancel',
      advanced: 'Edit stops and durations, visits, add your hotels, calculate your budget, share your trip, ask AI and much more on the next page',
      addStep: 'Add a stop',
      deleteStep: 'Delete',
      confirmDelete: 'Remove {name} from the itinerary?',
      confirmCancel: 'Cancel changes? All modifications will be lost.',
      saved: 'Saved!',
      saving: 'Saving…',
      loginRequired: 'Log in to save your customized itinerary.',
      unsaved: 'Unsaved changes',
      searchPlace: 'Search a place…',
      alreadyIn: 'already in itinerary',
      insertBefore: 'Insert before',
      insertAfter: 'Insert after',
      choosePosition: 'Where to place {name}?',
      day: 'Day',
      visits: 'Visits',
      activities: 'Activities',
      noResults: 'No places found',
      close: 'Close',
      driveToNext: 'Drive to next stop',
      start: 'Start',
      end: 'End',
      nVisits: '{n} visit(s)',
      nActivities: '{n} activity(ies)',
      editBtn: 'Add, remove, reorder stops on this page',
      editBtnSub: '(requires login — mobile version allows smoother viewing but not these edits)',
      limitReached: 'Saved trips limit reached. Delete an existing trip from your dashboard.',
      reorgTitle: 'Reorganization',
      reorgOnMap: 'Reorder on map',
      reorgList: 'List mode',
      reorgInst: 'Click = next stop · Double-click = delete',
      reorgInvert: 'Reverse route',
      reorgReset: 'Reset',
      reorgPreview: 'Preview',
      reorgValidate: 'Apply',
      reorgCancel: 'Cancel',
      reorgStepCount: '{done}/{total} stops',
      reorgDeleted: 'Deleted',
      reorgConfirmExit: 'Quit without applying changes?',
      reorgMustKeepOne: 'Keep at least one stop!',
      reorgAddPlace: 'Add {name}?',
      reorgAdd: 'Add',
      reorgNewOrder: 'New order',
      reorgPending: 'Pending',
    },
    es: {
      editExplain: 'Reorganiza las paradas, añade o elimina lugares. Para modificar visitas y actividades, usa las funciones avanzadas.',
      save: 'Guardar',
      cancel: 'Cancelar',
      advanced: 'Modifica etapas y duraciones, visitas, añade tus hoteles, calcula tu presupuesto, comparte tu viaje, pregunta a la IA y mucho más en la página siguiente',
      addStep: 'Añadir una parada',
      deleteStep: 'Eliminar',
      confirmDelete: '¿Eliminar {name} del itinerario?',
      confirmCancel: '¿Cancelar los cambios? Se perderán todas las modificaciones.',
      saved: '¡Guardado!',
      saving: 'Guardando…',
      loginRequired: 'Inicia sesión para guardar tu itinerario personalizado.',
      unsaved: 'Cambios sin guardar',
      searchPlace: 'Buscar un lugar…',
      alreadyIn: 'ya en el itinerario',
      insertBefore: 'Insertar antes',
      insertAfter: 'Insertar después',
      choosePosition: '¿Dónde colocar {name}?',
      day: 'Día',
      visits: 'Visitas',
      activities: 'Actividades',
      noResults: 'Ningún lugar encontrado',
      close: 'Cerrar',
      driveToNext: 'Trayecto siguiente',
      start: 'Inicio',
      end: 'Fin',
      nVisits: '{n} visita(s)',
      nActivities: '{n} actividad(es)',
      editBtn: 'Añade, elimina, reordena las paradas en esta página',
      editBtnSub: '(requiere iniciar sesión — la versión móvil permite una visualización más fluida pero no estas modificaciones)',
      limitReached: 'Límite de viajes guardados alcanzado. Elimina un viaje existente desde tu panel.',
      reorgTitle: 'Reorganización',
      reorgOnMap: 'Reorganizar en el mapa',
      reorgList: 'Modo lista',
      reorgInst: 'Clic = siguiente parada · Doble clic = eliminar',
      reorgInvert: 'Invertir circuito',
      reorgReset: 'Reiniciar',
      reorgPreview: 'Previsualizar',
      reorgValidate: 'Aplicar',
      reorgCancel: 'Cancelar',
      reorgStepCount: '{done}/{total} paradas',
      reorgDeleted: 'Eliminada',
      reorgConfirmExit: '¿Salir sin aplicar los cambios?',
      reorgMustKeepOne: '¡Mantén al menos una parada!',
      reorgAddPlace: '¿Añadir {name}?',
      reorgAdd: 'Añadir',
      reorgNewOrder: 'Nuevo orden',
      reorgPending: 'Pendiente',
    },
    pt: {
      editExplain: 'Reorganize as paragens, adicione ou remova lugares. Para editar visitas e atividades, use as funções avançadas.',
      save: 'Salvar',
      cancel: 'Cancelar',
      advanced: 'Edite etapas e durações, visitas, adicione seus hotéis, calcule seu orçamento, compartilhe sua viagem, pergunte à IA e muito mais na página seguinte',
      addStep: 'Adicionar uma paragem',
      deleteStep: 'Eliminar',
      confirmDelete: 'Remover {name} do itinerário?',
      confirmCancel: 'Cancelar as alterações? Todas as modificações serão perdidas.',
      saved: 'Salvo!',
      saving: 'Salvando…',
      loginRequired: 'Faça login para salvar seu itinerário personalizado.',
      unsaved: 'Alterações não salvas',
      searchPlace: 'Procurar um lugar…',
      alreadyIn: 'já no itinerário',
      insertBefore: 'Inserir antes',
      insertAfter: 'Inserir depois',
      choosePosition: 'Onde colocar {name}?',
      day: 'Dia',
      visits: 'Visitas',
      activities: 'Atividades',
      noResults: 'Nenhum lugar encontrado',
      close: 'Fechar',
      driveToNext: 'Trajeto seguinte',
      start: 'Início',
      end: 'Fim',
      nVisits: '{n} visita(s)',
      nActivities: '{n} atividade(s)',
      editBtn: 'Adicione, remova, reordene paragens nesta página',
      editBtnSub: '(requer login — a versão móvel permite uma visualização mais fluida mas não estas modificações)',
      limitReached: 'Limite de viagens salvas atingido. Exclua uma viagem existente do seu painel.',
      reorgTitle: 'Reorganização',
      reorgOnMap: 'Reorganizar no mapa',
      reorgList: 'Modo lista',
      reorgInst: 'Clique = próxima paragem · Duplo clique = eliminar',
      reorgInvert: 'Inverter circuito',
      reorgReset: 'Reiniciar',
      reorgPreview: 'Pré-visualizar',
      reorgValidate: 'Aplicar',
      reorgCancel: 'Cancelar',
      reorgStepCount: '{done}/{total} paragens',
      reorgDeleted: 'Eliminada',
      reorgConfirmExit: 'Sair sem aplicar as alterações?',
      reorgMustKeepOne: 'Mantenha pelo menos uma paragem!',
      reorgAddPlace: 'Adicionar {name}?',
      reorgAdd: 'Adicionar',
      reorgNewOrder: 'Nova ordem',
      reorgPending: 'Pendente',
    },
    it: {
      editExplain: 'Riorganizza le tappe, aggiungi o rimuovi luoghi. Per modificare visite e attività, usa le funzioni avanzate.',
      save: 'Salva',
      cancel: 'Annulla',
      advanced: 'Modifica tappe e durate, visite, aggiungi i tuoi hotel, calcola il budget, condividi il viaggio, chiedi all\'IA e molto altro nella pagina seguente',
      addStep: 'Aggiungi una tappa',
      deleteStep: 'Elimina',
      confirmDelete: 'Rimuovere {name} dall\'itinerario?',
      confirmCancel: 'Annullare le modifiche? Tutte le modifiche saranno perse.',
      saved: 'Salvato!',
      saving: 'Salvataggio…',
      loginRequired: 'Accedi per salvare il tuo itinerario personalizzato.',
      unsaved: 'Modifiche non salvate',
      searchPlace: 'Cerca un luogo…',
      alreadyIn: 'già nell\'itinerario',
      insertBefore: 'Inserisci prima',
      insertAfter: 'Inserisci dopo',
      choosePosition: 'Dove posizionare {name}?',
      day: 'Giorno',
      visits: 'Visite',
      activities: 'Attività',
      noResults: 'Nessun luogo trovato',
      close: 'Chiudi',
      driveToNext: 'Tragitto successivo',
      start: 'Inizio',
      end: 'Fine',
      nVisits: '{n} visita/e',
      nActivities: '{n} attività',
      editBtn: 'Aggiungi, rimuovi, riordina le tappe in questa pagina',
      editBtnSub: '(richiede l\'accesso — la versione mobile permette una visualizzazione più fluida ma non queste modifiche)',
      limitReached: 'Limite di viaggi salvati raggiunto. Elimina un viaggio esistente dalla tua dashboard.',
      reorgTitle: 'Riorganizzazione',
      reorgOnMap: 'Riorganizza sulla mappa',
      reorgList: 'Modalità lista',
      reorgInst: 'Clic = prossima tappa · Doppio clic = elimina',
      reorgInvert: 'Inverti percorso',
      reorgReset: 'Reimposta',
      reorgPreview: 'Anteprima',
      reorgValidate: 'Applica',
      reorgCancel: 'Annulla',
      reorgStepCount: '{done}/{total} tappe',
      reorgDeleted: 'Eliminata',
      reorgConfirmExit: 'Uscire senza applicare le modifiche?',
      reorgMustKeepOne: 'Mantieni almeno una tappa!',
      reorgAddPlace: 'Aggiungere {name}?',
      reorgAdd: 'Aggiungi',
      reorgNewOrder: 'Nuovo ordine',
      reorgPending: 'In attesa',
    },
    ar: {
      editExplain: 'أعد ترتيب المحطات، أضف أو احذف أماكن. لتعديل الزيارات والأنشطة، استخدم الوظائف المتقدمة.',
      save: 'حفظ',
      cancel: 'إلغاء',
      advanced: 'عدّل المحطات ومددها، الزيارات، أضف فنادقك، احسب ميزانيتك، شارك رحلتك، اسأل الذكاء الاصطناعي والمزيد في الصفحة التالية',
      addStep: 'أضف محطة',
      deleteStep: 'حذف',
      confirmDelete: 'حذف {name} من المسار؟',
      confirmCancel: 'إلغاء التغييرات؟ ستفقد جميع التعديلات.',
      saved: 'تم الحفظ!',
      saving: 'جارٍ الحفظ…',
      loginRequired: 'سجّل الدخول لحفظ مسارك المخصص.',
      unsaved: 'تغييرات غير محفوظة',
      searchPlace: 'ابحث عن مكان…',
      alreadyIn: 'موجود في المسار',
      insertBefore: 'إدراج قبل',
      insertAfter: 'إدراج بعد',
      choosePosition: 'أين تضع {name}؟',
      day: 'يوم',
      visits: 'زيارات',
      activities: 'أنشطة',
      noResults: 'لم يتم العثور على أماكن',
      close: 'إغلاق',
      driveToNext: 'الطريق التالي',
      start: 'البداية',
      end: 'النهاية',
      nVisits: '{n} زيارة/زيارات',
      nActivities: '{n} نشاط/أنشطة',
      editBtn: 'أضف، احذف، أعد ترتيب المحطات في هذه الصفحة',
      editBtnSub: '(يتطلب تسجيل الدخول — نسخة الجوال تتيح عرضاً أكثر سلاسة لكن لا تسمح بهذه التعديلات)',
      limitReached: 'تم الوصول إلى الحد الأقصى للرحلات المحفوظة. احذف رحلة موجودة من لوحة التحكم.',
      reorgTitle: 'إعادة الترتيب',
      reorgOnMap: 'إعادة الترتيب على الخريطة',
      reorgList: 'وضع القائمة',
      reorgInst: 'نقرة = المحطة التالية · نقرة مزدوجة = حذف',
      reorgInvert: 'عكس المسار',
      reorgReset: 'إعادة تعيين',
      reorgPreview: 'معاينة',
      reorgValidate: 'تطبيق',
      reorgCancel: 'إلغاء',
      reorgStepCount: '{done}/{total} محطات',
      reorgDeleted: 'محذوفة',
      reorgConfirmExit: 'الخروج بدون تطبيق التغييرات؟',
      reorgMustKeepOne: 'احتفظ بمحطة واحدة على الأقل!',
      reorgAddPlace: 'إضافة {name}؟',
      reorgAdd: 'إضافة',
      reorgNewOrder: 'الترتيب الجديد',
      reorgPending: 'في الانتظار',
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
.ort-ed-launch .ort-ed-btn-detail{background:linear-gradient(135deg,#ff6b35,#e55a28);color:#fff;font-weight:500;font-size:.8rem}
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

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  async function init(opts) {
    config = opts || {};
    config.cc = (config.cc || '').toUpperCase();
    config.lang = config.lang || 'fr';
    t = I18N[config.lang] || I18N.fr;

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
      savedTripId = null;
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
      nights: placeData.suggested_days || 1,
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

    var uiDay = t.day || 'Jour';
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
      html += '<div class="db">' + uiDay + ' ' + dayNum + '</div>';
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

    var tripData = {
      id: tripId,
      title: itinTitle,
      country: config.cc,
      cc: config.cc,
      steps: deepClone(steps),
      saved: true,
      source: 'static-editor',
      _originalItinId: config.itinId,
      sourceUrl: global.location.href,
      updatedAt: Date.now(),
      createdAt: savedTripId ? undefined : Date.now(), // createdAt seulement à la première
      nights: steps.reduce(function (sum, s) { return sum + (s.nights || 1); }, 0),
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
            days: steps.reduce(function (sum, s) { return sum + (s.nights || 1); }, 0),
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

    var lang = document.documentElement.lang || 'fr';
    var labels = I18N[lang] || I18N.fr;

    // Récupérer l'URL vers RT Detail depuis le body ou un lien existant
    var detailUrl = document.body.dataset.detailUrl || document.body.dataset.detailurl || '';
    if (!detailUrl) {
      var link = document.querySelector('a[href*="roadtrip_detail"]');
      if (link) detailUrl = link.href || link.getAttribute('href') || '';
    }

    var div = document.createElement('div');
    div.id = 'ort-ed-launcher';
    div.className = 'ort-ed-launch';

    var h = '<button class="ort-ed-btn-steps" onclick="ORT_ITIN_EDITOR._launch()">✏️ ' + esc(labels.editBtn) + '</button>';
    if (detailUrl) {
      h += '<a href="' + esc(detailUrl) + '" class="ort-ed-btn-detail" style="text-decoration:none;display:inline-block;text-align:center">🚀 ' + esc(labels.advanced) + '</a>';
    }
    h += '<small>' + esc(labels.editBtnSub) + '</small>';

    div.innerHTML = h;
    textPanel.insertBefore(div, textPanel.firstChild);
  }

  function launch() {
    // Collecter les paramètres depuis plusieurs sources
    var body = document.body;
    var lang = document.documentElement.lang || 'fr';

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
  function startMapReorg() {
    reorg.active = true;
    reorg.newOrder = [];
    reorg.deleted = [];
    reorg.addedPlaces = [];

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

    // Mettre tous les marqueurs en mode "en attente" (gris)
    steps.forEach(function (step, idx) {
      var dayNum = idx + 1;
      if (global.mk[dayNum]) {
        global.mk[dayNum].setIcon(reorgIcon(dayNum, 'pending', dayNum));
        // Attacher les listeners de clic
        global.mk[dayNum].off('click');
        global.mk[dayNum].on('click', function () { handleReorgClick(step._idx); });
        global.mk[dayNum].off('dblclick');
        global.mk[dayNum].on('dblclick', function () { handleReorgDblClick(step._idx); });
      }
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

    console.log('[ORT-EDITOR] Mode carte démarré');
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

    // Retirer la toolbar, le panneau et les éléments mobiles
    var tb = document.getElementById('ort-ed-toolbar');
    if (tb) tb.remove();
    var panel = document.getElementById('ort-ed-rpanel');
    if (panel) panel.remove();
    var badge = document.getElementById('ort-ed-reorg-badge');
    if (badge) badge.remove();
    var mbtns = document.getElementById('ort-ed-reorg-mbtns');
    if (mbtns) mbtns.remove();

    // Nettoyer les listeners OP et restaurer les originaux
    cleanupOPMarkers();
    showOriginalOPMarkers();

    // Nettoyer la polyline grise de l'ordre original
    if (reorgOriginalPl) {
      try { global.map.removeLayer(reorgOriginalPl); } catch (e) { }
      reorgOriginalPl = null;
    }

    // Restaurer les marqueurs normaux
    updateMap();

    // Invalider la carte
    if (global.map) {
      [100, 300, 500].forEach(function (d) {
        setTimeout(function () { global.map.invalidateSize(); }, d);
      });
    }
  }

  // ─────────────────────────────────────────────
  // ICÔNES RÉORG
  // ─────────────────────────────────────────────
  function reorgIcon(day, state, label) {
    var bg, sz, fs, txt, extra = '';
    if (state === 'ordered') {
      bg = '#e11d48'; sz = 30; fs = 13; txt = label;
    } else if (state === 'deleted') {
      bg = '#cbd5e1'; sz = 22; fs = 11; txt = '✕'; extra = 'opacity:.4;';
    } else {
      bg = '#94a3b8'; sz = 26; fs = 11; txt = label; extra = 'opacity:.7;';
    }
    return L.divIcon({
      html: '<div style="background:' + bg + ';color:#fff;width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + fs + 'px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);' + extra + '">' + txt + '</div>',
      className: 'dm',
      iconSize: [sz, sz],
      iconAnchor: [sz / 2, sz / 2]
    });
  }

  // ─────────────────────────────────────────────
  // GESTION DES CLICS RÉORG
  // ─────────────────────────────────────────────
  function handleReorgClick(stepIdx) {
    if (reorg.clickTimer) {
      clearTimeout(reorg.clickTimer);
      reorg.clickTimer = null;
      handleReorgDblClick(stepIdx);
      return;
    }
    reorg.clickTimer = setTimeout(function () {
      reorg.clickTimer = null;
      doSingleClick(stepIdx);
    }, 250);
  }

  function doSingleClick(stepIdx) {
    if (reorg.deleted.indexOf(stepIdx) >= 0) return; // supprimé → ignorer

    var idx = reorg.newOrder.indexOf(stepIdx);
    if (idx >= 0) {
      // Déjà dans l'ordre → retirer (correction)
      reorg.newOrder.splice(idx, 1);
    } else {
      // Pas encore → ajouter à la fin
      reorg.newOrder.push(stepIdx);
    }
    refreshReorgVisuals();
  }

  function handleReorgDblClick(stepIdx) {
    var delIdx = reorg.deleted.indexOf(stepIdx);
    if (delIdx >= 0) {
      // Réintégrer
      reorg.deleted.splice(delIdx, 1);
      reorg.newOrder.push(stepIdx);
    } else {
      // Supprimer
      var ordIdx = reorg.newOrder.indexOf(stepIdx);
      if (ordIdx >= 0) reorg.newOrder.splice(ordIdx, 1);
      reorg.deleted.push(stepIdx);
    }
    refreshReorgVisuals();
  }

  // ─────────────────────────────────────────────
  // MISE À JOUR VISUELLE DES MARQUEURS
  // ─────────────────────────────────────────────
  function refreshReorgVisuals() {
    steps.forEach(function (step, idx) {
      var dayNum = idx + 1;
      var m = global.mk[dayNum];
      if (!m) return;

      var sIdx = step._idx;
      var ordIdx = reorg.newOrder.indexOf(sIdx);
      var isDel = reorg.deleted.indexOf(sIdx) >= 0;

      if (isDel) {
        m.setIcon(reorgIcon(dayNum, 'deleted', '✕'));
      } else if (ordIdx >= 0) {
        m.setIcon(reorgIcon(dayNum, 'ordered', ordIdx + 1));
      } else {
        m.setIcon(reorgIcon(dayNum, 'pending', dayNum));
      }
    });

    // Mettre à jour la polyline avec le nouvel ordre
    updateReorgPolyline();

    // Mettre à jour le panneau latéral ou le badge mobile
    if (window.innerWidth > 900) {
      updateReorgPanelList();
    } else {
      updateReorgBadge();
    }
  }

  // Polyline grise pour l'ordre original (visible en permanence en mode réorg)
  var reorgOriginalPl = null;

  function updateReorgPolyline() {
    var map = global.map;
    if (!map) return;

    // Supprimer l'ancienne polyline rouge (sélection en cours)
    if (global.pl) { try { map.removeLayer(global.pl); } catch (e) { } }
    global.pl = null;

    // S'assurer que la polyline grise de l'ordre original est visible
    if (!reorgOriginalPl) {
      var origLL = [];
      steps.forEach(function (step) {
        if (step.lat && step.lng && reorg.deleted.indexOf(step._idx) < 0) {
          origLL.push([step.lat, step.lng]);
        }
      });
      if (origLL.length >= 2) {
        reorgOriginalPl = L.polyline(origLL, { color: '#94a3b8', weight: 2, opacity: 0.4, dashArray: '6,8' }).addTo(map);
      }
    }

    // Construire la polyline rouge depuis newOrder (le nouvel ordre choisi)
    var ll = [];
    reorg.newOrder.forEach(function (sIdx) {
      var step = steps.find(function (s) { return s._idx === sIdx; });
      if (step && step.lat && step.lng) {
        ll.push([step.lat, step.lng]);
      }
    });

    if (ll.length >= 2) {
      global.pl = L.polyline(ll, { color: '#e11d48', weight: 3, opacity: 0.8, dashArray: '8,6' }).addTo(map);
    }
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
    // Head
    h += '<div class="ort-ed-rpanel-head"><h3>🔄 ' + esc(t.reorgTitle) + '</h3>';
    h += '<button class="ort-ed-modal-close" onclick="ORT_ITIN_EDITOR._stopReorg(false)">×</button></div>';
    // Instructions
    h += '<div class="ort-ed-rpanel-inst">' + esc(t.reorgInst) + '</div>';
    // Outils
    h += '<div class="ort-ed-rpanel-tools">';
    h += '<button onclick="ORT_ITIN_EDITOR._reorgInvert()">🔁 ' + esc(t.reorgInvert) + '</button>';
    h += '<button onclick="ORT_ITIN_EDITOR._reorgReset()">⟲ ' + esc(t.reorgReset) + '</button>';
    h += '</div>';
    // Liste
    h += '<div class="ort-ed-rpanel-list" id="ort-ed-rpanel-list"></div>';
    // Footer — seuls boutons d'action
    h += '<div class="ort-ed-rpanel-footer" style="flex-wrap:wrap">';
    h += '<button class="ort-ed-rbtn-validate" onclick="ORT_ITIN_EDITOR._reorgPreview()">👁️ ' + esc(t.reorgPreview) + '</button>';
    h += '<button class="ort-ed-rbtn-cancel" onclick="ORT_ITIN_EDITOR._stopReorg(false)">✕ ' + esc(t.reorgCancel) + '</button>';
    h += '</div>';

    panel.innerHTML = h;
    document.body.appendChild(panel);

    updateReorgPanelList();
  }

  function updateReorgPanelList() {
    var listEl = document.getElementById('ort-ed-rpanel-list');
    if (!listEl) return;

    var h = '';

    // D'abord les étapes dans le nouvel ordre
    if (reorg.newOrder.length > 0) {
      h += '<div style="padding:4px 16px;font-size:.7rem;color:#e11d48;font-weight:600;text-transform:uppercase">' + esc(t.reorgNewOrder) + '</div>';
      reorg.newOrder.forEach(function (sIdx, i) {
        var step = steps.find(function (s) { return s._idx === sIdx; });
        var name = step ? step.name : (placesIndex[sIdx] ? placesIndex[sIdx].name : sIdx);
        h += '<div class="ort-ed-rpanel-item ordered" onclick="ORT_ITIN_EDITOR._reorgClickPanel(' + sIdx + ')" ondblclick="ORT_ITIN_EDITOR._reorgDblClickPanel(' + sIdx + ')">';
        h += '<div class="ort-ed-rpanel-num ordered">' + (i + 1) + '</div>';
        h += '<div class="ort-ed-rpanel-name">' + esc(name) + '</div>';
        h += '</div>';
      });
    }

    // Étapes en attente (ni dans newOrder ni dans deleted)
    var pending = steps.filter(function (s) {
      return reorg.newOrder.indexOf(s._idx) < 0 && reorg.deleted.indexOf(s._idx) < 0;
    });
    if (pending.length > 0) {
      h += '<div style="padding:4px 16px;font-size:.7rem;color:#94a3b8;font-weight:600;text-transform:uppercase">' + esc(t.reorgPending) + '</div>';
      pending.forEach(function (step, i) {
        var origNum = steps.indexOf(step) + 1;
        h += '<div class="ort-ed-rpanel-item" onclick="ORT_ITIN_EDITOR._reorgClickPanel(' + step._idx + ')" ondblclick="ORT_ITIN_EDITOR._reorgDblClickPanel(' + step._idx + ')">';
        h += '<div class="ort-ed-rpanel-num pending">' + origNum + '</div>';
        h += '<div class="ort-ed-rpanel-name">' + esc(step.name) + '</div>';
        h += '</div>';
      });
    }

    // Étapes supprimées
    if (reorg.deleted.length > 0) {
      h += '<div style="padding:4px 16px;font-size:.7rem;color:#cbd5e1;font-weight:600;text-transform:uppercase">✕ ' + esc(t.reorgDeleted) + '</div>';
      reorg.deleted.forEach(function (sIdx) {
        var step = steps.find(function (s) { return s._idx === sIdx; });
        var name = step ? step.name : sIdx;
        h += '<div class="ort-ed-rpanel-item deleted" ondblclick="ORT_ITIN_EDITOR._reorgDblClickPanel(' + sIdx + ')">';
        h += '<div class="ort-ed-rpanel-num deleted">✕</div>';
        h += '<div class="ort-ed-rpanel-name">' + esc(name) + '</div>';
        h += '<div class="ort-ed-rpanel-badge">' + esc(t.reorgDeleted) + '</div>';
        h += '</div>';
      });
    }

    // Bouton ajouter une étape
    h += '<div style="padding:10px 16px">';
    h += '<button onclick="ORT_ITIN_EDITOR._openAddFromPanel()" style="display:block;width:100%;padding:10px;border:2px dashed #d0dff0;border-radius:8px;background:none;color:#113f7a;font-size:.85rem;font-weight:600;cursor:pointer">＋ ' + esc(t.addStep) + '</button>';
    h += '</div>';

    listEl.innerHTML = h;
  }

  // ─────────────────────────────────────────────
  // MOBILE : BADGE + BOUTONS
  // ─────────────────────────────────────────────
  function renderReorgMobile() {
    // Badge
    var badge = document.createElement('div');
    badge.id = 'ort-ed-reorg-badge';
    badge.className = 'ort-ed-reorg-badge';
    badge.textContent = t.reorgStepCount.replace('{done}', '0').replace('{total}', steps.length);
    document.body.appendChild(badge);

    // Boutons
    var btns = document.createElement('div');
    btns.id = 'ort-ed-reorg-mbtns';
    btns.className = 'ort-ed-reorg-mbtns';
    btns.innerHTML = '<button style="background:#f0f0f0;color:#333" onclick="ORT_ITIN_EDITOR._stopReorg(false)">✕ ' + esc(t.reorgCancel) + '</button>' +
      '<button style="background:#e11d48;color:#fff" onclick="ORT_ITIN_EDITOR._reorgPreview()">✓ ' + esc(t.reorgValidate) + '</button>';
    document.body.appendChild(btns);
  }

  function updateReorgBadge() {
    var badge = document.getElementById('ort-ed-reorg-badge');
    if (badge) {
      badge.textContent = t.reorgStepCount.replace('{done}', reorg.newOrder.length).replace('{total}', steps.length);
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
      nights: place.suggested_days || 1,
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
    if (!list) return;
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
    if (list) {
      list.addEventListener('click', function (e) {
        var item = e.target.closest('[data-insert-pid]');
        if (!item) return;
        var pid = item.dataset.insertPid;
        var posInFinal = parseInt(item.dataset.insertAt);

        // Construire le newOrder complet (toutes les étapes non supprimées dans l'ordre final)
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
          nights: place.suggested_days || 1,
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

        // Insérer le _idx du nouveau step dans l'ordre complet
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
    if (reorg.newOrder.length === 0) {
      // Construire l'ordre actuel (sans les supprimées)
      reorg.newOrder = steps.filter(function (s) {
        return reorg.deleted.indexOf(s._idx) < 0;
      }).map(function (s) { return s._idx; });
    }
    reorg.newOrder.reverse();
    refreshReorgVisuals();
  }

  function reorgReset() {
    reorg.newOrder = [];
    reorg.deleted = [];
    // Retirer les étapes ajoutées depuis OP
    reorg.addedPlaces.forEach(function (sIdx) {
      var idx = steps.findIndex(function (s) { return s._idx === sIdx; });
      if (idx >= 0) steps.splice(idx, 1);
    });
    reorg.addedPlaces = [];
    // Supprimer la polyline grise pour qu'elle soit recréée proprement
    if (reorgOriginalPl) {
      try { global.map.removeLayer(reorgOriginalPl); } catch (e) { }
      reorgOriginalPl = null;
    }
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
    // Puis les étapes non cliquées et non supprimées, dans l'ordre original
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
    isDirty = true;

    // Quitter le mode carte
    stopMapReorg(false);

    // Vérifier si connecté → sauvegarder directement
    var user = null;
    try { user = global.firebase && global.firebase.auth && global.firebase.auth().currentUser; } catch (e) { }

    if (user) {
      // Connecté → sauvegarder directement
      showToast(t.saving, 'info');
      save();
    } else {
      // Pas connecté → ouvrir la popup de connexion du header
      showToast(t.loginRequired, 'info');
      // Essayer d'ouvrir la popup d'auth du header
      var authPop = document.getElementById('authPop');
      if (authPop) authPop.style.display = 'block';

      // Afficher un message dans le textPanel avec boutons
      var textPanel = document.getElementById('textPanel');
      if (textPanel) {
        var h = '<div style="padding:30px 20px;text-align:center;max-width:400px;margin:0 auto">';
        h += '<div style="font-size:2rem;margin-bottom:12px">🔐</div>';
        h += '<div style="font-size:1.1rem;font-weight:600;color:#113f7a;margin-bottom:8px">✓ ' + steps.length + ' ' + esc(t.day).toLowerCase() + 's</div>';
        h += '<p style="color:#555;margin-bottom:20px;line-height:1.5">' + esc(t.loginRequired) + '</p>';
        h += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
        h += '<button onclick="ORT_ITIN_EDITOR._startMapReorg()" style="padding:10px 20px;border:1px solid #d0dff0;border-radius:8px;background:#fff;cursor:pointer;font-weight:600">🗺️ ' + esc(t.reorgOnMap) + '</button>';
        h += '<button onclick="ORT_ITIN_EDITOR._cancel()" style="padding:10px 20px;border:1px solid #ddd;border-radius:8px;background:#f0f0f0;cursor:pointer">' + esc(t.cancel) + '</button>';
        h += '</div></div>';
        textPanel.innerHTML = h;
      }

      // Écouter le changement d'état auth — si l'utilisateur se connecte, sauvegarder automatiquement
      if (global.firebase && global.firebase.auth) {
        var unsubscribe = global.firebase.auth().onAuthStateChanged(function (newUser) {
          if (newUser && isDirty) {
            unsubscribe(); // Ne plus écouter
            showToast(t.saving, 'info');
            save();
          }
        });
      }
    }
  }

  // Vue après validation de la réorg — résumé + bouton sauvegarder
  function renderPostReorgView() {
    var textPanel = document.getElementById('textPanel');
    if (!textPanel) return;

    var h = '';
    // Toolbar compacte
    h += '<div class="ort-ed-toolbar" id="ort-ed-toolbar">';
    h += '<span class="ort-ed-label">✓ ' + esc(t.reorgValidate) + '</span>';
    h += '<span style="flex:1"></span>';
    h += '<button class="ort-ed-save" onclick="ORT_ITIN_EDITOR._save()">💾 ' + esc(t.save) + '</button>';
    h += '<button class="ort-ed-cancel" onclick="ORT_ITIN_EDITOR._cancel()">' + esc(t.cancel) + '</button>';
    h += '<button class="ort-ed-cancel" onclick="ORT_ITIN_EDITOR._startMapReorg()">🗺️ ' + esc(t.reorgOnMap) + '</button>';
    h += '</div>';

    // Liste des étapes dans le nouvel ordre
    steps.forEach(function (step, i) {
      h += '<div class="ort-ed-step">';
      h += '<div class="ort-ed-step-head">';
      h += '<div class="ort-ed-daynum">' + (i + 1) + '</div>';
      h += '<div class="ort-ed-stepname">' + esc(step.name);
      if (step.nights > 1) h += ' <small>(' + step.nights + ' ' + t.day.toLowerCase() + 's)</small>';
      h += '</div>';
      if (step.rating) h += '<div class="ort-ed-rating">' + stars(step.rating) + '</div>';
      h += '</div>';
      var nV = (step.visits || []).length;
      var nA = (step.activities || []).length;
      if (nV || nA) {
        h += '<div class="ort-ed-step-body">';
        if (nV) h += '<span>📍 ' + t.nVisits.replace('{n}', nV) + '</span>';
        if (nA) h += '<span>🎯 ' + t.nActivities.replace('{n}', nA) + '</span>';
        h += '</div>';
      }
      // Leg
      if (i < steps.length - 1 && step.to_next_leg && step.to_next_leg.distance_km) {
        h += '<div class="ort-ed-leg">🚗 ' + Math.round(step.to_next_leg.distance_km) + ' km · ' + drvT(step._driveMinToNext) + '</div>';
      }
      h += '</div>';
    });

    textPanel.innerHTML = h;
    updateMap();
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
  global.ORT_ITIN_EDITOR = {
    init: init,
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
      if (!apply && (reorg.newOrder.length > 0 || reorg.deleted.length > 0)) {
        if (!confirm(t.reorgConfirmExit)) return;
      }
      stopMapReorg(apply);
    },
    _reorgInvert: reorgInvert,
    _reorgReset: reorgReset,
    _reorgPreview: reorgPreview,
    _reorgValidate: reorgValidate,
    _reorgAddOP: function (pid, pos) { reorgAddOP(pid, pos); },
    _openAddFromPanel: function () { openAddFromPanel(); },
    _reorgClickPanel: function (sIdx) { handleReorgClick(sIdx); },
    _reorgDblClickPanel: function (sIdx) { handleReorgDblClick(sIdx); }
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
