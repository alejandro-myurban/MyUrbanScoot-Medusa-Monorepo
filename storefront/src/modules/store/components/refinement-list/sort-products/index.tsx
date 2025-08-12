'use client'

import { useTranslation } from 'react-i18next'
import FilterRadioGroup from '@modules/common/components/filter-radio-group'

export type SortOptions = 'price_asc' | 'price_desc' | 'created_at'

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  'data-testid'?: string
}

const SortProducts = ({
  'data-testid': dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  // Inicializamos el hook de traducción con el namespace 'SortProducts'
  const { t } = useTranslation('SortProducts')

  const sortOptions = [
    {
      value: 'created_at',
      label: t('latestArrivals'),
    },
    {
      value: 'price_asc',
      label: t('lowestPrice'),
    },
    {
      value: 'price_desc',
      label: t('highestPrice'),
    },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams('sortBy', value)
  }

  return (
    <FilterRadioGroup
      title={t('filterBy')}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts