import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCustomerByPAN = async (pan) => {
  try {
    const response = await api.get(`/pan/${pan}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Customer not found');
    }
    throw new Error('Unable to connect to PAN provider');
  }
};

export const updateCustomerByPAN = async (pan, data) => {
  try {
    const response = await api.put(`/pan/${pan}`, data);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update customer information');
  }
};
