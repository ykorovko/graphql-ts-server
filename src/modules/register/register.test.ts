import * as faker from "faker";
import { request } from "graphql-request";
// import { Server as HttpServer } from "http";
// import { Server as HttpsServer } from "https";
// import { AddressInfo } from "net";
// import { getConnection } from "typeorm";
// import { startServer } from "../../startServer";
import { Users } from "../../entity/Users";
import {
  invalidEmail,
  duplicateEmail,
  emailNotLongEnough,
  passwordNotLongEnough
} from "./errorMessages";

// let app: HttpServer | HttpsServer;
const host = process.env.TEST_HOST as string;

const email = faker.internet.email();
const password = faker.internet.password();

const mutation = (e: string, p: string) => `
mutation {
	register(email: "${e}", password: "${p}") {
		path
		message
	}
}`;

/**
 * TODO:
 * - use a test `database` [Done]
 * - drop all data before every test [Done]
 * - run tests and the server altogether
 * - add hooks `beforeAll`, `beforeEach`, `afterAll` for creating and closing connection with database
 * - use `faker` instead of mocking user data
 * - make `hooks` work globally before and after each test
 */

describe("Register user", () => {
  // beforeAll(async () => {
  //   app = await startServer();

  //   const { port } = app.address() as AddressInfo;

  //   host = `http://127.0.0.1:${port}`;
  // });

  // afterAll(async () => {
  //   await getConnection().close();
  //   await app.close();
  // });

  test.only("Valid", async () => {
    const response = await request(host, mutation(email, password));
    expect(response).toEqual({ register: null });

    const users = await Users.find({ where: { email } });
    expect(users).toHaveLength(1);

    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);
  });

  test("Duplicate email", async () => {
    const { register } = await request(host, mutation(email, password));

    expect(register).toHaveLength(1);
    expect(register).toContainEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  test("Invalid email", async () => {
    const { register } = await request(host, mutation("a", password));

    expect(register).toContainEqual({
      path: "email",
      message: emailNotLongEnough
    });

    expect(register).toContainEqual({
      path: "email",
      message: invalidEmail
    });
  });

  test("Invalid password", async () => {
    const { register } = await request(host, mutation(email, "p"));

    expect(register).toContainEqual({
      path: "password",
      message: passwordNotLongEnough
    });
  });
});
