
export class SeasonalBreedingAnalyzer {
  
  static analyzeSeasonalTrends(monthlyData: Array<{month: string, breedings: number, pregnancies: number}>): {
    bestMonths: string[];
    worstMonths: string[];
    recommendations: string[];
  } {
    // Define optimal breeding months based on species knowledge
    const optimalMonths = ['marzo', 'abril', 'mayo'];
    const recommendations = [];

    // Check if we have sufficient data to make data-driven recommendations
    const totalBreedings = monthlyData.reduce((sum, m) => sum + m.breedings, 0);
    const hasReliableData = totalBreedings >= 10; // Minimum threshold for reliable analysis

    if (hasReliableData) {
      // Sort months by pregnancy success rate
      const monthsWithRates = monthlyData
        .filter(m => m.breedings > 0)
        .map(m => ({
          month: m.month,
          rate: m.pregnancies / m.breedings
        }))
        .sort((a, b) => b.rate - a.rate);

      const bestMonths = monthsWithRates.slice(0, 2).map(m => m.month);
      const worstMonths = monthsWithRates.slice(-2).map(m => m.month);

      // Only add data-driven recommendations if they don't conflict with seasonal knowledge
      const validBestMonths = bestMonths.filter(month => 
        !optimalMonths.some(optimal => 
          worstMonths.includes(optimal) && optimal === month
        )
      );

      if (validBestMonths.length > 0) {
        recommendations.push(`Según tus datos: mejor rendimiento en ${validBestMonths.join(', ')}`);
      }

      // Only mention months to avoid if they're not in the optimal season
      const problematicMonths = worstMonths.filter(month => !optimalMonths.includes(month));
      if (problematicMonths.length > 0) {
        recommendations.push(`Según tus datos: menor éxito en ${problematicMonths.join(', ')}`);
      }

      return {
        bestMonths: validBestMonths,
        worstMonths: problematicMonths,
        recommendations: [
          ...recommendations,
          'Para burros: la primavera (marzo-mayo) es óptima para apareamientos',
          'Gestación de 12-14 meses: planificar nacimientos para primavera siguiente'
        ]
      };
    } else {
      // Insufficient data - provide species-based recommendations only
      return {
        bestMonths: optimalMonths,
        worstMonths: [],
        recommendations: [
          'Para burros: la primavera (marzo-mayo) es óptima para apareamientos',
          'Gestación de 12-14 meses: planificar nacimientos para primavera siguiente',
          'Recomendación: registra más apareamientos para análisis personalizado'
        ]
      };
    }
  }
}
