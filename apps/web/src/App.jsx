import { useState } from 'react';
import './App.css';
import { Button } from 'ui';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className='space-y-8 p-8'>
      <h1 className='text-2xl font-bold'>Button Variants</h1>
      <div className='flex flex-wrap gap-4'>
        <Button>Default</Button>
        <Button variant='destructive'>Destructive</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='ghost'>Ghost</Button>
        <Button variant='link'>Link</Button>
      </div>

      <h2 className='text-xl font-bold'>Button Sizes</h2>
      <div className='flex flex-wrap items-center gap-4'>
        <Button size='sm'>Small</Button>
        <Button size='default'>Default</Button>
        <Button size='lg'>Large</Button>
        <Button size='icon'>🔔</Button>
      </div>

      <h2 className='text-xl font-bold'>Button States</h2>
      <div className='flex flex-wrap gap-4'>
        <Button disabled>Disabled</Button>
        <Button variant='destructive' disabled>
          Disabled Destructive
        </Button>
        <Button variant='outline' disabled>
          Disabled Outline
        </Button>
      </div>
    </div>
  );
}

export default App;
