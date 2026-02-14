export function VerifyUserExist(name: string | undefined): boolean {
  if (name) {
    const cookie = name.split(":");

    if (
      cookie[0] === import.meta.env.ADMIN_EMAIL_HASH &&
      cookie[1] === import.meta.env.ADMIN_PASS_HASH
    )
      return true;
  }
  return false;
}
