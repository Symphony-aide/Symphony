import { useSetAtom } from "jotai";
import React, { type JSX, useEffect } from "react";

import { createClient } from "./src/services/client";
import { isTauri } from "./src/services/commands";
import { clientState } from "./src/state";

/*
 * Retrieve the authentication token
 */
const getToken = async (): Promise<string | null> => {
  if (isTauri) {
    return "symphony_token";
  } else {
    // Or query the URL to get the token
    return new URL(location.toString()).searchParams.get("token");
  }
};

/**
 * Handles the connection client
 * @returns {null} The root client element
 */
const ClientRoot = (): null => {
  const setClient = useSetAtom(clientState);

  useEffect(() => {
    // Retrieve the token and then create a new client
    void getToken().then(async (token) => {
      if (token !== null) {
        const client = await createClient(token);

        // Wait until it's connected
        void client.whenConnected().then(() => {
          setClient(client);
        });
      }
    });
  }, [setClient]);

  return null;
};

const App = (): JSX.Element => {
  return (
    <div>
      <ClientRoot />
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>Hello World!</h1>
        <p>The Symphony app is running with a minimal UI.</p>
      </div>
    </div>
  );
};

export default App;
