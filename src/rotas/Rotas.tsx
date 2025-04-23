import { Routes, Route } from "react-router"
import Home from "@/pages/Home"
import AdicionarEqp from "@/pages/AddEquipamentos"
import Teste from "@/pages/Teste"

function Rotas(){
    return(
        <>
            <Routes>
                < Route path="/" element={<Home/>} />
                <Route path="/adicionar-equipamentos" element={< AdicionarEqp/>} />
                <Route path="/teste" element={<Teste/>} />
            </Routes> 
        </>
    )
}

export default Rotas