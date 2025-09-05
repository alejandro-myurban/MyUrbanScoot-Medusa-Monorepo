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
  const { t } = useTranslation() // Eliminamos el namespace específico

  const sortOptions = [
    {
      value: 'created_at',
      label: t('SortProducts.latestArrivals'),
    },
    {
      value: 'price_asc',
      label: t('SortProducts.lowestPrice'),
    },
    {
      value: 'price_desc',
      label: t('SortProducts.highestPrice'),
    },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams('sortBy', value)
  }

  return (
    <FilterRadioGroup
      title={t('SortProducts.filterBy')}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
