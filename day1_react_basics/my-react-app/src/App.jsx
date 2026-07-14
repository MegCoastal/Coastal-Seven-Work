import { useState } from 'react';
import './App.css';
import AppForm from './Form.jsx'

function App() {
  const products = [
    { id: 1, name: "tv" },
    { id: 2, name: "keyboard" },
    { id: 3, name: "mouse" }
  ];

  function Product( props ) {
    return (
      <h2>
        {props.id} - {props.name}
      </h2>
    );
  }

  function Shoot() {
    alert("Goal!");
  }
  function MyForm() {
  const [inputs, setInputs] = useState({});

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setInputs(values => ({...values, [name]: value}))
  }

  return (
    <form>
      <label>First name:
      <input 
        type="text" 
        name="firstname" 
        value={inputs.firstname} 
        onChange={handleChange}
      />
      </label>
      <label>Last name:
        <input 
          type="text"
          name="lastname" 
          value={inputs.lastname} 
          onChange={handleChange}
        />
      </label>
      <p>Current values: {inputs.firstname} {inputs.lastname}</p>
    </form>
  )
}

  return (
    <div>
      <div>
      {products.map(product => (
        <Product
          key={product.id}
          id={product.id}
          name={product.name}
        />
      ))}

      <button onClick={Shoot}>
        Shoot
      </button>
    </div>
    <br/>
    <div>
      <MyForm/>
    </div> <AppForm/> </div>

  );
}

export default App;
