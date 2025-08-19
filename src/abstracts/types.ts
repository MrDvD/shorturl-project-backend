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
  expire?: Date;
  has_metadata: boolean;
  name?: string;
  description?: string;
  create_date: Date;
  update_date?: Date;
  owner: User['login'];
};

export type RawLink = {
  link_id: number;
  full_link: string;
  type: LinkType;
  short_id: string;
  expire: string;
  name: string;
  description: string;
  create_date: string;
  update_date: string;
  owner: string;
}

export type Response = {
  user: UID<Omit<User, 'password'>>;
};
