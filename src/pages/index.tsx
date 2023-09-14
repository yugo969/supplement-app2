import Image from 'next/image'
import firebase from '@/lib/firebaseClient';
// import { Inter } from 'next/font/google'
import { useForm } from 'react-hook-form';
import { addSupplement, deleteSupplement, getSupplements, updateSupplement, uploadImage } from '@/lib/firestore'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MdAddAPhoto, MdDeleteForever, MdOutlineCancel, MdOutlineMedication, MdOutlineAddBox  } from "react-icons/md";
import resizeImage from '@/lib/resizeImage';
import { useNotification } from '@/lib/useNotification';

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
  const { showNotification } = useNotification();

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
      showNotification({ message: 'サプリ情報を編集しました' });
    } else {
      await addSupplement(supplementData);
      showNotification({ message: 'サプリ情報を追加しました' });
    }

    setIsModalOpen(false);
    setSelectedSupplement(null);
    setUploadedImage(null);

    getSupplements().then(data => {
      setSupplements(data);
    }).catch(() => {
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
      showNotification({ message: 'サプリ情報を削除しました' });
    }).catch(() => {
      showNotification({ message: 'サプリ情報の削除に失敗しました' });
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
      <button className="fixed flex flex-col justify-center items-center w-24 h-26 bottom-6 right-6 z-10 border-4 border-white/80 md:hidden text-xs shadow-xl pt-1 p-2 text-orange-950 font-semibold rounded-xl bg-orange-400" onClick={() => setIsModalOpen(true)}>
        <MdOutlineAddBox size={64} />
        <span>サプリ追加</span>
      </button>
      <div className='flex flex-col w-screen h-screen md:p-10 p-4 gap-6'>
        <div className='flex justify-between items-center border-b md:p-6 pb-3 px-0'>
          <h2 className='flex items-center gap-3 text-white md:text-lg text-md'><MdOutlineMedication size={32} /><span className='md:text-[32] font-bold'>サプリストック</span></h2>
          <div className='flex md:gap-6 gap-4'>
            <button className="py-1 md:px-4 px-3 text-bold rounded-md bg-orange-300 md:flex hidden" onClick={() => setIsModalOpen(true)}>サプリ追加</button>
            <button
              className="py-1 md:px-4 px-3 text-sm rounded-md bg-gray-300"
              onClick={handleLogout}
            >ログアウト</button>
          </div>
        </div>

        {isLoggedIn && (
          <div className='flex flex-col'>
            <div className='flex flex-wrap gap-6'>
              {supplements.map((supplement) => (
                <div key={supplement.id} className="flex flex-col justify-between gap-3 md:w-72 w-full pb-2 rounded-lg border-4 border-orange-400 bg-zinc-50">
                  <div className='flex flex-col'>
                    {/* 画像を表示 */}
                    {supplement.imageUrl ? (

                      <div className="relative w-full h-auto aspect-[3/2]">
                        <Image
                          src={supplement.imageUrl}
                          alt={supplement.supplement_name}
                          fill
                          className="inset-0 w-full h-full rounded-t"
                          style={{
                            // objectFit: 'contain',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ) : (
                      <p className='flex justify-center items-center w-full h-[100px] bg-gray-400'>no-image</p>
                    )}

                    <h3 className='py-1 px-4 bg-orange-500 text-bold text-16px text-white'>{supplement.supplement_name}</h3>

                    <div className='flex flex-col gap-4 py-3 px-2'>
                      <div>
                        <span className="text-[12px] border-b flex grow">用量</span>
                        <p className='md:text-lg text-xl'>{supplement.dosage} {supplement.dosage_unit}</p>
                      </div>
                      <div>
                        <span className="text-[12px] border-b flex grow">一回の服用量</span>
                        <p className='md:text-lg text-xl'>{supplement.intake_amount} {supplement.intake_unit}</p>
                      </div>
                      <div className='flex flex-col md:gap-2 gap-2'>
                        <span className="text-[12px] border-b flex grow">服用タイミング</span>
                        <p className='flex gap-2 md:text-sm text-base text-orange-950 font-semibold'>
                          {supplement.timing_morning && (<span className="rounded-full flex py-1 px-4 bg-orange-100">朝</span>)}
                          {supplement.timing_noon && <span className="rounded-full flex py-1 px-4 bg-orange-100">昼</span>}
                          {supplement.timing_night && <span className="rounded-full flex py-1 px-4 bg-orange-100">夜</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-3 self-end px-2'>
                    <button className="py-2 px-5 rounded-md bg-orange-300" onClick={() => handleOpenUpdateModal(supplement)}>編集</button>
                    <button className="py-2 px-5 rounded-md bg-gray-300" onClick={() => handleDeleteSupplement(supplement.id)}>削除</button>
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
            className='relative flex flex-col md:w-fit w-[92vw] md:h-fit h-[95vh] gap-6 md:py-8 md:px-20 p-4 bg-slate-400 rounded-lg'
            onSubmit={(e) => {
              e.preventDefault(); // ページのリロードを防ぐ
              handleSubmit(handleAddOrUpdateSupplement)(e);
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div className="group relative w-full aspect-[3/2] rounded-md bg-gray-200">
              {!uploadedImage ? (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <MdAddAPhoto size={64} />
                  <span className='text-[16px]'>画像追加</span>
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
              <label htmlFor="intake-amount">一回の服用量</label>
              <div className='flex gap-2 md:text-lg text-xl'>
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
              <label>服用タイミング:</label>
              <div className='flex gap-5'>
                <label className='flex items-center gap-2'><input className='w-6 h-auto' type="checkbox" {...register("timing_morning")} />朝</label>
                <label className='flex items-center gap-2'><input type="checkbox" {...register("timing_noon")} />昼</label>
                <label className='flex items-center gap-2'><input type="checkbox" {...register("timing_night")} />夜</label>
              </div>
            </div>

            <button className="p-2 rounded-md font-semibold text-gray-700 bg-orange-300" type="submit">
              {selectedSupplement ? '編集' : '登録'}
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
