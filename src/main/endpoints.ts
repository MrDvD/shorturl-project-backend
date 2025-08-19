import { FastifyInstance, FastifyRequest } from 'fastify';
import { connectPostgres } from './postgres';
import { Link, User } from '../abstracts/types';
import { LinkRepository, UserRepository } from '../implementations/cruds';
import { hash } from '../implementations/generators';

const sql = connectPostgres();
const userRepository = new UserRepository(sql);
const linkRepository = new LinkRepository(sql);

export function initEndpoints(fastify: FastifyInstance) {
  initEnterEntrypoints(fastify);
  initLinkEntrypoints(fastify);
  initRedirectEntrypoints(fastify);
}

export function initEnterEntrypoints(fastify: FastifyInstance): void {
  fastify.route({
    method: 'POST',
    url: '/register',
    handler: async function (
      request: FastifyRequest<{
        Body: { login: string; email: string; password: string };
      }>,
      reply
    ) {
      const { login, email, password } = request.body;
      const newUser: User = {
        login: login,
        email: email,
        password: password,
      };
      try {
        const registeredUser = await userRepository.create(newUser);
        // reply.setCookie('login', registeredUser.item.login, {
        //   // httpOnly: true,
        //   // signed: true,
        //   sameSite: "none",
        // });
        reply.code(201).send(registeredUser);
      } catch {
        reply.code(403).send({
          error: "Couldn't register a new user with these credentials.",
        });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/login',
    handler: async function (
      request: FastifyRequest<{
        Body: { login: string; email: string; password: string };
      }>,
      reply
    ) {
      const { login, password } = request.body;
      const newUser: User = {
        login: login,
        password: password,
      };
      try {
        const result = await userRepository.check(newUser);
        fastify.log.info(`User ${result.user.item.login} logged in successfully.`);
        // reply.setCookie('login', result.user.item.login, {
        //   // httpOnly: true,
        //   // signed: true,
        //   sameSite: "none",
        //   secure: true,
        // });
        reply.code(200).send(result);
      } catch {
        reply.code(403).send({
          error: "Couldn't login with these credentials.",
        });
      }
    },
  });
}


function initLinkEntrypoints(fastify: FastifyInstance): void {
  fastify.route({
    method: 'GET',
    url: '/v1/:login/links',
    handler: async function (
      request: FastifyRequest<{
        Params: { login: string };
      }>,
      reply
    ) {
      const login = request.params.login;
      // const userId = request.cookies.login;
      // if (!userId || userId !== login) {
      //   reply.code(401).send({ error: 'Unauthorized' });
      //   return;
      // }
      try {
        const readLinks = await linkRepository.readAll(login);
        reply.code(200).send(readLinks);
      } catch (error) {
        reply.code(500).send({ error: 'Failed to retrieve links' });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/v1/link/:id',
    handler: async function (
      request: FastifyRequest<{
        Params: { id: number };
      }>,
      reply
    ) {
      const id = request.params.id;
      // const userId = request.cookies.login;
      try {
        const link = await linkRepository.read(id);
        // if (!link || link.item.owner !== userId) {
        //   reply.code(401).send({ error: 'Unauthorized' });
        //   return;
        // }
        reply.code(200).send(link);
      } catch (error) {
        reply.code(500).send({ error: 'Failed to retrieve link' });
      }
    },
  });

  fastify.route({
    method: 'POST',
    url: '/v1/generate-url',
    handler: async function (
      request: FastifyRequest<{
        Body: Link;
      }>,
      reply
    ) {
      const link: Link = request.body;
      // const userId = request.cookies.login;
      // if (!userId || !link.owner || link.owner !== userId) {
      //   reply.code(401).send({ error: 'Unauthorized' });
      //   return;
      // }

      try {
        if (link.type === 'short') {
          fastify.log.info(`Generating short ID for URL: ${link.full_link}`);
          link.short_id = await hash(link.full_link);
          fastify.log.info(`Generated short ID: ${link.short_id}`);
        }
        const createdLink = await linkRepository.create(link);
        reply.code(201).send(createdLink);
      } catch (error) {
        fastify.log.error(`Error creating link: ${error}`);
        reply.code(500).send({ error: 'Failed to create link' });
      }
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/v1/link/:id/update',
    handler: async function (
      request: FastifyRequest<{
        Body: Link;
        Params: { id: number };
      }>,
      reply
    ) {
      const { id } = request.params;
      const item = request.body;
      // const userId = request.cookies.login;

      try {
        // const link = await linkRepository.read(id);
        // fastify.log.info(`User ID from cookie: ${userId}, Link owner: ${link?.item.owner}`);
        // if (!link || link.item.owner !== userId) {
        //   reply.code(401).send({ error: 'Unauthorized' });
        //   return;
        // }
        if (item.type === 'short') {
          item.short_id = await hash(item.full_link);
        }
        const updatedLink = await linkRepository.update({ id, item });
        reply.code(200).send(updatedLink);
      } catch (error) {
        fastify.log.error(`Error updating link: ${error}`);
        reply.code(500).send({ error: error ?? 'Failed to update link' });
      }
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/v1/remove-link',
    handler: async function (
      request: FastifyRequest<{
        Body: { id: number };
      }>,
      reply
    ) {
      const { id } = request.body;
      // const login = request.cookies.login;

      try {
        const link = await linkRepository.read(id);
        // if (!link || link.item.owner !== login) {
        //   reply.code(401).send({ error: 'Unauthorized' });
        //   return;
        // }
        await linkRepository.delete(id);
        reply.code(204).send();
      } catch (error) {
        reply.code(500).send({ error: error ?? 'Failed to delete link' });
      }
    },
  });
}

export function initRedirectEntrypoints(fastify: FastifyInstance): void {
  fastify.route({
    method: 'GET',
    url: '/v1/:shortId',
    handler: async function (
      request: FastifyRequest<{
        Params: { shortId: string };
      }>,
      reply
    ) {
      const shortId = request.params.shortId;
      const tempLink = { short_id: shortId, type: "short" } as Link;
      try {
        const link = await linkRepository.check(tempLink);
        fastify.log.info(`im here`);
        // if (!link) {
        //   reply.code(404).send({ error: 'Link not found' });
        //   return;
        // }
        reply.redirect(link.item.full_link);
      } catch (error) {
        reply.code(500).send({ error: 'Failed to redirect' });
      }
    },
  });

  fastify.route({
    method: 'GET',
    url: '/:owner/:shortId',
    handler: async function (
      request: FastifyRequest<{
        Params: { shortId: string; owner: string };
      }>,
      reply
    ) {
      const shortId = request.params.shortId;
      const owner = request.params.owner;
      const tempLink = { short_id: shortId, type: "named", owner: owner } as Link;
      try {
        const link = await linkRepository.check(tempLink);
        // if (!link) {
        //   reply.code(404).send({ error: 'Link not found' });
        //   return;
        // }
        reply.redirect(link.item.full_link);
      } catch (error) {
        reply.code(500).send({ error: 'Failed to redirect' });
      }
    },
  });
}