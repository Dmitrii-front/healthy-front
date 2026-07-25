export type { Doctor, Review } from './model/types'
export { DoctorSchema, ReviewSchema } from './model/schema'
export { DOCTOR_QUERIES } from './api/doctor.queries'
export { DOCTOR_MUTATIONS } from './api/doctor.mutations'

// Реальный каталог с бэкенда. Живёт рядом с моками: getDoctors()/DOCTOR_QUERIES
// выше по-прежнему обслуживают экраны SPA, которые ещё не переведены.
export { searchDoctors } from './api/search-doctors'
export { getDoctorProfile } from './api/get-doctor-profile'
export type { DoctorListItem, DoctorProfileView, DoctorWorkplaceView } from './model/doctor-view'
export { formatPriceKgs } from './lib/doctor-display'
