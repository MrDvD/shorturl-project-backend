import { UID } from './types';

export interface GenericRepository<T, K extends keyof T = never> {
  create(item: T): Promise<UID<Omit<T, K>>>;
  update(item: UID<T>): Promise<UID<Omit<T, K>>>;
  delete(id: UID<T>['id']): Promise<void>;
}

export interface ReadableRepository<T, Selector, K extends keyof T = never>
  extends GenericRepository<T, K> {
  read(id: UID<T>['id']): Promise<UID<Omit<T, K>>>;
  readAll(selector: Selector): Promise<UID<Omit<T, K>>[]>;
}

export interface CheckableRepository<T, Response, K extends keyof T = never>
  extends GenericRepository<T, K> {
  check(item: T): Promise<Response>;
}
