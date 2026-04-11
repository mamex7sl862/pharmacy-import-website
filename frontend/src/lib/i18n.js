import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      nav: {
        products: 'Products',
        categories: 'Categories',
        services: 'Services',
        about: 'About',
        contact: 'Contact',
        track_rfq: 'Track RFQ',
        search_placeholder: 'Search pharmaceuticals...',
        dashboard: 'Dashboard',
        logout: 'Logout',
        request_quote: 'Request Quotation'
      }
    }
  },
  fr: {
    translation: {
      nav: {
        products: 'Produits',
        categories: 'Catégories',
        services: 'Services',
        about: 'À propos',
        contact: 'Contact',
        track_rfq: 'Suivi RFQ',
        search_placeholder: 'Rechercher des produits...',
        dashboard: 'Tableau de bord',
        logout: 'Déconnexion',
        request_quote: 'Demander un devis'
      }
    }
  },
  es: {
    translation: {
      nav: {
        products: 'Productos',
        categories: 'Categorías',
        services: 'Servicios',
        about: 'Nosotros',
        contact: 'Contacto',
        track_rfq: 'Rastreo RFQ',
        search_placeholder: 'Buscar productos...',
        dashboard: 'Panel',
        logout: 'Cerrar sesión',
        request_quote: 'Solicitar cotización'
      }
    }
  }
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18n
