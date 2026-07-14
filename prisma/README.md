# Prisma schema (MVP)

`schema.prisma` models the published curriculum, a future first-party learning state, weekly plans, credentials, and privacy requests for PostgreSQL.

The workspace uses Prisma 7, so the connection URL belongs in `prisma.config.ts` rather than in the schema. Before generating a client or migration, provide `DATABASE_URL` in the environment and add the configuration as part of the application migration. The public MVP remains local-only and does not use this database at runtime.

## Content and translations

All fields ending in `I18n` are locale-keyed JSON objects. Seed data should include at least `pt-BR` and may additionally provide `en-US` and `es-ES`:

```json
{ "pt-BR": "Fundamentos", "en-US": "Fundamentals", "es-ES": "Fundamentos" }
```

`Resource.languages` keeps BCP 47 language tags so filtering is not restricted to the initial three interface locales.

## Validation owned by the service layer

PostgreSQL relations enforce normal content links. `Prerequisite` is intentionally a typed graph, so the publishing service must verify that its `subjectId` and `requirementId` exist in the models named by their enum values. The service must also enforce percentage ranges from 0 to 100, non-negative durations/costs, and that an optional `StudyPlanItem` resource/checkpoint belongs to its required module.

The public MVP does not synchronize learning data with external services. Export artifacts should use short-lived, access-controlled storage keys rather than public URLs if first-party accounts are introduced later.
