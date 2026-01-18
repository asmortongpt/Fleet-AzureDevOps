// Type guard for checking if a value is defined (not null or undefined)
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard for checking if a value is a string
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Type guard for checking if a value is a number
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Type guard for checking if a value is a boolean
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

// Type guard for checking if a value is an array
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

// Type guard for checking if a value is an object (excluding null and arrays)
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard for checking if a value is a function
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

// Type guard for checking if a value is a Date
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Type guard for checking if a value is a valid email
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// Type guard for checking if a value is a valid URL
export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Type guard for checking if a value is a valid UUID
export function isUuid(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Type guard for checking if a value is empty (null, undefined, empty string, empty array, or empty object)
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// Type guard for checking if a value is a non-empty string
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

// Type guard for checking if a value is a positive number
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

// Type guard for checking if a value is an integer
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

// Type guard for checking if a value is a positive integer
export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

// Type guard for checking if an object has a specific property
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

// Type guard for checking if an object has all specified properties
export function hasProperties<K extends PropertyKey>(
  obj: unknown,
  props: K[]
): obj is Record<K, unknown> {
  return isObject(obj) && props.every(prop => prop in obj);
}

// Type guard for checking if a value is one of the allowed values
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T
): value is T[number] {
  return allowedValues.includes(value);
}

// Type guard for checking if all array elements satisfy a condition
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(guard);
}

// Type guard for checking if a value is a record with specific value types
export function isRecordOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is Record<string, T> {
  if (!isObject(value)) return false;
  return Object.values(value).every(guard);
}

// Type guard for checking if a value matches a specific shape
export function isShape<T extends Record<string, unknown>>(
  value: unknown,
  shape: { [K in keyof T]: (v: unknown) => v is T[K] }
): value is T {
  if (!isObject(value)) return false;
  
  for (const [key, guard] of Object.entries(shape)) {
    if (!(key in value) || !guard(value[key as keyof typeof value])) {
      return false;
    }
  }
  
  return true;
}

// Type guard for checking if a value is a valid JSON string
export function isJsonString(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

// Type guard for checking if a value is a Promise
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return isObject(value) && isFunction((value as any).then) && isFunction((value as any).catch);
}

// Type guard for checking if a value is an Error
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Type guard for checking if a value is a RegExp
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

// Type guard for checking if a value is a Map
export function isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V> {
  return value instanceof Map;
}

// Type guard for checking if a value is a Set
export function isSet<T = unknown>(value: unknown): value is Set<T> {
  return value instanceof Set;
}

// Type guard for checking if a value is a WeakMap
export function isWeakMap<K extends object = object, V = unknown>(value: unknown): value is WeakMap<K, V> {
  return value instanceof WeakMap;
}

// Type guard for checking if a value is a WeakSet
export function isWeakSet<T extends object = object>(value: unknown): value is WeakSet<T> {
  return value instanceof WeakSet;
}