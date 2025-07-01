import { UserGameState } from "@/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const TABLE_NAME = "users";

if (
  !process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ||
  !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
) {
  throw new Error("AWS credentials not configured");
}

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});
const docClient = DynamoDBDocumentClient.from(client);

export async function getOrCreateUser(userId: string): Promise<UserGameState> {
  const getRes = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  if (getRes.Item) {
    return getRes.Item as UserGameState;
  }

  const newUser: UserGameState = {
    userId,
    score: 0,
    activeGuess: null,
    guessPlacedAt: null,
    priceAtGuess: null,
    resolvedAt: null,
    lastResult: null,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: newUser,
    })
  );

  return newUser;
}

export async function saveGuess(
  userId: string,
  guess: "up" | "down",
  priceAtGuess: number
) {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: `SET activeGuess = :g, guessPlacedAt = :t, priceAtGuess = :p, resolvedAt = :null, lastResult = :null`,
      ExpressionAttributeValues: {
        ":g": guess,
        ":t": now,
        ":p": priceAtGuess,
        ":null": null,
      },
    })
  );
}

export async function resolveGuess(
  userId: string,
  currentPrice: number
): Promise<"win" | "loss" | "no-active-guess"> {
  const user = await getOrCreateUser(userId);

  if (
    !user.activeGuess ||
    user.priceAtGuess === null ||
    user.guessPlacedAt === null
  ) {
    return "no-active-guess";
  }

  const guessTime = new Date(user.guessPlacedAt);
  const now = new Date();
  const secondsSinceGuess = (now.getTime() - guessTime.getTime()) / 1000;

  if (secondsSinceGuess < 60) {
    throw new Error("Too early to resolve guess: 60 seconds have not passed");
  }

  if (currentPrice === user.priceAtGuess) {
    throw new Error(
      "Price has not changed since guess was made; cannot resolve yet"
    );
  }

  const guess = user.activeGuess;
  let won = false;

  if (guess === "up" && currentPrice > user.priceAtGuess) won = true;
  if (guess === "down" && currentPrice < user.priceAtGuess) won = true;

  const newScore = user.score + (won ? 1 : -1);
  const result: "win" | "loss" = won ? "win" : "loss";

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: `SET 
        score = :score, 
        activeGuess = :null, 
        guessPlacedAt = :null, 
        priceAtGuess = :null, 
        resolvedAt = :resolved, 
        lastResult = :result`,
      ExpressionAttributeValues: {
        ":score": newScore,
        ":null": null,
        ":resolved": new Date().toISOString(),
        ":result": result,
      },
    })
  );

  return result;
}

export { docClient, TABLE_NAME };
