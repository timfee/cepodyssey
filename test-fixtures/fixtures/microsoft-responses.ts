export const mockServicePrincipal = {
  id: 'sp-123',
  appId: 'app-123',
  displayName: 'Google Workspace User Provisioning',
  accountEnabled: true,
};

export const mockApplication = {
  id: 'app-obj-123',
  appId: 'app-123',
  displayName: 'Google Workspace User Provisioning',
  identifierUris: [],
  web: {
    redirectUris: [],
  },
};

export const mockSynchronizationJob = {
  id: 'job-123',
  templateId: 'GoogleApps',
  schedule: {
    state: 'Active',
  },
  status: {
    state: 'Active',
  },
};
