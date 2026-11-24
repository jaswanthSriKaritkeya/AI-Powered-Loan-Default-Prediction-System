import api from './axios';

export const uploadExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/excel/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getExcelImports = () => {
    return api.get('/excel/imports');
};

export const getExcelDashboard = (importId) => {
    return api.get(`/excel/${importId}/dashboard`);
};

export const getExcelRecords = (importId, params) => {
    return api.get(`/excel/${importId}/records`, { params });
};

export const getExcelRecord = (recordId) => {
    return api.get(`/excel/record/${recordId}`);
};

export const addExcelRecordToLoanList = (recordId) => {
    return api.post(`/excel/record/${recordId}/add-to-loan-list`);
};

export const getExcelRiskDistribution = (importId, riskBucketName) => {
    return api.get(`/excel/${importId}/risk/${riskBucketName}`);
};

export const deleteExcelImport = (importId) => {
    return api.delete(`/excel/${importId}`);
};
