import { getConnection } from "typeorm";

module.exports = async () => {
  console.log("Teardown !!!", process.env.TEST_HOST);

  await getConnection().close();
  // await app.close();
};
