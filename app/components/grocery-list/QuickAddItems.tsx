import React, { useEffect, useState, useRef } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  Milk,
  LeafyGreenIcon,
  AppleIcon,
  BeefIcon,
  FishIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  MinusIcon,
  // Check,
} from 'lucide-react';
import AddItemForm from '@/app/components/grocery-list/AddItemForm';
import Image from 'next/image';
interface QuickAddItemProps {
  onClose: () => void;
}
interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  defaultCategory: 'fridge' | 'freezer' | 'pantry';
  expiryDays: number;
}
const QuickAddItems: React.FC<QuickAddItemProps> = ({ onClose }) => {
  const { addItem, currentUser, items } = useFridge();
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<
    'vegetables' | 'fruits' | 'meat' | 'seafood' | 'others'
  >('vegetables');
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const categories: Record<
    'vegetables' | 'fruits' | 'meat' | 'seafood' | 'others',
    CategoryItem[]
  > = {
    vegetables: [
      {
        id: 'v1',
        name: '시금치',
        imageUrl:
          'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
      {
        id: 'v2',
        name: '브로콜리',
        imageUrl:
          'https://cdn.pixabay.com/photo/2015/03/14/13/59/vegetables-673181_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 8,
      },
      {
        id: 'v3',
        name: '당근',
        imageUrl:
          'https://cdn.pixabay.com/photo/2016/08/03/01/09/carrot-1565597_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'v4',
        name: '양파',
        imageUrl:
          'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 14,
      },
      {
        id: 'v5',
        name: '감자',
        imageUrl:
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 21,
      },
      {
        id: 'v6',
        name: '오이',
        imageUrl:
          'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'v7',
        name: '토마토',
        imageUrl:
          'https://cdn.pixabay.com/photo/2022/09/05/09/50/tomatoes-7433786_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 12,
      },
      {
        id: 'v8',
        name: '애호박',
        imageUrl:
          'https://image.8dogam.com/resized/product/asset/v1/upload/a2834566bd534866b526204919a5f6f6.jpeg?type=big&res=3x&ext=jpg',
        defaultCategory: 'fridge',
        expiryDays: 6,
      },
      {
        id: 'v9',
        name: '얼갈이',
        imageUrl:
          'https://img-cf.kurly.com/hdims/resize/%5E%3E720x%3E936/cropcenter/720x936/quality/85/src/shop/data/goods/1604383518835l0.jpg',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'v10',
        name: '배추',
        imageUrl:
          'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRQ4i8epNuFuN6xbVJgOh5Jgum-XkdVE4L9H4nKvKmnZmFkm2N9xj11z6FWkI7v1jqXkyDj2LHbJrzg7sXVMN3YhHE5LefrJWivh-I3NA',
        defaultCategory: 'fridge',
        expiryDays: 10,
      },
      {
        id: 'v11',
        name: '양배추',
        imageUrl:
          'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 21,
      },
      {
        id: 'v12',
        name: '꽈리고추',
        imageUrl:
          'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTYWB51xmjPIBEBeV6_Qy1DONUb8_AOdTegebTBFwbNss1fXhhvsC0TzjpdDvWMyvszBGA_6WdAegaI3G_zKUnoK6Wwf6HHJSdlxYCUlw',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
      {
        id: 'v13',
        name: '느타리버섯',
        imageUrl:
          'https://www.nongmin.com/-/raw/srv-nongmin/data2/content/image/2022/11/17/.cache/512/2022111701088387.jpg',
        defaultCategory: 'fridge',
        expiryDays: 4,
      },
      {
        id: 'v14',
        name: '팽이버섯',
        imageUrl:
          'https://oasisprodproduct.edge.naverncp.com/103694/detail/0_c8c66e1f-f318-4f96-9fad-d3bb760d7e74.jpg',
        defaultCategory: 'fridge',
        expiryDays: 4,
      },
      {
        id: 'v15',
        name: '검은 콩',
        imageUrl:
          'https://www.syu.ac.kr/wp-content/uploads/2021/05/%EA%B2%80%EC%9D%80%EC%BD%A9.jpg',
        defaultCategory: 'pantry',
        expiryDays: 365,
      },
      {
        id: 'v16',
        name: '밤',
        imageUrl:
          'https://cdn.100ssd.co.kr/news/photo/202110/81104_61218_5223.jpg',
        defaultCategory: 'pantry',
        expiryDays: 30,
      },
    ],
    fruits: [
      {
        id: 'f1',
        name: '사과',
        imageUrl: '/fruit/fruit_apple.jpg',
        defaultCategory: 'fridge',
        expiryDays: 21,
      },
      {
        id: 'f2',
        name: '바나나',
        imageUrl: '/fruit/fruit_banana.jpg',
        defaultCategory: 'pantry',
        expiryDays: 4,
      },
      {
        id: 'f3',
        name: '딸기',
        imageUrl: '/fruit/fruit_strawberries.jpg',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'f4',
        name: '블루베리',
        imageUrl: '/fruit/fruit_blueberry.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f5',
        name: '아보카도',
        imageUrl: '/fruit/fruit_avocado.jpg',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'f6',
        name: '오렌지',
        imageUrl: '/fruit/fruit_orange.webp',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'f7',
        name: '포도',
        imageUrl: '/fruit/fruit_grape.png',
        defaultCategory: 'fridge',
        expiryDays: 10,
      },
      {
        id: 'f8',
        name: '샤인머스캣',
        imageUrl: '/fruit/fruit_shine_muscat.png',
        defaultCategory: 'fridge',
        expiryDays: 15,
      },
      {
        id: 'f9',
        name: '자두',
        imageUrl: '/fruit/fruit_korea_plum.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f10',
        name: '참외',
        imageUrl: '/fruit/fruit_korea_melon.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f11',
        name: '수박',
        imageUrl: '/fruit/fruit_watermelon.jpg',
        defaultCategory: 'fridge',
        expiryDays: 12,
      },
      {
        id: 'f12',
        name: '멜론',
        imageUrl: '/fruit/fruit_melon.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f13',
        name: '키위',
        imageUrl: '/fruit/fruit_kiwi.jpg',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'f14',
        name: '파인애플',
        imageUrl: '/fruit/fruit_pineapple.jpg',
        defaultCategory: 'fridge',
        expiryDays: 6,
      },
    ],
    meat: [
      {
        id: 'm1',
        name: '닭가슴살',
        imageUrl:
          'https://shop.hansalim.or.kr/shopping/is/itm/060103025/060103025_1_568.jpg',
        defaultCategory: 'fridge',
        expiryDays: 2,
      },
      {
        id: 'm2',
        name: '닭다리살',
        imageUrl:
          'https://image.8dogam.com/resized/product/asset/v1/upload/11d85542cefc428cb59febba0f84705e.jpg?type=big&res=2x&ext=webp',
        defaultCategory: 'fridge',
        expiryDays: 2,
      },
      {
        id: 'm3',
        name: '닭고기',
        imageUrl:
          'https://i.namu.wiki/i/vgOkRMrwe7DXDYArHY8zDx6DBq1SE30znAYaji7tcI3w3ey63WV6YZqLpIovaK3eq2PaI_PjjOsDNK_x3DPe4w.webp',
        defaultCategory: 'fridge',
        expiryDays: 2,
      },
      {
        id: 'm4',
        name: '소고기',
        imageUrl:
          'https://i.namu.wiki/i/XNIoYoEhSxNaURniAp8AcRrb4pbli_mmxtYBbbZXa4GqHuim2BYql5YTW1p7hjdcIq1kMzM7xZBW3u2sL_BFGw.webp',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 'm5',
        name: '돼지고기',
        imageUrl:
          'https://i.namu.wiki/i/VBcDkoPXajYoNcRUcVHQdfvB-Npe16B_s3ULp71MXsw2qcyVgvbZjQtQOFXKcZBn36hB1O07LSPkLYEKRtP5FA.webp',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'm6',
        name: '양고기',
        imageUrl:
          'https://i.namu.wiki/i/rMS0tkV-UJEGKcLRCMEf0upSVNzKhku1cZ2tK_LMm3093ujw2Mr1Qq1OUiVMsmXR8dpKKLG9vLgz5KFqiGrY7iCAFgVqMasel_X5DSBt7fXJ21VbULW-4pxin37u6kNe7k8vPsykIADD2A52g30Big.webp',
        defaultCategory: 'freezer',
        expiryDays: 120,
      },
    ],
    seafood: [
      {
        id: 's1',
        name: '연어',
        imageUrl:
          'https://cdn.travie.com/news/photo/first/201406/img_17112_1.jpg',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's2',
        name: '새우',
        imageUrl:
          'https://cdn.pixabay.com/photo/2021/12/25/10/00/seafood-6892765_1280.jpg',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's3',
        name: '오징어',
        imageUrl: 'https://t1.daumcdn.net/cfile/tistory/997846395C877FB61D',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's4',
        name: '게',
        imageUrl:
          'https://cdn.news.hidoc.co.kr/news/photo/201610/11967_26572_0259.jpg',
        defaultCategory: 'fridge',
        expiryDays: 1,
      },
      {
        id: 's5',
        name: '굴',
        imageUrl:
          'https://img.khan.co.kr/news/2024/04/07/l_2024040501000039800015021.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 's6',
        name: '조개',
        imageUrl:
          'https://src.hidoc.co.kr/image/lib/2023/1/18/1674031118952_0.png',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 's7',
        name: '고등어',
        imageUrl:
          'https://cdn.clipkit.co/tenants/1336/item_images/images/000/002/525/original/e61638c7-d43a-4327-9992-6703d6774c91.jpg?1707276770',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 's8',
        name: '조기',
        imageUrl:
          'https://lh6.googleusercontent.com/proxy/b0ory3hutLyjo4evQaMwnnTllUzD74rd3kQUGs3fDeawfKyXz5fSP4VXzyp_TF4guZWQRPyXAqpyacSJaoj9hYe0_Jb_uvkzd9qpeQ',
        defaultCategory: 'fridge',
        expiryDays: 2,
      },
      {
        id: 's9',
        name: '전복',
        imageUrl:
          'https://i.namu.wiki/i/_sqroekGlAEae_82MHjewNN07YyIiyPnY_rzx49T83KA_yJQ7nOcQY7vaGZEgo5fNX9Hm_ffC-opsvF6rJzMSQ.webp',
        defaultCategory: 'fridge',
        expiryDays: 2,
      },
      {
        id: 's10',
        name: '미역줄기',
        imageUrl:
          'https://wooltariusa.com/cdn/shop/files/0-1_f9091c38-2bac-4f0b-9ce0-e5d707a64135.jpg?v=1688538412',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
    ],
    others: [
      {
        id: 'o1',
        name: '아보카도 오일',
        imageUrl: '/others/other_avocado_oil.webp',
        defaultCategory: 'pantry',
        expiryDays: 730,
      },
      {
        id: 'o2',
        name: '트러플 오일',
        imageUrl: '/others/other_black_truffle_oil.jpg',
        defaultCategory: 'pantry',
        expiryDays: 1095,
      },
      {
        id: 'o3',
        name: '브리 치즈',
        imageUrl: '/others/other_brie_cheeze.webp',
        defaultCategory: 'pantry',
        expiryDays: 180,
      },
      {
        id: 'o4',
        name: '토마토 소스',
        imageUrl: '/others/other_tomato_sauce.webp',
        defaultCategory: 'pantry',
        expiryDays: 365,
      },
      {
        id: 'o5',
        name: '모짜렐라 치즈',
        imageUrl: '/others/other_mozzarella_cheeze.webp',
        defaultCategory: 'pantry',
        expiryDays: 270,
      },
      {
        id: 'o6',
        name: '가염 버터',
        imageUrl: '/others/other_salted_butter.webp',
        defaultCategory: 'pantry',
        expiryDays: 365,
      },
      {
        id: 'o7',
        name: '소주',
        imageUrl: '/others/other_soju.jpeg',
        defaultCategory: 'pantry',
        expiryDays: 540,
      },
      {
        id: 'o8',
        name: '프로틴파우더',
        imageUrl:
          'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 365,
      },
      {
        id: 'o9',
        name: '그래놀라',
        imageUrl:
          'https://images.unsplash.com/photo-1571748599854-26f3a530270f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 180,
      },
      {
        id: 'o10',
        name: '케첩',
        imageUrl:
          'https://images.unsplash.com/photo-1631897642056-97a7abff6818?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 180,
      },
    ],
  };
  // Check if an item is already in the fridge and not finished
  const isItemAdded = (itemName: string, category: string) => {
    return items.some(
      item =>
        item.name === itemName && item.category === category && !item.finished,
    );
  };
  const handleItemClick = (item: CategoryItem) => {
    if (!isItemAdded(item.name, item.defaultCategory)) {
      setSelectedItem(item);
      setQuantity(1);
    }
  };
  const handleAddItem = () => {
    if (selectedItem) {
      if (!isItemAdded(selectedItem.name, selectedItem.defaultCategory)) {
        addItem({
          name: selectedItem.name,
          category: selectedItem.defaultCategory,
          quantity: quantity,
          addedBy: currentUser,
          finished: false,
        });
        // setToastMessage(`${selectedItem.name} 식재료가 추가되었습니다`);
        setToastMessage('식재료가 추가되었습니다!');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
        setSelectedItem(null);
        setQuantity(1);
      }
    }
  };
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  const getItemQuantity = (itemName: string, category: string) => {
    const matchingItems = items.filter(
      item =>
        item.name === itemName && item.category === category && !item.finished,
    );
    return matchingItems.reduce(
      (total, item) => total + (item.quantity || 1),
      0,
    );
  };

  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddForm]);

  const handleDirectAddClick = () => {
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };

  return (
    <>
      {/* AddItemForm 모달 */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AddItemForm
            onClose={handleCloseAddForm}
            initialCategory={
              activeCategory === 'vegetables' ||
              activeCategory === 'fruits' ||
              activeCategory === 'others'
                ? 'fridge'
                : activeCategory === 'meat'
                  ? 'fridge'
                  : 'freezer'
            }
          />
        </div>
      )}
      <div className="flex h-135 flex-col" ref={modalRef}>
        {/* Toast notification */}
        {showToast && (
          <div className="animate-fade-in fixed top-3 left-1/2 z-50 m-auto -translate-x-1/2 transform rounded-3xl bg-white px-4 py-3 text-sm text-black shadow-lg">
            {toastMessage}
          </div>
        )}
        <div className="mb-4 flex items-center">
          <h2 className="text-md font-bold">자주 사용하는 식재료</h2>
          <button
            onClick={handleDirectAddClick}
            className="ml-4 flex max-w-[200px] items-center justify-center space-x-0.5 rounded-xl bg-[#6B46C1] py-1 pr-3 pl-2 text-xs text-white shadow-sm transition-colors hover:bg-[#603fad]"
          >
            <PlusIcon size={15} />
            <span className="font-medium">직접 추가</span>
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-gray-600"
          >
            <XIcon size={20} />
          </button>
        </div>
        {/* Category tabs */}
        <div className="mb-4 flex space-x-2">
          <button
            onClick={() => setActiveCategory('vegetables')}
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'vegetables' ? 'border border-green-300 bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <LeafyGreenIcon size={15} />
            <span className="text-sm">채소</span>
          </button>
          <button
            onClick={() => setActiveCategory('fruits')}
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'fruits' ? 'border border-red-300 bg-red-100 text-red-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <AppleIcon size={15} />
            <span className="text-sm">과일</span>
          </button>
          <button
            onClick={() => setActiveCategory('meat')}
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'meat' ? 'border border-orange-300 bg-orange-100 text-orange-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <BeefIcon size={15} />
            <span className="text-sm">고기</span>
          </button>
          <button
            onClick={() => setActiveCategory('seafood')}
            className={`min-w-[] flex min-h-[40px] flex-1 items-center justify-center space-x-0.5 rounded-xl px-1.5 shadow-sm ${activeCategory === 'seafood' ? 'border border-blue-300 bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <FishIcon size={15} />
            <span className="text-sm">해산물</span>
          </button>
          <button
            onClick={() => setActiveCategory('others')}
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'others' ? 'border border-yellow-300 bg-yellow-100 text-yellow-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Milk size={15} />
            <span className="text-sm">기타</span>
          </button>
        </div>
        {/* Grid of items */}
        <div className="grid h-full grid-cols-3 gap-2 overflow-hidden overflow-y-auto p-1">
          {categories[activeCategory].map(item => {
            const itemAdded = isItemAdded(item.name, item.defaultCategory);
            const itemQuantity = itemAdded
              ? getItemQuantity(item.name, item.defaultCategory)
              : 0;
            return (
              <div
                key={item.id}
                className={`relative rounded-xs border bg-white shadow-sm transition-shadow ${
                  itemAdded
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:shadow-md'
                } ${selectedItem?.id === item.id ? 'm-[-1px] border-[2px] border-[#615FFF]' : 'border-gray-200'}`}
                onClick={() => !itemAdded && handleItemClick(item)}
              >
                <div className="relative flex h-25 items-center justify-center">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full overflow-hidden object-cover"
                    layout="fill"
                    objectFit="cover"
                  />
                  {itemAdded && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xs bg-black/60">
                      <div className="flex h-17 w-17 items-center justify-center rounded-full bg-white/15">
                        <CheckIcon
                          size={60}
                          className="strokeWidth={10} text-[#36ae0e]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid-row-1 flex items-center justify-between p-2">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <div
                    className={`relative flex items-center text-sm ${itemAdded ? 'text-[#36ae0e]' : 'text-black'}`}
                  >
                    {itemAdded ? (
                      <>
                        <span>저장</span>
                        {itemQuantity > 0 && (
                          <div className="absolute -top-2 -right-2.5 flex h-4 w-4 items-center justify-center">
                            <span className="text-[10px] font-semibold text-[#36ae0e]">
                              {itemQuantity}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <PlusIcon size={15} className="mr-1" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selectedItem && (
          <div className="mt-4 rounded-xl bg-gray-50 p-3 shadow-sm">
            <div className="ml-1 flex items-center justify-between">
              <div>
                <h3 className="mb-1 text-sm">{selectedItem.name}</h3>
                <p className="text-xs text-gray-500">수량을 선택하세요</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decrementQuantity}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 shadow-sm"
                  disabled={quantity <= 1}
                >
                  <MinusIcon size={16} />
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 shadow-sm"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={handleAddItem}
              className="mt-2 w-full rounded-xl bg-[#6B46C1] py-1 pr-3 pl-2 text-xs text-white shadow-sm transition-colors hover:bg-[#603fad]"
            >
              추가하기
            </button>
          </div>
        )}
      </div>
    </>
  );
};
export default QuickAddItems;
