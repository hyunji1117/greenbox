import React, { useEffect, useState, useRef } from 'react'
import { useFridge } from '../context/FridgeContext'
import {
  LeafIcon,
  AppleIcon,
  BeefIcon,
  FishIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  MinusIcon,
} from 'lucide-react'
interface QuickAddItemProps {
  onClose: () => void
}
interface CategoryItem {
  id: string
  name: string
  imageUrl: string
  defaultCategory: 'fridge' | 'freezer' | 'pantry'
  expiryDays: number
}
const QuickAddItems: React.FC<QuickAddItemProps> = ({ onClose }) => {
  const { addItem, currentUser, items } = useFridge()
  const modalRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<
    'vegetables' | 'fruits' | 'meat' | 'seafood'
  >('vegetables')
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const categories: Record<
    'vegetables' | 'fruits' | 'meat' | 'seafood',
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
        imageUrl:
          'https://cdn.pixabay.com/photo/2017/09/26/13/31/apple-2788616_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 21,
      },
      {
        id: 'f2',
        name: '바나나',
        imageUrl:
          'https://cdn.pixabay.com/photo/2014/04/16/09/58/banana-325461_1280.jpg',
        defaultCategory: 'pantry',
        expiryDays: 4,
      },
      {
        id: 'f3',
        name: '딸기',
        imageUrl:
          'https://hips.hearstapps.com/clv.h-cdn.co/assets/15/22/1432664914-strawberry-facts1.jpg?resize=980:*',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'f4',
        name: '블루베리',
        imageUrl:
          'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f5',
        name: '아보카도',
        imageUrl:
          'https://cdn.pixabay.com/photo/2015/09/18/11/37/avocados-945418_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 3,
      },
      {
        id: 'f6',
        name: '오렌지',
        imageUrl:
          'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'f7',
        name: '포도',
        imageUrl:
          'https://m.health.chosun.com/site/data/img_dir/2022/09/06/2022090602057_0.jpg',
        defaultCategory: 'fridge',
        expiryDays: 10,
      },
      {
        id: 'f8',
        name: '샤인머스캣',
        imageUrl:
          'https://cdn.wip-news.com/news/photo/202208/14578_17567_373.png',
        defaultCategory: 'fridge',
        expiryDays: 15,
      },
      {
        id: 'f9',
        name: '자두',
        imageUrl:
          'https://kormedi.com/wp-content/uploads/2023/07/ck-pc003052084-l-700x555.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f10',
        name: '참외',
        imageUrl:
          'https://cdn.pixabay.com/photo/2021/02/10/16/48/melon-6002760_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f11',
        name: '수박',
        imageUrl:
          'https://images.unsplash.com/photo-1563114773-84221bd62daa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 12,
      },
      {
        id: 'f12',
        name: '멜론',
        imageUrl:
          'https://cdn.pixabay.com/photo/2021/04/19/11/06/melon-6191136_1280.jpg',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f13',
        name: '키위',
        imageUrl:
          'https://images.unsplash.com/photo-1585059895524-72359e06133a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 14,
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
          'https://semie.cooking/image/contents/bs/dr/qezbtwtm/132406696dbxb.jpg',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 'm5',
        name: '돼지고기',
        imageUrl:
          'https://semie.cooking/image/contents/xf/ir/aqrotyfb/147716010bjva.jpg',
        defaultCategory: 'fridge',
        expiryDays: 3, 
      },
      {
        id: 'm6',
        name: '양고기',
        imageUrl:
          'https://liosystem.com/file_data/ckeditor/images/01(4).png',
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
        imageUrl:
          'https://t1.daumcdn.net/cfile/tistory/997846395C877FB61D',
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
      }
    ],
  }
  // Check if an item is already in the fridge and not finished
  const isItemAdded = (itemName: string, category: string) => {
    return items.some(
      (item) =>
        item.name === itemName && item.category === category && !item.finished,
    )
  }
  const handleItemClick = (item: CategoryItem) => {
    // Only allow selection if the item is not already added or is marked as finished
    if (!isItemAdded(item.name, item.defaultCategory)) {
      setSelectedItem(item)
      // Reset quantity to 1 when selecting a new item
      setQuantity(1)
    }
  }
  const handleAddItem = () => {
    if (selectedItem) {
      // Check if the item is already in the fridge and not finished
      if (!isItemAdded(selectedItem.name, selectedItem.defaultCategory)) {
        // Add the new item
        addItem({
          name: selectedItem.name,
          category: selectedItem.defaultCategory,
          quantity: quantity,
          addedBy: currentUser,
          finished: false,
        })
        setToastMessage(`${selectedItem.name}(이)가 추가되었습니다!`)
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
        }, 3000)
        // Reset selection after adding
        setSelectedItem(null)
        // Reset quantity to 1 after adding an item
        setQuantity(1)
      }
    }
  }
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }
  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])
  return (
    <div className="h-full flex flex-col" ref={modalRef}>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {toastMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">자주 사용하는 식재료</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <XIcon size={24} />
        </button>
      </div>
      {/* Category tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveCategory('vegetables')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'vegetables' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <LeafIcon size={18} />
          <span className="font-medium">채소</span>
        </button>
        <button
          onClick={() => setActiveCategory('fruits')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'fruits' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <AppleIcon size={18} />
          <span className="font-medium">과일</span>
        </button>
        <button
          onClick={() => setActiveCategory('meat')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'meat' ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <BeefIcon size={18} />
          <span className="font-medium">고기</span>
        </button>
        <button
          onClick={() => setActiveCategory('seafood')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'seafood' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <FishIcon size={18} />
          <span className="font-medium">해산물</span>
        </button>
      </div>
      {/* Grid of items */}
      <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 max-h-[400px]">
        {categories[activeCategory].map((item) => {
          const itemAdded = isItemAdded(item.name, item.defaultCategory)
          return (
            <div
          key={item.id}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow ${
            itemAdded ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
          }`}
          onClick={() => !itemAdded && handleItemClick(item)}
        >
              <div className="h-24 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-center">
                <h3 className="font-medium text-sm">{item.name}</h3>
                <div
                  className={`text-xs mt-1 flex items-center justify-center ${itemAdded ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {itemAdded ? (
                    <CheckIcon size={12} className="mr-1" />
                  ) : (
                    <PlusIcon size={12} className="mr-1" />
                  )}
                  <span>{itemAdded ? '추가됨' : '추가하기'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {selectedItem && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{selectedItem.name} 추가하기</h3>
              <p className="text-sm text-gray-500">수량을 선택하세요</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={decrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                disabled={quantity <= 1}
              >
                <MinusIcon size={16} />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={handleAddItem}
            className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            추가하기
          </button>
        </div>
      )}
    </div>
  )
}
export default QuickAddItems
