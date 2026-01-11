// Ofuscação simples para API keys (NÃO é criptografia real)
// A chave fica no dispositivo do usuário, isso apenas dificulta exposição acidental

const SALT = 'jarvis_obd_2024_v1';

export function encryptApiKey(key: string): string {
  if (!key) return '';
  try {
    const combined = SALT + key + SALT;
    return btoa(combined);
  } catch {
    return '';
  }
}

export function decryptApiKey(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const combined = atob(encrypted);
    return combined.slice(SALT.length, -SALT.length);
  } catch {
    return '';
  }
}

// Valida formato básico de API key da OpenAI
export function isValidOpenAIKey(key: string): boolean {
  if (!key) return false;
  // OpenAI keys começam com sk- e têm pelo menos 40 caracteres
  return key.startsWith('sk-') && key.length >= 40;
}

// Mascara a API key para exibição
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '••••••••';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}
