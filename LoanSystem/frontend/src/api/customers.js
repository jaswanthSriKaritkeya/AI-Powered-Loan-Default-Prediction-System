
import api from './axios';

export const fetchPan = (pan) => api.post(`/customers/fetch-pan?pan=${pan}`);
export const assessByPan = (pan, data) => api.post(`/customers/assess-by-pan?pan=${pan}`, data);
export const getCustomers = () => api.get('/dashboard/customers').catch(() => ({ data: [] })); // fallback
