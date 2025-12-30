/**
 * MODULE: Gestion des réservations pour chaque étape
 * Intégration avec roadtrip-editor.html
 * Support I18N complet
 */

// ============================================================
// 1. TRADUCTIONS I18N
// ============================================================

const BOOKINGS_I18N = {
  fr: {
    myBookings: 'Mes réservations',
    hotel: 'Hôtel',
    flight: 'Vol',
    car: 'Voiture de location',
    train: 'Train',
    activity: 'Activité',
    restaurant: 'Restaurant',
    other: 'Autre',
    
    confirmationNumber: 'N° de confirmation',
    price: 'Prix',
    checkin: 'Arrivée',
    checkout: 'Départ',
    departure: 'Départ',
    arrival: 'Arrivée',
    date: 'Date',
    
    noBookings: 'Aucune réservation pour cette étape',
    addBooking: '+ Ajouter une réservation',
    deleteBooking: 'Supprimer',
    
    bookingsSummary: 'Réservations: {count}',
    totalPrice: 'Total: {price}'
  },
  
  en: {
    myBookings: 'My Bookings',
    hotel: 'Hotel',
    flight: 'Flight',
    car: 'Car Rental',
    train: 'Train',
    activity: 'Activity',
    restaurant: 'Restaurant',
    other: 'Other',
    
    confirmationNumber: 'Confirmation #',
    price: 'Price',
    checkin: 'Check-in',
    checkout: 'Check-out',
    departure: 'Departure',
    arrival: 'Arrival',
    date: 'Date',
    
    noBookings: 'No bookings for this step',
    addBooking: '+ Add a booking',
    deleteBooking: 'Delete',
    
    bookingsSummary: 'Bookings: {count}',
    totalPrice: 'Total: {price}'
  },
  
  es: {
    myBookings: 'Mis Reservas',
    hotel: 'Hotel',
    flight: 'Vuelo',
    car: 'Alquiler de Coche',
    train: 'Tren',
    activity: 'Actividad',
    restaurant: 'Restaurante',
    other: 'Otro',
    
    confirmationNumber: 'N° de Confirmación',
    price: 'Precio',
    checkin: 'Check-in',
    checkout: 'Check-out',
    departure: 'Salida',
    arrival: 'Llegada',
    date: 'Fecha',
    
    noBookings: 'Sin reservas para este paso',
    addBooking: '+ Añadir reserva',
    deleteBooking: 'Eliminar',
    
    bookingsSummary: 'Reservas: {count}',
    totalPrice: 'Total: {price}'
  },
  
  it: {
    myBookings: 'Le Mie Prenotazioni',
    hotel: 'Hotel',
    flight: 'Volo',
    car: 'Noleggio Auto',
    train: 'Treno',
    activity: 'Attività',
    restaurant: 'Ristorante',
    other: 'Altro',
    
    confirmationNumber: 'N° Conferma',
    price: 'Prezzo',
    checkin: 'Check-in',
    checkout: 'Check-out',
    departure: 'Partenza',
    arrival: 'Arrivo',
    date: 'Data',
    
    noBookings: 'Nessuna prenotazione per questo step',
    addBooking: '+ Aggiungi prenotazione',
    deleteBooking: 'Elimina',
    
    bookingsSummary: 'Prenotazioni: {count}',
    totalPrice: 'Totale: {price}'
  },
  
  pt: {
    myBookings: 'Minhas Reservas',
    hotel: 'Hotel',
    flight: 'Voo',
    car: 'Aluguel de Carro',
    train: 'Trem',
    activity: 'Atividade',
    restaurant: 'Restaurante',
    other: 'Outro',
    
    confirmationNumber: 'N° Confirmação',
    price: 'Preço',
    checkin: 'Check-in',
    checkout: 'Check-out',
    departure: 'Saída',
    arrival: 'Chegada',
    date: 'Data',
    
    noBookings: 'Nenhuma reserva para este passo',
    addBooking: '+ Adicionar reserva',
    deleteBooking: 'Deletar',
    
    bookingsSummary: 'Reservas: {count}',
    totalPrice: 'Total: {price}'
  },
  
  ar: {
    myBookings: 'حجوزاتي',
    hotel: 'فندق',
    flight: 'رحلة جوية',
    car: 'تأجير سيارة',
    train: 'قطار',
    activity: 'نشاط',
    restaurant: 'مطعم',
    other: 'آخر',
    
    confirmationNumber: 'رقم التأكيد',
    price: 'السعر',
    checkin: 'تسجيل الوصول',
    checkout: 'تسجيل المغادرة',
    departure: 'المغادرة',
    arrival: 'الوصول',
    date: 'التاريخ',
    
    noBookings: 'لا توجد حجوزات لهذه الخطوة',
    addBooking: '+ إضافة حجز',
    deleteBooking: 'حذف',
    
    bookingsSummary: 'الحجوزات: {count}',
    totalPrice: 'الإجمالي: {price}'
  }
};

