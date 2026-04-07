#!/bin/sh
set -eu

MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USERNAME="${MONGO_USERNAME:?MONGO_USERNAME is required}"
MONGO_PASSWORD="${MONGO_PASSWORD:?MONGO_PASSWORD is required}"

mongo_eval() {
  mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval "$1"
}

auth_mongo_eval() {
  mongosh "mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/admin?authSource=admin" --quiet --eval "$1"
}

echo "[mongo-bootstrap] waiting for mongo at ${MONGO_HOST}:${MONGO_PORT}"
for _ in $(seq 1 60); do
  if mongo_eval "db.adminCommand('ping').ok" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! mongo_eval "db.adminCommand('ping').ok" >/dev/null 2>&1; then
  echo "[mongo-bootstrap] mongo did not become reachable in time" >&2
  exit 1
fi

USER_COUNT="$(mongo_eval "db.getSiblingDB('admin').system.users.countDocuments({})" | tr -d '\r')"
ROOT_EXISTS="$(mongo_eval "db.getSiblingDB('admin').getUser('${MONGO_USERNAME}') ? 'yes' : 'no'" | tr -d '\r')"

if [ "$USER_COUNT" = "0" ]; then
  echo "[mongo-bootstrap] no admin users found, creating root user ${MONGO_USERNAME}"
  mongo_eval "db.getSiblingDB('admin').createUser({ user: '${MONGO_USERNAME}', pwd: '${MONGO_PASSWORD}', roles: [{ role: 'root', db: 'admin' }] })"
  echo "[mongo-bootstrap] root user created"
  exit 0
fi

if auth_mongo_eval "db.adminCommand('ping').ok" >/dev/null 2>&1; then
  echo "[mongo-bootstrap] authenticated as ${MONGO_USERNAME}, syncing password"
  auth_mongo_eval "db.getSiblingDB('admin').updateUser('${MONGO_USERNAME}', { pwd: '${MONGO_PASSWORD}', roles: [{ role: 'root', db: 'admin' }] })"
  echo "[mongo-bootstrap] root user password synced"
  exit 0
fi

if [ "$ROOT_EXISTS" = "yes" ]; then
  echo "[mongo-bootstrap] root user ${MONGO_USERNAME} exists but current env password is invalid" >&2
  echo "[mongo-bootstrap] update requires currently valid admin credentials; manual intervention required" >&2
  exit 1
fi

if mongo_eval "db.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUsers.length === 0 ? 'yes' : 'no'" >/dev/null 2>&1; then
  echo "[mongo-bootstrap] root user ${MONGO_USERNAME} missing, creating it via localhost exception"
  mongo_eval "db.getSiblingDB('admin').createUser({ user: '${MONGO_USERNAME}', pwd: '${MONGO_PASSWORD}', roles: [{ role: 'root', db: 'admin' }] })"
  echo "[mongo-bootstrap] root user created on existing volume"
  exit 0
fi

echo "[mongo-bootstrap] existing admin users detected and localhost exception unavailable" >&2
echo "[mongo-bootstrap] cannot create or update ${MONGO_USERNAME} automatically without valid current admin credentials" >&2
exit 1
