# Regen GraphQL types

Refresh GraphQL types from the stage2 GraphQL schema.

Steps (Phase 2+):
1. Point introspection at the stage2 GraphQL endpoint (requires network/VPN as applicable)
2. Run GraphQL codegen per project config
3. Commit updated types under `framework/api/operations/`

Verify with `pnpm typecheck` after regeneration.
