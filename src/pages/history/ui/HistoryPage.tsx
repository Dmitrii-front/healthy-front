import { useQuery } from '@tanstack/react-query'

import { MEDICAL_RECORD_QUERIES } from '@/entities/medical-record'
import { Icon } from '@/shared/ui/Icon'

import { formatDob, genderLabel } from '../lib/format'
import { RecordRow } from './RecordRow'
import { RecordSection } from './RecordSection'

export function HistoryPage() {
  const { data: rec, isPending } = useQuery(MEDICAL_RECORD_QUERIES.current())

  return (
    <div className='pb-[120px]'>
      <header className='px-5 pt-12 pb-3.5'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-graphite m-0 text-[26px] leading-[1.1] font-medium tracking-[-0.022em]'>
              Мед карта
            </h1>
            <p className='text-distant-graphite mt-1 text-[12.5px]'>
              Информация, которая помогает доктору
            </p>
          </div>
          <button
            type='button'
            className='rounded-pill border-hairline bg-card-white text-soft-graphite inline-flex items-center gap-1.5 border px-3 py-1.5 text-[12.5px] font-medium'
          >
            <Icon name='settings' size={13} stroke={1.7} />
            Изменить
          </button>
        </div>
      </header>

      <div className='px-4'>
        {isPending || !rec ? (
          <p className='text-distant-graphite text-[14px]'>Загрузка…</p>
        ) : (
          <>
            <RecordSection title='Личные данные'>
              <RecordRow label='Имя' value={rec.firstName} />
              <RecordRow label='Фамилия' value={rec.lastName} />
              <RecordRow label='Отчество' value={rec.middleName} />
              <RecordRow label='Пол' value={genderLabel(rec.gender)} />
              <RecordRow label='Дата рождения' value={formatDob(rec.dob)} last />
            </RecordSection>

            <RecordSection title='Контакты'>
              <RecordRow label='Телефон' value={rec.phone} />
              <RecordRow label='Email' value={rec.email} />
              <RecordRow label='Страна' value={rec.country} />
              <RecordRow label='Город' value={rec.city} />
              <RecordRow label='Регион' value={rec.region} />
              <RecordRow label='Район' value={rec.district} />
              <RecordRow label='Адрес' value={rec.address} multiline last />
            </RecordSection>

            <RecordSection title='Экстренный контакт'>
              <RecordRow label='Контактное лицо' value={rec.emergencyContactName} />
              <RecordRow label='Телефон' value={rec.emergencyContactPhone} last />
            </RecordSection>

            <RecordSection title='Медицинский анамнез'>
              <RecordRow label='Группа крови' value={rec.bloodGroup} />
              <RecordRow label='Резус-фактор' value={rec.rhFactor} />
              <RecordRow label='Аллергии' value={rec.allergies} multiline />
              <RecordRow label='Хронические' value={rec.chronicConditions} multiline />
              <RecordRow label='Препараты' value={rec.currentMedications} multiline />
              <RecordRow label='Операции' value={rec.pastSurgeries} multiline />
              <RecordRow label='Семейный анамнез' value={rec.familyHistory} multiline />
              <RecordRow label='Вакцинация' value={rec.vaccinationStatus} multiline last />
            </RecordSection>

            <RecordSection title='Образ жизни'>
              <RecordRow label='Курение' value={rec.smokingStatus} />
              <RecordRow label='Алкоголь' value={rec.alcoholUse} />
              <RecordRow label='Физ. активность' value={rec.physicalActivityLevel} />
              <RecordRow label='Питание' value={rec.dietType} multiline last />
            </RecordSection>

            <RecordSection title='Социальный анамнез'>
              <RecordRow label='Профессия' value={rec.occupation} />
              <RecordRow label='Место работы' value={rec.workplace} />
              <RecordRow label='Условия труда' value={rec.workConditions} multiline />
              <RecordRow label='Условия проживания' value={rec.livingConditions} multiline last />
            </RecordSection>

            <RecordSection title='Эпидемиология' last>
              <RecordRow label='Поездки за 6 мес' value={rec.travelHistory} multiline />
              <RecordRow
                label='Домашние животные'
                value={
                  rec.petsAtHome === null || rec.petsAtHome === undefined
                    ? null
                    : rec.petsAtHome
                      ? 'Да'
                      : 'Нет'
                }
              />
              <RecordRow label='Контакт' value={rec.animalContactDetails} last />
            </RecordSection>
          </>
        )}
      </div>
    </div>
  )
}
