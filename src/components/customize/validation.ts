export function validateUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'URL harus menggunakan http atau https';
    }
    return null;
  } catch {
    return 'Format URL tidak valid';
  }
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const clean = value.replace(/[\s-]/g, '');
  const indonesianMobile = /^(\+62|62|0)8[1-9]\d{7,10}$/;
  const indonesianLandline = /^(\+62|62|0)(21|22|231|241|251|261|271|281|31|341|361|381|411|431|451|471|511|521|531|541|551|561|571|581|61|621|631|641|651|661|671|681|691|711|721|731|741|751|761|771|781|791|81|82|83|84|85|86|87|88|89|911|921|931|941|951|961|971|981)\d{6,8}$/;
  if (!indonesianMobile.test(clean) && !indonesianLandline.test(clean)) {
    return 'Format nomor telepon Indonesia tidak valid (contoh: 0812-3456-7890, 021-1234567, +6281234567890)';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Format email tidak valid';
  }
  return null;
}

export function validateWhatsApp(value: string): string | null {
  if (!value.trim()) return null;
  const clean = value.replace(/[\s-]/g, '');
  const whatsappRegex = /^628[1-9]\d{8,11}$/;
  if (!whatsappRegex.test(clean)) {
    return 'Format WhatsApp tidak valid. Gunakan format internasional tanpa + (contoh: 6281234567890)';
  }
  return null;
}

export function validateRequired(value: string, fieldName: string, minLength = 2): string | null {
  if (!value.trim()) {
    return `${fieldName} wajib diisi`;
  }
  if (value.trim().length < minLength) {
    return `${fieldName} minimal ${minLength} karakter`;
  }
  return null;
}

export function validateMaxLength(value: string, fieldName: string, maxLength: number): string | null {
  if (value.length > maxLength) {
    return `${fieldName} maksimal ${maxLength} karakter`;
  }
  return null;
}

export interface GeneralTabData {
  logoUrl: string;
  faviconUrl: string;
  siteTitle: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  showWhatsApp: boolean;
  socialLinks: Record<string, string>;
}

export interface ValidationResult {
  errors: Record<string, string>;
  valid: boolean;
}

export function validateGeneralTab(data: GeneralTabData): ValidationResult {
  const errors: Record<string, string> = {};

  // Brand Identity
  const logoError = validateUrl(data.logoUrl);
  if (logoError) errors.logoUrl = logoError;

  const faviconError = validateUrl(data.faviconUrl);
  if (faviconError) errors.faviconUrl = faviconError;

  const siteTitleError = validateRequired(data.siteTitle, 'Nama Brand / Toko', 2);
  if (!siteTitleError) {
    const maxError = validateMaxLength(data.siteTitle, 'Nama Brand / Toko', 100);
    if (maxError) errors.siteTitle = maxError;
  } else {
    errors.siteTitle = siteTitleError;
  }

  const taglineError = validateMaxLength(data.tagline, 'Tagline', 200);
  if (taglineError) errors.tagline = taglineError;

  // Contact Info
  const addressError = validateRequired(data.address, 'Alamat Lengkap', 5);
  if (addressError) errors.address = addressError;

  const phoneError = validatePhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const whatsappError = validateWhatsApp(data.whatsapp);
  if (whatsappError) errors.whatsapp = whatsappError;

  // Social Media - accept either URL or handle (@username)
  function validateSocial(value: string | undefined, platform: string, handleRegex: RegExp, allowUrl = true): string | null {
    if (!value?.trim()) return null;
    const urlError = allowUrl ? validateUrl(value) : 'URL not allowed';
    if (!urlError) return null; // Valid URL
    // Not a valid URL, check handle format
    if (!handleRegex.test(value)) {
      return `Format ${platform} tidak valid (username @xxx atau URL${allowUrl ? '' : ' tidak diizinkan'})`;
    }
    return null;
  }

  const instagramError = validateSocial(data.socialLinks.instagram, 'Instagram', /^@?[a-zA-Z0-9_.]+$/);
  if (instagramError) errors['social.instagram'] = instagramError;

  const facebookError = validateSocial(data.socialLinks.facebook, 'Facebook', /^@?[a-zA-Z0-9_.]+$/);
  if (facebookError) errors['social.facebook'] = facebookError;

  const tiktokError = validateSocial(data.socialLinks.tiktok, 'TikTok', /^@?[a-zA-Z0-9_.]+$/);
  if (tiktokError) errors['social.tiktok'] = tiktokError;

  const twitterError = validateSocial(data.socialLinks.twitter, 'X/Twitter', /^@?[a-zA-Z0-9_]+$/);
  if (twitterError) errors['social.twitter'] = twitterError;

  const youtubeError = validateSocial(data.socialLinks.youtube, 'YouTube', /^@?[a-zA-Z0-9_.-]+$/);
  if (youtubeError) errors['social.youtube'] = youtubeError;

  const linkedinError = validateSocial(data.socialLinks.linkedin, 'LinkedIn', /^@?[a-zA-Z0-9_-]+$/);
  if (linkedinError) errors['social.linkedin'] = linkedinError;

  return { errors, valid: Object.keys(errors).length === 0 };
}