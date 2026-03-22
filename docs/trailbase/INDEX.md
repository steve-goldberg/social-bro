# TrailBase Docs Index

Local copy of [trailbaseio/trailbase](https://github.com/trailbaseio/trailbase) docs.
Releases/changelog: <https://github.com/trailbaseio/trailbase/releases>

## Getting Started

- `getting-started/install.mdx` — Installing TrailBase, starting the server, accessing the admin dashboard
- `getting-started/goals.mdx` — Design philosophy: simplicity, speed, loose coupling, no lock-in
- `getting-started/first-cli-app.mdx` — Tutorial: CLI app querying IMDB movies via Record APIs
- `getting-started/first-ui-app.mdx` — Tutorial: coffee vector-search web app with custom TS endpoints and React UI
- `getting-started/first-realtime-app.mdx` — Tutorial: collaborative clicker game with SSR and realtime subscriptions

## Documentation

- `documentation/apis_overview.mdx` — Endpoint options: Record APIs, WASM/JS/TS handlers, stored procedures, Rust, external backends
- `documentation/apis_record.mdx` — Record API reference: CRUD, list/filter/paginate, subscriptions, file uploads, JSON schemas
- `documentation/apis_js.mdx` — Custom HTTP endpoints via WASM components in JavaScript, TypeScript, or Rust
- `documentation/auth.mdx` — Auth system: JWT + refresh tokens, OAuth2 providers, PKCE flow, built-in auth UIs
- `documentation/migrations.mdx` — Schema migrations: creating, applying, and rolling out across environments
- `documentation/models_and_relations.mdx` — Data modeling: table schemas, strict typing, constraints, 1:1/1:M/N:M relations
- `documentation/production.mdx` — Production checklist: TLS, access control, email, deployment, disaster recovery
- `documentation/type_safety.mdx` — End-to-end type safety from DB schema to client bindings via JSON schema

## Reference

- `reference/faq.mdx` — FAQ: target audience, production readiness, scaling, data import/export
- `reference/benchmarks.mdx` — Performance benchmarks vs PocketBase, Supabase, and vanilla SQLite
- `reference/roadmap.mdx` — Planned features: multi-tenancy, MFA, PITR, message queues, GraphQL

## Comparison

- `comparison/pocketbase.mdx` — Comparison with PocketBase: goals, language, performance, features, licensing
- `comparison/supabase.mdx` — Comparison with Supabase: layered services (Postgres) vs monolith (SQLite)

## Other

- `openapi/schema.json` — OpenAPI schema for TrailBase APIs
- `examples/record_api_curl/` — Record API examples using curl
- `examples/record_api_ts/` — Record API examples using TypeScript
