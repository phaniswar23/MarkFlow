import { calculateSubjectMarks } from './calcEngine';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Generates and downloads an Excel-compatible CSV sheet of semester subjects and metrics.
 * @param {Array} subjects - The active list of MERN/Local Storage subjects
 * @param {Object} semesterStats - Pre-calculated overall GPA, total weightage, and percentage
 */
export const exportToCSV = (subjects, semesterStats = {}) => {
  if (!subjects || subjects.length === 0) return;

  const headers = [
    'Subject Code',
    'Subject Name',
    'Weightage',
    'Selection Logic',
    'Continuous Assessment (CA) Scores',
    'Weighted Score (Estimated)',
    'Obtained Percentage',
    'Academic Standing',
    'Last Updated'
  ];

  const rows = subjects.map(sub => {
    const metrics = calculateSubjectMarks(sub);
    const caDetails = sub.assessments
      .map(a => `${a.name}: ${a.obtainedMarks === '' ? 0 : a.obtainedMarks}/${a.totalMarks}`)
      .join(' | ');
    
    const standing = metrics.percentage >= 75 
      ? 'Excellent' 
      : metrics.percentage >= 40 
        ? 'Average' 
        : 'At Risk';

    const timestamp = sub.updatedAt 
      ? new Date(sub.updatedAt).toLocaleString() 
      : new Date().toLocaleString();

    return [
      sub.code,
      sub.name,
      sub.weightage,
      metrics.selectionLabel,
      caDetails,
      metrics.weightedMarks.toFixed(2),
      metrics.percentage.toFixed(2) + '%',
      standing,
      timestamp
    ];
  });

  // Prepare CSV contents
  const csvRows = [headers, ...rows];
  const csvContent = csvRows
    .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Trigger browser download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MarkFlow_Semester_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Constructs a premium, vector-sharp A4 semester report and auto-downloads it directly as a PDF file.
 * Operates fully offline using locally compiled jsPDF and html2canvas packages to bypass CDN blockings.
 * @param {Array} subjects - The active list of MERN/Local Storage subjects
 * @param {Object} overallStats - Semester averages, subjects count, and percentage
 */
export const exportToPDF = async (subjects, overallStats = {}) => {
  if (!subjects || subjects.length === 0) return;

  // 1. Create a styled container off-screen for perfect measurements and CSS calculation
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '-9999px';
  element.style.width = '800px';
  element.style.backgroundColor = '#ffffff';
  element.style.fontFamily = "'Inter', 'system-ui', 'sans-serif'";
  element.style.color = '#1e293b';
  element.style.padding = '40px';

  // Stats boxes
  const statsHtml = `
    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; background-color: #f8fafc; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.01);">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Total Modules</div>
        <div style="font-size: 24px; font-weight: 900; color: #334155; margin-top: 5px;">${subjects.length}</div>
      </div>
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; background-color: #f8fafc; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.01);">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Estimated CA Mark</div>
        <div style="font-size: 24px; font-weight: 900; color: #334155; margin-top: 5px;">${overallStats.totalWeightage || 0} <span style="font-size: 13px; color: #94a3b8; font-weight: 500;">/ ${overallStats.maxPossibleWeightage || 0}</span></div>
      </div>
      <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; background-color: #f8fafc; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.01);">
        <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Semester Average</div>
        <div style="font-size: 24px; font-weight: 900; color: #4f46e5; margin-top: 5px;">${(overallStats.overallPercentage || 0).toFixed(1)}%</div>
      </div>
    </div>
  `;

  // Render cards
  const cardsHtml = subjects.map(sub => {
    const metrics = calculateSubjectMarks(sub);
    const standing = metrics.percentage >= 75 
      ? { label: 'Excellent', color: '#10b981', bg: '#ecfdf5' } 
      : metrics.percentage >= 40 
        ? { label: 'Average', color: '#f59e0b', bg: '#fffbeb' } 
        : { label: 'At Risk', color: '#ef4444', bg: '#fef2f2' };

    const caListHtml = sub.assessments.map(a => `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #475569; padding: 8px 12px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 6px; border: 1px solid #f1f5f9;">
        <span style="font-weight: 500;">${a.name}</span>
        <strong style="color: #1e293b;">${a.obtainedMarks === '' ? 0 : a.obtainedMarks} / ${a.totalMarks}</strong>
      </div>
    `).join('');

    return `
      <div style="border: 1px solid #e2e8f0; border-left: 6px solid ${standing.color}; border-radius: 14px; padding: 20px; background-color: #ffffff; margin-bottom: 20px; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; tracking-tight: -0.2px;">${sub.name || 'Untitled Subject'}</h3>
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 3px; display: block; font-family: monospace; letter-spacing: 0.5px;">${sub.code}</span>
          </div>
          <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; background-color: ${standing.bg}; color: ${standing.color}; border: 1px solid ${standing.color}20; letter-spacing: 0.8px;">
            ${standing.label}
          </span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 8px 0; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Assessment Scores</h4>
          ${caListHtml}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 15px;">
          <div>
            <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Evaluation Rules</span>
            <div style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px;">${metrics.selectionLabel}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Internal Mark</span>
            <div style="font-size: 16px; font-weight: 900; color: #1e293b; margin-top: 2px;">
              ${metrics.weightedMarks.toFixed(2)} <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">/ ${sub.weightage}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  element.innerHTML = `
    <div style="padding: 10px; background-color: #ffffff;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; color: #4f46e5; margin: 0; letter-spacing: -0.8px;">MarkFlow</h1>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 4px; display: block; letter-spacing: 0.5px;">Semester Assessment Report</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Date Generated</span>
          <div style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 3px;">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <!-- Stats Grid -->
      ${statsHtml}

      <!-- Subject Listings Header -->
      <h2 style="font-size: 12px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Subject Enrolments & Grades</h2>

      <!-- Subjects container -->
      <div style="display: flex; flex-direction: column;">
        ${cardsHtml}
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 600; line-height: 1.6; letter-spacing: 0.2px;">
        Report compiled automatically by MarkFlow. Verified for accuracy based on the sum-proportional internal calculator.
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    // 2. Render to canvas using high scale for pixel-perfect clarity
    const canvas = await html2canvas(element, {
      scale: 2.2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Remaining pages
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Save direct to disk
    pdf.save(`MarkFlow_Semester_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Unable to generate PDF. Please try again.');
  } finally {
    document.body.removeChild(element);
  }
};

/**
 * Universal exporter that captures a DOM element by ID and downloads it as PNG or PDF.
 * @param {string} elementId - The ID of the HTML element to capture
 * @param {string} type - 'pdf' or 'png'
 * @param {string} filename - The output file name
 */
export const exportElement = async (elementId, type = 'pdf', filename = 'MarkFlow_Export') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    alert(`Could not find content to export! Please make sure calculation is done.`);
    return;
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2.2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    if (type === 'png') {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${filename}.png`;
      link.click();
    } else {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${filename}.pdf`);
    }
  } catch (err) {
    console.error('Export Error:', err);
    alert('Export failed. Please try again.');
  }
};
