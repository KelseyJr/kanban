const SUFFIX_LENGTH = 8

type BuildUniqueNameParams = {
  prefix: string
}

type BuildUniqueNameResult = {
  name: string
}

export function buildUniqueName({ prefix }: BuildUniqueNameParams): BuildUniqueNameResult {
  return { name: `${prefix}-${crypto.randomUUID().slice(0, SUFFIX_LENGTH)}` }
}
