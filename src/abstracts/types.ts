export type Optional<T> = T | null;

export type UID<T> = {
  id: number;
  item: T;
};

export type User = {
  login: string;
  email?: string;
  password: string;
};

export type RawUser = {
  user_id: number;
  login: string;
  email: string;
  password: string;
};

export type LinkType = 'short' | 'named';

export type Link = {
  full_link: string;
  type: LinkType;
  short_id?: string;
  has_expire: boolean;
  expire?: string;
  has_metadata: boolean;
  name?: string;
  description?: string;
  create_date: string;
  update_date?: string;
  owner: User['login'] | null;
};

export type RawLink = {
  link_id: number;
  full_link: string;
  type: LinkType;
  short_id: string;
  expire: string | null;
  name: string | null;
  description: string | null;
  create_date: string;
  update_date: string | null;
  owner: string | null;
}

export type Response = {
  user: UID<Omit<User, 'password'>>;
};
