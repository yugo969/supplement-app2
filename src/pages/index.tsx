import Image from "next/image";
import firebase from "@/lib/firebaseClient";
import { useForm } from "react-hook-form";
import {
  addSupplement,
  deleteSupplement,
  getSupplements,
  updateSupplement,
  uploadImage,
} from "@/lib/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  MdAddAPhoto,
  MdDeleteForever,
  MdOutlineCancel,
  MdOutlineMedication,
  MdOutlineAddBox,
} from "react-icons/md";
import resizeImage from "@/lib/resizeImage";
import { useNotificationHandler } from "@/hooks/useNotificationHandler"; // useNotificationをuseNotificationHandlerに変更
import { Button } from "@/components/ui/button";
// import { Supplement } from "@/lib/firestore"; // firestore.ts に型定義がないため削除

// Supplement 型をここで定義
type Supplement = {
  id: string; // Firestore ドキュメント ID
  userId: string; // ユーザーID (Firestore側で付与)
  supplement_name: string;
  dosage: string;
  dosage_unit: string;
  intake_amount: string;
  intake_unit: string;
  timing_morning: boolean;
  timing_noon: boolean;
  timing_night: boolean;
  imageUrl: string | null; // 画像URL (null許容)
  createdAt?: firebase.firestore.Timestamp; // Firestoreのタイムスタンプ (オプショナル)
  updatedAt?: firebase.firestore.Timestamp; // Firestoreのタイムスタンプ (オプショナル)
};

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

// SupplementData 型を Supplement 型を使用するように修正 (必要に応じて)
// SupplementData 型は不要になったため削除
// type SupplementData = Supplement & {
//   // Firestoreから取得するデータ型を使用
//   // 必要であればFormDataのプロパティを追加
// };

