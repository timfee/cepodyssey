export function createEnv(options: {
  server?: Record<string, any>
  client?: Record<string, any>
  runtimeEnv: Record<string, any>
}) {
  const env: Record<string, any> = {}
  const parse = (schema: any, value: any) =>
    schema && typeof schema.parse === 'function' ? schema.parse(value) : value
  if (options.server)
    for (const key in options.server)
      env[key] = parse(options.server[key], options.runtimeEnv[key])
  if (options.client)
    for (const key in options.client)
      env[key] = parse(options.client[key], options.runtimeEnv[key])
  return env
}
