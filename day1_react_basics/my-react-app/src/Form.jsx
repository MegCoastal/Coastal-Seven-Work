import { useForm } from "react-hook-form";

function AppForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    alert("Form submitted!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("firstname", {
          required: "First name is required"
        })}
        placeholder="First name"
      />
      <p>{errors.firstname?.message}</p>

      <input
        {...register("lastname", {
          required: "Last name is required"
        })}
        placeholder="Last name"
      />
      <p>{errors.lastname?.message}</p>

      <input
        {...register("age", {
          required: "Age is required",
          min: {
            value: 1,
            message: "Age must be greater than 0"
          },
          pattern: {
            value: /^[0-9]+$/,
            message: "Age must be a number"
          }
        })}
        placeholder="Age"
      />
      <p>{errors.age?.message}</p>

      <button type="submit">Submit</button>
    </form>
  );
}

export default AppForm;