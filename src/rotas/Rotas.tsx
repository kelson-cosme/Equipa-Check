import { Routes, Route } from "react-router"
import Home from "@/pages/Home"
import AdicionarEqp from "@/pages/AddEquipamentos"
import Calendario from "@/pages/Calendario"

function Rotas(){
    return(
        <>
            <Routes>
                < Route path="/" element={<Home/>} />
                <Route path="/adicionar-equipamentos" element={< AdicionarEqp/>} />
                <Route path="/calendario" element={< Calendario/>} />

            </Routes> 
        </>
    )
}

export default Rotas