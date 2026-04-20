import { UniqueConstraintError, ValidationErrorItem } from 'sequelize';

type UniqueConstraintCandidate = {
  name?: string;
  errors?: Array<{ path?: string }>;
  fields?: Record<string, unknown>;
  message?: string;
  sqlMessage?: string;
  original?: { sqlMessage?: string };
  parent?: { sqlMessage?: string };
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sequelize の一意制約違反かどうかを判定します。
 *
 * `fields` を指定した場合は、そのいずれかの項目に一致した場合のみ true を返します。
 *
 * @param error - 判定対象の例外
 * @param fields - 対象カラム名（省略時は一意制約違反なら true）
 * @returns 一意制約違反として扱うべき場合は true
 */
export function isUniqueConstraintError(error: unknown, fields?: string[]): boolean {
  const targets = new Set((fields || []).map((field) => field.toLowerCase()));

  const matches = (candidateFields: string[]) => {
    if (targets.size === 0) {
      return candidateFields.length > 0;
    }
    return candidateFields.some((field) => targets.has(field.toLowerCase()));
  };

  if (error instanceof UniqueConstraintError) {
    const paths = error.errors.map((item: ValidationErrorItem) => item.path || '').filter(Boolean);
    return matches(paths);
  }

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as UniqueConstraintCandidate;
  if (candidate.name !== 'SequelizeUniqueConstraintError') {
    return false;
  }

  const pathFields = (candidate.errors || []).map((item) => item.path || '').filter(Boolean);
  if (matches(pathFields)) {
    return true;
  }

  const keyedFields = Object.keys(candidate.fields || {});
  if (matches(keyedFields)) {
    return true;
  }

  if (targets.size === 0) {
    return true;
  }

  const raw = [
    candidate.message,
    candidate.sqlMessage,
    candidate.original?.sqlMessage,
    candidate.parent?.sqlMessage,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  const isWordCharacter = (character: string): boolean => /[a-z0-9_]/.test(character);

  const containsTargetField = (text: string, target: string): boolean => {
    let index = text.indexOf(target);
    while (index !== -1) {
      const before = index === 0 || !isWordCharacter(text[index - 1]);
      const after = index + target.length === text.length || !isWordCharacter(text[index + target.length]);
      if (before && after) {
        return true;
      }
      index = text.indexOf(target, index + 1);
    }
    return false;
  };

  for (const field of targets) {
    if (containsTargetField(raw, field)) {
      return true;
    }
  }

  return false;
}
