import { useState, useEffect } from 'react'
import { RichTextEditor } from '../components/RichTextEditor'

function Memo() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    setTitle('인터랙션 디자이너란?');
    setText('<p>사용자가 겪는 문제를 동적인 디자인으로 풀어나가는 사람들이에요. 작고 화려한 모션에만 집중하는 것이 아니라, 사용성과 비주얼을 동시에 아우르며 화면이나 퍼널 전체를 개선해요.</p><p>We are problem-solvers who address user challenges through dynamic design. Rather than focusing solely on small, flashy motions, we integrate usability and visual appeal to improve entire screens or funnels as a whole.</p>');
  }, []);

  return (
    <div className="h-full bg-background px-12 py-6">
      <div className="mx-auto space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full pt-2 text-3xl font-bold bg-white rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="제목을 입력하세요..."
        />
        <RichTextEditor
          value={text}
          onChange={setText}
          placeholder="텍스트를 입력하세요..."
        />
      </div>
    </div>
  )
}

export default Memo 