import { useState } from 'react';
import { Button } from 'ui';

function App() {
  const [count, setCount] = useState(0);

  return (
   <h1 className='text-2xl font-bold bg-red-500'>Hello World</h1>
  );
}

export default App;
