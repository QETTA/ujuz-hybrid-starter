// 공통 유효성 검사 유틸

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export interface ProfileValidationInput {
  displayName?: string;
  childName: string;
  childBirthDate: string;
  requireDisplayName?: boolean;
}

export function getProfileValidationError({
  displayName = '',
  childName,
  childBirthDate,
  requireDisplayName = false,
}: ProfileValidationInput): string | null {
  const trimmedDisplayName = displayName.trim();
  const trimmedChildName = childName.trim();
  const trimmedBirthDate = childBirthDate.trim();

  if (requireDisplayName && !trimmedDisplayName) {
    return '보호자 닉네임을 입력해주세요.';
  }
  if (!trimmedChildName) {
    return '아이 이름을 입력해주세요.';
  }
  if (!trimmedBirthDate) {
    return '아이 생일을 입력해주세요.';
  }
  if (!isValidISODate(trimmedBirthDate)) {
    return '생일 형식은 YYYY-MM-DD로 입력해주세요.';
  }
  return null;
}
