import * as fs from "fs";
import * as path from "path";
import { GraphQLSchema } from "graphql";
import { GraphQLServer } from "graphql-yoga";
import { mergeSchemas, makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

import createTypeormConn from "./utils/createTypeormConn";

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

  const server = new GraphQLServer({
    schema: mergeSchemas({ schemas })
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
