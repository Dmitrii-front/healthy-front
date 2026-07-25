import {
  avatarColorFor,
  buildFullName,
  buildInitials,
  buildShortName,
  formatLanguages,
  normalizeSpecialization,
  yearsSince,
} from '../lib/doctor-display'
import type { DoctorProfileDto, DoctorSearchItemDto } from './doctor-api.schema'

/**
 * Отдельный тип, а не существующий Doctor из model/types.ts: у того обязательные
 * clinic, color и initials, которых в выдаче поиска нет — пришлось бы выдумывать
 * клинику. Doctor остаётся мок-типом для экранов SPA.
 */
export interface DoctorListItem {
  id: string
  shortName: string
  fullName: string
  initials: string
  avatarColor: string
  specialization: string
  city: string | null
  priceFrom: number | null
  languages: string[]
  avatarUrl: string | null
}

export interface DoctorWorkplaceView {
  id: string
  name: string
  address: string
  description: string | null
  coordinates: { lat: number; lng: number } | null
  mapImageUrl: string | null
}

export interface DoctorAppointmentTypeView {
  id: string
  name: string
  durationMin: number
  workPlaceId: string
}

export interface DoctorProfileView extends DoctorListItem {
  bio: string | null
  education: string | null
  scheduleNote: string | null
  subspecializations: string[]
  yearsExperience: number | null
  rating: number | null
  reviewsCount: number
  consultationFormats: string[]
  workplaces: DoctorWorkplaceView[]
  appointmentTypes: DoctorAppointmentTypeView[]
}

export function toDoctorListItem(dto: DoctorSearchItemDto): DoctorListItem {
  return {
    id: dto.id,
    shortName: buildShortName(dto.last_name, dto.first_name),
    fullName: buildFullName(dto.last_name, dto.first_name, dto.middle_name),
    initials: buildInitials(dto.last_name, dto.first_name),
    avatarColor: avatarColorFor(dto.id),
    specialization: normalizeSpecialization(dto.specialization),
    city: dto.primary_work_city,
    priceFrom: dto.price_from,
    languages: formatLanguages(dto.languages ?? []),
    avatarUrl: dto.avatar_url,
  }
}

export function toDoctorProfileView(dto: DoctorProfileDto): DoctorProfileView {
  return {
    ...toDoctorListItem(dto),
    bio: dto.bio,
    education: dto.education,
    scheduleNote: dto.schedule_note,
    subspecializations: dto.subspecializations ?? [],
    yearsExperience: yearsSince(dto.start_practise_date),
    rating: dto.rating,
    reviewsCount: dto.reviews_count,
    consultationFormats: dto.consultation_formats ?? [],
    workplaces: dto.workplaces.map((workplace) => ({
      id: workplace.id,
      name: workplace.name,
      address: workplace.address,
      description: workplace.description,
      coordinates: workplace.coordinates,
      mapImageUrl: workplace.map_image_url,
    })),
    appointmentTypes: dto.appointment_types.map((type) => ({
      id: type.id,
      name: type.name,
      durationMin: type.duration_min,
      workPlaceId: type.work_place_id,
    })),
  }
}
