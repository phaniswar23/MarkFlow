/**
 * MarkFlow Calculation Engine
 * Handles precise calculations for internal assessment scoring with various selection logic modes.
 * Unifies math rules under the proportional cross-multiplication sum-based system.
 */

/**
 * Normalizes number inputs safely
 */
export const safeNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

/**
 * Calculates results for a single subject using proportional sum-based averages
 * @param {Object} subject - The subject containing weightage, selectionLogic, assessments
 * @returns {Object} Calculated metrics
 */
export const calculateSubjectMarks = (subject) => {
  const { weightage = 0, selectionLogic = 'all', assessments = [] } = subject;
  const W = safeNumber(weightage);

  if (assessments.length === 0) {
    return {
      averageMarks: 0,
      averageTotal: 0,
      weightedMarks: 0,
      percentage: 0,
      selectedIds: [],
      selectionLabel: 'All CAs',
      formulaProps: { sumObtained: 0, sumTotal: 60, weightage: W, result: 0 }
    };
  }

  // Pre-process assessments to get their fraction score
  const processed = assessments.map((ass, index) => {
    const obtained = safeNumber(ass.obtainedMarks);
    const total = safeNumber(ass.totalMarks) || 30; // default total to 30 to avoid divide by zero
    const fraction = total > 0 ? (obtained / total) : 0;
    
    return {
      id: ass._id || ass.id || String(index),
      name: ass.name || `CA${index + 1}`,
      obtained,
      total,
      fraction,
      percentage: fraction * 100
    };
  });

  let selected = [...processed];
  let selectionLabel = 'All CAs';

  // Apply selection logic based on percentages/fractions (dynamically supports best_X_Y format)
  if (selectionLogic && selectionLogic.startsWith('best_')) {
    try {
      const parts = selectionLogic.split('_');
      const x = parseInt(parts[1]) || 2;
      const y = parseInt(parts[2]) || processed.length;
      
      const sorted = [...processed].sort((a, b) => b.fraction - a.fraction);
      const pool = sorted.slice(0, Math.min(y, processed.length));
      selected = pool.slice(0, Math.min(x, pool.length));
      selectionLabel = `Best ${x} of ${y}`;
    } catch (e) {
      console.error('Error parsing selection rules, falling back to all:', e);
      selected = [...processed];
      selectionLabel = 'All CAs';
    }
  } else {
    selected = [...processed];
    selectionLabel = 'All CAs';
  }

  // Calculate sum of obtained and sum of totals for the selected CAs
  const sumObtained = selected.reduce((sum, item) => sum + item.obtained, 0);
  const sumTotal = selected.reduce((sum, item) => sum + item.total, 0) || 30; // default to avoid divide by zero

  // Weighted Marks using the proportional rule: (sumObtained / sumTotal) * Weightage
  const weightedMarks = (sumObtained / sumTotal) * W;
  const percentage = (sumObtained / sumTotal) * 100;

  // Round values carefully
  const roundedPercentage = Math.min(100, Math.max(0, Math.round(percentage * 100) / 100));
  const roundedWeighted = Math.min(W, Math.max(0, Math.round(weightedMarks * 100) / 100));
  const avgObtained = sumObtained / (selected.length || 1);
  const avgTotal = sumTotal / (selected.length || 1);

  return {
    averageMarks: Math.round(avgObtained * 100) / 100,
    averageTotal: Math.round(avgTotal * 100) / 100,
    weightedMarks: roundedWeighted,
    percentage: roundedPercentage,
    selectedIds: selected.map(s => s.id),
    selectionLabel,
    formulaProps: {
      sumObtained: Math.round(sumObtained * 100) / 100,
      sumTotal: Math.round(sumTotal * 100) / 100,
      weightage: W,
      result: roundedWeighted
    }
  };
};

/**
 * Validates obtained marks against total marks
 */
export const validateMarks = (obtained, total) => {
  const obt = parseFloat(obtained);
  const tot = parseFloat(total);
  if (isNaN(obt)) return { valid: false, error: 'Enter a valid number' };
  if (obt < 0) return { valid: false, error: 'Cannot be negative' };
  if (!isNaN(tot) && obt > tot) return { valid: false, error: `Max marks is ${tot}` };
  return { valid: true, error: null };
};
