// Add these methods to reportsAPI object in api.ts
getGSTSummary: (startDate: string, endDate: string) => 
  apiClient.get('/reports/gst-summary', { 
    params: { start_date: startDate, end_date: endDate }
  }),
downloadGSTCSV: (startDate: string, endDate: string) =>
  apiClient.get('/reports/gst-summary', {
    params: { start_date: startDate, end_date: endDate, format: 'csv' },
    responseType: 'blob'
  }),
downloadGSTExcel: (startDate: string, endDate: string) =>
  apiClient.get('/reports/gst-summary', {
    params: { start_date: startDate, end_date: endDate, format: 'excel' },
    responseType: 'blob'
  })
