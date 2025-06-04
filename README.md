# Directory Setup Assistant

A Next.js application that automates connecting Google Workspace and Microsoft Entra ID. It uses NextAuth for authentication and Redux Toolkit for client state.

## Prerequisites
- Node.js 18+
- pnpm package manager
- Google Workspace admin account
- Microsoft Global Administrator account

## Quick Start
1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in credentials
3. `pnpm dev:test` to ensure the dev server starts
4. Open `http://localhost:3000` and sign in with both providers
5. Follow the step list to complete the setup

## Environment Variables
| Name | Description |
| ---- | ----------- |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `MICROSOFT_CLIENT_ID` | Azure app client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure app client secret |
| `GOOGLE_ADMIN_SCOPES` | Space separated admin scopes |
| `MICROSOFT_GRAPH_SCOPES` | Space separated Graph scopes |
| `AUTH_SECRET` | NextAuth secret |

## Common Issues
- **Invalid session**: sign out completely and sign in again.
- **API not enabled**: enable the required Google API using the provided link.

## Development
See [AGENTS.md](AGENTS.md) for architecture guidelines and testing commands.
