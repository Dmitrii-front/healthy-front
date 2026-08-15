export type { Doctor, Review } from './model/types'
export { DoctorSchema, ReviewSchema } from './model/schema'
export { DOCTOR_QUERIES } from './api/doctor.queries'
export { DOCTOR_MUTATIONS } from './api/doctor.mutations'

// Реальный каталог с бэкенда. Живёт рядом с моками: getDoctors()/DOCTOR_QUERIES
// выше по-прежнему обслуживают экраны SPA, которые ещё не переведены.
export { searchDoctors } from './api/search-doctors'
export { getDoctorProfile } from './api/get-doctor-profile'
export { loadDoctorCatalog } from './api/load-doctor-catalog'
export type { DoctorProfileResult } from './api/get-doctor-profile'
export type {
  DoctorAppointmentTypeView,
  DoctorListItem,
  DoctorProfileView,
  DoctorWorkplaceView,
} from './model/doctor-view'
export {
  buildLanguageOptions,
  buildSpecialtyOptions,
  specialtyKeyOf,
  toSearchIndexItem,
} from './model/search-index'
export type { FilterOption, SearchIndexItem } from './model/search-index'
export { formatExperienceLabel, formatPriceKgs } from './lib/doctor-display'
