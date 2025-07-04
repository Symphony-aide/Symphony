import Configuration from "../utils/config";

import { Client } from "./clients/client.types";
import { isTauri } from "./commands";

export const createClient = async (token: string): Promise<Client> => {
	if (isTauri) {
		const { TauriClient } = await import("./clients/tauri");
		const config = new Configuration(null, null, 1, token);
		return new TauriClient(config);
	} else {
		const { HTTPClient } = await import("./clients/http");
		// TODO: This is pointing to localhost for now, it will eventually be configured by the user
		const config = new Configuration(
			"http://localhost:50010",
			`ws://localhost:50010/websockets?token=${token}&state_id=1`,
			1,
			token
		);
		return new HTTPClient(config);
	}
};
