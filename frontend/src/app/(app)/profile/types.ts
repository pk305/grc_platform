import type { MyProfileQuery } from '@/features/profile/__generated__/queries.generated';

/** The signed-in account, as the profile page reads it. */
export type ProfileUser = NonNullable<MyProfileQuery['me']>;
