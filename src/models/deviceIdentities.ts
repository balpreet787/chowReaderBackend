import sql, { DbClient } from "../lib/db";

type DeviceIdentityRow = {
  id: string;
  user_id: string;
  android_id_hash: string;
  state: string;
};

export async function findDeviceByHash(
  androidIdHash: string,
  db: DbClient = sql
): Promise<DeviceIdentityRow | null> {
  const [deviceIdentity] = await db<DeviceIdentityRow[]>`
    select id, user_id, android_id_hash, state
    from public.device_identities
    where android_id_hash = ${androidIdHash}
  `;

  return deviceIdentity ?? null;
}

export async function createDeviceIdentity(
  userId: string,
  androidIdHash: string,
  db: DbClient = sql
): Promise<DeviceIdentityRow> {
  const [deviceIdentity] = await db<DeviceIdentityRow[]>`
    insert into public.device_identities (user_id, android_id_hash)
    values (${userId}, ${androidIdHash})
    returning id, user_id, android_id_hash, state
  `;

  if (!deviceIdentity) {
    throw new Error("Failed to create device identity");
  }

  return deviceIdentity;
}
