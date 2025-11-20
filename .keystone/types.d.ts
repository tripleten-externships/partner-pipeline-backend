// Minimal ambient declaration to satisfy imports of ".keystone/types" in tests
// The real Keystone-generated types are created during dev/build. For CI and
// test runs where those generated types may be absent, this lightweight
// declaration prevents TypeScript from failing. If you prefer stricter types,
// replace `any` with the actual Context shape from Keystone.
declare module ".keystone/types" {
  // Keep this broad to avoid coupling tests to generated Keystone internals.
  export type Context = any;
}
