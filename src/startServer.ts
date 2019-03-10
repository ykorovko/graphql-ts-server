import * as fs from "fs";
import * as path from "path";
import * as Redis from "ioredis";
import { GraphQLSchema } from "graphql";
import { GraphQLServer } from "graphql-yoga";
import { mergeSchemas, makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

import createTypeormConn from "./utils/createTypeormConn";
import { Users } from "./entity/Users";

/**
 * TODO:
 *
 * - refactor merging schemas and types [6]
 * - change types generation lib for `graphql-code-generator` [6]
 */

export const startServer = async () => {
  const schemas: GraphQLSchema[] = [];
  const folders = fs.readdirSync(path.join(__dirname, "./modules"));

  folders.forEach(folder => {
    const { resolvers } = require(path.join(
      __dirname,
      `./modules/${folder}/resolvers`
    ));

    const typeDefs = importSchema(
      path.join(__dirname, `./modules/${folder}/schema.graphql`)
    );

    schemas.push(makeExecutableSchema({ resolvers, typeDefs }));
  });

  const redis = new Redis();

  const server = new GraphQLServer({
    schema: mergeSchemas({ schemas }),
    context: (request: any) => ({
      redis,
      url: request.protocol + "://" + request.get("host")
    })
  });

  // Endpoint for confirmation email
  server.express.get("/confirm/:id", async (req, res) => {
    const { id } = req.params;

    const userId = await redis.get(id);

    if (userId) {
      await Users.update({ id: userId }, { confirmed: true });

      res.send("Ok");
    } else {
      res.send("Invalid");
    }
  });

  // Creating Typeorm connection
  try {
    await createTypeormConn();
  } catch (e) {
    throw new Error(e);
  }

  console.log("process.env.NODE_ENV", process.env.NODE_ENV);

  const app = await server.start({
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });

  console.log("Server is running on localhost:4000");

  return app;
};
