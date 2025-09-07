//App.jsx
import { Button } from "ui";
import { Editor } from "@symphony/code-editor";

function App() {
	return (
		<div className='h-screen w-screen bg-gray-900 text-white flex'>
			<Editor
				initialCode={`console.log("Hello World!");`}
				language='javascript'
				theme='vs-dark'
				onSave={code => console.log("Saved code:", code)}
				onRun={code => console.log("Run code:", code)}
				className='flex-1 overflow-auto'
			/>
		</div>
	);
}

export default App;
