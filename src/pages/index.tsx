import Image from 'next/image'
import firebase from '../lib/firebaseClient';
import { Inter } from 'next/font/google'
import { useForm } from 'react-hook-form';
import { addSupplement, deleteSupplement, getSupplements, updateSupplement, uploadImage } from '@/lib/firestore'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MdDeleteForever, MdOutlineCancel } from "react-icons/md";
import resizeImage from '@/lib/resizeImage';

type FormData = {
  supplement_name: string;
  dosage: string;
  dosage_unit: string;
  intake_amount: string;
  intake_unit: string;
  timing_morning: boolean;
  timing_noon: boolean;
  timing_night: boolean;
  image?: FileList;
};

type SupplementData = FormData & {
  imageUrl: string;
};

const maxWidth = 552;
const maxHeight =366;

export default function Home() {
  const {
    register, handleSubmit, formState: { errors }, setValue
  } = useForm<FormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [selectedSupplement, setSelectedSupplement] = useState<null | any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      setIsLoggedIn(true);
      getSupplements().then(data => setSupplements(data));
    } else {
      setIsLoggedIn(false);
       router.push('/login'); // ログインページへリダイレクト
    }
  }, [router]);

  const handleLogout = async () => {
    await firebase.auth().signOut();
    setIsLoggedIn(false);
    router.push('/login');
  };

  const handleAddOrUpdateSupplement = async (data: FormData) => {
    let imageUrl = uploadedImage;
    if (data.image && data.image[0]) {
      imageUrl = await uploadImage(data.image[0]);
    }

    const supplementData = { ...data, imageUrl }; // 画像のURLを含むデータを作成
    if ('image' in supplementData) {
      delete supplementData.image; // imageキーを削除
    }

    if (selectedSupplement) {
      await updateSupplement(selectedSupplement.id, supplementData);
      setNotification('サプリ情報を更新しました');
    } else {
      await addSupplement(supplementData);
      setNotification('サプリ情報を追加しました');
    }

    setIsModalOpen(false);
    setSelectedSupplement(null);
    setUploadedImage(null); // リセット

    getSupplements().then(data => {
      setSupplements(data);
    //   setNotification('サプリ情報を追加しました');
    }).catch(() => {
      setNotification('サプリ情報の追加に失敗しました');
    });
  }

  const handleOpenUpdateModal = (supplement: SupplementData) => {

    setSelectedSupplement(supplement);
    setIsModalOpen(true);

    // 選択されたサプリの情報をフォームにセット
    setValue("supplement_name", supplement.supplement_name);
    setValue("dosage", supplement.dosage);
    setValue("dosage_unit", supplement.dosage_unit);
    setValue("intake_amount", supplement.intake_amount);
    setValue("intake_unit", supplement.intake_unit);
    setValue("timing_morning", supplement.timing_morning);
    setValue("timing_noon", supplement.timing_noon);
    setValue("timing_night", supplement.timing_night);
    // すでに登録されている画像URLをuploadedImageに設定
    setUploadedImage(supplement.imageUrl);
  }

  const handleDeleteSupplement = async (id: string) => {
    await deleteSupplement(id);
    getSupplements().then(data => {
      setSupplements(data);
      setNotification('サプリ情報を削除しました');
    }).catch(() => {
      setNotification('サプリ情報の削除に失敗しました');
    });
  }

  // サプリメント画像の操作
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (file) {
      resizeImage(file, maxWidth, maxHeight).then(resizedImageUrl => {
          setUploadedImage(resizedImageUrl);
      }).catch(error => {
          console.error("画像のリサイズに失敗しました:", error);
      });
    } else {
      console.error("ファイルが提供されていません");
    }
  };

  const handleImageDelete = () => {
    setUploadedImage(null);
  };

  const user = firebase.auth().currentUser;
  if (user) {
    console.log("ユーザーは認証されています")
  } else {
    console.log("ユーザーは認証されていません")
  }

  firebase.auth().currentUser;
  if (!isLoggedIn) <p>ログインしてください</p>


  return (
    <div className={`relative ${isModalOpen && "overflow-hidden"}`}>
      <div className='flex flex-col w-screen h-screen p-10 gap-6'>
        <div className='flex justify-between border-b p-6'>
          <h2 className='text-white text-lg'>サプリストック</h2>
          <div className='flex gap-6'>
            <button className="py-1 px-2 rounded-sm bg-orange-300" onClick={() => setIsModalOpen(true)}>サプリ追加</button>
            <button
              className="py-1 px-2 text-sm rounded-sm bg-gray-300"
              onClick={handleLogout}
            >ログアウト</button>
          </div>
        </div>

        {isLoggedIn && (
          <div className='flex flex-col'>
            <div className='flex flex-wrap gap-6'>
              {supplements.map((supplement) => (
                <div key={supplement.id} className="flex flex-col justify-between gap-6 w-60 py-6 px-6 rounded-lg border-4 border-orange-400 bg-zinc-50">
                  <div className='flex flex-col gap-2'>
                    {/* 画像を表示 */}
                    {supplement.imageUrl ? (

                      <div className="relative w-full h-auto aspect-[3/2]">
                        <Image
                          src={supplement.imageUrl}
                          alt={supplement.supplement_name}
                          fill
                          className="absolute inset-0 w-full h-full"
                          style={{
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    ) : (
                      <p className='flex justify-center items-center w-full h-[100px] bg-gray-400'>no-image</p>
                    )}

                    <h3 className='py-1 px-4 bg-orange-500 text-bold text-16px text-white'>{supplement.supplement_name}</h3>

                    <div>
                      <span className="text-[12px] border-b flex grow">用量</span>
                      <p>{supplement.dosage} {supplement.dosage_unit}</p>
                    </div>
                    <div>
                      <span className="text-[12px] border-b flex grow">一回の摂取量</span>
                      <p>{supplement.intake_amount} {supplement.intake_unit}</p>
                    </div>
                    <div className='flex flex-col gap-2'>
                      <span className="text-[12px] border-b flex grow">摂取タイミング</span>
                      <p className='flex gap-2 text-[12px]'>
                        {supplement.timing_morning && (<span className="rounded-full flex py-1 px-4 bg-orange-100">朝</span>)}
                        {supplement.timing_noon && <span className="rounded-full flex py-1 px-4 bg-orange-100">昼</span>}
                        {supplement.timing_night && <span className="rounded-full flex py-1 px-4 bg-orange-100">夜</span>}
                      </p>
                    </div>
                  </div>

                  <div className='flex gap-6 text-md self-end'>
                    <button className="py-1 px-2 rounded-sm bg-orange-300" onClick={() => handleOpenUpdateModal(supplement)}>編集</button>
                    <button className="py-1 px-2 text-sm rounded-sm bg-gray-300" onClick={() => handleDeleteSupplement(supplement.id)}>削除</button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        )}

      </div>
      {isModalOpen && (
        <div
          className="modal overscroll-none overflow-auto bg-black/50 w-screen h-screen absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center"
          onClick= {() =>{
            setIsModalOpen(false);
            setSelectedSupplement(null);
          }}
        >
          <form
            className='relative flex flex-col w-fit py-8 gap-6 px-20 bg-slate-400 rounded-lg'
            onSubmit={handleSubmit(handleAddOrUpdateSupplement)} onClick={(e) => e.stopPropagation()}>

            <div className="group relative w-full aspect-[3/2] bg-gray-200">
              {!uploadedImage ? (
                <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
                  add image
                  <input
                    type="file"
                    {...register("image")}
                    onChange={handleImageChange}
                    className="opacity-0 absolute inset-0 w-full h-full"
                  />
                </label>
              ) : (
                <div className="w-full h-full">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded"
                    fill
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                  <div className="relative w-full h-full opacity-0 transition duration-300 group-hover:opacity-100 bg-black/70">
                    <button
                      className="flex flex-col justify-center items-center gap-1 opacity-0 transition duration-300 group-hover:opacity-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-[22px] w-full h-full rounded"
                      onClick={handleImageDelete}
                    >
                      <MdDeleteForever size={60} />
                      <span className='text-[14px]'>削除</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className='flex flex-col'>
              <label htmlFor="supplement-name">サプリ名</label>
              <input type="text" id="supplement-name" {...register("supplement_name",{ required: true })} />
            </div>

            <div>
              <label htmlFor="dosage">用量</label>
              <div className='flex gap-2'>
                <input type="text" id="dosage" {...register("dosage")} />
                <select
                  defaultValue={""}
                  {...register("dosage_unit")}
                >
                  <option value="" disabled>単位</option>
                  <option value="錠">錠</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="intake-amount">一回の摂取量</label>
              <div className='flex gap-2'>
                <input type="text" id="intake-amount" {...register("intake_amount")} />
                <select
                  defaultValue={""}
                  {...register("intake_unit")}
                >
                  <option value="" disabled>単位</option>
                  <option value="錠">錠</option>
                  <option value="g">g</option>
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

            <button className="p-1 rounded-sm bg-orange-300" type="submit">
              {selectedSupplement ? '更新' : '登録'}
            </button>
            <button className='absolute right-4 top-4 w-8 h-8 rounded-full'
             onClick= {() =>{
                setIsModalOpen(false);
                setSelectedSupplement(null);
              }}><MdOutlineCancel size={32} /></button>
          </form>
        </div>
      )}
    </div>
  )
}
