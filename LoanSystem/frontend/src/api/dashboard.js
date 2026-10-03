
import api from './axios';

export const getSummary = () => api.get('/dashboard/summary');
export const getLoans = () => api.get('/dashboard/loans');
export const getLoanHistory = (loanId) => api.get(`/dashboard/loans/${loanId}/history`);
export const getLoanDetails = (loanId) => api.get(`/dashboard/loans/${loanId}`); // Assuming this exists or we filter from loans
