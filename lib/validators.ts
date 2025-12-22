// SQL validation and safety checks

export interface SafetyCheckResult {
  isSafe: boolean;
  warnings: string[];
  isSuspicious: boolean;
  severity: 'low' | 'medium' | 'high';
}

const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'MODIFY',
  'GRANT',
  'REVOKE',
];

const SUSPICIOUS_PATTERNS = [
  /;\s*(DROP|DELETE|TRUNCATE|ALTER)/i,
  /--\s*DROP/i,
  /\/\*.*DROP.*\*\//i,
  /xp_/i, // Extended stored procedures
  /sp_/i, // System stored procedures
];

export function validateSQL(sql: string): SafetyCheckResult {
  const warnings: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check for dangerous keywords
  const hasDangerousKeywords = DANGEROUS_KEYWORDS.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(sql)
  );

  if (hasDangerousKeywords) {
    warnings.push('Query contains DDL/DML operations (DROP, DELETE, ALTER, etc.)');
    severity = 'high';
  }

  // Check for suspicious patterns
  const hasSuspiciousPatterns = SUSPICIOUS_PATTERNS.some((pattern) =>
    pattern.test(sql)
  );

  if (hasSuspiciousPatterns) {
    warnings.push('Query contains suspicious patterns that may indicate SQL injection');
    severity = 'high';
  }

  // Check for multiple statements
  const statements = sql.split(';').filter((s) => s.trim());
  if (statements.length > 1) {
    warnings.push('Query contains multiple SQL statements');
    severity = severity === 'high' ? 'high' : 'medium';
  }

  // Check for comments
  if (/--/.test(sql) || /\/\*/.test(sql)) {
    warnings.push('Query contains comments');
  }

  // Check for large result sets (SELECT without LIMIT)
  if (/SELECT/i.test(sql) && !/LIMIT/i.test(sql)) {
    warnings.push('SELECT query without LIMIT clause may return large result sets');
    severity = severity === 'high' ? 'high' : 'low';
  }

  return {
    isSafe: warnings.length === 0,
    warnings,
    isSuspicious: severity === 'high',
    severity,
  };
}

export function sanitizeSQL(sql: string): string {
  // Basic sanitization - remove leading/trailing whitespace
  return sql.trim();
}

export function formatSQL(sql: string): string {
  // Simple SQL formatting
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*(FROM|WHERE|JOIN|LEFT|RIGHT|INNER|GROUP BY|ORDER BY|LIMIT)\s*/gi, ' $1 ')
    .trim();
}
