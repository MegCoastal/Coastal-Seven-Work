import Button from './Button';

const onPlayMovie =()=>alert('Playing!')
const onUploadImage = ()=>alert('Uploading!')

export default function Toolbar(){
  return(
    <div>
    <Button onClick = {onPlayMovie}>
      Play Movie
    </Button>
    <Button onClick = {onUploadImage}>
      Upload Image
    </Button>
    </div>
  );
}