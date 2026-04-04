export const deriveBaseUsername = (email: string) => email.split('@')[0]

export const resolveUsernameCollision = async (
  baseUsername: string,
  exists: (username: string) => Promise<boolean>,
) => {
  if (!(await exists(baseUsername))) {
    return baseUsername
  }

  let suffix = 1

  while (await exists(`${baseUsername}-${suffix}`)) {
    suffix += 1
  }

  return `${baseUsername}-${suffix}`
}
