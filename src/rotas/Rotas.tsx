import { Routes, Route } from "react-router"
import Home from "@/pages/Home"
import AdicionarEqp from "@/pages/AddEquipamentos"
import Teste from "@/pages/Teste"
import Concluido from "@/pages/Concluidos"
import Equipamentos from "@/pages/Equipamentos"

function Rotas(){
    return(
        <>
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/equipamentos" element={<Equipamentos />} />
                <Route path="/adicionar-equipamentos" element={< AdicionarEqp/>} />
                <Route path="/teste" element={<Teste/>} />
                <Route path="/vistoria-concluida" element={<Concluido />} />
            </Routes> 
        </>
    )
}

export default Rotas