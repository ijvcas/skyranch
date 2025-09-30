
export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatCostPerSqm = (cost: number): string => {
  if (cost === 0) return '0 €';
  if (cost < 1) {
    // For values less than 1, show more decimal places
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(cost);
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cost);
};