// ============================================================
// 2. TYPES DE RÉSERVATIONS ET CATÉGORIES
// ============================================================

const BOOKING_TYPES = {
  lodging: { icon: '🏨', category: 'lodging' },
  hotel: { icon: '🏨', category: 'lodging' },
  flight: { icon: '✈️', category: 'flight' },
  car: { icon: '🚗', category: 'car' },
  rental: { icon: '🚗', category: 'car' },
  train: { icon: '🚆', category: 'train' },
  activity: { icon: '🎯', category: 'activity' },
  restaurant: { icon: '🍽️', category: 'restaurant' },
  other: { icon: '📄', category: 'other' }
};

// ============================================================
// 3. CLASSE POUR GÉRER LES RÉSERVATIONS
// ============================================================

class BookingManager {
  constructor(lang = 'fr') {
    this.lang = lang;
    this.bookings = {}; // stepIdx -> array of bookings
  }
  
  // Obtenir texte traduit
  t(key, params = {}) {
    const text = BOOKINGS_I18N[this.lang]?.[key] || BOOKINGS_I18N.fr[key] || key;
    
    // Remplacer les placeholders {key}
    let result = text;
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
    return result;
  }
  
  // Ajouter une réservation pour une étape
  addBooking(stepIdx, booking) {
    if (!this.bookings[stepIdx]) {
      this.bookings[stepIdx] = [];
    }
    this.bookings[stepIdx].push({
      ...booking,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  // Obtenir les réservations pour une étape
  getBookings(stepIdx) {
    return this.bookings[stepIdx] || [];
  }
  
  // Obtenir les réservations groupées par catégorie
  getBookingsByCategory(stepIdx) {
    const bookings = this.getBookings(stepIdx);
    const grouped = {};
    
    bookings.forEach(booking => {
      const type = booking.category || booking.type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(booking);
    });
    
    return grouped;
  }
  
  // Supprimer une réservation
  deleteBooking(stepIdx, bookingId) {
    if (this.bookings[stepIdx]) {
      this.bookings[stepIdx] = this.bookings[stepIdx].filter(b => b.id !== bookingId);
    }
  }
  
  // Calculer le prix total pour une étape
  getTotalPrice(stepIdx) {
    const bookings = this.getBookings(stepIdx);
    return bookings.reduce((sum, b) => {
      const price = parseFloat(b.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }
}

// ============================================================
// 4. RENDU DE LA MODALE
// ============================================================

function renderBookingsModal(stepIdx, stepName, bookingManager) {
  const bookingsByCategory = bookingManager.getBookingsByCategory(stepIdx);
  const totalPrice = bookingManager.getTotalPrice(stepIdx);
  const lang = bookingManager.lang;
  const t = (key, params) => bookingManager.t(key, params);
  
  let html = `
    <div class="bookings-modal" id="bookingsModal${stepIdx}">
      <div class="bookings-modal-content">
        <div class="bookings-modal-header">
          <h2>${t('myBookings')} — ${stepName}</h2>
          <button class="bookings-modal-close" onclick="closeBookingsModal(${stepIdx})">✕</button>
        </div>
        
        <div class="bookings-modal-body">
  `;
  
  if (Object.keys(bookingsByCategory).length === 0) {
    html += `<p class="no-bookings">${t('noBookings')}</p>`;
  } else {
    // Ordre des catégories
    const categoryOrder = ['lodging', 'flight', 'car', 'train', 'activity', 'restaurant', 'other'];
    
    categoryOrder.forEach(category => {
      const bookings = bookingsByCategory[category];
      if (!bookings) return;
      
      const categoryLabel = t(category);
      const categoryIcon = BOOKING_TYPES[category]?.icon || '📄';
      
      html += `
        <div class="bookings-category">
          <h3 class="bookings-category-title">${categoryIcon} ${categoryLabel}</h3>
          <div class="bookings-list">
      `;
      
      bookings.forEach(booking => {
        html += `
          <div class="booking-card" data-booking-id="${booking.id}">
            <div class="booking-header">
              <div class="booking-name">${booking.name || 'N/A'}</div>
              <button class="booking-delete" onclick="deleteBooking(${stepIdx}, '${booking.id}')">${t('deleteBooking')}</button>
            </div>
            
            ${booking.confirmationNumber ? `
              <div class="booking-row">
                <span class="booking-label">${t('confirmationNumber')}:</span>
                <span class="booking-value">${booking.confirmationNumber}</span>
              </div>
            ` : ''}
            
            ${booking.checkin ? `
              <div class="booking-row">
                <span class="booking-label">${t('checkin')}:</span>
                <span class="booking-value">${formatDate(booking.checkin)}</span>
              </div>
            ` : ''}
            
            ${booking.checkout ? `
              <div class="booking-row">
                <span class="booking-label">${t('checkout')}:</span>
                <span class="booking-value">${formatDate(booking.checkout)}</span>
              </div>
            ` : ''}
            
            ${booking.departure ? `
              <div class="booking-row">
                <span class="booking-label">${t('departure')}:</span>
                <span class="booking-value">${formatDate(booking.departure)}</span>
              </div>
            ` : ''}
            
            ${booking.arrival ? `
              <div class="booking-row">
                <span class="booking-label">${t('arrival')}:</span>
                <span class="booking-value">${formatDate(booking.arrival)}</span>
              </div>
            ` : ''}
            
            ${booking.price ? `
              <div class="booking-row booking-price">
                <span class="booking-label">${t('price')}:</span>
                <span class="booking-value">${booking.price} ${booking.currency || ''}</span>
              </div>
            ` : ''}
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
  }
  
  if (totalPrice > 0) {
    html += `
      <div class="bookings-summary">
        <strong>${t('totalPrice', { price: totalPrice.toFixed(2) })}</strong>
      </div>
    `;
  }
  
  html += `
        </div>
        
        <div class="bookings-modal-footer">
          <button class="btn-secondary" onclick="closeBookingsModal(${stepIdx})">Fermer</button>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// ============================================================
// 5. STYLES CSS
// ============================================================

const BOOKINGS_CSS = `
/* Modale des réservations */
.bookings-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.bookings-modal.show {
  display: flex;
}

.bookings-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
  margin: auto;
}

.bookings-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.bookings-modal-header h2 {
  margin: 0;
  font-size: 1.3em;
  color: #113f7a;
}

.bookings-modal-close {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #666;
}

.bookings-modal-body {
  padding: 20px;
}

.bookings-category {
  margin-bottom: 24px;
}

.bookings-category-title {
  font-size: 1.1em;
  color: #113f7a;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.booking-name {
  font-weight: 600;
  color: #1f2937;
}

.booking-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.booking-delete:hover {
  background: #dc2626;
}

.booking-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.booking-label {
  color: #6b7280;
  font-weight: 500;
}

.booking-value {
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

.booking-price {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #d1d5db;
  font-weight: 600;
  color: #047857;
}

.bookings-summary {
  padding: 12px 20px;
  background: #f0fdf4;
  border-top: 1px solid #d1d5db;
  text-align: right;
  color: #047857;
  font-weight: 600;
}

.no-bookings {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-style: italic;
}

.bookings-modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Bouton hôtel pour étapes */
.step-bookings-btn {
  background: none;
  border: none;
  font-size: 1.3em;
  cursor: pointer;
  padding: 4px 8px;
  position: relative;
}

.step-bookings-badge {
  position: absolute;
  top: -5px;
  right: 0;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

/* Media Print */
@media print {
  .bookings-modal,
  .step-bookings-btn {
    display: none !important;
  }
}
`;

// ============================================================
// 6. FONCTIONS GLOBALES
// ============================================================

let globalBookingManager = null;

function initBookingManager(lang = 'fr') {
  globalBookingManager = new BookingManager(lang);
}

function openBookingsModal(stepIdx, stepName) {
  const modal = document.getElementById(`bookingsModal${stepIdx}`);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeBookingsModal(stepIdx) {
  const modal = document.getElementById(`bookingsModal${stepIdx}`);
  if (modal) {
    modal.classList.remove('show');
  }
}

function deleteBooking(stepIdx, bookingId) {
  if (globalBookingManager) {
    globalBookingManager.deleteBooking(stepIdx, bookingId);
    // Rafraîchir l'affichage
    location.reload(); // ou implémenter un refresh plus léger
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ============================================================
// 7. EXPORT
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BookingManager,
    BOOKINGS_I18N,
    BOOKING_TYPES,
    renderBookingsModal,
    initBookingManager
  };
}
