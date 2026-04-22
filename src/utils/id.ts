import { factory } from 'ulid';

const ulid = factory(() => Math.random());

export function newLocalId(): string {
  return ulid();
}
