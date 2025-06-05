# Server Actions

- Always return an object `{ success: boolean, ... }` instead of throwing.
- Use `ApiLogger` to capture API logs for each request.
- Revalidate pages with `revalidatePath` when results affect the UI.
- Document exported actions with TSDoc comments.
