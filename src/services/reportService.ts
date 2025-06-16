
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Lead } from '../hooks/useOptimizedLeads';
import { AnalyticsSnapshot } from '../hooks/useAnalytics';

export interface ReportConfig {
  type: 'leads' | 'analytics' | 'financial' | 'performance';
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: {
    status?: string[];
    countries?: string[];
    agents?: string[];
  };
  includeCharts?: boolean;
  customFields?: string[];
}

export interface ReportData {
  leads?: Lead[];
  analytics?: AnalyticsSnapshot[];
  summary?: {
    totalLeads: number;
    convertedLeads: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

class ReportService {
  generatePDFReport(config: ReportConfig, data: ReportData): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text(`${config.type.toUpperCase()} Report`, 20, 20);
      
      // Date range
      doc.setFontSize(12);
      doc.text(
        `Period: ${config.dateRange.from.toLocaleDateString()} - ${config.dateRange.to.toLocaleDateString()}`,
        20,
        35
      );
      
      let yPosition = 50;
      
      // Summary section
      if (data.summary) {
        doc.setFontSize(16);
        doc.text('Summary', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.text(`Total Leads: ${data.summary.totalLeads}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Converted Leads: ${data.summary.convertedLeads}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Revenue: $${data.summary.totalRevenue.toLocaleString()}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Conversion Rate: ${data.summary.conversionRate.toFixed(2)}%`, 20, yPosition);
        yPosition += 15;
      }
      
      // Leads table
      if (data.leads && data.leads.length > 0) {
        const tableData = data.leads.map(lead => [
          lead.first_name + ' ' + lead.last_name,
          lead.email,
          lead.country,
          lead.status,
          `$${lead.balance}`,
          lead.created_at.split('T')[0]
        ]);
        
        autoTable(doc, {
          head: [['Name', 'Email', 'Country', 'Status', 'Balance', 'Created']],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        });
      }
      
      // Generate blob
      const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' });
      resolve(pdfBlob);
    });
  }
  
  generateExcelReport(config: ReportConfig, data: ReportData): Promise<Blob> {
    return new Promise((resolve) => {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      if (data.summary) {
        const summaryData = [
          ['Metric', 'Value'],
          ['Total Leads', data.summary.totalLeads],
          ['Converted Leads', data.summary.convertedLeads],
          ['Total Revenue', data.summary.totalRevenue],
          ['Conversion Rate', `${data.summary.conversionRate.toFixed(2)}%`]
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }
      
      // Leads sheet
      if (data.leads && data.leads.length > 0) {
        const leadsData = data.leads.map(lead => ({
          'First Name': lead.first_name,
          'Last Name': lead.last_name,
          'Email': lead.email,
          'Phone': lead.phone || '',
          'Country': lead.country,
          'Status': lead.status,
          'Balance': lead.balance,
          'Bonus Amount': lead.bonus_amount,
          'KYC Status': lead.kyc_status,
          'Created At': lead.created_at,
          'Updated At': lead.updated_at
        }));
        
        const leadsSheet = XLSX.utils.json_to_sheet(leadsData);
        XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Leads');
      }
      
      // Analytics sheet
      if (data.analytics && data.analytics.length > 0) {
        const analyticsData = data.analytics.map(snapshot => ({
          'Date': snapshot.snapshot_date,
          'Total Leads': snapshot.total_leads,
          'New Leads': snapshot.new_leads_today,
          'Active Leads': snapshot.active_leads,
          'Converted Leads': snapshot.converted_leads,
          'Total Deposits': snapshot.total_deposits,
          'Average Deposit': snapshot.average_deposit,
          'Conversion Rate': snapshot.conversion_rate
        }));
        
        const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
      }
      
      // Generate blob
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      resolve(excelBlob);
    });
  }
  
  downloadReport(blob: Blob, filename: string, format: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const reportService = new ReportService();
