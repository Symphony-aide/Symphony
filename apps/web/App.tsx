// @ts-ignore
import { useSetAtom } from "jotai";
// @ts-ignore
import React, { type JSX, useEffect } from "react";
import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { system, ThemeProvider } from "@symphony/shared";
import { EditorInput } from "@symphony/code-editor";

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
		void getToken().then(async token => {
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
		<ThemeProvider value={system}>
			<ClientRoot />
			<Container maxW="container.md" py={8}>
				<VStack gap={8} align="stretch">
					<Box textAlign="center">
						<Heading as="h1" size="xl" color="primary.solid" mb={4}>
							Symphony
						</Heading>
						<Text fontSize="lg">
							Welcome to Symphony with custom themed components
						</Text>
					</Box>
					
					<VStack gap={6} align="stretch">
						<EditorInput 
							label="Title" 
							placeholder="Enter a title..."
						/>
						
						<EditorInput 
							label="Description" 
							placeholder="Enter a description..."
							multiline
						/>
						
						<Button 
							colorPalette="secondary"
							variant="solid"
							alignSelf="flex-start"
							mt={4}
						>
							Submit
						</Button>
					</VStack>
				</VStack>
			</Container>
		</ThemeProvider>
	);
};

export default App;
