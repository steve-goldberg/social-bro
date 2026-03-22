import { rapidApiFetch } from '../client';

const INSTAGRAM_HOST = 'instagram-looter2.p.rapidapi.com';

export interface InstagramSearchUser {
  pk: string;
  username: string;
  fullName: string;
  isVerified: boolean;
  profilePicUrl: string;
}

interface InstagramApiSearchUser {
  position: number;
  user: {
    pk: string;
    username: string;
    full_name: string;
    is_verified: boolean;
    profile_pic_url: string;
  };
}

interface InstagramApiSearchResponse {
  status: string;
  users?: InstagramApiSearchUser[];
  hashtags?: unknown[];
  places?: unknown[];
}

export interface InstagramSearchOptions {
  userId: string;
  query: string;
}

export async function searchInstagram({
  userId,
  query,
}: InstagramSearchOptions): Promise<InstagramSearchUser[]> {
  const response = await rapidApiFetch<InstagramApiSearchResponse>(userId, {
    host: INSTAGRAM_HOST,
    endpoint: '/search',
    params: {
      query,
    },
  });

  if (response.status !== 'ok' || !response.users) {
    return [];
  }

  return response.users.map((item) => ({
    pk: item.user.pk,
    username: item.user.username,
    fullName: item.user.full_name,
    isVerified: item.user.is_verified,
    profilePicUrl: item.user.profile_pic_url,
  }));
}
