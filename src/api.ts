import { defineOperation, emptyBody } from "flowtract";
import { z } from "zod";

export const ErrorBody = z.object({ message: z.string() });
export const ItemBody = z.object({ id: z.string(), name: z.string() });

export const Login = defineOperation({
  id: "starter.login",
  method: "POST",
  path: "/login",
  request: { body: z.object({ username: z.string(), password: z.string() }) },
  responses: {
    200: { body: z.object({ csrf: z.string() }) },
    401: { body: ErrorBody },
  },
});

export const CreateItem = defineOperation({
  id: "starter.items.create",
  method: "POST",
  path: "/items",
  auth: "session",
  request: { body: z.object({ name: z.string().min(1) }) },
  responses: {
    201: { body: ItemBody },
    403: { body: ErrorBody },
  },
});

export const GetItem = defineOperation({
  id: "starter.items.get",
  method: "GET",
  path: "/items/{id}",
  auth: "session",
  request: { pathParams: z.object({ id: z.string() }) },
  responses: {
    200: { body: ItemBody },
    404: { body: ErrorBody },
  },
});

export const DeleteItem = defineOperation({
  id: "starter.items.delete",
  method: "DELETE",
  path: "/items/{id}",
  auth: "session",
  request: { pathParams: z.object({ id: z.string() }) },
  responses: {
    204: { body: emptyBody() },
    404: { body: ErrorBody },
  },
});

export const Logout = defineOperation({
  id: "starter.logout",
  method: "POST",
  path: "/logout",
  auth: "session",
  responses: {
    204: { body: emptyBody() },
    403: { body: ErrorBody },
  },
});

export const operations = [
  Login,
  CreateItem,
  GetItem,
  DeleteItem,
  Logout,
] as const;
