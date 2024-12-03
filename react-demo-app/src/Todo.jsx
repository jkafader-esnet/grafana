import { useState, useRef } from 'react';

export function Todo(){
    if(!localStorage.getItem("todos")){
        localStorage.setItem("todos", JSON.stringify([{done: false, hash: "klslj", content: 'Create To-Do Application'}]))
    }

    try {
        JSON.parse(localStorage.getItem("todos"))
    } catch(err) {
        console.error(err);
        localStorage.setItem("todos", JSON.stringify([{done: false, hash: "klslj", content: 'Create To-Do Application'}]))
    }

    let [todos, setTodos] = useState(JSON.parse(localStorage.getItem("todos")));
    const [inputVal, setInputVal] = useState("");
    const inputRef = useRef(null);

    function randHash(){
        return (Math.random() + 1).toString(36).substring(7)
    }

    function renderList(){
        return todos.map((todo, idx)=>{
            function toggleDone(idx){
                return ()=>{
                    todo.done = !todo.done;
                    todos[idx] = todo;
                    localStorage.setItem("todos", JSON.stringify(todos));
                    setTodos([...todos]);
                }
            }
            function deleteItem(idx){
                return ()=>{
                    let newTodos = [...todos];
                    newTodos.splice(idx, 1);
                    localStorage.setItem("todos", JSON.stringify(newTodos));
                    setTodos(JSON.parse(localStorage.getItem("todos")));
                }
            }
            return <div className={`item ${todo.done ? 'done' : ''}`} key={todo.hash} >
                <input type='checkbox' checked={todo.done} onChange={toggleDone(idx)} readOnly />&nbsp;
                <div className='item-label' onClick={toggleDone(idx)}>{todo.content}</div>
                { todo.done ? <div className='clear-item' onClick={deleteItem(idx)}>&times;</div> : null }
            </div> 
        });

    }

    function createTodo(ev){
        ev.preventDefault();
        todos.push({ hash: randHash(), done: false, content: inputRef.current.value });
        setInputVal("");
        localStorage.setItem("todos", JSON.stringify(todos));
        setTodos([...todos]);
    }

    function countDone(){
        return todos.filter((td)=>{return td.done}).length;
    }

    function countTodo(){
        return todos.length;
    }

    function allDone(){
        return countDone() == countTodo();
    }

    return <div className={`todo ${ allDone() ? "all-done" : "" }`}>
        <h2>{ allDone() ? "✅ " : "" }{countDone()}/{countTodo()} Done</h2>
        <form>
            <input type='text' ref={inputRef} value={inputVal} onChange={(ev)=>{ setInputVal(ev.target.value) }} placeholder='Enter a to-do item...' />
            <input type='submit' onClick={createTodo} value="Create To-Do" />
        </form>
        { renderList() }
    </div>
}