/**
 * OneRoadTrip - Module d'export Calendrier
 * 
 * Génère des fichiers .ics et liens Google Calendar
 * pour les réservations (vols, hôtels, activités)
 */

(function(window) {
  'use strict';
  
  // ══════════════════════════════════════════════════════════════
  // I18N
  // ══════════════════════════════════════════════════════════════
  const I18N = {
    fr: {
      flight: 'Vol',
      outbound: 'Aller',
      returnFlight: 'Retour',
      hotel: 'Hôtel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Récupération voiture',
      carDropoff: 'Restitution voiture',
      activity: 'Activité',
      visit: 'Visite',
      ref: 'Réf',
      addToCalendar: 'Ajouter au calendrier',
      downloadIcs: 'Télécharger .ics',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      allBookings: 'Toutes les réservations',
      tripCalendar: 'Calendrier du voyage'
    },
    en: {
      flight: 'Flight',
      outbound: 'Outbound',
      returnFlight: 'Return',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Car pickup',
      carDropoff: 'Car dropoff',
      activity: 'Activity',
      visit: 'Visit',
      ref: 'Ref',
      addToCalendar: 'Add to calendar',
      downloadIcs: 'Download .ics',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      allBookings: 'All bookings',
      tripCalendar: 'Trip calendar'
    },
    es: {
      flight: 'Vuelo',
      outbound: 'Ida',
      returnFlight: 'Vuelta',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Recogida coche',
      carDropoff: 'Devolución coche',
      activity: 'Actividad',
      visit: 'Visita',
      ref: 'Ref',
      addToCalendar: 'Añadir al calendario',
      downloadIcs: 'Descargar .ics',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      allBookings: 'Todas las reservas',
      tripCalendar: 'Calendario del viaje'
    },
    it: {
      flight: 'Volo',
      outbound: 'Andata',
      returnFlight: 'Ritorno',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Ritiro auto',
      carDropoff: 'Riconsegna auto',
      activity: 'Attività',
      visit: 'Visita',
      ref: 'Rif',
      addToCalendar: 'Aggiungi al calendario',
      downloadIcs: 'Scarica .ics',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      allBookings: 'Tutte le prenotazioni',
      tripCalendar: 'Calendario del viaggio'
    },
    pt: {
      flight: 'Voo',
      outbound: 'Ida',
      returnFlight: 'Volta',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Retirada carro',
      carDropoff: 'Devolução carro',
      activity: 'Atividade',
      visit: 'Visita',
      ref: 'Ref',
      addToCalendar: 'Adicionar ao calendário',
      downloadIcs: 'Baixar .ics',
      googleCalendar: 'Google Calendar',
      appleCalendar: 'Apple Calendar',
      outlookCalendar: 'Outlook',
      allBookings: 'Todas as reservas',
      tripCalendar: 'Calendário da viagem'
    },
    ar: {
      flight: 'رحلة',
      outbound: 'ذهاب',
      returnFlight: 'عودة',
      hotel: 'فندق',
      checkin: 'تسجيل الدخول',
      checkout: 'تسجيل الخروج',
      carPickup: 'استلام السيارة',
      carDropoff: 'تسليم السيارة',
      activity: 'نشاط',
      visit: 'زيارة',
      ref: 'المرجع',
      addToCalendar: 'إضافة للتقويم',
      downloadIcs: 'تحميل .ics',
      googleCalendar: 'تقويم جوجل',
      appleCalendar: 'تقويم أبل',
      outlookCalendar: 'أوتلوك',
      allBookings: 'جميع الحجوزات',
      tripCalendar: 'تقويم الرحلة'
    }
  ,
    nl: {
      flight: 'Vlucht',
      outbound: 'Heenreis',
      returnFlight: 'Terugreis',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Auto ophalen',
      carDropoff: 'Auto inleveren',
      activity: 'Activiteit',
      visit: 'Bezoek',
      ref: 'Ref.',
      addToCalendar: 'Aan agenda toevoegen',
      downloadIcs: '.ics downloaden',
      googleCalendar: 'Google Agenda',
      appleCalendar: 'Apple Agenda',
      outlookCalendar: 'Outlook',
      allBookings: 'Alle boekingen',
      tripCalendar: 'Reisagenda'
    },
    de: {
      flight: 'Flug',
      outbound: 'Hinflug',
      returnFlight: 'Rückflug',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      carPickup: 'Fahrzeugabholung',
      carDropoff: 'Fahrzeugrückgabe',
      activity: 'Aktivität',
      visit: 'Besichtigung',
      ref: 'Ref.',
      addToCalendar: 'Zum Kalender hinzufügen',
      downloadIcs: '.ics herunterladen',
      googleCalendar: 'Google Kalender',
      appleCalendar: 'Apple Kalender',
      outlookCalendar: 'Outlook',
      allBookings: 'Alle Buchungen',
      tripCalendar: 'Reisekalender'
    }
  };
  
  let lang = localStorage.getItem('ORT_LANG') || 'fr';
  if (!I18N[lang]) lang = 'en';
  
  const t = (key) => I18N[lang]?.[key] || I18N.en[key] || key;
  
  // ══════════════════════════════════════════════════════════════
  // GÉNÉRATION ICS
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Génère un UID unique pour l'événement
   */
  function generateUID() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@oneroadtrip.fr`;
  }
  
  /**
   * Formate une date/heure en format ICS (YYYYMMDDTHHMMSS)
   */
  function formatICSDateTime(date, time = null) {
    if (!date) return null;
    
    // Nettoyer la date
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (time) {
      const [hours, minutes] = time.split(':');
      return `${year}${month}${day}T${hours || '00'}${minutes || '00'}00`;
    }
    
    return `${year}${month}${day}`;
  }
  
  /**
   * Échappe les caractères spéciaux pour ICS
   */
  function escapeICS(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
  
  /**
   * Génère le contenu ICS pour un événement
   */
  function generateEvent(event) {
    const lines = [
      'BEGIN:VEVENT',
      `UID:${generateUID()}`,
      `DTSTAMP:${formatICSDateTime(new Date())}Z`
    ];
    
    // Dates
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDateTime(event.start)}`);
      if (event.end) {
        // Pour les événements all-day, la date de fin est exclusive
        const endDate = new Date(event.end);
        endDate.setDate(endDate.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${formatICSDateTime(endDate)}`);
      }
    } else {
      lines.push(`DTSTART:${formatICSDateTime(event.start, event.startTime)}`);
      if (event.end || event.endTime) {
        lines.push(`DTEND:${formatICSDateTime(event.end || event.start, event.endTime || event.startTime)}`);
      }
    }
    
    // Titre et description
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`);
    }
    
    // Rappel 1h avant
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT1H');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeICS(event.title)}`);
    lines.push('END:VALARM');
    
    lines.push('END:VEVENT');
    
    return lines.join('\r\n');
  }
  
  /**
   * Génère un fichier ICS complet
   */
  function generateICS(events, calendarName = 'OneRoadTrip') {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OneRoadTrip//Calendar//FR',
      `X-WR-CALNAME:${escapeICS(calendarName)}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    
    events.forEach(event => {
      lines.push(generateEvent(event));
    });
    
    lines.push('END:VCALENDAR');
    
    return lines.join('\r\n');
  }
  
  // ══════════════════════════════════════════════════════════════
  // CONVERSION RÉSERVATIONS → ÉVÉNEMENTS
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Convertit un vol en événements calendrier
   */
  function flightToEvents(booking) {
    const events = [];
    
    if (!booking.flights || booking.flights.length === 0) {
      // Vol simple sans segments
      if (booking.date_start) {
        events.push({
          title: `✈️ ${booking.name || t('flight')}`,
          start: booking.date_start,
          end: booking.date_end || booking.date_start,
          allDay: true,
          description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
          location: booking.address || ''
        });
      }
      return events;
    }
    
    // Segments de vol
    booking.flights.forEach(seg => {
      const typeLabel = seg.type === 'return' ? t('returnFlight') : t('outbound');
      const route = `${seg.departure_city || ''} → ${seg.arrival_city || ''}`;
      
      let description = [];
      if (seg.airline) description.push(seg.airline);
      if (seg.flight_number) description.push(seg.flight_number);
      if (booking.reference) description.push(`${t('ref')}: ${booking.reference}`);
      
      events.push({
        title: `✈️ ${typeLabel}: ${route}`,
        start: seg.departure_date,
        startTime: seg.departure_time,
        end: seg.arrival_date || seg.departure_date,
        endTime: seg.arrival_time,
        allDay: !seg.departure_time,
        description: description.join(' • '),
        location: seg.departure_airport ? `Aéroport ${seg.departure_airport}` : ''
      });
    });
    
    return events;
  }
  
  /**
   * Convertit une location voiture en événements calendrier
   */
  function carRentalToEvents(booking) {
    const events = [];
    const rental = booking.car_rental || {};
    
    // Pickup
    if (rental.pickup_date || booking.date_start) {
      events.push({
        title: `🚗 ${t('carPickup')}: ${rental.vehicle_model || booking.name || ''}`,
        start: rental.pickup_date || booking.date_start,
        startTime: rental.pickup_time,
        allDay: !rental.pickup_time,
        description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
        location: rental.pickup_location || booking.address || ''
      });
    }
    
    // Dropoff
    if (rental.dropoff_date || booking.date_end) {
      events.push({
        title: `🚗 ${t('carDropoff')}: ${rental.vehicle_model || booking.name || ''}`,
        start: rental.dropoff_date || booking.date_end,
        startTime: rental.dropoff_time,
        allDay: !rental.dropoff_time,
        description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
        location: rental.dropoff_location || rental.pickup_location || ''
      });
    }
    
    return events;
  }
  
  /**
   * Convertit un hôtel en événement calendrier
   */
  function hotelToEvents(booking, nights = 1) {
    const events = [];
    
    if (booking.date_start) {
      let description = [];
      if (booking.address) description.push(booking.address);
      if (booking.reference) description.push(`${t('ref')}: ${booking.reference}`);
      if (nights > 1) description.push(`${nights} nuits`);
      
      // Check-in
      events.push({
        title: `🏨 ${t('checkin')}: ${booking.name || t('hotel')}`,
        start: booking.date_start,
        startTime: '15:00', // Heure standard check-in
        allDay: false,
        description: description.join('\n'),
        location: booking.address || ''
      });
      
      // Check-out
      if (booking.date_end) {
        events.push({
          title: `🏨 ${t('checkout')}: ${booking.name || t('hotel')}`,
          start: booking.date_end,
          startTime: '11:00', // Heure standard check-out
          allDay: false,
          description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
          location: booking.address || ''
        });
      }
    }
    
    return events;
  }
  
  /**
   * Convertit une activité/visite en événement calendrier
   */
  function activityToEvents(booking) {
    if (!booking.date_start) return [];
    
    const icon = booking.category === 'visit' ? '🏛️' : 
                 booking.category === 'show' ? '🎭' : '🎯';
    
    return [{
      title: `${icon} ${booking.name || t('activity')}`,
      start: booking.date_start,
      end: booking.date_end || booking.date_start,
      allDay: true,
      description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
      location: booking.address || ''
    }];
  }
  
  /**
   * Convertit une réservation quelconque en événements
   */
  function bookingToEvents(booking, nights = 1) {
    switch (booking.category) {
      case 'flight':
        return flightToEvents(booking);
      case 'car_rental':
        return carRentalToEvents(booking);
      case 'hotel':
        return hotelToEvents(booking, nights);
      case 'activity':
      case 'visit':
      case 'show':
        return activityToEvents(booking);
      default:
        // Générique
        if (booking.date_start) {
          return [{
            title: `📋 ${booking.name || 'Réservation'}`,
            start: booking.date_start,
            end: booking.date_end || booking.date_start,
            allDay: true,
            description: booking.reference ? `${t('ref')}: ${booking.reference}` : '',
            location: booking.address || ''
          }];
        }
        return [];
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // GÉNÉRATION LIENS GOOGLE CALENDAR
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Génère un lien Google Calendar pour un événement
   */
  function generateGoogleCalendarLink(event) {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    
    const params = new URLSearchParams();
    params.set('text', event.title || '');
    
    // Dates
    if (event.allDay) {
      const start = formatICSDateTime(event.start);
      let end = start;
      if (event.end) {
        const endDate = new Date(event.end);
        endDate.setDate(endDate.getDate() + 1);
        end = formatICSDateTime(endDate);
      }
      params.set('dates', `${start}/${end}`);
    } else {
      const start = formatICSDateTime(event.start, event.startTime);
      const end = formatICSDateTime(event.end || event.start, event.endTime || event.startTime);
      params.set('dates', `${start}/${end}`);
    }
    
    if (event.description) params.set('details', event.description);
    if (event.location) params.set('location', event.location);
    
    return `${baseUrl}&${params.toString()}`;
  }
  
  // ══════════════════════════════════════════════════════════════
  // API PUBLIQUE
  // ══════════════════════════════════════════════════════════════
  
  /**
   * Exporte une réservation unique vers le calendrier
   */
  function exportBooking(booking, nights = 1) {
    const events = bookingToEvents(booking, nights);
    if (events.length === 0) {
      console.warn('[CALENDAR] Pas de données à exporter');
      return null;
    }
    
    const icsContent = generateICS(events, booking.name || 'Réservation');
    return {
      ics: icsContent,
      events: events,
      googleLinks: events.map(e => generateGoogleCalendarLink(e))
    };
  }
  
  /**
   * Exporte toutes les réservations d'un voyage
   */
  function exportAllBookings(travelBookings = [], stepBookingsMap = {}, tripTitle = 'Voyage') {
    const allEvents = [];
    
    // Travel bookings (vols, voiture, assurance)
    travelBookings.forEach(b => {
      const events = bookingToEvents(b);
      allEvents.push(...events);
    });
    
    // Step bookings (hôtels, activités)
    Object.values(stepBookingsMap).forEach(data => {
      const nights = data.steps?.length || 1;
      const events = bookingToEvents(data.booking, nights);
      allEvents.push(...events);
    });
    
    if (allEvents.length === 0) {
      console.warn('[CALENDAR] Aucune réservation à exporter');
      return null;
    }
    
    const icsContent = generateICS(allEvents, tripTitle);
    return {
      ics: icsContent,
      events: allEvents,
      count: allEvents.length
    };
  }
  
  /**
   * Télécharge un fichier ICS
   */
  function downloadICS(icsContent, filename = 'reservation.ics') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Affiche un menu pour choisir le calendrier
   */
  function showCalendarMenu(booking, nights = 1, anchorElement = null) {
    const result = exportBooking(booking, nights);
    if (!result) return;
    
    // Supprimer menu existant
    const existingMenu = document.getElementById('ortCalendarMenu');
    if (existingMenu) existingMenu.remove();
    
    // Créer le menu
    const menu = document.createElement('div');
    menu.id = 'ortCalendarMenu';
    menu.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      padding: 8px 0;
      z-index: 10000;
      min-width: 200px;
      font-family: system-ui, sans-serif;
    `;
    
    const items = [
      { icon: '📅', label: t('googleCalendar'), action: () => window.open(result.googleLinks[0], '_blank') },
      { icon: '📱', label: t('appleCalendar'), action: () => downloadICS(result.ics, 'reservation.ics') },
      { icon: '💼', label: t('outlookCalendar'), action: () => downloadICS(result.ics, 'reservation.ics') },
      { icon: '⬇️', label: t('downloadIcs'), action: () => downloadICS(result.ics, 'reservation.ics') }
    ];
    
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 16px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        text-align: left;
      `;
      btn.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
      btn.onmouseover = () => btn.style.background = '#f3f4f6';
      btn.onmouseout = () => btn.style.background = 'none';
      btn.onclick = () => {
        item.action();
        menu.remove();
      };
      menu.appendChild(btn);
    });
    
    document.body.appendChild(menu);
    
    // Positionner
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 5}px`;
      menu.style.left = `${rect.left}px`;
    } else {
      menu.style.top = '50%';
      menu.style.left = '50%';
      menu.style.transform = 'translate(-50%, -50%)';
    }
    
    // Fermer au clic extérieur
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }
  
  // ══════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════
  
  window.ORT_CALENDAR = {
    // Fonctions principales
    exportBooking,
    exportAllBookings,
    downloadICS,
    showCalendarMenu,
    
    // Helpers
    bookingToEvents,
    generateICS,
    generateGoogleCalendarLink,
    
    // Traductions
    t,
    setLang: (newLang) => { if (I18N[newLang]) lang = newLang; },
    
    VERSION: '1.0'
  };
  
  console.log('[CALENDAR] ✅ Module ORT_CALENDAR v1.0 chargé');
  
})(window);
