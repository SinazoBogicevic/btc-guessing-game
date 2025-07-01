/// <reference types="jest" />

process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID = "dummy";
process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY = "dummy";
process.env.NEXT_PUBLIC_AWS_REGION = "us-east-1";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { mockClient } from "aws-sdk-client-mock";
import { getOrCreateUser, resolveGuess, saveGuess } from "../src/lib/dynamodb";
import { UserGameState } from "../src/types";

const ddbMock = mockClient(DynamoDBClient);
const docMock = mockClient(DynamoDBDocumentClient);

describe("dynamodb.ts", () => {
  const userId = "test-user";
  const baseUser: UserGameState = {
    userId,
    score: 0,
    activeGuess: null,
    guessPlacedAt: null,
    priceAtGuess: null,
    resolvedAt: null,
    lastResult: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    ddbMock.reset();
    docMock.reset();
  });

  describe("getOrCreateUser", () => {
    it("returns existing user if found", async () => {
      docMock.on(GetCommand).resolves({ Item: baseUser });
      const user = await getOrCreateUser(userId);
      expect(user).toEqual(baseUser);
    });

    it("creates and returns new user if not found", async () => {
      docMock.on(GetCommand).resolves({});
      docMock.on(PutCommand).resolves({});
      const user = await getOrCreateUser(userId);
      expect(user.userId).toBe(userId);
      expect(user.score).toBe(0);
      expect(user.activeGuess).toBeNull();
    });
  });

  describe("saveGuess", () => {
    it("updates user with new guess", async () => {
      docMock.on(UpdateCommand).resolves({});
      await expect(saveGuess(userId, "up", 50000)).resolves.toBeUndefined();
      expect(docMock.commandCalls(UpdateCommand).length).toBe(1);
      const call = docMock.commandCalls(UpdateCommand)[0].args[0];
      expect(call.input.Key).toEqual({ userId });
      expect(call.input.UpdateExpression).toContain("activeGuess");
    });
  });

  describe("resolveGuess", () => {
    it("returns no-active-guess if user has no active guess", async () => {
      docMock.on(GetCommand).resolves({ Item: baseUser });
      const result = await resolveGuess(userId, 51000);
      expect(result).toBe("no-active-guess");
    });

    it("throws if not enough time has elapsed", async () => {
      const user: UserGameState = {
        ...baseUser,
        activeGuess: "up",
        priceAtGuess: 50000,
        guessPlacedAt: new Date(Date.now() - 30 * 1000).toISOString(),
      };
      docMock.on(GetCommand).resolves({ Item: user });
      await expect(resolveGuess(userId, 51000)).rejects.toThrow(
        "Too early to resolve"
      );
    });

    it("resolves as win if guess is correct", async () => {
      const user: UserGameState = {
        ...baseUser,
        activeGuess: "up",
        priceAtGuess: 50000,
        guessPlacedAt: new Date(Date.now() - 61 * 1000).toISOString(),
      };
      docMock.on(GetCommand).resolves({ Item: user });
      docMock.on(UpdateCommand).resolves({});
      const result = await resolveGuess(userId, 51000);
      expect(result).toBe("win");
    });

    it("resolves as loss if guess is incorrect", async () => {
      const user: UserGameState = {
        ...baseUser,
        activeGuess: "down",
        priceAtGuess: 50000,
        guessPlacedAt: new Date(Date.now() - 61 * 1000).toISOString(),
      };
      docMock.on(GetCommand).resolves({ Item: user });
      docMock.on(UpdateCommand).resolves({});
      const result = await resolveGuess(userId, 51000);
      expect(result).toBe("loss");
    });
  });
});
