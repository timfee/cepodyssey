# Google Step Modules

All Google Workspace automation steps live in this directory. Each step has its own folder containing:

```
index.ts   # Step definition exporting metadata and references
check.ts    # Implementation of the check function
execute.ts  # Implementation of the execute function
```

Shared helpers such as authentication and error handling live in `utils/`. Step logic should not depend on `app/actions`.
