import React from 'react';
import firebase from '../lib/firebaseClient';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import Link from 'next/link'

type FormData = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
	const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();
  const router = useRouter();

	  const onSubmit = async (data: FormData) => {
			try {
				await firebase.auth().signInWithEmailAndPassword(data.email, data.password);
				// router.push('/supplements'); // サプリ一覧画面へ遷移
				router.push('/'); // サプリ一覧画面ないのでTOPへ遷移
			} catch (error) {
				console.error(error);
			}
		};

  return (
    <div className='flex h-screen bg-black justify-center items-center'>
      <form className='flex w-96 flex-col gap-6 rounded-sm bg-gray-500 px-16 py-10' onSubmit={handleSubmit(onSubmit)}>
        <div className='flex flex-col grow'>
          <label className='text-[12px] flex w-24'>Email:</label>
          <input className='text-black p-2' type="email"{...register("email",{ required: true })} />
          {errors.email && <span>This field is required</span>}
        </div>
        <div className='flex flex-col grow'>
          <label className='text-[12px] flex w-24'>Password:</label>
          <input className='text-black p-2' type="text" {...register("password",{ required: true })} />
          {errors.password && <span>This field is required</span>}
        </div>
        <div className='self-end flex gap-2 text-normal leading-none'>
          <button className="py-1 px-2 rounded-sm bg-orange-300" type="submit">ログイン</button>
          <Link href="/signup" className="py-1 px-2 rounded-sm border border-orange-300">新規登録</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
