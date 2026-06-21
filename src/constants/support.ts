import Constants from 'expo-constants';

type PublicExtra = {
  termsUrl?: string;
  privacyUrl?: string;
  clientForgotPasswordUrl?: string;
  accountDeletionUrl?: string;
};

type SupportFaqItem = {
  question: string;
  answer: string;
};

type SupportLegalDocument = {
  title: string;
  subtitle: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  url?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;

const resolveOptionalUrl = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized || undefined;
};

export const supportEmail = 'fitpilot-team.fit@outlook.com';
export const supportWhatsApp = '+528719708890';
export const supportWhatsAppE164 = '528719708890';
export const supportWhatsAppDefaultMessage =
  'Hola, necesito ayuda con mi cuenta de FitPilot.';
export const clientForgotPasswordUrl = resolveOptionalUrl(
  process.env.EXPO_PUBLIC_CLIENT_FORGOT_PASSWORD_URL ||
    extra.clientForgotPasswordUrl,
);
export const accountDeletionUrl = resolveOptionalUrl(
  process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL ||
    extra.accountDeletionUrl ||
    'https://app.fitpilot.fit/account-deletion',
);

export const supportFaqItems: SupportFaqItem[] = [
  {
    question: 'No puedo iniciar sesión. ¿Qué hago?',
    answer:
      'Verifica tu correo y contraseña, revisa tu conexión y vuelve a intentarlo. Si el problema sigue, contacta a soporte para revisar tu cuenta.',
  },
  {
    question: 'No veo mi plan de alimentación o entrenamientos.',
    answer:
      'Espera unos minutos después de una asignación nueva y vuelve a abrir la app. Si tu plan sigue sin aparecer, escríbenos para validarlo.',
  },
  {
    question: 'No recibo notificaciones.',
    answer:
      'Confirma que las notificaciones estén activas en tu dispositivo y en la opción de Perfil > Notificaciones dentro de la app.',
  },
  {
    question: '¿Cómo actualizo mis datos o mi foto de perfil?',
    answer:
      'Desde Perfil puedes editar tu información personal, cambiar tu contraseña y actualizar tu foto tocando el ícono de cámara.',
  },
  {
    question: 'Necesito ayuda adicional.',
    answer:
      'Usa los canales de correo o WhatsApp para enviarnos tu duda con el mayor detalle posible y poder ayudarte más rápido.',
  },
];

export const supportLegalDocuments = {
  terms: {
    title: 'Términos y condiciones',
    subtitle: 'Consulta las reglas de uso y las condiciones actuales de FitPilot.',
    emptyStateTitle: 'Términos no configurados',
    emptyStateDescription:
      'Todavía no tenemos una URL pública para este documento. Vuelve a intentarlo más adelante o solicita ayuda al equipo de soporte.',
    url: resolveOptionalUrl(process.env.EXPO_PUBLIC_TERMS_URL || extra.termsUrl || 'https://pro.fitpilot.fit/es/terms'),
  },
  privacy: {
    title: 'Política de privacidad',
    subtitle: 'Consulta cómo protegemos y procesamos tus datos dentro de FitPilot.',
    emptyStateTitle: 'Política no configurada',
    emptyStateDescription:
      'Todavía no tenemos una URL pública para este documento. Vuelve a intentarlo más adelante o solicita ayuda al equipo de soporte.',
    url: resolveOptionalUrl(process.env.EXPO_PUBLIC_PRIVACY_URL || extra.privacyUrl || 'https://pro.fitpilot.fit/es/privacy'),
  },
} satisfies Record<string, SupportLegalDocument>;

export type SupportLegalDocumentKey = keyof typeof supportLegalDocuments;

export const isSupportLegalDocumentKey = (
  value: string,
): value is SupportLegalDocumentKey => value in supportLegalDocuments;

export const buildSupportMailtoUrl = (subject = 'Soporte FitPilot') =>
  `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;

export const buildSupportWhatsAppUrl = (
  message = supportWhatsAppDefaultMessage,
) => `https://wa.me/${supportWhatsAppE164}?text=${encodeURIComponent(message)}`;
