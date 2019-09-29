import { AddressInfo } from "net";

import { startServer } from "../startServer";

module.exports = async () => {
  const app = await startServer();
  const { port } = app.address() as AddressInfo;

  console.log("before", port);

  process.env.TEST_HOST = `http://127.0.0.1:${port}`;
};
