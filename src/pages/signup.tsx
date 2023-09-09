import React from 'react';
import firebase from '../lib/firebaseClient';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

type FormData = {
  email: string;
  password: string;
};

const SignupPage: React.FC = () => {
	const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();
  const router = useRouter();

	  const onSubmit = async (data: FormData) => {
			try {
				await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
				// router.push('/supplements'); // サプリ一覧画面へ遷移
				router.push('/'); // サプリ一覧画面ないのでTOPへ遷移
			} catch (error) {
				console.error(error);
			}
		};

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Email:</label>
          <input  className='text-black' type="email"{...register("email",{ required: true })} />
          {errors.email && <span>This field is required</span>}
        </div>
        <div>
          <label>Password:</label>
          <input className='text-black' type="text" {...register("password",{ required: true })} />
          {errors.password && <span>This field is required</span>}
        </div>
        <button type="submit">アカウント作成</button>
      </form>
    </div>
  );
};

export default SignupPage;
