import './App.css'
import Toolbar from './components/Toolbar';
import Accordion from './components/Accordion'

function App() {
  return(
    <div>
    <Toolbar
    onPlayMovie ={()=>alert('Playing!')}
    onUploadImage = {()=>alert('Uploading!')}
    />
    <Accordion/>
    </div>
  );
}
export default App
