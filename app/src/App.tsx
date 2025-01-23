import { useState } from 'react'
import Memo from './pages/Memo'
import Calculator from './pages/Calculator'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'menu' | 'memo' | 'calculator'>('memo');
  const [direction, setDirection] = useState(0);


  const navigateTo = (page: 'memo' | 'calculator') => {
    setDirection(1);
    setCurrentPage(page);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'menu':
        return (
          <motion.div
            key="menu"
            initial="enter"
            animate="center"
            exit="exit"
            variants={slideVariants}
            custom={direction}
            transition={{
              x: { type: "tween", ease: [0.455, 0.030, 0.515, 0.955], duration: 0.5 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-white"
          >
            <button
              onClick={() => navigateTo('memo')}
              className="px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              메모
            </button>
            <button
              onClick={() => navigateTo('calculator')}
              className="px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              계산기
            </button>
          </motion.div>
        );
      case 'memo':
      case 'calculator':
        return (
          <motion.div
            key={currentPage}
            initial="enter"
            animate="center"
            exit="exit"
            variants={slideVariants}
            custom={direction}
            transition={{
              x: { type: "tween", ease: [0.455, 0.030, 0.515, 0.955], duration: 0.5 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex flex-col bg-white"
          >
            {/* <header className="bg-white p-4">
              <div className="mx-auto flex items-center">
                <button
                  onClick={navigateBack}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="ml-4 text-xl font-semibold">
                  {currentPage === 'memo' ? '메모' : '계산기'}
                </h1>
              </div>
            </header> */}
            <div className="flex-1 pt-10">
              {currentPage === 'memo' ? <Memo /> : <Calculator />}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence initial={false} mode="sync">
        {renderContent()}
      </AnimatePresence>
    </div>
  )
}

export default App