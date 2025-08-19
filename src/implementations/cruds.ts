import postgres from 'postgres';
import { CheckableRepository, ReadableRepository } from '../abstracts/cruds';
import { Link, RawLink, RawUser, Response, UID, User } from '../abstracts/types';
import fastify from 'fastify';

export class UserRepository
  implements CheckableRepository<User, Response, 'password'>
{
  private sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  protected mapUser(raw: RawUser): UID<Omit<User, 'password'>> {
    return {
      id: raw.user_id,
      item: {
        login: raw.login,
        email: raw.email,
      },
    };
  }

  public create(item: User): Promise<UID<Omit<User, 'password'>>> {
    if (item.email === undefined) {
      throw new Error('Не указана почта при регистрации.');
    }
    return this.sql<RawUser[]>`
      insert into USERS(login, email, password)
        values (${item.login}, ${item.email}, ${item.password})
        returning *;
    `
      .then((userList) => {
        if (userList[0]) {
          return this.mapUser(userList[0]);
        }
        throw new Error('Ошибка на стороне базы данных.');
      })
      .catch(() => {
        throw new Error('Пользователь уже существует.');
      });
  }

  public check(item: User): Promise<Response> {
    return this.sql<RawUser[]>`
      select * from USERS
        where login = ${item.login} and password = ${item.password};
    `
      .then((userList) => {
        if (userList[0]) {
          return { user: this.mapUser(userList[0]) };
        }
        throw new Error('Пользователь не существует.');
      })
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
  }

  public update(item: UID<User>): Promise<UID<Omit<User, 'password'>>> {
    if (item.item.email) {
      return this.sql<RawUser[]>`
        update USERS
        set login = ${item.item.login}, email = ${item.item.email}, password = ${item.item.password}
        where user_id = ${item.id}
        returning *;
      `
        .then((userList) => {
          if (userList[0]) {
            return this.mapUser(userList[0]);
          }
          throw new Error('Ошибка на стороне базы данных.');
        })
        .catch(() => {
          throw new Error('Ошибка на стороне базы данных.');
        });
    } else {
      return this.sql<RawUser[]>`
        update USERS
        set login = ${item.item.login}, password = ${item.item.password}
        where user_id = ${item.id}
        returning *;
      `
        .then((userList) => {
          if (userList[0]) {
            return this.mapUser(userList[0]);
          }
          throw new Error('Ошибка на стороне базы данных.');
        })
        .catch(() => {
          throw new Error('Ошибка на стороне базы данных.');
        });
    }
  }

  public async delete(id: number): Promise<void> {
    await this.sql`
      delete from USERS
        where user_id = ${id};
    `;
  }
}

export class LinkRepository
  implements ReadableRepository<Link, string>, CheckableRepository<Link, UID<Link>>
{
  private sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  private mapLink(raw: RawLink): UID<Link> {
    return {
      id: raw.link_id,
      item: {
        full_link: raw.full_link,
        type: raw.type,
        short_id: raw.short_id,
        has_expire: raw.expire !== null,
        expire: raw.expire ? raw.expire : undefined,
        has_metadata: raw.name !== null && raw.description !== null,
        name: raw.name ? raw.name : undefined,
        description: raw.description ? raw.description : undefined,
        create_date: raw.create_date,
        update_date: raw.update_date ? raw.update_date : undefined,
        owner: raw.owner,
      },
    };
  }

  public create(item: Link): Promise<UID<Link>> {
    const columns = ['full_link', 'type', 'short_id', 'owner'];
    const values = [item.full_link, item.type, item.short_id!, item.owner];

    if (item.has_expire) {
      columns.push('expire');
      values.push(item.expire!);
    }

    if (item.has_metadata && item.name && item.description) {
      columns.push('name', 'description');
      values.push(item.name, item.description);
    }

    return this.sql.unsafe<RawLink[]>(`
      insert into LINKS(${columns.join(', ')})
        values (${values.map((v) => "'" + v + "'").join(', ')})
        returning *;
    `).then((linkList) => {
        if (linkList[0]) {
          return this.mapLink(linkList[0]);
        }
        throw new Error('Ошибка на стороне базы данных.');
      })
      .catch(() => {
        throw new Error('Ссылка уже существует.');
      });
  }

  public read(id: UID<Link>['id']): Promise<UID<Link>> {
    return this.sql<RawLink[]>`
      select * from LINKS
        where link_id = ${id};
    `.then((linkList) => {
        if (linkList[0]) {
          return this.mapLink(linkList[0]);
        }
        throw new Error('Ссылка не найдена.');
      })
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
  }

  public readAll(owner: string): Promise<UID<Link>[]> {
    return this.sql<RawLink[]>`
      select * from LINKS
        where owner = ${owner};
    `.then((linkList) => linkList.map((link) => this.mapLink(link)))
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
  }

  public check(item: Link): Promise<UID<Link>> {
    switch (item.type) {
      case 'short':
        return this.sql<RawLink[]>`
          select * from LINKS
            where short_id = ${item.short_id!};`.then((linkList) => {
              if (linkList[0]) {
                return this.mapLink(linkList[0]);
              }
              throw new Error('Ссылка не найдена.');
            })
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
      case 'named':
        return this.sql<RawLink[]>`
          select * from LINKS
            where short_id = ${item.short_id!} and owner = ${item.owner};`.then((linkList) => {
              if (linkList[0]) {
                return this.mapLink(linkList[0]);
              }
              throw new Error('Ссылка не найдена.');
            })
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
      default:
        throw new Error('Неверный тип ссылки.');
    }
  }

  public update(item: UID<Link>): Promise<UID<Link>> {
    return this.sql.unsafe<RawLink[]>(`
      update LINKS
        set update_date = now(), full_link = '${item.item.full_link}', type = '${item.item.type}', short_id = '${item.item.short_id!}'${ item.item.has_expire ? ", expire = '" + item.item.expire + "'" : ""}, name = ${item.item.has_metadata ? `'${item.item.name}'` : "null"}, description = ${item.item.has_metadata ? `'${item.item.description}'` : "null"}
        where link_id = ${item.id}
        returning *;
    `).then((linkList) => {
        if (linkList[0]) {
          return this.mapLink(linkList[0]);
        }
        throw new Error('Ошибка на стороне базы данных.');
      })
      .catch(() => {
        throw new Error('Ошибка на стороне базы данных.');
      });
  }

  public async delete(id: number): Promise<void> {
    await this.sql`
      delete from LINKS
        where link_id = ${id};
    `;
  }
}