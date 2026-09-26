import axios from 'axios';

// Pointing directly to the FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

export const assessRisk = async (borrowerData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/predict`, borrowerData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        // Handle FastAPI 422 validation errors
        throw new Error(`Validation Error: ${detail.map(d => d.msg).join(', ')}`);
      }
      throw new Error(detail || 'Failed to assess risk.');
    }
    throw new Error('Unable to assess risk. Please check your information and try again.');
  }
};
