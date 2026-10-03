
import api from './axios';

export const getAlerts = () => api.get('/dashboard/alerts');
export const markAlertRead = (alertId) => api.put(`/dashboard/alerts/${alertId}/read`);
