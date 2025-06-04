# Microsoft Step Modules

Microsoft Entra ID steps mirror the Google steps structure. Each subfolder contains `index.ts`, `check.ts`, and `execute.ts` with the full logic for that step.

Common helpers reside in `utils/`. Steps should import only these utilities and API clients.
