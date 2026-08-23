export const ORGANIZATION_TYPE_VALUES = [
  'ngo',
  'community_organization',
  'forest_rights_committee',
  'other',
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const ALLOWED_DOCUMENT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function validateEmail(email, labelKey = 'validation.labels.email') {
  if (!email.trim()) return { key: 'validation.emailRequired', params: { label: labelKey } };
  if (!EMAIL_PATTERN.test(email.trim())) return { key: 'validation.emailInvalid' };
  return null;
}

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return { key: 'validation.phoneRequired' };
  if (!PHONE_PATTERN.test(digits)) return { key: 'validation.phoneInvalid' };
  return null;
}

export function validateDocument(file, labelKey) {
  if (!file) return { key: 'validation.documentRequired', params: { label: labelKey } };
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { key: 'validation.documentType', params: { label: labelKey } };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { key: 'validation.documentSize', params: { label: labelKey } };
  }
  return null;
}

export function validateRegistrationForm(form) {
  const errors = {};

  if (!form.organizationName.trim()) {
    errors.organizationName = 'validation.organizationNameRequired';
  }

  if (!form.organizationType) {
    errors.organizationType = 'validation.organizationTypeRequired';
  }

  if (!form.registrationNumber.trim()) {
    errors.registrationNumber = 'validation.registrationNumberRequired';
  }

  const emailError = validateEmail(form.email, 'validation.labels.officialEmail');
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(form.phone);
  if (phoneError) errors.phone = phoneError;

  if (!form.state) errors.state = 'validation.stateRequired';
  if (!form.district.trim()) errors.district = 'validation.districtRequired';
  if (!form.address.trim()) errors.address = 'validation.addressRequired';
  if (!form.contactPersonName.trim()) errors.contactPersonName = 'validation.contactPersonRequired';

  const certError = validateDocument(
    form.registrationCertificate,
    'validation.labels.registrationCertificate'
  );
  if (certError) errors.registrationCertificate = certError;

  const authError = validateDocument(
    form.authorizationDocument,
    'validation.labels.authorizationDocument'
  );
  if (authError) errors.authorizationDocument = authError;

  if (!form.password) {
    errors.password = 'validation.passwordRequired';
  } else if (form.password.length < 8) {
    errors.password = 'validation.passwordMinLength';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'validation.confirmPasswordRequired';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'validation.passwordsMismatch';
  }

  return errors;
}

export function validateIndividualRegistrationForm(form) {
  const errors = {};

  if (!form.fullName.trim()) errors.fullName = 'validation.fullNameRequired';

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhone(form.phone);
  if (phoneError) errors.phone = phoneError;

  if (!form.state) errors.state = 'validation.stateRequired';
  if (!form.district.trim()) errors.district = 'validation.districtRequired';
  if (!form.village.trim()) errors.village = 'validation.villageRequired';

  if (!form.password) {
    errors.password = 'validation.passwordRequired';
  } else if (form.password.length < 8) {
    errors.password = 'validation.passwordMinLength';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'validation.confirmPasswordRequired';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'validation.passwordsMismatch';
  }

  return errors;
}

/** @deprecated Use ORGANIZATION_TYPE_VALUES with i18n labels in components */
export const ORGANIZATION_TYPES = ORGANIZATION_TYPE_VALUES.map((value) => ({
  value,
  label: value,
}));
