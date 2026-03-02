# Keystatic Cleanup and Documentation Plan

This plan addresses the remaining cleanup and documentation tasks following the migration from TinaCMS to Keystatic.

## Tasks for the Orchestrator

- [ ] **1. Remove `tina-backend`**
  - Delete the `tina-backend` directory and its contents entirely.
  - Double check for any residual TinaCMS config files or scripts.

- [ ] **2. Clean up Deployment Configurations**
  - Update `deploy/docker-compose.eosclub.yml` to remove the Tina backend and Mongo services.
  - Clean up `deploy/rebuild.sh` to remove any steps related to starting/stopping the Tina backend.

- [ ] **3. Update `.gitignore`**
  - Remove any Tina-specific ignores.
  - Ensure there are no upstream/local Keystatic artifacts being improperly tracked.

- [ ] **4. Rewrite `README.md`**
  - Update the "Tech Stack" section to mention Keystatic.
  - Update local development instructions to remove `npx tinacms dev` and `tina-backend`.
  - Update URLs table (e.g., `/admin` should now be `/keystatic`).
  - Update the "Deployment Architecture" section to reflect the Keystatic GitHub Storage workflow.

- [ ] **5. Remove Outdated Deployment Docs**
  - Delete `plans/deployment-tinacms-plan.md` (version control retains history if needed).
  - Delete `deploy/SERVER_SETUP.md`.

- [ ] **6. Update Core Project Context Docs**
  - Update `plans/project-context.md` to remove TinaCMS references, updating the Tech Stack, Routing, Block System, Content Schema, Environment Variables, and Deployment sections for Keystatic.
  - Copy `plans/SPEC_MVP_v2.md` to `plans/SPEC_MVP_v3.md` and adjust it for Keystatic (updating Tech Stack, directory structure, data schema, CMS wiring, deployment, and future AI agent context).
  - Delete `plans/SPEC_MVP_v2.md` once V3 is created.

- [ ] **7. Create New Keystatic Deployment Guide**
  - Create a new file: `deploy/KEYSTATIC_DEPLOYMENT_GUIDE.md`.
  - Document the local development setup (using `local` storage).
  - Document the production workflow (using `github` storage), explicitly detailing how to create a GitHub OAuth App and configure the necessary environment variables (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`).
