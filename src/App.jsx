import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('completed', { ascending: true }) // pendentes primeiro
      .order('created_at', { ascending: false })

    if (!error) setTasks(data)
  }

  const addTask = async () => {
    if (!newTask.trim()) return

    setLoading(true)

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTask,
          user_id: user.id,
          deadline: deadline || null
        }
      ])

    setLoading(false)

    if (!error) {
      setNewTask('')
      setDeadline('')
      fetchTasks()
    }
  }

  const toggleTask = async (task) => {
    await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)

    fetchTasks()
  }

  const deleteTask = async (id) => {
    await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    fetchTasks()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          Taskfy
        </h1>

        <button
          onClick={handleLogout}
          className="text-sm text-red-500 font-medium active:scale-95 transition"
        >
          Sair
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-4 space-y-4">

        {/* Botão flutuante */}
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full text-3xl shadow-lg active:scale-95 transition"
        >
          +
        </button>

        {/* Formulário modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4">

            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">

              <h2 className="text-lg font-semibold text-center">
                Nova tarefa
              </h2>

              <input
                type="text"
                placeholder="Título"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              />

              <div className="flex gap-3">

                <button
                  onClick={() => {
                    setShowForm(false)
                    setNewTask('')
                    setDeadline('')
                  }}
                  className="w-full bg-gray-200 py-3 rounded-lg"
                >
                  Cancelar
                </button>

                <button
                  onClick={async () => {
                    await addTask()
                    setShowForm(false)
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* Lista de tarefas */}
        <div className="space-y-3">

          {tasks.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              Nenhuma tarefa ainda 👀
            </p>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl shadow p-4 flex justify-between items-center transition ${task.completed ? 'opacity-50' : ''
                }`}
            >
              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  className="w-5 h-5"
                />

                <div>
                  <p className={`${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </p>

                  {task.deadline && (
                    <p className="text-xs text-gray-500">
                      📅 {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 text-sm"
              >
                🗑
              </button>

            </div>
          ))}

        </div>

      </main>

    </div>
  )
}

export default App