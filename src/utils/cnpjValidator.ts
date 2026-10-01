/**
 * Utilitário oficial para formatação de máscara e cálculo do dígito verificador de CNPJ (Módulo 11)
 * Conforme regras oficiais da Secretaria da Receita Federal do Brasil.
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function stripCnpjMask(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Aplica máscara de CNPJ progressiva: 00.000.000/0000-00
 */
export function formatCnpjMask(value: string): string {
  const digits = stripCnpjMask(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Validação rigorosa dos dígitos verificadores (DVs) do CNPJ pelo algoritmo de Módulo 11
 */
export function validateCnpjCheckDigits(cnpj: string): { isValid: boolean; error?: string } {
  const clean = stripCnpjMask(cnpj);

  if (!clean || clean.length === 0) {
    return { isValid: false, error: 'Por favor, informe o número do CNPJ.' };
  }

  if (clean.length !== 14) {
    return {
      isValid: false,
      error: `CNPJ incompleto: ${clean.length} de 14 dígitos informados. Formato esperado: 00.000.000/0000-00.`,
    };
  }

  // Elimina CNPJs conhecidos inválidos formados por dígitos repetidos (ex: 00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(clean)) {
    return {
      isValid: false,
      error: 'CNPJ inválido: sequências com todos os dígitos iguais são rejeitadas pela Receita Federal.',
    };
  }

  // 1º Dígito Verificador (Módulo 11 com pesos de 5 a 2 e depois 9 a 2)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i], 10) * weights1[i];
  }
  const mod1 = sum1 % 11;
  const expectedDigit1 = mod1 < 2 ? 0 : 11 - mod1;

  if (parseInt(clean[12], 10) !== expectedDigit1) {
    return {
      isValid: false,
      error: `Dígito verificador inválido: o primeiro dígito esperado é ${expectedDigit1}, mas foi informado ${clean[12]}.`,
    };
  }

  // 2º Dígito Verificador (Módulo 11 com pesos de 6 a 2 e depois 9 a 2)
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean[i], 10) * weights2[i];
  }
  const mod2 = sum2 % 11;
  const expectedDigit2 = mod2 < 2 ? 0 : 11 - mod2;

  if (parseInt(clean[13], 10) !== expectedDigit2) {
    return {
      isValid: false,
      error: `Dígito verificador inválido: o segundo dígito esperado é ${expectedDigit2}, mas foi informado ${clean[13]}.`,
    };
  }

  return { isValid: true };
}

/**
 * Retorna true se o CNPJ for matematicamente válido
 */
export function isValidCnpj(cnpj: string): boolean {
  return validateCnpjCheckDigits(cnpj).isValid;
}
