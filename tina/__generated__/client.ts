import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ cacheDir: '/home/wunluv/DEV/eosclub/tina/__generated__/.cache/1772280759930', url: '/api/tina/graphql', token: '0000000000000000000000000000000000000000', queries,  });
export default client;
  