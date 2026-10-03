
import api from './axios';

export const createLoan = (data) => api.post('/loans/', data);
export const approveLoan = (loanId) => api.put(`/loans/${loanId}/approve`);
export const testMonitorLoan = (loanId) => api.post(`/loans/${loanId}/test-monitor`);
