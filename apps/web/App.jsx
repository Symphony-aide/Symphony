import { Button } from "ui";
import { Editor, ShortcutSettings } from "@symphony/code-editor";

function App() {
	return (
		<div className='h-screen w-screen bg-gray-900 p-4 grid grid-cols-2 gap-4'>
			<div className='border border-gray-700 rounded-lg p-2'>
				<Editor
					initialCode={`console.log("Hello World!");`}
					language='javascript'
					theme='vs-dark'
					onSave={code => console.log("Saved code:", code)}
					onRun={code => console.log("Run code:", code)}
				/>
			</div>
			<div className='border border-gray-700 rounded-lg p-2'>
				<ShortcutSettings />
			</div>
		</div>
	);
}

export default App;
