# Valibot Quick Reference

> Local reference for Claude Code. For full docs: https://valibot.dev/llms-full.txt

## Install

```bash
npm install valibot
```

## Core API

```ts
import * as v from 'valibot';
```

### Schemas

| Function | Description |
|----------|-------------|
| `v.string()` | String schema |
| `v.number()` | Number schema |
| `v.boolean()` | Boolean schema |
| `v.date()` | Date schema |
| `v.file()` | File schema |
| `v.object({...})` | Object schema |
| `v.array(schema)` | Array schema |
| `v.optional(schema, default?)` | Optional with default |
| `v.nullable(schema)` | Nullable |
| `v.enum_(enum)` | TypeScript enum |
| `v.picklist(['a','b'])` | Union of literals |
| `v.literal('value')` | Literal value |
| `v.union([s1, s2])` | Union of schemas |
| `v.record(keySchema, valueSchema)` | Record type |
| `v.tuple([s1, s2])` | Tuple type |

### Pipe (validation + transform)

```ts
// pipe wraps a schema with validation actions
v.pipe(v.string(), v.email())
v.pipe(v.string(), v.minLength(8))
v.pipe(v.string(), v.maxLength(255))
v.pipe(v.string(), v.nonEmpty())
v.pipe(v.string(), v.regex(/pattern/))
v.pipe(v.string(), v.url())
v.pipe(v.string(), v.uuid())
v.pipe(v.string(), v.trim(), v.toLowerCase())
v.pipe(v.number(), v.minValue(1))
v.pipe(v.number(), v.maxValue(100))
v.pipe(v.number(), v.integer())
```

### Validation Actions

| Action | Description |
|--------|-------------|
| `v.email(msg?)` | Email format |
| `v.minLength(n, msg?)` | Min string/array length |
| `v.maxLength(n, msg?)` | Max string/array length |
| `v.nonEmpty(msg?)` | Not empty |
| `v.regex(re, msg?)` | Regex match |
| `v.url(msg?)` | URL format |
| `v.uuid(msg?)` | UUID format |
| `v.minValue(n, msg?)` | Min number value |
| `v.maxValue(n, msg?)` | Max number value |
| `v.integer(msg?)` | Integer check |
| `v.trim()` | Transform: trim whitespace |
| `v.toLowerCase()` | Transform: lowercase |
| `v.toUpperCase()` | Transform: uppercase |

### Parse & Validate

```ts
// Throws on invalid — use for trusted data
const result = v.parse(schema, data);

// Returns { success, output, issues } — use for user input
const result = v.safeParse(schema, data);
if (result.success) {
  result.output; // typed
} else {
  result.issues; // array of { message, path, ... }
}

// Type guard
if (v.is(schema, data)) {
  // data is typed
}
```

### Type Inference

```ts
type Input = v.InferInput<typeof MySchema>;
type Output = v.InferOutput<typeof MySchema>;
```

### Custom Error Messages

```ts
const LoginSchema = v.object({
  email: v.pipe(
    v.string('Email must be a string.'),
    v.nonEmpty('Please enter your email.'),
    v.email('Invalid email format.')
  ),
  password: v.pipe(
    v.string('Password must be a string.'),
    v.minLength(8, 'Password must be at least 8 characters.')
  ),
});
```

## Standard Schema Compliance

Valibot v1+ implements the [Standard Schema](https://standardschema.dev/) spec.
This means it works natively with:
- SvelteKit remote functions (`query`, `form`, `command`)
- Any library that accepts Standard Schema validators

## Comparison with Zod

| Feature | Zod | Valibot |
|---------|-----|---------|
| Bundle size | ~13kB min | ~1kB min (tree-shakable) |
| API style | Chained methods | Pipe-based functions |
| `z.string().email()` | `v.pipe(v.string(), v.email())` |
| `z.object({...})` | `v.object({...})` |
| `z.string().min(8)` | `v.pipe(v.string(), v.minLength(8))` |
| `z.string().optional()` | `v.optional(v.string())` |
| `z.infer<typeof s>` | `v.InferOutput<typeof s>` |
| `.parse()` | `v.parse()` |
| `.safeParse()` | `v.safeParse()` |
