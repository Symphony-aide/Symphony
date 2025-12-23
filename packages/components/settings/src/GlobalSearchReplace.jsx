//GlobalSearchReplace.jsx
import React, { useState } from 'react';
import { Input, Button, Flex } from "ui";

export default function GlobalSearchReplace({ onReplaceAll }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [replaceTerm, setReplaceTerm] = useState('');

	return (
		<Flex align="center" gap={2} className='mb-4'>
			<Input
				type='text'
				value={searchTerm}
				onChange={e => setSearchTerm(e.target.value)}
				placeholder='Search'
				className='bg-gray-700 text-white w-40'
			/>
			<Input
				type='text'
				value={replaceTerm}
				onChange={e => setReplaceTerm(e.target.value)}
				placeholder='Replace'
				className='bg-gray-700 text-white w-40'
			/>
			<Button
				onClick={() => onReplaceAll(searchTerm, replaceTerm)}
				className='bg-green-600 hover:bg-green-500'
				size="sm"
			>
				Replace All
			</Button>
		</Flex>
	);
}
