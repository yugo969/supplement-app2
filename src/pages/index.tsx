import Image from 'next/image'
import firebase from '../lib/firebaseClient';
import { Inter } from 'next/font/google'
import { useForm } from 'react-hook-form';
import { addSupplement } from '@/lib/firestore'
import { useState } from 'react';

type FormData = {
  supplement_name: string;
  dosage: string;
  dosage_unit: string;
  intake_amount: string;
  intake_unit: string;
  timing_morning: boolean;
  timing_noon: boolean;
  timing_night: boolean;
};

export default function Home() {
  const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSupplement=(data:FormData)=>{
    addSupplement(data);
    setIsModalOpen(false)
  }

  return (
    <>
      <p>ここを一覧にしよう</p>


      <button onClick={() => setIsModalOpen(true)}>サプリ追加</button>

      <div>
        <form onSubmit={handleSubmit(handleAddSupplement)}>
          <label htmlFor="supplement-name">サプリ名</label>
          <input className='text-black' type="text" id="supplement-name" {...register("supplement_name")}/>
        </form>
        <button type="submit">サプリ追加</button>
      </div>

      {isModalOpen && (
        <div className="modal w-full fixed flex grow justify-center items-center">
          <form
            className='flex flex-col w-fit py-16 gap-6 px-20 bg-slate-400'
            onSubmit={handleSubmit(handleAddSupplement)}>

            <div className='flex flex-col'>
              <label htmlFor="supplement-name">サプリ名</label>
              <input type="text" id="supplement-name" {...register("supplement_name")} />
            </div>

            <div>
              <label htmlFor="dosage">用量</label>
              <div className='flex gap-2'>
                <input type="text" id="dosage" {...register("dosage")} />
                <select {...register("dosage_unit")}>
                  <option value="個数">個</option>
                  <option value="グラム">グラム</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="intake-amount">一回の摂取量</label>
              <div className='flex gap-2'>
                <input type="text" id="intake-amount" {...register("intake_amount")} />
                <select {...register("intake_unit")}>
                  <option value="個数">個</option>
                  <option value="グラム">グラム</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div>
              <label>摂取タイミング:</label>
              <div className='flex  gap-5'>
                <label><input type="checkbox" {...register("timing_morning")} />朝</label>
                <label><input type="checkbox" {...register("timing_noon")} />昼</label>
                <label><input type="checkbox" {...register("timing_night")} />夜</label>
              </div>
            </div>

            {/* 画像登録の部分は省略していますが、必要に応じて追加してください。 */}

            <button className="p-1 rounded-sm bg-orange-300" type="submit">登録</button>
            <button onClick={() => setIsModalOpen(false)}>閉じる</button>
          </form>
        </div>
      )}
    </>
  )
}
