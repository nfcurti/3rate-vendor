import { MongoClient } from "mongodb";

const sanitizeHost = (host: string) => host.replace(/^\/+/, "");

const getMongoUri = () => {
  const user = process.env.MONGODB_USER?.trim();
  const password = process.env.MONGODB_PWD?.trim();
  const host = process.env.MONGODB_HOST?.trim();

  if (!user || !password || !host) return null;

  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${sanitizeHost(host)}`;
};

declare global {
  // eslint-disable-next-line no-var
  var _payohMongoClient: MongoClient | undefined;
}

export async function getMongoClient() {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error("MONGODB_NOT_CONFIGURED");
  }

  if (!global._payohMongoClient) {
    global._payohMongoClient = new MongoClient(uri);
    await global._payohMongoClient.connect();
  }

  return global._payohMongoClient;
}
