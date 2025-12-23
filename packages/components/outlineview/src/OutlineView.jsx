//OutlineView.jsx
import { useAtomValue } from "jotai";
import { outlineAtom } from "./outlineAtom";
import { Box, Flex, Heading, Text, ScrollArea } from "ui";

export default function OutlineView({ onSelectItem }) {
	const outline = useAtomValue(outlineAtom);

	return (
		<ScrollArea className='p-2 bg-gray-900 text-white border-l border-gray-700 h-full'>
			<Box className="p-2">
				<Heading as="h6" className='text-lg font-bold mb-2'>Outline</Heading>
				{outline.length === 0 ? (
					<Text size="sm" className='text-gray-400'>No symbols found.</Text>
				) : (
					<Flex direction="column" gap={1}>
						{outline.map((item, idx) => (
							<Flex
								key={idx}
								className='text-sm cursor-pointer hover:bg-gray-800 px-2 py-1 rounded'
								onClick={() => onSelectItem?.(item)}
								gap={1}
							>
								<Text as="span" className='font-mono text-yellow-400'>{item.type}</Text>
								<Text as="span" className='text-blue-300'>{item.name}</Text>
								<Text as="span" className='text-gray-500'>@ line {item.line}</Text>
							</Flex>
						))}
					</Flex>
				)}
			</Box>
		</ScrollArea>
	);
}