const maxWidth = 552;
const maxHeight = 366;

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset, // resetを追加
  } = useForm<FormData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]); // 型をSupplement[]に修正
  const [selectedSupplement, setSelectedSupplement] =
    useState<null | Supplement>(null); // 型をSupplementに修正
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [notification, setNotification] = useState<string | null>(null); // notifyフックを使うので不要になる可能性
  const { notify } = useNotificationHandler(); // useNotificationをuseNotificationHandlerに変更し、notifyを取得

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      // onAuthStateChangedを使用
      if (user) {
        setIsLoggedIn(true);
        getSupplements().then((data) => setSupplements(data as Supplement[])); // 型アサーションを追加
      } else {
        setIsLoggedIn(false);
        router.push("/login"); // ログインページへリダイレクト
      }
    });
    return () => unsubscribe(); // クリーンアップ関数
  }, [router]);

  const handleLogout = async () => {
    await firebase.auth().signOut();
    setIsLoggedIn(false);
    router.push("/login");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSupplement(null);
    setUploadedImage(null);
    reset(); // フォームをリセット
  };

  const handleAddOrUpdateSupplement = async (data: FormData) => {
    let imageUrl = uploadedImage || selectedSupplement?.imageUrl || null; // 既存の画像URLを保持
    let imageFile: File | null = null;

    if (data.image && data.image[0]) {
      imageFile = data.image[0];
      // 画像が選択された場合のみリサイズとアップロードを行う
      try {
        const resizedImageUrl = await resizeImage(
          imageFile,
          maxWidth,
          maxHeight
        );
        // Firebase Storageにアップロードする場合 (uploadImage関数がURLを返すと仮定)
        imageUrl = await uploadImage(
          new File(
            [await fetch(resizedImageUrl).then((r) => r.blob())],
            imageFile.name,
            { type: imageFile.type }
          )
        );
        // ローカルのresizedImageUrlを使う場合（uploadImageが不要な場合）
        // imageUrl = resizedImageUrl;
      } catch (error) {
        console.error("画像処理またはアップロードに失敗:", error);
        notify("画像処理に失敗しました", "error");
        return; // エラー時は処理を中断
      }
    } else if (!imageUrl && selectedSupplement?.imageUrl) {
      // 画像が選択されず、既存の画像がある場合はそれを維持
      imageUrl = selectedSupplement.imageUrl;
    } else if (
      !imageUrl &&
      !selectedSupplement?.imageUrl &&
      uploadedImage === null
    ) {
      // 画像が選択されず、既存の画像もなく、削除された場合
      imageUrl = null;
    }

    // Supplementオブジェクトの型に合わせてデータを整形
    const supplementData: Omit<Supplement, "id" | "userId"> = {
      // idとuserIdを除外
      supplement_name: data.supplement_name,
      dosage: data.dosage,
      dosage_unit: data.dosage_unit,
      intake_amount: data.intake_amount,
      intake_unit: data.intake_unit,
      timing_morning: data.timing_morning,
      timing_noon: data.timing_noon,
      timing_night: data.timing_night,
      imageUrl: imageUrl, // 整形したimageUrlを使用
      // createdAt, updatedAt はFirestore側で設定される想定
    };

    try {
      if (selectedSupplement) {
        await updateSupplement(selectedSupplement.id, supplementData);
        notify("サプリ情報を編集しました", "success"); // showNotificationをnotifyに変更
      } else {
        await addSupplement(supplementData);
        notify("サプリ情報を追加しました", "success"); // showNotificationをnotifyに変更
      }

      closeModal(); // モーダルを閉じる処理を共通化

      // リストを再取得
      getSupplements().then((data) => setSupplements(data as Supplement[])); // 型アサーションを追加
    } catch (error) {
      console.error("サプリメントの登録/編集に失敗:", error);
      notify(
        selectedSupplement ? "編集に失敗しました" : "登録に失敗しました",
        "error"
      );
    }
  };

  const handleOpenUpdateModal = (supplement: Supplement) => {
    // 型をSupplementに修正
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
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedDeleteId) return;

    try {
      await deleteSupplement(selectedDeleteId);
      getSupplements().then((data) => {
        setSupplements(data as Supplement[]);
        notify("サプリ情報を削除しました", "success");
      });
    } catch (error) {
      console.error("サプリ情報の削除に失敗:", error);
      notify("サプリ情報の削除に失敗しました", "error");
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedDeleteId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  // サプリメント画像の操作
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      try {
        const resizedImageUrl = await resizeImage(file, maxWidth, maxHeight);
        setUploadedImage(resizedImageUrl); // リサイズ後のローカルURLをセット
        if (e.target.files) {
          // nullチェックを追加
          setValue("image", e.target.files); // ファイル自体もフォームにセット（送信時に使うため）
        }
      } catch (error) {
        console.error("画像のリサイズに失敗しました:", error);
        notify("画像のリサイズに失敗しました", "error");
      }
    } else {
      console.error("ファイルが提供されていません");
    }
    // ファイル選択がキャンセルされた場合やファイルがない場合
    if (!file) {
      // 既存の画像があり、削除されていない場合は uploadedImage を維持
      if (!selectedSupplement?.imageUrl || uploadedImage !== null) {
        // 何もしない、または uploadedImage を null にリセットするかどうかは要件次第
        // setUploadedImage(null); // 必要ならコメント解除
      }
      setValue("image", undefined); // フォームの画像データをクリア
    }
  };

  const handleImageDelete = () => {
    setUploadedImage(null);
    setValue("image", undefined); // フォームの画像データもクリア
  };

  // ログイン状態のチェック（useEffect内で処理されるため、ここでのチェックは冗長）
  // const user = firebase.auth().currentUser;
  // if (user) {
  //   console.log("ユーザーは認証されています");
  // } else {
  //   console.log("ユーザーは認証されていません");
  // }

  // if (!isLoggedIn) return <p>ログインしてください</p>; // useEffectでリダイレクトするので不要

  return (
    // overflow-hiddenはモーダル表示時のみ適用する方が良い
    <div
      className={`relative ${isModalOpen ? "overflow-hidden h-screen" : ""}`}
    >
      <Button
        className="fixed flex flex-col justify-center items-center w-24 h-26 bottom-6 right-6 z-10 border-4 border-white/80 md:hidden text-xs shadow-xl pt-1 p-2 text-orange-950 font-semibold rounded-xl bg-orange-400"
        onClick={() => {
          setSelectedSupplement(null); // 新規追加モード
          reset(); // フォームリセット
          setUploadedImage(null);
          setIsModalOpen(true);
        }}
      >
        <MdOutlineAddBox size={64} />
        <span>サプリ追加</span>
      </Button>
      {/* 背景をグラデーションに変更 */}
      <div className="flex flex-col w-screen min-h-screen md:p-10 p-4 gap-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="flex justify-between items-center border-b border-gray-300 md:p-6 pb-3 px-0">
          <h2 className="flex items-center gap-3 text-gray-800 md:text-lg text-md">
            <MdOutlineMedication size={32} className="text-purple-600" />
            <span className="md:text-[32px] text-2xl font-bold">
              サプリストック
            </span>
          </h2>
          <div className="flex md:gap-6 gap-4">
            <Button
              className="py-1 md:px-4 px-3 text-bold rounded-md bg-purple-500 text-white hover:bg-purple-600 md:flex hidden"
              onClick={() => {
                setSelectedSupplement(null); // 新規追加モード
                reset(); // フォームリセット
                setUploadedImage(null);
                setIsModalOpen(true);
              }}
            >
              サプリ追加
            </Button>
            <Button
              variant="outline"
              className="py-1 md:px-4 px-3 text-sm rounded-md border-gray-400 text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              ログアウト
            </Button>
          </div>
        </div>

        {isLoggedIn && (
          <div className="flex flex-col">
            {supplements.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">
                サプリメントが登録されていません。
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {supplements.map((supplement) => (
                  <div
                    key={supplement.id}
                    className="relative flex flex-col justify-between gap-3 rounded-lg w-full overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-[1.03] hover:shadow-xl group bg-white shadow-md" // カードデザイン変更
                  >
                    <div className="flex flex-col rounded-xl">
                      {/* 画像を表示 */}
                      <div className="relative w-full aspect-[3/2] h-auto overflow-hidden rounded-t-lg">
                        {supplement.imageUrl ? (
                          <Image
                            src={supplement.imageUrl}
                            alt={supplement.supplement_name}
                            fill
                            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // レスポンシブ画像サイズ指定
                            priority={supplements.indexOf(supplement) < 4} // 最初の数枚を優先読み込み
                          />
                        ) : (
                          <div className="flex justify-center items-center bg-gray-200 aspect-[3/2] text-gray-500">
                            <span>no image</span>
                          </div>
                        )}
                        {/* 画像上のグラデーションオーバーレイ */}
                        {supplement.imageUrl && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        )}
                      </div>

                      <div className="p-4 space-y-3 flex flex-col flex-grow">
                        {" "}
                        {/* flex-grow追加 */}
                        <h3
                          className="text-lg font-semibold text-gray-800 truncate"
                          title={supplement.supplement_name}
                        >
                          {" "}
                          {/* truncate追加 */}
                          {supplement.supplement_name}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 flex-grow">
                          {" "}
                          {/* flex-grow追加 */}
                          <div className="flex justify-between">
                            <span>用量:</span>
                            <span>
                              {supplement.dosage} {supplement.dosage_unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>一回量:</span>
                            <span>
                              {supplement.intake_amount}{" "}
                              {supplement.intake_unit}
                            </span>
                          </div>
                          <div>
                            <span>タイミング:</span>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {supplement.timing_morning && (
                                <span className="rounded-full text-xs py-1 px-3 bg-blue-100 text-blue-800">
                                  朝
                                </span>
                              )}
                              {supplement.timing_noon && (
                                <span className="rounded-full text-xs py-1 px-3 bg-green-100 text-green-800">
                                  昼
                                </span>
                              )}
                              {supplement.timing_night && (
                                <span className="rounded-full text-xs py-1 px-3 bg-yellow-100 text-yellow-800">
                                  夜
                                </span>
                              )}
                              {!supplement.timing_morning &&
                                !supplement.timing_noon &&
                                !supplement.timing_night && (
                                  <span className="text-xs text-gray-400">
                                    未設定
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        {/* ボタンエリア */}
                        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-200">
                          {" "}
                          {/* mt-4追加, pt-4追加, border-t追加 */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                            onClick={() => handleOpenUpdateModal(supplement)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteClick(supplement.id)}
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">本当に削除しますか？</h3>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedDeleteId(null);
                }}
              >
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                削除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 追加/編集モーダル */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4" // fixed inset-0, backdrop-blur
          onClick={closeModal} // 背景クリックで閉じる
        >
          {/* stopPropagationでモーダル内のクリックが背景に伝播しないように */}
          <form
            className="relative flex flex-col md:w-fit w-full max-w-lg max-h-[90vh] gap-6 p-6 bg-white rounded-lg shadow-xl overflow-y-auto" // max-w, max-h, overflow-y-auto
            onSubmit={handleSubmit(handleAddOrUpdateSupplement)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* <h3 className="text-xl font-semibold text-gray-800">
              {selectedSupplement ? "サプリ編集" : "サプリ追加"}
            </h3> */}
            {/* 画像アップロードエリア */}
            <div className="group relative w-full aspect-[3/2] rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
              {!uploadedImage ? (
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-500 hover:text-purple-600">
                  <MdAddAPhoto size={48} />
                  <span className="text-sm">画像を追加</span>
                  <input
                    type="file"
                    accept="image/*" // 画像ファイルのみ許可
                    {...register("image")}
                    onChange={handleImageChange}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded supplement"
                    fill
                    className="object-cover rounded-md"
                  />
                  {/* 画像削除ボタン */}
                  <button
                    type="button" // submitさせない
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    onClick={handleImageDelete}
                    aria-label="画像を削除"
                  >
                    <MdDeleteForever size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* フォームフィールド */}
            <div className="flex flex-col">
              <label
                htmlFor="supplement-name"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                サプリ名 *
              </label>
              <input
                type="text"
                id="supplement-name"
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                {...register("supplement_name", {
                  required: "サプリ名は必須です",
                })}
              />
              {errors.supplement_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.supplement_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label
                  htmlFor="dosage"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  用量
                </label>
                <input
                  type="text"
                  id="dosage"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                  {...register("dosage")}
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="dosage_unit"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  単位
                </label>
                <select
                  defaultValue=""
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none bg-white"
                  {...register("dosage_unit")}
                >
                  <option value="" disabled>
                    選択
                  </option>
                  <option value="錠">錠</option>
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="IU">IU</option>
                  <option value="個">個</option>
                  <option value="カプセル">カプセル</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label
                  htmlFor="intake-amount"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  一回の服用量
                </label>
                <input
                  type="text"
                  id="intake-amount"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none"
                  {...register("intake_amount")}
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="intake_unit"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  単位
                </label>
                <select
                  defaultValue=""
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-500 outline-none bg-white"
                  {...register("intake_unit")}
                >
                  <option value="" disabled>
                    選択
                  </option>
                  <option value="錠">錠</option>
                  <option value="mg">mg</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="IU">IU</option>
                  <option value="個">個</option>
                  <option value="カプセル">カプセル</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                服用タイミング
              </label>
              <div className="flex gap-4 flex-wrap">
                {" "}
                {/* flex-wrap追加 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" // スタイル調整
                    type="checkbox"
                    {...register("timing_morning")}
                  />
                  朝
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    type="checkbox"
                    {...register("timing_noon")}
                  />
                  昼
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    type="checkbox"
                    {...register("timing_night")}
                  />
                  夜
                </label>
              </div>
            </div>

            {/* フォームアクションボタン */}
            <div className="flex justify-end gap-3 mt-4">
              <Button
                type="button" // submitさせない
                variant="outline"
                onClick={closeModal}
                className="border-gray-400 text-gray-700 hover:bg-gray-100"
              >
                キャンセル
              </Button>
              <Button
                className="bg-purple-500 text-white hover:bg-purple-600"
                type="submit"
              >
                {selectedSupplement ? "更新" : "登録"}
              </Button>
            </div>

            {/* 閉じるボタン (アイコン) */}
            <button
              type="button" // submitさせない
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              onClick={closeModal}
              aria-label="閉じる"
            >
              <MdOutlineCancel size={28} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
