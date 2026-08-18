import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_v2_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthAPI = {
  login: (data) => api.post('/core/login/', data),
  syncPermissions: (data) => api.post('/core/sync-permissions/', data),
};

export const CoreAPI = {
  globalSearch: (query, limit = 30) => api.get('/core/global-search/', { params: { q: query, limit } }),
  getCompanies: () => api.get('/core/companies/'),
  createCompany: (data) => api.post('/core/companies/', data),
  updateCompany: (id, data) => api.patch(`/core/companies/${id}/`, data),
  deleteCompany: (id) => api.delete(`/core/companies/${id}/`),

  getPlants: () => api.get('/core/plants/'),
  createPlant: (data) => api.post('/core/plants/', data),
  updatePlant: (id, data) => api.patch(`/core/plants/${id}/`, data),
  deletePlant: (id) => api.delete(`/core/plants/${id}/`),

  getDepartments: () => api.get('/core/departments/'),
  createDepartment: (data) => api.post('/core/departments/', data),
  updateDepartment: (id, data) => api.patch(`/core/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`/core/departments/${id}/`),

  getDesignations: () => api.get('/core/designations/'),
  createDesignation: (data) => api.post('/core/designations/', data),
  updateDesignation: (id, data) => api.patch(`/core/designations/${id}/`, data),
  deleteDesignation: (id) => api.delete(`/core/designations/${id}/`),
  
  getEmployees: () => api.get('/core/employees/'),
  createEmployee: (data) => api.post('/core/employees/', data),
  updateEmployee: (id, data) => api.patch(`/core/employees/${id}/`, data),
  deleteEmployee: (id) => api.delete(`/core/employees/${id}/`),

  getPermissions: (params) => api.get('/core/permissions/', { params }),
  createPermission: (data) => api.post('/core/permissions/', data),
  updatePermission: (id, data) => api.patch(`/core/permissions/${id}/`, data),
  deletePermission: (id) => api.delete(`/core/permissions/${id}/`),

  getRoles: () => api.get('/core/roles/'),
  createRole: (data) => api.post('/core/roles/', data),
  updateRole: (id, data) => api.patch(`/core/roles/${id}/`, data),
  deleteRole: (id) => api.delete(`/core/roles/${id}/`),

  getEmployeeRoles: (params) => api.get('/core/employee-roles/', { params }),
  createEmployeeRole: (data) => api.post('/core/employee-roles/', data),
  deleteEmployeeRole: (id) => api.delete(`/core/employee-roles/${id}/`),

  getVendors: () => api.get('/core/vendors/'),
  createVendor: (data) => api.post('/core/vendors/', data),
  updateVendor: (id, data) => api.patch(`/core/vendors/${id}/`, data),
  deleteVendor: (id) => api.delete(`/core/vendors/${id}/`),

  getMachines: () => api.get('/core/machines/'),
  createMachine: (data) => api.post('/core/machines/', data),
  updateMachine: (id, data) => api.patch(`/core/machines/${id}/`, data),
  deleteMachine: (id) => api.delete(`/core/machines/${id}/`),

  getStorageLocations: () => api.get('/core/storage-locations/'),
  createStorageLocation: (data) => api.post('/core/storage-locations/', data),
  updateStorageLocation: (id, data) => api.patch(`/core/storage-locations/${id}/`, data),
  deleteStorageLocation: (id) => api.delete(`/core/storage-locations/${id}/`),
  getStorageBlocks: () => api.get('/core/storage-blocks/'),
  createStorageBlock: (data) => api.post('/core/storage-blocks/', data),
};

export const MastersAPI = {
  getCategories: () => api.get('/masters/categories/'),
  createCategory: (data) => api.post('/masters/categories/', data),

  getItems: (params) => api.get('/masters/items/', { params }),
  createItem: (data) => api.post('/masters/items/', data),
  updateItem: (id, data) => api.patch(`/masters/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/masters/items/${id}/`),

  getVersions: (params) => api.get('/masters/versions/', { params }),
  createVersion: (data) => api.post('/masters/versions/', data),
  updateVersion: (id, data) => api.patch(`/masters/versions/${id}/`, data),

  getAttributes: (params) => api.get('/masters/attributes/', { params }),
  createAttribute: (data) => api.post('/masters/attributes/', data),

  getInstances: (params) => api.get('/masters/instances/', { params }),
  createInstance: (data) => api.post('/masters/instances/', data),

  getAttributeValues: (params) => api.get('/masters/attribute-values/', { params }),
};

export const ProcessEngineAPI = {
  getProcessTypes: () => api.get('/process/types/'),
  createProcessType: (data) => api.post('/process/types/', data),
  updateProcessType: (id, data) => api.patch(`/process/types/${id}/`, data),

  getAttributeDefinitions: (params) => api.get('/process/definitions/', { params }),
  createAttributeDefinition: (data) => api.post('/process/definitions/', data),

  getInstances: (params) => api.get('/process/instances/', { params }),
  createInstance: (data) => api.post('/process/instances/', data),
  updateInstance: (id, data) => api.patch(`/process/instances/${id}/`, data),
  deleteInstance: (id) => api.delete(`/process/instances/${id}/`),

  getValues: (params) => api.get('/process/values/', { params }),
  getVerifications: (params) => api.get('/process/verifications/', { params }),
  createVerification: (data) => api.post('/process/verifications/', data),
};

export const WorkflowAPI = {
  getProposals: () => api.get('/workflow/proposals/'),
  createProposal: (data) => api.post('/workflow/proposals/', data),
  updateProposal: (id, data) => api.patch(`/workflow/proposals/${id}/`, data),
  getQuotations: (params) => api.get('/workflow/quotations/', { params }),
  createQuotation: (data) => api.post('/workflow/quotations/', data),
  getAmendments: (params) => api.get('/workflow/amendments/', { params }),
  createAmendment: (data) => api.post('/workflow/amendments/', data),
  getApprovalSteps: (params) => api.get('/workflow/steps/', { params }),
  updateApprovalStep: (id, data) => api.patch(`/workflow/steps/${id}/`, data),
};

export const JournalAPI = {
  getEntries: () => api.get('/journal/entries/'),
  createEntry: (data) => api.post('/journal/entries/', data),
  updateEntry: (id, data) => api.patch(`/journal/entries/${id}/`, data),
  deleteEntry: (id) => api.delete(`/journal/entries/${id}/`),
  getStocks: () => api.get('/journal/stocks/'),
  createStock: (data) => api.post('/journal/stocks/', data),
};

export const NotificationAPI = {
  getNotifications: (params) => api.get('/notifications/system-notifications/', { params }),
  createNotification: (data) => api.post('/notifications/system-notifications/', data),
  markRead: (id) => api.patch(`/notifications/system-notifications/${id}/mark-read/`),
  markAllRead: () => api.post('/notifications/system-notifications/mark-all-read/'),
};
