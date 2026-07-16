/**
 * DI token for the initialized TypeORM DataSource. Lives in its own module
 * (like platform/tokens.ts) so services can inject it without importing
 * DbModule — importing the module from a provider creates a CJS circular
 * import that leaves the token undefined at decorator-evaluation time.
 */
export const DATA_SOURCE = Symbol('DATA_SOURCE');
