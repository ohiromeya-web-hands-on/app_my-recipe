'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
  }, [])

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
        レシピ一覧
      </h1>

      <form
  onSubmit={async (e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title')
    const steps = formData.get('steps')?.toString().split('\n')

    await fetch('/api/recipes', {
      method: 'POST',
      body: JSON.stringify({ title, steps }),
    })

    location.reload()
  }}
>
  <input name="title" placeholder="タイトル" />
  <textarea name="steps" placeholder="手順（改行で区切る）"></textarea>
  <button type="submit">追加</button>
</form>
{recipes.map((recipe: any) => (
  <div
    key={recipe.id}
    style={{
      marginBottom: '24px',
      padding: '16px',
      border: '1px solid #ccc',
      borderRadius: '8px',
    }}
  >
    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
      {recipe.title}
    </h2>

    <ul style={{ paddingLeft: '20px' }}>
      {recipe.steps.map((step: any) => (
        <li key={step.id}>{step.content}</li>
      ))}
    </ul>
  </div>
))}
</main>
) 
}