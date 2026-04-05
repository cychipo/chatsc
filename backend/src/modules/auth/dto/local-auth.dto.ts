export type RegisterLocalAuthDto = {
  email: string
  username: string
  displayName: string
  password: string
  confirmPassword: string
}

export type LoginLocalAuthDto = {
  email: string
  password: string
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeTextField(value: string) {
  return value.trim()
}

export function validateRegisterLocalAuthDto(payload: RegisterLocalAuthDto) {
  const email = normalizeEmail(payload.email)
  const username = normalizeTextField(payload.username)
  const displayName = normalizeTextField(payload.displayName)
  const password = payload.password
  const confirmPassword = payload.confirmPassword

  if (!email || !username || !displayName || !password || !confirmPassword) {
    return {
      ok: false as const,
      code: 'local_auth_invalid_payload',
      message: 'Missing required local registration fields',
    }
  }

  if (!email.includes('@')) {
    return {
      ok: false as const,
      code: 'local_auth_invalid_email',
      message: 'Email is invalid',
    }
  }

  if (password !== confirmPassword) {
    return {
      ok: false as const,
      code: 'local_auth_password_confirm_mismatch',
      message: 'Password confirmation does not match',
    }
  }

  return {
    ok: true as const,
    value: {
      email,
      username,
      displayName,
      password,
      confirmPassword,
    },
  }
}

export function validateLoginLocalAuthDto(payload: LoginLocalAuthDto) {
  const email = normalizeEmail(payload.email)
  const password = payload.password

  if (!email || !password) {
    return {
      ok: false as const,
      code: 'local_auth_invalid_payload',
      message: 'Missing local login credentials',
    }
  }

  if (!email.includes('@')) {
    return {
      ok: false as const,
      code: 'local_auth_invalid_email',
      message: 'Email is invalid',
    }
  }

  return {
    ok: true as const,
    value: {
      email,
      password,
    },
  }
}
