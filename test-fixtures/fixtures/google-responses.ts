export const mockGoogleOrgUnit = {
  orgUnitId: 'ou-123',
  orgUnitPath: '/Automation',
  name: 'Automation',
  description: 'Automation OU',
  parentOrgUnitId: '/',
  parentOrgUnitPath: '/',
};

export const mockGoogleUser = {
  id: 'user-123',
  primaryEmail: 'azuread-provisioning@example.com',
  name: {
    givenName: 'Microsoft Entra ID',
    familyName: 'Provisioning',
  },
  orgUnitPath: '/Automation',
  isAdmin: false,
  suspended: false,
};

export const mockSamlProfile = {
  name: 'inboundSamlSsoProfiles/12345',
  displayName: 'Azure AD SSO',
  customer: 'customers/C12345',
  spConfig: {
    entityId: 'google.com/a/example.com/12345',
    assertionConsumerServiceUri: 'https://www.google.com/a/example.com/acs',
  },
};
