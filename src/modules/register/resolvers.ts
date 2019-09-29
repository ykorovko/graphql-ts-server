import * as yup from "yup";
import * as bcryptjs from "bcryptjs";

import { ResolveMap } from "../../types/graphql-utils";
import { GQL } from "../../types/schema";
import { Users } from "../../entity/Users";
import { validationErrors } from "../../utils/validationErrors";
import { createConfirmationEmailLink } from "../../utils/createConfirmationEmailLink";
import {
  invalidEmail,
  duplicateEmail,
  emailNotLongEnough,
  passwordNotLongEnough
} from "./errorMessages";

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: yup
    .string()
    .min(3, passwordNotLongEnough)
    .max(255)
});

export const resolvers: ResolveMap = {
  Query: {
    bye: () => "bye"
  },

  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments,
      { redis, url }
    ) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (error) {
        return validationErrors(error);
      }

      const { email, password } = args;

      const userExists = await Users.findOne({
        where: { email },
        select: ["id"]
      });

      if (userExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const user = Users.create({
        email,
        password: hashedPassword
      });

      console.log("user :", user);

      await user.save();

      await createConfirmationEmailLink(url, user.id, redis);

      return null;
    }
  }
};
